-- ================================================
-- YANTRASETU DATABASE SCHEMA (16 Tables - ER Diagram Version)
-- ================================================

CREATE TABLE users (
  id UUID PRIMARY KEY,
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  userType VARCHAR(50) DEFAULT 'individual',
  accountTier VARCHAR(50) DEFAULT 'free',
  companyName VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  isVerified BOOLEAN DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0.0,
  referralCode VARCHAR(20) UNIQUE
);

CREATE TABLE machinery_listings (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  listingType VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subCategory VARCHAR(100) NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  condition VARCHAR(50) NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE part_listings (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  partName VARCHAR(255) NOT NULL,
  partNumber VARCHAR(100),
  category VARCHAR(100) NOT NULL,
  condition VARCHAR(50) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE operator_profiles (
  id UUID PRIMARY KEY,
  userId UUID UNIQUE NOT NULL,
  yearsOfExperience INTEGER DEFAULT 0,
  dayRate DECIMAL(10,2),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  isVerified BOOLEAN DEFAULT 0,
  verificationStatus VARCHAR(50) DEFAULT 'pending',
  isAvailable BOOLEAN DEFAULT 1,
  rating DECIMAL(2,1) DEFAULT 0.0,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE mechanic_profiles (
  id UUID PRIMARY KEY,
  userId UUID UNIQUE NOT NULL,
  yearsOfExperience INTEGER DEFAULT 0,
  hourlyRate DECIMAL(10,2),
  dailyRate DECIMAL(10,2),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  isVerified BOOLEAN DEFAULT 0,
  verificationStatus VARCHAR(50) DEFAULT 'pending',
  isAvailable BOOLEAN DEFAULT 1,
  rating DECIMAL(2,1) DEFAULT 0.0,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE chats (
  id UUID PRIMARY KEY,
  buyerId UUID NOT NULL,
  sellerId UUID NOT NULL,
  listingType VARCHAR(50),
  listingId UUID,
  status VARCHAR(50) DEFAULT 'active',
  FOREIGN KEY (buyerId) REFERENCES users(id),
  FOREIGN KEY (sellerId) REFERENCES users(id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  chatId UUID NOT NULL,
  senderId UUID NOT NULL,
  messageType VARCHAR(50) DEFAULT 'text',
  content TEXT NOT NULL,
  isRead BOOLEAN DEFAULT 0,
  FOREIGN KEY (chatId) REFERENCES chats(id),
  FOREIGN KEY (senderId) REFERENCES users(id)
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  reviewerId UUID NOT NULL,
  revieweeId UUID NOT NULL,
  reviewType VARCHAR(50) NOT NULL,
  entityId UUID,
  rating DECIMAL(2,1) NOT NULL,
  title VARCHAR(200),
  comment TEXT NOT NULL,
  FOREIGN KEY (reviewerId) REFERENCES users(id),
  FOREIGN KEY (revieweeId) REFERENCES users(id)
);

CREATE TABLE rental_bookings (
  id UUID PRIMARY KEY,
  listingId UUID NOT NULL,
  ownerId UUID NOT NULL,
  renterId UUID NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  duration INTEGER NOT NULL,
  rentalRate DECIMAL(10,2) NOT NULL,
  rentalUnit VARCHAR(50) NOT NULL,
  totalAmount DECIMAL(15,2) NOT NULL,
  securityDeposit DECIMAL(15,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  paymentStatus VARCHAR(50) DEFAULT 'pending',
  FOREIGN KEY (listingId) REFERENCES machinery_listings(id),
  FOREIGN KEY (ownerId) REFERENCES users(id),
  FOREIGN KEY (renterId) REFERENCES users(id)
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  transactionType VARCHAR(50) NOT NULL,
  relatedType VARCHAR(50),
  relatedId UUID,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  paymentMethod VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  startDate DATETIME NOT NULL,
  endDate DATETIME,
  maxListings INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE certification_requests (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  certificationType VARCHAR(50) NOT NULL,
  documentName VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  reviewedBy UUID,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (reviewedBy) REFERENCES users(id)
);

CREATE TABLE fraud_reports (
  id UUID PRIMARY KEY,
  reporterId UUID NOT NULL,
  targetType VARCHAR(50) NOT NULL,
  targetId UUID NOT NULL,
  reason VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  reviewedBy UUID,
  FOREIGN KEY (reporterId) REFERENCES users(id),
  FOREIGN KEY (reviewedBy) REFERENCES users(id)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  isRead BOOLEAN DEFAULT 0,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  userId UUID,
  action VARCHAR(100) NOT NULL,
  targetType VARCHAR(50),
  targetId UUID,
  severity VARCHAR(50) DEFAULT 'info',
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE campaign_visits (
  id UUID PRIMARY KEY,
  userId UUID,
  source VARCHAR(100),
  medium VARCHAR(100),
  campaign VARCHAR(100),
  landingPage VARCHAR(255),
  FOREIGN KEY (userId) REFERENCES users(id)
);
