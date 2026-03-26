# YantraSetu Backend API

India's Heavy Equipment Marketplace - Backend API

## Features

- **User Authentication**: JWT-based auth with OTP support
- **Machinery Listings**: Buy/Sell and Rent listings with verification
- **Parts Marketplace**: Parts listings with part number search
- **Operator/Mechanic Hiring**: Profile management and hiring system
- **In-App Chat**: Real-time messaging between buyers and sellers
- **Payment Integration**: Razorpay for rentals and lead fees
- **Admin Panel**: User management, listing verification, analytics
- **Search & Filters**: Location-based search with multiple filters

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT + OTP
- **Real-time**: Socket.io
- **File Uploads**: Multer

## Project Structure

```
src/
├── config/          # Database and app configuration
├── controllers/     # Request handlers
├── middleware/      # Auth, error handling, validation
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
└── server.js        # Entry point
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Setup Database

```bash
# Create PostgreSQL database
createdb yantrasetu

# Run migrations
npm run migrate
```

### 4. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login with phone/password |
| POST | /api/auth/send-otp | Send OTP to phone |
| POST | /api/auth/verify-otp | Verify OTP and login |
| POST | /api/auth/refresh-token | Refresh access token |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/change-password | Change password |

### Machinery Listings Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/machinery | Create listing |
| GET | /api/machinery | Get all listings |
| GET | /api/machinery/categories | Get categories |
| GET | /api/machinery/my-listings | Get user's listings |
| GET | /api/machinery/:id | Get single listing |
| PUT | /api/machinery/:id | Update listing |
| DELETE | /api/machinery/:id | Delete listing |
| PUT | /api/machinery/:id/mark-sold | Mark as sold/rented |
| PUT | /api/machinery/:id/renew | Renew listing |

## Database Models

### User
- id (UUID)
- phone (string, unique)
- email (string, unique)
- password (string, hashed)
- firstName, lastName
- userType (individual, contractor, company, dealer, operator, mechanic)
- accountTier (free, starter, growth, enterprise)
- location (city, state, lat, lng)
- verification status
- ratings

### MachineryListing
- id (UUID)
- userId (UUID)
- listingType (sale, rent)
- category, subCategory
- make, model, year
- hoursUsed, condition
- price, rentalUnit
- location
- status (pending, approved, rejected, sold, rented)
- documents (RC, insurance, inspection)
- images, video

### PartListing
- id (UUID)
- partName, partNumber
- condition, price
- compatibility
- location

### OperatorProfile / MechanicProfile
- id (UUID)
- userId (UUID)
- yearsOfExperience
- certifications
- availability
- rates
- location

### Chat / Message
- id (UUID)
- buyerId, sellerId
- listingType, listingId
- messages
- leadFee info

### RentalBooking
- id (UUID)
- listingId, ownerId, renterId
- dates, duration
- pricing, commission
- status, paymentStatus
- agreement

### Transaction
- id (UUID)
- userId
- transactionType
- amount, status
- payment details

### Review
- id (UUID)
- reviewerId, revieweeId
- rating, comment
- entityType, entityId

## Environment Variables

| Variable | Description |
|----------|-------------|
| DB_HOST | PostgreSQL host |
| DB_PORT | PostgreSQL port |
| DB_NAME | Database name |
| DB_USER | Database user |
| DB_PASSWORD | Database password |
| PORT | Server port |
| JWT_SECRET | JWT signing secret |
| FRONTEND_URL | Frontend URL for CORS |
| RAZORPAY_KEY_ID | Razorpay API key |
| RAZORPAY_KEY_SECRET | Razorpay secret |

## License

ISC
