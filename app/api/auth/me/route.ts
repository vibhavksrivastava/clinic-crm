import { NextRequest, NextResponse } from 'next/server';
import {
  getUserContext,
} from '@/lib/db/access-control';

export async function GET(
  request: NextRequest
) {
  const user =
    await getUserContext(request);

  if (!user) {
    return NextResponse.json({
      authenticated: false,
    });
  }

  return NextResponse.json({
    authenticated: true,
    user,
  });
}