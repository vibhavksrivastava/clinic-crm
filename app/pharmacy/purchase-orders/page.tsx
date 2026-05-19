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
  inventory_updated?: boolean;
  inventory_updated_at?: string;
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingInventory, setUpdatingInventory] =
    useState<string | null>(null);

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
      setLoading(true);

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

  const updateInventory = async (poId: string) => {
  try {
    if (!poId) {
      throw new Error('Missing PO ID');
    }
    console.log('Updating inventory for PO ID:', poId);
    setUpdatingInventory(poId);

    const res = await fetch(
      `/api/pharmacy/purchase-orders/${poId}/update-inventory`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed');
    }

    alert('Inventory updated successfully');

    fetchOrders();
  } catch (err: any) {
    alert(err.message);
  } finally {
    setUpdatingInventory(null);
  }
};
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'received':
        return 'bg-green-100 text-green-700';

      case 'partial':
        return 'bg-yellow-100 text-yellow-700';

      case 'pending':
        return 'bg-blue-100 text-blue-700';

      case 'draft':
        return 'bg-slate-100 text-slate-700';

      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* HEADER */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 py-5 border-b border-slate-200">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                Purchase Orders
              </h1>

              <p className="text-slate-500 text-sm mt-1">
                Manage pharmacy purchase orders and inventory updates
              </p>
            </div>

            <Link
              href="/pharmacy/purchase-orders/create"
              className="w-full sm:w-auto text-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
            >
              + Create PO
            </Link>
          </div>

          <div className="p-4 sm:p-6">
            
            {/* LOADING */}

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-slate-500 text-lg">
                  Loading purchase orders...
                </div>
              </div>
            ) : orders.length === 0 ? (
              
              /* EMPTY STATE */

              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-4">
                  📦
                </div>

                <h2 className="text-xl font-semibold text-slate-700">
                  No Purchase Orders Found
                </h2>

                <p className="text-slate-500 mt-2">
                  Create your first purchase order
                </p>

                <Link
                  href="/pharmacy/purchase-orders/create"
                  className="mt-5 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
                >
                  + Create Purchase Order
                </Link>
              </div>
            ) : (
              <>
                
                {/* DESKTOP TABLE */}

                <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-4 py-4 text-left">
                          PO Number
                        </th>

                        <th className="px-4 py-4 text-left">
                          Invoice
                        </th>

                        <th className="px-4 py-4 text-left">
                          Date
                        </th>

                        <th className="px-4 py-4 text-left">
                          Total
                        </th>

                        <th className="px-4 py-4 text-left">
                          Status
                        </th>

                        <th className="px-4 py-4 text-left">
                          Inventory
                        </th>

                        <th className="px-4 py-4 text-left">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-t border-slate-200 hover:bg-slate-50 transition"
                        >
                          <td className="px-4 py-4 font-semibold text-slate-800">
                            {order.po_number}
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {order.invoice_number || '-'}
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {order.purchase_date}
                          </td>

                          <td className="px-4 py-4 font-bold text-green-700">
                            ₹
                            {Number(
                              order.total_amount || 0
                            ).toFixed(2)}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                          </td>

                          {/* INVENTORY STATUS */}

                          <td className="px-4 py-4">
                            {order.inventory_updated ? (
                              <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                Updated
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                                Pending
                              </span>
                            )}
                          </td>

                          {/* ACTIONS */}

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2">

                              {/* VIEW */}

                              <Link
                                href={`/pharmacy/purchase-orders/${order.id}/view`}
                                className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl transition"
                              >
                                View
                              </Link>

                              {/* RECEIVE */}

                              {order.status?.toLowerCase() !==
                                'received' && (
                                <Link
                                  href={`/pharmacy/purchase-orders/${order.id}/receive`}
                                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
                                >
                                  Receive
                                </Link>
                              )}

                              {/* EDIT */}

                              {order.status?.toLowerCase() !==
                                'received' && (
                                <Link
                                  href={`/pharmacy/purchase-orders/${order.id}/edit`}
                                  className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition"
                                >
                                  Edit
                                </Link>
                              )}

                              {/* UPDATE INVENTORY */}

                              {order.status?.toLowerCase() ===
                                'received' &&
                                !order.inventory_updated && (
                                  <button
                                    onClick={() =>
                                      updateInventory(order.id)
                                    }
                                    disabled={
                                      updatingInventory ===
                                      order.id
                                    }
                                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl transition"
                                  >
                                    {updatingInventory ===
                                    order.id
                                      ? 'Updating...'
                                      : 'Update Inventory'}
                                  </button>
                                )}

                              {/* INVENTORY UPDATED */}

                              {order.status?.toLowerCase() ===
                                'received' &&
                                order.inventory_updated && (
                                  <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-medium">
                                    ✓ Inventory Updated
                                  </div>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARDS */}

                <div className="lg:hidden space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-slate-200 rounded-2xl p-4 shadow-sm bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-bold text-slate-800">
                            {order.po_number}
                          </h2>

                          <p className="text-sm text-slate-500 mt-1">
                            Invoice:
                            <span className="ml-1 font-medium">
                              {order.invoice_number || '-'}
                            </span>
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-5">
                        <div>
                          <p className="text-xs text-slate-500 uppercase">
                            Purchase Date
                          </p>

                          <p className="font-medium text-slate-700 mt-1">
                            {order.purchase_date}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 uppercase">
                            Total Amount
                          </p>

                          <p className="font-bold text-green-700 mt-1">
                            ₹
                            {Number(
                              order.total_amount || 0
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* INVENTORY STATUS */}

                      <div className="mt-4">
                        <p className="text-xs text-slate-500 uppercase mb-2">
                          Inventory Status
                        </p>

                        {order.inventory_updated ? (
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                            Updated
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                            Pending
                          </span>
                        )}
                      </div>

                      {/* MOBILE ACTIONS */}

                      <div className="mt-5 flex flex-col gap-3">

                        <Link
                          href={`/pharmacy/purchase-orders/${order.id}/view`}
                          className="w-full inline-flex justify-center items-center px-4 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-medium transition"
                        >
                          View
                        </Link>

                        {order.status?.toLowerCase() !==
                          'received' && (
                          <>
                            <Link
                              href={`/pharmacy/purchase-orders/${order.id}/receive`}
                              className="w-full inline-flex justify-center items-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
                            >
                              Receive
                            </Link>

                            <Link
                              href={`/pharmacy/purchase-orders/${order.id}/edit`}
                              className="w-full inline-flex justify-center items-center px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition"
                            >
                              Edit
                            </Link>
                          </>
                        )}

                        {order.status?.toLowerCase() ===
                          'received' &&
                          !order.inventory_updated && (
                            <button
                              onClick={() => updateInventory(order.id)}
                              disabled={order.inventory_updated}
                              className={`px-4 py-2 rounded text-white ${
                                order.inventory_updated
                                  ? 'bg-gray-400'
                                  : 'bg-green-600 hover:bg-green-700'
                              }`}
                            >
                              {order.inventory_updated
                                ? 'Inventory Updated'
                                : 'Update Inventory'}
                            </button>
                          )}

                        {order.status?.toLowerCase() ===
                          'received' &&
                          order.inventory_updated && (
                            <div className="w-full px-4 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-medium text-center">
                              ✓ Inventory Updated
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}