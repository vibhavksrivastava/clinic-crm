import { supabase } from '@/lib/db/client';
import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    // 🔐 AUTH
    const userContext =
      await getSessionFromRequest(request);

    if (!userContext) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 📥 BODY
    const body = await request.json();

    const {
      patient_id,
      payment_method,
      subtotal,
      gst_amount,
      discount_amount,
      total_amount,
      items,
    } = body;

    // 🧾 INVOICE NUMBER
    const invoiceNumber = `INV-${Date.now()}`;

    // 💾 CREATE SALE
    const { data: sale, error: saleError } =
      await supabase
        .from('pharmacy_sales')
        .insert({
          organization_id:
            userContext.organizationId,

          branch_id:
            userContext.branchId,

          invoice_number: invoiceNumber,

          patient_id,

          subtotal,

          gst_amount,

          discount_amount,

          total_amount,

          payment_method,

          payment_status: 'paid',

          created_by: userContext.userId,
        })
        .select()
        .single();

    if (saleError) {
      console.error(saleError);

      return NextResponse.json(
        { error: saleError.message },
        { status: 500 }
      );
    }

    // 🔄 PROCESS ITEMS
    for (const item of items) {
      // 📦 GET INVENTORY
      const {
        data: inventory,
        error: inventoryError,
      } = await supabase
        .from('pharmacy_inventory')
        .select('*')
        .eq('id', item.inventory_id)
        .single();

      if (inventoryError || !inventory) {
        console.error(
          'Inventory fetch error:',
          inventoryError
        );

        continue;
      }

      // ❌ STOCK CHECK
      if (
        inventory.stock_quantity <
        item.quantity
      ) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${item.product_name}`,
          },
          { status: 400 }
        );
      }

      // ➖ UPDATE STOCK
      const updatedQty =
        inventory.stock_quantity -
        item.quantity;

      const { error: stockUpdateError } =
        await supabase
          .from('pharmacy_inventory')
          .update({
            stock_quantity: updatedQty,
          })
          .eq('id', inventory.id);

      if (stockUpdateError) {
        console.error(stockUpdateError);

        return NextResponse.json(
          {
            error:
              'Failed to update inventory stock',
          },
          { status: 500 }
        );
      }

      // 🧾 INSERT SALE ITEM
      const { error: saleItemError } =
        await supabase
          .from('pharmacy_sale_items')
          .insert({
            sale_id: sale.id,

            inventory_id: inventory.id,

            product_id: item.product_id,

            quantity: item.quantity,

            unit_price: item.unit_price,

            gst_percent:
              item.gst_percent || 0,

            total_amount:
              item.total_amount,
          });

      if (saleItemError) {
        console.error(saleItemError);

        return NextResponse.json(
          {
            error:
              'Failed to save sale item',
          },
          { status: 500 }
        );
      }

      // 📒 STOCK MOVEMENT
      const {
        error: movementError,
      } = await supabase
        .from(
          'pharmacy_stock_movements'
        )
        .insert({
          inventory_id: inventory.id,

          product_id: item.product_id,

          organization_id:
            userContext.organizationId,

          branch_id:
            userContext.branchId,

          movement_type: 'sale',

          quantity: item.quantity,

          reference_id: sale.id,

          created_by:
            userContext.userId,
        });

      if (movementError) {
        console.error(movementError);
      }
    }

    // ✅ SUCCESS
    return NextResponse.json({
      success: true,
      message:
        'Billing completed successfully',
      sale,
    });
  } catch (error) {
    console.error('Billing API Error:', error);

    return NextResponse.json(
      {
        error: 'Billing failed',
      },
      { status: 500 }
    );
  }
}