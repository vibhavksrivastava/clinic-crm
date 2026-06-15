
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface GRNItem {
  id: string;
  product_id: string;
  batch_number: string;
  expiry_date: string;
  received_quantity: number;
  purchase_price: number;
  gst_percent: number;
  product?: {
    id: string;
    name: string;
  };
}

interface GRN {
  id: string;
  grn_number: string;
  purchase_order_id: string;
  supplier_id: string;
  supplier?: {
    id: string;
    supplier_name: string;
  };
  purchase_orders?: {
    id: string;
    po_number: string;
  supplier?: {
    id: string;
    supplier_name: string;
  };
};
  items: GRNItem[];
}

export default function NewSupplierReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const grnId = searchParams.get('grn_id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [grn, setGrn] = useState<GRN | null>(null);

  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (grnId) {
      loadGRN();
    }
  }, [grnId]);

  const loadGRN = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/pharmacy/grn/${grnId}`
      );

      const data = await res.json();

      setGrn(data);

      setItems(
        (data.items || []).map((item: GRNItem) => ({
          ...item,
          return_quantity: 0,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateQty = (
    index: number,
    value: number
  ) => {
    const updated = [...items];

    const maxQty =
      updated[index].received_quantity;

    updated[index].return_quantity =
      value > maxQty ? maxQty : value;

    setItems(updated);
  };

  const saveReturn = async () => {
    try {
      const returnItems = items.filter(
        (i) => Number(i.return_quantity) > 0
      );

      if (returnItems.length === 0) {
        alert(
          'Please enter return quantity'
        );
        return;
      }

      setSaving(true);

      let subtotal = 0;
      let gstAmount = 0;

      returnItems.forEach((item) => {
        const amount =
          Number(item.return_quantity) *
          Number(item.purchase_price);

        subtotal += amount;

        gstAmount +=
          amount *
          (Number(item.gst_percent || 0) /
            100);
      });

      const totalAmount =
        subtotal + gstAmount;

      // create return header

      const headerRes = await fetch(
        '/api/pharmacy/supplier-returns',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            grn_id: grn?.id,
            purchase_order_id:
              grn?.purchase_order_id,
            supplier_id:
              grn?.purchase_orders?.supplier?.id,
            reason,
            notes,

            subtotal,
            gst_amount: gstAmount,
            total_amount: totalAmount,

            status: 'Completed',
          }),
        }
      );

      const header =
        await headerRes.json();

      if (!headerRes.ok) {
        throw new Error(
          header.error ||
            'Failed to create return'
        );
      }

      // create items

      const itemResults = await Promise.all(
  returnItems.map(async (item) => {
    const response = await fetch(
      '/api/pharmacy/supplier-return-items',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplier_return_id: header.id,
          grn_item_id: item.id,
          product_id: item.product_id,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          quantity: item.return_quantity,
          purchase_price: item.purchase_price,
          gst_percent: item.gst_percent,
          gst_amount:
            Number(item.return_quantity) *
            Number(item.purchase_price) *
            (Number(item.gst_percent || 0) / 100),
          total_amount:
            Number(item.return_quantity) *
            Number(item.purchase_price),
        }),
      }
    );

    const result = await response.json();

    console.log('ITEM INSERT', item.id, result);

    if (!response.ok) {
      throw new Error(
        `Item ${item.id}: ${result.error}`
      );
    }

    return result;
  })
);

console.log(itemResults);

      alert(
        'Supplier return created successfully'
      );

      router.push(
        `/pharmacy/supplier-returns/${header.id}`
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error.message ||
          'Failed to create return'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Create Supplier Return
          </h1>

          <p className="text-gray-500">
            GRN:
            {' '}
            {grn?.grn_number}
          </p>
        </div>

        <Link
          href="/pharmacy/supplier-returns"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
      </div>

      {/* Header */}

      <div className="rounded-xl border bg-white p-4">
        <div>
          <strong>Supplier:</strong>{' '}
          {grn?.supplier?.supplier_name}
        </div>

        <div>
          <strong>GRN:</strong>{' '}
          {grn?.grn_number}
        </div>
      </div>

      {/* Reason */}

      <div className="rounded-xl border bg-white p-4 space-y-4">
        <input
          value={reason}
          onChange={(e) =>
            setReason(e.target.value)
          }
          placeholder="Return Reason"
          className="w-full rounded border p-2"
        />

        <textarea
          value={notes}
          onChange={(e) =>
            setNotes(e.target.value)
          }
          placeholder="Notes"
          className="w-full rounded border p-2"
        />
      </div>

      {/* Items */}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">
                Product
              </th>

              <th className="p-3 text-left">
                Batch
              </th>

              <th className="p-3 text-left">
                Expiry
              </th>

              <th className="p-3 text-right">
                Received
              </th>

              <th className="p-3 text-right">
                Return Qty
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map(
              (item, index) => (
                <tr
                  key={item.id}
                  className="border-t"
                >
                  <td className="p-3">
                    {
                      item.product
                        ?.name
                    }
                  </td>

                  <td className="p-3">
                    {
                      item.batch_number
                    }
                  </td>

                  <td className="p-3">
                    {
                      item.expiry_date
                    }
                  </td>

                  <td className="p-3 text-right">
                    {
                      item.received_quantity
                    }
                  </td>

                  <td className="p-3 text-right">
                    <input
                      type="number"
                      min={0}
                      max={
                        item.received_quantity
                      }
                      value={
                        item.return_quantity
                      }
                      onChange={(e) =>
                        updateQty(
                          index,
                          Number(
                            e.target.value
                          )
                        )
                      }
                      className="w-24 rounded border p-2 text-right"
                    />
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={saveReturn}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white"
        >
          <Save size={16} />

          {saving
            ? 'Saving...'
            : 'Create Return'}
        </button>
      </div>
    </div>
  );
}