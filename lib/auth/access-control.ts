import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const secretValue =
  process.env.JWT_SECRET ||
  'your-super-secret-key-change-in-production';

const JWT_SECRET = new TextEncoder().encode(secretValue);

export type UserContext = {
  userId: string;
  email: string;
  organizationId: string;
  branchId?: string;
  roleType: string;
  permissions: string[];
};

/**
 * Extract user from JWT
 */
export async function getUserContext(
  request: NextRequest
): Promise<UserContext | null> {
  try {
    let token: string | null = null;

    // 1 Header token
    const authHeader =
      request.headers.get('authorization');

    if (
      authHeader?.startsWith('Bearer ')
    ) {
      token = authHeader.substring(7);
    }

    // 2 Cookie token
    if (!token) {
      token =
        request.cookies.get('authToken')
          ?.value || null;
    }

    console.log(
      'JWT_SECRET EXISTS:',
      !!process.env.JWT_SECRET
    );

    console.log(
      'JWT_SECRET:',
      secretValue
    );

    console.log(
      'TOKEN EXISTS:',
      !!token
    );

    if (!token) {
      console.log('NO TOKEN FOUND');
      return null;
    }

    const { payload } =
      await jwtVerify(
        token,
        JWT_SECRET
      );

    console.log(
      'JWT VERIFIED'
    );
    console.log(
      'PAYLOAD:',
      payload
    );

    return {
      userId: String(
        payload.userId ||
          payload.id ||
          ''
      ),
      email: String(
        payload.email || ''
      ),
      organizationId: String(
        payload.organizationId ||
          ''
      ),
      branchId: payload.branchId
        ? String(
            payload.branchId
          )
        : undefined,
      roleType: String(
        payload.roleType ||
          payload.role ||
          ''
      ),
      permissions:
        (payload.permissions as string[]) ||
        [],
    };
  } catch (error: any) {
    console.error(
      'JWT VERIFY FAILED'
    );
    console.error(
      'JWT ERROR:',
      error?.code
    );
    console.error(
      'JWT MESSAGE:',
      error?.message
    );
    console.error(
      'FULL ERROR:',
      error
    );

    return null;
  }
}

/**
 * 401 helper
 */
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