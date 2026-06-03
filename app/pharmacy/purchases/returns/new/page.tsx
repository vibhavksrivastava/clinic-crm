'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

interface PurchaseOrder {
  id: string;
  po_number: string;
  invoice_number: string;
  supplier_id: string;
  status: string;
}

interface PurchaseItem {
  id: string;
  product_name: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  purchase_price: number;
  gst_percent: number;
}

interface ReturnItem extends PurchaseItem {
  return_qty: number;
}

export default function NewSupplierReturnPage() {
  const router = useRouter();

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState('');
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  async function fetchPurchaseOrders() {
    try {
      const res = await fetch('/api/pharmacy/purchase-orders');
      const data = await res.json();

      const receivedPOs = (data || []).filter(
        (po: PurchaseOrder) =>
          po.status?.toLowerCase() === 'received'
      );

      setPurchaseOrders(receivedPOs);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadPOItems(poId: string) {
    setSelectedPO(poId);

    try {
      setLoading(true);

      const res = await fetch(
        `/api/pharmacy/purchase-orders/${poId}/items`
      );

      const data = await res.json();

      console.log('PO ITEMS', data);

      const mapped = (data || []).map((item: PurchaseItem) => ({
        ...item,
        return_qty: 0,
      }));

      setItems(mapped);
    } catch (err) {
      console.error(err);
      alert('Failed to load PO items');
    } finally {
      setLoading(false);
    }
  }

  function updateQty(index: number, qty: number) {
    const updated = [...items];
    updated[index].return_qty = qty;
    setItems(updated);
  }

  async function saveReturn() {
    const returnItems = items
      .filter((i) => i.return_qty > 0)
      .map((i) => ({
        purchase_item_id: i.id,
        product_name: i.product_name,
        batch_number: i.batch_number,
        expiry_date: i.expiry_date,
        quantity: i.return_qty,
        purchase_price: i.purchase_price,
        gst_percent: i.gst_percent,
        total_amount:
          i.return_qty * i.purchase_price,
      }));

    if (!selectedPO) {
      return alert('Select purchase order');
    }

    if (returnItems.length === 0) {
      return alert('Enter return quantity');
    }

    try {
      const po = purchaseOrders.find(
        (p) => p.id === selectedPO
      );

      const payload = {
        purchase_order_id: selectedPO,
        supplier_id: po?.supplier_id,
        reason,
        notes,
        items: returnItems,
      };

      const res = await fetch(
        '/api/pharmacy/supplier-returns',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      alert('Supplier return created');

      router.push('/pharmacy/supplier-returns');
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  }

  return (
    <>
      <div className="p-6 space-y-6">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                router.push('/pharmacy/supplier-returns')
              }
              className="p-2 border rounded-lg"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-2xl font-bold">
                New Supplier Return
              </h1>
              <p className="text-gray-500">
                Return products to supplier
              </p>
            </div>
          </div>

          <button
            onClick={saveReturn}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Save size={18} />
            Save Return
          </button>
        </div>

        <div className="bg-white rounded-xl border p-5 space-y-4">

          <div>
            <label className="block mb-2 font-medium">
              Purchase Order
            </label>

            <select
              value={selectedPO}
              onChange={(e) =>
                loadPOItems(e.target.value)
              }
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">
                Select Received PO
              </option>

              {purchaseOrders.map((po) => (
                <option
                  key={po.id}
                  value={po.id}
                >
                  {po.po_number}
                  {' '}
                  {po.invoice_number &&
                    `(${po.invoice_number})`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">
                Reason
              </label>
              <input
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value)
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block mb-2">
                Notes
              </label>
              <input
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">

          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">
                  Product
                </th>
                <th className="p-3 text-center">
                  Batch
                </th>
                <th className="p-3 text-center">
                  Expiry
                </th>
                <th className="p-3 text-center">
                  Qty
                </th>
                <th className="p-3 text-center">
                  Price
                </th>
                <th className="p-3 text-center">
                  GST
                </th>
                <th className="p-3 text-center">
                  Return Qty
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-5 text-center"
                  >
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-5 text-center text-gray-500"
                  >
                    Select Purchase Order
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-t"
                  >
                    <td className="p-3">
                      {item.product_name}
                    </td>

                    <td className="p-3 text-center">
                      {item.batch_number}
                    </td>

                    <td className="p-3 text-center">
                      {item.expiry_date}
                    </td>

                    <td className="p-3 text-center">
                      {item.quantity}
                    </td>

                    <td className="p-3 text-center">
                      ₹{item.purchase_price}
                    </td>

                    <td className="p-3 text-center">
                      {item.gst_percent}%
                    </td>

                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={item.quantity}
                        value={item.return_qty}
                        onChange={(e) =>
                          updateQty(
                            idx,
                            Number(e.target.value)
                          )
                        }
                        className="w-24 border rounded-lg px-2 py-1 text-center"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}