import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await params;

    const user = await getSessionFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const purchaseOrderId = (await params).id;

    // 1. Get PO + Items
    const { data: po } = await supabase
      .from('pharmacy_purchase_orders')
      .select('*')
      .eq('id', purchaseOrderId)
      .single();

    const { data: items } = await supabase
      .from('pharmacy_purchase_order_items')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId);

    if (!po || !items) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // 2. Prevent double inventory posting
    if (po.inventory_posted) {
      return NextResponse.json(
        { error: 'Inventory already updated' },
        { status: 409 }
      );
    }

    // 3. Loop items → update stock
    for (const item of items) {
      const qty = Number(item.received_quantity || 0);

      if (qty <= 0) continue;

      // check if batch exists
      const { data: existing } = await supabase
        .from('pharmacy_inventory')
        .select('*')
        .eq('product_id', item.product_id)
        .eq('batch_number', item.batch_number)
        .eq('organization_id', user.organizationId)
        .maybeSingle();

      if (existing) {
        // update stock
        await supabase
          .from('pharmacy_inventory')
          .update({
            quantity: existing.quantity + qty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // insert new batch
        await supabase.from('pharmacy_inventory').insert({
          product_id: item.product_id,
          organization_id: user.organizationId,
          branch_id: user.branchId,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          purchase_price: item.purchase_price,
          selling_price: item.mrp,
          quantity: qty,
          minimum_stock: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // OPTIONAL: stock movement log
      await supabase.from('pharmacy_stock_movement').insert({
        product_id: item.product_id,
        type: 'IN',
        quantity: qty,
        reference_id: purchaseOrderId,
        reference_type: 'PURCHASE_ORDER',
        organization_id: user.organizationId,
        branch_id: user.branchId,
        created_at: new Date().toISOString(),
      });
    }

    // 4. Mark PO as inventory posted
    await supabase
      .from('pharmacy_purchase_orders')
      .update({
        inventory_posted: true,
        inventory_posted_at: new Date().toISOString(),
      })
      .eq('id', purchaseOrderId);

    return NextResponse.json({
      success: true,
      id: purchaseOrderId
    });
  } catch (error: any) {
    console.error('UPDATE INVENTORY ERROR:', error);

    return NextResponse.json(
      { error: error.message || 'Inventory update failed' },
      { status: 500 }
    );
  }
}