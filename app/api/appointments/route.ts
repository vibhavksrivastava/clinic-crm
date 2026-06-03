import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const includeDetails =
      searchParams.get('include_details') === 'true';

    let query = supabase
      .from('appointments')
      .select(
        `
        *,
        patients (
          id,
          first_name,
          last_name,
          email,
          phone,
          date_of_birth,
          address
        ),
        users (
          id,
          first_name,
          last_name,
          email
        ),
        appointment_payments (
          id,
          amount_due,
          amount_paid,
          payment_status,
          payment_method,
          payment_reference,
          notes
        ),
        prescriptions (
          id,
          medications,
          status,
          issued_date,
          appointment_id,
          vitals
        )
      `
      )
      .order('appointment_date', {
        ascending: false,
      });

    // Organization filter
    if (session.organizationId) {
      query = query.eq(
        'organization_id',
        session.organizationId
      );
    }

    // Branch filter
    if (session.branchId) {
      query = query.eq('branch_id', session.branchId);
    }

    // Doctor sees only own appointments
    if (session.roleType === 'doctor') {
      query = query.eq('user_id', session.userId);
    }

    if (id) {
      query = query.eq('id', id).single();
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        'Appointments GET Error:',
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    // Map users → staff (UI compatibility)
    const mappedData = Array.isArray(data)
      ? data.map((apt) => ({
          ...apt,
          staff: apt.users,
        }))
      : data
      ? {
          ...data,
          staff: data.users,
        }
      : data;

    return NextResponse.json(mappedData);
  } catch (error) {
    console.error(
      'Appointments GET Exception:',
      error
    );

    return NextResponse.json(
      {
        error: 'Failed to fetch appointments',
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      patient_id,
      staff_id,
      appointment_date,
      duration_minutes,
      appointment_type,
      notes,
    } = body;

    if (
      !patient_id ||
      !staff_id ||
      !appointment_date
    ) {
      return NextResponse.json(
        {
          error:
            'patient_id, staff_id and appointment_date required',
        },
        {
          status: 400,
        }
      );
    }

    const insertPayload = {
      patient_id,
      user_id: staff_id,
      appointment_date,
      duration_minutes:
        duration_minutes || 30,
      appointment_type:
        appointment_type ||
        'consultation',
      notes: notes || '',
      status: 'scheduled',
      organization_id:
        session.organizationId,
      branch_id: session.branchId,
    };

    const { data, error } =
      await supabase
        .from('appointments')
        .insert(insertPayload)
        .select()
        .single();

    if (error) {
      console.error(
        'Appointment POST Error:',
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      data,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      'Appointment POST Exception:',
      error
    );

    return NextResponse.json(
      {
        error: 'Failed to create appointment',
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          error: 'Appointment id required',
        },
        {
          status: 400,
        }
      );
    }

    const body = await req.json();

    const updatePayload: Record<
      string,
      unknown
    > = {
      updated_at:
        new Date().toISOString(),
    };

    if (body.status)
      updatePayload.status = body.status;

    if (body.notes !== undefined)
      updatePayload.notes = body.notes;

    if (
      body.appointment_date
    ) {
      updatePayload.appointment_date =
        body.appointment_date;
    }

    if (
      body.duration_minutes
    ) {
      updatePayload.duration_minutes =
        body.duration_minutes;
    }

    if (
      body.appointment_type
    ) {
      updatePayload.appointment_type =
        body.appointment_type;
    }

    // Completion
    if (
      body.status === 'completed'
    ) {
      updatePayload.completed_at =
        new Date().toISOString();
    }

    // Cancel
    if (
      body.status === 'cancelled'
    ) {
      updatePayload.cancelled_at =
        new Date().toISOString();
    }

    const { data, error } =
      await supabase
        .from('appointments')
        .update(updatePayload)
        .eq('id', id)
        .eq(
          'organization_id',
          session.organizationId
        )
        .select()
        .single();

    if (error) {
      console.error(
        'Appointment PUT Error:',
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      'Appointment PUT Exception:',
      error
    );

    return NextResponse.json(
      {
        error: 'Failed to update appointment',
      },
      {
        status: 500,
      }
    );
  }
}