const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PartListing = sequelize.define('PartListing', {
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
  partName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  partNumber: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  oemPartNumber: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('engine', 'hydraulics', 'electrical', 'undercarriage', 'cab', 'attachments', 'other'),
    allowNull: false
  },
  condition: {
    type: DataTypes.ENUM('new', 'used', 'oem', 'aftermarket', 'refurbished'),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Compatibility
  compatibleMakes: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  compatibleModels: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  compatibleYears: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Location
  city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: false
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
  // Status
  status: {
    type: DataTypes.ENUM('active', 'sold', 'inactive'),
    defaultValue: 'active'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Media
  images: {
    type: DataTypes.JSONB,
    defaultValue: []
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
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'part_listings',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['partNumber'] },
    { fields: ['oemPartNumber'] },
    { fields: ['category'] },
    { fields: ['condition'] },
    { fields: ['city'] },
    { fields: ['state'] },
    { fields: ['status'] },
    { fields: ['price'] }
  ]
});

module.exports = PartListing;
