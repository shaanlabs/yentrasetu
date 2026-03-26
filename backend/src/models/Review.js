const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reviewerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  revieweeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Related entity
  reviewType: {
    type: DataTypes.ENUM('listing', 'user', 'operator', 'mechanic', 'rental'),
    allowNull: false
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the listing/rental being reviewed'
  },
  // Rating
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  // Review details
  title: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // Specific ratings
  punctualityRating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true
  },
  qualityRating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true
  },
  communicationRating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true
  },
  valueRating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true
  },
  // Status
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Verified purchase/hire'
  },
  isVisible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isFlagged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  flagReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Response from reviewee
  response: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  respondedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['reviewerId'] },
    { fields: ['revieweeId'] },
    { fields: ['reviewType'] },
    { fields: ['entityId'] },
    { fields: ['rating'] },
    { fields: ['isVisible'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = Review;
