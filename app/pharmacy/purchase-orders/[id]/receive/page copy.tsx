'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Batch {
  batch_number: string;
  expiry_date: string;
  received_quantity: number;
  mrp: number;
  purchase_price: number;
}

interface POItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  batches: Batch[];
}

export default function ReceivePOPage() {
  const { id } = useParams();
  const router = useRouter();

  const [items, setItems] = useState<POItem[]>([]);
  const [loading, setLoading] = useState(false);

  const getHeaders = () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('authToken')
        : null;

    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  // =========================
  // FETCH PO + ITEMS
  // =========================
  useEffect(() => {
    fetchPO();
  }, []);

  const fetchPO = async () => {
    try {
      const res = await fetch(
        `/api/pharmacy/purchase-orders/${id}`,
        { headers: getHeaders() }
      );

      const data = await res.json();

      console.log('PO DATA:', data);

      // IMPORTANT FIX: ensure items exist
      const poItems = data?.items || [];

      const formatted: POItem[] = poItems.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product?.name || item.product_name,
        quantity: item.quantity,
        batches: [
          {
            batch_number: '',
            expiry_date: '',
            received_quantity: 0,
            mrp: 0,
            purchase_price: 0,
          },
        ],
      }));

      setItems(formatted);
    } catch (err) {
      console.error('PO fetch error:', err);
    }
  };

  // =========================
  // ADD BATCH
  // =========================
  const addBatch = (itemIndex: number) => {
    const updated = [...items];

    updated[itemIndex].batches.push({
      batch_number: '',
      expiry_date: '',
      received_quantity: 0,
      mrp: 0,
      purchase_price: 0,
    });

    setItems(updated);
  };

  // =========================
  // UPDATE BATCH
  // =========================
  const updateBatch = (
    itemIndex: number,
    batchIndex: number,
    field: keyof Batch,
    value: any
  ) => {
    const updated = [...items];

    updated[itemIndex].batches[batchIndex] = {
      ...updated[itemIndex].batches[batchIndex],
      [field]: value,
    };

    setItems(updated);
  };

  // =========================
  // VALIDATION
  // =========================
  const validate = () => {
    for (const item of items) {
      const total = item.batches.reduce(
        (sum, b) => sum + Number(b.received_quantity || 0),
        0
      );

      if (total > item.quantity) {
        alert(`Received exceeds ordered qty for ${item.product_name}`);
        return false;
      }
    }
    return true;
  };

  // =========================
  // SUBMIT GRN
  // =========================
  const submitReceive = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/pharmacy/purchase-orders/${id}/receive`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ items }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error);

      alert('GRN Created Successfully');
      router.push('/pharmacy/purchase-orders');
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl">

        <h1 className="text-2xl font-bold mb-6">
          Receive Purchase Order (GRN - Multi Batch)
        </h1>

        {/* DEBUG (IMPORTANT) */}
        {items.length === 0 && (
          <div className="text-red-500 mb-4">
            No items found — check API mapping
          </div>
        )}

        {/* ITEMS */}
        {items.map((item, i) => (
          <div key={item.id} className="border p-4 mb-6 rounded-lg">

            <div className="font-semibold mb-3">
              {item.product_name} (Ordered: {item.quantity})
            </div>

            {/* HEADER */}
            <div className="grid grid-cols-5 gap-2 text-sm font-semibold mb-2">
              <div>Batch</div>
              <div>Qty</div>
              <div>Expiry</div>
              <div>MRP</div>
              <div>Price</div>
            </div>

            {/* BATCH ROWS */}
            {item.batches.map((batch, bi) => (
              <div key={bi} className="grid grid-cols-5 gap-2 mb-2">

                <input
                  className="border p-2 rounded"
                  placeholder="Batch No"
                  value={batch.batch_number}
                  onChange={(e) =>
                    updateBatch(i, bi, 'batch_number', e.target.value)
                  }
                />

                <input
                  className="border p-2 rounded"
                  type="number"
                  placeholder="Qty"
                  value={batch.received_quantity}
                  onChange={(e) =>
                    updateBatch(
                      i,
                      bi,
                      'received_quantity',
                      Number(e.target.value)
                    )
                  }
                />

                <input
                  className="border p-2 rounded"
                  type="date"
                  value={batch.expiry_date}
                  onChange={(e) =>
                    updateBatch(i, bi, 'expiry_date', e.target.value)
                  }
                />

                <input
                  className="border p-2 rounded"
                  type="number"
                  placeholder="MRP"
                  onChange={(e) =>
                    updateBatch(i, bi, 'mrp', Number(e.target.value))
                  }
                />

                <input
                  className="border p-2 rounded"
                  type="number"
                  placeholder="Price"
                  onChange={(e) =>
                    updateBatch(
                      i,
                      bi,
                      'purchase_price',
                      Number(e.target.value)
                    )
                  }
                />
              </div>
            ))}

            {/* ADD BATCH */}
            <button
              onClick={() => addBatch(i)}
              className="text-blue-600 mt-2 font-medium"
            >
              + Add Batch
            </button>
          </div>
        ))}

        {/* SUBMIT */}
        <div className="flex justify-end mt-6">
          <button
            onClick={submitReceive}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg"
          >
            {loading ? 'Processing...' : 'Confirm Receive'}
          </button>
        </div>
      </div>
    </div>
  );
}