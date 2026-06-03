import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

// ======================================
// TYPES
// ======================================

interface SupplierReturn {
  id: string;
}

interface SupplierReturnItem {
  supplier_return_id: string;
}

interface ReturnItemPayload {
  quantity: number;
  purchase_price: number;
  gst_percent?: number;
  purchase_order_item_id?: string;
  product_id: string;
  batch_number?: string;
  expiry_date?: string;
}

// ======================================
// GET - LIST SUPPLIER RETURNS
// ======================================

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
      searchParams.get('status');

    let query =
      supabase
        .from(
          'pharmacy_supplier_returns'
        )
        .select('*')
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

    if (
      status &&
      status !== 'All'
    ) {
      query =
        query.eq(
          'status',
          status
        );
    }

    // ==========================
    // FETCH RETURNS
    // ==========================

    const {
      data: returns,
      error,
    } = await query;

    if (error)
      throw error;

    if (
      !returns?.length
    ) {
      return NextResponse.json(
        []
      );
    }

    // ==========================
    // FETCH RETURN ITEMS
    // ==========================

    const returnIds =
      (
        returns as SupplierReturn[]
      ).map(
        (
          r: SupplierReturn
        ) => r.id
      );

    const {
      data: items,
      error: itemError,
    } = await supabase
      .from(
        'pharmacy_supplier_return_items'
      )
      .select('*')
      .in(
        'supplier_return_id',
        returnIds
      );

    if (
      itemError
    )
      throw itemError;

    // ==========================
    // GROUP ITEMS
    // ==========================

    const grouped =
      (
        returns as SupplierReturn[]
      ).map(
        (
          ret: SupplierReturn
        ) => ({
          ...ret,
          items:
            (
              items as SupplierReturnItem[]
            )?.filter(
              (
                i: SupplierReturnItem
              ) =>
                i.supplier_return_id ===
                ret.id
            ) || [],
        })
      );

    return NextResponse.json(
      grouped
    );
  } catch (
    error: any
  ) {
    console.error(
      'Supplier Returns GET ERROR:',
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          JSON.stringify(
            error
          ),
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================
// POST - CREATE SUPPLIER RETURN
// ======================================

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

    console.log(
      'SUPPLIER RETURN PAYLOAD:',
      body
    );

    const {
      purchase_order_id,
      reason,
      notes,
      items,
    } = body;

    if (
      !purchase_order_id ||
      !items?.length
    ) {
      return NextResponse.json(
        {
          error:
            'Purchase order and items required',
        },
        {
          status: 400,
        }
      );
    }

    // ==========================
    // FETCH PURCHASE ORDER
    // ==========================

    const {
      data: po,
      error: poError,
    } = await supabase
      .from(
        'pharmacy_purchase_orders'
      )
      .select(`
        id,
        supplier_id
      `)
      .eq(
        'id',
        purchase_order_id
      )
      .single();

    if (
      poError ||
      !po
    ) {
      return NextResponse.json(
        {
          error:
            'Purchase order not found',
        },
        {
          status: 400,
        }
      );
    }

    // ==========================
    // CALCULATE TOTALS
    // ==========================

    let subtotal = 0;
    let gstAmount = 0;

    for (const item of items as ReturnItemPayload[]) {
      const qty =
        Number(
          item.quantity || 0
        );

      const price =
        Number(
          item.purchase_price || 0
        );

      const gstPercent =
        Number(
          item.gst_percent || 0
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

    const totalAmount =
      subtotal +
      gstAmount;

    const returnNumber =
      `PR-${Date.now()}`;

    // ==========================
    // INSERT HEADER
    // ==========================

    const {
      data: header,
      error: headerError,
    } = await supabase
      .from(
        'pharmacy_supplier_returns'
      )
      .insert({
        organization_id:
          userContext.organizationId,

        branch_id:
          userContext.branchId,

        purchase_order_id,

        supplier_id:
          po.supplier_id,

        return_number:
          returnNumber,

        return_date:
          new Date(),

        reason,
        notes,

        subtotal,

        gst_amount:
          gstAmount,

        total_amount:
          totalAmount,

        status:
          'Pending',

        created_by:
          userContext.userId,
      })
      .select()
      .single();

    if (
      headerError
    )
      throw headerError;

    // ==========================
    // PREPARE RETURN ITEMS
    // ==========================

    const returnItems =
      (
        items as ReturnItemPayload[]
      ).map(
        (
          item: ReturnItemPayload
        ) => {
          const qty =
            Number(
              item.quantity
            );

          const price =
            Number(
              item.purchase_price
            );

          const gstPercent =
            Number(
              item.gst_percent || 0
            );

          const gst =
            qty *
            price *
            (
              gstPercent / 100
            );

          return {
            supplier_return_id:
              header.id,

            purchase_item_id:
              item.purchase_order_item_id,

            product_id:
              item.product_id,

            batch_number:
              item.batch_number,

            expiry_date:
              item.expiry_date,

            quantity:
              qty,

            purchase_price:
              price,

            gst_percent:
              gstPercent,

            gst_amount:
              gst,

            total_amount:
              qty *
                price +
              gst,
          };
        }
      );

    // ==========================
    // INSERT RETURN ITEMS
    // ==========================

    const {
      error: itemError,
    } = await supabase
      .from(
        'pharmacy_supplier_return_items'
      )
      .insert(
        returnItems
      );

    if (
      itemError
    )
      throw itemError;

    return NextResponse.json(
      {
        message:
          'Supplier return created successfully',

        return_id:
          header.id,

        return_number:
          returnNumber,
      },
      {
        status: 201,
      }
    );
  } catch (
    error: any
  ) {
    console.error(
      'Supplier Return POST:',
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          'Failed to create supplier return',
      },
      {
        status: 500,
      }
    );
  }
}