const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CertificationRequest = sequelize.define('CertificationRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  certificationType: {
    type: DataTypes.ENUM(
      'DGMS', 'crane_operator', 'JCB_certified', 'ITI_diploma',
      'trade_license', 'GST_certificate', 'ISO', 'safety_training', 'other'
    ),
    allowNull: false
  },
  documentName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Human-readable name of the certificate'
  },
  documentNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Certificate/license number for verification'
  },
  documentImage: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Base64 encoded document image'
  },
  issuingAuthority: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  issuedDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'certification_requests',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['certificationType'] }
  ]
});

module.exports = CertificationRequest;
