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
  trustProxy: true, // Add this for proxy support
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
  trustProxy: true,
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
  trustProxy: true,
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

// Flexible phone validation helper
const phoneValidation = body('phone')
  .notEmpty()
  .withMessage('Phone number is required')
  .isLength({ min: 8 }) // Reduced to 8 for more flexibility
  .withMessage('Phone number must be at least 8 characters')
  .matches(/^[\+]?[0-9\s\-\(\)]+$/)
  .withMessage('Phone number contains invalid characters');

// Register route with flexible validation
router.post('/register', strictAuthLimiter, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .bail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .bail(),
  phoneValidation
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
router.get('/profile', authMiddleware, (req, res, next) => {
  console.log('Profile route hit for user:', req.userId);
  getProfile(req, res, next);
});

router.put('/profile', authMiddleware, [
  body('phone')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Phone number must be at least 8 characters')
    .matches(/^[\+]?[0-9\s\-\(\)]+$/)
    .withMessage('Phone number contains invalid characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
], validateRequest, (req, res, next) => {
  console.log('Profile update route hit for user:', req.userId);
  updateProfile(req, res, next);
});

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
], validateRequest, (req, res, next) => {
  console.log('Password change route hit for user:', req.userId);
  changePassword(req, res, next);
});

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

// Verify token route
router.get('/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: {
      id: req.userId,
      email: req.userEmail
    }
  });
});

// Logout route
router.post('/logout', authMiddleware, (req, res) => {
  console.log('Logout route hit for user:', req.userId);
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
    environment: process.env.NODE_ENV || 'development',
    routes: [
      'POST /register',
      'POST /login',
      'GET /profile',
      'PUT /profile',
      'PUT /change-password',
      'POST /logout',
      'GET /verify'
    ]
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'auth',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Get all users route (for debugging - remove in production)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find({}).select('-password').limit(10);
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('Auth route error:', error);
  
  // Handle rate limit errors gracefully
  if (error.code === 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR') {
    console.log('Rate limit proxy warning - continuing...');
    return next();
  }
  
  res.status(error.status || 500).json({
    success: false,
    message: 'Internal server error in auth routes',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
