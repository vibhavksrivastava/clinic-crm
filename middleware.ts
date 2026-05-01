import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/api/:path*', '/protected/:path*', '/((?!login|signup|forgot-password|_next|favicon).*)'],
};

// Routes that don't require authentication
const publicRoutes = ['/', '/api/auth', '/login', '/signup', '/forgot-password'];

/**
 * Main middleware function exported for Next.js
 * Simplified to work with Edge Runtime (no Node.js modules)
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip authentication for public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  try {
    // Extract token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    if (!token) {
      // Try to get from cookies
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = parseCookies(cookieHeader);
        token = cookies['clinic_auth'];
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    // Note: Full token verification happens on API routes
    // Middleware just checks token presence
    // Actual JWT verification happens server-side in API routes

    // Create new request headers to pass token info
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-token', token);

    // Continue to next middleware/route with token in headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

/**
 * Helper to parse cookies from cookie header
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
