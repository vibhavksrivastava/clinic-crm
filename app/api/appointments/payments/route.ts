import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, JWTPayload } from '@/lib/auth';

/**
 * Appointment Payments API
 * Handles recording and managing appointment payments
 */

export async function GET(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const appointment_id = searchParams.get('appointment_id');
    const payment_status = searchParams.get('payment_status'); // pending, partial, paid, overdue

    let query = supabase
      .from('appointment_payments')
      .select(`*, appointment:appointments(id, patient_id, staff_id, appointment_date, appointment_type), paid_by:staff(first_name, last_name)`);

    if (appointment_id) {
      query = query.eq('appointment_id', appointment_id);
    }

    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }

    query = query.order('updated_at', { ascending: false });

    let { data, error } = await query;

    if (error) throw error;

    // If single appointment_id was requested and found, return the first record
    if (appointment_id && data && data.length > 0) {
      return NextResponse.json(data[0]);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only receptionist and admin can record payments
    if (!['receptionist', 'clinic_admin', 'branch_admin', 'super_admin'].includes(userContext.roleType)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      appointment_id,
      amount_paid,
      payment_method,
      payment_reference,
      notes,
    } = await request.json();

    if (!appointment_id || !amount_paid) {
      return NextResponse.json(
        { error: 'Appointment ID and amount paid are required' },
        { status: 400 }
      );
    }

    // Get current payment record
    const { data: currentPayment, error: fetchError } = await supabase
      .from('appointment_payments')
      .select('*')
      .eq('appointment_id', appointment_id)
      .single();

    if (fetchError) throw fetchError;

    if (!currentPayment) {
      return NextResponse.json(
        { error: 'Payment record not found for this appointment' },
        { status: 404 }
      );
    }

    // Calculate new payment status
    const newAmountPaid = (currentPayment.amount_paid || 0) + amount_paid;
    let newStatus = 'partial';

    if (newAmountPaid >= currentPayment.amount_due) {
      newStatus = 'paid';
    } else if (newAmountPaid === 0) {
      newStatus = 'pending';
    }

    // Update payment record
    const { data, error } = await supabase
      .from('appointment_payments')
      .update({
        amount_paid: newAmountPaid,
        payment_method: payment_method || currentPayment.payment_method,
        payment_status: newStatus,
        paid_date: newStatus === 'paid' ? new Date() : currentPayment.paid_date,
        paid_by_id: userContext.userId,
        payment_reference: payment_reference || currentPayment.payment_reference,
        notes: notes || currentPayment.notes,
        updated_at: new Date(),
      })
      .eq('appointment_id', appointment_id)
      .select('*, appointment:appointments(id, patient_id, staff_id)')
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can update payments
    if (!['clinic_admin', 'branch_admin', 'super_admin'].includes(userContext.roleType || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const updates = await request.json();
    updates.updated_at = new Date();

    const { data, error } = await supabase
      .from('appointment_payments')
      .update(updates)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
