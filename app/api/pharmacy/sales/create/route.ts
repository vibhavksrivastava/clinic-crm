import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);

    if (!userContext) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      customer_id,
      payment_method,
      notes,
      items,
      subtotal,
      gst_amount,
      total_amount,
      discount_amount,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        {
          error: 'Items required',
        },
        { status: 400 }
      );
    }

    const invoiceNumber = `INV-${Date.now()}`;
    console.log('SALE BODY:', body);

    const { data: sale, error: saleError } = await supabase
      .from('pharmacy_sales')
      .insert({
        customer_id,
        payment_method,
        notes,
        subtotal,
        gst_amount,
        total_amount,
        discount_amount,
        invoice_number: invoiceNumber,
        payment_status: 'paid',
        organization_id: userContext.organizationId,
        branch_id: userContext.branchId,
        created_by: userContext.userId,
      })
      .select()
      .single();

    if (saleError) throw saleError;

    for (const item of items) {
      const saleItemPayload = {
        sale_id: sale.id,
        product_id: item.product_id,
        inventory_id: item.inventory_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        gst_percent: item.gst_percent,
        total_amount: item.total_amount,
        discount_percent: item.discount_percent || 0,
      };
        console.log('SALE BODY:', body);
        console.log('SALE ITEM PAYLOAD:', saleItemPayload);

      const { error: itemError } = await supabase
        .from('pharmacy_sale_items')
        .insert(saleItemPayload);

      if (itemError) throw itemError;

      const { data: inventory } = await supabase
        .from('pharmacy_inventory')
        .select('*')
        .eq('id', item.inventory_id)
        .single();

      const newQty =
        Number(inventory.stock_quantity || 0) -
        Number(item.quantity || 0);

      const { error: inventoryError } = await supabase
        .from('pharmacy_inventory')
        .update({
          stock_quantity: newQty,
          updated_at: new Date(),
        })
        .eq('id', item.inventory_id);

      if (inventoryError) throw inventoryError;
        console.log('SALE BODY:', body);
        console.log('SALE ITEM PAYLOAD:', saleItemPayload);

      const { error: movementError } = await supabase
        .from('pharmacy_stock_movements')
        .insert({
          inventory_id: item.inventory_id,
          product_id: item.product_id,
          organization_id: userContext.organizationId,
          branch_id: userContext.branchId,
          movement_type: 'sale',
          quantity: item.quantity,
          reference_id: sale.id,
          notes: `Sale Invoice ${invoiceNumber}`,
          created_by: userContext.userId,
        });

      if (movementError) throw movementError;
    }

return Response.json({
  success: true,
  sale,
});  } catch (error: any) {
    //console.error(error);
    console.error('SALE CREATE ERROR:', error);

    return NextResponse.json(
      {
        error: error.message|| 'Internal server error',
        details: error.details || null,
      },
      { status: 500 }
    );
  }
}
