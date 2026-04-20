const express = require('express');
const router = express.Router();

const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const { authLimiter, otpLimiter, listingCreateLimiter, chatLimiter, reviewLimiter } = require('../middleware/rateLimiter');
const { detectDuplicateListings, analyzeListingContent, checkSuspiciousAccount } = require('../middleware/spamDetector');
const authController = require('../controllers/authController');
const machineryController = require('../controllers/machineryController');

// Auth routes (with rate limiting)
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/send-otp', otpLimiter, authController.sendOTP);
router.post('/auth/verify-otp', otpLimiter, authController.verifyOTP);
router.post('/auth/refresh-token', authController.refreshToken);
router.get('/auth/me', authenticate, authController.getMe);
router.put('/auth/profile', authenticate, authController.updateProfile);
router.put('/auth/change-password', authenticate, authController.changePassword);

// Machinery Listing routes (with spam detection on create)
router.post('/machinery', authenticate, listingCreateLimiter, detectDuplicateListings, analyzeListingContent, checkSuspiciousAccount, machineryController.createListing);
router.get('/machinery', optionalAuth, machineryController.getListings);
router.get('/machinery/categories', machineryController.getCategories);
router.get('/machinery/my-listings', authenticate, machineryController.getMyListings);
router.get('/machinery/:id', optionalAuth, machineryController.getListing);
router.put('/machinery/:id', authenticate, analyzeListingContent, machineryController.updateListing);
router.delete('/machinery/:id', authenticate, machineryController.deleteListing);
router.put('/machinery/:id/mark-sold', authenticate, machineryController.markAsSold);
router.put('/machinery/:id/renew', authenticate, machineryController.renewListing);

const partsController = require('../controllers/partsController');
const operatorController = require('../controllers/operatorController');
const mechanicController = require('../controllers/mechanicController');
const reviewController = require('../controllers/reviewController');
const bookingController = require('../controllers/bookingController');
const chatController = require('../controllers/chatController');
const adminController = require('../controllers/adminController');

// Parts routes
router.post('/parts', authenticate, listingCreateLimiter, partsController.createPart);
router.get('/parts', partsController.getParts);
router.get('/parts/my-parts', authenticate, partsController.getMyParts);
router.get('/parts/:id', partsController.getPart);
router.delete('/parts/:id', authenticate, partsController.deletePart);

// Operator routes
router.post('/operators/profile', authenticate, operatorController.createOrUpdateProfile);
router.get('/operators', operatorController.getOperators);
router.get('/operators/my-profile', authenticate, operatorController.getMyProfile);
router.get('/operators/:id', operatorController.getOperator);

// Mechanic routes
router.post('/mechanics/profile', authenticate, mechanicController.createOrUpdateProfile);
router.get('/mechanics', mechanicController.getMechanics);
router.get('/mechanics/my-profile', authenticate, mechanicController.getMyProfile);
router.get('/mechanics/:id', mechanicController.getMechanic);

// Review routes (with rate limiting)
router.post('/reviews', authenticate, reviewLimiter, reviewController.createReview);
router.get('/reviews', reviewController.getReviews);
router.put('/reviews/:id/respond', authenticate, reviewController.respondToReview);

// Booking routes
router.post('/bookings', authenticate, bookingController.createBooking);
router.get('/bookings', authenticate, bookingController.getMyBookings);
router.put('/bookings/:id/status', authenticate, bookingController.updateBookingStatus);
router.get('/bookings/availability/:listingId', bookingController.getAvailability);

// Chat routes (with rate limiting on send)
router.post('/chats', authenticate, chatController.startOrGetChat);
router.get('/chats', authenticate, chatController.getMyChats);
router.get('/chats/:chatId/messages', authenticate, chatController.getMessages);
router.post('/chats/:chatId/messages', authenticate, chatLimiter, chatController.sendMessage);

// ─── Admin routes (require admin role) ─────────────────
router.get('/admin/dashboard', authenticate, requireAdmin, adminController.getDashboard);
router.get('/admin/pending-listings', authenticate, requireAdmin, adminController.getPendingListings);
router.get('/admin/listings', authenticate, requireAdmin, adminController.getAllListings);
router.put('/admin/listings/:id/approve', authenticate, requireAdmin, adminController.approveListing);
router.put('/admin/listings/:id/reject', authenticate, requireAdmin, adminController.rejectListing);
router.put('/admin/listings/:id/feature', authenticate, requireAdmin, adminController.toggleFeatured);
router.get('/admin/users', authenticate, requireAdmin, adminController.getAllUsers);
router.put('/admin/users/:id/ban', authenticate, requireAdmin, adminController.banUser);
router.put('/admin/users/:id/role', authenticate, requireAdmin, adminController.changeUserRole);
router.put('/admin/users/:id/verify', authenticate, requireAdmin, adminController.verifyUser);
router.delete('/admin/users/:id', authenticate, requireAdmin, adminController.deactivateUser);
router.get('/admin/activity-log', authenticate, requireAdmin, adminController.getActivityLog);

// Certification routes
const certificationController = require('../controllers/certificationController');
router.post('/certifications', authenticate, certificationController.submitCertification);
router.get('/certifications/my', authenticate, certificationController.getMyCertifications);
router.get('/certifications/pending', authenticate, requireAdmin, certificationController.getPendingCertifications);
router.get('/certifications/:id', authenticate, certificationController.getCertification);
router.put('/certifications/:id/review', authenticate, requireAdmin, certificationController.reviewCertification);

// Fraud report routes
const fraudController = require('../controllers/fraudController');
const subscriptionController = require('../controllers/subscriptionController');

router.post('/fraud-reports', authenticate, fraudController.submitReport);
router.get('/fraud-reports/my', authenticate, fraudController.getMyReports);
router.get('/fraud-reports/pending', authenticate, requireAdmin, fraudController.getPendingReports);
router.put('/fraud-reports/:id/review', authenticate, requireAdmin, fraudController.reviewReport);

// Newsletter
const { sequelize: seqInstance } = require('../config/database');
router.post('/newsletter/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid email is required.' });
  }
  try {
    // Create newsletter_subscribers table if not exists (auto-migration for demo)
    await seqInstance.query(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255) NOT NULL UNIQUE,
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1
    )`);
    await seqInstance.query(
      `INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)`,
      { replacements: [email.toLowerCase().trim()] }
    );
    console.log(`📧 Newsletter subscription: ${email}`);
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (err) {
    // If UNIQUE constraint (PostgreSQL uses different syntax)
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
      return res.json({ success: true, message: 'Already subscribed!' });
    }
    res.status(500).json({ success: false, message: 'Subscription failed.' });
  }
});

// Subscription routes
router.get('/subscriptions/plans', subscriptionController.getPlans);
router.get('/subscriptions/mine', authenticate, subscriptionController.getMySubscription);
router.post('/subscriptions/subscribe', authenticate, subscriptionController.subscribe);
router.put('/subscriptions/cancel', authenticate, subscriptionController.cancelSubscription);

// Notification routes
const notificationController = require('../controllers/notificationController');
router.get('/notifications', authenticate, notificationController.getMyNotifications);
router.get('/notifications/unread-count', authenticate, notificationController.getUnreadCount);
router.put('/notifications/read-all', authenticate, notificationController.markAllAsRead);
router.put('/notifications/:id/read', authenticate, notificationController.markAsRead);

// ─── ML / AI routes ────────────────────────────────────
const mlController = require('../controllers/mlController');
router.get('/ml/predict-price', mlController.predictPriceEndpoint);
router.get('/ml/price-analysis/:id', mlController.analyzePriceEndpoint);
router.get('/ml/similar/:id', mlController.getSimilarEndpoint);
router.get('/ml/recommendations', optionalAuth, mlController.getRecommendationsEndpoint);
router.get('/ml/trending', mlController.getTrendingEndpoint);
router.get('/ml/trust/:userId', mlController.getSellerTrustEndpoint);
router.get('/ml/seo/:id', mlController.getSeoScoreEndpoint);
router.post('/ml/predict-inline', authenticate, mlController.predictPriceInline);
router.post('/ml/track-view', optionalAuth, mlController.trackView);
router.get('/ml/leads', authenticate, requireAdmin, mlController.getLeadScoresEndpoint);

// ─── GST Invoice routes ───────────────────────────────
const invoiceController = require('../controllers/invoiceController');
router.get('/invoices/booking/:bookingId', authenticate, invoiceController.generateBookingInvoice);
router.get('/invoices/subscription/:subscriptionId', authenticate, invoiceController.generateSubscriptionInvoice);

// ─── Analytics / Marketing routes ──────────────────────
const analyticsController = require('../controllers/analyticsController');
router.post('/analytics/track-visit', optionalAuth, analyticsController.trackVisit);
router.post('/analytics/track-conversion', optionalAuth, analyticsController.trackConversion);
router.get('/analytics/campaigns', authenticate, requireAdmin, analyticsController.getCampaignAnalytics);
router.get('/analytics/demand-forecast', authenticate, requireAdmin, analyticsController.getDemandForecast);
router.get('/analytics/market-trends', analyticsController.getMarketTrends);
router.get('/analytics/referral-stats', authenticate, analyticsController.getReferralStats);
router.get('/analytics/referral-leaderboard', analyticsController.getReferralLeaderboard);
router.get('/sitemap.xml', analyticsController.getSitemap);

module.exports = router;

