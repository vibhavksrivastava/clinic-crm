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

const { id } = await params;

let query = supabase
  .from('pharmacy_grns')
  .select(`
    *,
    purchase_orders:purchase_order_id (
      id,
      po_number,
      supplier:supplier_id (
        id,
        supplier_name,
        contact_person,
        phone,
        email,
        address
      )
    ),
    items:pharmacy_grn_items (
      id,
      product_id,
      received_quantity,
      purchase_price,
      selling_price,
      total_amount,
      batch_number,
      expiry_date,
      mrp,
      received_date,
      gst_percent,
      gst_amount,
      product:product_id (
        id,
        name,
        gst
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

if (error) {
  console.error('GRN FETCH ERROR:', error);

  return NextResponse.json(
    { error: error.message },
    { status: 404 }
  );
}

if (!data) {
  return NextResponse.json(
    { error: 'GRN not found' },
    { status: 404 }
  );
}

return NextResponse.json(data);


} catch (error: any) {
console.error(error);

return NextResponse.json(
  {
    error:
      error.message ||
      'Failed to fetch GRN',
  },
  { status: 500 }
);
}}