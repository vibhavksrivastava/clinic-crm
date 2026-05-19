import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromRequest(request);
    const {id} = await params;
    console.log('HIT PO ID:', id);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ✅ FIXED PARAM ACCESS
    const poId = id;

    console.log('DEBUG PO ID:', poId);

    if (!poId) {
      return NextResponse.json(
        { error: 'Missing purchase order id' },
        { status: 400 }
      );
    }

    // FETCH PO
    const { data: po, error: poError } = await supabase
      .from('pharmacy_purchase_orders')
      .select('*')
      .eq('id', poId)
      .single();

    if (poError || !po) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    if (po.inventory_updated) {
      return NextResponse.json(
        { error: 'Inventory already updated' },
        { status: 400 }
      );
    }

    // FETCH ITEMS
    const { data: items, error: itemError } = await supabase
      .from('pharmacy_purchase_items')
      .select('*')
      .eq('purchase_order_id', poId);

    if (itemError || !items?.length) {
      return NextResponse.json(
        { error: 'No items found' },
        { status: 400 }
      );
    }

    // PROCESS ITEMS
    for (const item of items) {
      const { data: inventory, error: invError } = await supabase
        .from('pharmacy_inventory')
        .insert({
          organization_id: po.organization_id,
          branch_id: po.branch_id,

          product_id: item.product_id,
          batch_number: item.batch_number || null,
          expiry_date: item.expiry_date || null,

          purchase_price: item.purchase_price || 0,
          selling_price: item.mrp || 0,
          mrp: item.mrp || 0,

          stock_quantity: item.quantity || 0,
          minimum_stock: 0,
        })
        .select()
        .single();

      if (invError) {
        console.error(invError);

        return NextResponse.json(
          {
            error: 'Inventory insert failed',
            details: invError.message,
          },
          { status: 500 }
        );
      }

      // STOCK UPDATE
      const { data: stock } = await supabase
        .from('pharmacy_stock')
        .select('*')
        .eq('product_id', item.product_id)
        .single();

      if (stock) {
        await supabase
          .from('pharmacy_stock')
          .update({
            quantity:
              Number(stock.quantity || 0) +
              Number(item.quantity || 0),
          })
          .eq('id', stock.id);
      } else {
        await supabase.from('pharmacy_stock').insert({
          organization_id: po.organization_id,
          branch_id: po.branch_id,
          product_id: item.product_id,
          quantity: item.quantity,
        });
      }

      // STOCK MOVEMENT
      await supabase.from('pharmacy_stock_movements').insert({
        inventory_id: inventory.id,
        product_id: item.product_id,
        organization_id: po.organization_id,
        branch_id: po.branch_id,
        movement_type: 'purchase',
        quantity: item.quantity,
        reference_id: po.id,
      });
    }

    // UPDATE PO
    await supabase
      .from('pharmacy_purchase_orders')
      .update({
        inventory_updated: true,
        inventory_updated_at: new Date().toISOString(),
        inventory_updated_by: user.userId,
        status: 'received',
      })
      .eq('id', poId);

    return NextResponse.json({
      success: true,
      message: 'Inventory updated successfully',
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}