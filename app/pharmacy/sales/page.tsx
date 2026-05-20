'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function PharmacySalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/pharmacy/sales');

      const data = await response.json();

      setSales(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="p-4 md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Pharmacy Sales
            </h1>

            <p className="text-gray-500 text-sm">
              Manage pharmacy invoices
            </p>
          </div>

          <Link
            href="/pharmacy/sales/create"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Create Sale
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-4 text-left">Invoice</th>
                  <th className="px-4 py-4 text-left">Customer</th>
                  <th className="px-4 py-4 text-left">Phone</th>
                  <th className="px-4 py-4 text-left">Amount</th>
                  <th className="px-4 py-4 text-left">Payment</th>
                  <th className="px-4 py-4 text-left">Date</th>
                  <th className="px-4 py-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center">
                      No sales found
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="border-t">
                      <td className="px-4 py-4 font-semibold">
                        {sale.invoice_number}
                      </td>

                      <td className="px-4 py-4">
                        {sale.pharmacy_customers?.name || '-'}
                      </td>

                      <td className="px-4 py-4">
                        {sale.pharmacy_customers?.phone || '-'}
                      </td>

                      <td className="px-4 py-4 font-bold text-green-600">
                        ₹{sale.total_amount}
                      </td>

                      <td className="px-4 py-4 capitalize">
                        {sale.payment_method}
                      </td>

                      <td className="px-4 py-4">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <Link
                          href={`/pharmacy/sales/${sale.id}/view`}
                          className="rounded-lg bg-blue-100 px-4 py-2 text-sm text-blue-700"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
