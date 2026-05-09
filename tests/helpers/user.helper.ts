import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../src/app';
import User from '../../src/models/User.model';
import { USER_ROLE, USER_STATUS, USER_TYPE } from '../../src/utils/constants.utility';
import { generateToken } from '../../src/utils/jwt.utility';

// ─── Constants ────────────────────────────────────────────────────────────────

export const VALID_PASSWORD = 'Password1';

export const BASE_REGISTER_BUYER = {
  name: 'Test Buyer',
  email: 'buyer@test.com',
  password: VALID_PASSWORD,
  confirmPassword: VALID_PASSWORD,
  userType: 'buyer',
} as const;

export const BASE_REGISTER_SELLER = {
  name: 'Test Seller',
  email: 'seller@test.com',
  password: VALID_PASSWORD,
  confirmPassword: VALID_PASSWORD,
  userType: 'seller',
} as const;

// Minimal 1×1 transparent PNG — passes the image/png MIME filter
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

// KYC form fields matching the Postman collection bracket notation
// multer's append-field library parses bracket keys into nested objects
export const KYC_FIELDS: Record<string, string> = {
  fullName: 'John Diamond',
  dateOfBirth: '1990-01-15',
  phoneNumber: '+1234567890',
  'identityProof[proofType]': 'Aadhar',
  'identityProof[proofNumber]': '123456789012',
  'companyDetails[companyName]': 'Diamond Corp Pvt Ltd',
  'companyDetails[companyAddress][line1]': '123 Diamond Street',
  'companyDetails[companyAddress][city]': 'Mumbai',
  'companyDetails[companyAddress][state]': 'Maharashtra',
  'companyDetails[companyAddress][postalCode]': '400001',
  'companyDetails[companyCountry]': 'India',
  businessType: 'Diamond Trading',
  diamondIndustryActivity: 'Wholesale diamond trading and certification for 10+ years',
  isAuthorizedPerson: 'true',
};

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

export const register = (overrides: Record<string, string> = {}) =>
  request(app)
    .post('/api/v1/auth/register')
    .send({ ...BASE_REGISTER_BUYER, ...overrides });

export const login = (email: string, password: string) =>
  request(app).post('/api/v1/auth/login').send({ email, password });

/** Build a multipart verify-identity request, attaching the tiny PNG */
export const submitKyc = (token: string, fieldOverrides: Record<string, string> = {}) => {
  let req = request(app)
    .post('/api/v1/auth/verify-identity')
    .set('Authorization', `Bearer ${token}`);

  const fields = { ...KYC_FIELDS, ...fieldOverrides };
  for (const [key, value] of Object.entries(fields)) {
    req = req.field(key, value);
  }
  return req.attach('document', TINY_PNG, { filename: 'id.png', contentType: 'image/png' });
};

// ─── DB helpers (create users directly, bypassing the HTTP layer) ─────────────

/** Create a user with PENDING_KYC status and return their JWT */
export async function createPendingKycUser(overrides: Record<string, any> = {}) {
  const hashed = await bcrypt.hash(VALID_PASSWORD, 10);
  const user = await User.create({
    name: 'Pending User',
    email: 'pending@test.com',
    password: hashed,
    userType: USER_TYPE.BUYER,
    role: USER_ROLE.USER,
    status: USER_STATUS.PENDING_KYC,
    tokenVersion: 0,
    ...overrides,
  });
  const token = generateToken({
    id: user._id,
    role: user.role,
    userType: user.userType,
    tokenVersion: user.tokenVersion,
  });
  return { user, token };
}

/** Create a user with PENDING_ADMIN_APPROVAL status and return their JWT */
export async function createPendingApprovalUser(overrides: Record<string, any> = {}) {
  const hashed = await bcrypt.hash(VALID_PASSWORD, 10);
  const user = await User.create({
    name: 'Pending Approval',
    email: 'approval@test.com',
    password: hashed,
    userType: USER_TYPE.BUYER,
    role: USER_ROLE.USER,
    status: USER_STATUS.PENDING_ADMIN_APPROVAL,
    tokenVersion: 0,
    ...overrides,
  });
  const token = generateToken({
    id: user._id,
    role: user.role,
    userType: user.userType,
    tokenVersion: user.tokenVersion,
  });
  return { user, token };
}

/** Create an APPROVED regular user and return their JWT */
export async function createApprovedUser(overrides: Record<string, any> = {}) {
  const hashed = await bcrypt.hash(VALID_PASSWORD, 10);
  const user = await User.create({
    name: 'Approved User',
    email: 'approved@test.com',
    password: hashed,
    userType: USER_TYPE.BUYER,
    role: USER_ROLE.USER,
    status: USER_STATUS.APPROVED,
    tokenVersion: 0,
    ...overrides,
  });
  const token = generateToken({
    id: user._id,
    role: user.role,
    userType: user.userType,
    tokenVersion: user.tokenVersion,
  });
  return { user, token };
}

/** Create an admin user and return their JWT */
export async function createAdminUser(overrides: Record<string, any> = {}) {
  const hashed = await bcrypt.hash('AdminPass1', 10);
  const user = await User.create({
    name: 'Admin',
    email: 'admin@test.com',
    password: hashed,
    role: USER_ROLE.ADMIN,
    status: USER_STATUS.APPROVED,
    tokenVersion: 0,
    ...overrides,
  });
  const token = generateToken({
    id: user._id,
    role: user.role,
    userType: user.userType,
    tokenVersion: user.tokenVersion,
  });
  return { user, token };
}
