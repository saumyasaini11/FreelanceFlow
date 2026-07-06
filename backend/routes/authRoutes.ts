import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  getMe,
  googleLogin,
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { verifyRecaptcha } from '../middleware/recaptcha';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
  },
});

// Public / Guest Auth Routes
router.post('/register', authLimiter, verifyRecaptcha, register);
router.get('/verify-email', verifyEmail);
router.post('/login', authLimiter, verifyRecaptcha, login);
router.post('/google', googleLogin);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, verifyRecaptcha, forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected Auth Routes
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);

export default router;
