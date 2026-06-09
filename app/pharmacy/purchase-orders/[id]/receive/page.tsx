'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Batch {
  batch_number: string;
  expiry_date: string;
  received_quantity: number;
  mrp: number;
  purchase_price: number;
  selling_price: number;
}

interface ExistingGRN {
  id: string;
  batch_number: string;
  expiry_date: string;
  received_quantity: number;
  mrp: number;
  purchase_price: number;
  received_date: string;
  selling_price: number;
}

interface POItem {
  id: string;
  product_id: string;
  product_name: string;

  quantity: number;
  received_quantity: number;
  pending_quantity: number;

  existing_grn: ExistingGRN[];

  batches: Batch[];
}

export default function ReceivePOPage() {
  const { id } = useParams();
  const router = useRouter();

  const [items, setItems] = useState<POItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');

  const getHeaders = () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('authToken')
        : null;

    return {
      'Content-Type': 'application/json',
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
    };
  };

  useEffect(() => {
    fetchPO();
  }, []);

  const fetchPO = async () => {
    try {
      const res = await fetch(
        `/api/pharmacy/purchase-orders/${id}`,
        {
          headers: getHeaders(),
        }
      );

      const data = await res.json();

      setPoNumber(data.po_number || '');
      setSupplierName(
        data.supplier?.supplier_name || ''
      );

      const poItems = data?.items || [];

      const formatted: POItem[] =
        poItems.map((item: any) => ({
          id: item.id,

          product_id: item.product_id,

          product_name:
            item.product?.name || '',

          quantity: Number(
            item.quantity || 0
          ),

          received_quantity: Number(
            item.received_quantity || 0
          ),

          pending_quantity:
            Number(item.quantity || 0) -
            Number(
              item.received_quantity || 0
            ),

          existing_grn:
            item.grn || [],

          batches: [
            {
              batch_number: '',
              expiry_date: '',
              received_quantity: 0,
              mrp:
                item.grn?.[0]?.mrp || 0,
              purchase_price:
                item.purchase_price || 0,
                selling_price:
                item.grn?.[0]?.selling_price ||
                item.grn?.[0]?.mrp ||
                0,
            },
          ],
        }));

      setItems(formatted);
    } catch (err) {
      console.error(err);
      alert('Failed to load PO');
    }
  };

  const addBatch = (itemIndex: number) => {
    const updated = [...items];

    updated[itemIndex].batches.push({
      batch_number: '',
      expiry_date: '',
      received_quantity: 0,
      mrp: 0,
      purchase_price: 0,
      selling_price: 0,
    });

    setItems(updated);
  };

  const updateBatch = (
    itemIndex: number,
    batchIndex: number,
    field: keyof Batch,
    value: any
  ) => {
    const updated = [...items];

    updated[itemIndex].batches[
      batchIndex
    ] = {
      ...updated[itemIndex].batches[
        batchIndex
      ],
      [field]: value,
    };

    setItems(updated);
  };

  const validate = () => {
    for (const item of items) {
      const total =
        item.batches.reduce(
          (sum, batch) =>
            sum +
            Number(
              batch.received_quantity || 0
            ),
          0
        );

      if (
        total >
        item.pending_quantity
      ) {
        alert(
          `${item.product_name} exceeds pending quantity`
        );
        return false;
      }

      for (const batch of item.batches) {
        if (
          Number(
            batch.received_quantity
          ) > 0
        ) {
          if (
            !batch.batch_number
          ) {
            alert(
              `Batch Number required for ${item.product_name}`
            );
            return false;
          }

          if (
            !batch.expiry_date
          ) {
            alert(
              `Expiry Date required for ${item.product_name}`
            );
            return false;
          }
        }
      }
    }

    return true;
  };

  const submitReceive = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const payload = {
        items,
      };

      const res = await fetch(
        `/api/pharmacy/purchase-orders/${id}/receive`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(
            payload
          ),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.error
        );
      }

      alert(
        'Stock received successfully'
      );

      router.push(
        '/pharmacy/purchase-orders'
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
  <div className="min-h-screen bg-gray-100 p-6">
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Receive Purchase Order
          </h1>

          <p className="text-gray-500 mt-1">
            PO Number: {poNumber}
          </p>

          <p className="text-gray-500">
            Supplier: {supplierName}
          </p>
        </div>
      </div>

      {/* Items */}
      {items.map((item, itemIndex) => (
        <div
          key={item.id}
          className="bg-white rounded-xl shadow-sm p-6 mb-6"
        >
          {/* Product Header */}
          <div className="mb-5">
            <h2 className="font-bold text-lg">
              {item.product_name}
            </h2>

            <div className="grid grid-cols-3 gap-4 mt-4">

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500">
                  Ordered
                </div>

                <div className="text-xl font-bold">
                  {item.quantity}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500">
                  Received
                </div>

                <div className="text-xl font-bold">
                  {item.received_quantity || 0}
              </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500">
                  Pending
                </div>

                <div className="text-xl font-bold">
                  {item.pending_quantity}
                </div>
              </div>

            </div>
          </div>

          {/* Previous GRNs */}
          {item.existing_grn?.length > 0 && (
            <div className="mb-6 border rounded-lg p-4 bg-gray-50">
              <div className="font-semibold mb-3">
                Previous Receipts
              </div>

              <div className="grid grid-cols-6 gap-2 text-xs font-semibold mb-2">
                <div>Batch</div>
                <div>Qty</div>
                <div>Expiry</div>
                <div>MRP</div>
                <div>Selling Price</div>
                <div>Purchase Price</div>
              </div>

              {item.existing_grn.map((grn) => (
                <div
                  key={grn.id}
                  className="grid grid-cols-6 gap-2 text-sm border-b py-2"
                >
                  <div>{grn.batch_number}</div>

                  <div>
                    {grn.received_quantity}
                  </div>

                  <div>
                    {grn.expiry_date}
                  </div>

                  <div>
                    {grn.mrp}
                  </div>

                  <div>
                    {grn.selling_price}
                  </div>

                  <div>
                    {grn.purchase_price}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fully Received */}
          {item.pending_quantity <= 0 ? (
            <div className="bg-green-100 text-green-700 p-4 rounded-lg font-medium">
              Fully Received
            </div>
          ) : (
            <>
              <div className="font-semibold mb-3">
                New Receipt
              </div>

              <div className="grid grid-cols-6 gap-3 font-semibold mb-3">
                <div>Batch No</div>
                <div>Quantity</div>
                <div>Expiry Date</div>
                <div>MRP</div>
                <div>Selling Price</div>
                <div>Purchase Price</div>
              </div>

              {item.batches.map(
                (batch, batchIndex) => (
                  <div
                    key={batchIndex}
                    className="grid grid-cols-6 gap-3 mb-3"
                  >
                    <input
                      className="border rounded-lg p-2"
                      placeholder="Batch Number"
                      value={batch.batch_number}
                      onChange={(e) =>
                        updateBatch(
                          itemIndex,
                          batchIndex,
                          'batch_number',
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="number"
                      className="border rounded-lg p-2"
                      placeholder="Qty"
                      value={batch.received_quantity}
                      onChange={(e) =>
                        updateBatch(
                          itemIndex,
                          batchIndex,
                          'received_quantity',
                          Number(e.target.value)
                        )
                      }
                    />

                    <input
                      type="date"
                      className="border rounded-lg p-2"
                      value={batch.expiry_date}
                      onChange={(e) =>
                        updateBatch(
                          itemIndex,
                          batchIndex,
                          'expiry_date',
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="number"
                      className="border rounded-lg p-2"
                      placeholder="MRP"
                      value={batch.mrp}
                      onChange={(e) =>
                        updateBatch(
                          itemIndex,
                          batchIndex,
                          'mrp',
                          Number(e.target.value)
                        )
                      }
                    />
                    <input
                      type="number"
                      className="border rounded-lg p-2"
                      placeholder="Selling Price"
                      value={batch.selling_price}
                      onChange={(e) =>
                        updateBatch(
                          itemIndex,
                          batchIndex,
                          'selling_price',
                          Number(e.target.value)
                        )
                      }
                    />
                    <input
                      type="number"
                      className="border rounded-lg p-2"
                      placeholder="Purchase Price"
                      value={batch.purchase_price}
                      onChange={(e) =>
                        updateBatch(
                          itemIndex,
                          batchIndex,
                          'purchase_price',
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                )
              )}

              <button
                type="button"
                onClick={() =>
                  addBatch(itemIndex)
                }
                className="text-blue-600 font-medium mt-2"
              >
                + Add Batch
              </button>
            </>
          )}
        </div>
      ))}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          onClick={submitReceive}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
        >
          {loading
            ? 'Processing...'
            : 'Confirm Receive'}
        </button>
      </div>

    </div>
  </div>
);
}