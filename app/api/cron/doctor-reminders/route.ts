import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/messaging';

// Cron job endpoint for daily doctor reminders
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (optional security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the send reminders logic
    // Use relative URL for internal API calls in development/production
    const response = await fetch('/api/appointments/send-reminders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`
      },
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result
    });

  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}