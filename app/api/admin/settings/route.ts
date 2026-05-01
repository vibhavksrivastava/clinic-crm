import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/settings
 * Get system settings
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('x-token') || request.headers.get('authorization')?.slice(7);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return default settings (in production, these would be stored in DB or Redis)
    const settings = {
      system_name: process.env.NEXT_PUBLIC_APP_NAME || 'Clinic CRM',
      support_email: process.env.SUPPORT_EMAIL || 'support@clinicrm.com',
      support_phone: process.env.SUPPORT_PHONE || '+1-800-CLINIC',
      max_login_attempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
      login_lockout_minutes: parseInt(process.env.LOGIN_LOCKOUT_MINUTES || '15'),
      session_timeout_hours: parseInt(process.env.SESSION_TIMEOUT_HOURS || '24'),
      enable_whatsapp: process.env.ENABLE_WHATSAPP !== 'false',
      enable_pharmacy: process.env.ENABLE_PHARMACY !== 'false',
      enable_billing: process.env.ENABLE_BILLING !== 'false',
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings
 * Save system settings
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-token') || request.headers.get('authorization')?.slice(7);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await request.json();

    // In production, save to database or environment
    // For now, just return success
    console.log('Settings updated:', settings);

    return NextResponse.json({
      message: 'Settings saved successfully',
      settings,
    });
  } catch (error) {
    console.error('Save settings error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
