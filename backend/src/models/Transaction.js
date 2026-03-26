const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  transactionType: {
    type: DataTypes.ENUM('lead_fee', 'rental_payment', 'rental_commission', 'security_deposit', 'deposit_refund', 'subscription', 'featured_listing', 'payout'),
    allowNull: false
  },
  // Related entity
  relatedType: {
    type: DataTypes.ENUM('listing', 'chat', 'rental', 'subscription'),
    allowNull: true
  },
  relatedId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  // Amount details
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR'
  },
  // Payment details
  paymentMethod: {
    type: DataTypes.ENUM('upi', 'card', 'netbanking', 'wallet', 'cash', 'bank_transfer'),
    allowNull: true
  },
  paymentGateway: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  gatewayTransactionId: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  // Status
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled'),
    defaultValue: 'pending'
  },
  // For rentals
  isSecurityDeposit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  securityDepositStatus: {
    type: DataTypes.ENUM('held', 'released', 'forfeited'),
    allowNull: true
  },
  // Commission (for rentals)
  commissionAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  commissionPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  // Metadata
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  // Timestamps
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['transactionType'] },
    { fields: ['relatedId'] },
    { fields: ['status'] },
    { fields: ['gatewayTransactionId'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = Transaction;
