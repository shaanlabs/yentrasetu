const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Participants
  buyerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  sellerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Related listing (optional)
  listingType: {
    type: DataTypes.ENUM('machinery', 'part', 'operator', 'mechanic'),
    allowNull: true
  },
  listingId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  // Chat status
  status: {
    type: DataTypes.ENUM('active', 'blocked', 'archived'),
    defaultValue: 'active'
  },
  // Lead fee info
  leadFeePaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  leadFeeAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  leadFeePaidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Last message
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastMessagePreview: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  // Unread counts
  buyerUnreadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sellerUnreadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'chats',
  timestamps: true,
  indexes: [
    { fields: ['buyerId'] },
    { fields: ['sellerId'] },
    { fields: ['listingId'] },
    { fields: ['status'] },
    { fields: ['lastMessageAt'] }
  ]
});

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chatId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'chats',
      key: 'id'
    }
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'document', 'location'),
    defaultValue: 'text'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  mediaUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'messages',
  timestamps: true,
  indexes: [
    { fields: ['chatId'] },
    { fields: ['senderId'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = { Chat, Message };
