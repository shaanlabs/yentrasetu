/**
 * Input sanitization middleware for XSS prevention and input validation.
 * Strips dangerous HTML/script content from all string fields in request body.
 */

// Strip HTML tags and script content
function stripHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove style tags
    .replace(/<[^>]*>/g, '')                                            // Remove all HTML tags
    .replace(/javascript:/gi, '')                                       // Remove javascript: URIs
    .replace(/on\w+\s*=/gi, '')                                         // Remove event handlers
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');                      // Decode basic entities
}

// Field-specific max lengths
const FIELD_LIMITS = {
  firstName: 100,
  lastName: 100,
  email: 255,
  phone: 15,
  companyName: 255,
  gstNumber: 50,
  address: 500,
  city: 100,
  state: 100,
  pincode: 10,
  make: 100,
  model: 100,
  description: 5000,
  title: 255,
  content: 2000,
  reason: 1000,
  adminNotes: 2000,
  response: 2000,
  documentName: 255,
  documentNumber: 100,
  issuingAuthority: 255,
  resolution: 2000,
};

/**
 * Recursively sanitize all string values in an object.
 */
function sanitizeObject(obj, depth = 0) {
  if (depth > 5) return obj; // Prevent infinite recursion
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return stripHtml(obj).trim();
  if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item, depth + 1));
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      let sanitizedValue = sanitizeObject(value, depth + 1);
      
      // Enforce field length limits
      if (typeof sanitizedValue === 'string' && FIELD_LIMITS[key]) {
        sanitizedValue = sanitizedValue.slice(0, FIELD_LIMITS[key]);
      }
      
      sanitized[key] = sanitizedValue;
    }
    return sanitized;
  }
  return obj;
}

/**
 * Express middleware: sanitize request body.
 */
const sanitizeInput = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      // Don't sanitize password fields or base64 image data
      const { password, currentPassword, newPassword, profileImage, images, documentImage, ...rest } = req.body;
      
      const sanitized = sanitizeObject(rest);
      
      // Re-attach unsanitized fields
      req.body = {
        ...sanitized,
        ...(password !== undefined && { password }),
        ...(currentPassword !== undefined && { currentPassword }),
        ...(newPassword !== undefined && { newPassword }),
        ...(profileImage !== undefined && { profileImage }),
        ...(images !== undefined && { images }),
        ...(documentImage !== undefined && { documentImage }),
      };
    }
    next();
  } catch (err) {
    console.error('Input sanitization error:', err.message);
    next(); // Don't block on sanitization errors
  }
};

/**
 * Validate that the request body doesn't exceed a max size (in bytes).
 */
const validateBodySize = (maxBytes = 512 * 1024) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > maxBytes) {
      return res.status(413).json({ message: `Request body too large. Maximum ${Math.round(maxBytes / 1024)}KB allowed.` });
    }
    next();
  };
};

module.exports = {
  stripHtml,
  sanitizeInput,
  sanitizeObject,
  validateBodySize,
  FIELD_LIMITS,
};
