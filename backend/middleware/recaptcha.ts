import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const verifyRecaptcha = async (req: Request, res: Response, next: NextFunction) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey || process.env.NODE_ENV === 'test') {
    if (!secretKey && process.env.NODE_ENV !== 'test') {
      logger.warn('RECAPTCHA_SECRET_KEY is missing from environment variables. Skipping verification.');
    }
    return next();
  }

  const token = req.body.recaptchaToken;
  if (!token) {
    return res.status(400).json({
      success: false,
      error: { message: 'reCAPTCHA token is missing. Please complete the reCAPTCHA.' },
    });
  }

  try {
    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    
    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = (await response.json()) as { success: boolean; 'error-codes'?: string[] };

    if (!data.success) {
      logger.warn(`reCAPTCHA verification failed: ${data['error-codes']?.join(', ') || 'unknown error'}`);
      return res.status(400).json({
        success: false,
        error: { message: 'reCAPTCHA verification failed. Please try again.' },
      });
    }

    next();
  } catch (error) {
    logger.error(`Error during reCAPTCHA verification: ${(error as Error).message}`);
    return res.status(500).json({
      success: false,
      error: { message: 'Error verifying reCAPTCHA. Please try again.' },
    });
  }
};
