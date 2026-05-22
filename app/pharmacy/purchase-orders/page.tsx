'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import {
  PackageCheck,
  Search,
  ShoppingCart,
  CircleDollarSign,
  RefreshCcw,
  Eye,
  Pencil,
  Truck,
  CheckCircle2,
  Clock3,
  Boxes,
  CalendarDays,
} from 'lucide-react';

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

type FilterType =
  | 'all'
  | 'draft'
  | 'partial'
  | 'received';

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<
    PurchaseOrder[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState('');

  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>('all');

  const [
    updatingInventory,
    setUpdatingInventory,
  ] = useState<string | null>(null);

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

  const updateInventory = async (
    poId: string
  ) => {
    try {
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
        throw new Error(
          data.error || 'Failed'
        );
      }

      alert(
        'Inventory updated successfully'
      );

      fetchOrders();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingInventory(null);
    }
  };

  // ================= SUMMARY =================

  const totalPOs = orders.length;

  const pendingPOs = orders.filter(
    (o) =>
      o.status?.toLowerCase() === 'draft'
  ).length;

  const partialPOs = orders.filter(
    (o) =>
      o.status?.toLowerCase() === 'partial'
  ).length;

  const receivedPOs = orders.filter(
    (o) =>
      o.status?.toLowerCase() === 'received'
  ).length;

  const totalPurchaseValue = orders.reduce(
    (sum, item) =>
      sum + Number(item.total_amount || 0),
    0
  );

  // ================= FILTER =================

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (search.trim()) {
      filtered = filtered.filter((item) => {
        const po =
          item.po_number?.toLowerCase() || '';

        const invoice =
          item.invoice_number?.toLowerCase() ||
          '';

        return (
          po.includes(search.toLowerCase()) ||
          invoice.includes(
            search.toLowerCase()
          )
        );
      });
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(
        (item) =>
          item.status?.toLowerCase() ===
          selectedFilter
      );
    }

    return filtered;
  }, [orders, search, selectedFilter]);

  // ================= STATUS STYLE =================

  const getStatusColor = (
    status: string
  ) => {
    switch (status?.toLowerCase()) {
      case 'received':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';

      case 'partial':
        return 'bg-amber-100 text-amber-700 border border-amber-200';

      case 'draft':
        return 'bg-blue-100 text-blue-700 border border-blue-200';

      case 'draft':
        return 'bg-slate-100 text-slate-700 border border-slate-200';

      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getCardClass = (
    filter: FilterType,
    color: string
  ) => {
    return `
      rounded-3xl border p-5 transition-all cursor-pointer
      ${
        selectedFilter === filter
          ? `${color} border-blue-500 scale-[1.02] shadow-lg`
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
      }
    `;
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <main className="p-4 md:p-6">
        {/* ================= HEADER ================= */}
                {/* HERO */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_25%)]" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md">
                <ShoppingCart size={16} />
                Pharmacy Procurement
              </div>

              <h1 className="text-4xl font-bold tracking-tight">
                Purchase Orders
              </h1>

              <p className="mt-3 max-w-2xl text-base text-blue-100">
              Manage supplier purchase orders,
              receiving and inventory updates
              </p>
            </div>

            <Link
              href="/pharmacy/purchase-orders/create"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              <PackageCheck size={18} />
              Create Purchase Order
            </Link>

          </div>
        </div>


        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex flex-col gap-3 sm:flex-row">
            <button 
              onClick={fetchOrders}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCcw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* ================= SUMMARY ================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {/* TOTAL */}

          <div
            onClick={() =>
              setSelectedFilter('all')
            }
            className={getCardClass(
              'all',
              'bg-blue-50'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-blue-100 p-3">
                <Boxes className="text-blue-700" />
              </div>

              <span className="text-xs font-medium text-slate-500">
                Total Orders
              </span>
            </div>

            <h2 className="mt-5 text-3xl font-bold text-slate-900">
              {totalPOs}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Purchase Orders
            </p>
          </div>

          {/* PENDING */}

          <div
            onClick={() =>
              setSelectedFilter('draft')
            }
            className={getCardClass(
              'draft',
              'bg-blue-50'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-blue-100 p-3">
                <Clock3 className="text-blue-700" />
              </div>

              <span className="text-xs font-medium text-slate-500">
                Draft
              </span>
            </div>

            <h2 className="mt-5 text-3xl font-bold text-blue-700">
              {pendingPOs}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Awaiting Delivery
            </p>
          </div>

          {/* PARTIAL */}

          <div
            onClick={() =>
              setSelectedFilter('partial')
            }
            className={getCardClass(
              'partial',
              'bg-amber-50'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-amber-100 p-3">
                <Truck className="text-amber-700" />
              </div>

              <span className="text-xs font-medium text-slate-500">
                Partial
              </span>
            </div>

            <h2 className="mt-5 text-3xl font-bold text-amber-700">
              {partialPOs}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Partially Received
            </p>
          </div>

          {/* RECEIVED */}

          <div
            onClick={() =>
              setSelectedFilter('received')
            }
            className={getCardClass(
              'received',
              'bg-emerald-50'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-emerald-100 p-3">
                <CheckCircle2 className="text-emerald-700" />
              </div>

              <span className="text-xs font-medium text-slate-500">
                Received
              </span>
            </div>

            <h2 className="mt-5 text-3xl font-bold text-emerald-700">
              {receivedPOs}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Completed Orders
            </p>
          </div>

          {/* VALUE */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-green-100 p-3">
                <CircleDollarSign className="text-green-700" />
              </div>

              <span className="text-xs font-medium text-slate-500">
                Total Value
              </span>
            </div>

            <h2 className="mt-5 text-2xl font-bold text-green-700">
              ₹
              {totalPurchaseValue.toLocaleString(
                'en-IN',
                {
                  minimumFractionDigits: 2,
                }
              )}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Procurement Value
            </p>
          </div>
        </div>

        {/* ================= SEARCH ================= */}

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-3.5 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search by PO Number or Invoice..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* ================= CONTENT ================= */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex h-80 flex-col items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>

              <p className="mt-5 text-slate-500">
                Loading purchase orders...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-slate-100 p-5">
                <PackageCheck
                  size={42}
                  className="text-slate-400"
                />
              </div>

              <h2 className="mt-5 text-2xl font-bold text-slate-800">
                No Purchase Orders Found
              </h2>

              <p className="mt-2 text-slate-500">
                Create your first purchase
                order to manage pharmacy
                procurement
              </p>

              <Link
                href="/pharmacy/purchase-orders/create"
                className="mt-6 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Create Purchase Order
              </Link>
            </div>
          ) : (
            <>
              {/* ================= DESKTOP TABLE ================= */}

              <div className="hidden overflow-x-auto xl:block">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        PO Number
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Invoice
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Purchase Date
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Inventory
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        {/* PO */}

                        <td className="px-6 py-5">
                          <div>
                            <p className="font-bold text-slate-800">
                              {order.po_number}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Created{' '}
                              {new Date(
                                order.created_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </td>

                        {/* INVOICE */}

                        <td className="px-6 py-5 font-medium text-slate-600">
                          {order.invoice_number ||
                            '-'}
                        </td>

                        {/* DATE */}

                        <td className="px-6 py-5">
                          <div className="inline-flex items-center gap-2 text-slate-600">
                            <CalendarDays size={15} />

                            {new Date(
                              order.purchase_date
                            ).toLocaleDateString()}
                          </div>
                        </td>

                        {/* AMOUNT */}

                        <td className="px-6 py-5">
                          <div>
                            <p className="text-lg font-bold text-green-700">
                              ₹
                              {Number(
                                order.total_amount ||
                                  0
                              ).toLocaleString(
                                'en-IN',
                                {
                                  minimumFractionDigits: 2,
                                }
                              )}
                            </p>

                            <p className="text-xs text-slate-500">
                              GST ₹
                              {Number(
                                order.gst_amount ||
                                  0
                              ).toFixed(2)}
                            </p>
                          </div>
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>

                        {/* INVENTORY */}

                        <td className="px-6 py-5">
                          {order.inventory_updated ? (
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 size={14} />
                              Updated
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              <Clock3 size={14} />
                              Pending
                            </div>
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/pharmacy/purchase-orders/${order.id}/view`}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              <Eye size={16} />
                              View
                            </Link>

                            {order.status?.toLowerCase() !==
                              'received' && (
                              <>
                                <Link
                                  href={`/pharmacy/purchase-orders/${order.id}/receive`}
                                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                                >
                                  <Truck size={16} />
                                  Receive
                                </Link>

                                <Link
                                  href={`/pharmacy/purchase-orders/${order.id}/edit`}
                                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
                                >
                                  <Pencil size={16} />
                                  Edit
                                </Link>
                              </>
                            )}

                            {order.status?.toLowerCase() ===
                              'received' &&
                              !order.inventory_updated && (
                                <button
                                  onClick={() =>
                                    updateInventory(
                                      order.id
                                    )
                                  }
                                  disabled={
                                    updatingInventory ===
                                    order.id
                                  }
                                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:bg-slate-400"
                                >
                                  {updatingInventory ===
                                  order.id
                                    ? 'Updating...'
                                    : 'Update Inventory'}
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ================= MOBILE CARDS ================= */}

              <div className="space-y-4 p-4 xl:hidden">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    {/* TOP */}

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-800">
                          {order.po_number}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Invoice:{' '}
                          {order.invoice_number ||
                            '-'}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* DETAILS */}

                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Purchase Date
                        </p>

                        <p className="mt-2 font-semibold text-slate-800">
                          {new Date(
                            order.purchase_date
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-green-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-green-600">
                          Total Amount
                        </p>

                        <p className="mt-2 text-lg font-bold text-green-700">
                          ₹
                          {Number(
                            order.total_amount || 0
                          ).toLocaleString(
                            'en-IN',
                            {
                              minimumFractionDigits: 2,
                            }
                          )}
                        </p>
                      </div>
                    </div>

                    {/* INVENTORY */}

                    <div className="mt-5">
                      {order.inventory_updated ? (
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                          <CheckCircle2 size={16} />
                          Inventory Updated
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                          <Clock3 size={16} />
                          Inventory Pending
                        </div>
                      )}
                    </div>

                    {/* ACTIONS */}

                    <div className="mt-6 flex flex-col gap-3">
                      <Link
                        href={`/pharmacy/purchase-orders/${order.id}/view`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        <Eye size={18} />
                        View Purchase Order
                      </Link>

                      {order.status?.toLowerCase() !==
                        'received' && (
                        <>
                          <Link
                            href={`/pharmacy/purchase-orders/${order.id}/receive`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                          >
                            <Truck size={18} />
                            Receive Order
                          </Link>

                          <Link
                            href={`/pharmacy/purchase-orders/${order.id}/edit`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-semibold text-white transition hover:bg-amber-600"
                          >
                            <Pencil size={18} />
                            Edit Purchase Order
                          </Link>
                        </>
                      )}

                      {order.status?.toLowerCase() ===
                        'received' &&
                        !order.inventory_updated && (
                          <button
                            onClick={() =>
                              updateInventory(
                                order.id
                              )
                            }
                            disabled={
                              updatingInventory ===
                              order.id
                            }
                            className="rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:bg-slate-400"
                          >
                            {updatingInventory ===
                            order.id
                              ? 'Updating Inventory...'
                              : 'Update Inventory'}
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}