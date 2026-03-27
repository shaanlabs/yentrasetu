const express = require('express');
const router = express.Router();

const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const authController = require('../controllers/authController');
const machineryController = require('../controllers/machineryController');

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/send-otp', authController.sendOTP);
router.post('/auth/verify-otp', authController.verifyOTP);
router.post('/auth/refresh-token', authController.refreshToken);
router.get('/auth/me', authenticate, authController.getMe);
router.put('/auth/profile', authenticate, authController.updateProfile);
router.put('/auth/change-password', authenticate, authController.changePassword);

// Machinery Listing routes
router.post('/machinery', authenticate, machineryController.createListing);
router.get('/machinery', optionalAuth, machineryController.getListings);
router.get('/machinery/categories', machineryController.getCategories);
router.get('/machinery/my-listings', authenticate, machineryController.getMyListings);
router.get('/machinery/:id', optionalAuth, machineryController.getListing);
router.put('/machinery/:id', authenticate, machineryController.updateListing);
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
router.post('/parts', authenticate, partsController.createPart);
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

// Review routes
router.post('/reviews', authenticate, reviewController.createReview);
router.get('/reviews', reviewController.getReviews);
router.put('/reviews/:id/respond', authenticate, reviewController.respondToReview);

// Booking routes
router.post('/bookings', authenticate, bookingController.createBooking);
router.get('/bookings', authenticate, bookingController.getMyBookings);
router.put('/bookings/:id/status', authenticate, bookingController.updateBookingStatus);

// Chat routes
router.post('/chats', authenticate, chatController.startOrGetChat);
router.get('/chats', authenticate, chatController.getMyChats);
router.get('/chats/:chatId/messages', authenticate, chatController.getMessages);
router.post('/chats/:chatId/messages', authenticate, chatController.sendMessage);

// Admin routes (require admin role)
router.get('/admin/dashboard', authenticate, requireAdmin, adminController.getDashboard);
router.get('/admin/pending-listings', authenticate, requireAdmin, adminController.getPendingListings);
router.put('/admin/listings/:id/approve', authenticate, requireAdmin, adminController.approveListing);
router.put('/admin/listings/:id/reject', authenticate, requireAdmin, adminController.rejectListing);
router.get('/admin/users', authenticate, requireAdmin, adminController.getAllUsers);
// Newsletter
router.post('/newsletter/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid email is required.' });
  }
  console.log(`📧 Newsletter subscription: ${email}`);
  res.json({ success: true, message: 'Subscribed successfully!' });
});

module.exports = router;
