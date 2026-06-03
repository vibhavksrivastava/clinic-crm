import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

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
        {
          error:
            'Unauthorized',
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const {
      sales_return_id,
    } = body;

    if (
      !sales_return_id
    ) {
      return NextResponse.json(
        {
          error:
            'sales_return_id required',
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // FETCH RETURN HEADER
    // =========================

    const {
      data: header,
      error: headerError,
    } = await supabase
      .from(
        'pharmacy_sales_returns'
      )
      .select('*')
      .eq(
        'id',
        sales_return_id
      )
      .eq(
        'organization_id',
        userContext.organizationId
      )
      .single();

    if (
      headerError
    )
      throw headerError;

    if (
      !header
    ) {
      return NextResponse.json(
        {
          error:
            'Return not found',
        },
        {
          status: 404,
        }
      );
    }

    // Branch isolation
    if (
      userContext.branchId &&
      header.branch_id !==
        userContext.branchId
    ) {
      return NextResponse.json(
        {
          error:
            'Forbidden',
        },
        {
          status: 403,
        }
      );
    }

    // Prevent re-approval
    if (
      header.status ===
      'Approved'
    ) {
      return NextResponse.json(
        {
          error:
            'Already approved',
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // FETCH RETURN ITEMS
    // =========================

    const {
      data: items,
      error: itemError,
    } = await supabase
      .from(
        'pharmacy_sales_return_items'
      )
      .select('*')
      .eq(
        'sales_return_id',
        sales_return_id
      );

    if (
      itemError
    )
      throw itemError;

    if (
      !items ||
      !items.length
    ) {
      return NextResponse.json(
        {
          error:
            'No return items found',
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // PROCESS ITEMS
    // =========================

    for (const item of items) {
      // ---------------------
      // FETCH SALE ITEM
      // ---------------------

      const {
        data: saleItem,
        error:
          saleItemError,
      } = await supabase
        .from(
          'pharmacy_sale_items'
        )
        .select(`
          *,
          inventory:pharmacy_inventory(
            id,
            stock_quantity
          )
        `)
        .eq(
          'id',
          item.sale_item_id
        )
        .single();

      if (
        saleItemError
      )
        throw saleItemError;

      if (
        !saleItem
      ) {
        throw new Error(
          'Sale item not found'
        );
      }

      // ---------------------
      // VALIDATE RETURN QTY
      // ---------------------

      const soldQty =
        Number(
          saleItem.quantity ||
            0
        );

      const returnQty =
        Number(
          item.quantity ||
            0
        );

      if (
        returnQty >
        soldQty
      ) {
        return NextResponse.json(
          {
            error:
              `Return qty exceeds sold qty for product ${item.product_id}`,
          },
          {
            status: 400,
          }
        );
      }

      // ---------------------
      // CHECK PREVIOUS RETURNS
      // ---------------------

      const {
        data:
          previousReturns,
      } = await supabase
        .from(
          'pharmacy_sales_return_items'
        )
        .select(`
          quantity,
          return:pharmacy_sales_returns!inner(
            status
          )
        `)
        .eq(
          'sale_item_id',
          item.sale_item_id
        )
        .neq(
          'sales_return_id',
          sales_return_id
        );

      let alreadyReturned =
        0;

      previousReturns?.forEach(
        (r: any) => {
          if (
            r.return
              ?.status ===
            'Approved'
          ) {
            alreadyReturned +=
              Number(
                r.quantity
              );
          }
        }
      );

      if (
        alreadyReturned +
          returnQty >
        soldQty
      ) {
        return NextResponse.json(
          {
            error:
              `Return exceeds remaining qty for product ${item.product_id}`,
          },
          {
            status: 400,
          }
        );
      }

      // ---------------------
      // RESTORE INVENTORY
      // ---------------------

      if (
        !saleItem.inventory_id
      ) {
        throw new Error(
          'Inventory record missing'
        );
      }

      const currentStock =
        Number(
          saleItem
            .inventory
            ?.stock_quantity ||
            0
        );

      const newStock =
        currentStock +
        returnQty;

      const {
        error:
          inventoryError,
      } = await supabase
        .from(
          'pharmacy_inventory'
        )
        .update({
          stock_quantity:
            newStock,

          quantity:
            newStock,

          updated_at:
            new Date(),
        })
        .eq(
          'id',
          saleItem.inventory_id
        );

      if (
        inventoryError
      )
        throw inventoryError;
    }

    // =========================
    // APPROVE HEADER
    // =========================

    const {
      error:
        approveError,
    } = await supabase
      .from(
        'pharmacy_sales_returns'
      )
      .update({
        status:
          'Approved',
      })
      .eq(
        'id',
        sales_return_id
      );

    if (
      approveError
    )
      throw approveError;

    return NextResponse.json(
      {
        message:
          'Sales return approved successfully',
      }
    );
  } catch (error) {
    console.error(
      'Approve Return:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to approve sales return',
      },
      {
        status: 500,
      }
    );
  }
}