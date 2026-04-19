const { Op, fn, col, literal } = require('sequelize');
const {
  User, MachineryListing, PartListing, OperatorProfile, MechanicProfile,
  RentalBooking, Review, CertificationRequest, FraudReport, Subscription,
  Notification, ActivityLog, sequelize
} = require('../models');
const { createNotification } = require('./notificationController');
const { iLikeFilter } = require('../config/dbHelpers');
const { parsePagination } = require('../config/pagination');

// ─── Helper: log admin actions ─────────────────────────
async function logAction(req, action, targetType, targetId, metadata = {}, severity = 'info') {
  try {
    await ActivityLog.log({
      userId: req.userId,
      action,
      targetType,
      targetId,
      metadata,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: (req.headers['user-agent'] || '').slice(0, 500),
      severity,
    });
  } catch (e) { /* never crash on logging */ }
}

// ─── 1. Enhanced Dashboard ─────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    // Basic counts
    const [users, listings, parts, operators, mechanics, bookings, reviews] = await Promise.all([
      User.count(), MachineryListing.count(), PartListing.count(),
      OperatorProfile.count(), MechanicProfile.count(), RentalBooking.count(), Review.count(),
    ]);
    const pendingListings = await MachineryListing.count({ where: { status: 'pending' } });
    const pendingCerts = await CertificationRequest.count({ where: { status: 'pending' } }).catch(() => 0);
    const openFraud = await FraudReport.count({ where: { status: { [Op.in]: ['pending', 'investigating'] } } }).catch(() => 0);

    // Growth trends (7-day)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [newUsers7d, newListings7d, newBookings7d] = await Promise.all([
      User.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } }),
      MachineryListing.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } }),
      RentalBooking.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } }),
    ]);

    // User registrations per day (last 30 days)
    let registrationsPerDay = [];
    try {
      const dialect = sequelize.getDialect();
      const dateExpr = dialect === 'sqlite'
        ? [fn('date', col('createdAt')), 'date']
        : [fn('DATE', col('createdAt')), 'date'];
      
      registrationsPerDay = await User.findAll({
        attributes: [dateExpr, [fn('COUNT', col('id')), 'count']],
        where: { createdAt: { [Op.gte]: thirtyDaysAgo } },
        group: [dialect === 'sqlite' ? fn('date', col('createdAt')) : fn('DATE', col('createdAt'))],
        order: [[literal('date'), 'ASC']],
        raw: true,
      });
    } catch (e) { /* skip on error */ }

    // Listings by category
    let listingsByCategory = [];
    try {
      listingsByCategory = await MachineryListing.findAll({
        attributes: ['category', [fn('COUNT', col('id')), 'count']],
        where: { status: { [Op.ne]: 'rejected' } },
        group: ['category'],
        order: [[literal('count'), 'DESC']],
        raw: true,
      });
    } catch (e) { /* skip on error */ }

    // Top cities
    let topCities = [];
    try {
      topCities = await User.findAll({
        attributes: ['city', [fn('COUNT', col('id')), 'count']],
        where: { city: { [Op.ne]: null } },
        group: ['city'],
        order: [[literal('count'), 'DESC']],
        limit: 10,
        raw: true,
      });
    } catch (e) { /* skip on error */ }

    // Users by role
    let usersByRole = [];
    try {
      usersByRole = await User.findAll({
        attributes: ['userType', [fn('COUNT', col('id')), 'count']],
        group: ['userType'],
        order: [[literal('count'), 'DESC']],
        raw: true,
      });
    } catch (e) { /* skip on error */ }

    // Revenue estimate (sum of totalAmount from confirmed bookings)
    let revenue = 0;
    try {
      const result = await RentalBooking.sum('totalAmount', {
        where: { status: { [Op.in]: ['confirmed', 'active', 'completed'] } }
      });
      revenue = result || 0;
    } catch (e) { /* skip on error */ }

    // Recent activity count (last 24h)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    let todayActivity = 0;
    try {
      todayActivity = await ActivityLog.count({ where: { createdAt: { [Op.gte]: todayStart } } });
    } catch (e) { /* skip on error */ }

    // Active subscriptions
    let activeSubscriptions = 0;
    try {
      activeSubscriptions = await Subscription.count({ where: { status: 'active' } });
    } catch (e) { /* skip on error */ }

    res.json({
      stats: {
        users, listings, parts, operators, mechanics, bookings, reviews,
        pendingListings, pendingCerts, openFraud, activeSubscriptions, revenue,
        todayActivity,
        growth: { newUsers7d, newListings7d, newBookings7d },
        registrationsPerDay,
        listingsByCategory,
        topCities,
        usersByRole,
      }
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ─── 2. Pending Listings ───────────────────────────────
exports.getPendingListings = async (req, res) => {
  try {
    const listings = await MachineryListing.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'phone'] }],
      order: [['createdAt', 'ASC']],
    });
    res.json({ listings });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── 3. Approve Listing ────────────────────────────────
exports.approveListing = async (req, res) => {
  try {
    const listing = await MachineryListing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    await listing.update({ status: 'approved' });
    createNotification({
      userId: listing.userId,
      type: 'listing_approved',
      title: 'Listing Approved ✅',
      body: `Your listing for ${listing.make} ${listing.model} is now live!`,
      data: { listingId: listing.id },
    });
    await logAction(req, 'listing_approved', 'listing', listing.id, { make: listing.make, model: listing.model });
    res.json({ message: 'Listing approved', listing });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── 4. Reject Listing ─────────────────────────────────
exports.rejectListing = async (req, res) => {
  try {
    const listing = await MachineryListing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    await listing.update({ status: 'rejected' });
    createNotification({
      userId: listing.userId,
      type: 'listing_rejected',
      title: 'Listing Rejected',
      body: `Your listing for ${listing.make} ${listing.model} was rejected. Please review and resubmit.`,
      data: { listingId: listing.id },
    });
    await logAction(req, 'listing_rejected', 'listing', listing.id, { make: listing.make, model: listing.model });
    res.json({ message: 'Listing rejected', listing });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── 5. Feature/Unfeature Listing ──────────────────────
exports.toggleFeatured = async (req, res) => {
  try {
    const listing = await MachineryListing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    await listing.update({ isFeatured: !listing.isFeatured });
    await logAction(req, 'listing_featured', 'listing', listing.id, { isFeatured: listing.isFeatured });
    res.json({ message: listing.isFeatured ? 'Listing featured' : 'Listing unfeatured', listing });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── 6. Get All Users (paginated, filterable) ──────────
exports.getAllUsers = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 25 });
    const { search, role, status, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { firstName: iLikeFilter(search) },
        { lastName: iLikeFilter(search) },
        { phone: iLikeFilter(search) },
        { email: iLikeFilter(search) },
      ];
    }
    if (role) where.userType = role;
    if (status === 'banned') where.isBanned = true;
    else if (status === 'inactive') where.isActive = false;
    else if (status === 'verified') where.isVerified = true;
    else if (status === 'active') { where.isActive = true; where.isBanned = false; }

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'otpCode'] },
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    });

    res.json({
      users,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── 7. Ban / Unban User ───────────────────────────────
exports.banUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.userType === 'super_admin') return res.status(403).json({ message: 'Cannot ban super admin' });

    const { ban, reason } = req.body;
    await user.update({ isBanned: !!ban, banReason: ban ? (reason || 'Banned by admin') : null });
    
    const action = ban ? 'user_banned' : 'user_unbanned';
    await logAction(req, action, 'user', user.id, { reason }, ban ? 'warning' : 'info');
    
    createNotification({
      userId: user.id,
      type: ban ? 'account_banned' : 'account_unbanned',
      title: ban ? 'Account Suspended' : 'Account Restored',
      body: ban ? `Your account has been suspended. Reason: ${reason || 'Policy violation'}` : 'Your account has been restored.',
    });

    res.json({ message: ban ? 'User banned' : 'User unbanned', user: { id: user.id, isBanned: user.isBanned } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── 8. Change User Role ───────────────────────────────
exports.changeUserRole = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.userType === 'super_admin' && req.user.userType !== 'super_admin') {
      return res.status(403).json({ message: 'Only super admins can modify super admin roles' });
    }

    const { role } = req.body;
    const validRoles = ['individual', 'contractor', 'company', 'dealer', 'operator', 'mechanic', 'admin'];
    if (!validRoles.includes(role)) return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });

    const oldRole = user.userType;
    await user.update({ userType: role });
    await logAction(req, 'user_role_changed', 'user', user.id, { oldRole, newRole: role });

    res.json({ message: `User role changed to ${role}`, user: { id: user.id, userType: user.userType } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── 9. Verify / Unverify User ─────────────────────────
exports.verifyUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.update({ isVerified: !user.isVerified });
    await logAction(req, 'user_verified', 'user', user.id, { isVerified: user.isVerified });

    res.json({ message: user.isVerified ? 'User verified' : 'User unverified', user: { id: user.id, isVerified: user.isVerified } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── 10. Deactivate User (soft delete) ─────────────────
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.userType === 'super_admin') return res.status(403).json({ message: 'Cannot deactivate super admin' });

    await user.update({ isActive: false });
    await logAction(req, 'user_deactivated', 'user', user.id, {}, 'warning');

    res.json({ message: 'User deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── 11. Activity Log ──────────────────────────────────
exports.getActivityLog = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 50 });
    const { action, severity, userId } = req.query;

    const where = {};
    if (action) where.action = action;
    if (severity) where.severity = severity;
    if (userId) where.userId = userId;

    const { rows: logs, count: total } = await ActivityLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'userType', 'phone'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      logs,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── 12. All Listings (admin view — all statuses) ──────
exports.getAllListings = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 25 });
    const { status, category, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where[Op.or] = [
        { make: iLikeFilter(search) },
        { model: iLikeFilter(search) },
      ];
    }

    const { rows: listings, count: total } = await MachineryListing.findAndCountAll({
      where,
      attributes: { exclude: ['images'] },
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'phone'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      listings,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
