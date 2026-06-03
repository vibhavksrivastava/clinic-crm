import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest
) {
  try {
    const session =
      await getSessionFromRequest(
        request
      );

    if (!session) {
      return NextResponse.json(
        {
          error:
            'Unauthorized',
        },
        { status: 401 }
      );
    }

    console.log(
      'RX SESSION:',
      session
    );

    const body =
      await request.json();

    const {
      appointment_id,
      patient_id,
      medications,
      vitals,
      additional_tests,
      notes,
    } = body;

    if (
      !appointment_id ||
      !patient_id
    ) {
      return NextResponse.json(
        {
          error:
            'Appointment and Patient required',
        },
        { status: 400 }
      );
    }

    // Create prescription

    const {
      data: prescription,
      error:
        prescriptionError,
    } = await supabase
      .from(
        'prescriptions'
      )
      .insert({
        appointment_id,
        patient_id,
        user_id:
          session.userId,

        medications:
  medications?.map(
    (
      med: any,
      index: number
    ) => ({
      id:
        Date.now().toString() +
        index,

      medication_name:
        med.medicine_name || '',

      dosage:
        med.duration || '',

      frequency:
        med.frequency || '',

      quantity: 0,

      notes:
        med.notes || '',
    })
  ) || [],

additional_tests:
  additional_tests?.map(
    (
      test: any,
      index: number
    ) => ({
      id:
        Date.now().toString() +
        index,

      name:
        typeof test ===
        'string'
          ? test
          : test.name,
    })
  ) || [],

        vitals:
          vitals || {},

        notes:
          notes || '',

        issued_date:
          new Date(),

        status:
          'active',

        organization_id:
          session.organizationId,

        branch_id:
          session.branchId,
      })
      .select()
      .single();

    if (
      prescriptionError
    ) {
      console.error(
        'Prescription error:',
        prescriptionError
      );

      return NextResponse.json(
        {
          error:
            prescriptionError.message,
        },
        { status: 500 }
      );
    }

    // Mark appointment completed

    const {
      error:
        appointmentError,
    } = await supabase
      .from(
        'appointments'
      )
      .update({
        status:
          'completed',
        completed_at:
          new Date(),
      })
      .eq(
        'id',
        appointment_id
      );

    if (
      appointmentError
    ) {
      console.error(
        'Appointment update error:',
        appointmentError
      );
    }

    return NextResponse.json(
      {
        success: true,
        id:
          prescription.id,
        prescription,
      },
      { status: 201 }
    );
  } catch (
    error: any
  ) {
    console.error(
      'RX CREATE ERROR:',
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          'Server error',
      },
      { status: 500 }
    );
  }
}