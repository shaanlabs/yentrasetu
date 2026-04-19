const { MachineryListing, FraudReport } = require('../models');
const { Op } = require('sequelize');
const { iLikeFilter } = require('../config/dbHelpers');

/**
 * Anti-spam middleware suite for preventing abuse.
 */

// Spam patterns to detect
const SUSPICIOUS_PATTERNS = [
  /(\+?\d[\d\-\s]{8,}\d)/g,               // Phone numbers in text
  /(https?:\/\/[^\s]+)/gi,                  // URLs in descriptions
  /(.)\1{6,}/g,                             // Repeated characters (aaaaaaa)
  /[A-Z\s]{20,}/g,                          // All caps blocks
  /(whatsapp|telegram|call me|contact)/gi,   // Contact solicitation
  /(free|guaranteed|urgent|act now)/gi,       // Spam trigger words
];

/**
 * Check if listing content looks spammy.
 * Returns { isSpam: boolean, reasons: string[] }
 */
function analyzeContent(text) {
  if (!text || typeof text !== 'string') return { isSpam: false, reasons: [] };
  
  const reasons = [];
  
  // Check for phone numbers in description (should use platform messaging)
  const phoneMatches = text.match(/(\+?\d[\d\-\s]{8,}\d)/g);
  if (phoneMatches && phoneMatches.length >= 2) {
    reasons.push('Multiple phone numbers in content');
  }
  
  // Check for URLs (external links)
  const urlMatches = text.match(/(https?:\/\/[^\s]+)/gi);
  if (urlMatches && urlMatches.length >= 2) {
    reasons.push('Multiple external URLs in content');
  }
  
  // Excessive caps
  const upperCount = (text.match(/[A-Z]/g) || []).length;
  const totalLetters = (text.match(/[a-zA-Z]/g) || []).length;
  if (totalLetters > 20 && upperCount / totalLetters > 0.7) {
    reasons.push('Excessive use of capital letters');
  }
  
  // Very short or gibberish (under 10 chars for a description)
  if (text.length > 0 && text.length < 10) {
    reasons.push('Content too short to be meaningful');
  }
  
  return { isSpam: reasons.length >= 2, reasons };
}

/**
 * Middleware: Detect duplicate listings (same make+model+price by same user within 24h)
 */
const detectDuplicateListings = async (req, res, next) => {
  try {
    if (!req.userId || !req.body.make || !req.body.model) return next();
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const duplicate = await MachineryListing.findOne({
      where: {
        userId: req.userId,
        make: iLikeFilter(req.body.make),
        model: iLikeFilter(req.body.model),
        createdAt: { [Op.gte]: twentyFourHoursAgo },
        status: { [Op.ne]: 'rejected' },
      }
    });
    
    if (duplicate) {
      return res.status(429).json({
        message: 'A similar listing was already created in the last 24 hours. Please edit the existing one instead.',
        existingListingId: duplicate.id,
      });
    }
    
    next();
  } catch (err) {
    console.error('Duplicate detection error:', err.message);
    next(); // Don't block on detection errors
  }
};

/**
 * Middleware: Analyze listing content for spam signals
 */
const analyzeListingContent = (req, res, next) => {
  try {
    const description = req.body.description || '';
    const analysis = analyzeContent(description);
    
    if (analysis.isSpam) {
      // Don't block, but flag
      req.spamFlags = analysis.reasons;
      console.warn(`⚠️ Spam signals detected for user ${req.userId}:`, analysis.reasons);
    }
    
    next();
  } catch (err) {
    next();
  }
};

/**
 * Middleware: Check if user account is suspicious (3+ fraud reports against them)
 */
const checkSuspiciousAccount = async (req, res, next) => {
  try {
    if (!req.userId) return next();
    
    const reportCount = await FraudReport.count({
      where: {
        targetId: req.userId,
        targetType: 'user',
        status: { [Op.ne]: 'dismissed' },
      }
    });
    
    if (reportCount >= 3) {
      req.isSuspiciousAccount = true;
      console.warn(`⚠️ Suspicious account ${req.userId}: ${reportCount} fraud reports`);
    }
    
    next();
  } catch (err) {
    next();
  }
};

module.exports = {
  analyzeContent,
  detectDuplicateListings,
  analyzeListingContent,
  checkSuspiciousAccount,
};
