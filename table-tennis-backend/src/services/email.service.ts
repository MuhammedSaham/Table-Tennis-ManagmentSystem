import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { AppError } from '../utils/AppError';

// Check if a string is a placeholder or empty
const isPlaceholder = (val?: string) => {
  if (!val) return true;
  const lower = val.toLowerCase().trim();
  return (
    lower === '' ||
    lower.includes('your-email') ||
    lower.includes('your-gmail') ||
    lower.includes('your-16-character') ||
    lower.includes('example.com')
  );
};

// Check if email is configured with real non-placeholder credentials
export const isEmailConfigured = () => {
  return Boolean(
    process.env.EMAIL_HOST && 
    process.env.EMAIL_USER && 
    process.env.EMAIL_PASS && 
    !isPlaceholder(process.env.EMAIL_USER) &&
    !isPlaceholder(process.env.EMAIL_PASS)
  );
};

// Create transporter only if email is configured
let transporter: nodemailer.Transporter | null = null;
let isSmtpVerified = false;

if (isEmailConfigured()) {
  const isSslPort = Number(process.env.EMAIL_PORT) === 465;
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: isSslPort,
    auth: {
      user: process.env.EMAIL_USER,
      // Strip any whitespace from copy-pasting the 16-character Google App Password
      pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '',
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Verify connection on startup
  transporter.verify((error) => {
    if (error) {
      isSmtpVerified = false;
      console.error('\n' + '='.repeat(70));
      console.error('❌ EMAIL SERVICE SMTP ERROR:');
      console.error(`Reason: ${error.message}`);
      console.error('\n💡 Why this happens with Gmail (Error 535):');
      console.error('   Google does NOT allow your regular Gmail password for SMTP.');
      console.error('   You must use a 16-character Google App Password:');
      console.error('   1. Go to https://myaccount.google.com/security');
      console.error('   2. Ensure "2-Step Verification" is ON');
      console.error('   3. Go to https://myaccount.google.com/apppasswords');
      console.error('   4. Generate an app password (e.g. name it "TableTennis")');
      console.error('   5. Paste the 16 letters into EMAIL_PASS in table-tennis-backend/.env');
      console.error('\n⚠️ App will continue running: verification & reset links are logged to console.');
      console.error('='.repeat(70) + '\n');
    } else {
      isSmtpVerified = true;
      console.log('✅ Email service ready — using', process.env.EMAIL_USER);
    }
  });
} else {
  console.log('\nℹ️ Email service in Development Mode (placeholder credentials in .env).');
  console.log('💡 Verification and password reset links will be printed to the terminal console.');
  console.log('💡 To send real Gmail emails, set EMAIL_USER and a 16-char App Password in .env\n');
}

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  // Always log for development
  console.log('\n' + '='.repeat(70));
  console.log('🔑 PASSWORD RESET REQUEST');
  console.log('='.repeat(70));
  console.log(`To: ${email}`);
  console.log(`Reset Link: ${resetUrl}`);
  console.log('='.repeat(70) + '\n');

  if (transporter && isEmailConfigured()) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@tabletennis.com',
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
      });
      console.log(`✅ Password reset email sent successfully to ${email}`);
    } catch (error) {
      console.error('❌ Failed to dispatch password reset email via SMTP, link printed above:', error);
    }
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
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@tabletennis.com',
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
      console.error('❌ Failed to dispatch verification email via SMTP, link printed above:', error);
    }
  }
};