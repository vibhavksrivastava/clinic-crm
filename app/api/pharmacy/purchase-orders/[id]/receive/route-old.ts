import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  context: {params: Promise<{id: string;}>}
  //{ params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    console.log('PO ID:', id);
    const { items } = await req.json();

    let totalOrdered = 0;
    let totalReceived = 0;

    for (const item of items) {
      const orderedQty = Number(item.quantity || 0);
      let itemReceived = 0;

      for (const batch of item.batches || []) {
        const receivedQty = Number(
          batch.received_quantity || 0
        );

        if (receivedQty <= 0) continue;

        itemReceived += receivedQty;


        const { data: grn, error: grnError } =
  await supabase
    .from('pharmacy_grns')
    .insert({
      grn_number: `GRN-${Date.now()}`,
      grn_date: new Date().toISOString(),
      purchase_order_id: id,
      supplier_id: item.supplier_id,
      organization_id: session.organizationId,
      branch_id: session.branchId,
      created_by: session.userId,
      received_by: session.userId,
      status: 'Completed',
    })
    .select()
    .single();

if (grnError) throw grnError;

        // ==================================
        // GRN ITEM
        // ==================================

        const {
  data: grnItem,
  error: grnItemError,
} = await supabase
  .from('pharmacy_grn_items')
  .insert({
    grn_id: grn.id,
    purchase_order_id: id,
    purchase_item_id: item.id,

    product_id: item.product_id,

    batch_number: batch.batch_number,
    expiry_date: batch.expiry_date,

    received_quantity: receivedQty,

    purchase_price:
      batch.purchase_price,

    mrp: batch.mrp,

    selling_price:
      batch.selling_price,

    organization_id:
      session.organizationId,

    branch_id:
      session.branchId,
  })
  .select()
  .single();
        if (grnItemError) {
          throw new Error(grnItemError.message);
        }

        // ==================================
        // INVENTORY UPSERT
        // ==================================
        let inventoryId: string | null =
          null;

        const { data: existing } =
          await supabase
            .from('pharmacy_inventory')
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

        if (existing) {
          const { error } =
            await supabase
              .from(
                'pharmacy_inventory'
              )
              .update({
                stock_quantity:
                  Number(
                    existing.stock_quantity ||
                      0
                  ) + receivedQty,
                
                mrp:
                  batch.mrp || 0,

                purchase_price:
                  batch.purchase_price ||
                  0,

                selling_price:
                  batch.selling_price ||
                  0,

                updated_at:
                  new Date().toISOString(),
              })
              .eq(
                'id',
                existing.id
              );

          if (error) throw error;

          inventoryId =
            existing.id;
        } else {
          const {
            data: newInventory,
            error:
              inventoryInsertError,
          } = await supabase
            .from(
              'pharmacy_inventory'
            )
            .insert({
              product_id:
                item.product_id,
              grn_item_id: grnItem.id,
              organization_id:
                session.organizationId,

              branch_id:
                session.branchId,

              batch_number:
                batch.batch_number,

              expiry_date:
                batch.expiry_date ||
                null,

              stock_quantity:
                receivedQty,

              mrp:
                batch.mrp || 0,

              purchase_price:
                batch.purchase_price ||
                0,

              selling_price:
                batch.selling_price ||
                0,
            })
            .select('id')
            .single();

          if (
            inventoryInsertError
          ) {
            throw inventoryInsertError;
          }

          inventoryId =
            newInventory.id;
        }

        // ==================================
        // STOCK MOVEMENT
        // ==================================
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

            reference_type: 'GRN',

            reference_id: grn.id,
            created_by: session.userId,
            updated_by: session.userId,
              
            notes:
              'PURCHASE_ORDER',
          });

        if (movementError) {
          throw movementError;
        }
      }

      // ==================================
      // UPDATE PO ITEM
      // ==================================
      const newReceivedQty =
        Number(
          item.received_quantity || 0
        ) + itemReceived;

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
            newReceivedQty === 0
              ? 'Pending'
              : newReceivedQty <
                orderedQty
              ? 'Partial'
              : 'Received',
        })
        .eq('id', item.id);

      if (itemUpdateError) {
        throw itemUpdateError;
      }

      totalOrdered += orderedQty;
      totalReceived +=
        newReceivedQty;
    }

    // ==================================
    // PURCHASE ORDER STATUS
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
      })
      .eq('id', id);

    if (poUpdateError) {
      throw poUpdateError;
    }

    return NextResponse.json({
      success: true,
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