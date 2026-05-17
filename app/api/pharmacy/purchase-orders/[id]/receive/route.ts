import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    console.log('🔥 API HIT - PO ID:', id);

    const body = await request.json();
    console.log('📦 BODY:', JSON.stringify(body, null, 2));

    const { invoice_number, items } = body;

    // =========================
    // STEP 1: CHECK ITEMS
    // =========================
    if (!items?.length) {
      return NextResponse.json({
        success: false,
        error: 'No items received',
      });
    }

    // =========================
    // STEP 2: UPDATE ITEMS
    // =========================
    for (const item of items) {
      console.log('🟡 Updating item:', item.id);

      const { error } = await supabase
        .from('pharmacy_purchase_items')
        .update({
          received_quantity: item.received_quantity,
          item_status: item.item_status,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          mrp: item.mrp,
        })
        .eq('id', item.id);

      if (error) {
        console.error('❌ ITEM ERROR:', error);
        return NextResponse.json({ success: false, error });
      }
    }

    // =========================
    // STEP 3: UPDATE PO
    // =========================
    const { data, error: poError } = await supabase
      .from('pharmacy_purchase_orders')
      .update({
        status: 'Received',
        invoice_number,
        received_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (poError) {
      console.error('❌ PO ERROR:', poError);
      return NextResponse.json({ success: false, error: poError });
    }

    console.log('🟢 SUCCESS:', data);

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error('🔥 CATCH ERROR:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}