/**
 * Auth module integration tests
 *
 * Coverage:
 *  POST   /api/v1/auth/register
 *  POST   /api/v1/auth/login
 *  POST   /api/v1/auth/verify-identity  (multipart)
 *  GET    /api/v1/auth/profile
 *  PUT    /api/v1/auth/profile
 *  POST   /api/v1/auth/logout
 *  Token / session validation
 *  Admin route access control (GET /api/v1/admin/users)
 *  Middleware route protection for status-gated routes
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import {
  register,
  login,
  submitKyc,
  createPendingKycUser,
  createPendingApprovalUser,
  createApprovedUser,
  createAdminUser,
  BASE_REGISTER_BUYER,
  VALID_PASSWORD,
  TINY_PNG,
  KYC_FIELDS,
} from '../helpers/user.helper';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/register
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/register', () => {
  // ── Happy paths ──────────────────────────────────────────────────────────

  it('registers a buyer and returns token + PENDING_KYC status', async () => {
    const res = await register();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('PENDING_KYC');
    expect(res.body.data).toHaveProperty('token');
    expect(typeof res.body.data.token).toBe('string');
  });

  it('registers a seller successfully', async () => {
    const res = await register({ email: 'seller@test.com', userType: 'seller', name: 'Test Seller' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('PENDING_KYC');
    expect(res.body.data).toHaveProperty('token');
  });

  // ── Duplicate account ────────────────────────────────────────────────────

  it('rejects duplicate email with 409', async () => {
    await register(); // first registration

    const res = await register(); // same email

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  // ── Validation — missing / invalid fields ────────────────────────────────

  it('rejects empty body with 400', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects missing name with 400', async () => {
    const { name: _omit, ...payload } = BASE_REGISTER_BUYER;
    const res = await request(app).post('/api/v1/auth/register').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveProperty('name');
  });

  it('rejects invalid email format with 400', async () => {
    const res = await register({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveProperty('email');
  });

  it('rejects password without uppercase letter with 400', async () => {
    const res = await register({ password: 'password1', confirmPassword: 'password1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveProperty('password');
  });

  it('rejects password without a digit with 400', async () => {
    const res = await register({ password: 'PasswordOnly', confirmPassword: 'PasswordOnly' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveProperty('password');
  });

  it('rejects password shorter than 8 characters with 400', async () => {
    const res = await register({ password: 'Pass1', confirmPassword: 'Pass1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveProperty('password');
  });

  it('rejects mismatched confirmPassword with 400', async () => {
    const res = await register({ confirmPassword: 'DifferentPass1' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveProperty('confirmPassword');
  });

  it('rejects invalid userType with 400', async () => {
    const res = await register({ userType: 'admin' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveProperty('userType');
  });

  it('rejects missing userType with 400', async () => {
    const { userType: _omit, ...payload } = BASE_REGISTER_BUYER;
    const res = await request(app).post('/api/v1/auth/register').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/login', () => {
  // ── Happy paths ──────────────────────────────────────────────────────────

  it('logs in a PENDING_KYC user and returns a token', async () => {
    await register(); // creates user in DB

    const res = await login(BASE_REGISTER_BUYER.email, VALID_PASSWORD);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.status).toBe('PENDING_KYC');
  });

  it('logs in an APPROVED user and returns LOGIN_SUCCESS message', async () => {
    const { user } = await createApprovedUser();

    const res = await login(user.email, VALID_PASSWORD);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.status).toBe('APPROVED');
    expect(res.body.message).toBe('Login successful.');
  });

  it('logs in a PENDING_ADMIN_APPROVAL user and returns token with informational message', async () => {
    const { user } = await createPendingApprovalUser();

    const res = await login(user.email, VALID_PASSWORD);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.status).toBe('PENDING_ADMIN_APPROVAL');
  });

  // ── Invalid credentials ──────────────────────────────────────────────────

  it('rejects non-existent email with 401', async () => {
    const res = await login('nobody@test.com', VALID_PASSWORD);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('EMAIL_NOT_MATCH');
  });

  it('rejects wrong password with 401', async () => {
    await register();

    const res = await login(BASE_REGISTER_BUYER.email, 'WrongPass1');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('PASSWORD_NOT_MATCH');
  });

  // ── Account status blocks ────────────────────────────────────────────────

  it('blocks a REJECTED account with 403', async () => {
    const { user } = await createApprovedUser({ email: 'rejected@test.com' });
    user.status = 'REJECTED' as any;
    await user.save();

    const res = await login(user.email, VALID_PASSWORD);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('ACCOUNT_REJECTED');
  });

  it('blocks a SUSPENDED account with 403', async () => {
    const { user } = await createApprovedUser({ email: 'suspended@test.com' });
    user.status = 'SUSPENDED' as any;
    await user.save();

    const res = await login(user.email, VALID_PASSWORD);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('ACCOUNT_SUSPENDED');
  });

  // ── Validation ───────────────────────────────────────────────────────────

  it('rejects missing email with 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ password: VALID_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects missing password with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: BASE_REGISTER_BUYER.email });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects empty body with 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/verify-identity
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/verify-identity', () => {
  // ── Happy path ───────────────────────────────────────────────────────────

  it('accepts KYC submission for a PENDING_KYC user and moves them to PENDING_ADMIN_APPROVAL', async () => {
    const { token } = await createPendingKycUser();

    const res = await submitKyc(token);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('PENDING_ADMIN_APPROVAL');
  });

  // ── Auth guards ──────────────────────────────────────────────────────────

  it('rejects request with no Authorization header with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-identity')
      .field('fullName', 'John Diamond')
      .attach('document', TINY_PNG, { filename: 'id.png', contentType: 'image/png' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toContain('missing');
  });

  it('rejects a malformed / invalid JWT token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-identity')
      .set('Authorization', 'Bearer this.is.not.valid')
      .attach('document', TINY_PNG, { filename: 'id.png', contentType: 'image/png' });

    // JWT verification throws → error handler responds (typically 500 for jwt errors)
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects a token signed with a wrong secret', async () => {
    const badToken = jwt.sign({ id: 'fakeid', role: '1', tokenVersion: 0 }, 'wrong-secret');
    const res = await request(app)
      .post('/api/v1/auth/verify-identity')
      .set('Authorization', `Bearer ${badToken}`)
      .attach('document', TINY_PNG, { filename: 'id.png', contentType: 'image/png' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  // ── File requirement ─────────────────────────────────────────────────────

  it('returns 400 when no document file is attached', async () => {
    const { token } = await createPendingKycUser();

    // Send form fields but omit the file
    let req = request(app)
      .post('/api/v1/auth/verify-identity')
      .set('Authorization', `Bearer ${token}`);
    for (const [key, value] of Object.entries(KYC_FIELDS)) {
      req = req.field(key, value);
    }
    const res = await req;

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('No document');
  });

  it('rejects a file with an unsupported MIME type', async () => {
    const { token } = await createPendingKycUser();

    // Attach a text file (not allowed)
    const res = await request(app)
      .post('/api/v1/auth/verify-identity')
      .set('Authorization', `Bearer ${token}`)
      .attach('document', Buffer.from('hello'), { filename: 'test.txt', contentType: 'text/plain' });

    // Multer rejects invalid MIME types before the controller runs
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // ── Body validation ──────────────────────────────────────────────────────

  it('returns 400 when required KYC fields are missing', async () => {
    const { token } = await createPendingKycUser();

    // Send only the file, no form fields
    const res = await request(app)
      .post('/api/v1/auth/verify-identity')
      .set('Authorization', `Bearer ${token}`)
      .attach('document', TINY_PNG, { filename: 'id.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── Status-based blocks ──────────────────────────────────────────────────

  it('blocks a PENDING_ADMIN_APPROVAL user from re-submitting KYC with 403', async () => {
    const { token } = await createPendingApprovalUser();

    const res = await submitKyc(token);

    expect(res.status).toBe(403);
    // Uses { status: false } pattern from auth middleware
    expect(res.body.status).toBe(false);
    expect(res.body.message).toContain('KYC submitted');
  });

  it('blocks a REJECTED user from submitting KYC with 403', async () => {
    const { token } = await createApprovedUser({ email: 'rej@test.com' });
    // Manually set status to REJECTED for this user
    const { user } = await createPendingKycUser({ email: 'rejkyc@test.com' });
    user.status = 'REJECTED' as any;
    await user.save();
    const rejToken = generateTokenForUser(user);

    const res = await submitKyc(rejToken);

    expect(res.status).toBe(403);
  });

  it('allows an APPROVED user to re-submit KYC (no status block for APPROVED)', async () => {
    const { token } = await createApprovedUser();

    const res = await submitKyc(token);

    // APPROVED users are not blocked by the middleware; service updates their KYC
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/auth/profile
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/auth/profile', () => {
  it('returns user profile with a valid token', async () => {
    const { user, token } = await createApprovedUser();

    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('email', user.email);
    // Password must never appear in the profile response
    expect(JSON.stringify(res.body)).not.toContain('"password"');
  });

  it('allows a PENDING_KYC user to view their profile (GET is never status-blocked)', async () => {
    const { token } = await createPendingKycUser();

    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('allows a PENDING_ADMIN_APPROVAL user to view their profile', async () => {
    const { token } = await createPendingApprovalUser();

    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 when Authorization header is absent', async () => {
    const res = await request(app).get('/api/v1/auth/profile');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toContain('missing');
  });

  it('returns 401 when the token has been invalidated by logout', async () => {
    const { token } = await createApprovedUser();

    // Logout to bump tokenVersion
    await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toContain('Invalid');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/auth/profile
// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/v1/auth/profile', () => {
  it('allows an APPROVED user to update their profile', async () => {
    const { token } = await createApprovedUser();

    const res = await request(app)
      .put('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ phoneNumber: '+919876543210' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 with no Authorization header', async () => {
    const res = await request(app)
      .put('/api/v1/auth/profile')
      .send({ phoneNumber: '+911111111111' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
  });

  it('blocks a PENDING_KYC user from updating profile (not a KYC endpoint)', async () => {
    const { token } = await createPendingKycUser();

    const res = await request(app)
      .put('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ phoneNumber: '+911111111111' });

    expect(res.status).toBe(403);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toContain('no KYC submitted');
  });

  it('blocks a PENDING_ADMIN_APPROVAL user from updating profile', async () => {
    const { token } = await createPendingApprovalUser();

    const res = await request(app)
      .put('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ phoneNumber: '+911111111111' });

    expect(res.status).toBe(403);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toContain('admin review');
  });

  it('returns 400 for invalid profile update payload', async () => {
    const { token } = await createApprovedUser();

    // companyAddress object provided but required sub-fields are missing
    const res = await request(app)
      .put('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ companyAddress: { line1: 'Only line1 provided' } }); // city/state/postalCode missing

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/logout', () => {
  it('logs out an APPROVED user successfully', async () => {
    const { token } = await createApprovedUser();

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Logged out successfully');
  });

  it('invalidates the token after logout — subsequent authenticated requests fail with 401', async () => {
    const { token } = await createApprovedUser();

    await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
  });

  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app).post('/api/v1/auth/logout');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
  });

  it('blocks a PENDING_KYC user from logging out (auth middleware status gate on POST)', async () => {
    const { token } = await createPendingKycUser();

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    // POST /logout is blocked for PENDING_KYC; only /verify-identity is exempt
    expect(res.status).toBe(403);
    expect(res.body.status).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Token & Session Validation
// ─────────────────────────────────────────────────────────────────────────────
describe('Token & Session Validation', () => {
  it('returns 401 when Authorization header is completely absent', async () => {
    const res = await request(app).get('/api/v1/auth/profile');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe('Authorization header is missing');
  });

  it('rejects a JWT signed with a wrong secret key', async () => {
    const badToken = jwt.sign({ id: 'abc123', role: '1', tokenVersion: 0 }, 'wrong-secret');

    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${badToken}`);

    // JSON Web Token errors propagate to the global error handler → ≥ 400
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects a structurally malformed token (not a JWT)', async () => {
    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', 'Bearer not.a.valid.jwt.token');

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects token with tokenVersion mismatch after logout (invalidation)', async () => {
    const { token } = await createApprovedUser();

    // Logout increments tokenVersion from 0 → 1
    await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe('Invalid or malformed token');
  });

  it('accepts a fresh token issued after re-login following logout', async () => {
    const { user, token: oldToken } = await createApprovedUser();

    // Logout
    await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${oldToken}`);

    // Re-login
    const loginRes = await login(user.email, VALID_PASSWORD);
    expect(loginRes.status).toBe(200);
    const newToken = loginRes.body.token;

    // New token should work
    const profileRes = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${newToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.success).toBe(true);
  });

  it('rejects a token when the user no longer exists in the DB', async () => {
    const { user, token } = await createApprovedUser();
    // Delete the user directly to simulate orphaned token
    await user.deleteOne();

    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Admin Route Access Control — GET /api/v1/admin/users
// ─────────────────────────────────────────────────────────────────────────────
describe('Admin Route Access Control (GET /api/v1/admin/users)', () => {
  it('returns 200 for an authenticated admin user', async () => {
    const { token } = await createAdminUser();

    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 403 for a regular APPROVED user (non-admin)', async () => {
    const { token } = await createApprovedUser();

    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('returns 403 for a PENDING_KYC user (GET passes auth status gate but fails admin check)', async () => {
    const { token } = await createPendingKycUser();

    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/v1/admin/users');

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Middleware Route Protection — status-gated write routes
// ─────────────────────────────────────────────────────────────────────────────
describe('Middleware Route Protection (status-gated writes)', () => {
  it('PENDING_KYC user is blocked from all non-KYC write endpoints', async () => {
    const { token } = await createPendingKycUser();

    // Try to hit a protected write route (POST /logout as representative)
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('no KYC submitted');
  });

  it('PENDING_KYC user CAN access POST /verify-identity (explicit exemption)', async () => {
    const { token } = await createPendingKycUser();

    const res = await submitKyc(token);

    expect(res.status).toBe(200);
  });

  it('PENDING_ADMIN_APPROVAL user is blocked from all write routes including verify-identity', async () => {
    const { token } = await createPendingApprovalUser();

    const res = await submitKyc(token);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('KYC submitted');
  });

  it('APPROVED user can access all non-admin write routes without status block', async () => {
    const { token } = await createApprovedUser();

    const res = await request(app)
      .put('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ phoneNumber: '+910000000000' });

    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Security edge cases
// ─────────────────────────────────────────────────────────────────────────────
describe('Security Edge Cases', () => {
  it('rejects SQL/NoSQL injection-style input in email field', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: '{ $gt: "" }', password: 'anything' });

    // Joi validates email format; injection strings fail email validation → 400
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('handles excessively long string values gracefully (no server crash)', async () => {
    const longString = 'a'.repeat(10000);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: longString,
        email: `${longString}@example.com`,
        password: longString,
        confirmPassword: longString,
        userType: 'buyer',
      });

    // Should fail validation cleanly, not crash
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(600);
  });

  it('returns 401 when Authorization header is present but completely empty', async () => {
    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', '');

    expect(res.status).toBe(401);
  });

  it('returns error when Bearer keyword is missing from Authorization header', async () => {
    const { token } = await createApprovedUser();

    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', token); // no "Bearer " prefix

    // The token itself is passed to jwt.verify as the full header string → malformed
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('does not expose password hash in login response', async () => {
    const { user } = await createApprovedUser();

    const res = await login(user.email, VALID_PASSWORD);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  it('does not expose password hash in register response', async () => {
    const res = await register();

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('password');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers used only inside this test file
// ─────────────────────────────────────────────────────────────────────────────
import { generateToken } from '../../src/utils/jwt.utility';

function generateTokenForUser(user: any) {
  return generateToken({
    id: user._id,
    role: user.role,
    userType: user.userType,
    tokenVersion: user.tokenVersion,
  });
}
