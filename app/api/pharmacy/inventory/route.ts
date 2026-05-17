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
      .from('pharmacy_inventory')
      .select(`
        *,
        pharmacy_products (
          name,
          sku,
          category
        )
      `)
      .eq('organization_id', userContext.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET INVENTORY ERROR:', error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('GET INVENTORY EXCEPTION:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory' },
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
      batch_number,
      expiry_date,
      purchase_price,
      selling_price,
      quantity,
      minimum_stock,
    } = body;

    // ✅ VALIDATION
    if (!product_id || !batch_number) {
      return NextResponse.json(
        { error: 'product_id and batch_number are required' },
        { status: 400 }
      );
    }

    const qty = Number(quantity || 0);

    // Optional: prevent duplicate batch
    const { data: existing } = await supabase
      .from('pharmacy_inventory')
      .select('*')
      .eq('product_id', product_id)
      .eq('batch_number', batch_number)
      .eq('organization_id', userContext.organizationId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error:
            'Inventory batch already exists. Use PUT to update.',
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('pharmacy_inventory')
      .insert({
        product_id,
        organization_id: userContext.organizationId,
        branch_id: userContext.branchId || null,
        batch_number,
        expiry_date: expiry_date || null,
        purchase_price: purchase_price || 0,
        selling_price: selling_price || 0,
        quantity: qty,
        minimum_stock: minimum_stock || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('POST INVENTORY ERROR:', error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('POST INVENTORY EXCEPTION:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to create inventory' },
      { status: 500 }
    );
  }
}