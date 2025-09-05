const express = require('express');
const { body, validationResult } = require('express-validator');
const { signup, verifyOtp, login } = require('../controllers/authController');

const router = express.Router();

// Signup route
router.post('/signup', [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').isString().trim().notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  return signup(req, res);
});

// Verify OTP (optional)
router.post('/verify-otp', [
  body('email').isEmail(),
  body('otp').isLength({ min: 4, max: 6 })
], verifyOtp);

// Login
router.post('/login', [
  body('email').isEmail(),
  body('password').isString().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  return login(req, res);
});

module.exports = router;
