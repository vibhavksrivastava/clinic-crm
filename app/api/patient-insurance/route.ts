import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';

// ================= GET =================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const organizationId =
      searchParams.get('organization_id');

    const branchId =
      searchParams.get('branch_id');

    let query = supabase
      .from('pharmacy_products')
      .select('*')
      .order('created_at', {
        ascending: false,
      });

    if (organizationId) {
      query = query.eq(
        'organization_id',
        organizationId
      );
    }

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch products',
      },
      {
        status: 500,
      }
    );
  }
}

// ================= POST =================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from('pharmacy_products')
      .insert([
        {
          organization_id:
            body.organization_id,

          branch_id: body.branch_id,

          name: body.name,

          description: body.description,

          sku: body.sku,

          barcode: body.barcode,

          category: body.category,

          unit_price: body.unit_price,

          cost_price: body.cost_price,

          reorder_level:
            body.reorder_level,

          is_active: body.is_active,

          supplier_id: body.supplier_id,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create product',
      },
      {
        status: 500,
      }
    );
  }
}

// ================= PUT =================
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from('pharmacy_products')
      .update({
        name: body.name,

        description: body.description,

        sku: body.sku,

        barcode: body.barcode,

        category: body.category,

        unit_price: body.unit_price,

        cost_price: body.cost_price,

        reorder_level:
          body.reorder_level,

        is_active: body.is_active,

        supplier_id: body.supplier_id,

        updated_at: new Date(),
      })
      .eq('id', body.id)
      .select();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update product',
      },
      {
        status: 500,
      }
    );
  }
}

// ================= DELETE =================
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get('id');

    const { error } = await supabase
      .from('pharmacy_products')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete product',
      },
      {
        status: 500,
      }
    );
  }
}