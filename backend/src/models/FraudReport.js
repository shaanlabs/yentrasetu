const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FraudReport = sequelize.define('FraudReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reporterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  targetType: {
    type: DataTypes.ENUM('listing', 'user'),
    allowNull: false
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'ID of the listing or user being reported'
  },
  reason: {
    type: DataTypes.ENUM(
      'fake_listing', 'misleading_photos', 'scam_pricing',
      'stolen_equipment', 'impersonation', 'spam', 'other'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  evidenceImages: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of base64 evidence images'
  },
  status: {
    type: DataTypes.ENUM('pending', 'investigating', 'resolved', 'dismissed'),
    defaultValue: 'pending'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resolution: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Summary of resolution action taken'
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'fraud_reports',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['reporterId'] },
    { fields: ['targetType', 'targetId'] },
    { fields: ['status'] },
    { fields: ['reason'] }
  ]
});

module.exports = FraudReport;
