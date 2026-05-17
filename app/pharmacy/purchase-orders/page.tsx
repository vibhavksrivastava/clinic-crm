'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  invoice_number: string;
  purchase_date: string;
  status: string;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  created_at: string;
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(
        '/api/pharmacy/purchase-orders',
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await res.json();

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Received':
        return 'bg-green-100 text-green-700';

      case 'Partial':
        return 'bg-yellow-100 text-yellow-700';

      case 'Pending':
        return 'bg-blue-100 text-blue-700';

      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">
              Purchase Orders
            </h1>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : orders.length === 0 ? (
            <div>No purchase orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      PO Number
                    </th>

                    <th className="px-4 py-3 text-left">
                      Invoice
                    </th>

                    <th className="px-4 py-3 text-left">
                      Date
                    </th>

                    <th className="px-4 py-3 text-left">
                      Total
                    </th>

                    <th className="px-4 py-3 text-left">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t"
                    >
                      <td className="px-4 py-3 font-semibold">
                        {order.po_number}
                      </td>

                      <td className="px-4 py-3">
                        {order.invoice_number}
                      </td>

                      <td className="px-4 py-3">
                        {order.purchase_date}
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        ₹
                        {Number(
                          order.total_amount
                        ).toFixed(2)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          href={`/pharmacy/purchase-orders/${order.id}/receive`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
