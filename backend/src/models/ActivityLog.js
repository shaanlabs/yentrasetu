const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true // Null for anonymous actions (e.g. failed login)
  },
  action: {
    type: DataTypes.STRING(80),
    allowNull: false,
    validate: {
      isIn: [[
        'login', 'login_failed', 'register', 'password_changed',
        'listing_created', 'listing_updated', 'listing_approved', 'listing_rejected', 'listing_featured',
        'user_banned', 'user_unbanned', 'user_role_changed', 'user_verified', 'user_deactivated',
        'booking_created', 'booking_confirmed', 'booking_cancelled',
        'fraud_reported', 'fraud_resolved', 'fraud_dismissed',
        'cert_submitted', 'cert_approved', 'cert_rejected',
        'spam_detected', 'spam_blocked',
        'review_created', 'part_created',
        'profile_updated', 'admin_action',
        'listing_viewed', 'listing_searched', 'referral_used'
      ]]
    }
  },
  targetType: {
    type: DataTypes.STRING(50),
    allowNull: true // 'user', 'listing', 'booking', 'fraud_report', 'certification', etc.
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  severity: {
    type: DataTypes.ENUM('info', 'warning', 'critical'),
    defaultValue: 'info'
  }
}, {
  tableName: 'activity_logs',
  timestamps: true,
  updatedAt: false, // Logs are immutable
  indexes: [
    { fields: ['userId'] },
    { fields: ['action'] },
    { fields: ['createdAt'] },
    { fields: ['severity'] },
  ]
});

// Helper to create activity log entries
ActivityLog.log = async function(data) {
  try {
    return await ActivityLog.create({
      userId: data.userId || null,
      action: data.action,
      targetType: data.targetType || null,
      targetId: data.targetId || null,
      metadata: data.metadata || {},
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      severity: data.severity || 'info',
    });
  } catch (err) {
    console.error('ActivityLog.log error:', err.message);
    return null; // Never let logging failures crash the app
  }
};

module.exports = ActivityLog;
