import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest
) {
  try {
    const session =
      await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(req.url);

    const appointment_id =
      searchParams.get(
        'appointment_id'
      );

    const id =
      searchParams.get('id');

    console.log(
      'RX FILTER appointment_id:',
      appointment_id
    );

    let query = supabase
      .from('prescriptions')
      .select(`
        *,
        patients(
          id,
          first_name,
          last_name,
          phone
        ),
        users!prescriptions_user_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq(
        'organization_id',
        session.organizationId
      )
      .order(
        'created_at',
        { ascending: false }
      );

    if (session.branchId) {
      query = query.eq(
        'branch_id',
        session.branchId
      );
    }

    // SINGLE RX
    if (id) {
      query = query.eq(
        'id',
        id
      );
    }

    // APPOINTMENT FILTER
    if (appointment_id) {
      query = query.eq(
        'appointment_id',
        appointment_id
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        'Prescription GET error:',
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

    console.log(
      'RX returned:',
      data?.length
    );

    return NextResponse.json(
      data || []
    );
  } catch (
    error: any
  ) {
    console.error(
      'GET RX ERROR:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to fetch prescriptions',
      },
      { status: 500 }
    );
  }
}


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
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const body =
      await req.json();

    const {
      appointment_id,
      patient_id,
      medications,
      vitals,
      additional_tests,
      notes,
    } = body;

    const {
      data,
      error,
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
                med.medicine_name ||
                '',

              dosage:
                med.duration ||
                '',

              frequency:
                med.frequency ||
                '',

              quantity: 0,

              notes:
                med.notes ||
                '',
            })
          ) || [],

        vitals:
          vitals || {},

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

    if (error) {
      console.error(
        'Prescription POST error:',
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

    return NextResponse.json(
      data
    );
  } catch (
    error: any
  ) {
    console.error(
      'POST RX ERROR:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to create prescription',
      },
      { status: 500 }
    );
  }
}