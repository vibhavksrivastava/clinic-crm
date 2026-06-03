import {NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const appointment_id = searchParams.get('appointment_id');

    if (!appointment_id) {
      return NextResponse.json({ error: 'Missing appointment_id' }, { status: 400 });
    }

    // DB fetch here
    return NextResponse.json({
      id: 'inv_1',
      amount: 500,
      amount_paid: 0,
      status: 'pending',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  return NextResponse.json({ success: true });
}