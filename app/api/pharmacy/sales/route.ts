import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';


export async function GET() {
  try {
    const { data, error } = await supabase
      .from('pharmacy_sales')
      .select(`
        id,
        invoice_number,
        total_amount,
        subtotal,
        payment_method,
        created_at,
        payment_status,
        pharmacy_sale_items (
          id,
          product_id,
          quantity,
          unit_price
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Sales fetch error:', error);

      return NextResponse.json(
        {
          data: [],
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: Array.isArray(data) ? data : [],
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        data: [],
        error: err.message || 'Unexpected server error',
      },
      { status: 500 }
    );
  }
}