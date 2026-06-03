import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';


const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key';

export type UserContext = {
  userId: string;
  email: string;
  roleType: string;
  organizationId?: string;
  branchId?: string;
  permissions?: string[];
};

export async function getUserContext(
  request: NextRequest
): Promise<UserContext | null> {
  try {
    let token =
      request.cookies.get('authToken')?.value;

    // fallback to Authorization header
    if (!token) {
      const authHeader =
        request.headers.get('authorization');

      if (
        authHeader &&
        authHeader.startsWith('Bearer ')
      ) {
        token = authHeader.replace(
          'Bearer ',
          ''
        );
      }
    }

    if (!token) {
      console.log('❌ No token');
      return null;
    }

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    ) as unknown as UserContext;

    return {
      userId: decoded.userId,
      email: decoded.email,
      roleType: decoded.roleType,
      organizationId:
        decoded.organizationId,
      branchId: decoded.branchId,
      permissions:
        decoded.permissions || [],
    };
  } catch (error) {
    console.log(
      'JWT verify error',
      error
    );
    return null;
  }
}



export function unauthorizedResponse(
  message = 'Unauthorized'
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 401 }
  );
}

export function forbiddenResponse(
  message = 'Forbidden'
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 403 }
  );
}
export function isSuperAdmin(
  user: UserContext
) {
  return (
    user.roleType === 'super_admin'
  );
}