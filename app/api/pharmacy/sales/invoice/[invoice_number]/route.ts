import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoice_number: string }> }
) {
  try {
    const { invoice_number } = await params;


    const { data, error } = await supabase
      .from('sales')
      .select(`
        id,
        invoice_number,
        created_at,
        payment_status,
        total_amount,
        sale_items:sales_items (
          id,
          product_id,
          quantity,
          unit_price,
          total_amount,
          product:product_id (
            name
          )
        )
      `)
      .eq('invoice_number', invoice_number)
      .single();

    if (error) {
      console.error(error);

      return NextResponse.json(
        { data: null, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data,
    });
  } catch (err) {
    console.error('Invoice API Error:', err);

    return NextResponse.json(
      { data: null, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}