import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { AppError } from '../utils/AppError';

// Check if email is configured
const isEmailConfigured = () => {
  return process.env.EMAIL_HOST && 
         process.env.EMAIL_USER && 
         process.env.EMAIL_PASS && 
         process.env.EMAIL_USER !== 'your-email@gmail.com';
};

// Create transporter only if email is configured
let transporter: nodemailer.Transporter | null = null;

if (isEmailConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}
// Verify connection on startup
if (transporter) {
  transporter.verify((error) => {
    if (error) {
      console.error('❌ Email service error:', error.message);
      console.log('💡 Check EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env');
    } else {
      console.log('✅ Email service ready — using', process.env.EMAIL_USER);
    }
  });
}

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  if (!transporter || !isEmailConfigured()) {
    throw new AppError(
      'Password reset email service is not configured. Please contact an administrator.',
      503,
    );
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@tabletennis.com',
    to: email,
    subject: 'Password Reset Request - Table Tennis Tournament System',
    html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0284c7;">Password Reset Request</h2>
            <p>You requested to reset your password for your Table Tennis Tournament System account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
              Reset Password
            </a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr />
            <p style="font-size: 12px; color: #666;">Table Tennis Tournament Management System</p>
          </div>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    throw new AppError(
      'Unable to send password reset email. Please try again later.',
      503,
    );
  }
};
export const sendVerificationEmail = async (email: string, token: string, firstName: string) => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  // Always log for development
  console.log('\n' + '='.repeat(70));
  console.log('📧 EMAIL VERIFICATION');
  console.log('='.repeat(70));
  console.log(`To: ${email}`);
  console.log(`Verify Link: ${verifyUrl}`);
  console.log('='.repeat(70) + '\n');

  if (transporter && isEmailConfigured()) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@tabletennis.com',
        to: email,
        subject: 'Verify your email — Table Tennis Tournament',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="text-align:center;margin-bottom:24px;">
              <h1 style="color:#0f172a;font-size:28px;margin:0;">🏓 Table Tennis Tournament</h1>
            </div>
            <div style="background:#f8fafc;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
              <h2 style="color:#0f172a;margin:0 0 12px;">Hi ${firstName}! Verify your email</h2>
              <p style="color:#475569;font-size:15px;line-height:1.6;">
                Thanks for registering. Please verify your email address to activate your account.
              </p>
              <div style="text-align:center;margin:28px 0;">
                <a href="${verifyUrl}"
                   style="background:#0f172a;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
                  ✅ Verify Email Address
                </a>
              </div>
              <p style="color:#94a3b8;font-size:13px;text-align:center;">
                This link expires in 24 hours. If you didn't register, ignore this email.
              </p>
            </div>
          </div>
        `,
      });
      console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
    }
  }
};