# Admin API Documentation

## Overview

Admin panel APIs for user management, advertisement approval, and system administration.

**Base URL:** `/api/admin`

**Authentication:** Required (JWT Token)

**Authorization:** Admin role required (`USER_ROLE.ADMIN`)

---

## Endpoints

### 1. GET /admin/users

List all users with filtering, search, and pagination.

**Authentication:** Required (Admin only)

**Query Parameters:**

| Parameter   | Type   | Values                                    | Default     | Description           |
| ----------- | ------ | ----------------------------------------- | ----------- | --------------------- |
| `page`      | number | >= 1                                      | 1           | Page number           |
| `limit`     | number | 1-100                                     | 50          | Items per page        |
| `status`    | string | See status values                         | -           | Filter by user status |
| `userType`  | string | `buyer`, `seller`                         | -           | Filter by user type   |
| `search`    | string | min 2 chars                               | -           | Search by name/email  |
| `sortBy`    | string | `createdAt`, `name`, `userType`, `status` | `createdAt` | Sort field            |
| `sortOrder` | string | `asc`, `desc`                             | `desc`      | Sort direction        |

**Status Values:**

- `PENDING_KYC` - User registered, needs identity verification
- `PENDING_ADMIN_APPROVAL` - KYC completed, awaiting admin approval
- `APPROVED` - User approved and active
- `REJECTED` - User registration rejected
- `SUSPENDED` - User account suspended

**Request Example:**

```http
GET /api/admin/users?page=1&limit=50&status=PENDING_ADMIN_APPROVAL&userType=seller
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "_id": "674e9b01a2b3c4d5e6f78901",
        "name": "John Doe",
        "email": "john@example.com",
        "userType": "seller",
        "status": "PENDING_ADMIN_APPROVAL",
        "phoneNumber": "+1234567890",
        "companyDetails": {
          "companyName": "Diamond Corp",
          "companyRegistrationNumber": "REG123456",
          "companyAddress": {
            "line1": "123 Diamond Street",
            "city": "New York",
            "state": "NY",
            "postalCode": "10001"
          }
        },
        "identityProof": {
          "proofType": "PAN",
          "proofNumber": "ABCDE1234F"
        },
        "createdAt": "2024-12-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 245,
      "limit": 50
    }
  }
}
```

---

### 2. PUT /admin/users/:id

Approve, reject, or suspend a user account.

**Authentication:** Required (Admin only)

**URL Parameters:**

- `id` - MongoDB ObjectId (24 hex characters)

**Request Body:**

```json
{
  "action": "APPROVE", // "APPROVE" | "REJECT" | "SUSPEND"
  "rejectionReason": "Invalid documents provided", // Required if action = "REJECT"
  "suspensionReason": "Fraudulent activity detected" // Required if action = "SUSPEND"
}
```

**Action Variants:**

#### Variant 1: Approve User

```json
{
  "action": "APPROVE"
}
```

#### Variant 2: Reject User

```json
{
  "action": "REJECT",
  "rejectionReason": "Invalid documents provided"
}
```

#### Variant 3: Suspend User

```json
{
  "action": "SUSPEND",
  "suspensionReason": "Terms of service violation"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User approved successfully",
  "data": {
    "user": {
      "_id": "674e9b01a2b3c4d5e6f78901",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "APPROVED",
      "updatedAt": "2024-12-07T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "success": false,
  "message": "User not found"
}

// 400 Bad Request
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "rejectionReason is required when action is REJECT"
  ]
}

// 403 Forbidden
{
  "success": false,
  "message": "Not authorized to perform this action"
}
```

---

### 3. GET /admin/ads

List all advertisement requests with filtering.

**Authentication:** Required (Admin only)

**Query Parameters:**

| Parameter   | Type   | Values                                          | Default       | Description         |
| ----------- | ------ | ----------------------------------------------- | ------------- | ------------------- |
| `page`      | number | >= 1                                            | 1             | Page number         |
| `limit`     | number | 1-100                                           | 50            | Items per page      |
| `status`    | string | See status values                               | -             | Filter by ad status |
| `sortBy`    | string | `submittedAt`, `title`, `placement`, `duration` | `submittedAt` | Sort field          |
| `sortOrder` | string | `asc`, `desc`                                   | `desc`        | Sort direction      |

**Ad Status Values:**

- `PENDING` - Awaiting admin review
- `APPROVED` - Ad approved and active
- `REJECTED` - Ad rejected by admin
- `EXPIRED` - Ad duration completed

**Request Example:**

```http
GET /api/admin/ads?status=PENDING&sortBy=submittedAt&sortOrder=desc
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
        "description": "Explore our certified diamond collection",
        "imageUrl": "https://example.com/ad-image.jpg",
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
      "totalPages": 3,
      "totalAds": 125,
      "limit": 50
    }
  }
}
```

---

## Status Flow Diagrams

### User Status Flow

```
PENDING_KYC
    ↓ (User completes KYC)
PENDING_ADMIN_APPROVAL
    ↓
    ├─→ APPROVED (Admin approves)
    ├─→ REJECTED (Admin rejects)
    └─→ SUSPENDED (Admin suspends)

APPROVED → SUSPENDED (Admin action)
SUSPENDED → APPROVED (Admin reinstates)
```

### Advertisement Status Flow

```
PENDING
    ↓
    ├─→ APPROVED (Admin approves + sets start date)
    └─→ REJECTED (Admin rejects)

APPROVED → EXPIRED (After duration ends)
```

---

## Common Error Codes

| Status Code | Description                              |
| ----------- | ---------------------------------------- |
| 400         | Bad Request - Validation failed          |
| 401         | Unauthorized - Missing/invalid JWT token |
| 403         | Forbidden - Not admin role               |
| 404         | Not Found - User/Ad not found            |
| 500         | Internal Server Error                    |

---

## Rate Limiting

**All admin endpoints:**

- 100 requests per minute per admin user
- Returns 429 status code when exceeded

---

## Audit Logging

All admin actions are logged:

- User approval/rejection/suspension
- Advertisement approval/rejection
- Includes: Admin ID, IP address, timestamp, action details

---

## Best Practices

1. **User Management:**

   - Review identity documents before approval
   - Provide clear rejection/suspension reasons
   - Check for duplicate accounts

2. **Advertisement Review:**

   - Verify image appropriateness
   - Check link URL validity
   - Set appropriate start dates for approved ads

3. **Search & Filter:**
   - Use status filters to prioritize pending actions
   - Use search for specific users by name/email
   - Sort by `createdAt` to process oldest requests first
