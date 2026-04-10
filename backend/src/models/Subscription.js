const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  plan: {
    type: DataTypes.ENUM('free', 'starter', 'growth', 'enterprise'),
    allowNull: false,
    defaultValue: 'free',
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'cancelled'),
    allowNull: false,
    defaultValue: 'active',
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  maxListings: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5, // Default for free
  },
  featuredListings: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: 'subscriptions',
  timestamps: true,
});

module.exports = Subscription;
