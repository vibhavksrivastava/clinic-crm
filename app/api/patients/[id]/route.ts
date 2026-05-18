import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', id)
      .order('appointment_date', { ascending: false });

    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', id)
      .order('issued_date', { ascending: false });

    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false });

    const { data: insuranceDetails } = await supabase
      .from('patient_insurance')
      .select('*')
      .eq('patient_id', id);

    const { data: emergencyContacts } = await supabase
      .from('patient_emergency_contacts')
      .select('*')
      .eq('patient_id', id);

    return NextResponse.json({
      patient,
      appointments: appointments || [],
      prescriptions: prescriptions || [],
      invoices: invoices || [],
      insuranceDetails: insuranceDetails || [],
      emergencyContacts: emergencyContacts || [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: 'Failed to fetch patient details',
      },
      {
        status: 500,
      }
    );
  }
}