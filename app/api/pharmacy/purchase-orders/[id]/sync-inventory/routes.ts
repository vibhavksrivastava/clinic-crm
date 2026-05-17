import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: purchaseOrderId } = await context.params;

  // 1. get PO items
  const { data: items } = await supabase
    .from('pharmacy_purchase_order_items')
    .select('*')
    .eq('purchase_order_id', purchaseOrderId);

  for (const item of items || []) {
    const qty = Number(item.received_quantity || 0);

    // ======================
    // INVENTORY UPDATE
    // ======================
    const { data: inventory } = await supabase
      .from('pharmacy_inventory')
      .select('*')
      .eq('product_id', item.product_id)
      .eq('batch_number', item.batch_number)
      .maybeSingle();

    let inventoryId;

    if (inventory) {
      const newQty =
        Number(inventory.quantity || 0) + qty;

      const { data } = await supabase
        .from('pharmacy_inventory')
        .update({
          quantity: newQty,
          expiry_date: item.expiry_date,
          purchase_price: item.purchase_price,
        })
        .eq('id', inventory.id)
        .select()
        .single();

      inventoryId = data.id;
    } else {
      const { data } = await supabase
        .from('pharmacy_inventory')
        .insert({
          product_id: item.product_id,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          quantity: qty,
          purchase_price: item.purchase_price,
        })
        .select()
        .single();

      inventoryId = data.id;
    }

    // ======================
    // STOCK UPDATE
    // ======================
    const { data: stock } = await supabase
      .from('pharmacy_stock')
      .select('*')
      .eq('product_id', item.product_id)
      .maybeSingle();

    if (stock) {
      await supabase
        .from('pharmacy_stock')
        .update({
          current_stock:
            Number(stock.current_stock || 0) + qty,
        })
        .eq('id', stock.id);
    } else {
      await supabase.from('pharmacy_stock').insert({
        product_id: item.product_id,
        current_stock: qty,
      });
    }

    // ======================
    // STOCK MOVEMENT
    // ======================
    await supabase.from('pharmacy_stock_movements').insert({
      product_id: item.product_id,
      inventory_id: inventoryId,
      movement_type: 'PURCHASE',
      quantity: qty,
      reference_id: purchaseOrderId,
      remarks: 'PO Inventory Sync',
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Inventory synced successfully',
  });
}