const User = require('./User');
const MachineryListing = require('./MachineryListing');
const PartListing = require('./PartListing');
const OperatorProfile = require('./OperatorProfile');
const MechanicProfile = require('./MechanicProfile');
const { Chat, Message } = require('./Chat');
const Review = require('./Review');
const Transaction = require('./Transaction');
const RentalBooking = require('./RentalBooking');

// Define associations

// User associations
User.hasMany(MachineryListing, { foreignKey: 'userId', as: 'machineryListings' });
User.hasMany(PartListing, { foreignKey: 'userId', as: 'partListings' });
User.hasOne(OperatorProfile, { foreignKey: 'userId', as: 'operatorProfile' });
User.hasOne(MechanicProfile, { foreignKey: 'userId', as: 'mechanicProfile' });
User.hasMany(Chat, { foreignKey: 'buyerId', as: 'buyerChats' });
User.hasMany(Chat, { foreignKey: 'sellerId', as: 'sellerChats' });
User.hasMany(Message, { foreignKey: 'senderId', as: 'messages' });
User.hasMany(Review, { foreignKey: 'reviewerId', as: 'reviewsGiven' });
User.hasMany(Review, { foreignKey: 'revieweeId', as: 'reviewsReceived' });
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
User.hasMany(RentalBooking, { foreignKey: 'ownerId', as: 'rentalsAsOwner' });
User.hasMany(RentalBooking, { foreignKey: 'renterId', as: 'rentalsAsRenter' });

// MachineryListing associations
MachineryListing.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
MachineryListing.hasMany(RentalBooking, { foreignKey: 'listingId', as: 'rentalBookings' });

// PartListing associations
PartListing.belongsTo(User, { foreignKey: 'userId', as: 'seller' });

// OperatorProfile associations
OperatorProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// MechanicProfile associations
MechanicProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Chat associations
Chat.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });
Chat.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
Chat.hasMany(Message, { foreignKey: 'chatId', as: 'messages' });

// Message associations
Message.belongsTo(Chat, { foreignKey: 'chatId', as: 'chat' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// Review associations
Review.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
Review.belongsTo(User, { foreignKey: 'revieweeId', as: 'reviewee' });

// Transaction associations
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// RentalBooking associations
RentalBooking.belongsTo(MachineryListing, { foreignKey: 'listingId', as: 'listing' });
RentalBooking.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
RentalBooking.belongsTo(User, { foreignKey: 'renterId', as: 'renter' });

module.exports = {
  User,
  MachineryListing,
  PartListing,
  OperatorProfile,
  MechanicProfile,
  Chat,
  Message,
  Review,
  Transaction,
  RentalBooking
};
