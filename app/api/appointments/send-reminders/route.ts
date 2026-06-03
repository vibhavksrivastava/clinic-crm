import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only receptionist/admin allowed
    const roleType = typeof session.roleType === 'string' ? session.roleType : '';

    if (!['receptionist', 'clinic_admin', 'branch_admin'].includes(roleType)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const now = new Date();
    const tomorrow = new Date();

    tomorrow.setDate(now.getDate() + 1);

    // Start/end of tomorrow
    const startDate = new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate(),
      0,
      0,
      0
    );

    const endDate = new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate(),
      23,
      59,
      59
    );

    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name,
          phone
        ),
        users (
          id,
          first_name,
          last_name
        )
      `)
      .eq('status', 'scheduled')
      .gte('appointment_date', startDate.toISOString())
      .lte('appointment_date', endDate.toISOString());

    // Org filter
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

    const { data, error } = await query;

    if (error) {
      console.error(
        'Reminder fetch error:',
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    interface ReminderAppointment {
  id: string;
  appointment_date: string;
  patients?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  } | null;
}

const reminders =
  (data as ReminderAppointment[] | null)?.map(
    (appointment: ReminderAppointment) => ({
      appointment_id: appointment.id,
      patient_name: `${appointment.patients?.first_name || ''} ${
        appointment.patients?.last_name || ''
      }`.trim(),
      phone: appointment.patients?.phone || '',
      appointment_date: appointment.appointment_date,
      reminder_type: 'appointment_reminder',
      message: `Reminder: Appointment scheduled on ${new Date(
        appointment.appointment_date
      ).toLocaleString()}`,
    })
  ) || [];

    // Future:
    // WhatsApp / SMS API integration here

    return NextResponse.json({
      success: true,
      total: reminders.length,
      reminders,
    });
  } catch (error) {
    console.error(
      'Send reminders error:',
      error
    );

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      {
        status: 500,
      }
    );
  }
}