/**
 * Lead Scoring Service
 * Scores users 0-100 based on engagement, profile completeness, and transaction history.
 */
const { User, MachineryListing, RentalBooking, Review, ActivityLog, Chat } = require('../models');
const { Op, fn, col } = require('sequelize');

async function calculateLeadScore(userId) {
  const user = await User.findByPk(userId, { raw: true });
  if (!user) return null;

  let score = 0;
  const breakdown = {};

  // 1. Profile Completeness (0-20)
  const profileFields = ['firstName', 'lastName', 'email', 'city', 'state', 'companyName', 'gstNumber', 'profileImage', 'address'];
  const filled = profileFields.filter(f => user[f] && user[f].toString().trim()).length;
  breakdown.profileCompleteness = Math.round((filled / profileFields.length) * 20);
  score += breakdown.profileCompleteness;

  // 2. Activity Recency (0-25)
  const now = Date.now();
  const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt).getTime() : 0;
  const daysSinceLogin = lastLogin ? (now - lastLogin) / 86400000 : 999;
  if (daysSinceLogin < 1) breakdown.activityRecency = 25;
  else if (daysSinceLogin < 3) breakdown.activityRecency = 22;
  else if (daysSinceLogin < 7) breakdown.activityRecency = 18;
  else if (daysSinceLogin < 14) breakdown.activityRecency = 12;
  else if (daysSinceLogin < 30) breakdown.activityRecency = 6;
  else breakdown.activityRecency = 0;
  score += breakdown.activityRecency;

  // 3. Engagement Depth (0-30)
  const [listingCount, bookingCount, chatCount, reviewCount, activityCount] = await Promise.all([
    MachineryListing.count({ where: { userId } }).catch(() => 0),
    RentalBooking.count({ where: { [Op.or]: [{ ownerId: userId }, { renterId: userId }] } }).catch(() => 0),
    Chat.count({ where: { [Op.or]: [{ buyerId: userId }, { sellerId: userId }] } }).catch(() => 0),
    Review.count({ where: { reviewerId: userId } }).catch(() => 0),
    ActivityLog.count({ where: { userId, createdAt: { [Op.gte]: new Date(now - 30 * 86400000) } } }).catch(() => 0),
  ]);

  const engagementPoints =
    Math.min(8, listingCount * 2) +
    Math.min(8, bookingCount * 4) +
    Math.min(6, chatCount * 1.5) +
    Math.min(4, reviewCount * 2) +
    Math.min(4, Math.log(activityCount + 1) * 2);
  breakdown.engagementDepth = Math.round(Math.min(30, engagementPoints));
  score += breakdown.engagementDepth;

  // 4. Transaction History (0-25)
  const completedBookings = await RentalBooking.count({
    where: { [Op.or]: [{ ownerId: userId }, { renterId: userId }], status: 'completed' },
  }).catch(() => 0);
  const transactionPoints =
    Math.min(10, completedBookings * 5) +
    (user.isVerified ? 8 : 0) +
    (user.accountTier !== 'free' ? 7 : 0);
  breakdown.transactionHistory = Math.round(Math.min(25, transactionPoints));
  score += breakdown.transactionHistory;

  const totalScore = Math.round(Math.min(100, score));

  let label;
  if (totalScore >= 80) label = 'hot';
  else if (totalScore >= 60) label = 'warm';
  else if (totalScore >= 40) label = 'lukewarm';
  else if (totalScore >= 20) label = 'cold';
  else label = 'inactive';

  return {
    userId,
    score: totalScore,
    label,
    breakdown,
    stats: { listingCount, bookingCount, chatCount, reviewCount, completedBookings },
  };
}

// Bulk score for admin dashboard
async function getTopLeads(limit = 20) {
  const users = await User.findAll({
    where: { isBanned: false, isActive: true, userType: { [Op.notIn]: ['admin', 'super_admin'] } },
    attributes: ['id', 'firstName', 'lastName', 'phone', 'email', 'userType', 'city', 'isVerified', 'lastLoginAt', 'createdAt'],
    order: [['lastLoginAt', 'DESC']],
    limit: limit * 2,
    raw: true,
  });

  const scored = await Promise.all(users.map(async u => {
    const result = await calculateLeadScore(u.id);
    return { ...u, leadScore: result?.score || 0, leadLabel: result?.label || 'unknown', leadBreakdown: result?.breakdown };
  }));

  scored.sort((a, b) => b.leadScore - a.leadScore);
  return scored.slice(0, limit);
}

module.exports = { calculateLeadScore, getTopLeads };
