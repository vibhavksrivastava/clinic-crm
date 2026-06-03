import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

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

    const from =
      searchParams.get('from');

    const to =
      searchParams.get('to');

    // ==========================
    // PURCHASE QUERY
    // purchase_items -> purchase_orders
    // ==========================

    let purchaseQuery =
      supabase
        .from(
          'pharmacy_purchase_items'
        )
        .select(`
          product_id,
          quantity,
          purchase_price,
          gst_percent,
          purchase_order:pharmacy_purchase_orders!inner(
            organization_id,
            branch_id,
            purchase_date
          )
        `)
        .eq(
          'purchase_order.organization_id',
          userContext.organizationId
        );

    if (userContext.branchId) {
      purchaseQuery =
        purchaseQuery.eq(
          'purchase_order.branch_id',
          userContext.branchId
        );
    }

    if (from) {
      purchaseQuery =
        purchaseQuery.gte(
          'purchase_order.purchase_date',
          from
        );
    }

    if (to) {
      purchaseQuery =
        purchaseQuery.lte(
          'purchase_order.purchase_date',
          to
        );
    }

    const {
      data: purchaseItems,
      error: purchaseError,
    } = await purchaseQuery;

    if (purchaseError)
      throw purchaseError;

    // ==========================
    // SALES QUERY
    // sale_items -> pharmacy_sales
    // ==========================

    let salesQuery =
      supabase
        .from(
          'pharmacy_sale_items'
        )
        .select(`
          product_id,
          quantity,
          total_amount,
          gst_percent,
          sale:pharmacy_sales!inner(
            organization_id,
            branch_id,
            created_at
          )
        `)
        .eq(
          'sale.organization_id',
          userContext.organizationId
        );

    if (userContext.branchId) {
      salesQuery =
        salesQuery.eq(
          'sale.branch_id',
          userContext.branchId
        );
    }

    if (from) {
      salesQuery =
        salesQuery.gte(
          'sale.created_at',
          from
        );
    }

    if (to) {
      salesQuery =
        salesQuery.lte(
          'sale.created_at',
          to
        );
    }

    const {
      data: saleItems,
      error: salesError,
    } = await salesQuery;

    if (salesError)
      throw salesError;

    // ==========================
    // PRODUCTS
    // ==========================

    let productQuery =
      supabase
        .from(
          'pharmacy_products'
        )
        .select(`
          id,
          name,
          hsn_code,
          gst
        `)
        .eq(
          'organization_id',
          userContext.organizationId
        );

    if (userContext.branchId) {
      productQuery =
        productQuery.eq(
          'branch_id',
          userContext.branchId
        );
    }

    const {
      data: products,
      error: productError,
    } = await productQuery;

    if (productError)
      throw productError;

    // ==========================
    // PRODUCT MAP
    // ==========================

    const productMap =
      new Map();

      products?.forEach(
  (p: {
    id: string;
    name?: string;
    gst_percent?: number;
    category?: string;
  }) => {
    productMap.set(p.id, p);
  }
);
    // ==========================
    // PURCHASE DATA
    // ==========================

    const purchaseMap =
      new Map();

    purchaseItems?.forEach(
      (item: any) => {
        const productId =
          item.product_id;

        const qty =
          Number(
            item.quantity || 0
          );

        const purchasePrice =
          Number(
            item.purchase_price ||
              0
          );

        const gstPercent =
          Number(
            item.gst_percent ||
              0
          );

        const taxable =
          qty *
          purchasePrice;

        const inputGST =
          taxable *
          (
            gstPercent / 100
          );

        if (
          !purchaseMap.has(
            productId
          )
        ) {
          purchaseMap.set(
            productId,
            {
              purchase_qty: 0,
              taxable_amount: 0,
              input_gst: 0,
            }
          );
        }

        const row =
          purchaseMap.get(
            productId
          );

        row.purchase_qty +=
          qty;

        row.taxable_amount +=
          taxable;

        row.input_gst +=
          inputGST;
      }
    );

    // ==========================
    // SALES DATA
    // ==========================

    const salesMap =
      new Map();

    saleItems?.forEach(
      (item: any) => {
        const productId =
          item.product_id;

        const qty =
          Number(
            item.quantity || 0
          );

        const total =
          Number(
            item.total_amount ||
              0
          );

        const gstPercent =
          Number(
            item.gst_percent ||
              0
          );

        const outputGST =
          total -
          (
            total /
            (
              1 +
              gstPercent /
                100
            )
          );

        if (
          !salesMap.has(
            productId
          )
        ) {
          salesMap.set(
            productId,
            {
              sales_qty: 0,
              total_sales: 0,
              output_gst: 0,
            }
          );
        }

        const row =
          salesMap.get(
            productId
          );

        row.sales_qty +=
          qty;

        row.total_sales +=
          total;

        row.output_gst +=
          outputGST;
      }
    );

    // ==========================
    // PRODUCT COMPARISON
    // ==========================

    let totalInputGST =
      0;

    let totalOutputGST =
      0;

    const allProducts =
      new Set([
        ...purchaseMap.keys(),
        ...salesMap.keys(),
      ]);

    const productComparison =
      Array.from(
        allProducts
      ).map(
        (
          productId: any
        ) => {
          const purchase =
            purchaseMap.get(
              productId
            ) || {
              purchase_qty: 0,
              taxable_amount: 0,
              input_gst: 0,
            };

          const sales =
            salesMap.get(
              productId
            ) || {
              sales_qty: 0,
              total_sales: 0,
              output_gst: 0,
            };

          const product =
            productMap.get(
              productId
            );

          const inputGSTUsed =
            purchase.purchase_qty >
            0
              ? (
                  purchase.input_gst /
                  purchase.purchase_qty
                ) *
                sales.sales_qty
              : 0;

          const netGST =
            sales.output_gst -
            inputGSTUsed;

          totalInputGST +=
            inputGSTUsed;

          totalOutputGST +=
            sales.output_gst;

          return {
            product_id:
              productId,
            product_name:
              product?.name ||
              'Unknown',
            hsn_code:
              product?.hsn_code ||
              '-',
            purchase_qty:
              purchase.purchase_qty,
            sales_qty:
              sales.sales_qty,
            taxable_amount:
              Number(
                purchase.taxable_amount.toFixed(
                  2
                )
              ),
            total_input_gst:
              Number(
                purchase.input_gst.toFixed(
                  2
                )
              ),
            input_gst_used:
              Number(
                inputGSTUsed.toFixed(
                  2
                )
              ),
            output_gst:
              Number(
                sales.output_gst.toFixed(
                  2
                )
              ),
            net_gst:
              Number(
                netGST.toFixed(
                  2
                )
              ),
            status:
              netGST >= 0
                ? 'Payable'
                : 'ITC',
          };
        }
      );

    // ==========================
    // GST SLAB
    // ==========================

    const slabMap =
      new Map();

    saleItems?.forEach(
      (item: any) => {
        const rate =
          Number(
            item.gst_percent ||
              0
          );

        const total =
          Number(
            item.total_amount ||
              0
          );

        const gst =
          total -
          (
            total /
            (
              1 +
              rate / 100
            )
          );

        slabMap.set(
          rate,
          (
            slabMap.get(
              rate
            ) || 0
          ) + gst
        );
      }
    );

    // ==========================
    // RESPONSE
    // ==========================

    return NextResponse.json({
      summary: {
        inputGST:
          Number(
            totalInputGST.toFixed(
              2
            )
          ),
        outputGST:
          Number(
            totalOutputGST.toFixed(
              2
            )
          ),
        netGST:
          Number(
            (
              totalOutputGST -
              totalInputGST
            ).toFixed(2)
          ),
        itcAvailable:
          Number(
            Math.max(
              totalInputGST -
                totalOutputGST,
              0
            ).toFixed(2)
          ),
      },

      gstByRate:
        Array.from(
          slabMap.entries()
        ).map(
          ([
            rate,
            value,
          ]) => ({
            rate,
            gst: Number(
              value.toFixed(
                2
              )
            ),
          })
        ),

      productComparison,
    });
  } catch (error) {
    console.error(
      'GST Dashboard Error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to fetch GST dashboard',
      },
      {
        status: 500,
      }
    );
  }
}