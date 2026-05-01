import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
);

export interface UserContext {
  userId: string;
  email: string;
  organizationId: string;
  branchId?: string;
  roleType: string;
  permissions: string[];
}

/**
 * Extract and verify JWT token from request, return user context
 * Returns null if token is invalid or missing
 */
export async function getUserContext(request: NextRequest): Promise<UserContext | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7);
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as any;

    return {
      userId: payload.userId,
      email: payload.email,
      organizationId: payload.organizationId,
      branchId: payload.branchId,
      roleType: payload.roleType,
      permissions: payload.permissions || [],
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(userContext: UserContext | null): boolean {
  return userContext?.roleType === 'super_admin';
}

/**
 * Check if user is clinic admin (can access their own clinic only)
 */
export function isClinicAdmin(userContext: UserContext | null): boolean {
  return userContext?.roleType === 'clinic_admin';
}

/**
 * Check if user is branch admin (can access their own branch only)
 */
export function isBranchAdmin(userContext: UserContext | null): boolean {
  return userContext?.roleType === 'branch_admin';
}

/**
 * Build where clause for Supabase query based on user's role
 * Super admin: return empty object (no filter)
 * Others: filter by their organization (and branch if available)
 */
export function getWhereClause(userContext: UserContext | null): any {
  if (!userContext) {
    return null;
  }

  if (isSuperAdmin(userContext)) {
    return {}; // Super admin sees all
  }

  if (isBranchAdmin(userContext)) {
    return {
      organization_id: userContext.organizationId,
      branch_id: userContext.branchId,
    };
  }

  // For clinic admin and other roles
  return {
    organization_id: userContext.organizationId,
  };
}

/**
 * Unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Forbidden response
 */
export function forbiddenResponse(message: string = 'Access denied') {
  return NextResponse.json({ error: message }, { status: 403 });
}
