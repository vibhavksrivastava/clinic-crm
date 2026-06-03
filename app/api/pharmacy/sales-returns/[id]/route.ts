import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

// ==============================
// GET SALES RETURN
// ==============================
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: header, error: headerError } = await supabase
      .from('pharmacy_sales_returns')
      .select(`
        *,
        sale:pharmacy_sales(invoice_number, total_amount)
      `)
      .eq('id', id)
      .eq('organization_id', userContext.organizationId)
      .single();

    if (headerError) throw headerError;

    if (userContext.branchId && header.branch_id !== userContext.branchId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: items, error: itemError } = await supabase
      .from('pharmacy_sales_return_items')
      .select(`
        *,
        product:pharmacy_products(name, sku)
      `)
      .eq('sales_return_id', id);

    if (itemError) throw itemError;

    return NextResponse.json({
      ...header,
      items: items || []
    });
  } catch (error) {
    console.error('GET sales return error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales return' },
      { status: 500 }
    );
  }
}

// ==============================
// PUT UPDATE SALES RETURN
// ==============================
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { refund_mode, reason, notes, items } = body;

    const { data: existing, error: fetchError } = await supabase
      .from('pharmacy_sales_returns')
      .select('id,status,branch_id')
      .eq('id', id)
      .eq('organization_id', userContext.organizationId)
      .single();

    if (fetchError) throw fetchError;

    if (userContext.branchId && existing.branch_id !== userContext.branchId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (existing.status !== 'Draft') {
      return NextResponse.json(
        { error: 'Only draft returns can be updated' },
        { status: 400 }
      );
    }

    let subtotal = 0;
    let gstTotal = 0;

    for (const item of items) {
      const qty = Number(item.quantity);
      const price = Number(item.selling_price || 0);
      const gstPercent = Number(item.gst_percent || 0);

      const line = qty * price;
      subtotal += line;
      gstTotal += line * (gstPercent / 100);
    }

    const refundAmount = subtotal + gstTotal;

    await supabase
      .from('pharmacy_sales_returns')
      .update({
        refund_mode,
        reason,
        notes,
        refund_amount: refundAmount
      })
      .eq('id', id);

    await supabase
      .from('pharmacy_sales_return_items')
      .delete()
      .eq('sales_return_id', id);

    const mappedItems = items.map((item: any) => {
      const qty = Number(item.quantity);
      const price = Number(item.selling_price || 0);
      const gstPercent = Number(item.gst_percent || 0);

      const line = qty * price;
      const gst = line * (gstPercent / 100);

      return {
        sales_return_id: id,
        sale_item_id: item.sale_item_id,
        product_id: item.product_id,
        quantity: qty,
        selling_price: price,
        gst_percent: gstPercent,
        gst_amount: gst,
        total_amount: line + gst
      };
    });

    await supabase
      .from('pharmacy_sales_return_items')
      .insert(mappedItems);

    return NextResponse.json({ message: 'Updated successfully' });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update sales return' },
      { status: 500 }
    );
  }
}

// ==============================
// DELETE SALES RETURN
// ==============================
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existing, error } = await supabase
      .from('pharmacy_sales_returns')
      .select('status,branch_id')
      .eq('id', id)
      .eq('organization_id', userContext.organizationId)
      .single();

    if (error) throw error;

    if (userContext.branchId && existing.branch_id !== userContext.branchId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (existing.status !== 'Draft') {
      return NextResponse.json(
        { error: 'Only draft returns can be deleted' },
        { status: 400 }
      );
    }

    await supabase
      .from('pharmacy_sales_returns')
      .delete()
      .eq('id', id);

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete sales return' },
      { status: 500 }
    );
  }
}