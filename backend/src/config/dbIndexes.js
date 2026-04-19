/**
 * Database indexes for query performance.
 * Creates composite indexes after model sync.
 * Safe to run multiple times — uses IF NOT EXISTS internally.
 *
 * IMPORTANT: Table names must match the `tableName` property
 * defined in each Sequelize model, NOT the model class name.
 */
const { sequelize } = require('./database');

async function createIndexes() {
  const dialect = sequelize.getDialect();
  const qi = sequelize.getQueryInterface();

  // Helper: safely add index (skip if exists)
  async function safeIndex(table, fields, options = {}) {
    const name = options.name || `idx_${table}_${fields.join('_')}`;
    try {
      await qi.addIndex(table, fields, { name, ...options });
    } catch (err) {
      // Index already exists or table doesn't exist yet — safe to ignore
      if (!err.message?.includes('already exists') && !err.message?.includes('does not exist')) {
        console.warn(`  Index ${name}: ${err.message}`);
      }
    }
  }

  console.log('📇 Creating database indexes...');

  // ── machinery_listings (model: MachineryListing) ──────
  await safeIndex('machinery_listings', ['userId', 'status']);
  await safeIndex('machinery_listings', ['category', 'status', 'isActive']);
  await safeIndex('machinery_listings', ['status', 'isActive']);
  await safeIndex('machinery_listings', ['city']);
  await safeIndex('machinery_listings', ['state']);
  await safeIndex('machinery_listings', ['listingType', 'status']);
  await safeIndex('machinery_listings', ['make']);
  await safeIndex('machinery_listings', ['isFeatured', 'status']);
  if (dialect === 'postgres') {
    await safeIndex('machinery_listings', ['latitude', 'longitude'], { name: 'idx_ml_geo' });
  }

  // ── users (model: User) ──────────────────────────────
  await safeIndex('users', ['phone'], { unique: true, name: 'idx_user_phone_unique' });
  await safeIndex('users', ['email'], { name: 'idx_user_email' });
  await safeIndex('users', ['userType']);
  await safeIndex('users', ['isActive', 'isBanned']);

  // ── reviews (model: Review) ──────────────────────────
  await safeIndex('reviews', ['revieweeId']);
  await safeIndex('reviews', ['reviewerId']);
  await safeIndex('reviews', ['reviewType', 'entityId']);

  // ── notifications (model: Notification) ──────────────
  await safeIndex('notifications', ['userId', 'isRead']);
  await safeIndex('notifications', ['userId', 'createdAt']);

  // ── activity_logs (model: ActivityLog) ───────────────
  await safeIndex('activity_logs', ['userId', 'action']);
  await safeIndex('activity_logs', ['targetId', 'action']);
  await safeIndex('activity_logs', ['createdAt']);

  // ── chats (model: Chat) ──────────────────────────────
  await safeIndex('chats', ['buyerId']);
  await safeIndex('chats', ['sellerId']);
  await safeIndex('chats', ['buyerId', 'sellerId', 'listingId'], { name: 'idx_chat_participants' });

  // ── messages (model: Message) ────────────────────────
  await safeIndex('messages', ['chatId', 'createdAt']);

  // ── rental_bookings (model: RentalBooking) ───────────
  await safeIndex('rental_bookings', ['listingId']);
  await safeIndex('rental_bookings', ['renterId']);
  await safeIndex('rental_bookings', ['ownerId']);
  await safeIndex('rental_bookings', ['status']);

  // ── part_listings (model: PartListing) ───────────────
  await safeIndex('part_listings', ['userId']);
  await safeIndex('part_listings', ['category']);

  // ── fraud_reports (model: FraudReport) ───────────────
  await safeIndex('fraud_reports', ['targetId', 'targetType']);
  await safeIndex('fraud_reports', ['status']);

  // ── certification_requests (model: CertificationRequest)
  await safeIndex('certification_requests', ['userId']);
  await safeIndex('certification_requests', ['status']);

  // ── campaign_visits (model: CampaignVisit) ───────────
  await safeIndex('campaign_visits', ['source', 'campaign']);
  await safeIndex('campaign_visits', ['createdAt']);

  console.log('✅ Database indexes created.');
}

module.exports = createIndexes;
