import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

// Setup email transporter
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Fallback for tests or when SMTP config is omitted
  if (!host || !user || !pass) {
    logger.warn('SMTP configuration is missing. Emails will be logged to console instead.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // True for 465, false for others
    auth: {
      user,
      pass,
    },
  });
};

export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string
): Promise<void> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

  const subject = 'Verify your FreelanceFlow account';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
      <h2 style="color: #0f172a;">Welcome to FreelanceFlow, ${name}!</h2>
      <p style="color: #475569; font-size: 16px; line-height: 24px;">
        Thank you for signing up. Please click the button below to verify your email address and activate your account.
      </p>
      <div style="margin: 24px 0;">
        <a href="${verificationUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 14px;">
        If you didn't create an account, you can safely ignore this email.
      </p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; word-break: break-all;">
        Link: <a href="${verificationUrl}" style="color: #3b82f6;">${verificationUrl}</a>
      </p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    logger.info(`[MAIL MOCK] Verification email to ${email}. Token: ${token}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"FreelanceFlow Support" <no-reply@freelanceflow.app>`,
      to: email,
      subject,
      html,
    });
    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error(`Error sending verification email to ${email}: ${(error as Error).message}`);
    throw new Error('Failed to send verification email');
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  token: string
): Promise<void> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  const subject = 'Reset your FreelanceFlow password';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
      <h2 style="color: #0f172a;">Password Reset Request</h2>
      <p style="color: #475569; font-size: 16px; line-height: 24px;">
        Hello ${name}, we received a request to reset your FreelanceFlow password. Click the button below to set a new password. This link is valid for 1 hour.
      </p>
      <div style="margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 14px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; word-break: break-all;">
        Link: <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a>
      </p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    logger.info(`[MAIL MOCK] Password reset email to ${email}. Token: ${token}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"FreelanceFlow Support" <no-reply@freelanceflow.app>`,
      to: email,
      subject,
      html,
    });
    logger.info(`Password reset email sent to ${email}`);
  } catch (error) {
    logger.error(`Error sending password reset email to ${email}: ${(error as Error).message}`);
    throw new Error('Failed to send password reset email');
  }
};

export const sendInvoiceCreatedEmail = async (
  email: string,
  clientName: string,
  invoiceNumber: string,
  total: number,
  dueDate: string
): Promise<void> => {
  const subject = `New Invoice ${invoiceNumber} from FreelanceFlow`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
      <h2 style="color: #0f172a;">Hello ${clientName},</h2>
      <p style="color: #475569; font-size: 16px; line-height: 24px;">
        A new invoice (<strong>${invoiceNumber}</strong>) has been created for your account.
      </p>
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 24px 0;">
        <p style="margin: 0; color: #475569;"><strong>Total Due:</strong> $${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p style="margin: 8px 0 0 0; color: #475569;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
      </div>
      <p style="color: #94a3b8; font-size: 14px;">
        Please arrange for payment by the due date. Let us know if you have any questions!
      </p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    logger.info(`[MAIL MOCK] Invoice created email to ${email}. Invoice: ${invoiceNumber}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"FreelanceFlow Invoicing" <invoices@freelanceflow.app>`,
      to: email,
      subject,
      html,
    });
    logger.info(`Invoice created email sent to ${email} (${invoiceNumber})`);
  } catch (error) {
    logger.error(`Error sending invoice email to ${email}: ${(error as Error).message}`);
  }
};

export const sendInvoiceOverdueEmail = async (
  email: string,
  clientName: string,
  invoiceNumber: string,
  total: number,
  daysOverdue: number
): Promise<void> => {
  const subject = `URGENT: Invoice ${invoiceNumber} is Overdue`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fecaca; rounded-lg: 8px; border-top: 4px solid #ef4444;">
      <h2 style="color: #b91c1c;">Hello ${clientName},</h2>
      <p style="color: #475569; font-size: 16px; line-height: 24px;">
        This is a reminder that invoice <strong>${invoiceNumber}</strong> is currently <strong>${daysOverdue} days overdue</strong>.
      </p>
      <div style="background-color: #fef2f2; padding: 16px; border-radius: 6px; margin: 24px 0;">
        <p style="margin: 0; color: #991b1b; font-weight: bold;">Outstanding Balance: $${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      <p style="color: #475569; font-size: 14px;">
        Please arrange for immediate payment. If you have already sent payment, please disregard this notice.
      </p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    logger.info(`[MAIL MOCK] Invoice overdue email to ${email}. Invoice: ${invoiceNumber}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"FreelanceFlow Billing" <billing@freelanceflow.app>`,
      to: email,
      subject,
      html,
    });
    logger.info(`Invoice overdue email sent to ${email} (${invoiceNumber})`);
  } catch (error) {
    logger.error(`Error sending overdue invoice email to ${email}: ${(error as Error).message}`);
  }
};
