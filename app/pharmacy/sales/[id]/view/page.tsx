'use client';

import Header from '@/components/Header';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function InvoiceViewPage() {
  const params = useParams();

  const [sale, setSale] = useState<any>(null);

  const fetchInvoice = async () => {
    const response = await fetch(
      `/api/pharmacy/sales/${params.id}`
    );

    const data = await response.json();

    setSale(data);
  };

  useEffect(() => {
    fetchInvoice();
  }, []);

  if (!sale) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="mx-auto max-w-4xl p-4 md:p-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Invoice
              </h1>

              <p className="text-gray-500">
                {sale.invoice_number}
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="rounded-xl bg-blue-600 px-5 py-3 text-white"
            >
              Print Invoice
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h2 className="font-bold">Customer</h2>

              <p>
                {sale.pharmacy_customers?.name ||
                  'Walk-in Customer'}
              </p>

              <p>
                {sale.pharmacy_customers?.phone}
              </p>
            </div>

            <div>
              <h2 className="font-bold">Payment</h2>

              <p className="capitalize">
                {sale.payment_method}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    Product
                  </th>

                  <th className="px-4 py-3 text-left">
                    Qty
                  </th>

                  <th className="px-4 py-3 text-left">
                    Price
                  </th>

                  <th className="px-4 py-3 text-left">
                    GST
                  </th>

                  <th className="px-4 py-3 text-left">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {sale.pharmacy_sale_items?.map(
                  (item: any) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-4">
                        {
                          item.pharmacy_products?.name
                        }
                      </td>

                      <td className="px-4 py-4">
                        {item.quantity}
                      </td>

                      <td className="px-4 py-4">
                        ₹{item.unit_price}
                      </td>

                      <td className="px-4 py-4">
                        {item.gst_percent}%
                      </td>

                      <td className="px-4 py-4 font-bold">
                        ₹{item.total_amount}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 ml-auto max-w-sm space-y-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{sale.subtotal}</span>
            </div>

            <div className="flex justify-between">
              <span>GST</span>
              <span>₹{sale.gst_amount}</span>
            </div>

            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span>₹{sale.total_amount}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
