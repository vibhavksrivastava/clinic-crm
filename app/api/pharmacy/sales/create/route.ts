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
  customer,
  customerInfo,
  sale_type = 'retail',
  doctor_name,

  payment_method,
  notes,
  items,
  subtotal,
  gst_amount,
  total_amount,
  discount_amount,
} = body;

const customer_name = customer?.name || null;
const customer_phone = customer?.phone || null;
const customer_email = customer?.email || null;
const customer_address = customer?.address || null;
const gst_number = customerInfo?.gst_number;
const drug_license_number =
  customerInfo?.drug_license_number;

if (!items || items.length === 0) {
      return NextResponse.json(
        {
          error: 'Items required',
        },
        { status: 400 }
      );
    }

console.log('CUSTOMER DATA', {
  customer_id,
  customer_name,
  customer_phone,
  customer_email,
  customer_address,
});
    let finalCustomerId = customer_id;

if (!finalCustomerId && customer_name) {
  const { data: existingCustomer } = await supabase
    .from('pharmacy_customers')
    .select('id')
    .eq('phone', customer_phone)
    .eq('organization_id', userContext.organizationId)
    .maybeSingle();

  if (existingCustomer) {
    finalCustomerId = existingCustomer.id;
  } else {
    const { data: newCustomer, error } = await supabase
      .from('pharmacy_customers')
      .insert({
        name: customer_name,
        phone: customer_phone,
        email: customer_email,
        address: customer_address,
        gst_number,
        drug_license_number,

        customer_type:
        sale_type === 'wholesale'
          ? 'wholesale'
          : 'retail',

        organization_id: userContext.organizationId,
        branch_id: userContext.branchId,
      })
      .select()
      .single();

    if (error) throw error;

    finalCustomerId = newCustomer.id;
  }
}
    const invoiceNumber =
  `INV-${new Date().getFullYear()}-${Date.now()}`;
    console.log('SALE BODY:', body);

            const paidAmount =
    Number(body.paid_amount || 0);

  let paymentStatus = 'unpaid';

if (paidAmount === 0) {
  paymentStatus = 'unpaid';
}
else if (
  paidAmount >= total_amount
) {
  paymentStatus = 'paid';
}
else {
  paymentStatus = 'partial';
}

let dueDate = null;

if (
  body.credit_days &&
  Number(body.credit_days) > 0
) {
  const dt = new Date();

  dt.setDate(
    dt.getDate() +
    Number(body.credit_days)
  );

  dueDate = dt;
}

  const balanceAmount =
    Number(total_amount) - paidAmount;

    const { data: sale, error: saleError } = await supabase
      .from('pharmacy_sales')
      .insert({
  customer_id: finalCustomerId,
  
  customer_name,
  customer_phone,
  customer_email,
  customer_address,
  doctor_name,

  payment_method,
  notes,

  subtotal,
  gst_amount,
  total_amount,
  discount_amount,

  invoice_number: invoiceNumber,
  //payment_status: 'paid',
  sale_type: body.sale_type || 'retail',

payment_status: paymentStatus,

paid_amount: paidAmount,

balance_amount: balanceAmount,

credit_days:
  body.credit_days || 0,

due_date: dueDate,  
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

      if (total_amount > 0) {
        await supabase
.from('customer_ledger')
.insert({
  customer_id: finalCustomerId,

  txn_type: 'sale',

  reference_type: 'sale',

  reference_id: sale.id,

  debit_amount: total_amount,

  credit_amount: 0,

  organization_id:
    userContext.organizationId,

  branch_id:
    userContext.branchId
});

if (paidAmount > 0)
  credit_amount: paidAmount

      const { data: inventory } = await supabase
        .from('pharmacy_inventory')
        .select('*')
        .eq('id', item.inventory_id)
        .single();
        if (!inventory) {
  throw new Error(
    `Inventory not found for ${item.product_id}`
  );
}

      const newQty =
        Number(inventory.stock_quantity || 0) -
        Number(item.quantity || 0);
        if (newQty < 0) {
  throw new Error(
    `${inventory.batch_number} has insufficient stock`
  );
}

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
          quantity_in: 0,
          quantity_out: item.quantity,
          balance_quantity: newQty,
          batch_number: inventory.batch_number,
          expiry_date: inventory.expiry_date,
          reference_type: 'sale',
          reference_id: sale.id,
          notes: `Sale Invoice ${invoiceNumber}`,
          created_by: userContext.userId,
        });

      if (movementError) throw movementError;
    }

return NextResponse.json({success: true, sale, });  
}} catch (error: any) {
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
};