import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../validators/auth';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/mailService';
import { generateAccessToken, generateRefreshToken, AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: parseResult.error.issues[0]?.message || 'Invalid input' },
      });
    }

    const { name, email, password, industries } = parseResult.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { message: 'A user with this email address already exists' },
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = new User({
      name,
      email,
      password,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      industries: industries || [],
    });

    await user.save();
    logger.info(`User registered: ${user._id} (${user.email})`);

    // Dispatches verification email asynchronously (so registration doesn't block)
    sendVerificationEmail(user.email, user.name, verificationToken).catch((err) => {
      logger.error(`Error sending email to ${user.email} post-registration: ${err.message}`);
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Verification token is required' },
      });
    }

    // Must explicitly select emailVerificationToken since it is marked select: false
    const user = await User.findOne({ emailVerificationToken: token }).select('+emailVerificationToken');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid or expired verification token' },
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    logger.info(`User email verified: ${user._id}`);
    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: parseResult.error.issues[0]?.message || 'Invalid input' },
      });
    }

    const { email, password } = parseResult.data;

    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' },
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' },
      });
    }

    const accessToken = generateAccessToken(user._id.toString() as string);
    const refreshToken = generateRefreshToken(user._id.toString() as string);

    // Save refresh token to user
    user.refreshTokens.push(refreshToken);
    await user.save();

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info(`User logged in: ${user._id}`);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Refresh token is missing' },
      });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || '');
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: { message: 'Refresh token is invalid or expired' },
      });
    }

    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(token)) {
      // Reuse detection: If token isn't in user's list but verified, clear everything (potential theft)
      if (user) {
        user.refreshTokens = [];
        await user.save();
      }
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        error: { message: 'Token reuse detected or invalid session' },
      });
    }

    // Rotate tokens
    const newAccessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    // Set cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const decoded: any = jwt.decode(token);
      if (decoded && decoded.userId) {
        const user = await User.findById(decoded.userId).select('+refreshTokens');
        if (user) {
          user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
          await user.save();
        }
      }
    }

    res.clearCookie('refreshToken');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: parseResult.error.issues[0]?.message || 'Invalid input' },
      });
    }

    const { email } = parseResult.data;

    const user = await User.findOne({ email });
    // Preventing email enumeration: return success even if user not found, but don't send mail
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account matches that email, a password reset link has been sent.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    sendPasswordResetEmail(user.email, user.name, resetToken).catch((err) => {
      logger.error(`Error sending password reset email: ${err.message}`);
    });

    res.status(200).json({
      success: true,
      message: 'If an account matches that email, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: parseResult.error.issues[0]?.message || 'Invalid input' },
      });
    }

    const { password } = parseResult.data;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: { message: 'Reset token is invalid or has expired' },
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // Revokes all active sessions on password change
    await user.save();

    logger.info(`User reset password: ${user._id}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: parseResult.error.issues[0]?.message || 'Invalid input' },
      });
    }

    const { oldPassword, newPassword } = parseResult.data;

    const user = await User.findById(req.user!._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: { message: 'Incorrect old password' },
      });
    }

    user.password = newPassword;
    user.refreshTokens = []; // Reset other devices session
    await user.save();

    logger.info(`User changed password: ${user._id}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: parseResult.error.issues[0]?.message || 'Invalid input' },
      });
    }

    const { name, avatar, bio, industries } = parseResult.data;

    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;
    if (industries !== undefined) user.industries = industries;

    await user.save();
    logger.info(`User updated profile: ${user._id}`);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        bio: user.bio,
        industries: user.industries,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user!._id,
        name: req.user!.name,
        email: req.user!.email,
        isEmailVerified: req.user!.isEmailVerified,
        avatar: req.user!.avatar,
        bio: req.user!.bio,
        industries: req.user!.industries,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: { message: 'Google credential ID token is required' },
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid Google token payload' },
      });
    }

    const { email, name, sub: googleId, picture: avatar } = payload;

    let user = await User.findOne({ email }).select('+refreshTokens');

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }
      await user.save();
    } else {
      user = new User({
        name: name || 'Google User',
        email,
        googleId,
        isEmailVerified: true,
        avatar: avatar || '',
      });
      await user.save();
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info(`User logged in via Google: ${user._id}`);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    logger.error(`Google sign-in error: ${(error as Error).message}`);
    res.status(400).json({
      success: false,
      error: { message: 'Google authentication failed. Please try again.' },
    });
  }
};
