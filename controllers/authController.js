const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendOtpEmail } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set in environment variables.');
}

exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    // check if user exists
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });
    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    // create OTP (optional) - 4 digit
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpires = new Date(Date.now() + 10*60*1000); // 10 minutes

    const user = new User({
      name, email, phone, password: hashed,
      otp: { code: otpCode, expiresAt: otpExpires },
      isVerified: false
    });
    await user.save();

    // try to send email (if SMTP configured)
    try {
      await sendOtpEmail({ to: email, name, otp: otpCode });
    } catch (err) {
      console.warn('Failed to send OTP email:', err.message);
    }

    return res.status(201).json({ message: 'User created. OTP sent to email if configured. Verify using /api/auth/verify-otp', email });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.otp || !user.otp.code) return res.status(400).json({ message: 'No OTP present. Request signup again.' });

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }
    if (user.otp.code !== String(otp)) return res.status(400).json({ message: 'Invalid OTP' });

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    // optionally ensure verified
    // if (!user.isVerified) return res.status(403).json({ message: 'Email not verified' });

    const payload = { id: user._id, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
