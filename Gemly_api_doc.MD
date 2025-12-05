# Diamond Trading Platform - Complete Backend API Specification

**Version:** 2.0  
**Date:** December 2024  
**Status:** Production Ready ✅  
**Purpose:** Complete reference for backend developers

---

## Tech Stack

```

Backend: Node.js + Express + TypeScript
Database: MongoDB + Mongoose
Storage: Firebase Storage (No need for now)
Push: Firebase Cloud Messaging (FCM) 
Real-time: Socket.IO
Payment: Stripe Connect
Auth: JWT 
Validation: Joi
```

---

## Base URL

All endpoints: `/api/v1/`

Example: `POST /api/v1/auth/register`

---

## Global Response Format

### Success (200/201)
```json
{
  "success": true,
  "data": { },
  "message": "Operation successful"
}
```

### Error (4xx/5xx)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## HTTP Status Codes

- **200** OK - Successful GET/PUT/DELETE
- **201** Created - Successful POST
- **400** Bad Request - Validation failed
- **401** Unauthorized - Missing/invalid token
- **403** Forbidden - No permission
- **404** Not Found - Resource not found
- **409** Conflict - Duplicate or invalid state
- **422** Unprocessable - Business rule violation
- **500** Server Error - Unexpected error

---

## Authentication

All endpoints (except register/login) require JWT:

```
Authorization: Bearer <JWT_TOKEN>
```

---

# API Endpoints (42 Total)

## 1. Authentication API (6 endpoints)

### 1.1 POST /api/v1/auth/register

**Purpose:** Register new user

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Pass123!",
  "confirmPassword": "Pass123!",
  "userType": "buyer"
}
```

**Validation:**
- email: required, valid format, unique
- password: min 8, 1 upper, 1 lower, 1 number
- userType: enum ["buyer", "seller"]

**Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "status": "PENDING_KYC"
  }
}
```

---

### 1.2 POST /api/v1/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Pass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "data": {
    "userId": "...",
    "status": "APPROVED",
    "role": "USER"
  }
}
```

---

### 1.3 POST /api/v1/auth/verify-identity

**Request:** multipart/form-data

**Fields:**
- fullName (string, required)
- dateOfBirth (YYYY-MM-DD, required)
- phoneNumber (string, required)
- identityProofType (enum: ["Aadhar", "PAN"], required)
- identityProofNumber (string, required)
- aadharDocument (file, optional, max 5MB)
- panDocument (file, optional, max 5MB)
- companyName (string, required)
- companyAddress (object, required)

**Response (200):**
```json
{
  "success": true,
  "message": "KYC submitted. Awaiting approval."
}
```

---

### 1.4 GET /api/v1/auth/profile

Get current user profile.

**Response (200):** Returns full user profile with KYC data.

---

### 1.5 PUT /api/v1/auth/profile

Update profile fields (phone, address only).

---

### 1.6 POST /api/v1/auth/logout

Invalidate JWT token.

---

## 2. Requirements API (5 endpoints)

### 2.1 POST /api/v1/requirements

**Purpose:** Post diamond requirement with COMPLETE specification

**Request Body (ALL FIELDS):**
```json
{
  "title": "string, max 200 chars, required",
  "description": "string, max 2000 chars, optional",
  
  "diamondType": "Natural|Lab-Grown|Simulated, required",
  "labGrownMethod": "HPHT|CVD|Any, required if Lab-Grown",
  "treatmentStatus": "Untreated|Treated|Any, optional",
  "treatmentTypes": ["array of strings, optional"],
  "originCountry": ["array of country codes, optional"],
  "mineOrigin": ["array of mine names, optional"],
  
  "certified": "boolean, required",
  "preferredLabs": ["GIA", "IGI", "AGS", "HRD", "EGL"],
  "requiresInscription": "boolean, optional",
  
  "shapes": ["ROUND", "PRINCESS", "CUSHION", ...],
  
  "caratMin": "number, required, min 0.01",
  "caratMax": "number, required, >= caratMin",
  
  "measurements": {
    "lengthMin": "number in mm, optional",
    "lengthMax": "number in mm, optional",
    "widthMin": "number in mm, optional",
    "widthMax": "number in mm, optional",
    "depthMin": "number in mm, optional",
    "depthMax": "number in mm, optional",
    "lengthWidthRatioMin": "number, optional",
    "lengthWidthRatioMax": "number, optional"
  },
  
  "cutGrades": ["EXCELLENT", "VERY_GOOD", "GOOD", "FAIR", "POOR"],
  "polish": ["array, optional"],
  "symmetry": ["array, optional"],
  
  "depthPercentMin": "number 0-100, optional",
  "depthPercentMax": "number 0-100, optional",
  "tablePercentMin": "number 0-100, optional",
  "tablePercentMax": "number 0-100, optional",
  "crownAngleMin": "number in degrees, optional",
  "crownAngleMax": "number in degrees, optional",
  "crownHeightMin": "number percentage, optional",
  "crownHeightMax": "number percentage, optional",
  "pavilionAngleMin": "number in degrees, optional",
  "pavilionAngleMax": "number in degrees, optional",
  "pavilionDepthMin": "number percentage, optional",
  "pavilionDepthMax": "number percentage, optional",
  "girdleThickness": ["array, optional"],
  "culetSize": ["array, optional"],
  
  "colorType": "Standard|Fancy, required",
  "colorGrades": ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"],
  "fancyColorGrades": [{
    "intensity": "string, required",
    "modifier": "string, optional",
    "primaryHue": "string, required",
    "secondaryHue": "string, optional"
  }],
  "colorOrigin": "Natural|Treated|Any, optional",
  "colorDistribution": "Even|Uneven|Any, optional",
  
  "clarityGrades": ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1"],
  "eyeClean": "boolean, optional",
  "inclusionTypes": ["array, optional"],
  
  "fluorescence": ["NONE", "FAINT", "MEDIUM", "STRONG", "VERY_STRONG"],
  "fluorescenceColor": ["array, optional"],
  
  "brilliance": "string, optional",
  "fire": "string, optional",
  "scintillation": "string, optional",
  
  "budgetMin": "number, optional",
  "budgetMax": "number, optional, >= budgetMin",
  "currency": "string, default USD",
  "pricePerCarat": "boolean, optional",
  
  "conflictFree": "boolean, optional",
  "ethicalSourcing": "boolean, optional",
  "sustainabilityPreference": "string, optional",
  
  "intendedUse": "string, optional",
  "settingType": "string, optional",
  "metalType": ["array, optional"],
  
  "locationPreference": {
    "countries": ["array, optional"],
    "cities": ["array, optional"],
    "regions": ["array, optional"],
    "excludeCountries": ["array, optional"]
  },
  
  "shippingPreference": {
    "method": ["array, optional"],
    "requiresSignature": "boolean, optional",
    "requiresInsurance": "boolean, optional",
    "maxShippingDays": "number, optional"
  },
  
  "insuranceRequired": "boolean, optional",
  "inspectionPeriod": "number in days, optional",
  
  "deadline_start": "ISO 8601 timestamp, optional",
  "deadline_end": "ISO 8601 timestamp, required",
  "deliveryTimeline": "ISO 8601 timestamp, required",
  "flexibleTimeline": "boolean, optional",
  
  "brandPreference": ["array, optional"],
  "exclusions": ["array, optional"],
  
  "matching": {
    "requiresMatching": "boolean",
    "quantity": "number",
    "matchingTolerance": {
      "caratVariance": "number",
      "colorVariance": "number",
      "clarityVariance": "number"
    }
  },
  
  "tradeInAvailable": "boolean, optional",
  "requiresAppraisal": "boolean, optional",
  "requiresGradingReport": "boolean, optional",
  "requiresOriginReport": "boolean, optional"
}
```

**Business Logic:**
1. Verify user status = APPROVED
2. Validate all fields with Joi
3. Create requirement with status = ACTIVE
4. Match against notification preferences
5. Send notifications to matched sellers
6. Schedule auto-expire at deadline_end

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "req_...",
    "status": "ACTIVE",
    "views": 0,
    "bidsReceived": 0,
    "createdAt": "...",
    ... all request fields
  }
}
```

**Mongoose Schema:**
```typescript
interface IRequirement extends Document {
  userId: ObjectId;
  title: string;
  description?: string;
  
  // Diamond Type & Origin
  diamondType: 'Natural' | 'Lab-Grown' | 'Simulated';
  labGrownMethod?: 'HPHT' | 'CVD' | 'Any';
  treatmentStatus?: 'Untreated' | 'Treated' | 'Any';
  treatmentTypes?: string[];
  originCountry?: string[];
  mineOrigin?: string[];
  
  // Certification
  certified: boolean;
  preferredLabs?: string[];
  requiresInscription?: boolean;
  
  // Shape
  shapes: string[];
  
  // Carat
  caratMin: number;
  caratMax: number;
  
  // Measurements
  measurements?: {
    lengthMin?: number;
    lengthMax?: number;
    widthMin?: number;
    widthMax?: number;
    depthMin?: number;
    depthMax?: number;
    lengthWidthRatioMin?: number;
    lengthWidthRatioMax?: number;
  };
  
  // Cut Quality
  cutGrades: string[];
  polish?: string[];
  symmetry?: string[];
  
  // Proportions
  depthPercentMin?: number;
  depthPercentMax?: number;
  tablePercentMin?: number;
  tablePercentMax?: number;
  crownAngleMin?: number;
  crownAngleMax?: number;
  crownHeightMin?: number;
  crownHeightMax?: number;
  pavilionAngleMin?: number;
  pavilionAngleMax?: number;
  pavilionDepthMin?: number;
  pavilionDepthMax?: number;
  girdleThickness?: string[];
  culetSize?: string[];
  
  // Color
  colorType: 'Standard' | 'Fancy';
  colorGrades?: string[];
  fancyColorGrades?: Array<{
    intensity: string;
    modifier?: string;
    primaryHue: string;
    secondaryHue?: string;
  }>;
  colorOrigin?: 'Natural' | 'Treated' | 'Any';
  colorDistribution?: 'Even' | 'Uneven' | 'Any';
  
  // Clarity
  clarityGrades: string[];
  eyeClean?: boolean;
  inclusionTypes?: string[];
  
  // Fluorescence
  fluorescence?: string[];
  fluorescenceColor?: string[];
  
  // Optical
  brilliance?: string;
  fire?: string;
  scintillation?: string;
  
  // Budget
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  pricePerCarat?: boolean;
  
  // Ethical
  conflictFree?: boolean;
  ethicalSourcing?: boolean;
  sustainabilityPreference?: string;
  
  // Setting
  intendedUse?: string;
  settingType?: string;
  metalType?: string[];
  
  // Location
  locationPreference?: {
    countries?: string[];
    cities?: string[];
    regions?: string[];
    excludeCountries?: string[];
  };
  
  // Shipping
  shippingPreference?: {
    method?: string[];
    requiresSignature?: boolean;
    requiresInsurance?: boolean;
    maxShippingDays?: number;
  };
  
  insuranceRequired?: boolean;
  inspectionPeriod?: number;
  
  // Timing
  deadline_start?: Date;
  deadline_end: Date;
  deliveryTimeline: Date;
  flexibleTimeline?: boolean;
  
  // Additional
  brandPreference?: string[];
  exclusions?: string[];
  matching?: {
    requiresMatching: boolean;
    quantity: number;
    matchingTolerance: {
      caratVariance: number;
      colorVariance: number;
      clarityVariance: number;
    };
  };
  tradeInAvailable?: boolean;
  requiresAppraisal?: boolean;
  requiresGradingReport?: boolean;
  requiresOriginReport?: boolean;
  
  // System fields
  status: 'ACTIVE' | 'EXPIRED' | 'CLOSED' | 'IN_DEAL';
  views: number;
  bidsReceived: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**ENUMS:**
```typescript
DIAMOND_TYPES = ['Natural', 'Lab-Grown', 'Simulated']
LAB_GROWN_METHODS = ['HPHT', 'CVD', 'Any']
SHAPES = ['ROUND', 'PRINCESS', 'CUSHION', 'EMERALD', 'OVAL', 'RADIANT', 
         'ASSCHER', 'MARQUISE', 'HEART', 'PEAR']
CUT_GRADES = ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR']
STANDARD_COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']
CLARITY_GRADES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1']
FLUORESCENCE = ['NONE', 'FAINT', 'MEDIUM', 'STRONG', 'VERY_STRONG']
LABS = ['GIA', 'IGI', 'AGS', 'HRD', 'EGL', 'NONE']
```

---

### 2.2 GET /api/v1/requirements

List requirements with filters.

**Query Params:**
- page (number, default 1)
- limit (number, default 20, max 100)
- status (enum)
- diamondType (enum)
- shapes (comma-separated)
- caratMin (number)
- caratMax (number)
- budgetMin (number)
- budgetMax (number)
- colorType (Standard|Fancy)
- certified (boolean)
- sortBy (createdAt|deadline|budgetMax|views)
- sortOrder (asc|desc)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "req_...",
      "userId": "...",
      "title": "...",
      "diamondType": "Natural",
      "shapes": ["ROUND"],
      "caratMin": 1.4,
      "caratMax": 1.6,
      "budgetMax": 15000,
      "deadline_end": "...",
      "status": "ACTIVE",
      "bidsReceived": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

### 2.3 GET /api/v1/requirements/:id

Get single requirement with full details.

---

### 2.4 PUT /api/v1/requirements/:id

Update requirement (only if ACTIVE, no bids).

---

### 2.5 DELETE /api/v1/requirements/:id

Delete/close requirement.

---

## 3. Notifications API (3 endpoints)

### 3.1 GET /api/v1/notifications

List notifications.

**Query:** ?page=1&limit=50&type=BID&isRead=false

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "...",
        "type": "BID",
        "title": "New Bid Received",
        "message": "...",
        "isRead": false,
        "createdAt": "..."
      }
    ],
    "unreadCount": 23
  }
}
```

**Notification Types:**
- REQUIREMENT - New matching requirement
- BID - New bid received
- DEAL - Deal update
- CHAT - New message
- GENERAL - News/updates
- SYSTEM - Maintenance

---

### 3.2 PUT /api/v1/notifications/read/:id

Mark notification as read.

---

### 3.3 DELETE /api/v1/notifications/:id

Delete notification.

---

## 4. Notification Settings API (2 endpoints)

### 4.1 GET /api/v1/notification-settings

Get notification preferences.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "pushNotifications": {
      "enabled": true,
      "requirements": true,
      "bids": true,
      "deals": true,
      "chat": true
    },
    "emailNotifications": {
      "enabled": true,
      "requirements": true,
      "dealUpdates": true,
      "weeklyDigest": false
    },
    "diamondPreferences": {
      "shapes": ["ROUND", "PRINCESS"],
      "minCarat": 1.0,
      "maxCarat": 3.0,
      "budgetMin": 5000,
      "budgetMax": 50000,
      "certifiedOnly": true,
      "preferredLabs": ["GIA", "IGI"]
    }
  }
}
```

---

### 4.2 PUT /api/v1/notification-settings

Update preferences.

---

## 5. Bid API (2 endpoints)

### 5.1 POST /api/v1/bids/:requirementId

Submit bid on requirement.

**Request:**
```json
{
  "diamondDetails": {
    "carat": 1.85,
    "color": "E",
    "clarity": "VVS1",
    "cut": "EXCELLENT",
    "shape": "ROUND",
    "lab": "GIA",
    "certificateNumber": "2141234567",
    "measurements": {
      "length": 7.85,
      "width": 7.82,
      "depth": 4.82
    },
    "proportions": {
      "depthPercent": 61.5,
      "tablePercent": 57.0
    }
  },
  "pricing": {
    "price": 8500,
    "currency": "USD",
    "pricePerCarat": false
  },
  "deliveryTime": 7,
  "location": "New York, USA",
  "images": ["data:image/jpeg;base64,..."],
  "additionalNotes": "..."
}
```

**Validation:**
- Verify seller is APPROVED
- Verify requirement is ACTIVE
- Verify diamond specs match requirement
- Verify price within budget range

**Response (201):**
```json
{
  "success": true,
  "data": {
    "bidId": "bid_...",
    "requirementId": "req_...",
    "status": "PENDING",
    "createdAt": "..."
  }
}
```

---

### 5.2 GET /api/v1/bids/:requirementId

Get all bids for requirement.

**Access Control:**
- **Requirement owner:** See all bid details
- **Others:** See limited info (seller name, price range only)

---

## 6. Deal API (3 endpoints)

### 6.1 POST /api/v1/deals/:bidId

Create deal from accepted bid.

**Business Logic:**
1. Verify user is requirement owner
2. Verify bid status = PENDING
3. Create deal (status: PENDING)
4. Set bid to ACCEPTED
5. Set requirement to IN_DEAL
6. Reject other bids on same requirement
7. Generate PDF agreement
8. Notify seller

**Response (201):**
```json
{
  "success": true,
  "data": {
    "dealId": "deal_...",
    "buyerId": "...",
    "sellerId": "...",
    "amount": 8500,
    "status": "PENDING",
    "pdfUrl": "https://storage.../deal.pdf",
    "createdAt": "..."
  }
}
```

**Deal Status Flow:**
```
PENDING → PAYMENT_PENDING → IN_PROGRESS → COMPLETED
        → DISPUTED → COMPLETED/CANCELED
```

---

### 6.2 GET /api/v1/deals/:id

Get deal details with full info.

---

### 6.3 GET /api/v1/deals

List user's deals with filters.

---

## 7. Escrow Payment API (4 endpoints)

### 7.1 POST /api/v1/escrow/initiate

Create escrow and charge buyer using Stripe Connect.

**Request:**
```json
{
  "dealId": "deal_...",
  "paymentMethodId": "pm_card_visa"
}
```

**Business Logic:**
1. Verify deal exists (status: PENDING)
2. Verify user is buyer
3. Create Stripe PaymentIntent (auto-capture)
4. Create escrow record (status: HELD)
5. Update deal status to PAYMENT_PENDING
6. Send notifications

**Stripe Code:**
```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 850000,  // $8,500 in cents
  currency: 'usd',
  payment_method: paymentMethodId,
  confirm: true,
  capture_method: 'automatic',
  metadata: { dealId, buyerId, sellerId }
});
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "escrowId": "esc_...",
    "dealId": "deal_...",
    "amount": 8500,
    "currency": "USD",
    "status": "HELD",
    "stripePaymentIntentId": "pi_..."
  }
}
```

---

### 7.2 POST /api/v1/escrow/release

Release funds to seller (requires both confirmations).

**Request:**
```json
{
  "escrowId": "esc_...",
  "confirmationType": "BUYER_CONFIRMATION"
}
```

**Business Logic:**
1. Record confirmation (buyer OR seller)
2. Check if BOTH confirmed
3. If yes:
   - Calculate platform fee (3%)
   - Create Stripe Transfer to seller
   - Update escrow status to RELEASED
   - Update deal status to COMPLETED

**Platform Fee:** 3% of transaction amount

**Response (200):**
```json
{
  "success": true,
  "data": {
    "escrowId": "esc_...",
    "status": "RELEASED",
    "releasedAmount": 8245,
    "platformFee": 255,
    "transferId": "tr_...",
    "releasedAt": "..."
  }
}
```

---

### 7.3 POST /api/v1/escrow/refund

Refund buyer if deal canceled.

---

### 7.4 GET /api/v1/escrow/:dealId

Get escrow status and timeline.

---

## 8. Chat API (4 endpoints)

Uses **Socket.IO** for real-time messaging.

### 8.1 POST /api/v1/chat/initiate

Start conversation.

---

### 8.2 POST /api/v1/chat/send-message

Send message (REST fallback).

---

### 8.3 GET /api/v1/chat/:conversationId

Get message history.

---

### 8.4 GET /api/v1/chat

List conversations.

---

**Socket.IO Events:**
```javascript
// Server → Client
socket.on('new_message', (message) => { });
socket.on('user_typing', ({ userId, conversationId }) => { });
socket.on('message_read', ({ messageId, readBy }) => { });

// Client → Server
socket.emit('send_message', { conversationId, text });
socket.emit('typing_start', { conversationId });
socket.emit('mark_as_read', { conversationId, messageId });
```

---

## 9. Inventory API (4 endpoints)

Uses **bwip-js** for barcode generation (Code128 format).

### 9.1 POST /api/v1/inventory

Add inventory item with barcode.

**Request:**
```json
{
  "diamondDetails": {
    "carat": 2.5,
    "cut": "EXCELLENT",
    "color": "D",
    "clarity": "VVS1",
    "shape": "ROUND",
    "certificate": "GIA",
    "certificateNumber": "2141234567"
  },
  "pricing": {
    "costPrice": 25000,
    "sellingPrice": 32000,
    "currency": "USD"
  },
  "location": "LOCKER_A1",
  "status": "IN_LOCKER",
  "photos": ["data:image/jpeg;base64,..."]
}
```

**Business Logic:**
1. Generate inventory ID (INV-2024-00001)
2. Generate barcode using bwip-js
3. Store barcode as base64 PNG
4. Create inventory record

**Response (201):**
```json
{
  "success": true,
  "data": {
    "inventoryId": "INV-2024-00001",
    "barcode": "INV202400001",
    "barcodeImage": "data:image/png;base64,...",
    "status": "IN_LOCKER"
  }
}
```

**Inventory Status:**
- IN_LOCKER - Stored in secure locker
- ON_MEMO - Given to client
- SOLD - Sold to customer
- IN_REPAIR - Being repaired
- IN_TRANSIT - Shipping
- RETURNED - Returned from memo
- RESERVED - Reserved for customer
- PENDING_CERTIFICATION - Sent for grading

---

### 9.2 GET /api/v1/inventory

List inventory with filters.

---

### 9.3 PUT /api/v1/inventory/:id

Update inventory (status, location, pricing).

---

### 9.4 DELETE /api/v1/inventory/:id

Soft delete inventory.

---

## 10. Rating & Badge API (2 endpoints)

### 10.1 POST /api/v1/ratings/:userId

Submit rating after deal completion.

**Request:**
```json
{
  "dealId": "deal_...",
  "rating": 4.5,
  "categories": {
    "communication": 5,
    "productQuality": 4,
    "delivery": 4,
    "pricing": 5,
    "professionalism": 4
  },
  "review": "Excellent diamond quality!",
  "isAnonymous": false
}
```

**Business Logic:**
1. Verify deal is COMPLETED
2. Verify user is buyer or seller (opposite party)
3. Check no duplicate rating
4. Create rating
5. Update user's average rating
6. Check and award badges
7. Calculate reputation score

**Response (201):**
```json
{
  "success": true,
  "data": {
    "ratingId": "...",
    "overallRating": 4.7,
    "totalRatings": 127,
    "badgesEarned": [
      {
        "badge": "TRUSTED_SELLER",
        "earnedAt": "...",
        "isNew": true
      }
    ]
  }
}
```

**Badge System:**

Deal-Based:
- FIRST_DEAL (1 deal)
- DEAL_MAKER (10 deals)
- DEAL_MASTER (50 deals)
- DEAL_LEGEND (100+ deals)

Rating-Based:
- HIGHLY_RATED (4.5+ rating)
- TOP_RATED (4.8+ for 3 months)

Volume-Based:
- SMALL_TRADER ($50K)
- MEDIUM_TRADER ($250K)
- HIGH_VOLUME ($1M+)
- ELITE_TRADER ($5M+)

Special:
- VERIFIED_BUSINESS
- FAST_RESPONDER (<1hr)
- RELIABLE_SHIPPER (95%+ on-time)

**Reputation Score (0-1000):**
```
avgRating: (rating/5) * 300      // Max 300
totalRatings: min(count*2, 200)  // Max 200
completedDeals: min(count*3, 300) // Max 300
badges: count * 20               // 20 per badge
accountAge: min((days/365)*100, 100) // Max 100
verified: isVerified ? 100 : 0   // 100

Levels:
0-199: POOR
200-399: FAIR
400-599: GOOD
600-799: VERY_GOOD
800-1000: EXCELLENT
```

---

### 10.2 GET /api/v1/ratings/:userId

Get user ratings, badges, and reputation.

---

## 11. Advertisement API (3 endpoints)

### 11.1 POST /api/v1/ads/request

Submit ad request.

**Request:**
```json
{
  "title": "Premium Diamond Collection",
  "description": "...",
  "imageUrl": "data:image/jpeg;base64,...",
  "linkUrl": "https://...",
  "duration": 30,
  "placement": "HOME_BANNER"
}
```

**Pricing:**
- HOME_BANNER: $10/day
- LISTING_TOP: $7/day
- SEARCH_SIDEBAR: $5/day
- FOOTER: $3/day

**Duration:** 7-90 days

**Response (201):**
```json
{
  "success": true,
  "data": {
    "adId": "...",
    "status": "PENDING",
    "estimatedCost": 300,
    "submittedAt": "..."
  }
}
```

---

### 11.2 GET /api/v1/ads

View active advertisements.

---

### 11.3 PUT /api/v1/ads/:id/approve (Admin Only)

Approve or reject ad.

---

## 12. Admin API (4 endpoints)

**Middleware:**
```typescript
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

### 12.1 GET /api/v1/admin/users

List all users with KYC status.

---

### 12.2 PUT /api/v1/admin/users/:id/approve

Approve or reject user KYC.

**Request:**
```json
{
  "action": "APPROVE",
  "rejectionReason": "Invalid documents"
}
```

**Business Logic:**
1. Verify admin role
2. If APPROVE:
   - Set status to APPROVED
   - Set isVerified = true
   - Send welcome email
3. If REJECT:
   - Set status to REJECTED
   - Store rejection reason
   - Send rejection email
4. Log admin action

---

### 12.3 GET /api/v1/admin/ads

View all ad requests.

---

### 12.4 PUT /api/v1/admin/ads/:id/approve

Approve or reject advertisement.

---

# Security & Validation

## JWT Authentication

```typescript
import jwt from 'jsonwebtoken';

const generateToken = (userId: string, role: string): string => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
};

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

---

## Joi Validation

```typescript
import Joi from 'joi';

export const requirementSchema = Joi.object({
  title: Joi.string().max(200).required(),
  diamondType: Joi.string().valid('Natural', 'Lab-Grown', 'Simulated').required(),
  shapes: Joi.array().items(Joi.string()).min(1).required(),
  caratMin: Joi.number().min(0.01).required(),
  caratMax: Joi.number().greater(Joi.ref('caratMin')).required(),
  // ... all other fields
});

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
};
```

---

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// General API limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests'
});

// Auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts'
});

app.use('/api/', apiLimiter);
app.use('/api/v1/auth/login', authLimiter);
```

---

# Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb://...
MONGODB_DB_NAME=diamond_trading

# JWT
JWT_SECRET=your-256-bit-secret
JWT_EXPIRY=15m

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_STORAGE_BUCKET=...

# FCM
FCM_SERVER_KEY=...
```

---

# Database Indexes

```typescript
// Users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ status: 1 });

// Requirements
db.requirements.createIndex({ userId: 1, status: 1 });
db.requirements.createIndex({ status: 1, deadline_end: 1 });
db.requirements.createIndex({ diamondType: 1, shapes: 1 });
db.requirements.createIndex({ caratMin: 1, caratMax: 1 });
db.requirements.createIndex({ budgetMin: 1, budgetMax: 1 });
db.requirements.createIndex({ createdAt: -1 });

// Bids
db.bids.createIndex({ requirementId: 1, status: 1 });
db.bids.createIndex({ sellerId: 1, status: 1 });

// Deals
db.deals.createIndex({ buyerId: 1, status: 1 });
db.deals.createIndex({ sellerId: 1, status: 1 });
db.deals.createIndex({ status: 1, createdAt: -1 });

// Escrow
db.escrow.createIndex({ dealId: 1 }, { unique: true });
db.escrow.createIndex({ buyerId: 1 });
db.escrow.createIndex({ sellerId: 1 });

// Notifications
db.notifications.createIndex({ userId: 1, isRead: 1 });
db.notifications.createIndex({ userId: 1, createdAt: -1 });

// Inventory
db.inventory.createIndex({ inventoryId: 1 }, { unique: true });
db.inventory.createIndex({ userId: 1, status: 1 });
db.inventory.createIndex({ barcode: 1 }, { unique: true });

// Ratings
db.ratings.createIndex({ userId: 1, createdAt: -1 });
db.ratings.createIndex({ dealId: 1 }, { unique: true });

// Conversations
db.conversations.createIndex({ participantIds: 1 });

// Messages
db.messages.createIndex({ conversationId: 1, sentAt: -1 });

// Advertisements
db.advertisements.createIndex({ status: 1, startDate: 1 });
```

---

# Cron Jobs

```typescript
import cron from 'node-cron';

// Expire requirements (every hour)
cron.schedule('0 * * * *', async () => {
  await Requirement.updateMany(
    { status: 'ACTIVE', deadline_end: { $lt: new Date() } },
    { $set: { status: 'EXPIRED' } }
  );
});

// Award badges (daily at midnight)
cron.schedule('0 0 * * *', async () => {
  const users = await User.find({ status: 'APPROVED' });
  for (const user of users) {
    await BadgeService.checkAndAwardBadges(user._id);
  }
});

// Generate monthly reports (1st of month)
cron.schedule('0 0 1 * *', async () => {
  const users = await User.find({ status: 'APPROVED' });
  for (const user of users) {
    await generateMonthlyReport(user._id);
  }
});

// Expire ads (daily at 2am)
cron.schedule('0 2 * * *', async () => {
  await Advertisement.updateMany(
    { status: 'APPROVED', endDate: { $lt: new Date() } },
    { $set: { status: 'EXPIRED' } }
  );
});
```

---

# Quick Start

```bash
# 1. Install dependencies
npm install express mongoose typescript joi bcrypt jsonwebtoken
npm install stripe socket.io firebase-admin bwip-js node-cron

# 2. Setup MongoDB
mongoose.connect(process.env.MONGODB_URI!);

# 3. Setup Express
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.listen(3000);

# 4. Setup Socket.IO
const io = new Server(httpServer, { cors: { origin: '*' } });

# 5. Setup Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

# 6. Setup Firebase
admin.initializeApp({ credential: admin.credential.cert({...}) });
```

---

# API Summary

**Total Endpoints: 42**

| Module | Count | Purpose |
|--------|-------|---------|
| Authentication | 6 | User registration, KYC, profile |
| Requirements | 5 | Post diamond requirements with full specs |
| Notifications | 3 | In-app notifications |
| Notification Settings | 2 | Preference management |
| Bids | 2 | Submit and view bids |
| Deals | 3 | Create and manage deals |
| Escrow Payment | 4 | Stripe Connect payment processing |
| Chat | 4 | Socket.IO real-time messaging |
| Inventory | 4 | Diamond inventory with barcodes |
| Rating & Badge | 2 | Reputation system |
| Advertisement | 3 | Paid advertisements |
| Admin | 4 | Platform management |

---

**Documentation Version:** 2.0  
**Last Updated:** December 4, 2024  
**Status:** ✅ Complete and Production Ready

**All 42 endpoints documented with:**
- Complete request/response examples
- ALL detailed fields (especially Requirements API)
- Data types and enums
- Business logic
- Mongoose schemas
- Validation rules (Joi)
- Error handling
- Security guidelines

**Ready for backend development!**

---

# NOTIFICATION MESSAGES (Complete Reference)

## All Notification Types with Messages

### 1. REQUIREMENT Notifications

#### 1.1 New Matching Requirement
**Type:** `requirement`  
**Title:** `"New Matching Requirement"`  
**Message:** `"A new requirement matches your preferences: {requirementTitle}"`  
**Push Title:** `"New Diamond Requirement"`  
**Push Body:** `"{requirementTitle} - Match score: {matchScore}%"`  
**Data:**
```json
{
  "requirementId": "req_...",
  "requirementTitle": "1.5ct Round Natural Diamond",
  "matchScore": 95,
  "budgetMax": 15000,
  "deadline": "2024-12-31"
}
```

#### 1.2 Requirement Expired
**Type:** `requirement`  
**Title:** `"Requirement Expired"`  
**Message:** `"Your requirement '{requirementTitle}' has expired. You can renew it or create a new one."`  
**Data:**
```json
{
  "requirementId": "req_...",
  "requirementTitle": "...",
  "bidsReceived": 5
}
```

#### 1.3 Requirement Updated
**Type:** `requirement`  
**Title:** `"Requirement Updated"`  
**Message:** `"The requirement you bid on has been updated. Please review changes."`  
**Data:**
```json
{
  "requirementId": "req_...",
  "bidId": "bid_...",
  "changes": ["budget", "deadline"]
}
```

---

### 2. BID Notifications

#### 2.1 New Bid Received (to Buyer)
**Type:** `bid`  
**Title:** `"New Bid Received"`  
**Message:** `"You received a new bid on '{requirementTitle}' from {sellerName}"`  
**Push Title:** `"New Bid on Your Requirement"`  
**Push Body:** `"{sellerName} bid ${bidAmount} for {requirementTitle}"`  
**Data:**
```json
{
  "requirementId": "req_...",
  "bidId": "bid_...",
  "sellerName": "Diamond Co.",
  "bidAmount": 8500,
  "currency": "USD",
  "deliveryDays": 7
}
```

#### 2.2 Bid Accepted (to Seller)
**Type:** `bid`  
**Title:** `"Bid Accepted!"`  
**Message:** `"Congratulations! Your bid on '{requirementTitle}' has been accepted. A deal has been created."`  
**Push Title:** `"Your Bid Was Accepted!"`  
**Push Body:** `"Deal created for {requirementTitle} - ${bidAmount}"`  
**Data:**
```json
{
  "bidId": "bid_...",
  "dealId": "deal_...",
  "requirementTitle": "...",
  "bidAmount": 8500,
  "buyerName": "John Buyer"
}
```

#### 2.3 Bid Rejected (to Seller)
**Type:** `bid`  
**Title:** `"Bid Not Selected"`  
**Message:** `"The buyer has selected another bid for '{requirementTitle}'."`  
**Data:**
```json
{
  "bidId": "bid_...",
  "requirementTitle": "..."
}
```

#### 2.4 Bid Withdrawn (to Buyer)
**Type:** `bid`  
**Title:** `"Bid Withdrawn"`  
**Message:** `"{sellerName} has withdrawn their bid on '{requirementTitle}'."`  
**Data:**
```json
{
  "bidId": "bid_...",
  "requirementId": "req_...",
  "sellerName": "..."
}
```

---

### 3. DEAL Notifications

#### 3.1 Deal Created (to Seller)
**Type:** `deal`  
**Title:** `"New Deal Created"`  
**Message:** `"Deal #{dealNumber} created for {requirementTitle}. Buyer: {buyerName}. Amount: ${amount}"`  
**Push Title:** `"New Deal Created"`  
**Push Body:** `"Deal #{dealNumber} - ${amount}"`  
**Data:**
```json
{
  "dealId": "deal_...",
  "dealNumber": "DEAL-2024-001",
  "requirementTitle": "...",
  "buyerName": "...",
  "amount": 8500,
  "status": "PENDING"
}
```

#### 3.2 Payment Pending (to Both)
**Type:** `deal`  
**Title:** `"Payment Pending"`  
**Message (Buyer):** `"Please complete payment for Deal #{dealNumber}. Amount: ${amount}"`  
**Message (Seller):** `"Waiting for buyer payment on Deal #{dealNumber}."`  
**Push Title:** `"Payment Required"`  
**Push Body:** `"Complete payment for Deal #{dealNumber} - ${amount}"`  
**Data:**
```json
{
  "dealId": "deal_...",
  "dealNumber": "DEAL-2024-001",
  "amount": 8500,
  "escrowId": "esc_..."
}
```

#### 3.3 Payment Completed (to Seller)
**Type:** `deal`  
**Title:** `"Payment Received"`  
**Message:** `"Payment received for Deal #{dealNumber}. Funds are held in escrow. Please ship the diamond."`  
**Push Title:** `"Payment Received"`  
**Push Body:** `"${amount} secured in escrow for Deal #{dealNumber}"`  
**Data:**
```json
{
  "dealId": "deal_...",
  "dealNumber": "DEAL-2024-001",
  "amount": 8500,
  "escrowId": "esc_...",
  "status": "IN_PROGRESS"
}
```

#### 3.4 Shipment Tracking (to Buyer)
**Type:** `deal`  
**Title:** `"Diamond Shipped"`  
**Message:** `"Your diamond has been shipped for Deal #{dealNumber}. Tracking: {trackingNumber}"`  
**Push Title:** `"Your Diamond Is On The Way"`  
**Push Body:** `"Track your shipment: {trackingNumber}"`  
**Data:**
```json
{
  "dealId": "deal_...",
  "dealNumber": "DEAL-2024-001",
  "trackingNumber": "...",
  "carrier": "FedEx",
  "estimatedDelivery": "2024-12-15"
}
```

#### 3.5 Delivery Confirmed (to Seller)
**Type:** `deal`  
**Title:** `"Delivery Confirmed"`  
**Message:** `"Buyer confirmed receipt of diamond for Deal #{dealNumber}. Please confirm to release funds."`  
**Data:**
```json
{
  "dealId": "deal_...",
  "dealNumber": "DEAL-2024-001",
  "buyerConfirmedAt": "2024-12-15T10:30:00Z"
}
```

#### 3.6 Deal Completed (to Both)
**Type:** `deal`  
**Title:** `"Deal Completed"`  
**Message (Buyer):** `"Deal #{dealNumber} completed successfully. Please rate your experience."`  
**Message (Seller):** `"Deal #{dealNumber} completed. Funds released: ${sellerAmount}. Please rate your experience."`  
**Push Title:** `"Deal Completed!"`  
**Push Body:** `"Deal #{dealNumber} completed successfully"`  
**Data:**
```json
{
  "dealId": "deal_...",
  "dealNumber": "DEAL-2024-001",
  "completedAt": "2024-12-15T14:00:00Z",
  "sellerAmount": 8245,
  "platformFee": 255
}
```

#### 3.7 Deal Disputed (to Both)
**Type:** `deal`  
**Title:** `"Deal Disputed"`  
**Message:** `"Deal #{dealNumber} has been marked as disputed. Support will contact you within 24 hours."`  
**Data:**
```json
{
  "dealId": "deal_...",
  "dealNumber": "DEAL-2024-001",
  "disputeReason": "...",
  "supportTicketId": "..."
}
```

#### 3.8 Deal Canceled (to Both)
**Type:** `deal`  
**Title:** `"Deal Canceled"`  
**Message:** `"Deal #{dealNumber} has been canceled. Reason: {reason}"`  
**Data:**
```json
{
  "dealId": "deal_...",
  "dealNumber": "DEAL-2024-001",
  "canceledBy": "buyer",
  "reason": "...",
  "refundAmount": 8500
}
```

---

### 4. ESCROW/PAYMENT Notifications

#### 4.1 Escrow Created (to Buyer)
**Type:** `payment`  
**Title:** `"Payment Secured"`  
**Message:** `"Your payment of ${amount} is now held securely in escrow for Deal #{dealNumber}."`  
**Data:**
```json
{
  "escrowId": "esc_...",
  "dealId": "deal_...",
  "amount": 8500,
  "status": "HELD"
}
```

#### 4.2 Payment Failed (to Buyer)
**Type:** `payment`  
**Title:** `"Payment Failed"`  
**Message:** `"Payment failed for Deal #{dealNumber}. Reason: {reason}. Please try again."`  
**Push Title:** `"Payment Failed"`  
**Push Body:** `"Unable to process payment for Deal #{dealNumber}"`  
**Data:**
```json
{
  "dealId": "deal_...",
  "amount": 8500,
  "failureReason": "Card declined",
  "retryUrl": "/deal/..."
}
```

#### 4.3 Funds Released (to Seller)
**Type:** `payment`  
**Title:** `"Funds Released"`  
**Message:** `"Funds released for Deal #{dealNumber}. Amount: ${sellerAmount} (after ${platformFee} platform fee)."`  
**Push Title:** `"Funds Released"`  
**Push Body:** `"${sellerAmount} transferred to your account"`  
**Data:**
```json
{
  "escrowId": "esc_...",
  "dealId": "deal_...",
  "sellerAmount": 8245,
  "platformFee": 255,
  "transferId": "tr_..."
}
```

#### 4.4 Refund Processed (to Buyer)
**Type:** `payment`  
**Title:** `"Refund Processed"`  
**Message:** `"Refund of ${refundAmount} processed for Deal #{dealNumber}. Funds will appear in 5-10 business days."`  
**Data:**
```json
{
  "escrowId": "esc_...",
  "dealId": "deal_...",
  "refundAmount": 8500,
  "refundId": "re_...",
  "reason": "Deal canceled"
}
```

---

### 5. CHAT Notifications

#### 5.1 New Message (to Recipient)
**Type:** `chat`  
**Title:** `"New Message from {senderName}"`  
**Message:** `"{messagePreview}"`  
**Push Title:** `"{senderName}"`  
**Push Body:** `"{messagePreview}"`  
**Data:**
```json
{
  "conversationId": "conv_...",
  "messageId": "msg_...",
  "senderName": "John Buyer",
  "messagePreview": "Can you provide more details...",
  "contextType": "DEAL",
  "contextId": "deal_..."
}
```

#### 5.2 Unread Messages Reminder
**Type:** `chat`  
**Title:** `"Unread Messages"`  
**Message:** `"You have {count} unread messages from {count} conversations."`  
**Data:**
```json
{
  "unreadCount": 5,
  "conversationCount": 3
}
```

---

### 6. RATING Notifications

#### 6.1 New Rating Received
**Type:** `rating`  
**Title:** `"New Rating Received"`  
**Message:** `"You received a {rating} star rating from {raterName} for Deal #{dealNumber}."`  
**Data:**
```json
{
  "ratingId": "rating_...",
  "dealId": "deal_...",
  "rating": 4.5,
  "raterName": "John Buyer",
  "review": "Excellent service!"
}
```

#### 6.2 Badge Earned
**Type:** `achievement`  
**Title:** `"New Badge Earned!"`  
**Message:** `"Congratulations! You earned the '{badgeName}' badge."`  
**Push Title:** `"Achievement Unlocked!"`  
**Push Body:** `"You earned: {badgeName}"`  
**Data:**
```json
{
  "badgeId": "DEAL_MAKER",
  "badgeName": "Deal Maker",
  "badgeDescription": "Complete 10 deals",
  "icon": "🏆",
  "earnedAt": "2024-12-04T10:00:00Z"
}
```

#### 6.3 Milestone Reached
**Type:** `achievement`  
**Title:** `"Milestone Reached!"`  
**Message:** `"You've completed {milestoneValue} deals! Total volume: ${totalVolume}"`  
**Data:**
```json
{
  "milestone": "50_DEALS",
  "milestoneValue": 50,
  "totalVolume": 500000,
  "nextMilestone": 100
}
```

---

### 7. ADMIN Notifications

#### 7.1 KYC Approved (to User)
**Type:** `account`  
**Title:** `"Account Approved"`  
**Message:** `"Your account has been approved! You can now post requirements and place bids."`  
**Push Title:** `"Account Approved"`  
**Push Body:** `"Your account is now active"`  
**Data:**
```json
{
  "userId": "user_...",
  "approvedAt": "2024-12-04T10:00:00Z",
  "approvedBy": "admin_..."
}
```

#### 7.2 KYC Rejected (to User)
**Type:** `account`  
**Title:** `"Account Verification Failed"`  
**Message:** `"Your account verification was not approved. Reason: {reason}. Please contact support."`  
**Data:**
```json
{
  "userId": "user_...",
  "rejectionReason": "Invalid documents",
  "supportEmail": "support@diamondapp.com"
}
```

#### 7.3 Account Suspended (to User)
**Type:** `account`  
**Title:** `"Account Suspended"`  
**Message:** `"Your account has been suspended. Reason: {reason}. Contact support for details."`  
**Data:**
```json
{
  "userId": "user_...",
  "suspensionReason": "Policy violation",
  "suspendedUntil": "2024-12-31T23:59:59Z"
}
```

#### 7.4 Ad Approved (to User)
**Type:** `advertisement`  
**Title:** `"Advertisement Approved"`  
**Message:** `"Your advertisement '{adTitle}' has been approved and will run from {startDate} to {endDate}."`  
**Data:**
```json
{
  "adId": "ad_...",
  "adTitle": "Premium Diamond Collection",
  "startDate": "2024-12-05",
  "endDate": "2024-12-15",
  "placement": "HOME_BANNER"
}
```

#### 7.5 Ad Rejected (to User)
**Type:** `advertisement`  
**Title:** `"Advertisement Rejected"`  
**Message:** `"Your advertisement '{adTitle}' was not approved. Reason: {reason}"`  
**Data:**
```json
{
  "adId": "ad_...",
  "adTitle": "...",
  "rejectionReason": "Image quality too low"
}
```

---

### 8. SYSTEM Notifications

#### 8.1 Maintenance Scheduled
**Type:** `system`  
**Title:** `"Scheduled Maintenance"`  
**Message:** `"System maintenance scheduled for {date} from {startTime} to {endTime}. Some features may be unavailable."`  
**Data:**
```json
{
  "maintenanceDate": "2024-12-10",
  "startTime": "02:00 AM EST",
  "endTime": "04:00 AM EST",
  "affectedFeatures": ["payments", "chat"]
}
```

#### 8.2 New Feature Announcement
**Type:** `general`  
**Title:** `"New Feature Available"`  
**Message:** `"{featureTitle} is now available! {featureDescription}"`  
**Data:**
```json
{
  "featureId": "...",
  "featureTitle": "Inventory Barcode Scanning",
  "featureDescription": "...",
  "learnMoreUrl": "/features/..."
}
```

#### 8.3 Monthly Report Ready
**Type:** `general`  
**Title:** `"Monthly Report Ready"`  
**Message:** `"Your {month} performance report is ready. {summary}"`  
**Data:**
```json
{
  "reportId": "...",
  "month": "November 2024",
  "summary": "12 deals completed, $345,000 volume",
  "reportUrl": "/reports/..."
}
```

---

## Notification Schema (MongoDB)

```typescript
interface INotification extends Document {
  userId: ObjectId;
  type: 'requirement' | 'bid' | 'deal' | 'payment' | 'chat' | 'rating' | 'achievement' | 'account' | 'advertisement' | 'system' | 'general';
  category: 'actionable' | 'informational' | 'urgent';
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  pushSent: boolean;
  pushSentAt?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['requirement', 'bid', 'deal', 'payment', 'chat', 'rating', 'achievement', 'account', 'advertisement', 'system', 'general'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['actionable', 'informational', 'urgent'],
    default: 'informational'
  },
  title: { type: String, required: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 1000 },
  data: { type: Schema.Types.Mixed },
  isRead: { type: Boolean, default: false, index: true },
  readAt: Date,
  actionUrl: String,
  pushSent: { type: Boolean, default: false },
  pushSentAt: Date,
  emailSent: { type: Boolean, default: false },
  emailSentAt: Date,
  createdAt: { type: Date, default: Date.now, index: true }
});

// Compound indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
```

---

## Push Notification Implementation (FCM)

```typescript
import admin from 'firebase-admin';

export const sendPushNotification = async (
  userId: string,
  notification: {
    title: string;
    body: string;
    data?: any;
  }
) => {
  const user = await User.findById(userId);
  
  if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
    return;
  }
  
  const message = {
    notification: {
      title: notification.title,
      body: notification.body
    },
    data: {
      ...notification.data,
      clickAction: 'FLUTTER_NOTIFICATION_CLICK',
      timestamp: Date.now().toString()
    },
    tokens: user.fcmTokens,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'default'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    }
  };
  
  try {
    const response = await admin.messaging().sendMulticast(message);
    
    // Remove invalid tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(user.fcmTokens[idx]);
        }
      });
      
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { $in: failedTokens } }
      });
    }
    
    return {
      success: response.successCount,
      failed: response.failureCount
    };
  } catch (error) {
    console.error('FCM Error:', error);
    throw error;
  }
};
```

---

## Notification Helper Functions

```typescript
// Create in-app notification
export const createNotification = async (
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
    actionUrl?: string;
    category?: string;
  }
) => {
  return await Notification.create({
    userId,
    type: notification.type,
    category: notification.category || 'informational',
    title: notification.title,
    message: notification.message,
    data: notification.data || {},
    actionUrl: notification.actionUrl,
    pushSent: false,
    emailSent: false
  });
};

// Send notification with push
export const sendNotification = async (
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
    actionUrl?: string;
    pushTitle?: string;
    pushBody?: string;
  }
) => {
  // Create in-app notification
  const inAppNotification = await createNotification(userId, notification);
  
  // Check user's notification settings
  const user = await User.findById(userId);
  const settings = user.notificationSettings;
  
  // Send push notification if enabled
  if (settings?.pushNotifications?.enabled) {
    const pushEnabled = settings.pushNotifications[notification.type];
    
    if (pushEnabled !== false) {
      try {
        await sendPushNotification(userId, {
          title: notification.pushTitle || notification.title,
          body: notification.pushBody || notification.message,
          data: {
            notificationId: inAppNotification._id.toString(),
            type: notification.type,
            actionUrl: notification.actionUrl,
            ...notification.data
          }
        });
        
        await Notification.findByIdAndUpdate(inAppNotification._id, {
          pushSent: true,
          pushSentAt: new Date()
        });
      } catch (error) {
        console.error('Push notification failed:', error);
      }
    }
  }
  
  return inAppNotification;
};
```

---

## Notification Categories

- **actionable** - Requires user action (new bid, payment pending, confirm delivery)
- **informational** - FYI only (deal completed, funds released, new message)
- **urgent** - Time-sensitive (payment failed, deal disputed, account suspended)

---

**This is the COMPLETE notification reference. Every notification message that will be sent is documented here.**


---

# COMPLETE API VALIDATION & BUSINESS LOGIC

## This section contains detailed validation rules, business logic steps, and error handling for ALL endpoints.

---

# 1. AUTHENTICATION API - DETAILED LOGIC

## 1.1 POST /api/v1/auth/register

### Validation Rules:
```javascript
const registerValidation = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match'
    }),
  
  userType: Joi.string()
    .valid('buyer', 'seller')
    .required()
    .messages({
      'any.only': 'User type must be either buyer or seller'
    })
});
```

### Business Logic Steps:
```
1. Validate request body with Joi schema
2. Check if email already exists in database
   - If exists: Return 409 "Email already registered"
3. Hash password using bcrypt (salt rounds: 10)
4. Create user document:
   - email: lowercase trimmed
   - password: hashed
   - userType: buyer or seller
   - role: USER (default)
   - status: PENDING_KYC
   - isVerified: false
   - createdAt: current timestamp
5. Save user to database
6. DO NOT generate JWT (user must complete KYC first)
7. Return success response with userId and status
```

### Error Responses:
```javascript
// 400 - Validation Failed
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Please provide a valid email address"
      }
    ]
  }
}

// 409 - Email Already Exists
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "This email is already registered"
  }
}
```

---

## 1.2 POST /api/v1/auth/login

### Validation Rules:
```javascript
const loginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});
```

### Business Logic Steps:
```
1. Validate request body
2. Find user by email (case-insensitive)
   - If not found: Return 401 "Invalid credentials"
3. Compare password with bcrypt
   - If incorrect: Return 401 "Invalid credentials"
4. Check user status:
   - REJECTED: Return 403 "Your registration was rejected. Contact support"
   - SUSPENDED: Return 403 "Your account is suspended. Contact support"
   - PENDING_KYC: Allow login but include message
   - PENDING_ADMIN_APPROVAL: Allow login but include message
   - APPROVED: Full access
5. Generate JWT token:
   - Payload: { userId, role, status }
   - Expiry: 15 minutes
   - Sign with JWT_SECRET
6. Update lastLoginAt timestamp
7. Return token and user data with appropriate status message
```

### Status-Based Messages:
```javascript
const statusMessages = {
  'PENDING_KYC': 'Please complete identity verification to access all features',
  'PENDING_ADMIN_APPROVAL': 'Your account is awaiting admin approval',
  'APPROVED': 'Login successful'
};
```

### Error Responses:
```javascript
// 401 - Invalid Credentials
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect"
  }
}

// 403 - Account Rejected
{
  "success": false,
  "error": {
    "code": "ACCOUNT_REJECTED",
    "message": "Your registration was rejected. Please contact support for details.",
    "supportEmail": "support@diamondapp.com"
  }
}

// 403 - Account Suspended
{
  "success": false,
  "error": {
    "code": "ACCOUNT_SUSPENDED",
    "message": "Your account is suspended. Contact support.",
    "suspendedUntil": "2024-12-31T23:59:59Z"
  }
}
```

---

## 1.3 POST /api/v1/auth/verify-identity

### Validation Rules:
```javascript
const kycValidation = Joi.object({
  fullName: Joi.string().min(3).max(100).required(),
  
  dateOfBirth: Joi.date()
    .max('now')
    .custom((value, helpers) => {
      const age = (Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (age < 18) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .required()
    .messages({
      'any.invalid': 'You must be at least 18 years old'
    }),
  
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  identityProofType: Joi.string()
    .valid('Aadhar', 'PAN')
    .required(),
  
  identityProofNumber: Joi.string()
    .alphanum()
    .min(10)
    .max(20)
    .required(),
  
  companyName: Joi.string()
    .min(2)
    .max(200)
    .required(),
  
  companyAddress: Joi.object({
    line1: Joi.string().max(200).required(),
    line2: Joi.string().max(200).optional(),
    city: Joi.string().max(100).required(),
    state: Joi.string().max(100).required(),
    postalCode: Joi.string().max(20).required()
  }).required()
});
```

### File Validation:
```javascript
// Document validation
const validateDocuments = (files) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  for (const file of files) {
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type: ${file.mimetype}. Allowed: JPG, PNG, PDF`);
    }
    
    if (file.size > maxSize) {
      throw new Error(`File too large: ${file.originalname}. Max size: 5MB`);
    }
  }
  
  // At least one document required
  if (files.length === 0) {
    throw new Error('At least one identity document is required');
  }
};
```

### Business Logic Steps:
```
1. Verify user is authenticated
2. Check user status is PENDING_KYC
   - If already submitted: Return 409 "KYC already submitted"
3. Validate all text fields with Joi
4. Validate uploaded files:
   - Check file types (JPG, PNG, PDF only)
   - Check file sizes (max 5MB each)
   - At least one document required
5. Upload documents to Firebase Storage:
   - Path: /kyc/{userId}/{filename}
   - Generate secure download URLs
   - Set appropriate permissions
6. Update user document with KYC data:
   - profile.fullName
   - profile.dateOfBirth
   - profile.phoneNumber
   - profile.identityProofType
   - profile.identityProofNumber
   - profile.documents (Firebase URLs)
   - profile.companyName
   - profile.companyAddress
7. Update user status to PENDING_ADMIN_APPROVAL
8. Create notification for admin:
   - Type: "New KYC submission"
   - Data: userId, userName, submittedAt
9. Send email to admin (optional)
10. Return success response
```

### Error Responses:
```javascript
// 400 - Invalid File Type
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Invalid file type. Allowed: JPG, PNG, PDF",
    "file": "passport.doc"
  }
}

// 400 - File Too Large
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 5MB limit",
    "file": "document.pdf",
    "size": "7.2MB"
  }
}

// 409 - KYC Already Submitted
{
  "success": false,
  "error": {
    "code": "KYC_ALREADY_SUBMITTED",
    "message": "Identity verification already submitted and pending approval"
  }
}
```

---

# 2. REQUIREMENTS API - DETAILED LOGIC

## 2.1 POST /api/v1/requirements

### Complete Validation Rules:
```javascript
const requirementValidation = Joi.object({
  // Basic Info
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().max(2000).optional(),
  
  // Diamond Type
  diamondType: Joi.string()
    .valid('Natural', 'Lab-Grown', 'Simulated')
    .required(),
  
  labGrownMethod: Joi.when('diamondType', {
    is: 'Lab-Grown',
    then: Joi.string().valid('HPHT', 'CVD', 'Any').required(),
    otherwise: Joi.forbidden()
  }),
  
  // Shape
  shapes: Joi.array()
    .items(Joi.string().valid('ROUND', 'PRINCESS', 'CUSHION', 'EMERALD', 'OVAL', 'RADIANT', 'ASSCHER', 'MARQUISE', 'HEART', 'PEAR'))
    .min(1)
    .required(),
  
  // Carat Weight
  caratMin: Joi.number().min(0.01).precision(2).required(),
  caratMax: Joi.number().greater(Joi.ref('caratMin')).precision(2).required(),
  
  // Measurements (optional)
  measurements: Joi.object({
    lengthMin: Joi.number().min(0).max(100).optional(),
    lengthMax: Joi.number().greater(Joi.ref('lengthMin')).optional(),
    widthMin: Joi.number().min(0).max(100).optional(),
    widthMax: Joi.number().greater(Joi.ref('widthMin')).optional(),
    depthMin: Joi.number().min(0).max(100).optional(),
    depthMax: Joi.number().greater(Joi.ref('depthMin')).optional(),
    lengthWidthRatioMin: Joi.number().min(0).max(10).optional(),
    lengthWidthRatioMax: Joi.number().greater(Joi.ref('lengthWidthRatioMin')).optional()
  }).optional(),
  
  // Cut Quality
  cutGrades: Joi.array()
    .items(Joi.string().valid('EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR'))
    .min(1)
    .required(),
  
  polish: Joi.array()
    .items(Joi.string().valid('EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR'))
    .optional(),
  
  symmetry: Joi.array()
    .items(Joi.string().valid('EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR'))
    .optional(),
  
  // Proportions (all optional, but if provided must be valid ranges)
  depthPercentMin: Joi.number().min(0).max(100).optional(),
  depthPercentMax: Joi.number().min(0).max(100).greater(Joi.ref('depthPercentMin')).optional(),
  
  tablePercentMin: Joi.number().min(0).max(100).optional(),
  tablePercentMax: Joi.number().min(0).max(100).greater(Joi.ref('tablePercentMin')).optional(),
  
  crownAngleMin: Joi.number().min(0).max(90).optional(),
  crownAngleMax: Joi.number().min(0).max(90).greater(Joi.ref('crownAngleMin')).optional(),
  
  pavilionAngleMin: Joi.number().min(0).max(90).optional(),
  pavilionAngleMax: Joi.number().min(0).max(90).greater(Joi.ref('pavilionAngleMin')).optional(),
  
  // Color
  colorType: Joi.string().valid('Standard', 'Fancy').required(),
  
  colorGrades: Joi.when('colorType', {
    is: 'Standard',
    then: Joi.array()
      .items(Joi.string().valid('D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'))
      .min(1)
      .required(),
    otherwise: Joi.forbidden()
  }),
  
  fancyColorGrades: Joi.when('colorType', {
    is: 'Fancy',
    then: Joi.array()
      .items(Joi.object({
        intensity: Joi.string().valid('FAINT', 'VERY_LIGHT', 'LIGHT', 'FANCY_LIGHT', 'FANCY', 'FANCY_INTENSE', 'FANCY_VIVID', 'FANCY_DEEP', 'FANCY_DARK').required(),
        modifier: Joi.string().valid('NONE', 'BROWNISH', 'GRAYISH', 'GREENISH', 'YELLOWISH', 'ORANGISH', 'PINKISH', 'PURPLISH', 'BLUISH').optional(),
        primaryHue: Joi.string().valid('YELLOW', 'ORANGE', 'PINK', 'RED', 'PURPLE', 'BLUE', 'GREEN', 'BROWN', 'GRAY', 'BLACK', 'WHITE').required(),
        secondaryHue: Joi.string().valid('YELLOW', 'ORANGE', 'PINK', 'RED', 'PURPLE', 'BLUE', 'GREEN', 'BROWN', 'GRAY').optional()
      }))
      .min(1)
      .required(),
    otherwise: Joi.forbidden()
  }),
  
  // Clarity
  clarityGrades: Joi.array()
    .items(Joi.string().valid('FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'))
    .min(1)
    .required(),
  
  eyeClean: Joi.boolean().optional(),
  
  // Fluorescence
  fluorescence: Joi.array()
    .items(Joi.string().valid('NONE', 'FAINT', 'MEDIUM', 'STRONG', 'VERY_STRONG'))
    .optional(),
  
  // Certification
  certified: Joi.boolean().required(),
  
  preferredLabs: Joi.when('certified', {
    is: true,
    then: Joi.array()
      .items(Joi.string().valid('GIA', 'IGI', 'AGS', 'HRD', 'EGL'))
      .min(1)
      .optional(),
    otherwise: Joi.forbidden()
  }),
  
  // Budget
  budgetMin: Joi.number().min(0).optional(),
  budgetMax: Joi.number().greater(Joi.ref('budgetMin')).optional(),
  currency: Joi.string().valid('USD', 'EUR', 'GBP', 'INR').default('USD'),
  
  // Timing
  deadline_end: Joi.date()
    .greater('now')
    .required()
    .messages({
      'date.greater': 'Deadline must be in the future'
    }),
  
  deliveryTimeline: Joi.date()
    .greater(Joi.ref('deadline_end'))
    .required()
    .messages({
      'date.greater': 'Delivery timeline must be after bidding deadline'
    })
});
```

### Business Logic Steps:
```
1. Authenticate user (verify JWT token)
2. Check user status is APPROVED
   - If not APPROVED: Return 403 "Complete KYC verification first"
3. Validate request body with Joi schema
4. Business Rule Validations:
   a. If eyeClean=true AND clarityGrades includes SI2/I1:
      - Add warning: "Eye-clean SI2/I1 diamonds are rare"
   b. If budgetMax/caratMax < 1000:
      - Add warning: "Budget may be too low for specified carat weight"
   c. If deadline_end < 24 hours from now:
      - Return 422 "Deadline must be at least 24 hours in future"
   d. If deliveryTimeline - deadline_end < 7 days:
      - Add warning: "Short delivery window may limit bids"
5. Create requirement document:
   - userId: current user
   - status: ACTIVE
   - views: 0
   - bidsReceived: 0
   - createdAt: now
   - All validated fields
6. Save to database
7. Run matching algorithm:
   a. Find all users with notificationSettings.enabled = true
   b. For each user, calculate match score (0-100)
   c. If score >= 50, create notification
8. Send notifications to matched users:
   - In-app notification
   - Push notification (if enabled)
9. Schedule auto-expiry cron job for deadline_end
10. Return success response with requirement ID and warnings (if any)
```

### Match Score Calculation:
```javascript
function calculateMatchScore(requirement, userPreferences) {
  let score = 0;
  
  // Diamond type (REQUIRED - 20 points)
  if (userPreferences.diamondTypes.includes(requirement.diamondType)) {
    score += 20;
  } else {
    return 0; // No match if diamond type doesn't match
  }
  
  // Shape match (15 points)
  const shapeMatch = requirement.shapes.some(shape => 
    userPreferences.shapes.includes(shape)
  );
  if (shapeMatch) score += 15;
  
  // Carat range overlap (20 points)
  if (rangesOverlap(
    requirement.caratMin, requirement.caratMax,
    userPreferences.minCarat, userPreferences.maxCarat
  )) {
    score += 20;
  }
  
  // Budget range overlap (20 points)
  if (rangesOverlap(
    requirement.budgetMin, requirement.budgetMax,
    userPreferences.budgetMin, userPreferences.budgetMax
  )) {
    score += 20;
  }
  
  // Color match (10 points)
  const colorMatch = requirement.colorGrades?.some(color => 
    userPreferences.colorGrades?.includes(color)
  );
  if (colorMatch) score += 10;
  
  // Clarity match (10 points)
  const clarityMatch = requirement.clarityGrades.some(clarity => 
    userPreferences.clarityGrades?.includes(clarity)
  );
  if (clarityMatch) score += 10;
  
  // Certification match (5 points)
  if (requirement.certified === userPreferences.certifiedOnly) {
    score += 5;
  }
  
  return score;
}

function rangesOverlap(min1, max1, min2, max2) {
  return !(max1 < min2 || max2 < min1);
}
```

### Error Responses:
```javascript
// 403 - Not Approved
{
  "success": false,
  "error": {
    "code": "USER_NOT_APPROVED",
    "message": "Please complete KYC verification to post requirements",
    "currentStatus": "PENDING_ADMIN_APPROVAL"
  }
}

// 422 - Deadline Too Soon
{
  "success": false,
  "error": {
    "code": "INVALID_DEADLINE",
    "message": "Deadline must be at least 24 hours in the future",
    "minimumDeadline": "2024-12-05T10:30:00Z"
  }
}

// 422 - Budget Too Low (Warning)
{
  "success": true,
  "data": { ... },
  "warnings": [
    {
      "code": "LOW_BUDGET_WARNING",
      "message": "Budget may be too low for specified carat weight. Consider increasing budget for better responses."
    }
  ]
}
```

---

## 2.2 PUT /api/v1/requirements/:id

### Business Logic Steps:
```
1. Authenticate user
2. Find requirement by ID
   - If not found: Return 404
3. Verify user is requirement owner
   - If not owner: Return 403 "Not authorized"
4. Check if requirement can be edited:
   a. Status must be ACTIVE
      - If EXPIRED: Return 422 "Cannot edit expired requirement"
      - If CLOSED: Return 422 "Cannot edit closed requirement"
   b. Deadline must not have passed
      - If passed: Return 422 "Deadline has passed"
5. Check if bids exist:
   - If bidsReceived > 0:
     * Allow edit but add warning
     * Notify all bidders of changes
     * Mark their bids as "Requirement Updated"
6. Validate updated fields
7. Update requirement document
8. If significant changes (budget, carat, deadline):
   - Create notifications for existing bidders
9. Update updatedAt timestamp
10. Return success response
```

### Error Responses:
```javascript
// 403 - Not Owner
{
  "success": false,
  "error": {
    "code": "NOT_AUTHORIZED",
    "message": "You can only edit your own requirements"
  }
}

// 422 - Has Bids (Warning)
{
  "success": true,
  "data": { ... },
  "warnings": [
    {
      "code": "HAS_ACTIVE_BIDS",
      "message": "This requirement has 5 active bids. All bidders will be notified of changes.",
      "bidsCount": 5
    }
  ]
}
```

---

# 3. BID API - DETAILED LOGIC

## 3.1 POST /api/v1/bids/:requirementId

### Complete Validation:
```javascript
const bidValidation = Joi.object({
  // Diamond Details (MUST match requirement specs)
  diamondDetails: Joi.object({
    carat: Joi.number().min(0.01).precision(2).required(),
    color: Joi.string().valid('D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M').required(),
    clarity: Joi.string().valid('FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1').required(),
    cut: Joi.string().valid('EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR').required(),
    shape: Joi.string().valid('ROUND', 'PRINCESS', 'CUSHION', 'EMERALD', 'OVAL', 'RADIANT', 'ASSCHER', 'MARQUISE', 'HEART', 'PEAR').required(),
    lab: Joi.string().valid('GIA', 'IGI', 'AGS', 'HRD', 'EGL', 'NONE').required(),
    certificateNumber: Joi.string().max(50).when('lab', {
      is: Joi.not('NONE'),
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    measurements: Joi.object({
      length: Joi.number().min(0).max(100).required(),
      width: Joi.number().min(0).max(100).required(),
      depth: Joi.number().min(0).max(100).required()
    }).optional(),
    proportions: Joi.object({
      depthPercent: Joi.number().min(0).max(100).optional(),
      tablePercent: Joi.number().min(0).max(100).optional(),
      crownAngle: Joi.number().min(0).max(90).optional(),
      pavilionAngle: Joi.number().min(0).max(90).optional()
    }).optional()
  }).required(),
  
  // Pricing
  pricing: Joi.object({
    price: Joi.number().min(1).required(),
    currency: Joi.string().valid('USD', 'EUR', 'GBP', 'INR').default('USD'),
    pricePerCarat: Joi.boolean().default(false)
  }).required(),
  
  // Delivery
  deliveryTime: Joi.number().min(1).max(365).required(),
  location: Joi.string().max(200).required(),
  
  // Images (base64)
  images: Joi.array()
    .items(Joi.string())
    .min(1)
    .max(10)
    .required(),
  
  additionalNotes: Joi.string().max(2000).optional()
});
```

### Business Logic Steps (16 Steps):
```
1. Authenticate user (verify JWT)
2. Verify user status is APPROVED
   - If not: Return 403 "Complete KYC verification"
3. Verify user is SELLER userType
   - If BUYER: Return 403 "Only sellers can place bids"
4. Find requirement by ID
   - If not found: Return 404 "Requirement not found"
5. Check requirement status is ACTIVE
   - If EXPIRED: Return 422 "Cannot bid on expired requirement"
   - If CLOSED: Return 422 "Requirement is closed"
   - If IN_DEAL: Return 422 "Requirement already has accepted bid"
6. Verify user is NOT the requirement owner
   - If owner: Return 403 "Cannot bid on your own requirement"
7. Check if user already has active bid on this requirement
   - If exists: Return 409 "You already have an active bid. Update or withdraw existing bid."
8. Validate all bid fields with Joi
9. Verify diamond specs match requirement:
   a. Check carat is within requirement.caratMin - caratMax
   b. Check shape is in requirement.shapes array
   c. Check color is in requirement.colorGrades array
   d. Check clarity is in requirement.clarityGrades array
   e. Check cut is in requirement.cutGrades array
   f. If requirement.certified=true, lab cannot be NONE
   - If any don't match: Return 422 "Diamond specs don't match requirement"
10. Verify price is within budget:
    - If requirement.budgetMax exists:
      * Check pricing.price <= budgetMax
      * If exceeds: Return 422 "Bid amount exceeds buyer's budget"
11. Validate images:
    - Check base64 format
    - Decode and verify file size (max 5MB each)
    - Upload to Firebase Storage
12. Calculate pricePerCarat if not provided:
    - pricePerCarat = price / carat
13. Create bid document:
    - requirementId, sellerId
    - diamondDetails, pricing, deliveryTime
    - images (Firebase URLs)
    - status: PENDING
    - createdAt: now
14. Save bid to database
15. Increment requirement.bidsReceived counter
16. Create notification for requirement owner:
    - Type: "bid"
    - Title: "New Bid Received"
    - Message: "You received a new bid from {sellerName}"
    - Send push notification
17. Return success response with bid ID
```

### Spec Matching Validation:
```javascript
function verifyDiamondMatch(bid, requirement) {
  const errors = [];
  
  // Carat range
  if (bid.diamondDetails.carat < requirement.caratMin ||
      bid.diamondDetails.carat > requirement.caratMax) {
    errors.push({
      field: 'carat',
      message: `Carat must be between ${requirement.caratMin} and ${requirement.caratMax}`,
      provided: bid.diamondDetails.carat
    });
  }
  
  // Shape match
  if (!requirement.shapes.includes(bid.diamondDetails.shape)) {
    errors.push({
      field: 'shape',
      message: `Shape must be one of: ${requirement.shapes.join(', ')}`,
      provided: bid.diamondDetails.shape
    });
  }
  
  // Color match (if Standard color)
  if (requirement.colorType === 'Standard' &&
      !requirement.colorGrades.includes(bid.diamondDetails.color)) {
    errors.push({
      field: 'color',
      message: `Color must be one of: ${requirement.colorGrades.join(', ')}`,
      provided: bid.diamondDetails.color
    });
  }
  
  // Clarity match
  if (!requirement.clarityGrades.includes(bid.diamondDetails.clarity)) {
    errors.push({
      field: 'clarity',
      message: `Clarity must be one of: ${requirement.clarityGrades.join(', ')}`,
      provided: bid.diamondDetails.clarity
    });
  }
  
  // Cut match
  if (!requirement.cutGrades.includes(bid.diamondDetails.cut)) {
    errors.push({
      field: 'cut',
      message: `Cut must be one of: ${requirement.cutGrades.join(', ')}`,
      provided: bid.diamondDetails.cut
    });
  }
  
  // Certification match
  if (requirement.certified && bid.diamondDetails.lab === 'NONE') {
    errors.push({
      field: 'lab',
      message: 'Buyer requires certified diamond',
      provided: 'NONE'
    });
  }
  
  // Budget match
  if (requirement.budgetMax && bid.pricing.price > requirement.budgetMax) {
    errors.push({
      field: 'price',
      message: `Price exceeds buyer's budget of ${requirement.budgetMax} ${requirement.currency}`,
      provided: bid.pricing.price
    });
  }
  
  return errors;
}
```

### Error Responses:
```javascript
// 403 - Not a Seller
{
  "success": false,
  "error": {
    "code": "BUYERS_CANNOT_BID",
    "message": "Only sellers can place bids",
    "userType": "buyer"
  }
}

// 409 - Duplicate Bid
{
  "success": false,
  "error": {
    "code": "DUPLICATE_BID",
    "message": "You already have an active bid on this requirement",
    "existingBidId": "bid_abc123",
    "action": "Update or withdraw your existing bid"
  }
}

// 422 - Specs Don't Match
{
  "success": false,
  "error": {
    "code": "SPECS_MISMATCH",
    "message": "Diamond specifications don't match requirement",
    "details": [
      {
        "field": "carat",
        "message": "Carat must be between 1.0 and 2.0",
        "provided": 2.5
      },
      {
        "field": "color",
        "message": "Color must be one of: D, E, F",
        "provided": "G"
      }
    ]
  }
}

// 422 - Budget Exceeded
{
  "success": false,
  "error": {
    "code": "BUDGET_EXCEEDED",
    "message": "Bid amount exceeds buyer's budget",
    "maxBudget": 10000,
    "yourBid": 12500,
    "currency": "USD"
  }
}
```

---

# 4. DEAL API - DETAILED LOGIC

## 4.1 POST /api/v1/deals/:bidId

### Business Logic Steps (15 Steps):
```
1. Authenticate user
2. Find bid by ID
   - If not found: Return 404 "Bid not found"
3. Find requirement from bid.requirementId
4. Verify user is requirement owner (buyer)
   - If not owner: Return 403 "Only requirement owner can accept bids"
5. Check bid status is PENDING
   - If ACCEPTED: Return 409 "Bid already accepted"
   - If REJECTED: Return 409 "Bid was rejected"
   - If WITHDRAWN: Return 409 "Bid was withdrawn"
6. Check requirement status is ACTIVE
   - If not ACTIVE: Return 422 "Requirement is not active"
7. Check no existing deal for this requirement
   - If deal exists: Return 409 "Deal already exists for this requirement"
8. Create deal document:
   - requirementId, bidId, buyerId, sellerId
   - agreedPrice: bid.pricing.price
   - currency: bid.pricing.currency
   - Snapshots (immutable):
     * requirementSnapshot: full requirement JSON
     * bidSnapshot: full bid JSON
     * diamondSnapshot: bid.diamondDetails JSON
   - status: PENDING
   - createdAt: now
9. Update bid status to ACCEPTED
10. Update requirement status to IN_DEAL
11. Reject all other pending bids on this requirement:
    - Set status to REJECTED
    - Create notifications for those sellers
12. Generate PDF agreement:
    - Deal ID, date, buyer info, seller info
    - Full requirement details
    - Full bid details
    - Agreed price and terms
    - Legal disclaimer
    - Upload PDF to Firebase Storage
13. Create notification for seller:
    - Type: "bid"
    - Title: "Bid Accepted!"
    - Message: "Your bid has been accepted. Deal created."
14. Create notification for buyer:
    - Type: "deal"
    - Title: "Deal Created"
    - Message: "Deal created successfully. Proceed to payment."
15. Return deal ID, status, and PDF URL
```

### PDF Generation:
```javascript
import PDFDocument from 'pdfkit';
import { uploadToFirebase } from './storage';

async function generateDealPDF(deal, requirement, bid, buyer, seller) {
  const doc = new PDFDocument();
  const chunks = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  
  // Header
  doc.fontSize(20).text('Diamond Deal Agreement', { align: 'center' });
  doc.moveDown();
  
  // Deal Info
  doc.fontSize(12);
  doc.text(`Deal ID: ${deal._id}`);
  doc.text(`Date: ${new Date().toISOString()}`);
  doc.text(`Status: ${deal.status}`);
  doc.moveDown();
  
  // Parties
  doc.fontSize(14).text('Buyer Information:');
  doc.fontSize(11);
  doc.text(`Name: ${buyer.profile.fullName}`);
  doc.text(`Company: ${buyer.profile.companyName}`);
  doc.text(`Email: ${buyer.email}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Seller Information:');
  doc.fontSize(11);
  doc.text(`Name: ${seller.profile.fullName}`);
  doc.text(`Company: ${seller.profile.companyName}`);
  doc.text(`Email: ${seller.email}`);
  doc.moveDown();
  
  // Diamond Details
  doc.fontSize(14).text('Diamond Specifications:');
  doc.fontSize(11);
  doc.text(`Carat: ${bid.diamondDetails.carat}`);
  doc.text(`Color: ${bid.diamondDetails.color}`);
  doc.text(`Clarity: ${bid.diamondDetails.clarity}`);
  doc.text(`Cut: ${bid.diamondDetails.cut}`);
  doc.text(`Shape: ${bid.diamondDetails.shape}`);
  doc.text(`Lab: ${bid.diamondDetails.lab}`);
  doc.text(`Certificate #: ${bid.diamondDetails.certificateNumber}`);
  doc.moveDown();
  
  // Financial Terms
  doc.fontSize(14).text('Financial Terms:');
  doc.fontSize(11);
  doc.text(`Agreed Price: ${deal.currency} ${deal.agreedPrice.toLocaleString()}`);
  doc.text(`Platform Fee (3%): ${deal.currency} ${(deal.agreedPrice * 0.03).toLocaleString()}`);
  doc.text(`Seller Receives: ${deal.currency} ${(deal.agreedPrice * 0.97).toLocaleString()}`);
  doc.moveDown();
  
  // Delivery Terms
  doc.text(`Delivery Time: ${bid.deliveryTime} days`);
  doc.text(`Location: ${bid.location}`);
  doc.moveDown();
  
  // Legal Disclaimer
  doc.fontSize(10).text('This agreement is binding. All transactions are secured through escrow.', {
    align: 'center'
  });
  
  doc.end();
  
  return new Promise((resolve, reject) => {
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const fileName = `deals/deal_${deal._id}.pdf`;
      const url = await uploadToFirebase(fileName, pdfBuffer, 'application/pdf');
      resolve(url);
    });
    
    doc.on('error', reject);
  });
}
```

### Error Responses:
```javascript
// 403 - Not Buyer
{
  "success": false,
  "error": {
    "code": "NOT_AUTHORIZED",
    "message": "Only the requirement owner can accept bids",
    "requirementOwnerId": "user_123"
  }
}

// 409 - Deal Already Exists
{
  "success": false,
  "error": {
    "code": "DEAL_EXISTS",
    "message": "A deal already exists for this requirement",
    "existingDealId": "deal_xyz789"
  }
}

// 409 - Bid Not Pending
{
  "success": false,
  "error": {
    "code": "BID_NOT_AVAILABLE",
    "message": "This bid is not available for acceptance",
    "bidStatus": "REJECTED",
    "reason": "Bid was previously rejected"
  }
}
```

---

# 5. ESCROW PAYMENT API - DETAILED LOGIC

## 5.1 POST /api/v1/escrow/initiate

### Validation:
```javascript
const escrowValidation = Joi.object({
  dealId: Joi.string().required(),
  paymentMethodId: Joi.string().required()
});
```

### Business Logic Steps (12 Steps):
```
1. Authenticate user
2. Find deal by ID
   - If not found: Return 404 "Deal not found"
3. Verify user is buyer
   - If not buyer: Return 403 "Only buyer can initiate escrow"
4. Check deal status is PENDING
   - If not PENDING: Return 422 "Deal is not in pending status"
5. Check if escrow already exists for this deal
   - If exists: Return 409 "Escrow already created for this deal"
6. Verify payment method belongs to user (Stripe API)
   - If invalid: Return 400 "Invalid payment method"
7. Calculate amounts:
   - totalAmount = deal.agreedPrice
   - platformFee = totalAmount * 0.03 (3%)
   - sellerAmount = totalAmount - platformFee
8. Create Stripe PaymentIntent:
   - amount: totalAmount * 100 (convert to cents)
   - currency: deal.currency.toLowerCase()
   - payment_method: paymentMethodId
   - confirm: true (charge immediately)
   - capture_method: 'automatic'
   - metadata: { dealId, buyerId, sellerId }
9. Handle Stripe response:
   - If declined: Return 402 "Payment declined"
   - If error: Return 500 "Payment processing failed"
10. Create escrow document:
    - dealId, buyerId, sellerId
    - amount: totalAmount
    - platformFee, sellerAmount
    - stripePaymentIntentId
    - status: HELD
    - buyerConfirmedAt: null
    - sellerConfirmedAt: null
    - timeline: [{ event: 'PAYMENT_CAPTURED', timestamp: now }]
11. Update deal status to PAYMENT_PENDING
12. Create notifications:
    - Buyer: "Payment secured in escrow"
    - Seller: "Payment received. Ship the diamond."
13. Return escrow details
```

### Stripe Integration:
```javascript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function createEscrowPayment(deal, paymentMethodId) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(deal.agreedPrice * 100), // Convert to cents
      currency: deal.currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirm: true,
      capture_method: 'automatic',
      metadata: {
        dealId: deal._id.toString(),
        buyerId: deal.buyerId.toString(),
        sellerId: deal.sellerId.toString(),
        type: 'escrow_payment'
      },
      description: `Escrow payment for Deal #${deal._id}`
    });
    
    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100
    };
    
  } catch (error) {
    if (error.code === 'card_declined') {
      return {
        success: false,
        error: 'PAYMENT_DECLINED',
        message: 'Your card was declined',
        declineCode: error.decline_code
      };
    }
    
    if (error.code === 'insufficient_funds') {
      return {
        success: false,
        error: 'INSUFFICIENT_FUNDS',
        message: 'Insufficient funds in your account'
      };
    }
    
    throw error;
  }
}
```

### Error Responses:
```javascript
// 402 - Payment Declined
{
  "success": false,
  "error": {
    "code": "PAYMENT_DECLINED",
    "message": "Your card was declined",
    "declineCode": "insufficient_funds",
    "action": "Please try a different payment method"
  }
}

// 409 - Escrow Already Exists
{
  "success": false,
  "error": {
    "code": "ESCROW_EXISTS",
    "message": "Escrow already created for this deal",
    "existingEscrowId": "esc_abc123",
    "status": "HELD"
  }
}
```

---

## 5.2 POST /api/v1/escrow/release

### Business Logic Steps (10 Steps):
```
1. Authenticate user
2. Find escrow by ID
   - If not found: Return 404 "Escrow not found"
3. Verify user is buyer OR seller
   - If neither: Return 403 "Not authorized"
4. Check escrow status is HELD
   - If not HELD: Return 422 "Escrow not in held status"
5. Record confirmation:
   - If user is buyer:
     * Set buyerConfirmedAt = now
     * Add to timeline: { event: 'BUYER_CONFIRMED', timestamp: now }
   - If user is seller:
     * Set sellerConfirmedAt = now
     * Add to timeline: { event: 'SELLER_CONFIRMED', timestamp: now }
6. Save escrow document
7. Check if BOTH parties confirmed:
   - If not: Return success "Confirmation recorded. Waiting for other party."
8. If BOTH confirmed:
   a. Calculate platform fee (3%)
   b. Calculate seller amount (97%)
   c. Create Stripe Transfer to seller:
      - amount: sellerAmount * 100 (cents)
      - currency: escrow.currency
      - destination: seller.stripeAccountId
      - transfer_group: dealId
   d. Update escrow:
      - status: RELEASED
      - stripeTransferId: transfer.id
      - releasedAt: now
      - Add to timeline: { event: 'FUNDS_RELEASED', timestamp: now }
   e. Update deal status to COMPLETED
   f. Create notifications:
      - Buyer: "Deal completed! Please rate your experience."
      - Seller: "Funds released: ${sellerAmount}"
9. Return success response with release details
```

### Stripe Transfer:
```javascript
async function transferToSeller(escrow, seller) {
  const sellerAmount = escrow.amount * 0.97; // 97% to seller
  
  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(sellerAmount * 100),
      currency: escrow.currency.toLowerCase(),
      destination: seller.stripeAccountId,
      transfer_group: escrow.dealId.toString(),
      metadata: {
        escrowId: escrow._id.toString(),
        dealId: escrow.dealId.toString(),
        sellerId: seller._id.toString()
      },
      description: `Payment release for Deal #${escrow.dealId}`
    });
    
    return {
      success: true,
      transferId: transfer.id,
      amount: transfer.amount / 100
    };
    
  } catch (error) {
    console.error('Stripe transfer failed:', error);
    throw new Error('Failed to transfer funds to seller');
  }
}
```

### Response Examples:
```javascript
// Partial confirmation (waiting for other party)
{
  "success": true,
  "data": {
    "escrowId": "esc_abc123",
    "status": "HELD",
    "confirmations": {
      "buyer": true,
      "seller": false
    },
    "message": "Confirmation recorded. Waiting for seller confirmation."
  }
}

// Both confirmed - funds released
{
  "success": true,
  "data": {
    "escrowId": "esc_abc123",
    "status": "RELEASED",
    "releasedAmount": 8245,
    "platformFee": 255,
    "transferId": "tr_xyz789",
    "releasedAt": "2024-12-04T15:30:00Z",
    "message": "Funds successfully released to seller"
  }
}
```

---

# STATUS FLOWS SUMMARY

## User Status Flow
```
PENDING_KYC 
  → (submit KYC) → PENDING_ADMIN_APPROVAL
  → (admin approves) → APPROVED ✅
  → (admin rejects) → REJECTED ❌
  → (admin suspends) → SUSPENDED ⛔
```

## Requirement Status Flow
```
ACTIVE 
  → (deadline passes) → EXPIRED
  → (user closes) → CLOSED
  → (deal created) → IN_DEAL
```

## Bid Status Flow
```
PENDING 
  → (buyer accepts) → ACCEPTED ✅
  → (buyer rejects) → REJECTED ❌
  → (seller withdraws) → WITHDRAWN
```

## Deal Status Flow
```
PENDING 
  → (payment initiated) → PAYMENT_PENDING
  → (payment confirmed) → IN_PROGRESS
  → (both confirm delivery) → COMPLETED ✅
  → (dispute raised) → DISPUTED
  → (canceled) → CANCELED ❌
```

## Escrow Status Flow
```
PENDING 
  → (payment captured) → HELD
  → (both confirm + transfer) → RELEASED ✅
  → (deal canceled) → REFUNDED
```

---

**This completes the detailed validation, business logic, and flows for all API endpoints.**

