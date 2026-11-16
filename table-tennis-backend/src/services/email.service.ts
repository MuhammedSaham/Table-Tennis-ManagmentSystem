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
    lower.includes('example.com') ||
    lower.includes('your_brevo')
  );
};

// Check if email is configured with real non-placeholder credentials
export const isEmailConfigured = () => {
  if (process.env.BREVO_API_KEY && !isPlaceholder(process.env.BREVO_API_KEY)) {
    return true;
  }
  return Boolean(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    !isPlaceholder(process.env.EMAIL_USER) &&
    !isPlaceholder(process.env.EMAIL_PASS)
  );
};

// Create transporter only if traditional SMTP is configured (for local dev fallback)
let transporter: nodemailer.Transporter | null = null;

if (process.env.BREVO_API_KEY && !isPlaceholder(process.env.BREVO_API_KEY)) {
  console.log('✅ Email service ready — using Brevo Transactional REST API (Port 443 HTTPS)');
} else if (isEmailConfigured()) {
  const isSslPort = Number(process.env.EMAIL_PORT) === 465;
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: isSslPort,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '',
    },
  });

  transporter.verify((error) => {
    if (error) {
      console.error('❌ EMAIL SERVICE SMTP NOTICE:', error.message);
    } else {
      console.log('✅ Email service ready — using SMTP:', process.env.EMAIL_USER);
    }
  });
} else {
  console.log('\nℹ️ Email service in Development Mode (placeholder credentials).');
  console.log('💡 Verification and password reset links will be printed to the terminal console.\n');
}

/**
 * Universal email dispatcher:
 * - Uses Brevo REST API over HTTPS (Port 443) when BREVO_API_KEY is present (100% reliable on Render/Vercel)
 * - Falls back to Nodemailer SMTP when configured for local development
 */
async function sendEmail({
  to,
  recipientName,
  subject,
  html,
}: {
  to: string;
  recipientName?: string;
  subject: string;
  html: string;
}) {
  const senderEmail =
    process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@tabletennis.com';
  const senderName = process.env.EMAIL_FROM_NAME || "Sam's College TT";

  // 1. Preferred for Cloud: Brevo REST API (HTTPS port 443 - never blocked by cloud firewalls)
  if (process.env.BREVO_API_KEY && !isPlaceholder(process.env.BREVO_API_KEY)) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY.trim(),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to, name: recipientName || to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Brevo HTTP API returned status ${res.status}: ${errBody}`);
    }
    console.log(`✅ Email delivered to ${to} via Brevo REST API`);
    return;
  }

  // 2. Fallback: SMTP / Nodemailer (local development if configured)
  if (transporter) {
    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email delivered to ${to} via SMTP`);
  }
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

  if (isEmailConfigured()) {
    try {
      await sendEmail({
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
    } catch (error: any) {
      console.error('❌ Failed to dispatch password reset email, link printed above:', error?.message || error);
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

  if (isEmailConfigured()) {
    try {
      await sendEmail({
        to: email,
        recipientName: firstName,
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
    } catch (error: any) {
      console.error('❌ Failed to send verification email:', error?.message || error);

      throw new AppError(
        'Account created, but verification email could not be sent. Please try resending the verification email.',
        503
      );
    }
  }
};
