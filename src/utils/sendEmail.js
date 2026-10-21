// server/src/utils/sendEmail.js
import nodemailer from 'nodemailer';

export const sendEmail = async ({ subject, html }) => {
  try {
    // 1. Check if credentials exist before trying
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ Email skipped: EMAIL_USER or EMAIL_PASS is missing in env vars.');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // 2. Add a timeout so it doesn't hang Vercel's serverless function
      connectionTimeout: 5000, // 5 seconds
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });

    const mailOptions = {
      from: `"ISDL Notifications" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    // 3. Log the error but do NOT crash the server
    console.error('❌ Error sending email (ignored):', error.message);
  }
};