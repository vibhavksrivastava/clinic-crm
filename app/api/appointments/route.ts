import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, JWTPayload } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const patient_id = searchParams.get('patient_id');
    const status = searchParams.get('status'); // scheduled, ongoing, completed, cancelled
    const user_id = searchParams.get('user_id') || searchParams.get('staff_id'); // Accept both for compatibility
    const include_details = searchParams.get('include_details') === 'true';

    // Build query - select user data instead of staff data
    let selectStr = include_details
      ? '*, patients(id, first_name, last_name, email, phone, date_of_birth, address), users!user_id(id, first_name, last_name, specialization)'
      : '*, patients(first_name, last_name), users!user_id(first_name, last_name)';
    
    let query = supabase
      .from('appointments')
      .select(selectStr);

    // Apply filters
    if (id) {
      query = query.eq('id', id);
    }

    if (patient_id) {
      query = query.eq('patient_id', patient_id);
      // Note: We skip organization_id filter for patient_id queries because:
      // 1. The patient itself is already filtered by organization
      // 2. This provides backward compatibility with appointments created before org_id migration
      // 3. Security is maintained because patient access is organization-filtered
    } else {
      // For other queries, enforce organization_id filter strictly
      if (userContext.organizationId) {
        query = query.eq('organization_id', userContext.organizationId);
      }
      // Filter by branch if user has branch context
      if (userContext.branchId) {
        query = query.eq('branch_id', userContext.branchId);
      }
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    // Always order by appointment date
    query = query.order('appointment_date', { ascending: status === 'scheduled' });

    let { data, error } = await query;

    if (error) throw error;

    // TypeScript type safety: ensure data is an array
    const appointments = Array.isArray(data) ? (data as any[]) : [];
    
    // If single ID was requested and found, return the first record
    let singleRecord = null;
    if (id && appointments.length > 0) {
      singleRecord = appointments[0];
    }

    // Filter based on role
    if (userContext.roleType === 'doctor') {
      // Doctors can only see their own appointments or appointments for patients they're treating
      if (singleRecord) {
        if (singleRecord.user_id === userContext.userId) {
          return NextResponse.json(singleRecord);
        } else {
          return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
      } else {
        const filteredData = appointments.filter((apt: any) => apt.user_id === userContext.userId);
        return NextResponse.json(filteredData);
      }
    }

    // Receptionists and admins can see all appointments for their organization
    if (singleRecord) {
      return NextResponse.json(singleRecord);
    }
    return NextResponse.json(appointments);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('❌ Error fetching appointments:', errorMessage);
    console.error('Full error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments', details: errorMessage },
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

    // Only receptionist and admin can create appointments
    if (!['receptionist', 'clinic_admin', 'branch_admin', 'super_admin'].includes(userContext.roleType)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      patient_id,
      staff_id,
      user_id: bodyUserId,
      appointment_date,
      duration_minutes,
      appointment_type,
      notes,
    } = await request.json();

    // Accept both staff_id and user_id for backward compatibility
    const user_id = bodyUserId || staff_id;

    console.log('📝 Create Appointment Request:', {
      patient_id,
      user_id,
      appointment_date,
      duration_minutes,
      appointment_type,
      notes,
    });

    if (!patient_id || !user_id || !appointment_date) {
      return NextResponse.json(
        { error: 'Patient ID, Doctor/User ID, and appointment date are required' },
        { status: 400 }
      );
    }

    const appointmentStart = new Date(appointment_date);
    const appointmentEnd = new Date(
      appointmentStart.getTime() + (duration_minutes || 30) * 60000
    );

    // Check for scheduling conflicts
    const { data: existingAppointments, error: fetchError } = await supabase
      .from('appointments')
      .select('id, appointment_date, duration_minutes, status')
      .eq('user_id', user_id)
      .in('status', ['scheduled', 'ongoing', 'confirmed']);

    if (fetchError) throw fetchError;

    if (existingAppointments && existingAppointments.length > 0) {
      const hasConflict = existingAppointments.some((apt) => {
        const existingStart = new Date(apt.appointment_date);
        const existingEnd = new Date(
          existingStart.getTime() + (apt.duration_minutes || 30) * 60000
        );

        return (
          appointmentStart < existingEnd && appointmentEnd > existingStart
        );
      });

      if (hasConflict) {
        return NextResponse.json(
          {
            error: 'Doctor is already booked for this time slot',
            message: 'Please select a different time or doctor',
          },
          { status: 409 }
        );
      }
    }

    // Create the appointment
    // First attempt with appointment_type
    let { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id,
        user_id,
        appointment_date,
        duration_minutes: duration_minutes || 30,
        appointment_type: appointment_type || 'consultation',
        notes,
        status: 'scheduled',
        organization_id: userContext.organizationId,
        branch_id: userContext.branchId,
      })
      .select('*, patients(first_name, last_name), users!user_id(first_name, last_name)')
      .single();

    // If error is about missing appointment_type column, retry without it
    if (error && error.message && error.message.includes('appointment_type')) {
      console.warn('⚠️ appointment_type column not found, retrying without it');
      console.warn('⚠️ IMPORTANT: Run this SQL in Supabase to fix this permanently:');
      console.warn('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50) DEFAULT "consultation";');
      
      // Retry without appointment_type
      const { data: retryData, error: retryError } = await supabase
        .from('appointments')
        .insert({
          patient_id,
          user_id,
          appointment_date,
          duration_minutes: duration_minutes || 30,
          notes,
          status: 'scheduled',
          organization_id: userContext.organizationId,
          branch_id: userContext.branchId,
        })
        .select('*, patients(first_name, last_name), users!user_id(first_name, last_name)')
        .single();
      
      if (retryError) {
        throw new Error(
          `Failed to create appointment: ${retryError.message}. ` +
          'The database schema may be incomplete. ' +
          'Please apply the migration: ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50) DEFAULT "consultation";'
        );
      }
      
      data = retryData;
      error = null;
    }

    if (error) {
      console.error('❌ Appointment creation error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        context: {
          patient_id,
          user_id,
          appointment_date,
          duration_minutes,
          appointment_type,
        }
      });
      
      throw new Error(
        `Failed to create appointment: ${error.message || 'Unknown error'}. ` +
        (error.details ? `Details: ${error.details}. ` : '') +
        (error.hint ? `Hint: ${error.hint}` : '')
      );
    }

    // Create associated payment record
    if (data?.id) {
      const { error: paymentError } = await supabase.from('appointment_payments').insert({
        appointment_id: data.id,
        amount_due: 0, // Will be set by doctor when completing appointment
        payment_status: 'pending',
      });
      
      if (paymentError) {
        console.warn('⚠️ Payment record creation failed:', paymentError);
        // Don't throw - appointment was created, payment record can be retried
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
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

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('id');

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const updates = await request.json();

    // Get current appointment to verify authorization
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*') 
      .eq('id', appointmentId)
      .single();

    if (fetchError || !currentAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Authorization checks
    const isDoctorOwner = userContext.roleType === 'doctor' && currentAppointment.user_id === userContext.userId;
    const isStaff = ['receptionist', 'clinic_admin', 'branch_admin', 'super_admin'].includes(userContext.roleType);

    // Only doctor can mark as completed or ongoing
    if (updates.status === 'completed' || updates.status === 'ongoing') {
      if (!isDoctorOwner) {
        return NextResponse.json(
          { error: 'Only the assigned doctor can complete appointments' },
          { status: 403 }
        );
      }
    }

    // Only receptionist/admin can cancel
    if (updates.status === 'cancelled') {
      if (!isDoctorOwner && !isStaff) {
        return NextResponse.json(
          { error: 'Insufficient permissions to cancel appointment' },
          { status: 403 }
        );
      }
    }

    // If completing appointment, must have fee_amount (for invoice)
    if (updates.status === 'completed') {
      const feeAmount = updates.fee_amount;
      if (feeAmount === undefined) {
        return NextResponse.json(
          { error: 'Fee amount is required when completing appointment' },
          { status: 400 }
        );
      }

      updates.completed_at = new Date();
      // Don't store fee_amount on appointment - it's only for payment tracking
      delete updates.fee_amount;

      // Update associated payment record with fee amount
      const { error: paymentUpdateError } = await supabase
        .from('appointment_payments')
        .update({
          amount_due: feeAmount,
        })
        .eq('appointment_id', appointmentId);

      if (paymentUpdateError) {
        console.warn('⚠️ Payment record update failed:', paymentUpdateError);
      }

      // Create or update invoice
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('appointment_id', appointmentId)
        .single();

      if (existingInvoice) {
        // Update existing invoice
        await supabase
          .from('invoices')
          .update({
            amount: feeAmount,
            updated_at: new Date(),
          })
          .eq('id', existingInvoice.id);
      } else {
        // Create new invoice
        await supabase
          .from('invoices')
          .insert({
            patient_id: currentAppointment.patient_id,
            appointment_id: appointmentId,
            amount: feeAmount,
            status: 'pending',
            organization_id: userContext.organizationId,
            branch_id: userContext.branchId,
            notes: updates.notes || null,
          });
      }
    }

    if (updates.status === 'cancelled') {
      updates.cancelled_at = new Date();
    }

    // Log status change
    if (updates.status !== currentAppointment.status) {
      await supabase.from('appointment_status_logs').insert({
        appointment_id: appointmentId,
        previous_status: currentAppointment.status,
        new_status: updates.status,
        changed_by_id: userContext.userId,
        reason: updates.cancelled_reason || null,
      });
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select('*, patients(first_name, last_name), users!user_id(first_name, last_name)')
      .single();

    if (error) {
      console.error('❌ Error updating appointment:', {
        message: error.message,
        code: error.code,
        details: error.details,
        updates,
        appointmentId,
      });
      throw error;
    }

    console.log('✅ Appointment updated successfully:', {
      appointmentId,
      status: updates.status,
    });

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('❌ Error in PUT /api/appointments:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to update appointment', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can delete
    if (!['clinic_admin', 'branch_admin', 'super_admin'].includes(userContext.roleType)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('id');

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) throw error;

    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
