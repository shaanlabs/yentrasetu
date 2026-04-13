const rateLimit = require('express-rate-limit');

/**
 * Granular rate limiters for different route categories.
 * Override limits via environment variables for development/testing.
 */

// Auth routes: strict limits to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH || '10', 10),
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

// OTP: even stricter
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: parseInt(process.env.RATE_LIMIT_OTP || '5', 10),
  message: { message: 'Too many OTP requests. Please wait 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Listing creation: prevent spam listings
const listingCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_LISTING || '15', 10),
  message: { message: 'Listing creation limit reached. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat messages: allow reasonable conversation flow
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_CHAT || '60', 10),
  message: { message: 'Message rate limit reached. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Reviews: prevent review bombing
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_REVIEW || '10', 10),
  message: { message: 'Review limit reached. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: global fallback
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_GENERAL || '200', 10),
  message: { message: 'Too many requests from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin routes: moderate limits
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_ADMIN || '100', 10),
  message: { message: 'Admin rate limit reached.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  otpLimiter,
  listingCreateLimiter,
  chatLimiter,
  reviewLimiter,
  generalLimiter,
  adminLimiter,
};
