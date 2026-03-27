# YantraSetu - Project Summary

## Overview
YantraSetu is India's Heavy Equipment Marketplace - a unified platform for buying, selling, and renting heavy machinery, parts, and hiring operators/mechanics.

---

## Project Structure

```
/mnt/okcomputer/output/
├── app/                          # Frontend (React + Vite)
│   ├── public/images/            # Generated images
│   ├── src/
│   │   ├── App.tsx              # Main app component
│   │   ├── App.css              # App styles
│   │   ├── index.css            # Global styles
│   │   └── main.tsx             # Entry point
│   ├── dist/                     # Build output
│   └── package.json
│
├── backend/                      # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js      # Database configuration
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── machineryController.js
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT authentication
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── MachineryListing.js
│   │   │   ├── PartListing.js
│   │   │   ├── OperatorProfile.js
│   │   │   ├── MechanicProfile.js
│   │   │   ├── Chat.js
│   │   │   ├── Review.js
│   │   │   ├── Transaction.js
│   │   │   ├── RentalBooking.js
│   │   │   └── index.js         # Model associations
│   │   ├── routes/
│   │   │   └── index.js         # API routes
│   │   └── server.js            # Server entry point
│   ├── config/
│   │   └── config.js            # Sequelize config
│   ├── database/
│   │   └── migrations/          # Database migrations
│   ├── .env.example             # Environment template
│   ├── .sequelizerc             # Sequelize CLI config
│   ├── README.md                # Backend docs
│   └── API_DOCUMENTATION.md     # API reference
│
└── Design.md                     # Design PRD
```

---

## Frontend Features

### Design System
- **Colors**: Warm stone (#E9E3DA), near-black (#101214), safety orange (#FF6A00)
- **Typography**: Sora (headings), Inter (body), IBM Plex Mono (labels)
- **Style**: Industrial, editorial, high-contrast

### Sections Implemented
1. **Split Hero** - Dramatic entrance with excavator imagery
2. **Category Mosaic** - Grid layout for equipment categories
3. **How It Works** - 3-step process explanation
4. **Featured Listings** - 3-panel machinery showcase
5. **Value Props** - Trust indicators and services
6. **Testimonial** - Social proof section
7. **Safety + Inspection** - Quality promise
8. **Financing CTA** - Loan eligibility call-to-action
9. **Network Coverage** - Stats and coverage info
10. **Footer** - Newsletter and links

### Tech Stack
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- GSAP + ScrollTrigger (animations)
- Lucide React (icons)

### Animations
- Pinned scroll sections with GSAP ScrollTrigger
- Global snap for smooth section transitions
- Entrance/exit animations for each section
- Parallax effects on images

---

## Backend Features

### Database Models

#### User
- Authentication (phone, email, password)
- Profile (name, company, address)
- User types (individual, contractor, company, dealer, operator, mechanic)
- Account tiers (free, starter, growth, enterprise)
- Location (lat, lng for geo-search)
- Verification status

#### MachineryListing
- Buy/Sell and Rent listings
- Categories (construction, mining, agriculture, industrial)
- Make, model, year, hours used
- Pricing (sale price or rental rates)
- Location-based search
- Document uploads (RC, insurance, inspection)
- Image gallery
- Status workflow (pending → approved → sold/rented)

#### PartListing
- Part name, number, condition
- Compatibility info
- Location

#### OperatorProfile / MechanicProfile
- Experience and skills
- Certifications (DGMS, Crane, JCB, ITI)
- Availability calendar
- Rates (daily/project for operators, hourly/daily for mechanics)
- Location and service radius

#### Chat / Message
- Real-time messaging
- Lead fee tracking
- Media attachments

#### RentalBooking
- Booking dates and duration
- Pricing breakdown (rental + security deposit + commission)
- Payment status tracking
- Agreement PDF
- Security deposit management

#### Transaction
- Lead fees, rental payments, commissions
- Payment gateway integration
- Refund tracking

#### Review
- Ratings for listings, users, operators, mechanics
- Verified transaction badge
- Helpful votes

### API Endpoints Implemented

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - Phone/password login
- `POST /auth/send-otp` - Send OTP
- `POST /auth/verify-otp` - Verify OTP and login
- `POST /auth/refresh-token` - Refresh JWT
- `GET /auth/me` - Get current user
- `PUT /auth/profile` - Update profile
- `PUT /auth/change-password` - Change password

#### Machinery Listings
- `POST /machinery` - Create listing
- `GET /machinery` - Get listings with filters
- `GET /machinery/categories` - Get categories
- `GET /machinery/my-listings` - Get user's listings
- `GET /machinery/:id` - Get single listing
- `PUT /machinery/:id` - Update listing
- `DELETE /machinery/:id` - Delete listing
- `PUT /machinery/:id/mark-sold` - Mark as sold/rented
- `PUT /machinery/:id/renew` - Renew listing

### Tech Stack
- Node.js + Express
- PostgreSQL + Sequelize ORM
- JWT authentication
- Socket.io (for chat)
- Multer (file uploads)

---

## Key Features

### 1. Single Account Model
Users can be buyers, sellers, renters, operators, and mechanics with one account.

### 2. Location-First Discovery
- GPS-based radius search
- State/district filters
- Distance-based sorting

### 3. Trust & Verification
- Mandatory document verification (RC, insurance, inspection)
- 24-hour admin SLA for listing approval
- Verified badges on listings
- Rating and review system

### 4. Monetization
- **Lead Fees**: ₹99-₹999 based on machinery value
- **Rental Commission**: 8-12% of rental value
- **Dealer Subscriptions**: ₹2,999-₹19,999/month
- **Featured Listings**: ₹499-₹999 for boosted visibility

### 5. Rental Management
- Online booking with security deposit
- Digital rental agreements
- OTP-based e-sign
- Deposit escrow and release

---

## Environment Setup

### Frontend
```bash
cd app
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install

# Setup database
createdb yantrasetu
cp .env.example .env
# Edit .env with your credentials

npm run migrate
npm run dev
```

---

## Deployment

### Frontend
The frontend is deployed at:
**https://7mgtwqo3izcgo.ok.kimi.link**

### Backend
For backend deployment:
1. Set up PostgreSQL database
2. Configure environment variables
3. Run migrations
4. Start server with PM2 or similar

---

## Future Enhancements

### Phase 2 (Months 5-7)
- Operator & Mechanic marketplace full implementation
- Certification verification system
- Fraud reporting
- Dealer subscriptions
- Part number search

### Phase 3 (Months 8-12)
- Advanced analytics dashboard
- Aadhaar eSign integration
- Parts shipping integration
- Recommendation engine
- WhatsApp notifications
- Mobile PWA

---

## API Documentation
See `backend/API_DOCUMENTATION.md` for complete API reference.

## License
ISC
