import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// ================= GET =================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Header
    const { data: supplierReturn, error: returnError } =
      await supabase
        .from('pharmacy_supplier_returns')
        .select(`
          *,
          supplier:supplier_id (
            id,
            supplier_name,
            email,
            phone
          ),
          grn:grn_id (
            id,
            grn_number,
            grn_date
          ),
          purchase_order:purchase_order_id (
            id,
            po_number
          )
        `)
        .eq('id', id)
        .single();

    if (returnError) {
      return NextResponse.json(
        { error: returnError.message },
        { status: 500 }
      );
    }

    // Items
    const { data: items, error: itemsError } =
      await supabase
        .from('pharmacy_supplier_return_items')
        .select(`
          *,
          product:product_id (
            id,
            name,
            sku,
            gst
          )
        `)
        .eq('supplier_return_id', id);

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...supplierReturn,
      items: items || [],
    });
  } catch (error) {
    console.error(
      'SUPPLIER RETURN DETAIL ERROR:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to fetch supplier return',
      },
      { status: 500 }
    );
  }
}

// ================= PUT =================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const body = await req.json();

    const { data, error } = await supabase
      .from('pharmacy_supplier_returns')
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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const { error } = await supabase
      .from('pharmacy_supplier_returns')
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