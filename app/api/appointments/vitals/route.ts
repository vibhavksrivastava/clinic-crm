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

    // Role check
    if (
      !session.roleType ||
      !['doctor', 'clinic_admin', 'branch_admin'].includes(session.roleType)
    ) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { appointment_id, vitals } = body;

    if (!appointment_id || !vitals) {
      return NextResponse.json(
        { error: 'appointment_id and vitals are required' },
        { status: 400 }
      );
    }

    // GET APPOINTMENT
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointment_id)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // CHECK EXISTING PRESCRIPTION
    const { data: existingPrescription } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('appointment_id', appointment_id)
      .maybeSingle();

    // UPDATE EXISTING
    if (existingPrescription) {
      const { data, error } = await supabase
        .from('prescriptions')
        .update({
          vitals,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPrescription.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    // CREATE NEW
    const { data, error } = await supabase
      .from('prescriptions')
      .insert({
        appointment_id,
        patient_id: appointment.patient_id,
        user_id: session.userId,
        organization_id: session.organizationId,
        branch_id: session.branchId,
        medications: [],
        vitals,
        status: 'draft',
        issued_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Vitals API Error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}