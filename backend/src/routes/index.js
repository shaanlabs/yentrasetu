const express = require('express');
const router = express.Router();

const { authenticate, optionalAuth } = require('../middleware/auth');
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

// Placeholder routes for future implementation
router.get('/parts', (req, res) => {
  res.json({ message: 'Parts marketplace - Coming soon' });
});

router.get('/operators', (req, res) => {
  res.json({ message: 'Operator hiring - Coming soon' });
});

router.get('/mechanics', (req, res) => {
  res.json({ message: 'Mechanic hiring - Coming soon' });
});

router.get('/chats', authenticate, (req, res) => {
  res.json({ message: 'Chat system - Coming soon' });
});

router.get('/admin/dashboard', authenticate, (req, res) => {
  res.json({ message: 'Admin dashboard - Coming soon' });
});
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
