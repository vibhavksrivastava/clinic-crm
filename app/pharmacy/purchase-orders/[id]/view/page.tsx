'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function ViewPurchaseOrderPage() {
  const params = useParams();

  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [purchaseOrder, setPurchaseOrder] =
    useState<any>(null);

  const [supplier, setSupplier] =
  useState<any>(null);

  const handlePrint = () => {
    window.print();
  };

  const [items, setItems] = useState<any[]>([]);
const [updatingInventory, setUpdatingInventory] = useState(false);

  const getAuthHeaders = () => {
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
    fetchPurchaseOrder();
    fetchPurchaseItems();
  }, []);

  const fetchPurchaseOrder = async () => {
    try {
      const res = await fetch(
        `/api/pharmacy/purchase-orders?id=${params.id}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await res.json();

      setPurchaseOrder(data);
      
      if (data?.supplier_id) {
         fetchSupplier(data.supplier_id);
}
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPurchaseItems = async () => {
    try {
      const res = await fetch(
        `/api/pharmacy/purchase-items?purchase_order_id=${params.id}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await res.json();

      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplier = async (
  supplierId: string
) => {
  try {
    const res = await fetch(
      '/api/pharmacy/suppliers',
      {
        headers: getAuthHeaders(),
      }
    );

    const data = await res.json();

    const found = data.find(
      (s: any) => s.id === supplierId
    );

    setSupplier(found || null);
  } catch (error) {
    console.error(error);
  }
};
  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading...
      </div>
    );
  }

  const handleUpdateInventory = async () => {
  try {
    if (!params?.id) return;

    setUpdatingInventory(true);

    const res = await fetch(
      `/api/pharmacy/purchase-orders/${params.id}/update-inventory`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || 'Failed to update inventory');
    }

    alert('Inventory updated successfully');

    // optional refresh
    fetchPurchaseOrder();
  } catch (error: any) {
    console.error('Inventory update error:', error);
    alert(error.message || 'Something went wrong');
  } finally {
    setUpdatingInventory(false);
  }
};
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* HEADER */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">
                Purchase Order Details
              </h1>

              <p className="text-gray-500 mt-1">
                Read-only purchase order view
              </p>
            </div>

            <button
              onClick={() =>
                router.push(
                  '/pharmacy/purchase-orders'
                )
              }
              className="px-4 py-2 bg-gray-200 rounded-lg"
            >
              Back
            </button>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">
                PO Number
              </p>

              <p className="font-semibold text-lg">
                {purchaseOrder?.po_number || '-'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Invoice Number
              </p>

              <p className="font-semibold text-lg">
                {purchaseOrder?.invoice_number ||
                  '-'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Purchase Date
              </p>

              <p className="font-semibold">
                {purchaseOrder?.purchase_date ||
                  '-'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Status
              </p>

              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium
                ${
                  purchaseOrder?.status ===
                  'Received'
                    ? 'bg-green-100 text-green-700'
                    : purchaseOrder?.status ===
                      'Partial'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {purchaseOrder?.status}
              </span>
            </div>
          </div>
        </div>

<div className="bg-white rounded-xl shadow p-6 mb-6">
  <h2 className="text-xl font-bold mb-4">
    Supplier Details
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <p className="text-sm text-gray-500">
        Supplier Name
      </p>

      <p className="font-semibold text-lg">
        {supplier?.supplier_name || '-'}
      </p>
    </div>

    <div>
      <p className="text-sm text-gray-500">
        Contact Person
      </p>

      <p className="font-semibold">
        {supplier?.contact_person || '-'}
      </p>
    </div>

    <div>
      <p className="text-sm text-gray-500">
        Phone Number
      </p>

      <p className="font-semibold">
        {supplier?.phone || '-'}
      </p>
    </div>

    <div>
      <p className="text-sm text-gray-500">
        Address
      </p>

      <p className="font-semibold">
        {supplier?.address || '-'}
      </p>
    </div>
  </div>
</div>
        {/* ITEMS */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">
            Purchase Items
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    Medicine
                  </th>

                  <th className="px-4 py-3 text-left">
                    Qty
                  </th>

                  <th className="px-4 py-3 text-left">
                    Purchase Price
                  </th>

                  <th className="px-4 py-3 text-left">
                    GST%
                  </th>

                  {purchaseOrder?.status === 'Received' && (
  <>
    <th className="px-4 py-3 text-left">
      Batch
    </th>

    <th className="px-4 py-3 text-left">
      Expiry
    </th>
  </>
)}
                  <th className="px-4 py-3 text-left">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t"
                  >
                    <td className="px-4 py-3">
                      {item.product_name}
                    </td>

                    <td className="px-4 py-3">
                      {item.quantity}
                    </td>

                    <td className="px-4 py-3">
                      ₹
                      {Number(
                        item.purchase_price
                      ).toFixed(2)}
                    </td>

                    <td className="px-4 py-3">
                      {item.gst_percent}%
                    </td>

{purchaseOrder?.status === 'Received' && (
  <>
    <td className="px-4 py-3">
      {item.batch_number || '-'}
    </td>

    <td className="px-4 py-3">
      {item.expiry_date || '-'}
    </td>
  </>
)}
                    <td className="px-4 py-3 font-semibold">
                      ₹
                      {Number(
                        item.total_amount
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTALS */}
          <div className="mt-6 flex justify-end">
            <div className="w-full md:w-96 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>

                <span>
                  ₹
                  {Number(
                    purchaseOrder?.subtotal || 0
                  ).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>GST</span>

                <span>
                  ₹
                  {Number(
                    purchaseOrder?.gst_amount || 0
                  ).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-xl font-bold border-t pt-2">
                <span>Total</span>

                <span>
                  ₹
                  {Number(
                    purchaseOrder?.total_amount ||
                      0
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-4 right-4">
    <button
  type="button"
  onClick={handleUpdateInventory}
  disabled={updatingInventory}
  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
>
  {updatingInventory ? 'Updating...' : 'Update Inventory'}
</button>
    </div>
      <style jsx global>{`
  @media print {
    button {
      display: none !important;
    }

    body {
      background: white !important;
    }
  }
`}</style>
   </div>
  );
}