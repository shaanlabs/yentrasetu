const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RentalBooking = sequelize.define('RentalBooking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  listingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'machinery_listings',
      key: 'id'
    }
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  renterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Booking dates
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duration in days'
  },
  // Pricing
  rentalRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  rentalUnit: {
    type: DataTypes.ENUM('hourly', 'daily', 'monthly'),
    allowNull: false
  },
  totalRentalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  securityDeposit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  platformCommission: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  commissionPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 10.00
  },
  totalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  // Operator
  withOperator: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  operatorRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  operatorTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  // Status
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed'),
    defaultValue: 'pending'
  },
  // Payment status
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'partial', 'completed', 'refunded'),
    defaultValue: 'pending'
  },
  amountPaid: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  // Security deposit
  depositStatus: {
    type: DataTypes.ENUM('pending', 'held', 'released', 'forfeited'),
    defaultValue: 'pending'
  },
  depositReleasedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  depositReleaseAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  // Agreement
  agreementUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  renterSignedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ownerSignedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Delivery
  deliveryAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deliveryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  returnDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Cancellation
  cancelledBy: {
    type: DataTypes.UUID,
    allowNull: true
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellationFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  // Payout to owner
  payoutStatus: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  payoutAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  payoutTransactionId: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  payoutCompletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Notes
  ownerNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  renterNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'rental_bookings',
  timestamps: true,
  indexes: [
    { fields: ['listingId'] },
    { fields: ['ownerId'] },
    { fields: ['renterId'] },
    { fields: ['status'] },
    { fields: ['paymentStatus'] },
    { fields: ['startDate'] },
    { fields: ['endDate'] }
  ]
});

module.exports = RentalBooking;
