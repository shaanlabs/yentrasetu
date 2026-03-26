const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MechanicProfile = sequelize.define('MechanicProfile', {
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
  // Specializations
  specializations: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'engine, hydraulics, electrical, welding, tyres, pms, etc.'
  },
  // Brand expertise
  brandExpertise: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'CAT, Volvo, Komatsu, John Deere, etc.'
  },
  // Certifications
  hasITICertification: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  itiCertificateUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  hasDiploma: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  diplomaUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  brandCertifications: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  otherCertifications: {
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
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  dailyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  visitCharge: {
    type: DataTypes.DECIMAL(10, 2),
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
  serviceRadius: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    comment: 'Service radius in km'
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
  serviceCount: {
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
  tableName: 'mechanic_profiles',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['city'] },
    { fields: ['state'] },
    { fields: ['isAvailable'] },
    { fields: ['isVerified'] },
    { fields: ['rating'] },
    { fields: ['hourlyRate'] }
  ]
});

module.exports = MechanicProfile;
