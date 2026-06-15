import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const session =
      await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } =
      await context.params;

    const { items } =
      await req.json();

    const activeItems = items.filter(
      (item: any) =>
        item.batches?.some(
          (batch: any) =>
            Number(
              batch.received_quantity || 0
            ) > 0
        )
    );

    if (activeItems.length === 0) {
      return NextResponse.json(
        {
          error:
            'No quantities received',
        },
        { status: 400 }
      );
    }

    // ==================================
    // LOAD PURCHASE ORDER
    // ==================================

    const {
      data: purchaseOrder,
      error: poError,
    } = await supabase
      .from(
        'pharmacy_purchase_orders'
      )
      .select('*')
      .eq('id', id)
      .single();

    if (poError) throw poError;

    //1. Load PO Items (after loading purchaseOrder)
const {
  data: purchaseItems,
  error: purchaseItemsError,
} = await supabase
  .from('pharmacy_purchase_items')
  .select('*')
  .eq('purchase_order_id', id);

if (purchaseItemsError) throw purchaseItemsError;

    // ==================================
    // CREATE SINGLE GRN HEADER
    // ==================================

    const grnNumber = `GRN-${Date.now()}`;

    const {
      data: grn,
      error: grnError,
    } = await supabase
      .from('pharmacy_grns')
      .insert({
        grn_number: grnNumber,
        grn_date:
          new Date().toISOString(),

        purchase_order_id: id,

        supplier_id:
          purchaseOrder.supplier_idl,

        organization_id:
          session.organizationId,

        branch_id:
          session.branchId,

        created_by:
          session.userId,

        received_by:
          session.userId,

        status: 'Completed',

        total_items: 0,
        total_quantity: 0,
        total_amount: 0,
      })
      .select()
      .single();

    if (grnError) throw grnError;

    let totalOrdered = 0;
    let totalReceived = 0;

    let grnTotalItems = 0;
    let grnTotalQty = 0;

    let grnTaxableAmount = 0;
    let grnGstAmount = 0;
    let grnTotalAmount = 0;

    // ==================================
    // PROCESS ITEMS
    // ==================================

    for (const item of items) {
      const orderedQty = Number(
        item.quantity || 0
      );

      let itemReceived = 0;

      for (const batch of item.batches || []) {
        const receivedQty = Number(
          batch.received_quantity || 0
        );

        if (receivedQty <= 0)
          continue;

        itemReceived +=
          receivedQty;

        const availableQty =
          orderedQty -
          Number(
            item.received_quantity || 0
          );

        if (
          itemReceived >
          availableQty
        ) {
          throw new Error(
            `${item.product_name} exceeds pending quantity`
          );
        }

        // ==========================
        // GRN ITEM
        // ==========================

          const poItem = purchaseItems?.find(
            (p: any) => p.id === item.id
          );

          const gstPercent = Number(
            poItem?.gst_percent || 0
          );

          const taxableAmount =
            receivedQty *
            Number(batch.purchase_price || 0);

          const gstAmount =
            (taxableAmount * gstPercent) / 100;

          const totalAmount =
            taxableAmount + gstAmount;

        const {
          data: grnItem,
          error: grnItemError,
        } = await supabase
          .from(
            'pharmacy_grn_items'
          )
          .insert({
  grn_id: grn.id,

  purchase_order_id: id,

  purchase_item_id: item.id,

  product_id: item.product_id,

  batch_number: batch.batch_number,

  expiry_date: batch.expiry_date,

  received_quantity: receivedQty,

  returned_quantity: 0,

  purchase_price: batch.purchase_price,

  mrp: batch.mrp,

  selling_price: batch.selling_price,

  gst_percent: gstPercent,

  taxable_amount: taxableAmount,

  gst_amount: gstAmount,

  total_amount: totalAmount,

  organization_id:
    session.organizationId,

  branch_id:
    session.branchId,
})
          .select()
          .single();

        if (grnItemError)
          throw grnItemError;

        // ==========================
        // GRN TOTALS
        // ==========================

        grnTotalItems += 1;
        grnTotalQty +=
          receivedQty;

        grnTaxableAmount += taxableAmount;
        
        grnGstAmount += gstAmount;

        grnTotalAmount += totalAmount;
        // ==========================
        // INVENTORY
        // ==========================

        let inventoryId =
          null;

        const {
          data: existingInventory,
        } = await supabase
          .from(
            'pharmacy_inventory'
          )
          .select(
            'id, stock_quantity'
          )
          .eq(
            'product_id',
            item.product_id
          )
          .eq(
            'organization_id',
            session.organizationId
          )
          .eq(
            'branch_id',
            session.branchId
          )
          .eq(
            'batch_number',
            batch.batch_number
          )
          .maybeSingle();

        if (
          existingInventory
        ) {
          const { error } =
            await supabase
              .from(
                'pharmacy_inventory'
              )
              .update({
                stock_quantity:
                  Number(
                    existingInventory.stock_quantity ||
                      0
                  ) +
                  receivedQty,

                mrp:
                  batch.mrp,

                purchase_price:
                  batch.purchase_price,

                selling_price:
                  batch.selling_price,

                expiry_date:
                  batch.expiry_date,

                updated_at:
                  new Date().toISOString(),
              })
              .eq(
                'id',
                existingInventory.id
              );

          if (error)
            throw error;

          inventoryId =
            existingInventory.id;
        } else {
          const {
            data: newInventory,
            error:
              inventoryError,
          } = await supabase
            .from(
              'pharmacy_inventory'
            )
            .insert({
              product_id:
                item.product_id,

              grn_item_id:
                grnItem.id,

              organization_id:
                session.organizationId,

              branch_id:
                session.branchId,

              batch_number:
                batch.batch_number,

              expiry_date:
                batch.expiry_date,

              stock_quantity:
                receivedQty,

              mrp:
                batch.mrp,

              purchase_price:
                batch.purchase_price,

              selling_price:
                batch.selling_price,
            })
            .select('id')
            .single();

          if (
            inventoryError
          )
            throw inventoryError;

          inventoryId =
            newInventory.id;
        }

        // ==========================
        // STOCK MOVEMENT
        // ==========================

        const {
          error: movementError,
        } = await supabase
          .from(
            'pharmacy_stock_movements'
          )
          .insert({
            inventory_id:
              inventoryId,

            product_id:
              item.product_id,

            organization_id:
              session.organizationId,

            branch_id:
              session.branchId,

            movement_type:
              'purchase',

            quantity:
              receivedQty,

            reference_type:
              'GRN',

            reference_id:
              grn.id,

            created_by:
              session.userId,

            notes:
              grn.grn_number,
          });

        if (movementError)
          throw movementError;
      }

      // ==========================
      // UPDATE PO ITEM
      // ==========================

      const newReceivedQty =
        Number(
          item.received_quantity || 0
        ) + itemReceived;

      const itemStatus =
        newReceivedQty === 0
          ? 'Pending'
          : newReceivedQty <
            orderedQty
          ? 'Partial'
          : 'Received';

      const {
        error: itemUpdateError,
      } = await supabase
        .from(
          'pharmacy_purchase_items'
        )
        .update({
          received_quantity:
            newReceivedQty,

          item_status:
            itemStatus,
        })
        .eq('id', item.id);

      if (itemUpdateError)
        throw itemUpdateError;

      totalOrdered +=
        orderedQty;

      totalReceived +=
        newReceivedQty;
    }

    // ==================================
    // UPDATE GRN TOTALS
    // ==================================

    const {
      error: grnUpdateError,
    } = await supabase
      .from('pharmacy_grns')
      .update({
  total_items: grnTotalItems,

  total_quantity: grnTotalQty,

  gst_amount: grnGstAmount,

  total_amount: grnTotalAmount,
})
      .eq('id', grn.id);

    if (grnUpdateError)
      throw grnUpdateError;

    // ==================================
    // UPDATE PO STATUS
    // ==================================

    const poStatus =
      totalReceived === 0
        ? 'Pending'
        : totalReceived <
          totalOrdered
        ? 'Partial'
        : 'Received';

    const {
      error: poUpdateError,
    } = await supabase
      .from(
        'pharmacy_purchase_orders'
      )
      .update({
        status: poStatus,

        received_at:
          new Date().toISOString(),

        inventory_updated: true,

        inventory_updated_at:
          new Date().toISOString(),
      })
      .eq('id', id);

    if (poUpdateError)
      throw poUpdateError;

    return NextResponse.json({
      success: true,
      grn_id: grn.id,
      grn_number:
        grn.grn_number,
      status: poStatus,
    });
  } catch (error: any) {
    console.error(
      'Receive PO Error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          'Internal Server Error',
      },
      { status: 500 }
    );
  }
}