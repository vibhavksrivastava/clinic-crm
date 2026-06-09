import {NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { supabase } from '@/lib/db/client';



export async function GET(req: NextRequest) {
  const session =
    await getSessionFromRequest(req);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } =
      new URL(req.url);

    const appointment_id =
      searchParams.get(
        'appointment_id'
      );

    console.log(
      'Invoice Session:',
      session
    );

    // =====================================================
    // SINGLE INVOICE
    // =====================================================

    if (appointment_id) {
      let invoiceQuery =
        supabase
          .from('invoices')
          .select(`
            *,
            patient:patients (
              id,
              first_name,
              last_name,
              phone
            ),
            appointment:appointments (
              id,
              appointment_date,
              duration_minutes,
              status,
              appointment_type,
              user:user_id (
                id,
                first_name,
                last_name,
                specialization
              )
            )
          `)
          .eq(
            'appointment_id',
            appointment_id
          );

      if (
        session.organizationId
      ) {
        invoiceQuery =
          invoiceQuery.eq(
            'organization_id',
            session.organizationId
          );
      }

      if (
        session.branchId
      ) {
        invoiceQuery =
          invoiceQuery.eq(
            'branch_id',
            session.branchId
          );
      }

      const {
        data,
        error,
      } =
        await invoiceQuery.maybeSingle();

      if (error) {
        console.error(
          'Invoice fetch error:',
          error
        );

        return NextResponse.json(
          {
            error:
              error.message,
          },
          {
            status: 500,
          }
        );
      }

      return NextResponse.json(
        data
      );
    }

    // =====================================================
    // ALL INVOICES
    // =====================================================

    let query = supabase
      .from('invoices')
      .select(`
        *,
        patient:patients (
          id,
          first_name,
          last_name,
          phone
        ),
        appointment:appointments (
          id,
          appointment_date,
          duration_minutes,
          status,
          appointment_type,
          user:user_id (
            id,
            first_name,
            last_name,
            specialization
          )
        )
      `);

    if (
      session.organizationId
    ) {
      query = query.eq(
        'organization_id',
        session.organizationId
      );
    }

    if (
      session.branchId
    ) {
      query = query.eq(
        'branch_id',
        session.branchId
      );
    }

    const {
      data,
      error,
    } = await query.order(
      'created_at',
      {
        ascending: false,
      }
    );

    if (error) {
      console.error(
        'Invoices fetch error:',
        error
      );

      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      data || []
    );
  } catch (error) {
    console.error(
      'Invoice API error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to fetch invoices',
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  return NextResponse.json({ success: true });
}