const nodemailer = require('nodemailer');

const isConfigured = Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);

const transporter = isConfigured ? nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
}) : null;

exports.sendOtpEmail = async ({ to, name, otp }) => {
  if (!isConfigured) {
    // fallback: log to console for development
    console.log('EMAIL NOT CONFIGURED - OTP for', to, 'is', otp);
    return;
  }
  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.EMAIL_USER,
    to,
    subject: 'Your verification code',
    text: `Hello ${name},\n\nYour verification code is: ${otp}\n\nIt will expire in 10 minutes.`,
    html: `<p>Hello ${name},</p><p>Your verification code is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`
  });
  return info;
};
