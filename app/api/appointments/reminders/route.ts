import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const today = new Date();
    const tomorrow = new Date();

    tomorrow.setDate(today.getDate() + 1);

    const start = today.toISOString();
    const end = tomorrow.toISOString();

    let query = supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        status,
        appointment_type,
        notes,
        patient_id,
        user_id,
        organization_id,
        branch_id,
        patients (
          id,
          first_name,
          last_name,
          phone,
          email
        ),
        users (
          id,
          first_name,
          last_name
        )
      `)
      .gte('appointment_date', start)
      .lte('appointment_date', end)
      .in('status', ['scheduled', 'ongoing'])
      .order('appointment_date', { ascending: true });

    // Organization filter
    if (session.organizationId) {
      query = query.eq(
        'organization_id',
        session.organizationId
      );
    }

    // Branch filter
    if (session.branchId) {
      query = query.eq(
        'branch_id',
        session.branchId
      );
    }

    // Doctor sees only own appointments
    if (session.roleType === 'doctor') {
      query = query.eq('user_id', session.userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Reminder fetch error:', error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reminders: data || [],
    });
  } catch (error) {
    console.error('Reminders API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}