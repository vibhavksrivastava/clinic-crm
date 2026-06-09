import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

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
    const {id} = await params;
    console.log('Fetching PO with ID:', id);

    let query = supabase
      .from('pharmacy_purchase_orders')
        .select(`
        *,
        supplier:pharmacy_suppliers (
          id,
          supplier_name,
          phone,
          email,
          address
        ),
        items:pharmacy_purchase_items (
          id,
          product_id,
          quantity,
          purchase_price,
          selling_price,
          received_quantity,
          total_amount,
          item_status,
          product:pharmacy_products(
        id,
        name,
        gst
        ),
       grn:pharmacy_grn_items (
        id,
        batch_number,
        expiry_date,
        received_quantity,
        purchase_price,
        selling_price,
        mrp,
        received_date
      )
      )
      `)
      .eq('id', id);
      if (session.organizationId) {
      query = query.eq(
        'organization_id',
        session.organizationId
      );
    }

    if (session.branchId) {
      query = query.eq(
        'branch_id',
        session.branchId
      );
    }
    const { data, error } = await query.single();
    console.log('Supabase query result:', { data, error });
    if (error) {
      console.error('PO FETCH ERROR:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Purchase Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch PO',
      },
      { status: 500 }
    );
  }
}