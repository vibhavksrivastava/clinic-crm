import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { jwtVerify } from 'jose';

import {
  AUTH_COOKIE_NAME,
} from '@/lib/auth/constants';

import {
  JWT_SECRET,
} from '@/lib/auth/jwt';

export async function proxy(
  request: NextRequest
) {
  const token =
    request.cookies.get(
      AUTH_COOKIE_NAME
    )?.value;

  const pathname =
    request.nextUrl.pathname;

  console.log(
    'PATH:',
    pathname
  );

  console.log(
    'TOKEN EXISTS:',
    !!token
  );

  /**
   * PUBLIC ROUTES
   */
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  /**
   * NO TOKEN
   */
  if (!token) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    );
  }

  try {
    const { payload } =
      await jwtVerify(
        token,
        JWT_SECRET
      );

    console.log(
      'JWT PAYLOAD:',
      payload
    );

    /**
     * IMPORTANT FIX
     */
    const role =
      String(
        payload.roleType ||
          payload.role ||
          ''
      );

    console.log(
      'ROLE:',
      role
    );

    /**
     * ADMIN
     */
    if (
      pathname.startsWith('/admin') &&
      ![
        'super_admin',
        'admin',
      ].includes(role)
    ) {
      return NextResponse.redirect(
        new URL(
          '/unauthorized',
          request.url
        )
      );
    }

    /**
     * PATIENT
     */
    if (
      pathname.startsWith('/patient') &&
      role !== 'patient'
    ) {
      return NextResponse.redirect(
        new URL(
          '/unauthorized',
          request.url
        )
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.log(
      '❌ JWT VERIFY FAILED:',
      error
    );

    return NextResponse.redirect(
      new URL('/login', request.url)
    );
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/patient/:path*',
    '/doctor/:path*',
    '/pharmacy/:path*',
  ],
};