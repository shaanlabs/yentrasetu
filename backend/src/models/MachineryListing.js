const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MachineryListing = sequelize.define('MachineryListing', {
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
  listingType: {
    type: DataTypes.ENUM('sale', 'rent'),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('construction', 'mining', 'agriculture', 'industrial'),
    allowNull: false
  },
  subCategory: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  make: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  hoursUsed: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  condition: {
    type: DataTypes.ENUM('new', 'used', 'refurbished'),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  priceNegotiable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Rental-specific fields
  rentalUnit: {
    type: DataTypes.ENUM('hourly', 'daily', 'monthly'),
    allowNull: true
  },
  securityDeposit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  minimumRentalDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Minimum duration in days'
  },
  withOperator: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  operatorRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  deliveryAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deliveryRadius: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Delivery radius in km'
  },
  // Location
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  pincode: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  // Status and verification
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'sold', 'rented', 'expired'),
    defaultValue: 'pending'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  featuredUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Documents
  rcBookUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  insuranceUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  inspectionReportUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  // Media
  images: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  videoUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  // Analytics
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  contactUnlockCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Expiry
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Metadata
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'machinery_listings',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['category'] },
    { fields: ['subCategory'] },
    { fields: ['make'] },
    { fields: ['model'] },
    { fields: ['listingType'] },
    { fields: ['status'] },
    { fields: ['city'] },
    { fields: ['state'] },
    { fields: ['price'] },
    { fields: ['year'] },
    { fields: ['condition'] },
    { fields: ['isFeatured'] },
    { fields: ['isVerified'] },
    { fields: ['createdAt'] },
    { fields: ['latitude', 'longitude'] }
  ]
});

module.exports = MachineryListing;
