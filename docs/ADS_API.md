# Advertisement API Documentation

## Overview

APIs for submitting, managing, and displaying advertisements on the platform.

**Base URL:** `/api/ads`

**Rate Limiting:** Ad requests limited to 5 per day per user

---

## Endpoints

### 1. POST /ads/request

Submit a new advertisement request.

**Authentication:** Required (JWT Token)

**Rate Limit:** 5 requests per day per user

**Request Body:**

```json
{
  "title": "Premium Diamond Collection",
  "description": "Explore our exclusive certified diamond collection with GIA certificates",
  "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "linkUrl": "https://example.com/diamonds",
  "duration": 30,
  "placement": "HOME_BANNER"
}
```

**Field Details:**

| Field         | Type   | Required | Validation             | Description           |
| ------------- | ------ | -------- | ---------------------- | --------------------- |
| `title`       | string | Yes      | 5-100 chars            | Ad title              |
| `description` | string | Yes      | 10-500 chars           | Ad description        |
| `imageUrl`    | string | Yes      | Base64 or URL, max 2MB | Ad image              |
| `linkUrl`     | string | No       | Valid URI              | Destination URL       |
| `duration`    | number | Yes      | 7-90 days              | Ad duration           |
| `placement`   | string | Yes      | See placement values   | Ad placement location |

**Placement Values:**

- `HOME_BANNER` - Homepage banner (top)
- `SEARCH_SIDEBAR` - Search results sidebar
- `LISTING_TOP` - Listing page top
- `FOOTER` - Footer banner

**Duration Variants:**

```json
// Variant 1: One Week
{
  "title": "Weekly Special",
  "description": "Limited time offer on certified diamonds",
  "imageUrl": "data:image/jpeg;base64,...",
  "duration": 7,
  "placement": "HOME_BANNER"
}

// Variant 2: One Month
{
  "title": "Monthly Collection",
  "description": "New arrivals every month",
  "imageUrl": "data:image/jpeg;base64,...",
  "duration": 30,
  "placement": "SEARCH_SIDEBAR"
}

// Variant 3: Three Months
{
  "title": "Seasonal Campaign",
  "description": "Summer diamond collection",
  "imageUrl": "data:image/jpeg;base64,...",
  "duration": 90,
  "placement": "LISTING_TOP"
}
```

**Placement Variants:**

```json
// Variant 1: Home Banner (Most Visible)
{
  "title": "Featured Collection",
  "description": "Premium diamonds",
  "imageUrl": "data:image/jpeg;base64,...",
  "duration": 30,
  "placement": "HOME_BANNER"
}

// Variant 2: Search Sidebar
{
  "title": "Certified Diamonds",
  "description": "GIA certified collection",
  "imageUrl": "data:image/jpeg;base64,...",
  "duration": 30,
  "placement": "SEARCH_SIDEBAR"
}

// Variant 3: Listing Top
{
  "title": "New Arrivals",
  "description": "Latest diamond collection",
  "imageUrl": "data:image/jpeg;base64,...",
  "duration": 30,
  "placement": "LISTING_TOP"
}

// Variant 4: Footer
{
  "title": "Contact Us",
  "description": "Get in touch for custom orders",
  "imageUrl": "data:image/jpeg;base64,...",
  "duration": 60,
  "placement": "FOOTER"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Ad request submitted successfully",
  "data": {
    "ad": {
      "_id": "674f8a12b3c4d5e6f7890123",
      "title": "Premium Diamond Collection",
      "description": "Explore our exclusive certified diamond collection",
      "imageUrl": "https://s3.amazonaws.com/ads/674f8a12b3c4d5e6f7890123.jpg",
      "linkUrl": "https://example.com/diamonds",
      "duration": 30,
      "placement": "HOME_BANNER",
      "status": "PENDING",
      "submittedAt": "2024-12-07T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**

```json
// 429 Too Many Requests (Rate Limit Exceeded)
{
  "success": false,
  "message": "You have reached the maximum of 5 ad requests per day",
  "retryAfter": 43200
}

// 400 Bad Request (Validation Error)
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "title must be at least 5 characters",
    "imageUrl exceeds 2MB limit"
  ]
}

// 401 Unauthorized
{
  "success": false,
  "message": "Unauthorized"
}
```

---

### 2. GET /ads

Get active advertisements (public endpoint).

**Authentication:** Not required

**Query Parameters:**

| Parameter   | Type   | Values               | Default | Description         |
| ----------- | ------ | -------------------- | ------- | ------------------- |
| `placement` | string | See placement values | -       | Filter by placement |
| `limit`     | number | 1-50                 | 10      | Max ads to return   |

**Request Examples:**

```http
# Get home banner ads
GET /api/ads?placement=HOME_BANNER&limit=5

# Get all active ads
GET /api/ads?limit=20

# Get search sidebar ads
GET /api/ads?placement=SEARCH_SIDEBAR&limit=3
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Ads retrieved successfully",
  "data": {
    "ads": [
      {
        "_id": "674f8a12b3c4d5e6f7890123",
        "title": "Premium Diamond Collection",
        "description": "Explore our exclusive certified diamond collection",
        "imageUrl": "https://s3.amazonaws.com/ads/674f8a12b3c4d5e6f7890123.jpg",
        "linkUrl": "https://example.com/diamonds",
        "placement": "HOME_BANNER",
        "priority": 10,
        "impressions": 1523,
        "clicks": 89
      }
    ],
    "total": 1
  }
}
```

---

### 3. POST /ads/:id/click

Track ad click (analytics).

**Authentication:** Not required

**URL Parameters:**

- `id` - Ad MongoDB ObjectId (24 hex characters)

**Request Example:**

```http
POST /api/ads/674f8a12b3c4d5e6f7890123/click
Content-Type: application/json
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Click tracked successfully",
  "data": {
    "clicks": 90
  }
}
```

---

### 4. PUT /ads/:id/approve (Admin Only)

Approve or reject an advertisement request.

**Authentication:** Required (Admin JWT)

**URL Parameters:**

- `id` - Ad MongoDB ObjectId

**Request Body:**

```json
{
  "action": "APPROVE",
  "startDate": "2024-12-08T00:00:00.000Z",
  "priority": 8,
  "rejectionReason": "Inappropriate content"
}
```

**Field Details:**

| Field             | Type   | Required   | Description                          |
| ----------------- | ------ | ---------- | ------------------------------------ |
| `action`          | string | Yes        | `APPROVE` or `REJECT`                |
| `startDate`       | date   | If APPROVE | When ad should start                 |
| `priority`        | number | No         | 1-10, higher = more visible          |
| `rejectionReason` | string | If REJECT  | Reason for rejection (max 500 chars) |

**Action Variants:**

#### Variant 1: Approve Ad

```json
{
  "action": "APPROVE",
  "startDate": "2024-12-08T00:00:00.000Z",
  "priority": 10
}
```

#### Variant 2: Approve with Lower Priority

```json
{
  "action": "APPROVE",
  "startDate": "2024-12-10T00:00:00.000Z",
  "priority": 5
}
```

#### Variant 3: Reject Ad

```json
{
  "action": "REJECT",
  "rejectionReason": "Image quality does not meet standards"
}
```

#### Variant 4: Reject for Policy Violation

```json
{
  "action": "REJECT",
  "rejectionReason": "Content violates advertising policy - misleading claims"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Ad approved successfully",
  "data": {
    "ad": {
      "_id": "674f8a12b3c4d5e6f7890123",
      "status": "APPROVED",
      "startDate": "2024-12-08T00:00:00.000Z",
      "endDate": "2025-01-07T00:00:00.000Z",
      "priority": 10,
      "approvedBy": "674e9b01a2b3c4d5e6f78901",
      "approvedAt": "2024-12-07T15:30:00.000Z"
    }
  }
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "success": false,
  "message": "Ad not found"
}

// 403 Forbidden
{
  "success": false,
  "message": "Not authorized to perform this action"
}

// 400 Bad Request
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "startDate is required when action is APPROVE"
  ]
}
```

---

### 5. GET /ads/admin/list (Admin Only)

Get all ads for admin panel.

**Authentication:** Required (Admin JWT)

**Query Parameters:**

| Parameter   | Type   | Values                                          | Default       | Description      |
| ----------- | ------ | ----------------------------------------------- | ------------- | ---------------- |
| `page`      | number | >= 1                                            | 1             | Page number      |
| `limit`     | number | 1-100                                           | 50            | Items per page   |
| `status`    | string | `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`    | -             | Filter by status |
| `sortBy`    | string | `submittedAt`, `title`, `placement`, `duration` | `submittedAt` | Sort field       |
| `sortOrder` | string | `asc`, `desc`                                   | `desc`        | Sort direction   |

**Request Example:**

```http
GET /api/ads/admin/list?status=PENDING&sortBy=submittedAt&sortOrder=desc
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Ads retrieved successfully",
  "data": {
    "ads": [
      {
        "_id": "674f8a12b3c4d5e6f7890123",
        "title": "Premium Diamond Collection",
        "description": "Explore our exclusive certified diamond collection",
        "imageUrl": "https://s3.amazonaws.com/ads/674f8a12b3c4d5e6f7890123.jpg",
        "linkUrl": "https://example.com/diamonds",
        "duration": 30,
        "placement": "HOME_BANNER",
        "status": "PENDING",
        "submittedBy": {
          "_id": "674e9b01a2b3c4d5e6f78901",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "submittedAt": "2024-12-05T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalAds": 245,
      "limit": 50
    }
  }
}
```

---

## Advertisement Status Flow

```
PENDING
    ↓
    ├─→ APPROVED (Admin approves + sets start date)
    └─→ REJECTED (Admin rejects)

APPROVED → EXPIRED (After duration ends)
```

**Status Descriptions:**

- `PENDING` - Submitted, awaiting admin review
- `APPROVED` - Approved by admin, active or scheduled
- `REJECTED` - Rejected by admin
- `EXPIRED` - Duration completed

---

## Image Requirements

**Supported Formats:**

- JPEG
- PNG

**Size Limits:**

- Maximum: 2 MB (2,097,152 bytes)
- Recommended: Under 500 KB for optimal performance

**Dimensions (Recommended):**

- `HOME_BANNER`: 1920x400 px
- `SEARCH_SIDEBAR`: 300x600 px
- `LISTING_TOP`: 728x90 px
- `FOOTER`: 728x90 px

**Image Upload:**

- Base64 encoded string
- Automatically uploaded to S3
- URL returned in response

---

## Rate Limiting

**POST /ads/request:**

- 5 requests per 24 hours per user
- Counter resets at midnight UTC
- Returns 429 status when exceeded
- Response includes `retryAfter` seconds

**Other Endpoints:**

- 100 requests per minute

---

## Analytics Tracking

**Metrics Tracked:**

- Impressions (ad shown)
- Clicks (ad clicked)
- Click-through rate (CTR)
- Daily/weekly performance

**Access:**

- Users can view their own ad stats
- Admins can view all ad stats

---

## Best Practices

1. **Image Quality:**

   - Use high-quality images
   - Optimize file size before upload
   - Match recommended dimensions

2. **Content:**

   - Clear, concise titles
   - Accurate descriptions
   - Professional appearance

3. **Placement Selection:**

   - `HOME_BANNER` for maximum visibility
   - `SEARCH_SIDEBAR` for targeted audience
   - `LISTING_TOP` for product-specific ads
   - `FOOTER` for informational content

4. **Duration:**

   - 7 days: Short-term promotions
   - 30 days: Standard campaigns
   - 90 days: Long-term branding

5. **Rate Limit Management:**
   - Plan ad requests carefully (5/day limit)
   - Submit complete, error-free requests
   - Check existing ads before submitting new ones
