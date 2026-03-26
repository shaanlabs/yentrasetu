const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OperatorProfile = sequelize.define('OperatorProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  yearsOfExperience: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // Equipment expertise
  equipmentTypes: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'List of machinery types they can operate'
  },
  // Certifications
  hasDGMSLicense: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  dgmsLicenseUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  hasCraneCertificate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  craneCertificateUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  hasJCBExcavatorCertificate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  jcbExcavatorCertificateUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  hasDrivingLicense: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  drivingLicenseUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  otherCertifications: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Work history
  workHistory: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Availability
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  availabilityCalendar: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  // Rates
  dayRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  projectRate: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
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
  willingToRelocate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Status
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Ratings
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0.0
  },
  reviewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Analytics
  profileViews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  hireCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Bio
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'operator_profiles',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['city'] },
    { fields: ['state'] },
    { fields: ['isAvailable'] },
    { fields: ['isVerified'] },
    { fields: ['rating'] },
    { fields: ['dayRate'] }
  ]
});

module.exports = OperatorProfile;
