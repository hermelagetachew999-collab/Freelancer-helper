import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });

async function test() {
  console.log('🧪 Testing Email SMTP Configuration...');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    console.log('⏳ Verifying transporter...');
    await transporter.verify();
    console.log('✅ Transporter is ready to take our messages');

    console.log('⏳ Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to self
      subject: 'ProposalWin - SMTP Diagnostic Test',
      text: 'If you see this, your SMTP configuration is working correctly!',
    });
    console.log('✅ Test email sent:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP Test Failed:', error);
  }
}

test();
