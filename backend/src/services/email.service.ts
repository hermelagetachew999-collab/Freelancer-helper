import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationCode(email: string, code: string) {
  const isMock = !process.env.SMTP_USER || process.env.SMTP_USER.includes('your_email');

  if (isMock) {
    console.log(`\n📧 [MOCK EMAIL] To: ${email}\nSubject: Password Reset Code\nBody: Your verification code is ${code}\n`);
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Freelancer-Helper" <noreply@freelancer-helper.com>',
    to: email,
    subject: 'Your Password Reset Verification Code',
    text: `Your verification code is: ${code}\n\nThis code will expire in 15 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #2563eb;">Password Reset Verification</h2>
        <p>You requested a password reset for your Freelancer-Helper account.</p>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #6b7280;">Freelancer-Helper AI - Freelance Mastery Coach</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    // Even if it fails, we log the code for debugging, but we throw or return false
    console.log(`🔑 FALLBACK CODE: ${code}`);
    return false;
  }
}
