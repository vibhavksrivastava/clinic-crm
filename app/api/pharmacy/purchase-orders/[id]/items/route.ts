import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const userContext =
      await getSessionFromRequest(
        request
      );

    if (!userContext) {
      return NextResponse.json(
        {
          error:
            'Unauthorized',
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await params;

    const {
      data,
      error,
    } = await supabase
      .from(
        'pharmacy_purchase_items'
      )
      .select(`
        id,
        purchase_order_id,
        product_id,
        batch_number,
        expiry_date,
        quantity,
        purchase_price,
        gst_percent,
        pharmacy_products (
          id,
          name,
          category
        )
      `)
      .eq(
        'purchase_order_id',
        id
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      );

    if (error)
      throw error;

    return NextResponse.json(
      data || []
    );
  } catch (
    error: any
  ) {
    console.error(
      'PO ITEMS ERROR:',
      error
    );

    return NextResponse.json(
      {
        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}