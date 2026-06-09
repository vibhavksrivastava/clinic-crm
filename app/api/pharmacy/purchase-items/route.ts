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

    const purchaseOrderId =
      searchParams.get('purchase_order_id');

    const supplierId =
      searchParams.get('supplier_id');

    let query = supabase
      .from('pharmacy_purchase_items')
      .select('*')
      .order('created_at', {
        ascending: false,
      });

    // FILTER BY PURCHASE ORDER
    if (purchaseOrderId) {
      query = query.eq(
        'purchase_order_id',
        purchaseOrderId
      );
    }

    // FILTER BY SUPPLIER
    if (supplierId) {
      query = query.eq(
        'supplier_id',
        supplierId
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      Array.isArray(data) ? data : []
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Failed to fetch purchase items' },
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

    console.log(
      'Purchase item payload:',
      body
    );

    const {
      purchase_order_id,
      product_id,
      product_name,
      quantity,
      purchase_price,
      gst_percent,
      selling_price,
      total_amount,
    } = body;

    // VALIDATION
    if (!purchase_order_id) {
      return NextResponse.json(
        {
          error:
            'purchase_order_id required',
        },
        { status: 400 }
      );
    }

    if (!product_id) {
      return NextResponse.json(
        {
          error: 'product_id required',
        },
        { status: 400 }
      );
    }

    const insertPayload = {
      purchase_order_id,
      product_id,
      product_name,
      quantity,
      purchase_price,
      gst_percent,
      total_amount,
      selling_price,
    };

    console.log(
      'Insert payload:',
      insertPayload
    );

    const { data, error } = await supabase
      .from('pharmacy_purchase_items')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error(
        'Insert error:',
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Failed to create purchase item' },
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

    const { searchParams } = new URL(req.url);

    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID required' },
        { status: 400 }
      );
    }

    const body = await req.json();

    const { data, error } = await supabase
      .from('pharmacy_purchase_items')
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
          'Failed to update purchase item',
      },
      { status: 500 }
    );
  }
}

// ================= DELETE =================
export async function DELETE(req: NextRequest) {
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

    if (!id) {
      return NextResponse.json(
        { error: 'ID required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('pharmacy_purchase_items')
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
          'Failed to delete purchase item',
      },
      { status: 500 }
    );
  }
}