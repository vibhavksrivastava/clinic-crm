'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardUrl } from '@/lib/utils/dashboard';
import {
  AlertTriangle,
  Package,
  Search,
  CalendarDays,
  IndianRupee,
  TrendingUp,
  Boxes,
  Activity,
  ArrowUpRight,
  Pill,
  Clock3,
  ShieldAlert,
  RefreshCw,
  Eye,
  Link,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  batch_number?: string;
  expiry_date?: string;
  purchase_price?: number;
  selling_price?: number;
  stock_quantity: number;
  minimum_stock?: number;

  pharmacy_products?: {
    id: string;
    name: string;
    sku?: string;
    category?: string;
    gst_percent?: number;
    unit?: string;
  };
}

type FilterType =
  | 'all'
  | 'low_stock'
  | 'out_of_stock'
  | 'near_expiry';

export default function InventoryPage() {
  const router = useRouter();

  const [inventory, setInventory] = useState<
    InventoryItem[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');

  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>('all');

  const dashboardUrl = getDashboardUrl();

  // ================= FETCH =================
  const fetchInventory = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        '/api/pharmacy/inventory'
      );

      const data = await response.json();

      setInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        'Error fetching inventory:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // ================= STATS =================
  const totalItems = inventory.length;

  const totalStockUnits = inventory.reduce(
    (sum, item) =>
      sum + Number(item.stock_quantity || 0),
    0
  );

  const lowStockCount = inventory.filter(
    (item) =>
      item.stock_quantity > 0 &&
      item.stock_quantity <=
        (item.minimum_stock || 10)
  ).length;

  const outOfStockCount = inventory.filter(
    (item) => item.stock_quantity === 0
  ).length;

  const nearExpiryCount = inventory.filter(
    (item) => {
      if (!item.expiry_date) return false;

      const expiryDate = new Date(
        item.expiry_date
      );

      const today = new Date();

      const diffDays =
        (expiryDate.getTime() -
          today.getTime()) /
        (1000 * 60 * 60 * 24);

      return diffDays <= 30;
    }
  ).length;

  const inventoryValue = inventory.reduce(
    (sum, item) =>
      sum +
      (item.purchase_price || 0) *
        item.stock_quantity,
    0
  );

  const sellingValue = inventory.reduce(
    (sum, item) =>
      sum +
      (item.selling_price || 0) *
        item.stock_quantity,
    0
  );

  const expectedProfit =
    sellingValue - inventoryValue;

  // ================= FILTER =================
  const filteredInventory = useMemo(() => {
    let filtered = inventory;

    filtered = filtered.filter((item) => {
      const productName =
        item.pharmacy_products?.name?.toLowerCase() ||
        '';

      const sku =
        item.pharmacy_products?.sku?.toLowerCase() ||
        '';

      const batch =
        item.batch_number?.toLowerCase() || '';

      return (
        productName.includes(
          search.toLowerCase()
        ) ||
        sku.includes(search.toLowerCase()) ||
        batch.includes(search.toLowerCase())
      );
    });

    switch (selectedFilter) {
      case 'low_stock':
        return filtered.filter(
          (item) =>
            item.stock_quantity > 0 &&
            item.stock_quantity <=
              (item.minimum_stock || 10)
        );

      case 'out_of_stock':
        return filtered.filter(
          (item) => item.stock_quantity === 0
        );

      case 'near_expiry':
        return filtered.filter((item) => {
          if (!item.expiry_date) return false;

          const expiryDate = new Date(
            item.expiry_date
          );

          const today = new Date();

          const diffDays =
            (expiryDate.getTime() -
              today.getTime()) /
            (1000 * 60 * 60 * 24);

          return diffDays <= 30;
        });

      default:
        return filtered;
    }
  }, [inventory, selectedFilter, search]);

  // ================= HELPERS =================
  const getExpiryStatus = (
    expiry?: string
  ) => {
    if (!expiry)
      return {
        label: 'No Expiry',
        className:
          'bg-gray-100 text-gray-600',
      };

    const expiryDate = new Date(expiry);

    const today = new Date();

    const diffDays = Math.ceil(
      (expiryDate.getTime() -
        today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 0) {
      return {
        label: 'Expired',
        className:
          'bg-red-100 text-red-700',
      };
    }

    if (diffDays <= 30) {
      return {
        label: `${diffDays} Days Left`,
        className:
          'bg-orange-100 text-orange-700',
      };
    }

    return {
      label: expiry,
      className:
        'bg-green-100 text-green-700',
    };
  };

  const getStockStatus = (
    stock: number,
    min?: number
  ) => {
    if (stock === 0) {
      return {
        label: 'Out Of Stock',
        className:
          'bg-red-100 text-red-700',
      };
    }

    if (stock <= (min || 10)) {
      return {
        label: 'Low Stock',
        className:
          'bg-yellow-100 text-yellow-700',
      };
    }

    return {
      label: 'Available',
      className:
        'bg-emerald-100 text-emerald-700',
    };
  };

  const summaryCards = [
    {
      title: 'Total Medicines',
      value: totalItems,
      sub: `${totalStockUnits} Units`,
      icon: Boxes,
      color:
        'from-blue-600 to-indigo-600',
      filter: 'all' as FilterType,
    },
    {
      title: 'Low Stock',
      value: lowStockCount,
      sub: 'Needs Reorder',
      icon: AlertTriangle,
      color:
        'from-yellow-500 to-orange-500',
      filter: 'low_stock' as FilterType,
    },
    {
      title: 'Out Of Stock',
      value: outOfStockCount,
      sub: 'Immediate Action',
      icon: ShieldAlert,
      color: 'from-red-500 to-rose-600',
      filter: 'out_of_stock' as FilterType,
    },
    {
      title: 'Near Expiry',
      value: nearExpiryCount,
      sub: 'Within 30 Days',
      icon: Clock3,
      color:
        'from-orange-500 to-amber-600',
      filter: 'near_expiry' as FilterType,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 py-8">

      
        {/* ================= HEADER ================= */}
                {/* HERO */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_25%)]" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md">
                Pharmacy Inventory
              </div>

              <h1 className="text-4xl font-bold tracking-tight">
                Pharmacy Inventory
              </h1>

              <p className="mt-3 max-w-2xl text-base text-blue-100">
              Advanced stock monitoring, batch tracking & inventory analytics
              </p>
            </div>
            <button
              onClick={() =>
                router.push(
                  '/pharmacy/purchase-orders/create'
                )
              }
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:scale-[1.02]"
            >
              <Package size={17} />
              Create Purchase Order
            </button>
          </div>
        </div>
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <button
              onClick={() =>
                router.push(dashboardUrl)
              }
              className="mb-3 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              ← Back To Dashboard
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchInventory}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>
        </div>

        {/* TOP KPI */}
        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <button
                key={card.title}
                onClick={() =>
                  setSelectedFilter(card.filter)
                }
                className={`group relative overflow-hidden rounded-3xl border p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                  selectedFilter === card.filter
                    ? 'border-blue-500 bg-white shadow-xl'
                    : 'border-white bg-white shadow-sm'
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-[0.06]`}
                />

                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {card.title}
                    </p>

                    <h2 className="mt-3 text-4xl font-bold text-slate-900">
                      {card.value}
                    </h2>

                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                      <Activity size={14} />
                      {card.sub}
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl bg-gradient-to-br p-4 text-white shadow-lg ${card.color}`}
                  >
                    <Icon size={24} />
                  </div>
                </div>

                <div className="relative mt-5 flex items-center gap-2 text-sm font-semibold text-blue-700">
                  View Details
                  <ArrowUpRight size={15} />
                </div>
              </button>
            );
          })}
        </div>

        {/* VALUE CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-emerald-100">
                  Inventory Cost Value
                </p>

                <h2 className="mt-3 text-4xl font-bold">
                  ₹
                  {inventoryValue.toLocaleString(
                    'en-IN'
                  )}
                </h2>

                <p className="mt-2 text-sm text-emerald-100">
                  Based on purchase pricing
                </p>
              </div>

              <div className="rounded-2xl bg-white/20 p-4">
                <IndianRupee size={28} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-blue-100">
                  Selling Value
                </p>

                <h2 className="mt-3 text-4xl font-bold">
                  ₹
                  {sellingValue.toLocaleString(
                    'en-IN'
                  )}
                </h2>

                <p className="mt-2 text-sm text-blue-100">
                  Current stock market value
                </p>
              </div>

              <div className="rounded-2xl bg-white/20 p-4">
                <TrendingUp size={28} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-r from-purple-600 to-fuchsia-600 p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-purple-100">
                  Expected Profit
                </p>

                <h2 className="mt-3 text-4xl font-bold">
                  ₹
                  {expectedProfit.toLocaleString(
                    'en-IN'
                  )}
                </h2>

                <p className="mt-2 text-sm text-purple-100">
                  Estimated gross margin
                </p>
              </div>

              <div className="rounded-2xl bg-white/20 p-4">
                <ArrowUpRight size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="mb-6 rounded-3xl border border-white bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Inventory Records
              </h2>

              <p className="text-sm text-slate-500">
                Search medicines, SKU,
                batches & expiry details
              </p>
            </div>

            <div className="relative w-full lg:w-[420px]">
              <Search
                size={18}
                className="absolute left-4 top-4 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search medicine, SKU or batch..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-3xl border border-white bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Live Inventory
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {filteredInventory.length}{' '}
                  records found
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                Updated Live
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="mb-4 h-14 w-14 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

              <p className="text-sm font-medium text-slate-500">
                Loading inventory...
              </p>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Package
                size={52}
                className="mb-4 text-slate-300"
              />

              <h3 className="text-lg font-semibold text-slate-700">
                No Inventory Found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your search or
                filter
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      'Medicine',
                      'SKU',
                      'Batch',
                      'Expiry',
                      'Stock',
                      'Min',
                      'Purchase',
                      'Selling',
                      'GST',
                      'Status',
                    ].map((head) => (
                      <th
                        key={head}
                        className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredInventory.map(
                    (item) => {
                      const stockStatus =
                        getStockStatus(
                          item.stock_quantity,
                          item.minimum_stock
                        );

                      const expiryStatus =
                        getExpiryStatus(
                          item.expiry_date
                        );

                      return (
                        <tr
                          key={item.id}
                          className="border-t border-slate-100 transition hover:bg-slate-50/80"
                        >
                          {/* MEDICINE */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100">
                                <Pill className="text-blue-700" />
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {
                                    item
                                      .pharmacy_products
                                      ?.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    item
                                      .pharmacy_products
                                      ?.category
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="px-6 py-5 text-sm font-medium text-slate-700">
                            {item
                              .pharmacy_products
                              ?.sku || '-'}
                          </td>

                          {/* BATCH */}
                          <td className="px-6 py-5">
                            <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                              {item.batch_number ||
                                '-'}
                            </div>
                          </td>

                          {/* EXPIRY */}
                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${expiryStatus.className}`}
                            >
                              {
                                expiryStatus.label
                              }
                            </span>
                          </td>

                          {/* STOCK */}
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-lg font-bold text-slate-900">
                                {
                                  item.stock_quantity
                                }
                              </span>

                              <span className="text-xs text-slate-500">
                                Units
                              </span>
                            </div>
                          </td>

                          {/* MIN */}
                          <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                            {item.minimum_stock ||
                              10}
                          </td>

                          {/* PURCHASE */}
                          <td className="px-6 py-5">
                            <div className="font-semibold text-slate-800">
                              ₹
                              {Number(
                                item.purchase_price ||
                                  0
                              ).toFixed(2)}
                            </div>
                          </td>

                          {/* SELLING */}
                          <td className="px-6 py-5">
                            <div className="font-bold text-emerald-700">
                              ₹
                              {Number(
                                item.selling_price ||
                                  0
                              ).toFixed(2)}
                            </div>
                          </td>

                          {/* GST */}
                          <td className="px-6 py-5">
                            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                              {item
                                .pharmacy_products
                                ?.gst_percent || 0}
                              %
                            </span>
                          </td>

                          {/* STATUS */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <span
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${stockStatus.className}`}
                              >
                                {
                                  stockStatus.label
                                }
                              </span>

                              <button className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                                <Eye size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}