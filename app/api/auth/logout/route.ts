import { NextResponse } from 'next/server';

import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
} from '@/lib/auth/constants';

export async function POST() {
  try {
    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );

    // Clear auth cookie
    response.cookies.set(
      AUTH_COOKIE_NAME,
      '',
      {
        ...AUTH_COOKIE_OPTIONS,
        maxAge: 0,
      }
    );

    return response;
  } catch (error) {
    console.error(
      'Logout Error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Logout failed',
      },
      { status: 500 }
    );
  }
}