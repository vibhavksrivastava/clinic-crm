import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';

export async function GET() {
  try {
    // Test database connection
    const { data, error } = await supabase.from('patients').select('count', { count: 'exact', head: true });
    
    if (error) throw error;

    const stats = {
      message: 'Clinic CRM API',
      version: '1.0.0',
      status: 'operational',
      database: {
        status: 'connected',
        type: 'PostgreSQL (Supabase)',
      },
      endpoints: {
        patients: '/api/patients',
        appointments: '/api/appointments',
        prescriptions: '/api/prescriptions',
        staff: '/api/staff',
        invoices: '/api/invoices',
      },
    };
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ error: 'API health check failed', status: 'error' }, { status: 500 });
  }
}
