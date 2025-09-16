const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    // Check if JWT_SECRET exists first (before processing token)
    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET environment variable is not defined');
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error - JWT_SECRET not set',
        error: 'Missing JWT_SECRET environment variable'
      });
    }

    // Get token from Authorization header or x-auth-token header
    let token = req.header('Authorization');
    
    if (!token) {
      token = req.header('x-auth-token');
    }
    
    console.log('Auth header received:', token ? 'Token present' : 'No token');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    // Handle Bearer token format
    if (token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }
    
    console.log('Token extracted:', token.substring(0, 20) + '...');
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token successfully decoded for user:', decoded.userId);
    
    // Validate decoded token structure
    if (!decoded.userId || !decoded.email) {
      console.error('Invalid token structure:', decoded);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token structure' 
      });
    }
    
    // Attach user info to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp,
      ...decoded
    };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    
    console.log('Auth middleware passed for user:', req.userId);
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    // Handle specific JWT errors with consistent response format
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format',
        error: 'JWT_MALFORMED'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token has expired. Please login again.',
        error: 'JWT_EXPIRED',
        expiredAt: error.expiredAt
      });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token not active yet',
        error: 'JWT_NOT_ACTIVE'
      });
    } else {
      return res.status(401).json({ 
        success: false,
        message: 'Token verification failed',
        error: 'JWT_VERIFICATION_FAILED'
      });
    }
  }
};

// Optional: Create a middleware to check if user exists in database
const authWithUserCheck = async (req, res, next) => {
  try {
    // First run the regular auth middleware
    await new Promise((resolve, reject) => {
      authMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Then check if user exists in database
    const User = require('../models/User');
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.',
        error: 'USER_NOT_FOUND'
      });
    }

    // Attach full user data to request
    req.userFromDB = user;
    next();

  } catch (error) {
    console.error('Auth with user check error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

module.exports = authMiddleware;
module.exports.authWithUserCheck = authWithUserCheck;
