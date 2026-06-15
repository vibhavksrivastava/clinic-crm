import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { supabase } from '@/lib/db/client';

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

const {
  supplier_return_id,
  grn_item_id,
  product_id,
  batch_number,
  expiry_date,
  quantity,
  purchase_price,
  gst_percent,
  gst_amount,
  total_amount,
} = body;

// --------------------------------
// INSERT RETURN ITEM
// --------------------------------

const {
  data: returnItem,
  error: returnItemError,
} = await supabase
  .from('pharmacy_supplier_return_items')
  .insert({
    supplier_return_id,
    grn_item_id,
    product_id,
    batch_number,
    expiry_date,
    quantity,
    purchase_price,
    gst_percent,
    gst_amount,
    total_amount,
  })
  .select()
  .single();

if (returnItemError) {
  throw returnItemError;
}

// --------------------------------
// GET GRN ITEM
// --------------------------------

const {
  data: grnItem,
  error: grnItemError,
} = await supabase
  .from('pharmacy_grn_items')
  .select('*')
  .eq('id', grn_item_id)
  .single();

if (grnItemError || !grnItem) {
  throw grnItemError || new Error('GRN Item not found');
}

// --------------------------------
// VALIDATE RETURN QUANTITY
// --------------------------------

const availableQty =
  Number(grnItem.received_quantity || 0) -
  Number(grnItem.returned_quantity || 0);

if (Number(quantity) > availableQty) {
  throw new Error(
    `Cannot return ${quantity}. Available quantity is ${availableQty}`
  );
}

// --------------------------------
// UPDATE RETURNED QUANTITY
// --------------------------------

const newReturnedQty =
  Number(grnItem.returned_quantity || 0) +
  Number(quantity);

const {
  error: updateGrnItemError,
} = await supabase
  .from('pharmacy_grn_items')
  .update({
    returned_quantity: newReturnedQty,
  })
  .eq('id', grn_item_id);

if (updateGrnItemError) {
  throw updateGrnItemError;
}

// --------------------------------
// GET INVENTORY
// --------------------------------

const {
  data: inventory,
  error: inventoryError,
} = await supabase
  .from('pharmacy_inventory')
  .select('*')
  .eq('product_id', product_id)
  .eq('batch_number', batch_number)
  .single();

if (inventoryError || !inventory) {
  throw inventoryError || new Error('Inventory not found');
}

// --------------------------------
// UPDATE STOCK
// --------------------------------

const newStock =
  Number(inventory.stock_quantity || 0) -
  Number(quantity);

if (newStock < 0) {
  throw new Error(
    `Insufficient stock. Current stock is ${inventory.stock_quantity}`
  );
}

const {
  error: inventoryUpdateError,
} = await supabase
  .from('pharmacy_inventory')
  .update({
    stock_quantity: newStock,
  })
  .eq('id', inventory.id);

if (inventoryUpdateError) {
  throw inventoryUpdateError;
}

// --------------------------------
// STOCK MOVEMENT
// --------------------------------

const {
  error: stockMovementError,
} = await supabase
  .from('pharmacy_stock_movements')
  .insert({
    inventory_id: inventory.id,

    product_id,

    organization_id:
      inventory.organization_id,

    branch_id:
      inventory.branch_id,

    movement_type: 'supplier_return',

    quantity: Number(quantity),

    reference_id:
      supplier_return_id,

    reference_type:
      'SUPPLIER_RETURN',

    notes:
      `Supplier Return - Batch ${batch_number}`,
  });

if (stockMovementError) {
  throw stockMovementError;
}

// --------------------------------
// RECALCULATE GRN STATUS
// --------------------------------

const {
  data: grnItems,
  error: grnItemsError,
} = await supabase
  .from('pharmacy_grn_items')
  .select(
    'received_quantity, returned_quantity'
  )
  .eq('grn_id', grnItem.grn_id);

if (grnItemsError) {
  throw grnItemsError;
}

const totalReceived =
  grnItems.reduce(
    (sum: any, item: any) =>
      sum +
      Number(item.received_quantity || 0),
    0
  );

const totalReturned =
  grnItems.reduce(
    (sum: any, item: any) =>
      sum +
      Number(item.returned_quantity || 0),
    0
  );

let returnStatus = 'Not Returned';

if (
  totalReturned > 0 &&
  totalReturned < totalReceived
) {
  returnStatus = 'Partially Returned';
}

if (
  totalReturned >= totalReceived
) {
  returnStatus = 'Fully Returned';
}

const {
  error: grnUpdateError,
} = await supabase
  .from('pharmacy_grns')
  .update({
    return_status: returnStatus,
    status: returnStatus,
  })
  .eq('id', grnItem.grn_id);

if (grnUpdateError) {
  throw grnUpdateError;
}

return NextResponse.json(returnItem);

} catch (error: any) {
console.error(error);

return NextResponse.json(
  {
    error:
      error.message ||
      'Failed to create supplier return item',
  },
  { status: 500 }
);
}
}