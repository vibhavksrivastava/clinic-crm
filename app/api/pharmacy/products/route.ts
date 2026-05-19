import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

// ================= GET PRODUCTS =================
export async function GET(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);

    if (!userContext) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');

    let query = supabase
      .from('pharmacy_products')
      .select('*')
      .eq('organization_id', userContext.organizationId)
      .order('created_at', {
        ascending: false,
      });

    if (userContext.branchId) {
      query = query.eq(
        'branch_id',
        userContext.branchId
      );
    }

    if (id) {
      query = query.eq('id', id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: 'Failed to fetch products',
      },
      {
        status: 500,
      }
    );
  }
}

// ================= CREATE PRODUCT =================
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
      name,
      description,
      sku,
      barcode,
      category,
      gst,
      hsn_code,
      unit_price,
      cost_price,
      reorder_level,
      // supplier_id,
      is_active,
    } = body;

    if (!name || !unit_price) {
      return NextResponse.json(
        {
          error:
            'Name and unit price are required',
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabase
      .from('pharmacy_products')
      .insert({
        organization_id:
          userContext.organizationId,

        branch_id: userContext.branchId,

        name,

        description,

        sku,

        barcode,

        category,

        gst,

        hsn_code,

        unit_price,

        cost_price,

        reorder_level:
          reorder_level || 10,

        // supplier_id:
        //   supplier_id || null,

        is_active:
          is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: 'Failed to create product',
      },
      {
        status: 500,
      }
    );
  }
}

// ================= UPDATE PRODUCT =================
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

    const {
      id,
      name,
      description,
      sku,
      barcode,
      category,
      gst,
      hsn_code,
      unit_price,
      cost_price,
      reorder_level,
      // supplier_id,
      is_active,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          error: 'Product ID is required',
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabase
      .from('pharmacy_products')
      .update({
        name,

        description,

        sku,

        barcode,

        category,

        gst,

        hsn_code,

        unit_price,

        cost_price,

        reorder_level:
          reorder_level || 10,

        // supplier_id,
        //   supplier_id || null,
        is_active,

        updated_at: new Date(),
      })
      .eq('id', id)
      .eq(
        'organization_id',
        userContext.organizationId
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: 'Failed to update product',
      },
      {
        status: 500,
      }
    );
  }
}

// ================= DELETE PRODUCT =================
export async function DELETE(
  request: NextRequest
) {
  try {
    const userContext = await getSessionFromRequest(request);

    if (!userContext) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          error: 'Product ID is required',
        },
        {
          status: 400,
        }
      );
    }

    const { error } = await supabase
      .from('pharmacy_products')
      .delete()
      .eq('id', id)
      .eq(
        'organization_id',
        userContext.organizationId
      );

    if (error) throw error;

    return NextResponse.json({
      message:
        'Product deleted successfully',
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: 'Failed to delete product',
      },
      {
        status: 500,
      }
    );
  }
}