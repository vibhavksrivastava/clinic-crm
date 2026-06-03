import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

// ==============================
// GET - LIST SALES RETURNS
// ==============================

export async function GET(
  request: NextRequest
) {
  try {
    const userContext =
      await getSessionFromRequest(
        request
      );

    if (!userContext) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const status =
      searchParams.get(
        'status'
      );

    let query =
      supabase
        .from(
          'pharmacy_sales_returns'
        )
        .select(`
          *,
          sale:pharmacy_sales(
            invoice_number
          )
        `)
        .eq(
          'organization_id',
          userContext.organizationId
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        );

    if (
      userContext.branchId
    ) {
      query =
        query.eq(
          'branch_id',
          userContext.branchId
        );
    }

    if (status) {
      query =
        query.eq(
          'status',
          status
        );
    }

    const {
      data,
      error,
    } = await query;

    if (error)
      throw error;

    return NextResponse.json(
      data || []
    );
  } catch (error) {
    console.error(
      'Sales Returns GET:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to fetch sales returns',
      },
      {
        status: 500,
      }
    );
  }
}

// ==============================
// POST - CREATE SALES RETURN
// ==============================

export async function POST(
  request: NextRequest
) {
  try {
    const userContext =
      await getSessionFromRequest(
        request
      );

    if (!userContext) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const {
      sale_id,
      customer_id,
      refund_mode,
      reason,
      notes,
      items,
    } = body;

    if (
      !sale_id ||
      !items ||
      !items.length
    ) {
      return NextResponse.json(
        {
          error:
            'Sale and items required',
        },
        {
          status: 400,
        }
      );
    }

    // ======================
    // RETURN NUMBER
    // ======================

    const returnNumber =
      `SR-${Date.now()}`;

    // ======================
    // CALCULATE TOTALS
    // ======================

    let subtotal = 0;
    let gstAmount = 0;

    for (const item of items) {
      const qty =
        Number(
          item.quantity || 0
        );

      const price =
        Number(
          item.selling_price ||
            0
        );

      const gstPercent =
        Number(
          item.gst_percent ||
            0
        );

      const lineTotal =
        qty * price;

      const lineGST =
        lineTotal *
        (
          gstPercent / 100
        );

      subtotal +=
        lineTotal;

      gstAmount +=
        lineGST;
    }

    const refundAmount =
      subtotal +
      gstAmount;

    // ======================
    // INSERT HEADER
    // ======================

    const {
      data: header,
      error: headerError,
    } = await supabase
      .from(
        'pharmacy_sales_returns'
      )
      .insert({
        organization_id:
          userContext.organizationId,

        branch_id:
          userContext.branchId,

        sale_id,

        customer_id,

        return_number:
          returnNumber,

        refund_amount:
          refundAmount,

        refund_mode,

        reason,

        notes,

        status: 'Draft',

        created_by:
          userContext.userId,
      })
      .select()
      .single();

    if (headerError)
      throw headerError;

    // ======================
    // INSERT ITEMS
    // ======================

    const returnItems =
      items.map(
        (item: any) => {
          const qty =
            Number(
              item.quantity
            );

          const price =
            Number(
              item.selling_price ||
                0
            );

          const gstPercent =
            Number(
              item.gst_percent ||
                0
            );

          const lineTotal =
            qty * price;

          const gstAmount =
            lineTotal *
            (
              gstPercent /
              100
            );

          return {
            sales_return_id:
              header.id,

            sale_item_id:
              item.sale_item_id,

            product_id:
              item.product_id,

            quantity:
              qty,

            selling_price:
              price,

            gst_percent:
              gstPercent,

            gst_amount:
              gstAmount,

            total_amount:
              lineTotal +
              gstAmount,
          };
        }
      );

    const {
      error: itemError,
    } = await supabase
      .from(
        'pharmacy_sales_return_items'
      )
      .insert(
        returnItems
      );

    if (itemError)
      throw itemError;

    return NextResponse.json(
      {
        message:
          'Sales return created',

        return_id:
          header.id,

        return_number:
          returnNumber,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      'Sales Return POST:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to create sales return',
      },
      {
        status: 500,
      }
    );
  }
}