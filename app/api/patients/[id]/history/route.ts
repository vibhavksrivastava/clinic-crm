// app/api/patients/[id]/history/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Next.js 16 params handling
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Patient id is required' },
        { status: 400 }
      );
    }

    // ✅ Get patient details
    const { data: patient, error: patientError } =
      await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

    if (patientError) {
      return NextResponse.json(
        { error: patientError.message },
        { status: 500 }
      );
    }

    // ✅ Get prescription history
    const { data: prescriptions, error: prescriptionError } =
      await supabase
        .from('prescriptions')
        .select(`
          id,
          issued_date,
          notes,
          vitals,
          medications,
          additional_tests,
          pharmacy_status,
          created_at,
          users:user_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('patient_id', id)
        .order('issued_date', {
          ascending: true,
        });

    if (prescriptionError) {
      return NextResponse.json(
        { error: prescriptionError.message },
        { status: 500 }
      );
    }

    // ✅ Create vitals chart data
    const vitalsTimeline =
      prescriptions?.map((p: any) => ({
        date: p.issued_date,

        height:
          p.vitals?.height || null,

        weight:
          p.vitals?.weight || null,

        heart_rate:
          p.vitals?.heart_rate || null,

        temperature:
          p.vitals?.temperature || null,

        oxygen_saturation:
          p.vitals?.oxygen_saturation || null,

        blood_pressure_systolic:
          p.vitals?.blood_pressure_systolic || null,

        blood_pressure_diastolic:
          p.vitals?.blood_pressure_diastolic || null,
      })) || [];

    return NextResponse.json({
      patient,
      prescriptions,
      vitalsTimeline,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error.message ||
          'Failed to load patient history',
      },
      { status: 500 }
    );
  }
}