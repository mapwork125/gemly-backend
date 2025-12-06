# Authentication API Documentation

## Overview

User registration, login, profile management, and identity verification APIs.

**Base URL:** `/api/auth`

---

## Endpoints

### 1. POST /auth/register

Register a new user account.

**Authentication:** Not required

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "userType": "seller"
}
```

**Field Details:**

| Field             | Type   | Required | Validation                                   | Description           |
| ----------------- | ------ | -------- | -------------------------------------------- | --------------------- |
| `name`            | string | Yes      | Any                                          | Full name             |
| `email`           | string | Yes      | Valid email                                  | Email address         |
| `password`        | string | Yes      | 8+ chars, 1 uppercase, 1 lowercase, 1 number | Password              |
| `confirmPassword` | string | Yes      | Must match password                          | Password confirmation |
| `userType`        | string | Yes      | `buyer` or `seller`                          | User type             |

**User Type Variants:**

#### Variant 1: Buyer Registration

```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "BuyerPass123",
  "confirmPassword": "BuyerPass123",
  "userType": "buyer"
}
```

#### Variant 2: Seller Registration

```json
{
  "name": "Bob Johnson",
  "email": "bob@example.com",
  "password": "SellerPass123",
  "confirmPassword": "SellerPass123",
  "userType": "seller"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Registration successful. Please complete identity verification",
  "data": {
    "user": {
      "_id": "674e9b01a2b3c4d5e6f78901",
      "name": "John Doe",
      "email": "john@example.com",
      "userType": "seller",
      "status": "PENDING_KYC",
      "createdAt": "2024-12-07T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

```json
// 409 Conflict (Email exists)
{
  "success": false,
  "message": "Email already exists"
}

// 400 Bad Request (Validation)
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Password must be at least 8 characters long, include 1 uppercase letter, 1 lowercase letter, and 1 number",
    "Confirm Password must match Password"
  ]
}
```

---

### 2. POST /auth/login

User login.

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "674e9b01a2b3c4d5e6f78901",
      "name": "John Doe",
      "email": "john@example.com",
      "userType": "seller",
      "status": "APPROVED",
      "role": "1"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Status-Based Responses:**

#### Status: PENDING_KYC

```json
{
  "success": false,
  "message": "Please complete identity verification",
  "data": {
    "status": "PENDING_KYC",
    "nextStep": "/auth/verify-identity"
  }
}
```

#### Status: PENDING_ADMIN_APPROVAL

```json
{
  "success": false,
  "message": "Your account is awaiting admin approval",
  "data": {
    "status": "PENDING_ADMIN_APPROVAL"
  }
}
```

#### Status: REJECTED

```json
{
  "success": false,
  "message": "Your registration has been rejected. Please contact support",
  "data": {
    "status": "REJECTED",
    "rejectionReason": "Invalid documents provided"
  }
}
```

#### Status: SUSPENDED

```json
{
  "success": false,
  "message": "Your account is suspended. Contact support",
  "data": {
    "status": "SUSPENDED",
    "suspensionReason": "Terms of service violation"
  }
}
```

**Error Responses:**

```json
// 401 Unauthorized (Invalid credentials)
{
  "success": false,
  "message": "Email is incorrect"
}

{
  "success": false,
  "message": "Password is incorrect"
}

// 404 Not Found
{
  "success": false,
  "message": "User not found"
}
```

---

### 3. POST /auth/logout

User logout.

**Authentication:** Required (JWT Token)

**Request Body:** Empty

```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 4. GET /auth/profile

Get user profile.

**Authentication:** Required (JWT Token)

**Request Example:**

```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "674e9b01a2b3c4d5e6f78901",
      "name": "John Doe",
      "email": "john@example.com",
      "userType": "seller",
      "status": "APPROVED",
      "phoneNumber": "+1234567890",
      "companyDetails": {
        "companyName": "Diamond Corp",
        "companyRegistrationNumber": "REG123456",
        "companyAddress": {
          "line1": "123 Diamond Street",
          "line2": "Suite 100",
          "city": "New York",
          "state": "NY",
          "postalCode": "10001"
        }
      },
      "identityProof": {
        "proofType": "PAN",
        "proofNumber": "ABCDE1234F"
      },
      "diamondIndustryActivity": "Diamond wholesale and retail",
      "createdAt": "2024-12-01T10:00:00.000Z",
      "updatedAt": "2024-12-07T10:00:00.000Z"
    }
  }
}
```

---

### 5. PUT /auth/profile

Update user profile.

**Authentication:** Required (JWT Token)

**Request Body:**

```json
{
  "phoneNumber": "+1234567890",
  "companyAddress": {
    "line1": "123 Diamond Street",
    "line2": "Suite 100",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001"
  },
  "diamondIndustryActivity": "Diamond wholesale, retail, and certification services"
}
```

**Field Details:**

| Field                       | Type   | Required        | Description          |
| --------------------------- | ------ | --------------- | -------------------- |
| `phoneNumber`               | string | No              | Contact phone number |
| `companyAddress`            | object | No              | Company address      |
| `companyAddress.line1`      | string | Yes (if object) | Address line 1       |
| `companyAddress.line2`      | string | No              | Address line 2       |
| `companyAddress.city`       | string | Yes (if object) | City                 |
| `companyAddress.state`      | string | Yes (if object) | State/Province       |
| `companyAddress.postalCode` | string | Yes (if object) | Postal/ZIP code      |
| `diamondIndustryActivity`   | string | No              | Max 300 chars        |

**Update Variants:**

#### Variant 1: Update Phone Only

```json
{
  "phoneNumber": "+1987654321"
}
```

#### Variant 2: Update Address Only

```json
{
  "companyAddress": {
    "line1": "456 Gem Avenue",
    "city": "Los Angeles",
    "state": "CA",
    "postalCode": "90001"
  }
}
```

#### Variant 3: Update All Fields

```json
{
  "phoneNumber": "+1234567890",
  "companyAddress": {
    "line1": "789 Jewel Street",
    "line2": "Floor 5",
    "city": "Chicago",
    "state": "IL",
    "postalCode": "60601"
  },
  "diamondIndustryActivity": "Diamond trading and export"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile updated",
  "data": {
    "user": {
      "_id": "674e9b01a2b3c4d5e6f78901",
      "phoneNumber": "+1234567890",
      "companyAddress": {
        "line1": "123 Diamond Street",
        "line2": "Suite 100",
        "city": "New York",
        "state": "NY",
        "postalCode": "10001"
      },
      "updatedAt": "2024-12-07T11:00:00.000Z"
    }
  }
}
```

---

### 6. POST /auth/verify-identity

Submit identity verification (KYC).

**Authentication:** Required (JWT Token)

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field                                      | Type    | Required | Description                                      |
| ------------------------------------------ | ------- | -------- | ------------------------------------------------ |
| `fullName`                                 | string  | Yes      | Full legal name (min 3 chars)                    |
| `dateOfBirth`                              | date    | Yes      | Date of birth (YYYY-MM-DD)                       |
| `phoneNumber`                              | string  | Yes      | Contact phone                                    |
| `identityProof.proofType`                  | string  | Yes      | `Aadhar` or `PAN`                                |
| `identityProof.proofNumber`                | string  | Yes      | ID number                                        |
| `companyDetails.companyName`               | string  | Yes      | Company name                                     |
| `companyDetails.companyRegistrationNumber` | string  | No       | Registration number                              |
| `companyDetails.companyAddress.*`          | object  | Yes      | Company address (line1, city, state, postalCode) |
| `companyDetails.companyCountry`            | string  | Yes      | Country                                          |
| `businessType`                             | string  | Yes      | Type of business                                 |
| `diamondIndustryActivity`                  | string  | Yes      | Max 300 chars                                    |
| `isAuthorizedPerson`                       | boolean | No       | Default true                                     |
| `file`                                     | file    | Yes      | Identity document (JPEG, PNG, PDF, max 20MB)     |

**Request Example (multipart/form-data):**

```http
POST /api/auth/verify-identity
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

fullName: John Doe
dateOfBirth: 1985-05-15
phoneNumber: +1234567890
identityProof[proofType]: PAN
identityProof[proofNumber]: ABCDE1234F
companyDetails[companyName]: Diamond Corp
companyDetails[companyRegistrationNumber]: REG123456
companyDetails[companyAddress][line1]: 123 Diamond Street
companyDetails[companyAddress][city]: New York
companyDetails[companyAddress][state]: NY
companyDetails[companyAddress][postalCode]: 10001
companyDetails[companyCountry]: United States
businessType: Wholesale
diamondIndustryActivity: Diamond wholesale and certification
isAuthorizedPerson: true
file: [Binary File Data]
```

**Proof Type Variants:**

#### Variant 1: Aadhar Verification

```
identityProof[proofType]: Aadhar
identityProof[proofNumber]: 1234-5678-9012
file: aadhar_card.pdf
```

#### Variant 2: PAN Verification

```
identityProof[proofType]: PAN
identityProof[proofNumber]: ABCDE1234F
file: pan_card.jpg
```

**Business Type Variants:**

```
businessType: Wholesale
businessType: Retail
businessType: Manufacturing
businessType: Import/Export
businessType: Certification
businessType: Broker
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Identity verification submitted successfully",
  "data": {
    "user": {
      "_id": "674e9b01a2b3c4d5e6f78901",
      "status": "PENDING_ADMIN_APPROVAL",
      "identityProof": {
        "proofType": "PAN",
        "proofNumber": "ABCDE1234F",
        "documentUrl": "https://s3.amazonaws.com/identity/674e9b01a2b3c4d5e6f78901.pdf"
      },
      "companyDetails": {
        "companyName": "Diamond Corp",
        "companyRegistrationNumber": "REG123456"
      },
      "updatedAt": "2024-12-07T11:30:00.000Z"
    }
  }
}
```

**Error Responses:**

```json
// 400 Bad Request (No file)
{
  "success": false,
  "message": "No document uploaded"
}

// 400 Bad Request (Invalid file type)
{
  "success": false,
  "message": "Invalid file type. Only JPEG, PNG, and PDF are allowed"
}

// 413 Payload Too Large
{
  "success": false,
  "message": "File size exceeds 20MB limit"
}
```

---

## User Status Flow

```
Registration
    ↓
PENDING_KYC (Cannot access platform features)
    ↓ (Submit identity verification)
PENDING_ADMIN_APPROVAL (Cannot access platform features)
    ↓
    ├─→ APPROVED (Full access)
    ├─→ REJECTED (Cannot login, contact support)
    └─→ SUSPENDED (Account disabled)

APPROVED ←→ SUSPENDED (Admin can toggle)
```

**Status Descriptions:**

- **PENDING_KYC:** User registered but hasn't submitted identity documents
- **PENDING_ADMIN_APPROVAL:** Identity documents submitted, awaiting admin review
- **APPROVED:** User verified and can access all features
- **REJECTED:** Registration rejected, must contact support
- **SUSPENDED:** Account suspended due to violation

---

## Password Requirements

**Rules:**

- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- Optional special characters: @#$%^&+=!

**Valid Examples:**

- `SecurePass123`
- `Diamond@2024`
- `MyP@ssw0rd`

**Invalid Examples:**

- `password` (no uppercase, no number)
- `PASSWORD123` (no lowercase)
- `Password` (no number)
- `Pass12` (too short)

---

## Identity Document Requirements

**Supported Formats:**

- JPEG (.jpg, .jpeg)
- PNG (.png)
- PDF (.pdf)

**Size Limit:**

- Maximum: 20 MB

**Image Processing:**

- Images > 5MB automatically compressed
- Resized to max width 1920px
- JPEG quality 80%
- Stored in S3

**Required Documents:**

- **Aadhar:** Government-issued Aadhar card
- **PAN:** Permanent Account Number card

---

## JWT Token

**Token Structure:**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature
```

**Payload Contains:**

- User ID
- Email
- Role
- User type
- Expiration time

**Usage:**

```http
Authorization: Bearer <token>
```

**Expiration:**

- Default: 7 days
- Refresh not implemented (re-login required)

---

## Best Practices

1. **Registration:**

   - Use strong passwords
   - Provide accurate information
   - Verify email before registration

2. **Identity Verification:**

   - Submit clear, legible documents
   - Ensure all information matches ID
   - Use recent photographs/scans
   - Complete within 24 hours of registration

3. **Profile Management:**

   - Keep contact information updated
   - Update address if company relocates
   - Provide detailed industry activity description

4. **Security:**
   - Never share JWT tokens
   - Logout from shared devices
   - Use secure connections (HTTPS)
   - Store tokens securely on client side
