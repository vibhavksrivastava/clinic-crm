import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

/**
 * GET STOCK LIST
 */
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
      .from('pharmacy_stock')
      .select(`
        *,
        pharmacy_products (
          id,
          name,
          category,
          unit_price
        )
      `)
      .eq('organization_id', userContext.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET STOCK ERROR:', error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('GET STOCK EXCEPTION:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock' },
      { status: 500 }
    );
  }
}

/**
 * CREATE STOCK (manual insert / fallback)
 */
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
      current_stock,
      batch_number,
      expiry_date,
    } = body;

    if (!product_id || current_stock === undefined) {
      return NextResponse.json(
        { error: 'product_id and current_stock are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('pharmacy_stock')
      .insert({
        organization_id: userContext.organizationId,
        product_id,
        current_stock,
        batch_number: batch_number || null,
        expiry_date: expiry_date || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('POST STOCK ERROR:', error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('POST STOCK EXCEPTION:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to create stock' },
      { status: 500 }
    );
  }
}

/**
 * UPDATE STOCK
 */
export async function PUT(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);

    if (!userContext) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { id, current_stock, ...rest } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Stock id is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('pharmacy_stock')
      .update({
        ...rest,
        current_stock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', userContext.organizationId)
      .select()
      .single();

    if (error) {
      console.error('PUT STOCK ERROR:', error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PUT STOCK EXCEPTION:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to update stock' },
      { status: 500 }
    );
  }
}

/**
 * DELETE STOCK
 */
export async function DELETE(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);

    if (!userContext) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Stock id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('pharmacy_stock')
      .delete()
      .eq('id', id)
      .eq('organization_id', userContext.organizationId);

    if (error) {
      console.error('DELETE STOCK ERROR:', error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE STOCK EXCEPTION:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to delete stock' },
      { status: 500 }
    );
  }
}