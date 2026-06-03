import {
  NextRequest,
  NextResponse,
} from 'next/server';
import { supabase } from '@/lib/db/client';
import {
  getSessionFromRequest,
} from '@/lib/auth';


export async function POST(
  req: NextRequest
) {
  try {
    const body = await req.json();

    const {
      appointment_id,
      patient_id,
      consultation_fee,
    } = body;

    if (
      !appointment_id ||
      !patient_id ||
      !consultation_fee
    ) {
      return NextResponse.json(
        {
          error:
            'appointment_id, patient_id and consultation_fee required',
        },
        { status: 400 }
      );
    }

    // ----------------------------------
    // Fetch appointment
    // ----------------------------------

    const {
      data: appointment,
      error: appointmentError,
    } = await supabase
      .from('appointments')
      .select(
        `
        id,
        organization_id,
        branch_id
      `
      )
      .eq('id', appointment_id)
      .single();

    if (
      appointmentError ||
      !appointment
    ) {
      return NextResponse.json(
        {
          error:
            'Appointment not found',
        },
        { status: 404 }
      );
    }

    // ----------------------------------
    // Avoid duplicate invoice
    // ----------------------------------

    const {
      data: existingInvoice,
    } = await supabase
      .from('invoices')
      .select('id')
      .eq(
        'appointment_id',
        appointment_id
      )
      .maybeSingle();

    if (existingInvoice) {
      return NextResponse.json(
        {
          success: true,
          message:
            'Invoice already exists',
          invoice:
            existingInvoice,
        }
      );
    }

    // ----------------------------------
    // Create invoice
    // ----------------------------------

    const {
      data,
      error,
    } = await supabase
      .from('invoices')
      .insert({
        patient_id,
        appointment_id,

        organization_id:
          appointment.organization_id,

        branch_id:
          appointment.branch_id,

        amount:
          consultation_fee,

        amount_paid: 0,

        status:
          'pending',

        notes:
          'Consultation Invoice',
      })
      .select()
      .single();

    if (error) {
      console.error(
        'Invoice error:',
        error
      );

      return NextResponse.json(
        {
          error:
            error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice: data,
    });
  } catch (err) {
    console.error(
      'Billing route error:',
      err
    );

    return NextResponse.json(
      {
        error:
          'Internal server error',
      },
      { status: 500 }
    );
  }
}