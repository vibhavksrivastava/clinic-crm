import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';


// ================= GET =================
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);

    console.log('SESSION DATA:', session);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const supplierId =
      searchParams.get('supplier_id');

    const id = searchParams.get('id');

    // ================= SINGLE PO =================
    if (id) {
      const { data, error } = await supabase
        .from('pharmacy_grns')
        .select('*')
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
.from('pharmacy_grns')
.select( '*, purchase_order:purchase_order_id ( id, po_number, supplier:supplier_id ( id, supplier_name ) ) ');
console.log('ERROR:', error);
console.log('DATA:', JSON.stringify(data, null, 2));    
const grns =
  data?.map((grn: any) => ({
    id: grn.id,
    grn_number: grn.grn_number,
    grn_date: grn.grn_date,
    total_amount: grn.total_amount,
    gst_amount: grn.gst_amount,
    total_items: grn.total_items,
    status: grn.status,
    po_number: grn.purchase_order?.po_number || '',
    supplier_id: grn.purchase_order?.supplier?.id || '',
    supplier_name:
      grn.purchase_order?.supplier?.supplier_name || '',
    return_staus: grn.return_status,
    created_at: grn.created_at,
    created_by: grn.created_by,
    updated_at: grn.updated_at,
  })) || [];     
    return NextResponse.json(grns);
} catch (error) {
console.error('GRN LIST ERROR:', error);

return NextResponse.json(
{
error: 'Failed to fetch grns',
details:
error instanceof Error
? error.message
: String(error),
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
    const poNumber = `PO-${Date.now()}`;
    const {
      supplier_id,
      invoice_number,
      purchase_date,
      status,
      subtotal,
      gst_amount,
      total_amount,
    } = body;

// FETCH SUPPLIER ORGANIZATION
const { data: supplier, error: supplierError } =
  await supabase
    .from('pharmacy_suppliers')
    .select('organization_id, branch_id')
    .eq('id', supplier_id)
    .single();

if (supplierError || !supplier) {
  return NextResponse.json(
    { error: 'Supplier not found' },
    { status: 400 }
  );
}

const { data, error } = await supabase
  .from('pharmacy_grns')
  .insert([
    {
      organization_id: supplier.organization_id,
      branch_id: supplier.branch_id,
      supplier_id,
      po_number: poNumber,
      invoice_number,
      purchase_date,
      status: status || 'Draft',
      subtotal,
      gst_amount,
      total_amount,
      created_by: session.userId,
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
      { error: 'Failed to create grn' },
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
      .from('pharmacy_grns')
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
      { error: 'Failed to update grn' },
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
      .from('pharmacy_grns')
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
      { error: 'Failed to delete grn' },
      { status: 500 }
    );
  }
}