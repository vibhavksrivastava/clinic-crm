// Authentication utilities for Clinic CRM
import * as crypto from 'crypto';
import { jwtVerify, SignJWT } from 'jose';
import { User, UserWithRole, Role, Organization, Branch, LoginResponse } from '@/lib/types';

// Get JWT secret from environment
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
);

// =====================================================
// PASSWORD HASHING & VERIFICATION
// =====================================================

/**
 * Hash a password using PBKDF2
 * IMPORTANT: Use bcrypt or argon2 in production!
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [salt, originalHash] = hash.split(':');
    const computedHash = crypto
      .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
      .toString('hex');
    return computedHash === originalHash;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

// =====================================================
// JWT TOKEN MANAGEMENT
// =====================================================

export interface JWTPayload {
  userId: string;
  email: string;
  organizationId: string;
  branchId?: string;
  roleType: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

/**
 * Create a JWT token for a user
 */
export async function createToken(
  user: UserWithRole,
  organization: Organization,
  branch?: Branch
): Promise<string> {
  const role = typeof user.role === 'object' ? user.role : null;
  
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    organizationId: organization.id,
    branchId: branch?.id,
    roleType: role?.roleType || '',
    permissions: role?.permissions || [],
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
}

// =====================================================
// SESSION MANAGEMENT
// =====================================================

/**
 * Create a session cookie payload
 */
export function createSessionCookie(token: string): { name: string; value: string; options: any } {
  return {
    name: 'clinic_auth',
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    },
  };
}

/**
 * Parse session from request headers
 */
export async function getSessionFromRequest(request: Request): Promise<JWTPayload | null> {
  try {
    // Try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);

    if (token) {
      return await verifyToken(token);
    }

    // Fallback: Try to get from cookies (for browser requests)
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = parseCookies(cookieHeader);
      const sessionToken = cookies['clinic_auth'];
      if (sessionToken) {
        return await verifyToken(sessionToken);
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Parse cookies from cookie header string
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

// =====================================================
// PERMISSION CHECKING
// =====================================================

/**
 * Check if a user session has a specific permission
 */
export function hasPermission(session: JWTPayload, permission: string): boolean {
  return session.permissions.includes(permission);
}

/**
 * Check if a user session has a specific role
 */
export function hasRole(session: JWTPayload, roleType: string): boolean {
  return session.roleType === roleType;
}

/**
 * Validate multi-tenant access
 * Ensures user has access to the requested organization and branch
 */
export function validateTenantAccess(
  session: JWTPayload,
  requestedOrgId: string,
  requestedBranchId?: string
): boolean {
  // Super admin can access any organization
  if (session.roleType === 'super_admin') {
    return true;
  }

  // User's organization must match requested organization
  if (session.organizationId !== requestedOrgId) {
    return false;
  }

  // If branch is specified, user must have access to that branch
  if (requestedBranchId && session.branchId !== requestedBranchId) {
    // Clinic admins can access any branch in their organization
    if (session.roleType !== 'clinic_admin') {
      return false;
    }
  }

  return true;
}

// =====================================================
// LOGIN HELPER
// =====================================================

/**
 * Helper function to create a login response
 */
export async function createLoginResponse(
  user: UserWithRole,
  organization: Organization,
  branch?: Branch
): Promise<LoginResponse> {
  const token = await createToken(user, organization, branch);
  return {
    user,
    token,
    organization,
    branch,
  };
}

// =====================================================
// RATE LIMITING HELPERS
// =====================================================

const loginAttempts: Map<string, { count: number; timestamp: number }> = new Map();

/**
 * Check if a user should be locked out due to failed login attempts
 */
export function checkLoginAttempts(email: string): { allowed: boolean; message?: string } {
  const attempts = loginAttempts.get(email);
  const now = Date.now();

  if (attempts && now - attempts.timestamp < 15 * 60 * 1000) { // 15 minute window
    if (attempts.count >= 5) {
      return {
        allowed: false,
        message: 'Too many failed login attempts. Please try again in 15 minutes.',
      };
    }
  } else {
    // Reset attempts if time window has passed
    loginAttempts.delete(email);
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt
 */
export function recordLoginAttempt(email: string): void {
  const attempts = loginAttempts.get(email);
  const now = Date.now();

  if (attempts && now - attempts.timestamp < 15 * 60 * 1000) {
    attempts.count++;
  } else {
    loginAttempts.set(email, { count: 1, timestamp: now });
  }
}

/**
 * Clear login attempts on successful login
 */
export function clearLoginAttempts(email: string): void {
  loginAttempts.delete(email);
}

// =====================================================
// VALIDATION HELPERS
// =====================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
export function isValidPassword(password: string): boolean {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Validate password strength with detailed feedback
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters');

  if (password.length >= 12) score++;
  else feedback.push('At least 12 characters for stronger security');

  if (/[a-z]/.test(password)) score++;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add uppercase letters');

  if (/\d/.test(password)) score++;
  else feedback.push('Add numbers');

  if (/[@$!%*?&]/.test(password)) score++;
  else feedback.push('Add special characters (@$!%*?&)');

  return {
    valid: score >= 4,
    score,
    feedback,
  };
}
