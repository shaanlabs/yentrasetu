# YantraSetu — Developer & Tester Documentation

> India's heavy equipment marketplace — Full-stack React + Express application.
> Last updated: 2026-03-26

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Backend API Reference](#backend-api-reference)
6. [Frontend Pages & Routes](#frontend-pages--routes)
7. [Authentication Flow](#authentication-flow)
8. [Design System](#design-system)
9. [Feature Modules](#feature-modules)
10. [Testing Guide](#testing-guide)
11. [Environment Variables](#environment-variables)
12. [Known Limitations & POC Notes](#known-limitations--poc-notes)

---

## Architecture Overview

```
┌─────────────────┐      HTTP/JSON       ┌─────────────────────┐
│   React (Vite)  │ ◄══════════════════► │  Express.js API     │
│   localhost:5173 │   Vite proxy /api    │  localhost:5000      │
│                 │                      │                     │
│  • React Router │                      │  • JWT Auth         │
│  • AuthContext  │                      │  • Sequelize ORM    │
│  • Lucide Icons │                      │  • SQLite (dev)     │
│  • GSAP Anims   │                      │  • CORS + Helmet    │
└─────────────────┘                      └─────────────────────┘
```

- **Frontend** is a Vite + React + TypeScript SPA
- **Backend** is an Express.js REST API with Sequelize ORM
- **Database** is SQLite for local dev (PostgreSQL-ready via Sequelize)
- **Proxy**: Vite dev server forwards `/api/*` requests to `localhost:5000`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite |
| Routing | React Router v7 |
| Styling | Vanilla CSS + Tailwind utility classes |
| Animations | GSAP + ScrollTrigger |
| Icons | Lucide React |
| Fonts | Sora, Inter, IBM Plex Mono (Google Fonts) |
| Backend framework | Express.js |
| ORM | Sequelize v6 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Authentication | JWT (access + refresh tokens) |
| Email | EmailJS (client-side, dev-mode fallback) |
| SMS | Dev-mode (OTPs logged to console) |
| Images | Base64 stored in DB (POC, no S3) |

---

## Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9

### Backend Setup

```bash
cd backend
npm install

# Create .env file (if not present)
cat > .env << EOF
PORT=5000
NODE_ENV=development
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d
EOF

# Start dev server (auto-syncs database tables)
npm run dev
# Server runs on http://localhost:5000
```

### Frontend Setup

```bash
cd app
npm install

# Start dev server
npm run dev
# App runs on http://localhost:5173
```

### Verify Both Are Running

1. Backend health: `GET http://localhost:5000/api/auth/me` → should return 401 (correct, no token)
2. Frontend: Open `http://localhost:5173` → landing page should load

---

## Project Structure

### Backend (`backend/`)

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Sequelize connection (SQLite/PostgreSQL)
│   ├── controllers/
│   │   ├── authController.js    # Register, login, OTP, profile, password
│   │   ├── machineryController.js # Machinery listing CRUD
│   │   ├── partsController.js   # Spare parts marketplace CRUD
│   │   ├── operatorController.js # Operator profiles CRUD
│   │   ├── mechanicController.js # Mechanic profiles CRUD
│   │   ├── reviewController.js  # Review system
│   │   ├── bookingController.js # Rental booking flow
│   │   ├── chatController.js    # Chat (HTTP polling)
│   │   └── adminController.js   # Admin dashboard & approvals
│   ├── middleware/
│   │   └── auth.js              # JWT authenticate & optionalAuth
│   ├── models/
│   │   ├── User.js
│   │   ├── MachineryListing.js
│   │   ├── PartListing.js
│   │   ├── OperatorProfile.js
│   │   ├── MechanicProfile.js
│   │   ├── Chat.js              # Chat + Message models
│   │   ├── Review.js
│   │   ├── RentalBooking.js
│   │   ├── Transaction.js
│   │   └── index.js             # Model associations
│   ├── routes/
│   │   └── index.js             # All API route registrations
│   └── server.js                # Express app entry point
├── .env
└── package.json
```

### Frontend (`app/`)

```
app/
├── src/
│   ├── components/
│   │   └── SearchOverlay.tsx    # Global search modal
│   ├── contexts/
│   │   └── AuthContext.tsx      # Auth state provider
│   ├── pages/
│   │   ├── LoginPage.tsx        # Phone/password + OTP login
│   │   ├── RegisterPage.tsx     # User registration
│   │   ├── VerifyOtpPage.tsx    # OTP verification
│   │   ├── ProfilePage.tsx      # Edit user profile
│   │   ├── ChangePasswordPage.tsx
│   │   ├── BrowsePage.tsx       # Machinery search + filters
│   │   ├── ListingDetailPage.tsx # Single listing view
│   │   ├── CreateListingPage.tsx # 3-step listing form + image upload
│   │   ├── MyListingsPage.tsx   # Manage own listings
│   │   ├── PartsPage.tsx        # Spare parts marketplace
│   │   ├── OperatorsPage.tsx    # Operator directory
│   │   ├── MechanicsPage.tsx    # Mechanic directory
│   │   ├── BookingsPage.tsx     # Rental bookings dashboard
│   │   ├── ChatsPage.tsx        # Messaging inbox
│   │   └── AdminPage.tsx        # Admin dashboard
│   ├── services/
│   │   ├── api.ts               # Centralized API client (all endpoints)
│   │   └── emailService.ts      # EmailJS wrapper
│   ├── App.tsx                  # Landing page (10 sections + GSAP)
│   ├── App.css                  # Component-specific styles
│   ├── index.css                # Global design system
│   ├── main.tsx                 # Entry point (Router + AuthProvider)
│   └── router.tsx               # All route definitions
├── vite.config.ts               # Vite config with /api proxy
└── package.json
```

---

## Backend API Reference

All endpoints are prefixed with `/api`. Auth-protected routes require `Authorization: Bearer <token>`.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | ❌ | Register new user |
| `POST` | `/auth/login` | ❌ | Login with phone + password |
| `POST` | `/auth/send-otp` | ❌ | Send OTP to phone |
| `POST` | `/auth/verify-otp` | ❌ | Verify OTP and login |
| `POST` | `/auth/refresh-token` | ❌ | Refresh JWT token |
| `GET` | `/auth/me` | ✅ | Get current user profile |
| `PUT` | `/auth/profile` | ✅ | Update user profile |
| `PUT` | `/auth/change-password` | ✅ | Change password |

**Register payload:**
```json
{
  "phone": "9876543210",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "userType": "buyer"
}
```

**Login payload:**
```json
{ "phone": "9876543210", "password": "password123" }
```

**Response (login/register):**
```json
{
  "message": "Login successful",
  "user": { "id": "uuid", "firstName": "John", ... },
  "token": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

---

### Machinery Listings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/machinery` | ✅ | Create listing |
| `GET` | `/machinery` | Optional | Browse with filters |
| `GET` | `/machinery/categories` | ❌ | Get category tree |
| `GET` | `/machinery/my-listings` | ✅ | Get own listings |
| `GET` | `/machinery/:id` | Optional | Get single listing |
| `PUT` | `/machinery/:id` | ✅ | Update listing |
| `DELETE` | `/machinery/:id` | ✅ | Delete listing |
| `PUT` | `/machinery/:id/mark-sold` | ✅ | Mark as sold/rented |
| `PUT` | `/machinery/:id/renew` | ✅ | Renew expired listing |

**Query parameters for `GET /machinery`:**
- `page`, `limit` — pagination
- `category` — construction, mining, agriculture, industrial
- `listingType` — sale, rent
- `make`, `model` — text filters
- `minPrice`, `maxPrice` — price range
- `city`, `state` — location
- `condition` — new, used, refurbished
- `sortBy` — createdAt, price, viewCount
- `sortOrder` — ASC, DESC

**Create listing payload (with base64 images):**
```json
{
  "listingType": "sale",
  "category": "construction",
  "subCategory": "Excavators",
  "make": "Tata Hitachi",
  "model": "EX200",
  "year": 2020,
  "price": 2500000,
  "condition": "used",
  "hoursUsed": 5000,
  "description": "Well maintained excavator",
  "city": "Mumbai",
  "state": "Maharashtra",
  "images": ["data:image/jpeg;base64,/9j/4AAQ..."]
}
```

---

### Parts Marketplace

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/parts` | ✅ | Create part listing |
| `GET` | `/parts` | ❌ | Browse parts (filters: category, condition, price, location) |
| `GET` | `/parts/my-parts` | ✅ | Get own part listings |
| `GET` | `/parts/:id` | ❌ | Get single part |
| `DELETE` | `/parts/:id` | ✅ | Delete part listing |

**Categories:** engine, hydraulics, electrical, undercarriage, cab, attachments, other
**Conditions:** new, used, oem, aftermarket, refurbished

---

### Operators

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/operators/profile` | ✅ | Create/update operator profile |
| `GET` | `/operators` | ❌ | Browse operators (filters: city, state, rate, availability) |
| `GET` | `/operators/my-profile` | ✅ | Get own profile |
| `GET` | `/operators/:id` | ❌ | Get operator by ID |

---

### Mechanics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/mechanics/profile` | ✅ | Create/update mechanic profile |
| `GET` | `/mechanics` | ❌ | Browse mechanics (filters: city, state, rate, availability) |
| `GET` | `/mechanics/my-profile` | ✅ | Get own profile |
| `GET` | `/mechanics/:id` | ❌ | Get mechanic by ID |

---

### Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/reviews` | ✅ | Create review (rating 1-5 + comment) |
| `GET` | `/reviews` | ❌ | Get reviews (filters: userId, entityId, reviewType) |
| `PUT` | `/reviews/:id/respond` | ✅ | Respond to review (reviewee only) |

**Review types:** listing, user, operator, mechanic, rental

---

### Rental Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/bookings` | ✅ | Create rental booking |
| `GET` | `/bookings` | ✅ | Get my bookings (`?role=renter` or `?role=owner`) |
| `PUT` | `/bookings/:id/status` | ✅ | Update status (confirmed/active/completed/cancelled) |

**Booking auto-calculates:**
- Duration (days between start/end)
- Total rental amount (rate × days)
- Security deposit (20% of total)
- Platform commission (10% of total)

---

### Chat (HTTP Polling)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/chats` | ✅ | Start or get existing chat |
| `GET` | `/chats` | ✅ | Get all my chats |
| `GET` | `/chats/:chatId/messages` | ✅ | Get messages (marks as read) |
| `POST` | `/chats/:chatId/messages` | ✅ | Send message |

> **Note:** Frontend polls for new messages every 5 seconds. No WebSocket/Socket.io in POC.

---

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/admin/dashboard` | ✅ | Get stats (users, listings, parts, etc.) |
| `GET` | `/admin/pending-listings` | ✅ | Get listings pending approval |
| `PUT` | `/admin/listings/:id/approve` | ✅ | Approve listing |
| `PUT` | `/admin/listings/:id/reject` | ✅ | Reject listing |
| `GET` | `/admin/users` | ✅ | List all users |

> **Note:** No admin role check yet — any authenticated user can access admin routes. Add role-based middleware for production.

---

### Newsletter

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/newsletter/subscribe` | ❌ | Subscribe email (logged to console) |

---

## Frontend Pages & Routes

| Route | Page Component | Auth Required | Description |
|-------|---------------|---------------|-------------|
| `/` | `App.tsx` | ❌ | Landing page (10 GSAP-animated sections) |
| `/login` | `LoginPage` | ❌ | Phone + password / OTP login |
| `/register` | `RegisterPage` | ❌ | User registration with user-type selector |
| `/verify-otp` | `VerifyOtpPage` | ❌ | 6-digit OTP verification |
| `/profile` | `ProfilePage` | ✅ | Edit user profile |
| `/change-password` | `ChangePasswordPage` | ✅ | Change password |
| `/browse` | `BrowsePage` | ❌ | Machinery search with URL-based filters |
| `/listing/:id` | `ListingDetailPage` | ❌ | Listing detail + image gallery |
| `/sell` | `CreateListingPage` | ✅ | 3-step create listing form + image upload |
| `/my-listings` | `MyListingsPage` | ✅ | Manage own listings (sold/renew/delete) |
| `/parts` | `PartsPage` | ❌ | Spare parts marketplace |
| `/operators` | `OperatorsPage` | ❌ | Operator hiring directory |
| `/mechanics` | `MechanicsPage` | ❌ | Mechanic hiring directory |
| `/bookings` | `BookingsPage` | ✅ | Rental bookings (renter/owner views) |
| `/chats` | `ChatsPage` | ✅ | Chat inbox with conversation view |
| `/admin` | `AdminPage` | ✅ | Admin dashboard + approval queue |
| `*` | 404 page | ❌ | Catch-all not found |

---

## Authentication Flow

```
User registers
  ├── POST /api/auth/register
  ├── Backend creates user + returns JWT + refreshToken
  ├── Frontend stores tokens in localStorage (ys_token, ys_refresh_token)
  └── AuthContext loads user via GET /api/auth/me

User logs in (password)
  ├── POST /api/auth/login { phone, password }
  └── Same token flow as register

User logs in (OTP)
  ├── POST /api/auth/send-otp { phone }
  │   └── OTP is logged to backend console (dev mode)
  ├── POST /api/auth/verify-otp { phone, otp }
  └── Same token flow as register

Token refresh (automatic)
  ├── When any request returns 401
  ├── POST /api/auth/refresh-token { refreshToken }
  └── New tokens stored, original request retried

Logout
  └── Clears localStorage tokens + AuthContext state
```

**Token storage keys:**
- `ys_token` — JWT access token
- `ys_refresh_token` — JWT refresh token

---

## Design System

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#FF6A00` | CTAs, accents, links |
| Background | `#E9E3DA` | Page backgrounds |
| Text Primary | `#101214` | Headings, body |
| Text Secondary | `#6F757C` | Labels, captions |
| White | `#FFFFFF` | Cards, inputs |

### Typography
| Font | Usage |
|------|-------|
| **Sora** (700, 800) | Headings, brand, buttons |
| **Inter** (400, 500) | Body text, inputs |
| **IBM Plex Mono** (500) | Labels, tags, monospace |

### Button Classes
- `.btn-primary` — Orange filled CTA
- `.btn-secondary` — Outlined/ghost button

---

## Feature Modules

### Module 1: Machinery Marketplace (P2)
- **Browse** with 10+ filter params and URL-based state
- **Create** 3-step wizard (Machine Info → Pricing/Location → Photos/Description)
- **Image upload**: Files selected → FileReader → base64 data URI → sent in JSON body
- **My Listings**: Status management (mark sold, renew expired, delete)

### Module 2: Parts Marketplace (P5)
- Browse spare parts with category chip filters (engine, hydraulics, etc.)
- Condition filter dropdown (new, used, OEM, aftermarket, refurbished)
- Card grid with image, price, location, view count

### Module 3: Service Directories (P5)
- **Operators**: Profile cards with experience, equipment types, certifications, day rate
- **Mechanics**: Profile cards with specializations, brand expertise, service radius, hourly/daily rates
- Both support city filter + availability toggle

### Module 4: Chat System (P5)
- Sidebar shows all conversations sorted by last message
- Message view with sender-colored bubbles (orange = self, stone = other)
- Auto-scroll to bottom on new messages
- **Polls every 5 seconds** for new messages (no WebSocket)
- Unread counts tracked per participant

### Module 5: Rental Bookings (P5)
- Create booking from listing detail page
- Auto-calculates: total = rate × days + 20% deposit + 10% commission
- Owner can confirm/reject; renter can cancel
- Status flow: pending → confirmed → active → completed/cancelled

### Module 6: Admin Dashboard (P5)
- 8 stat cards: Users, Listings, Parts, Operators, Mechanics, Bookings, Reviews, Pending
- Pending approvals queue with approve/reject buttons
- All counts come from database aggregation

### Module 7: EmailJS Integration (P5)
- Client-side email via EmailJS REST API (no SDK dependency)
- **Dev mode**: Falls back to `console.log` if env vars not set
- Pre-built templates: booking confirmation, contact seller, welcome email

---

## Testing Guide

### Prerequisites for All Tests
1. Backend running: `cd backend && npm run dev`
2. Frontend running: `cd app && npm run dev`
3. Both terminals should show no errors

### Test Case 1: User Registration & Login

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/register` | Registration form with name, phone, password fields |
| 2 | Fill in: First=Test, Last=User, Phone=9999999999, Password=test1234 | All fields accept input |
| 3 | Click "Create Account" | Redirects to `/verify-otp` |
| 4 | Check backend console for OTP | OTP printed as `🔐 OTP for 9999999999: XXXXXX` |
| 5 | Enter OTP on verify page | Redirects to homepage, user icon changes to profile icon |
| 6 | Navigate to `/profile` | Shows user details |
| 7 | Click logout | Returns to login state |
| 8 | Navigate to `/login`, enter phone + password | Logs in successfully |

### Test Case 2: Create Machinery Listing

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login (if not already) | Authenticated |
| 2 | Click "Post a Listing" (nav) or navigate to `/sell` | 3-step form appears |
| 3 | Step 1: Select Sale, Category=Construction, Make=Tata, Model=EX200, Year=2020 | Fields filled |
| 4 | Click "Next" | Step 2 (Pricing) appears |
| 5 | Enter Price=2500000, City=Mumbai, State=Maharashtra | Fields filled |
| 6 | Click "Next" | Step 3 (Photos & Description) appears |
| 7 | Click "Add" image button, select image files | Thumbnails appear with remove button |
| 8 | Enter description, click "Publish" | Redirects to `/my-listings` |
| 9 | Verify listing appears in My Listings | Status shows, management actions visible |

### Test Case 3: Browse & Search

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click search icon (🔍) in nav | Search overlay opens with text input |
| 2 | Type "excavator", press Enter | Navigates to `/browse?query=excavator` |
| 3 | Click category chips to filter | Listings filter accordingly |
| 4 | Verify pagination works | Page numbers update |

### Test Case 4: Parts Marketplace

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/parts` | Parts page with category chips loads |
| 2 | Click "Engine" chip | Filters to engine parts only |
| 3 | Change "All Conditions" dropdown to "New" | Filters to new parts |
| 4 | Verify empty state message appears if no parts | "No parts found" with icon |

### Test Case 5: Service Directories

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/operators` | Operator directory with filter inputs |
| 2 | Toggle "Available only" checkbox | Filters operators |
| 3 | Navigate to `/mechanics` | Mechanic directory loads |
| 4 | Type city name in filter | Filters by city |

### Test Case 6: Chat System

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as User A | Authenticated |
| 2 | Navigate to `/chats` | Inbox with "No conversations yet" |
| 3 | (API call) Start chat with another user via `POST /api/chats` | Chat created |
| 4 | Chat appears in sidebar | Conversation listed |
| 5 | Click conversation | Message pane opens |
| 6 | Type message, press Enter or click Send | Message appears in orange bubble |
| 7 | Wait 5 seconds | Polling fetches any new messages |

### Test Case 7: Rental Bookings

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | (API call) Create booking via `POST /api/bookings` | Booking created with auto-pricing |
| 2 | Navigate to `/bookings` | Booking card with status, pricing |
| 3 | Toggle "As Renter" / "As Owner" | Shows different views |
| 4 | (As owner) Click "Confirm" | Status changes to confirmed |
| 5 | (As renter) Click "Cancel" | Status changes to cancelled |

### Test Case 8: Admin Dashboard

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/admin` | Dashboard with 8 stat cards |
| 2 | Verify user count matches registered users | Count is accurate |
| 3 | If pending listings exist | Approval queue shows with Approve/Reject |
| 4 | Click "Approve" on a listing | Listing removed from queue, counters update |

### Test Case 9: Newsletter Subscription

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Scroll to footer on homepage | Newsletter form visible |
| 2 | Enter valid email, click "Subscribe" | Green "✓ Subscribed!" message |
| 3 | Check backend console | `📧 Newsletter subscription: email@test.com` logged |
| 4 | Enter invalid email (no @), click Subscribe | Red error message |

### Test Case 10: Footer Navigation

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Browse" under Buy | Navigates to `/browse?type=sale` |
| 2 | Click "List a Machine" under Sell | Navigates to `/sell` (or `/login` if unauthenticated) |
| 3 | Click "Short-term" under Rent | Navigates to `/browse?type=rent` |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 5000 | Server port |
| `NODE_ENV` | No | development | Environment |
| `DB_DIALECT` | Yes | — | `sqlite` or `postgres` |
| `DB_STORAGE` | For SQLite | — | Path to SQLite file |
| `DB_HOST` | For Postgres | — | Database host |
| `DB_PORT` | For Postgres | 5432 | Database port |
| `DB_NAME` | For Postgres | — | Database name |
| `DB_USER` | For Postgres | — | Database user |
| `DB_PASSWORD` | For Postgres | — | Database password |
| `JWT_SECRET` | Yes | — | JWT signing secret |
| `JWT_REFRESH_SECRET` | Yes | — | Refresh token secret |
| `JWT_EXPIRY` | No | 24h | Access token expiry |
| `JWT_REFRESH_EXPIRY` | No | 7d | Refresh token expiry |

### Frontend (`app/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | `/api` | API base URL (proxy in dev) |
| `VITE_EMAILJS_SERVICE_ID` | No | `service_demo` | EmailJS service ID |
| `VITE_EMAILJS_TEMPLATE_ID` | No | `template_demo` | EmailJS template ID |
| `VITE_EMAILJS_PUBLIC_KEY` | No | `demo_key` | EmailJS public key |

---

## Known Limitations & POC Notes

| Item | Current State | Production Recommendation |
|------|--------------|--------------------------|
| **SMS/OTP** | OTPs logged to console | Integrate MSG91 or Twilio |
| **Image storage** | Base64 in SQLite JSON field | AWS S3 or Cloudinary |
| **Chat** | HTTP polling every 5s | Socket.io or WebSocket |
| **Payments** | Not implemented | Razorpay integration |
| **Admin auth** | Any logged-in user can access `/admin` | Add role-based middleware |
| **Email** | EmailJS client-side (dev fallback) | SendGrid or SES on server |
| **Database** | SQLite (single file) | PostgreSQL for production |
| **File size limits** | 50MB JSON body | Use multipart/form-data + S3 |
| **Search** | Basic SQL LIKE queries | Elasticsearch or MeiliSearch |
| **Rate limiting** | Basic Express rate limit | Redis-backed rate limiting |
| **HTTPS** | None (dev only) | TLS termination via Nginx/Cloudflare |

---

## Database Models

| Model | Table | Key Fields |
|-------|-------|-----------|
| `User` | `users` | phone, email, firstName, lastName, userType, isVerified |
| `MachineryListing` | `machinery_listings` | make, model, year, price, listingType, category, images, status |
| `PartListing` | `part_listings` | partName, partNumber, category, condition, price, images |
| `OperatorProfile` | `operator_profiles` | yearsOfExperience, equipmentTypes, dayRate, certifications |
| `MechanicProfile` | `mechanic_profiles` | specializations, brandExpertise, hourlyRate, serviceRadius |
| `Chat` | `chats` | buyerId, sellerId, listingId, lastMessageAt, unreadCounts |
| `Message` | `messages` | chatId, senderId, content, messageType, isRead |
| `Review` | `reviews` | reviewerId, revieweeId, reviewType, rating, comment |
| `RentalBooking` | `rental_bookings` | listingId, ownerId, renterId, dates, amounts, status |
| `Transaction` | `transactions` | userId, type, amount, status (placeholder for payments) |

---

*Generated for YantraSetu development team — 2026-03-26*
