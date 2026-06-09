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
  supplier_id: string
) => {
  try {
    const res = await fetch(
      `/api/pharmacy/suppliers?id=${supplier_id}`,
      {
        headers: getAuthHeaders(),
      }
    );
    const data = await res.json();

    setSupplier(data || null);
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
  <div className="min-h-screen bg-slate-50">
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">

      {/* PRINT HEADER */}

      <div className="hidden print:block mb-8">
        <div className="text-center border-b pb-4">
          <h1 className="text-3xl font-bold">
            Clinic CRM Pharmacy
          </h1>

          <p className="text-gray-600 mt-2">
            Purchase Order Receipt
          </p>
        </div>
      </div>

      {/* HEADER */}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 print:shadow-none">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Purchase Order Details
            </h1>

            <p className="text-slate-500 mt-1 text-sm sm:text-base">
              Read-only purchase order view
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 print:hidden">

            <button
              onClick={() => window.open(`/api/print/purchase-order/${params.id}`, '_blank')}
              className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
            >
              Print / PDF
            </button>

            <button
              onClick={() =>
                router.push(
                  '/pharmacy/purchase-orders'
                )
              }
              className="w-full sm:w-auto px-5 py-3 bg-slate-200 hover:bg-slate-300 rounded-xl font-medium transition"
            >
              Back
            </button>
          </div>
        </div>

        {/* ORDER INFO */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-500">
              PO Number
            </p>

            <p className="font-bold text-lg text-slate-800 mt-1">
              {purchaseOrder?.po_number || '-'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-500">
              Invoice Number
            </p>

            <p className="font-bold text-lg text-slate-800 mt-1">
              {purchaseOrder?.invoice_number || '-'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-500">
              Purchase Date
            </p>

            <p className="font-semibold text-slate-700 mt-1">
              {purchaseOrder?.purchase_date || '-'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-500 mb-2">
              Status
            </p>

            <span
              className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold
              ${
                purchaseOrder?.status ===
                'Received'
                  ? 'bg-green-100 text-green-700'
                  : purchaseOrder?.status ===
                    'Partial'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {purchaseOrder?.status}
            </span>
          </div>
        </div>
      </div>

      {/* SUPPLIER DETAILS */}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 print:shadow-none">

        <h2 className="text-xl font-bold text-slate-800 mb-5">
          Supplier Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-500">
              Supplier Name
            </p>

            <p className="font-bold text-lg text-slate-800 mt-1">
              {supplier?.supplier_name || '-'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-500">
              Contact Person
            </p>

            <p className="font-semibold text-slate-700 mt-1">
              {supplier?.contact_person || '-'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-500">
              Phone Number
            </p>

            <p className="font-semibold text-slate-700 mt-1">
              {supplier?.phone || '-'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-500">
              Address
            </p>

            <p className="font-semibold text-slate-700 mt-1 break-words">
              {supplier?.address || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* PURCHASE ITEMS */}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 print:shadow-none">

        <div className="flex items-center justify-between mb-5">

          <h2 className="text-xl font-bold text-slate-800">
            Purchase Items
          </h2>

          <div className="text-sm text-slate-500">
            {items.length} Items
          </div>
        </div>

        {/* DESKTOP TABLE */}

        <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200 print:block">

          <table className="min-w-full text-sm">

            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-4 text-left">
                  Medicine
                </th>

                <th className="px-4 py-4 text-left">
                  Qty
                </th>

                <th className="px-4 py-4 text-left">
                  Purchase Price
                </th>

                <th className="px-4 py-4 text-left">
                  GST%
                </th>

                {purchaseOrder?.status ===
                  'Received' && (
                  <>
                    <th className="px-4 py-4 text-left">
                      Batch
                    </th>

                    <th className="px-4 py-4 text-left">
                      Expiry
                    </th>
                  </>
                )}

                <th className="px-4 py-4 text-left">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-200"
                >
                  <td className="px-4 py-4 font-medium text-slate-800">
                    {item.product_name}
                  </td>

                  <td className="px-4 py-4">
                    {item.quantity}
                  </td>

                  <td className="px-4 py-4">
                    ₹
                    {Number(
                      item.purchase_price
                    ).toFixed(2)}
                  </td>

                  <td className="px-4 py-4">
                    {item.gst_percent}%
                  </td>

                  {purchaseOrder?.status ===
                    'Received' && (
                    <>
                      <td className="px-4 py-4">
                        {item.batch_number || '-'}
                      </td>

                      <td className="px-4 py-4">
                        {item.expiry_date || '-'}
                      </td>
                    </>
                  )}

                  <td className="px-4 py-4 font-bold text-green-700">
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

        {/* MOBILE CARDS */}

        <div className="lg:hidden print:hidden space-y-4">

          {items.map((item) => (
            <div
              key={item.id}
              className="border border-slate-200 rounded-2xl p-4 shadow-sm bg-white"
            >

              <div className="flex items-start justify-between gap-3">

                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {item.product_name}
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Qty: {item.quantity}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-green-700">
                    ₹
                    {Number(
                      item.total_amount
                    ).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-5">

                <div>
                  <p className="text-xs text-slate-500 uppercase">
                    Purchase Price
                  </p>

                  <p className="font-medium mt-1">
                    ₹
                    {Number(
                      item.purchase_price
                    ).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase">
                    GST
                  </p>

                  <p className="font-medium mt-1">
                    {item.gst_percent}%
                  </p>
                </div>

                {purchaseOrder?.status ===
                  'Received' && (
                  <>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">
                        Batch
                      </p>

                      <p className="font-medium mt-1">
                        {item.batch_number ||
                          '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 uppercase">
                        Expiry
                      </p>

                      <p className="font-medium mt-1">
                        {item.expiry_date ||
                          '-'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* TOTALS */}

        <div className="mt-6 bg-slate-100 rounded-2xl p-5">

          <div className="w-full sm:w-96 ml-auto space-y-3">

            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>

              <span className="font-medium">
                ₹
                {Number(
                  purchaseOrder?.subtotal || 0
                ).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>GST</span>

              <span className="font-medium">
                ₹
                {Number(
                  purchaseOrder?.gst_amount || 0
                ).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-2xl font-bold border-t border-slate-300 pt-3 text-slate-800">
              <span>Total</span>

              <span className="text-green-700">
                ₹
                {Number(
                  purchaseOrder?.total_amount ||
                    0
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* SIGNATURES */}

        <div className="hidden print:block mt-20">
          <div className="grid grid-cols-2 gap-10">

            <div>
              <div className="border-t pt-2 text-center">
                Authorized Signature
              </div>
            </div>

            <div>
              <div className="border-t pt-2 text-center">
                Supplier Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* PRINT STYLES */}

    <style jsx global>{`
      @media print {

        body {
          background: white !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        button {
          display: none !important;
        }

        nav,
        header,
        aside {
          display: none !important;
        }

        .shadow-sm,
        .shadow-lg,
        .shadow-xl {
          box-shadow: none !important;
        }

        .rounded-2xl,
        .rounded-xl {
          border-radius: 0 !important;
        }

        .bg-slate-50 {
          background: white !important;
        }

        .border-slate-200 {
          border-color: #d1d5db !important;
        }

        .fixed {
          display: none !important;
        }

        table {
          width: 100% !important;
          border-collapse: collapse !important;
        }

        th,
        td {
          border: 1px solid #d1d5db !important;
          padding: 8px !important;
        }

        .print\\:block {
          display: block !important;
        }

        .print\\:hidden {
          display: none !important;
        }

        @page {
          size: A4;
          margin: 12mm;
        }
      }
    `}</style>
  </div>
);
}