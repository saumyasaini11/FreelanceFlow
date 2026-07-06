import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const generateAccessToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is missing from environment variables');
  }
  return jwt.sign({ userId }, secret, { expiresIn: '15m' });
};

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is missing from environment variables');
  }
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authorized, token missing' },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not found with this token' },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn(`Auth token verification failed: ${(error as Error).message}`);
    return res.status(401).json({
      success: false,
      error: { message: 'Not authorized, token invalid or expired' },
    });
  }
};
