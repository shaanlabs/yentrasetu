const jwt = require('jsonwebtoken');
const { User } = require('../models');

// In production, JWT secrets MUST be set via environment variables
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required in production');
}

const JWT_SECRET = process.env.JWT_SECRET || 'yantrasetu-dev-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (JWT_SECRET + '-refresh');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId, type: 'access' }, JWT_SECRET, { expiresIn: '7d' });
};

// Generate refresh token (uses separate secret)
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
};

// Verify JWT token (access)
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Verify refresh token (uses separate secret)
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password', 'otpCode'] }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Account has been banned.', reason: user.banReason });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication error.' });
  }
};

// Optional authentication (for public routes that can show more info to logged-in users)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      req.user = null;
      return next();
    }

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password', 'otpCode'] }
    });

    if (user && user.isActive && !user.isBanned) {
      req.user = user;
      req.userId = user.id;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (req.user.userType !== 'admin' && req.user.userType !== 'super_admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  next();
};

// Dealer authorization middleware
const requireDealer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (req.user.userType !== 'dealer' && req.user.userType !== 'company') {
    return res.status(403).json({ message: 'Dealer access required.' });
  }

  next();
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  authenticate,
  optionalAuth,
  requireAdmin,
  requireDealer
};
