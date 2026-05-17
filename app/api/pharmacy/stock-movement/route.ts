import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);

    if (!userContext) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('pharmacy_stock_movements')
      .select(`
        *,
        pharmacy_products(name)
      `)
      .eq('organization_id', userContext.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET STOCK MOVEMENTS ERROR:', error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('GET STOCK MOVEMENTS EXCEPTION:', error);

    return NextResponse.json(
      {
        error:
          error.message || 'Failed to fetch movements',
      },
      { status: 500 }
    );
  }
}

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
      product_id,
      inventory_id,
      movement_type,
      quantity,
      reference_id,
      remarks,
    } = body;

    // ✅ FIXED VALIDATION (0 should be allowed in some cases)
    if (
      !product_id ||
      !movement_type ||
      quantity === undefined ||
      quantity === null
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const qty = Number(quantity);

    if (isNaN(qty)) {
      return NextResponse.json(
        { error: 'Invalid quantity' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('pharmacy_stock_movements')
      .insert({
        organization_id: userContext.organizationId,
        product_id,
        inventory_id: inventory_id || null,
        movement_type,
        quantity: qty,
        reference_id: reference_id || null,
        remarks: remarks || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('STOCK MOVEMENT INSERT ERROR:', error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('POST STOCK MOVEMENT EXCEPTION:', error);

    return NextResponse.json(
      {
        error:
          error.message || 'Failed to create movement',
      },
      { status: 500 }
    );
  }
}