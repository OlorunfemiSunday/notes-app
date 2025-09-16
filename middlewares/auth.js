const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header or x-auth-token header
    let token = req.header('Authorization');
    
    if (!token) {
      token = req.header('x-auth-token');
    }
    
    console.log('Auth header received:', token ? 'Token present' : 'No token');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Handle Bearer token format
    if (token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }
    
    console.log('Token extracted:', token.substring(0, 20) + '...');
    
    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET environment variable is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token successfully decoded for user:', decoded.userId);
    
    // Attach user info to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      ...decoded
    };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token format' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired. Please login again.' });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({ message: 'Token not active yet' });
    } else {
      return res.status(401).json({ message: 'Token verification failed' });
    }
  }
};

module.exports = authMiddleware;
