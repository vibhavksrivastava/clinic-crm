import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointment_id, vitals } = body;

    if (!appointment_id) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    if (!vitals) {
      return NextResponse.json({ error: 'Vitals data is required' }, { status: 400 });
    }

    console.log('Saving vitals for appointment:', appointment_id, 'Vitals:', vitals);

    // Get the appointment to get patient_id, user_id, and other details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('patient_id, user_id, organization_id, branch_id')
      .eq('id', appointment_id)
      .single();

    if (appointmentError || !appointment) {
      console.error('Appointment query error:', appointmentError);
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check if there's already a prescription for this appointment
    const { data: existingPrescription, error: queryError } = await supabase
      .from('prescriptions')
      .select('id')
      .eq('appointment_id', appointment_id)
      .maybeSingle();

    console.log('Existing prescription:', existingPrescription, 'Query error:', queryError);

    if (existingPrescription) {
      // Update existing prescription with vitals
      console.log('Updating existing prescription:', existingPrescription.id);
      const { error: updateError } = await supabase
        .from('prescriptions')
        .update({
          vitals: vitals,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPrescription.id);

      if (updateError) {
        console.error('Error updating prescription vitals:', updateError);
        return NextResponse.json({ error: `Failed to update vitals: ${updateError.message}` }, { status: 500 });
      }

      console.log('Successfully updated prescription vitals');
    } else {
      // Create new prescription with just vitals
      console.log('Creating new prescription with vitals for appointment:', appointment_id);
      const { error: createError } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: appointment.patient_id,
          user_id: appointment.user_id,
          appointment_id: appointment_id,
          vitals: vitals,
          medications: [],
          issued_date: new Date().toISOString(),
          status: 'active',
          organization_id: appointment.organization_id,
          branch_id: appointment.branch_id,
        });

      if (createError) {
        console.error('Error creating prescription with vitals:', createError);
        return NextResponse.json({ error: `Failed to save vitals: ${createError.message}` }, { status: 500 });
      }

      console.log('Successfully created prescription with vitals');
    }

    return NextResponse.json({
      success: true,
      message: 'Vitals saved successfully',
    });
  } catch (error) {
    console.error('Error in vitals endpoint:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
