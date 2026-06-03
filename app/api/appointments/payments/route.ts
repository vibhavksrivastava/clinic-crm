import {
  NextRequest,
  NextResponse,
} from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(
  req: NextRequest
) {
  try {
    const session =
      await getSessionFromRequest(
        req
      );

    if (!session) {
      return NextResponse.json(
        {
          error:
            'Unauthorized',
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await req.json();

    const {
      appointment_id,
      amount_paid,
      payment_method,
      payment_reference,
      notes,
    } = body;

    if (
      !appointment_id ||
      amount_paid == null
    ) {
      return NextResponse.json(
        {
          error:
            'appointment_id and amount_paid required',
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------------
    // Fetch invoice for appointment
    // -----------------------------------

    const {
      data: invoice,
      error: invoiceError,
    } = await supabase
      .from('invoices')
      .select('*')
      .eq(
        'appointment_id',
        appointment_id
      )
      .maybeSingle();

    if (
      invoiceError ||
      !invoice
    ) {
      console.error(
        'Invoice lookup error:',
        invoiceError
      );

      return NextResponse.json(
        {
          error:
            'Invoice not found',
        },
        {
          status: 404,
        }
      );
    }

    const totalAmount =
      Number(
        invoice.amount || 0
      );

    const previousPaid =
      Number(
        invoice.amount_paid || 0
      );

    const newPayment =
      Number(
        amount_paid || 0
      );

    const totalPaid =
      previousPaid +
      newPayment;

    const pendingAmount =
      totalAmount -
      totalPaid;

    let paymentStatus =
      'pending';

    if (
      pendingAmount <= 0
    ) {
      paymentStatus =
        'paid';
    } else if (
      totalPaid > 0
    ) {
      paymentStatus =
        'partial';
    }

    // -----------------------------------
    // Update invoice
    // -----------------------------------

    const {
      data: updatedInvoice,
      error:
        updateInvoiceError,
    } = await supabase
      .from('invoices')
      .update({
        amount_paid:
          totalPaid,
        status:
          paymentStatus,
        payment_mode:
          payment_method ||
          'cash',
        paid_date:
          totalPaid > 0
            ? new Date()
                .toISOString()
                .split('T')[0]
            : null,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        invoice.id
      )
      .select()
      .single();

    if (
      updateInvoiceError
    ) {
      console.error(
        updateInvoiceError
      );

      return NextResponse.json(
        {
          error:
            updateInvoiceError.message,
        },
        {
          status: 500,
        }
      );
    }

    // -----------------------------------
    // Appointment payment history
    // -----------------------------------

    const {
      data: payment,
      error: paymentError,
    } = await supabase
      .from(
        'appointment_payments'
      )
      .insert({
        appointment_id,
        amount_due:
          totalAmount,
        amount_paid:
          newPayment,
        payment_status:
          paymentStatus,
        payment_method:
          payment_method ||
          'cash',
        payment_reference:
          payment_reference ||
          '',
        notes:
          notes || '',
      })
      .select()
      .single();

    if (
      paymentError
    ) {
      console.error(
        paymentError
      );

      return NextResponse.json(
        {
          error:
            paymentError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      payment,
      invoice:
        updatedInvoice,
      pending_amount:
        pendingAmount,
    });
  } catch (
    error
  ) {
    console.error(
      'Payment API Exception:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to record payment',
      },
      {
        status: 500,
      }
    );
  }
}