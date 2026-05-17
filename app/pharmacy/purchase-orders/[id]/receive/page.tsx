'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface PurchaseItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  received_quantity: number;
  purchase_price: number;
  mrp: number;
  batch_number: string;
  expiry_date: string;
  item_status: string;
}

interface PurchaseOrder {
  id: string;
  invoice_number: string;
  po_number: string;
  status?: string;
}

export default function ReceivePurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();

  const purchaseOrderId = params.id as string;

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [purchaseOrder, setPurchaseOrder] =
    useState<PurchaseOrder | null>(null);

  const [loading, setLoading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [poNumber, setPoNumber] = useState('');

  const getAuthHeaders = () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('authToken')
        : null;

    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  useEffect(() => {
    fetchPurchaseOrder();
    fetchItems();
  }, []);

  const fetchPurchaseOrder = async () => {
    try {
      const res = await fetch(
        `/api/pharmacy/purchase-orders?id=${purchaseOrderId}`,
        { headers: getAuthHeaders() }
      );

      const data = await res.json();
      setPurchaseOrder(data);
    } catch (error) {
      console.error('PO fetch error:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch(
        `/api/pharmacy/purchase-items?purchase_order_id=${purchaseOrderId}`,
        { headers: getAuthHeaders() }
      );

      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Items fetch error:', error);
    }
  };

  const updateItem = (
    index: number,
    field: keyof PurchaseItem,
    value: any
  ) => {
    const updated = [...items];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    // status calculation
    if (field === 'received_quantity') {
      const receivedQty = Number(value);
      const orderedQty = Number(updated[index].quantity);

      if (receivedQty >= orderedQty) {
        updated[index].item_status = 'Received';
      } else if (receivedQty > 0) {
        updated[index].item_status = 'Partial';
      } else {
        updated[index].item_status = 'Pending';
      }
    }

    setItems(updated);
  };

  /**
   * ✅ CLEAN ARCHITECTURE:
   * Frontend ONLY sends data → backend handles inventory/stock/movement
   */
  const handleConfirmReceive = async () => {
    console.log("PO ID:", purchaseOrderId);
    try {
      setLoading(true);
      const res = await fetch(
        `/api/pharmacy/purchase-orders/${purchaseOrderId}/receive`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            invoice_number: purchaseOrder?.invoice_number,
            items: items.map((item) => ({
              id: item.id,
              product_id: item.product_id,
              received_quantity: Number(item.received_quantity || 0),
              batch_number: item.batch_number,
              expiry_date: item.expiry_date,
              purchase_price: item.purchase_price,
              mrp: item.mrp,
              item_status: item.item_status,
            })),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to receive PO');
      }

      alert('Purchase Order received successfully');

      router.push('/pharmacy/purchase-orders');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to update purchase order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow p-6">

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">
              Receive Purchase Order
            </h1>
          </div>

          {/* PO Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm font-medium mb-2">
                Invoice Number
              </label>
              <input
                type="text"
                value={purchaseOrder?.invoice_number || ''}
                onChange={(e) =>
                  setPurchaseOrder((prev) => ({
                    ...(prev as PurchaseOrder),
                    invoice_number: e.target.value,
                  }))
                }
                className="w-full border rounded-lg px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                PO Number
              </label>

              <input
                type="text"
                value={purchaseOrder?.po_number || ''}
                readOnly
                className="w-full border rounded-lg px-4 py-3 bg-gray-100"
              />
            </div>
          </div>

          {/* Items */}
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3">Medicine</th>
                  <th className="px-4 py-3">Ordered</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">MRP</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      {item.product_name}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {item.quantity}
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.received_quantity || 0}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'received_quantity',
                            Number(e.target.value)
                          )
                        }
                        className="border rounded px-3 py-2 w-24"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.batch_number || ''}
                        onChange={(e) =>
                          updateItem(index, 'batch_number', e.target.value)
                        }
                        className="border rounded px-3 py-2"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={item.expiry_date || ''}
                        onChange={(e) =>
                          updateItem(index, 'expiry_date', e.target.value)
                        }
                        className="border rounded px-3 py-2"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.mrp || 0}
                        onChange={(e) =>
                          updateItem(index, 'mrp', Number(e.target.value))
                        }
                        className="border rounded px-3 py-2 w-28"
                      />
                    </td>

                    <td className="px-4 py-3 font-semibold">
                      {item.item_status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Submit */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleConfirmReceive}
              disabled={loading}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {loading ? 'Processing...' : 'Confirm Receive'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}