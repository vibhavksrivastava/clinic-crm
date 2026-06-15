// app/api/pharmacy/supplier-returns/route.ts

import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// ================= GET =================
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const id = searchParams.get('id');

    // ================= SINGLE =================
    if (id) {
      const { data, error } = await supabase
        .from('pharmacy_supplier_returns')
        .select(`
          *,
          supplier:supplier_id(
            id,
            supplier_name
          ),
          grn:grn_id(
            id,
            grn_number
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    }

    // ================= LIST =================

    const { data, error } = await supabase
      .from('pharmacy_supplier_returns')
      .select(`
        *,
        supplier:supplier_id(
          id,
          supplier_name
        ),
        grn:grn_id(
          id,
          grn_number
        )
      `)
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const returns =
      data?.map((item: any) => ({
        id: item.id,
        return_number: item.return_number,
        return_date: item.return_date,
        total_amount: item.total_amount,
        gst_amount: item.gst_amount,
        status: item.status,

        supplier_id:
          item.supplier?.id || '',

        supplier_name:
          item.supplier?.supplier_name ||
          '',

        grn_id:
          item.grn?.id || '',

        grn_number:
          item.grn?.grn_number || '',
      })) || [];

    return NextResponse.json(returns);
  } catch (error) {
    console.error(
      'SUPPLIER RETURN LIST ERROR:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to fetch supplier returns',
      },
      { status: 500 }
    );
  }
}

// ================= POST =================
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      grn_id,
      purchase_order_id,
      supplier_id,
      reason,
      notes,
      subtotal,
      gst_amount,
      total_amount,
      status,
    } = body;

    const returnNumber =
      `SR-${Date.now()}`;

    // Get organization & branch from GRN

    const {
      data: grn,
      error: grnError,
    } = await supabase
      .from('pharmacy_grns')
      .select(
        'organization_id, branch_id'
      )
      .eq('id', grn_id)
      .single();

    if (grnError || !grn) {
      return NextResponse.json(
        { error: 'GRN not found' },
        { status: 400 }
      );
    }

    const { data, error } =
      await supabase
        .from(
          'pharmacy_supplier_returns'
        )
        .insert([
          {
            organization_id:
              grn.organization_id,

            branch_id:
              grn.branch_id,

            grn_id,
            purchase_order_id,
            supplier_id,

            return_number:
              returnNumber,

            reason,
            notes,

            subtotal,
            gst_amount,
            total_amount,

            status:
              status || 'Pending',

            created_by:
              session.userId,
          },
        ])
        .select()
        .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          'Failed to create supplier return',
      },
      { status: 500 }
    );
  }
}

// ================= PUT =================
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(req.url);

    const id =
      searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID required' },
        { status: 400 }
      );
    }

    const body = await req.json();

    const { data, error } =
      await supabase
        .from(
          'pharmacy_supplier_returns'
        )
        .update(body)
        .eq('id', id)
        .select()
        .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          'Failed to update supplier return',
      },
      { status: 500 }
    );
  }
}

// ================= DELETE =================
export async function DELETE(
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

    const id =
      searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID required' },
        { status: 400 }
      );
    }

    const { error } =
      await supabase
        .from(
          'pharmacy_supplier_returns'
        )
        .delete()
        .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          'Failed to delete supplier return',
      },
      { status: 500 }
    );
  }
}