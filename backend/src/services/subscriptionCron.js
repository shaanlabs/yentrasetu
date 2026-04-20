/**
 * Subscription Expiry Service
 * Checks for expired subscriptions and downgrades users to free tier.
 * Runs on server startup + every hour via setInterval.
 */
const { Subscription, User } = require('../models');
const { Op } = require('sequelize');

async function expireSubscriptions() {
  try {
    // Find all active subscriptions that have passed their end date
    const expired = await Subscription.findAll({
      where: {
        status: 'active',
        endDate: { [Op.lt]: new Date() },
      },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'accountTier'] }],
    });

    if (expired.length === 0) return;

    console.log(`⏰ Found ${expired.length} expired subscription(s). Processing...`);

    for (const sub of expired) {
      // Mark subscription as expired
      await sub.update({ status: 'expired' });

      // Downgrade user to free tier
      if (sub.user) {
        await sub.user.update({ accountTier: 'free', subscriptionExpiry: null });
        console.log(`   ↳ ${sub.user.firstName} (${sub.user.id}) downgraded from ${sub.plan} → free`);
      }
    }

    console.log(`✅ Processed ${expired.length} expired subscription(s).`);
  } catch (err) {
    console.error('Subscription expiry check failed:', err.message);
  }
}

// Start the periodic check (every hour)
function startExpiryScheduler() {
  // Run immediately on startup
  expireSubscriptions();

  // Then every hour
  const INTERVAL = 60 * 60 * 1000; // 1 hour
  const timer = setInterval(expireSubscriptions, INTERVAL);

  // Allow graceful shutdown
  timer.unref();

  console.log('📅 Subscription expiry scheduler started (runs every hour)');
}

module.exports = { expireSubscriptions, startExpiryScheduler };
