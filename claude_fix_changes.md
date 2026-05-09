# Gemly Backend — Frontend Integration Guide (Flutter)

**Prepared by:** Claude (AI Code Assistant)  
**Branch:** `claude_test_fix`  
**Date:** 2026-05-09  
**Base URL:** `https://<your-server>/api/v1`

---

## What Changed in This Branch

| Area | Change | Impact on Flutter |
|------|--------|-------------------|
| **Security Fix** | `GET /auth/profile` no longer returns the `password` hash | Profile response is now cleaner — no need to strip the field client-side |
| **Test Suite Added** | 66 integration tests for all auth routes | No Flutter change needed; confirms route contracts |

---

## Global Request/Response Rules

### Headers for every authenticated request

```dart
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <token>',
}
```

### Standard success response shape

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { ... }
}
```

### Standard error response shape

```json
{
  "success": false,
  "message": "Human-readable error",
  "errors": { "fieldName": "validation message" },  // present on 400 only
  "code": "ERROR_CODE_STRING",
  "timestamp": "2026-05-09T10:00:00.000Z"
}
```

> **Note:** Routes protected by the auth middleware use `"status": false` instead of `"success": false` in their 401/403 responses. Always check HTTP status code first.

---

## Auth Flows

---

### 1. Register — `POST /api/v1/auth/register`

**No auth required.**

#### Request

```dart
final response = await http.post(
  Uri.parse('$baseUrl/auth/register'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'name': 'John Doe',
    'email': 'john@example.com',
    'password': 'Password1',       // min 8 chars, 1 uppercase, 1 digit
    'confirmPassword': 'Password1',
    'userType': 'buyer',           // 'buyer' or 'seller'
  }),
);
```

#### Field Rules

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | — |
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | ≥ 8 chars, 1 uppercase, 1 lowercase, 1 digit |
| `confirmPassword` | string | Yes | Must exactly match `password` |
| `userType` | string | Yes | Exactly `"buyer"` or `"seller"` |

#### Success Response — HTTP 200

```json
{
  "success": true,
  "message": "Registration successful. Please complete identity verification",
  "data": {
    "status": "PENDING_KYC",
    "token": "<jwt>"
  },
  "status": "PENDING_KYC"
}
```

> **Flutter:** Save `data.token` securely (e.g. `flutter_secure_storage`). The user must complete KYC (`/auth/verify-identity`) before accessing write endpoints.

#### Error Responses

| HTTP | `code` | Cause |
|------|--------|-------|
| 400 | — | Validation failed — check `errors` object for field-level messages |
| 409 | `EMAIL_ALREADY_EXISTS` | Email already registered |

---

### 2. Login — `POST /api/v1/auth/login`

**No auth required.**

#### Request

```dart
final response = await http.post(
  Uri.parse('$baseUrl/auth/login'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'email': 'john@example.com',
    'password': 'Password1',
  }),
);
```

#### Success Response — HTTP 200

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {},
  "status": "APPROVED",
  "token": "<jwt>"
}
```

> **Flutter:** Token is at **root level** (`response['token']`), NOT inside `data`. This differs from register where it's inside `data.token`.

#### Account Status After Login

The `status` field tells the Flutter app where to route the user:

| `status` value | `message` | Recommended Flutter action |
|---|---|---|
| `PENDING_KYC` | "Please complete identity verification." | Navigate to KYC screen |
| `PENDING_ADMIN_APPROVAL` | "Your account is awaiting admin approval." | Show waiting screen |
| `APPROVED` | "Login successful." | Navigate to home/dashboard |

> Rejected and suspended accounts receive **403**, not 200.

#### Error Responses

| HTTP | `code` | Cause |
|------|--------|-------|
| 400 | — | Missing email or password |
| 401 | `EMAIL_NOT_MATCH` | Email not found |
| 401 | `PASSWORD_NOT_MATCH` | Wrong password |
| 403 | `ACCOUNT_REJECTED` | Account rejected by admin |
| 403 | `ACCOUNT_SUSPENDED` | Account suspended |

---

### 3. Verify Identity (KYC) — `POST /api/v1/auth/verify-identity`

**Auth required.** Only for users with `PENDING_KYC` status.  
**Content-Type:** `multipart/form-data`

This is the only write endpoint a `PENDING_KYC` user can access.

#### Request (Flutter multipart example)

```dart
var request = http.MultipartRequest(
  'POST',
  Uri.parse('$baseUrl/auth/verify-identity'),
);

request.headers['Authorization'] = 'Bearer $token';

// Flat fields
request.fields['fullName'] = 'John Doe';
request.fields['dateOfBirth'] = '1990-01-15';      // YYYY-MM-DD
request.fields['phoneNumber'] = '+1234567890';
request.fields['businessType'] = 'Diamond Trading';
request.fields['diamondIndustryActivity'] = 'Wholesale diamond trading and certification';
request.fields['isAuthorizedPerson'] = 'true';

// Nested fields — use bracket notation
request.fields['identityProof[proofType]'] = 'Aadhar';   // 'Aadhar' or 'PAN'
request.fields['identityProof[proofNumber]'] = '123456789012';

request.fields['companyDetails[companyName]'] = 'Diamond Corp Pvt Ltd';
request.fields['companyDetails[companyRegistrationNumber]'] = 'REG123456'; // optional
request.fields['companyDetails[companyAddress][line1]'] = '123 Diamond Street';
request.fields['companyDetails[companyAddress][line2]'] = 'Suite 100';    // optional
request.fields['companyDetails[companyAddress][city]'] = 'Mumbai';
request.fields['companyDetails[companyAddress][state]'] = 'Maharashtra';
request.fields['companyDetails[companyAddress][postalCode]'] = '400001';
request.fields['companyDetails[companyCountry]'] = 'India';

// Document file (JPEG, PNG, or PDF — max 20 MB)
// Images > 5 MB are automatically compressed server-side
request.files.add(await http.MultipartFile.fromPath(
  'document',
  filePath,
  contentType: MediaType('image', 'jpeg'), // or 'png' / 'application/pdf'
));

final streamedResponse = await request.send();
final response = await http.Response.fromStream(streamedResponse);
```

#### Field Rules

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `fullName` | string | Yes | Min 3 chars |
| `dateOfBirth` | string | Yes | `YYYY-MM-DD` format |
| `phoneNumber` | string | Yes | |
| `identityProof[proofType]` | string | Yes | `"Aadhar"` or `"PAN"` |
| `identityProof[proofNumber]` | string | Yes | |
| `companyDetails[companyName]` | string | Yes | |
| `companyDetails[companyAddress][line1]` | string | Yes | |
| `companyDetails[companyAddress][city]` | string | Yes | |
| `companyDetails[companyAddress][state]` | string | Yes | |
| `companyDetails[companyAddress][postalCode]` | string | Yes | |
| `companyDetails[companyCountry]` | string | Yes | |
| `businessType` | string | Yes | |
| `diamondIndustryActivity` | string | Yes | Max 300 chars |
| `document` | file | Yes | JPEG / PNG / PDF, max 20 MB |
| `companyDetails[companyRegistrationNumber]` | string | No | |
| `companyDetails[companyAddress][line2]` | string | No | |
| `isAuthorizedPerson` | string | No | `"true"` or `"false"` |

> **Important:** All nested fields MUST use bracket notation in the `fields` map. This is how the server parses them into nested objects.

#### Success Response — HTTP 200

```json
{
  "success": true,
  "message": "Your account is awaiting admin approval.",
  "data": {},
  "status": "PENDING_ADMIN_APPROVAL"
}
```

> **Flutter:** After success, update the local user status to `PENDING_ADMIN_APPROVAL` and navigate to a waiting screen. The user cannot submit again until admin acts.

#### Error Responses

| HTTP | Cause | Flutter Action |
|------|-------|----------------|
| 400 | No document file attached | Show file picker error |
| 400 | Missing required form fields | Highlight missing fields |
| 401 | Missing or invalid token | Redirect to login |
| 403 | User already submitted KYC (`PENDING_ADMIN_APPROVAL`) | Show "already submitted" message |
| 403 | Account rejected/suspended | Show appropriate message |

---

### 4. Get Profile — `GET /api/v1/auth/profile`

**Auth required.** Works for ALL user statuses (GET routes are never status-blocked).

#### Request

```dart
final response = await http.get(
  Uri.parse('$baseUrl/auth/profile'),
  headers: {
    'Authorization': 'Bearer $token',
  },
);
```

#### Success Response — HTTP 200

```json
{
  "success": true,
  "message": "Profile get successfully",
  "data": {
    "_id": "64abc...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "1",
    "userType": "buyer",
    "status": "APPROVED",
    "notificationsEnabled": true,
    "isVerified": false,
    "kyc": { ... },
    "stats": {
      "averageRating": 0,
      "totalRatings": 0,
      "reputationScore": 0,
      "completedDeals": 0,
      "canceledDeals": 0
    },
    "createdAt": "2026-05-09T10:00:00.000Z",
    "updatedAt": "2026-05-09T10:00:00.000Z"
  }
}
```

> **Security fix in this branch:** The `password` field is no longer included in the response. No client-side stripping needed.

> **Flutter tip:** Cache the profile response locally. Refresh it after login and after profile updates.

#### Error Responses

| HTTP | Cause |
|------|-------|
| 401 | `"Authorization header is missing"` — no token |
| 401 | `"Invalid or malformed token"` — bad or expired/invalidated token |

---

### 5. Update Profile — `PUT /api/v1/auth/profile`

**Auth required.** Only APPROVED users can call this endpoint.

#### Request

```dart
final response = await http.put(
  Uri.parse('$baseUrl/auth/profile'),
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  },
  body: jsonEncode({
    'phoneNumber': '+919876543210',                 // optional
    'diamondIndustryActivity': 'Updated activity',  // optional, max 300 chars
    'companyAddress': {                             // optional — if provided, ALL sub-fields required
      'line1': '456 New Street',
      'line2': 'Floor 2',
      'city': 'Delhi',
      'state': 'Delhi',
      'postalCode': '110001',
    },
  }),
);
```

#### Field Rules

All fields are optional. If `companyAddress` is provided, `line1`, `city`, `state`, and `postalCode` become required inside it.

#### Success Response — HTTP 200

```json
{
  "success": true,
  "message": "Profile updated",
  "data": { ...updatedUserObject }
}
```

#### Error Responses

| HTTP | Cause |
|------|-------|
| 400 | Validation error (e.g., `companyAddress` partial — missing city/state) |
| 401 | Missing or invalid token |
| 403 | User is `PENDING_KYC` or `PENDING_ADMIN_APPROVAL` |

---

### 6. Logout — `POST /api/v1/auth/logout`

**Auth required.** Only APPROVED users (and admins) can logout. `PENDING_KYC` users are blocked by the auth middleware.

> **Current behaviour:** After `POST /verify-identity`, a user becomes `PENDING_ADMIN_APPROVAL`. They must wait for admin approval before they can logout. If the Flutter app needs the user to "leave" before approval, clear the token locally without calling the logout API.

#### Request

```dart
final response = await http.post(
  Uri.parse('$baseUrl/auth/logout'),
  headers: {
    'Authorization': 'Bearer $token',
  },
);
```

#### Success Response — HTTP 200

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {}
}
```

> **Flutter:** On success (or always), clear the stored token from `flutter_secure_storage` and navigate to the login screen. The old token is now permanently invalidated server-side — even if someone captures it, it will fail with 401.

#### Error Responses

| HTTP | Cause |
|------|-------|
| 401 | No token provided |
| 403 | User status is `PENDING_KYC` (cannot logout until KYC submitted and approved) |

---

## Token Lifecycle — Summary for Flutter

```
Register ──► token issued (PENDING_KYC)
                 │
                 ▼
          POST /verify-identity ──► status becomes PENDING_ADMIN_APPROVAL
                 │
                 ▼
          Admin approves ──► status becomes APPROVED
                 │
                 ▼
          Full access to all routes
                 │
                 ▼
          POST /logout ──► tokenVersion bumped on server
                 │         Old token → 401 on next request
                 ▼
          Re-login ──► fresh token issued
```

### When to refresh/invalidate the token locally

| Situation | Action |
|---|---|
| Logout response 200 | Clear token, go to login |
| Any API returns 401 | Clear token, go to login (token invalidated) |
| Login response `status = PENDING_KYC` | Save token, go to KYC screen |
| Login response `status = PENDING_ADMIN_APPROVAL` | Save token, show waiting screen |
| Login response `status = APPROVED` | Save token, go to home |

---

## Route Access Matrix by User Status

| Endpoint | PENDING_KYC | PENDING_ADMIN_APPROVAL | APPROVED | ADMIN |
|---|---|---|---|---|
| `POST /register` | — | — | — | — |
| `POST /login` | — | — | — | — |
| `GET /profile` | ✅ | ✅ | ✅ | ✅ |
| `POST /verify-identity` | ✅ | ❌ 403 | ✅ | ✅ |
| `PUT /profile` | ❌ 403 | ❌ 403 | ✅ | ✅ |
| `POST /logout` | ❌ 403 | ❌ 403 | ✅ | ✅ |
| `GET /admin/*` | ❌ 403 | ❌ 403 | ❌ 403 | ✅ |
| All other write routes | ❌ 403 | ❌ 403 | ✅ | ✅ |

> **Key rule:** GET routes are NEVER blocked by user status. Only write routes (POST / PUT / PATCH / DELETE) are gated. The sole exception is `POST /verify-identity` which is explicitly whitelisted for `PENDING_KYC` users.

---

## Error Code Reference

| Code | HTTP | Meaning | Flutter Action |
|------|------|---------|---------------|
| `EMAIL_ALREADY_EXISTS` | 409 | Email taken at register | Show "email already in use" |
| `EMAIL_NOT_MATCH` | 401 | Email not found at login | Show "invalid credentials" |
| `PASSWORD_NOT_MATCH` | 401 | Wrong password | Show "invalid credentials" |
| `ACCOUNT_REJECTED` | 403 | Admin rejected the account | Show rejection message + contact support |
| `ACCOUNT_SUSPENDED` | 403 | Admin suspended the account | Show suspension message |
| `AUTH_TOKEN_MISSING` | 401 | No `Authorization` header | Redirect to login |
| `AUTH_TOKEN_INVALID` | 401 | Bad/expired/logged-out token | Redirect to login |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled server error (incl. malformed JWT) | Show generic error |

---

## Recommended Flutter Service Structure

```dart
class AuthService {
  static const _baseUrl = 'https://<your-server>/api/v1/auth';
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';

  // ── Token helpers ─────────────────────────────────────────────────────────

  static Future<void> saveToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  static Future<String?> getToken() => _storage.read(key: _tokenKey);

  static Future<void> clearToken() => _storage.delete(key: _tokenKey);

  // ── Auth headers ──────────────────────────────────────────────────────────

  static Future<Map<String, String>> authHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ── Endpoints ─────────────────────────────────────────────────────────────

  static Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    required String userType,
  }) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
        'confirmPassword': password,
        'userType': userType,
      }),
    );
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200) {
      await saveToken(body['data']['token'] as String); // token is inside data
    }
    return body;
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200) {
      await saveToken(body['token'] as String); // token is at ROOT level
    }
    return body;
  }

  static Future<Map<String, dynamic>> getProfile() async {
    final res = await http.get(
      Uri.parse('$_baseUrl/profile'),
      headers: await authHeaders(),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> logout() async {
    final res = await http.post(
      Uri.parse('$_baseUrl/logout'),
      headers: await authHeaders(),
    );
    await clearToken(); // always clear locally
    return jsonDecode(res.body) as Map<String, dynamic>;
  }
}
```

---

## Common Gotchas

1. **Token location differs between register and login:**
   - Register → `response['data']['token']`
   - Login → `response['token']` (root level)

2. **`status` vs `success` field in error bodies:**
   - Business errors (validation, duplicate email, wrong password) use `"success": false`
   - Auth middleware errors (missing token, bad token, status-blocked) use `"status": false`
   - Always rely on the **HTTP status code** first, then read the body

3. **KYC multipart fields must use bracket notation:**
   - `request.fields['identityProof[proofType]']` ← correct
   - Sending a JSON-encoded string will NOT work for the `document` file endpoint

4. **`PENDING_KYC` users cannot logout via API:**
   - If you need to clear the session before KYC, just delete the token locally with `clearToken()` without calling the API

5. **Profile no longer returns password hash** (fixed in this branch):
   - Previously the `data.password` field contained the bcrypt hash — it is now removed server-side
