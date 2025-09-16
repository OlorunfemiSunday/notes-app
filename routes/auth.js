const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// Rate limiting for general auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increased for better UX
  message: {
    success: false,
    error: 'Too many authentication attempts',
    message: 'Please try again later',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/test';
  }
});

// Stricter rate limiting for sensitive operations
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Increased from 5 for better UX
  message: {
    success: false,
    error: 'Too many login/register attempts',
    message: 'Please try again in 15 minutes',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password change rate limiting
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Increased from 3
  message: {
    success: false,
    error: 'Too many password change attempts',
    message: 'Please try again in 1 hour',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all auth routes
router.use(authLimiter);

// Enhanced validation middleware with detailed logging
const validateRequest = (req, res, next) => {
  console.log('Validating request for:', req.path);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
        location: error.location
      }))
    });
  }
  console.log('Validation passed for:', req.path);
  next();
};

// Simplified register route for debugging
router.post('/register', strictAuthLimiter, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .bail(),
  body('password')
    .isLength({ min: 6 }) // Simplified to 6 characters for testing
    .withMessage('Password must be at least 6 characters long')
    .bail(),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10 })
    .withMessage('Phone number must be at least 10 digits')
], validateRequest, (req, res, next) => {
  console.log('Register route hit with data:', req.body);
  register(req, res, next);
});

// Login route
router.post('/login', strictAuthLimiter, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .bail(),
  body('password')
    .notEmpty()
    .trim()
    .withMessage('Password is required')
], validateRequest, (req, res, next) => {
  console.log('Login route hit with email:', req.body.email);
  login(req, res, next);
});

// Protected routes
router.get('/profile', authMiddleware, getProfile);

router.put('/profile', authMiddleware, [
  body('phone')
    .optional()
    .isLength({ min: 10 })
    .withMessage('Phone number must be at least 10 digits'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
], validateRequest, updateProfile);

router.put('/change-password', authMiddleware, passwordLimiter, [
  body('currentPassword')
    .notEmpty()
    .trim()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
], validateRequest, changePassword);

// Debug route to test validation
router.post('/debug-validation', [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password too short'),
  body('phone').notEmpty().withMessage('Phone required')
], (req, res) => {
  const errors = validationResult(req);
  res.json({
    success: errors.isEmpty(),
    body: req.body,
    errors: errors.array(),
    message: errors.isEmpty() ? 'Validation passed' : 'Validation failed'
  });
});

// Logout route
router.post('/logout', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'auth',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('Auth route error:', error);
  res.status(error.status || 500).json({
    success: false,
    message: 'Internal server error in auth routes',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router;
