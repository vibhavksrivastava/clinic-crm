'use client';

import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

interface Sale {
  id: string;
  invoice_number: string;
}

interface SaleItem {
  id: string;
  product_id: string;
  quantity: number;
  gst_percent: number;
  unit_price: number;
  total_amount: number;
  product?: {
    name: string;
  };
}

export default function NewSalesReturnPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [sales, setSales] =
    useState<Sale[]>([]);

  const [saleId, setSaleId] =
    useState('');

  const [saleItems, setSaleItems] =
    useState<SaleItem[]>(
      []
    );

  const [refundMode, setRefundMode] =
    useState('Cash');

  const [reason, setReason] =
    useState('');

  const [notes, setNotes] =
    useState('');

  const [returnQty, setReturnQty] =
    useState<
      Record<
        string,
        number
      >
    >({});

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales =
    async () => {
      const res =
        await fetch(
          '/api/pharmacy/sales'
        );

      const data =
        await res.json();

      setSales(
        data || []
      );
    };

  const loadSaleItems =
    async (
      id: string
    ) => {
      setSaleId(id);

      const res =
        await fetch(
          `/api/pharmacy/sales?id=${id}`
        );

      const data =
        await res.json();

      setSaleItems(
        data.items || []
      );
    };

  const selectedItems =
    useMemo(() => {
      return saleItems.filter(
        (i) =>
          (
            returnQty[
              i.id
            ] || 0
          ) > 0
      );
    }, [
      saleItems,
      returnQty,
    ]);

  const refundSummary =
    useMemo(() => {
      let total =
        0;

      selectedItems.forEach(
        (
          item
        ) => {
          const qty =
            returnQty[
              item.id
            ] || 0;

          total +=
            qty *
            item.unit_price;
        }
      );

      return total;
    }, [
      selectedItems,
      returnQty,
    ]);

  const saveReturn =
    async () => {
      if (
        !saleId
      ) {
        alert(
          'Select invoice'
        );
        return;
      }

      const items =
        selectedItems.map(
          (
            item
          ) => ({
            sale_item_id:
              item.id,
            product_id:
              item.product_id,
            quantity:
              returnQty[
                item.id
              ],
            selling_price:
              item.unit_price,
            gst_percent:
              item.gst_percent,
          })
        );

      try {
        setLoading(
          true
        );

        const res =
          await fetch(
            '/api/pharmacy/sales-returns',
            {
              method:
                'POST',
              headers:
                {
                  'Content-Type':
                    'application/json',
                },
              body: JSON.stringify(
                {
                  sale_id:
                    saleId,
                  refund_mode:
                    refundMode,
                  reason,
                  notes,
                  items,
                }
              ),
            }
          );

        const data =
          await res.json();

        if (
          !res.ok
        ) {
          alert(
            data.error
          );
          return;
        }

        alert(
          'Sales return created'
        );

        router.push(
          '/pharmacy/sales/returns'
        );
      } catch (
        err
      ) {
        console.error(
          err
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      <Header />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Header */}

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-bold">
              Create Sales Return
            </h1>

            <p className="text-slate-500 mt-1">
              Create customer refund return
            </p>

          </div>

          <button
            onClick={() =>
              router.back()
            }
            className="px-4 py-2 border rounded-xl flex items-center gap-2"
          >
            <ArrowLeft
              size={16}
            />
            Back
          </button>

        </div>

        {/* Return Info */}

        <div className="bg-white dark:bg-slate-900 rounded-2xl border p-6 space-y-4">

          <h2 className="font-semibold text-lg">
            Return Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div>

              <label className="text-sm text-slate-500">
                Invoice
              </label>

              <select
                value={
                  saleId
                }
                onChange={(
                  e
                ) =>
                  loadSaleItems(
                    e.target
                      .value
                  )
                }
                className="w-full border rounded-xl px-3 py-2 mt-1"
              >
                <option value="">
                  Select Invoice
                </option>

                {sales.map(
                  (
                    s
                  ) => (
                    <option
                      key={
                        s.id
                      }
                      value={
                        s.id
                      }
                    >
                      {
                        s.invoice_number
                      }
                    </option>
                  )
                )}

              </select>

            </div>

            <div>

              <label className="text-sm text-slate-500">
                Refund Mode
              </label>

              <select
                value={
                  refundMode
                }
                onChange={(
                  e
                ) =>
                  setRefundMode(
                    e.target
                      .value
                  )
                }
                className="w-full border rounded-xl px-3 py-2 mt-1"
              >
                <option>
                  Cash
                </option>
                <option>
                  UPI
                </option>
                <option>
                  Bank
                </option>
                <option>
                  Credit Note
                </option>
              </select>

            </div>

            <div>

              <label className="text-sm text-slate-500">
                Reason
              </label>

              <input
                value={
                  reason
                }
                onChange={(
                  e
                ) =>
                  setReason(
                    e.target
                      .value
                  )
                }
                className="w-full border rounded-xl px-3 py-2 mt-1"
                placeholder="Reason"
              />

            </div>

          </div>

          <textarea
            value={
              notes
            }
            onChange={(
              e
            ) =>
              setNotes(
                e.target
                  .value
              )
            }
            placeholder="Notes"
            className="w-full border rounded-xl px-3 py-2"
          />

        </div>

        {/* Items */}

        <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden">

          <div className="p-5 border-b">

            <h2 className="font-semibold text-lg">
              Sale Items
            </h2>

          </div>

          <div className="overflow-auto">

            <table className="w-full min-w-[900px]">

              <thead className="bg-slate-100 dark:bg-slate-800">

                <tr>

                  <th className="p-3 text-left">
                    Product
                  </th>

                  <th className="p-3 text-center">
                    Sold Qty
                  </th>

                  <th className="p-3 text-center">
                    Price
                  </th>

                  <th className="p-3 text-center">
                    GST %
                  </th>

                  <th className="p-3 text-center">
                    Return Qty
                  </th>

                </tr>

              </thead>

              <tbody>

                {saleItems.map(
                  (
                    item
                  ) => (
                    <tr
                      key={
                        item.id
                      }
                      className="border-t"
                    >

                      <td className="p-3">
                        {item
                          .product
                          ?.name ||
                          'Medicine'}
                      </td>

                      <td className="p-3 text-center">
                        {
                          item.quantity
                        }
                      </td>

                      <td className="p-3 text-center">
                        ₹
                        {
                          item.unit_price
                        }
                      </td>

                      <td className="p-3 text-center">
                        {
                          item.gst_percent
                        }
                        %
                      </td>

                      <td className="p-3 text-center">

                        <input
                          type="number"
                          min={
                            0
                          }
                          max={
                            item.quantity
                          }
                          value={
                            returnQty[
                              item.id
                            ] ||
                            ''
                          }
                          onChange={(
                            e
                          ) =>
                            setReturnQty(
                              {
                                ...returnQty,
                                [item.id]:
                                  Number(
                                    e
                                      .target
                                      .value
                                  ),
                              }
                            )
                          }
                          className="w-24 border rounded-lg px-2 py-1 text-center"
                        />

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* Summary */}

        <div className="bg-white dark:bg-slate-900 rounded-2xl border p-6 flex justify-between items-center">

          <div>

            <p className="text-slate-500">
              Refund Summary
            </p>

            <h2 className="text-3xl font-bold">
              ₹
              {refundSummary.toLocaleString()}
            </h2>

          </div>

          <button
            onClick={
              saveReturn
            }
            disabled={
              loading
            }
            className="px-5 py-3 bg-blue-600 text-white rounded-xl flex items-center gap-2"
          >
            <Save
              size={18}
            />
            {loading
              ? 'Saving...'
              : 'Create Return'}
          </button>

        </div>

      </div>

    </div>
  );
}