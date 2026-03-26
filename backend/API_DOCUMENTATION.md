# YantraSetu API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://api.yantrasetu.com/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Auth Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "individual"
}
```

**Response:**
```json
{
  "message": "User registered successfully.",
  "user": {
    "id": "uuid",
    "phone": "+919876543210",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "individual",
    "isVerified": false
  },
  "token": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "password": "securepassword"
}
```

### Send OTP
```http
POST /auth/send-otp
```

**Request Body:**
```json
{
  "phone": "+919876543210"
}
```

### Verify OTP
```http
POST /auth/verify-otp
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "companyName": "JD Contractors",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001"
}
```

---

## Machinery Listings

### Create Listing
```http
POST /machinery
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "listingType": "sale",
  "category": "construction",
  "subCategory": "Excavators",
  "make": "Tata Hitachi",
  "model": "EX200",
  "year": 2019,
  "hoursUsed": 3500,
  "condition": "used",
  "price": 4200000,
  "description": "Well maintained excavator with all documents",
  "city": "Mumbai",
  "state": "Maharashtra",
  "images": ["url1", "url2", "url3"]
}
```

### Get All Listings
```http
GET /machinery?page=1&limit=20&category=construction&listingType=sale
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `category` - Filter by category
- `subCategory` - Filter by sub-category
- `make` - Filter by make
- `model` - Filter by model
- `listingType` - sale or rent
- `condition` - new, used, refurbished
- `minPrice`, `maxPrice` - Price range
- `minYear`, `maxYear` - Year range
- `city`, `state` - Location filters
- `lat`, `lng`, `radius` - Location-based search
- `sortBy` - createdAt, price, year
- `sortOrder` - ASC, DESC

**Response:**
```json
{
  "listings": [
    {
      "id": "uuid",
      "listingType": "sale",
      "category": "construction",
      "subCategory": "Excavators",
      "make": "Tata Hitachi",
      "model": "EX200",
      "year": 2019,
      "price": 4200000,
      "condition": "used",
      "city": "Mumbai",
      "state": "Maharashtra",
      "images": ["url1", "url2"],
      "isVerified": true,
      "viewCount": 150,
      "owner": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "companyName": "JD Contractors",
        "rating": 4.5
      }
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 5,
    "limit": 20
  }
}
```

### Get Single Listing
```http
GET /machinery/:id
```

**Response:**
```json
{
  "listing": {
    "id": "uuid",
    "listingType": "sale",
    "category": "construction",
    "subCategory": "Excavators",
    "make": "Tata Hitachi",
    "model": "EX200",
    "year": 2019,
    "hoursUsed": 3500,
    "condition": "used",
    "price": 4200000,
    "priceNegotiable": true,
    "description": "Well maintained excavator",
    "city": "Mumbai",
    "state": "Maharashtra",
    "images": ["url1", "url2", "url3"],
    "videoUrl": "video_url",
    "rcBookUrl": "doc_url",
    "insuranceUrl": "doc_url",
    "inspectionReportUrl": "doc_url",
    "isVerified": true,
    "viewCount": 150,
    "contactUnlockCount": 12,
    "owner": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "companyName": "JD Contractors",
      "rating": 4.5,
      "userType": "dealer",
      "city": "Mumbai",
      "state": "Maharashtra"
    }
  },
  "otherListingsFromSeller": [...]
}
```

### Update Listing
```http
PUT /machinery/:id
Authorization: Bearer <token>
```

### Delete Listing
```http
DELETE /machinery/:id
Authorization: Bearer <token>
```

### Get My Listings
```http
GET /machinery/my-listings
Authorization: Bearer <token>
```

### Mark as Sold/Rented
```http
PUT /machinery/:id/mark-sold
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "sold"
}
```

### Renew Listing
```http
PUT /machinery/:id/renew
Authorization: Bearer <token>
```

### Get Categories
```http
GET /machinery/categories
```

**Response:**
```json
{
  "categories": {
    "construction": ["Excavators", "Cranes", "Bulldozers", ...],
    "mining": ["Dumpers", "Drills", "Loaders", ...],
    "agriculture": ["Tractors", "Harvesters", ...],
    "industrial": ["Forklifts", "Compressors", ...]
  },
  "makes": ["Tata Hitachi", "JCB", "Komatsu", ...]
}
```

---

## Rental Endpoints (Coming Soon)

### Create Rental Booking
```http
POST /rentals
Authorization: Bearer <token>
```

### Get Rental Details
```http
GET /rentals/:id
Authorization: Bearer <token>
```

### Confirm Rental
```http
PUT /rentals/:id/confirm
Authorization: Bearer <token>
```

### Release Security Deposit
```http
PUT /rentals/:id/release-deposit
Authorization: Bearer <token>
```

---

## Parts Marketplace (Coming Soon)

### Create Part Listing
```http
POST /parts
Authorization: Bearer <token>
```

### Get Parts
```http
GET /parts?partNumber=ABC123&make=Tata
```

---

## Operator/Mechanic Hiring (Coming Soon)

### Create Operator Profile
```http
POST /operators/profile
Authorization: Bearer <token>
```

### Get Operators
```http
GET /operators?city=Mumbai&equipmentType=Excavator
```

### Create Mechanic Profile
```http
POST /mechanics/profile
Authorization: Bearer <token>
```

### Get Mechanics
```http
GET /mechanics?city=Mumbai&specialization=Hydraulics
```

---

## Chat System (Coming Soon)

### Get Chats
```http
GET /chats
Authorization: Bearer <token>
```

### Get Chat Messages
```http
GET /chats/:chatId/messages
Authorization: Bearer <token>
```

### Send Message
```http
POST /chats/:chatId/messages
Authorization: Bearer <token>
```

---

## Payment Endpoints (Coming Soon)

### Create Payment Order
```http
POST /payments/create-order
Authorization: Bearer <token>
```

### Verify Payment
```http
POST /payments/verify
Authorization: Bearer <token>
```

### Get Transactions
```http
GET /payments/transactions
Authorization: Bearer <token>
```

---

## Admin Endpoints (Coming Soon)

### Get Dashboard Stats
```http
GET /admin/dashboard
Authorization: Bearer <token>
```

### Get Pending Listings
```http
GET /admin/listings/pending
Authorization: Bearer <token>
```

### Approve/Reject Listing
```http
PUT /admin/listings/:id/verify
Authorization: Bearer <token>
```

### Get Users
```http
GET /admin/users
Authorization: Bearer <token>
```

### Ban User
```http
PUT /admin/users/:id/ban
Authorization: Bearer <token>
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation Error",
  "errors": ["Field is required", "Invalid format"]
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required."
}
```

### 403 Forbidden
```json
{
  "message": "Access denied."
}
```

### 404 Not Found
```json
{
  "message": "Resource not found."
}
```

### 409 Conflict
```json
{
  "message": "Duplicate Entry",
  "errors": ["Phone number already registered."]
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Rate Limits

- General API: 100 requests per 15 minutes per IP
- Authentication: 10 requests per minute per IP
- File uploads: 10 requests per hour per user

---

## Webhooks (Coming Soon)

### Razorpay Webhook
```
POST /webhooks/razorpay
```

---

## Socket.io Events (Coming Soon)

### Connection
```javascript
const socket = io('ws://api.yantrasetu.com', {
  auth: { token: 'jwt_token' }
});
```

### Events
- `message:new` - New message received
- `message:read` - Message read receipt
- `chat:typing` - Typing indicator
- `notification:new` - New notification
