import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { Project } from '../models/Project';
import { TimeEntry } from '../models/TimeEntry';
import { Invoice } from '../models/Invoice';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, bio, avatar, industries } = req.body as { name?: string; bio?: string; avatar?: string; industries?: string[] };

    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Name is required.' } });
    }

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { name: name.trim(), bio: bio?.trim() ?? '', avatar: avatar?.trim() ?? '', industries: industries ?? [] },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');

    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found.' } });
    }

    logger.info(`Profile updated for user: ${req.user!._id}`);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings/password
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: { message: 'Both currentPassword and newPassword are required.' } });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: { message: 'New password must be at least 8 characters.' } });
    }

    const user = await User.findById(req.user!._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found.' } });
    }

    if (user.googleId && !user.password) {
      return res.status(400).json({ success: false, error: { message: 'Google OAuth accounts cannot set a password here. Use Google account settings.' } });
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ success: false, error: { message: 'Current password is incorrect.' } });
    }

    user.password = newPassword;
    user.refreshTokens = []; // Invalidate all existing sessions
    await user.save();

    logger.info(`Password changed for user: ${req.user!._id}`);
    res.status(200).json({ success: true, message: 'Password changed successfully. Please log in again.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/settings/account
export const deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user!._id;

    const { confirmation } = req.body as { confirmation?: string };
    if (confirmation !== 'DELETE') {
      return res.status(400).json({ success: false, error: { message: 'Please type DELETE to confirm account deletion.' } });
    }

    // Cascade delete all user data
    await Promise.all([
      Client.deleteMany({ userId }, { session }),
      Project.deleteMany({ userId }, { session }),
      TimeEntry.deleteMany({ userId }, { session }),
      Invoice.deleteMany({ userId }, { session }),
    ]);

    await User.findByIdAndDelete(userId, { session });

    await session.commitTransaction();
    logger.info(`Account permanently deleted for user: ${userId}`);

    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Account and all associated data have been permanently deleted.' });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
