/**
 * CampaignVisit — UTM Campaign Tracking Model
 * Tracks user acquisition source, medium, campaign, and conversion events.
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CampaignVisit = sequelize.define('CampaignVisit', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  sessionId: { type: DataTypes.STRING(100), allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: true, comment: 'Set after registration/login' },

  // UTM parameters
  source: { type: DataTypes.STRING(100), allowNull: true, comment: 'e.g. google, facebook, whatsapp' },
  medium: { type: DataTypes.STRING(100), allowNull: true, comment: 'e.g. cpc, organic, referral, social' },
  campaign: { type: DataTypes.STRING(255), allowNull: true, comment: 'e.g. summer_sale_2026' },
  content: { type: DataTypes.STRING(255), allowNull: true, comment: 'A/B test content variant' },
  term: { type: DataTypes.STRING(255), allowNull: true, comment: 'Search keyword' },

  // Visit context
  landingPage: { type: DataTypes.STRING(500), allowNull: true },
  referrer: { type: DataTypes.STRING(500), allowNull: true },
  userAgent: { type: DataTypes.STRING(500), allowNull: true },
  ipAddress: { type: DataTypes.STRING(45), allowNull: true },
  device: { type: DataTypes.ENUM('desktop', 'mobile', 'tablet'), allowNull: true },
  browser: { type: DataTypes.STRING(50), allowNull: true },
  country: { type: DataTypes.STRING(50), allowNull: true },
  city: { type: DataTypes.STRING(100), allowNull: true },

  // Conversion tracking
  conversionType: {
    type: DataTypes.ENUM('none', 'registered', 'listed', 'booked', 'subscribed'),
    defaultValue: 'none',
    comment: 'Highest conversion achieved in this session',
  },
  convertedAt: { type: DataTypes.DATE, allowNull: true },

  // Engagement
  pageViews: { type: DataTypes.INTEGER, defaultValue: 1 },
  duration: { type: DataTypes.INTEGER, defaultValue: 0, comment: 'Session duration in seconds' },
  bounced: { type: DataTypes.BOOLEAN, defaultValue: true, comment: 'True if only 1 page view' },
}, {
  tableName: 'campaign_visits',
  timestamps: true,
  indexes: [
    { fields: ['sessionId'] },
    { fields: ['userId'] },
    { fields: ['source'] },
    { fields: ['medium'] },
    { fields: ['campaign'] },
    { fields: ['conversionType'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = CampaignVisit;
