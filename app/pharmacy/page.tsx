'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import Header from '@/components/Header';

import {
  Package,
  AlertTriangle,
  IndianRupee,
  Receipt,
  Pill,
  ShoppingCart,
  Activity,
  FileText,
  Truck,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Plus,
} from 'lucide-react';

/* ───────────────── TYPES ───────────────── */

interface DashboardStats {
  todaySales: number;
  yesterdaySales: number;
  monthlySales: number;
  totalProducts: number;
  lowStockCount: number;
  totalInvoices: number;
  totalPurchaseOrders: number;
  totalSuppliers: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: any;
  link: string;
  gradient: string;
}

/* ───────────────── QUICK ACTIONS ───────────────── */

const quickActions: QuickAction[] = [
  {
    title: 'Add Suppliers',
    description: 'Manage pharmacy vendors',
    icon: Package,
    gradient: 'from-blue-500 to-cyan-500',
    link: '/pharmacy/suppliers',
  },
  {
    title: 'Add Medicine',
    description: 'Create medicine catalog',
    icon: Pill,
    gradient: 'from-violet-500 to-purple-500',
    link: '/pharmacy/products',
  },
  {
    title: 'Create Purchase Order',
    description: 'Generate new PO',
    icon: Truck,
    gradient: 'from-emerald-500 to-green-500',
    link: '/pharmacy/purchase-orders/create',
  },
  {
    title: 'Purchase Orders',
    description: 'Track procurement',
    icon: FileText,
    gradient: 'from-orange-500 to-amber-500',
    link: '/pharmacy/purchase-orders',
  },
  {
    title: 'Sales Invoices',
    description: 'View customer invoices',
    icon: Receipt,
    gradient: 'from-pink-500 to-rose-500',
    link: '/pharmacy/sales',
  },
  {
    title: 'Create Invoice',
    description: 'Generate billing invoice',
    icon: ShoppingCart,
    gradient: 'from-indigo-500 to-blue-500',
    link: '/pharmacy/sales/create',
  },
  {
    title: 'Inventory',
    description: 'Monitor stock movement',
    icon: BarChart3,
    gradient: 'from-teal-500 to-emerald-500',
    link: '/pharmacy/inventory',
  },
  {
    title: 'Analytics',
    description: 'Business insights',
    icon: Activity,
    gradient: 'from-red-500 to-orange-500',
    link: '/pharmacy/dashboard',
  },
];

export default function PharmacyDashboardPage() {
  const router = useRouter();

  /* ───────────────── STATE ───────────────── */

  const [loading, setLoading] = useState(true);

  const [statsData, setStatsData] =
    useState<DashboardStats>({
      todaySales: 0,
      yesterdaySales: 0,
      monthlySales: 0,
      totalProducts: 0,
      lowStockCount: 0,
      totalInvoices: 0,
      totalPurchaseOrders: 0,
      totalSuppliers: 0,
    });

  /* ───────────────── FETCH ───────────────── */

  useEffect(() => {
    fetchDashboardStats();
  }, []);

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

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      const [
        salesRes,
        productsRes,
        purchaseRes,
        suppliersRes,
      ] = await Promise.all([
        fetch('/api/pharmacy/sales', {
          headers: getAuthHeaders(),
        }),

        fetch('/api/pharmacy/products', {
          headers: getAuthHeaders(),
        }),

        fetch(
          '/api/pharmacy/purchase-orders',
          {
            headers: getAuthHeaders(),
          }
        ),

        fetch('/api/pharmacy/suppliers', {
          headers: getAuthHeaders(),
        }),
      ]);

      const salesData =
        await salesRes.json();

      const productsData =
        await productsRes.json();

      const purchaseData =
        await purchaseRes.json();

      const suppliersData =
        await suppliersRes.json();

      const sales = Array.isArray(
        salesData
      )
        ? salesData
        : [];

      const products = Array.isArray(
        productsData
      )
        ? productsData
        : [];

      const purchases = Array.isArray(
        purchaseData
      )
        ? purchaseData
        : [];

      const suppliers = Array.isArray(
        suppliersData
      )
        ? suppliersData
        : [];

      const today =
        new Date().toISOString().split('T')[0];

      const yesterday = new Date(
        Date.now() - 86400000
      )
        .toISOString()
        .split('T')[0];

      let todaySales = 0;
      let yesterdaySales = 0;
      let monthlySales = 0;

      sales.forEach((sale: any) => {
        const saleDate =
          sale.sale_date?.split('T')[0];

        const amount = Number(
          sale.total_amount || 0
        );

        if (saleDate === today) {
          todaySales += amount;
        }

        if (saleDate === yesterday) {
          yesterdaySales += amount;
        }

        monthlySales += amount;
      });

      const lowStockCount =
        products.filter(
          (p: any) =>
            Number(p.stock_quantity || 0) <=
            Number(
              p.reorder_level || 10
            )
        ).length;

      setStatsData({
        todaySales,
        yesterdaySales,
        monthlySales,
        totalProducts: products.length,
        lowStockCount,
        totalInvoices: sales.length,
        totalPurchaseOrders:
          purchases.length,
        totalSuppliers:
          suppliers.length,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /* ───────────────── CALCULATIONS ───────────────── */

  const salesGrowth = useMemo(() => {
    if (
      statsData.yesterdaySales === 0
    )
      return 100;

    return (
      ((statsData.todaySales -
        statsData.yesterdaySales) /
        statsData.yesterdaySales) *
      100
    );
  }, [statsData]);

  const stats = [
    {
      title: 'Today Sales',
      value: `₹${statsData.todaySales.toLocaleString()}`,
      icon: TrendingUp,
      change: `${salesGrowth.toFixed(1)}%`,
      positive: salesGrowth >= 0,
      gradient:
        'from-emerald-500 to-green-500',
    },
    {
      title: 'Monthly Revenue',
      value: `₹${statsData.monthlySales.toLocaleString()}`,
      icon: IndianRupee,
      change: 'Live',
      positive: true,
      gradient:
        'from-blue-500 to-cyan-500',
    },
    {
      title: 'Low Stock Items',
      value:
        statsData.lowStockCount.toString(),
      icon: AlertTriangle,
      change:
        statsData.lowStockCount > 0
          ? 'Attention'
          : 'Healthy',
      positive:
        statsData.lowStockCount === 0,
      gradient:
        'from-orange-500 to-red-500',
    },
    {
      title: 'Products',
      value:
        statsData.totalProducts.toString(),
      icon: Pill,
      change: 'Inventory',
      positive: true,
      gradient:
        'from-violet-500 to-purple-500',
    },
  ];

  /* ───────────────── UI ───────────────── */

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <Header />

      <main className="p-4 md:p-6">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_25%)]" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md">
                <Activity size={16} />
                Pharmacy Management System
              </div>

              <h1 className="text-4xl font-bold tracking-tight">
                Pharmacy Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-base text-blue-100">
                Manage inventory,
                billing, suppliers,
                purchase orders and
                pharmacy operations from
                one centralized dashboard.
              </p>
            </div>

            <button
              onClick={() =>
                router.push(
                  '/pharmacy/sales/create'
                )
              }
              className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 font-semibold text-slate-900 transition hover:scale-[1.02]"
            >
              <Plus size={20} />
              Create Invoice
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-[28px] border border-white/50 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-[0.03]`}
                />

                <div className="relative z-10 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {stat.title}
                    </p>

                    <h3 className="mt-3 text-3xl font-bold text-gray-900">
                      {loading
                        ? '...'
                        : stat.value}
                    </h3>

                    <div className="mt-4 flex items-center gap-2">
                      <div
                        className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                          stat.positive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {stat.positive ? (
                          <TrendingUp size={12} />
                        ) : (
                          <TrendingDown size={12} />
                        )}

                        {stat.change}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl bg-gradient-to-br ${stat.gradient} p-4 text-white shadow-lg`}
                  >
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* MAIN GRID */}
        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* QUICK ACTIONS */}
          <div className="rounded-[28px] border border-white/50 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Quick Actions
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Access pharmacy
                  operations quickly
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                {
                  quickActions.length
                }{' '}
                Modules
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {quickActions.map(
                (action, index) => {
                  const Icon =
                    action.icon;

                  return (
                    <button
                      key={index}
                      onClick={() =>
                        router.push(
                          action.link
                        )
                      }
                      className="group relative overflow-hidden rounded-[24px] border border-gray-100 bg-gray-50/80 p-5 text-left transition hover:border-blue-200 hover:bg-white hover:shadow-lg"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 transition group-hover:opacity-[0.04]`}
                      />

                      <div className="relative z-10 flex items-start justify-between">
                        <div>
                          <div
                            className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br ${action.gradient} p-4 text-white shadow-lg`}
                          >
                            <Icon size={24} />
                          </div>

                          <h3 className="text-lg font-bold text-gray-900">
                            {action.title}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            {
                              action.description
                            }
                          </p>
                        </div>

                        <ChevronRight className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            {/* BUSINESS SUMMARY */}
            <div className="rounded-[28px] border border-white/50 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                Business Summary
              </h2>

              <div className="mt-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">
                      Total Invoices
                    </div>

                    <div className="mt-1 text-2xl font-bold">
                      {
                        statsData.totalInvoices
                      }
                    </div>
                  </div>

                  <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                    <Receipt size={22} />
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">
                      Purchase Orders
                    </div>

                    <div className="mt-1 text-2xl font-bold">
                      {
                        statsData.totalPurchaseOrders
                      }
                    </div>
                  </div>

                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <Truck size={22} />
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">
                      Suppliers
                    </div>

                    <div className="mt-1 text-2xl font-bold">
                      {
                        statsData.totalSuppliers
                      }
                    </div>
                  </div>

                  <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                    <Package size={22} />
                  </div>
                </div>
              </div>
            </div>

            {/* ALERTS */}
            <div className="rounded-[28px] border border-red-100 bg-gradient-to-br from-red-50 to-orange-50 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-red-500 p-3 text-white">
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Inventory Alerts
                  </h3>

                  <p className="text-sm text-gray-600">
                    Stock monitoring
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-white/80 p-5">
                <div className="text-4xl font-bold text-red-600">
                  {
                    statsData.lowStockCount
                  }
                </div>

                <div className="mt-1 text-sm text-gray-600">
                  Medicines are below
                  reorder level
                </div>

                <button
                  onClick={() =>
                    router.push(
                      '/pharmacy/inventory'
                    )
                  }
                  className="mt-5 w-full rounded-2xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
                >
                  View Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}