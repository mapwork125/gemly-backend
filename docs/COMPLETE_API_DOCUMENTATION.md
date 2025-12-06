# Diamond Platform - Complete API Documentation

## Table of Contents

1. [Admin API](#admin-api)
2. [Advertisement API](#advertisement-api)
3. [Authentication API](#authentication-api)
4. [Requirement API](#requirement-api)
5. [Bid API](#bid-api)
6. [Deal API](#deal-api)
7. [Escrow API](#escrow-api)
8. [Chat API](#chat-api)
9. [Notification API](#notification-api)
10. [Notification Settings API](#notification-settings-api)
11. [Rating API](#rating-api)
12. [Inventory API](#inventory-api)

---

## Common Information

### Base URL

```
http://localhost:5001/api
```

### Authentication

Most endpoints require JWT authentication:

```http
Authorization: Bearer <jwt_token>
```

### Response Format

All responses follow this structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    /* response data */
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

### Common HTTP Status Codes

| Code | Description                                 |
| ---- | ------------------------------------------- |
| 200  | OK - Request successful                     |
| 201  | Created - Resource created                  |
| 400  | Bad Request - Validation error              |
| 401  | Unauthorized - Missing/invalid token        |
| 403  | Forbidden - Insufficient permissions        |
| 404  | Not Found - Resource doesn't exist          |
| 409  | Conflict - Duplicate/invalid state          |
| 422  | Unprocessable Entity - Business logic error |
| 429  | Too Many Requests - Rate limit exceeded     |
| 500  | Internal Server Error                       |

---

# Requirement API

**Base Path:** `/api/requirements`

## 1. POST /requirements

Create a new diamond requirement.

**Authentication:** Required

**Request Body:**

```json
{
  "title": "Looking for 2ct Round Diamond",
  "description": "Need a certified diamond for engagement ring",
  "details": {
    "diamondType": "Natural",
    "labGrownMethod": null,
    "treatmentStatus": "Untreated",
    "treatmentTypes": [],
    "shapes": ["Round"],
    "caratMin": 1.8,
    "caratMax": 2.2,
    "cutGrades": ["Excellent", "Very Good"],
    "colorGrades": ["D", "E", "F"],
    "clarityGrades": ["VVS1", "VVS2", "VS1"],
    "certified": true,
    "certificationLabs": ["GIA", "IGI"],
    "budgetMin": 15000,
    "budgetMax": 25000,
    "currency": "USD",
    "deliveryTimeline": "2025-01-15T00:00:00.000Z",
    "intendedUse": "Engagement Ring",
    "conflictFree": true,
    "matchingPair": false,
    "canShipTo": ["United States", "Canada"],
    "additionalRequirements": "Eye-clean preferred"
  }
}
```

### Diamond Type Variants

#### Variant 1: Natural Diamond

```json
{
  "title": "Natural Diamond Required",
  "details": {
    "diamondType": "Natural",
    "treatmentStatus": "Untreated",
    "shapes": ["Round"],
    "caratMin": 1.0,
    "caratMax": 2.0
  }
}
```

#### Variant 2: Lab-Grown Diamond (CVD)

```json
{
  "title": "Lab-Grown CVD Diamond",
  "details": {
    "diamondType": "Lab-Grown",
    "labGrownMethod": "CVD",
    "shapes": ["Princess", "Cushion"],
    "caratMin": 1.5,
    "caratMax": 2.5
  }
}
```

#### Variant 3: Lab-Grown Diamond (HPHT)

```json
{
  "title": "Lab-Grown HPHT Diamond",
  "details": {
    "diamondType": "Lab-Grown",
    "labGrownMethod": "HPHT",
    "shapes": ["Oval"],
    "caratMin": 2.0,
    "caratMax": 3.0
  }
}
```

### Treatment Status Variants

#### Variant 1: Untreated Only

```json
{
  "details": {
    "treatmentStatus": "Untreated",
    "treatmentTypes": []
  }
}
```

#### Variant 2: Treated Accepted

```json
{
  "details": {
    "treatmentStatus": "Treated",
    "treatmentTypes": ["HPHT", "Laser Drilled"]
  }
}
```

#### Variant 3: Any Treatment

```json
{
  "details": {
    "treatmentStatus": "Any",
    "treatmentTypes": []
  }
}
```

### Shape Variants

#### Single Shape

```json
{
  "details": {
    "shapes": ["Round"]
  }
}
```

#### Multiple Shapes

```json
{
  "details": {
    "shapes": ["Round", "Princess", "Cushion", "Oval"]
  }
}
```

### Budget Range Variants

#### Low Budget ($1,000 - $5,000)

```json
{
  "details": {
    "budgetMin": 1000,
    "budgetMax": 5000,
    "currency": "USD"
  }
}
```

#### Medium Budget ($10,000 - $30,000)

```json
{
  "details": {
    "budgetMin": 10000,
    "budgetMax": 30000,
    "currency": "USD"
  }
}
```

#### High Budget ($50,000+)

```json
{
  "details": {
    "budgetMin": 50000,
    "budgetMax": 150000,
    "currency": "USD"
  }
}
```

### Certification Variants

#### Certified Only (GIA)

```json
{
  "details": {
    "certified": true,
    "certificationLabs": ["GIA"]
  }
}
```

#### Certified (Multiple Labs)

```json
{
  "details": {
    "certified": true,
    "certificationLabs": ["GIA", "IGI", "AGS"]
  }
}
```

#### Non-Certified Accepted

```json
{
  "details": {
    "certified": false,
    "certificationLabs": []
  }
}
```

### Special Requirements Variants

#### Conflict-Free Required

```json
{
  "details": {
    "conflictFree": true
  }
}
```

#### Matching Pair

```json
{
  "details": {
    "matchingPair": true,
    "intendedUse": "Earrings"
  }
}
```

#### Eye-Clean Requirement

```json
{
  "details": {
    "additionalRequirements": "Must be eye-clean, no visible inclusions to naked eye"
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Requirement created successfully",
  "data": {
    "requirement": {
      "_id": "674e9b01a2b3c4d5e6f78901",
      "title": "Looking for 2ct Round Diamond",
      "description": "Need a certified diamond for engagement ring",
      "user": "674e9b01a2b3c4d5e6f78901",
      "details": {
        /* full details */
      },
      "status": "ACTIVE",
      "createdAt": "2024-12-07T10:00:00.000Z",
      "expiresAt": "2025-01-15T00:00:00.000Z"
    },
    "warnings": [
      "LOW_BUDGET_WARNING: Budget may be too low for specified carat weight"
    ]
  }
}
```

### Warning Messages (Non-blocking)

Warnings are informational and don't prevent requirement creation:

1. **EYECLEAN_LOW_CLARITY_WARNING**

   - Trigger: `eyeClean: true` with clarity SI2 or lower
   - Message: "Eye-clean requirement with SI2 or lower clarity may be difficult to fulfill"

2. **LOW_BUDGET_WARNING**

   - Trigger: Budget per carat < $2,000 for natural diamonds
   - Message: "Budget may be too low for specified carat weight"

3. **NON_CERTIFIED_WARNING**

   - Trigger: `certified: false`
   - Message: "Non-certified diamonds may be harder to verify and resell"

4. **LONG_DEADLINE_WARNING**
   - Trigger: Delivery timeline > 365 days
   - Message: "Deadline is more than 1 year in the future"

---

## 2. GET /requirements

List requirements with filtering.

**Authentication:** Optional (auth changes response)

**Query Parameters:**

| Parameter     | Type   | Values                                | Default     | Description      |
| ------------- | ------ | ------------------------------------- | ----------- | ---------------- |
| `page`        | number | >= 1                                  | 1           | Page number      |
| `limit`       | number | 1-100                                 | 20          | Items per page   |
| `status`      | string | See status values                     | -           | Filter by status |
| `diamondType` | string | `Natural`, `Lab-Grown`, `Simulated`   | -           | Diamond type     |
| `minBudget`   | number | >= 0                                  | -           | Minimum budget   |
| `maxBudget`   | number | >= 0                                  | -           | Maximum budget   |
| `minCarat`    | number | > 0                                   | -           | Minimum carat    |
| `maxCarat`    | number | > 0                                   | -           | Maximum carat    |
| `shape`       | string | See shape values                      | -           | Diamond shape    |
| `sortBy`      | string | `createdAt`, `expiresAt`, `budgetMax` | `createdAt` | Sort field       |
| `sortOrder`   | string | `asc`, `desc`                         | `desc`      | Sort order       |

**Status Values:**

- `ACTIVE` - Open for bids
- `EXPIRED` - Past delivery timeline
- `CLOSED` - Manually closed by user
- `FULFILLED` - Deal created
- `CANCELLED` - Cancelled by user

**Shape Values:**

- `Round`, `Princess`, `Cushion`, `Emerald`, `Oval`, `Radiant`, `Asscher`, `Marquise`, `Heart`, `Pear`

**Filter Variants:**

#### Active Natural Diamonds

```http
GET /api/requirements?status=ACTIVE&diamondType=Natural&sortBy=createdAt
```

#### Lab-Grown in Budget Range

```http
GET /api/requirements?diamondType=Lab-Grown&minBudget=10000&maxBudget=30000
```

#### Large Diamonds (2+ carats)

```http
GET /api/requirements?minCarat=2.0&sortBy=budgetMax&sortOrder=desc
```

#### Round Diamonds Only

```http
GET /api/requirements?shape=Round&status=ACTIVE
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Requirements retrieved successfully",
  "data": {
    "requirements": [
      {
        "_id": "674e9b01a2b3c4d5e6f78901",
        "title": "Looking for 2ct Round Diamond",
        "details": {
          "diamondType": "Natural",
          "shapes": ["Round"],
          "caratMin": 1.8,
          "caratMax": 2.2,
          "budgetMax": 25000,
          "currency": "USD"
        },
        "status": "ACTIVE",
        "bidCount": 5,
        "createdAt": "2024-12-07T10:00:00.000Z",
        "expiresAt": "2025-01-15T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalRequirements": 195,
      "limit": 20
    }
  }
}
```

---

## 3. GET /requirements/:id

Get single requirement details.

**Authentication:** Optional (affects response detail)

**URL Parameters:**

- `id` - Requirement MongoDB ObjectId

**Response (200 OK) - Owner View:**

```json
{
  "success": true,
  "data": {
    "requirement": {
      "_id": "674e9b01a2b3c4d5e6f78901",
      "title": "Looking for 2ct Round Diamond",
      "description": "Need a certified diamond for engagement ring",
      "user": {
        "_id": "674e9b01a2b3c4d5e6f78901",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "details": {
        /* full details */
      },
      "status": "ACTIVE",
      "bidCount": 5,
      "viewCount": 45,
      "createdAt": "2024-12-07T10:00:00.000Z",
      "expiresAt": "2025-01-15T00:00:00.000Z",
      "isOwner": true
    }
  }
}
```

**Response (200 OK) - Public View:**

```json
{
  "success": true,
  "data": {
    "requirement": {
      "_id": "674e9b01a2b3c4d5e6f78901",
      "title": "Looking for 2ct Round Diamond",
      "details": {
        "diamondType": "Natural",
        "shapes": ["Round"],
        "caratMin": 1.8,
        "caratMax": 2.2,
        "budgetMin": 15000,
        "budgetMax": 25000
      },
      "status": "ACTIVE",
      "bidCount": 5,
      "createdAt": "2024-12-07T10:00:00.000Z",
      "isOwner": false
    }
  }
}
```

---

## 4. PUT /requirements/:id

Update a requirement.

**Authentication:** Required (must be owner)

**URL Parameters:**

- `id` - Requirement MongoDB ObjectId

**Request Body:** (Partial update supported)

```json
{
  "title": "Updated: Looking for 2.5ct Round Diamond",
  "description": "Updated description",
  "details": {
    "caratMax": 2.5,
    "budgetMax": 30000
  }
}
```

**Restrictions:**

- Cannot update if requirement has bids
- Cannot update if requirement is expired/closed/fulfilled
- Can only update own requirements

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Requirement updated successfully",
  "data": {
    "requirement": {
      /* updated requirement */
    }
  }
}
```

**Error Responses:**

```json
// 403 Forbidden (Has bids)
{
  "success": false,
  "message": "Cannot edit requirement (has bids)"
}

// 422 Unprocessable Entity (Expired)
{
  "success": false,
  "message": "Cannot update bid - requirement expired or closed"
}
```

---

## 5. DELETE /requirements/:id

Delete a requirement.

**Authentication:** Required (must be owner)

**URL Parameters:**

- `id` - Requirement MongoDB ObjectId

**Restrictions:**

- Cannot delete if requirement has bids
- Can only delete own requirements

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Requirement deleted successfully"
}
```

**Error Response:**

```json
// 403 Forbidden
{
  "success": false,
  "message": "Cannot delete requirement (has bids)"
}
```

---

## 6. PATCH /requirements/:id/close

Manually close a requirement.

**Authentication:** Required (must be owner)

**URL Parameters:**

- `id` - Requirement MongoDB ObjectId

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Requirement closed successfully",
  "data": {
    "requirement": {
      "_id": "674e9b01a2b3c4d5e6f78901",
      "status": "CLOSED",
      "closedAt": "2024-12-07T11:00:00.000Z"
    }
  }
}
```

---

## Requirement Status Flow

```
ACTIVE (Default on creation)
    ↓
    ├─→ EXPIRED (Delivery timeline passed)
    ├─→ CLOSED (User manually closes)
    ├─→ FULFILLED (Deal created from accepted bid)
    └─→ CANCELLED (User cancels)

All end states are final (no transitions out)
```

---

## Enum Values Reference

### Diamond Types

```
Natural, Lab-Grown, Simulated
```

### Lab-Grown Methods

```
HPHT, CVD, Any
```

### Treatment Status

```
Untreated, Treated, Any
```

### Treatment Types

```
HPHT, Laser Drilled, Fracture Filled, Irradiated,
Clarity Enhanced, Color Enhanced, Coating, Annealing
```

### Shapes

```
Round, Princess, Cushion, Emerald, Oval, Radiant,
Asscher, Marquise, Heart, Pear
```

### Cut Grades

```
Excellent, Very Good, Good, Fair, Poor
```

### Color Grades

```
D, E, F, G, H, I, J, K, L, M
```

### Clarity Grades

```
FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2, I1, I2, I3
```

### Certification Labs

```
GIA, AGS, IGI, HRD, GCAL, EGL USA, EGL International,
GSI, NGTC, GRS, SSEF, Gübelin, PGGL, AGL, CGL, IGL,
GII, GJEPC, IIDGR, DGLA, DSEF, GIT, With Clarity, Rare Carat
```

### Currencies

```
USD, EUR, GBP, INR, AED, CNY, JPY, CHF
```

---

**Continue to [Bid API](#bid-api) →**

---

# Bid API

**Base Path:** `/api/bids`

## 1. POST /bids/:requirementId

Submit a bid on a requirement.

**Authentication:** Required

**URL Parameters:**

- `requirementId` - Requirement MongoDB ObjectId

**Request Body:**

```json
{
  "bidAmount": 22000,
  "currency": "USD",
  "negotiable": true,
  "negotiationNote": "Price negotiable for bulk orders",
  "deliveryDays": 15,
  "canMeetDeadline": true,
  "shippingIncluded": true,
  "insuranceIncluded": true,
  "paymentTerms": "50% advance, 50% on delivery",
  "acceptedPaymentMethods": ["Bank Transfer", "Credit Card", "Escrow"],
  "depositRequired": true,
  "depositPercentage": 50,
  "diamondType": "Natural",
  "caratWeight": 2.0,
  "shape": "Round",
  "cutGrade": "Excellent",
  "colorGrade": "E",
  "clarityGrade": "VVS2",
  "certificateLab": "GIA",
  "certificateNumber": "2141234567",
  "companyName": "Diamond Corp",
  "contactPerson": "John Doe",
  "contactEmail": "john@diamondcorp.com",
  "contactPhone": "+1234567890",
  "businessAddress": {
    "street": "123 Diamond Street",
    "city": "New York",
    "country": "USA",
    "postalCode": "10001"
  },
  "returnPolicy": "30-day money-back guarantee",
  "gradeGuarantee": true,
  "stockStatus": "In Stock",
  "locationOfDiamond": "New York, USA",
  "canViewInPerson": true,
  "agreedToTerms": true
}
```

### Price Variants

#### Variant 1: Fixed Price (Non-negotiable)

```json
{
  "bidAmount": 25000,
  "currency": "USD",
  "negotiable": false
}
```

#### Variant 2: Negotiable Price

```json
{
  "bidAmount": 22000,
  "currency": "USD",
  "negotiable": true,
  "negotiationNote": "Flexible on price for quick payment"
}
```

#### Variant 3: Price with Deposit

```json
{
  "bidAmount": 20000,
  "currency": "USD",
  "depositRequired": true,
  "depositPercentage": 30
}
```

### Delivery Variants

#### Fast Delivery (1-7 days)

```json
{
  "deliveryDays": 5,
  "canMeetDeadline": true,
  "shippingIncluded": true,
  "insuranceIncluded": true
}
```

#### Standard Delivery (7-30 days)

```json
{
  "deliveryDays": 15,
  "canMeetDeadline": true,
  "shippingIncluded": false,
  "shippingCost": 500,
  "insuranceIncluded": true
}
```

#### Custom Timeline

```json
{
  "deliveryDays": 45,
  "canMeetDeadline": true,
  "shippingMethod": "International Express",
  "shippingIncluded": false,
  "shippingCost": 1500
}
```

### Stock Status Variants

#### In Stock

```json
{
  "stockStatus": "In Stock",
  "locationOfDiamond": "New York, USA",
  "canViewInPerson": true
}
```

#### Can Source

```json
{
  "stockStatus": "Can Source",
  "locationOfDiamond": "International",
  "canViewInPerson": false,
  "deliveryDays": 30
}
```

#### Made to Order

```json
{
  "stockStatus": "Made to Order",
  "locationOfDiamond": "Manufacturing Facility - Belgium",
  "canViewInPerson": false,
  "deliveryDays": 60
}
```

### Diamond Specification Variants

#### GIA Certified Natural

```json
{
  "diamondType": "Natural",
  "caratWeight": 2.0,
  "shape": "Round",
  "cutGrade": "Excellent",
  "colorGrade": "D",
  "clarityGrade": "VVS1",
  "certificateLab": "GIA",
  "certificateNumber": "2141234567",
  "certificateUrl": "https://gia.edu/report-check/2141234567"
}
```

#### IGI Certified Lab-Grown

```json
{
  "diamondType": "Lab-Grown",
  "caratWeight": 2.5,
  "shape": "Princess",
  "cutGrade": "Very Good",
  "colorGrade": "E",
  "clarityGrade": "VS1",
  "certificateLab": "IGI",
  "certificateNumber": "LG12345678"
}
```

#### Non-Certified Diamond

```json
{
  "diamondType": "Natural",
  "caratWeight": 1.5,
  "shape": "Cushion",
  "cutGrade": "Good",
  "colorGrade": "F",
  "clarityGrade": "SI1",
  "certificateLab": null,
  "certificateNumber": null,
  "gradeGuarantee": true,
  "returnPolicy": "7-day return for independent certification"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Bid submitted successfully",
  "data": {
    "bid": {
      "_id": "674f8a12b3c4d5e6f7890123",
      "requirement": "674e9b01a2b3c4d5e6f78901",
      "bidder": "674e9b01a2b3c4d5e6f78902",
      "bidAmount": 22000,
      "currency": "USD",
      "status": "PENDING",
      "createdAt": "2024-12-07T11:00:00.000Z"
    }
  }
}
```

---

## 2. GET /bids/:requirementId

Get all bids for a requirement.

**Authentication:** Required

**URL Parameters:**

- `requirementId` - Requirement MongoDB ObjectId

**Query Parameters:**

| Parameter   | Type   | Values                                             | Default                          | Description      |
| ----------- | ------ | -------------------------------------------------- | -------------------------------- | ---------------- |
| `sortBy`    | string | `bidAmount`, `deliveryDays`, `createdAt`, `rating` | `createdAt`                      | Sort field       |
| `sortOrder` | string | `asc`, `desc`                                      | `desc` for date, `asc` for price | Sort order       |
| `status`    | string | `PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`     | -                                | Filter by status |

**Sort Variants:**

```http
# Lowest price first
GET /api/bids/:requirementId?sortBy=bidAmount&sortOrder=asc

# Fastest delivery first
GET /api/bids/:requirementId?sortBy=deliveryDays&sortOrder=asc

# Highest rated bidders first
GET /api/bids/:requirementId?sortBy=rating&sortOrder=desc

# Most recent bids first
GET /api/bids/:requirementId?sortBy=createdAt&sortOrder=desc
```

**Status Filter Variants:**

```http
# Pending bids only
GET /api/bids/:requirementId?status=PENDING

# Accepted bids
GET /api/bids/:requirementId?status=ACCEPTED

# Rejected bids
GET /api/bids/:requirementId?status=REJECTED
```

**Response (200 OK) - Owner View (Full Details):**

```json
{
  "success": true,
  "data": {
    "bids": [
      {
        "_id": "674f8a12b3c4d5e6f7890123",
        "requirement": "674e9b01a2b3c4d5e6f78901",
        "bidder": {
          "_id": "674e9b01a2b3c4d5e6f78902",
          "name": "Diamond Corp",
          "rating": 4.8
        },
        "bidAmount": 22000,
        "currency": "USD",
        "deliveryDays": 15,
        "diamondType": "Natural",
        "caratWeight": 2.0,
        "certificateLab": "GIA",
        "certificateNumber": "2141234567",
        "contactEmail": "john@diamondcorp.com",
        "contactPhone": "+1234567890",
        "status": "PENDING",
        "isSeen": true,
        "createdAt": "2024-12-07T11:00:00.000Z"
      }
    ],
    "metadata": {
      "totalBids": 5,
      "pendingBids": 3,
      "acceptedBids": 1,
      "lowestBid": 20000,
      "highestBid": 28000,
      "averageBid": 23500
    },
    "isOwner": true
  }
}
```

**Response (200 OK) - Public View (Limited Details):**

```json
{
  "success": true,
  "data": {
    "bids": [
      {
        "_id": "674f8a12b3c4d5e6f7890123",
        "bidAmount": 22000,
        "currency": "USD",
        "deliveryDays": 15,
        "diamondType": "Natural",
        "caratWeight": 2.0,
        "shape": "Round",
        "certificateLab": "GIA",
        "status": "PENDING",
        "createdAt": "2024-12-07T11:00:00.000Z"
      }
    ],
    "metadata": {
      "totalBids": 5
    },
    "isOwner": false
  }
}
```

---

## 3. GET /bids/:requirementId/:bidId

Get single bid details.

**Authentication:** Required

**URL Parameters:**

- `requirementId` - Requirement MongoDB ObjectId
- `bidId` - Bid MongoDB ObjectId

**Response (200 OK) - Full Access:**

```json
{
  "success": true,
  "data": {
    "bid": {
      "_id": "674f8a12b3c4d5e6f7890123",
      "requirement": "674e9b01a2b3c4d5e6f78901",
      "bidder": {
        "_id": "674e9b01a2b3c4d5e6f78902",
        "name": "Diamond Corp",
        "rating": 4.8,
        "totalDeals": 156
      },
      "bidAmount": 22000,
      "currency": "USD",
      "negotiable": true,
      "deliveryDays": 15,
      "paymentTerms": "50% advance, 50% on delivery",
      "diamondDetails": {
        /* full diamond specs */
      },
      "sellerInfo": {
        /* full seller info */
      },
      "contactEmail": "john@diamondcorp.com",
      "contactPhone": "+1234567890",
      "status": "PENDING",
      "isOwner": true,
      "isBidder": false
    }
  }
}
```

---

## 4. PUT /bids/:requirementId/:bidId

Update a bid.

**Authentication:** Required (must be bidder)

**URL Parameters:**

- `requirementId` - Requirement MongoDB ObjectId
- `bidId` - Bid MongoDB ObjectId

**Request Body:** (Partial update)

```json
{
  "bidAmount": 21000,
  "deliveryDays": 12,
  "negotiationNote": "Updated pricing for faster delivery"
}
```

**Restrictions:**

- Cannot update accepted/rejected bids
- Cannot update if requirement expired/closed
- Can only update own bids

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Bid updated successfully",
  "data": {
    "bid": {
      /* updated bid */
    }
  }
}
```

---

## 5. DELETE /bids/:requirementId/:bidId

Withdraw a bid.

**Authentication:** Required (must be bidder)

**URL Parameters:**

- `requirementId` - Requirement MongoDB ObjectId
- `bidId` - Bid MongoDB ObjectId

**Restrictions:**

- Cannot withdraw accepted bids
- Can only withdraw own bids

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Bid withdrawn successfully"
}
```

---

## 6. PATCH /bids/:requirementId/:bidId/accept

Accept a bid (creates deal).

**Authentication:** Required (must be requirement owner)

**URL Parameters:**

- `requirementId` - Requirement MongoDB ObjectId
- `bidId` - Bid MongoDB ObjectId

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Bid accepted and deal created",
  "data": {
    "bid": {
      "_id": "674f8a12b3c4d5e6f7890123",
      "status": "ACCEPTED",
      "acceptedAt": "2024-12-07T12:00:00.000Z"
    },
    "deal": {
      "_id": "674g9c23d4e5f6g7h8i9j012",
      "buyer": "674e9b01a2b3c4d5e6f78901",
      "seller": "674e9b01a2b3c4d5e6f78902",
      "bidAmount": 22000,
      "status": "DEAL_CREATED"
    }
  }
}
```

---

## 7. PATCH /bids/:requirementId/:bidId/reject

Reject a bid.

**Authentication:** Required (must be requirement owner)

**URL Parameters:**

- `requirementId` - Requirement MongoDB ObjectId
- `bidId` - Bid MongoDB ObjectId

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Bid rejected successfully",
  "data": {
    "bid": {
      "_id": "674f8a12b3c4d5e6f7890123",
      "status": "REJECTED",
      "rejectedAt": "2024-12-07T12:00:00.000Z"
    }
  }
}
```

---

## Bid Status Flow

```
PENDING (Default on submission)
    ↓
    ├─→ ACCEPTED (Owner accepts → creates Deal)
    ├─→ REJECTED (Owner rejects)
    └─→ WITHDRAWN (Bidder withdraws)

ACCEPTED and REJECTED are final states
WITHDRAWN can happen from PENDING only
```

---

**Continue to [Deal API](#deal-api) →**

---

This is a comprehensive start. Would you like me to continue with the remaining modules (Deal, Escrow, Chat, Notification, Rating, Inventory)?
