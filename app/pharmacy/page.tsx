'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardUrl } from '@/lib/utils/dashboard';

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

/* --------------------------------
TYPES
-------------------------------- */

interface PharmacySale {
  id: string;
  invoice_number?: string;
  sale_date?: string;
  customer_name?: string;
  total_amount?: number;
  payment_status?: string;
}

interface Product {
  id: string;
  product_name?: string;
  stock_quantity?: number;
  reorder_level?: number;
  selling_price?: number;
}

interface PurchaseOrder {
  id: string;
  po_number?: string;
  supplier_name?: string;
  status?: string;
  total_amount?: number;
  created_at?: string;
}

interface Supplier {
  id: string;
  supplier_name?: string;
}

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

interface UserContext {
  userId: string;
  roleType: string;
  permissions?: string[];
}

interface QuickAction {
  title: string;
  description: string;
  icon: any;
  link: string;
  gradient: string;
}

/* --------------------------------
QUICK ACTIONS
-------------------------------- */

const quickActions: QuickAction[] = [
  {
    title: 'Add Supplier',
    description: 'Manage vendors',
    icon: Package,
    gradient:
      'from-blue-500 to-cyan-500',
    link: '/pharmacy/suppliers',
  },
  {
    title: 'Add Medicine',
    description: 'Medicine catalog',
    icon: Pill,
    gradient:
      'from-violet-500 to-purple-500',
    link: '/pharmacy/products',
  },
  {
    title: 'Create PO',
    description: 'Purchase order',
    icon: Truck,
    gradient:
      'from-emerald-500 to-green-500',
    link:
      '/pharmacy/purchase-orders/create',
  },
  {
    title: 'Purchase Orders',
    description: 'Track procurement',
    icon: FileText,
    gradient:
      'from-orange-500 to-amber-500',
    link:
      '/pharmacy/purchase-orders',
  },
  {
    title: 'Sales',
    description: 'Invoices & billing',
    icon: Receipt,
    gradient:
      'from-pink-500 to-rose-500',
    link: '/pharmacy/sales',
  },
  {
    title: 'Create Invoice',
    description: 'Billing invoice',
    icon: ShoppingCart,
    gradient:
      'from-indigo-500 to-blue-500',
    link:
      '/pharmacy/sales/create',
  },
  {
    title: 'Inventory',
    description: 'Stock management',
    icon: BarChart3,
    gradient:
      'from-teal-500 to-emerald-500',
    link: '/pharmacy/inventory',
  },
];

/* --------------------------------
PAGE
-------------------------------- */

export default function PharmacyPage() {
  const router = useRouter();

  const [dashboardUrl] = useState(
    getDashboardUrl()
  );

  const [loading, setLoading] =
    useState(true);

  const [userContext, setUserContext] =
    useState<UserContext | null>(
      null
    );

  const [sales, setSales] =
    useState<PharmacySale[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [purchaseOrders, setPurchaseOrders] =
    useState<PurchaseOrder[]>([]);

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

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
    /* --------------------------------
AUTH ME
-------------------------------- */

const getUserRole = async () => {
  try {
    const res =
      await fetch('/api/auth/me');

    const data =
      await res.json();

    console.log(
      'AUTH ME:',
      data
    );

    if (
      data.authenticated &&
      data.user
    ) {
      const role =
        data.user.role_type ||
        data.user.roleType ||
        '';

      setUserContext({
        userId: data.user.id,
        roleType: role,
        permissions:
          data.user.permissions ||
          [],
      });
    }
  } catch (error) {
    console.error(
      'Auth fetch error:',
      error
    );
  }
};


// --------------------------------
// AUTH HEADERS
// --------------------------------
const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};
// --------------------------------
// FETCH DASHBOARD DATA
// --------------------------------
const fetchDashboardData = async () => {
  try {
    setLoading(true);

    const [
      salesRes,
      productsRes,
      purchaseRes,
      suppliersRes,
    ] = await Promise.all([
      fetch('/api/pharmacy/sales', {
        credentials: 'include',
        headers: getAuthHeaders(),
      }),

      fetch('/api/pharmacy/products', {
        credentials: 'include',
        headers: getAuthHeaders(),
      }),

      fetch('/api/pharmacy/purchase-orders', {
        credentials: 'include',
        headers: getAuthHeaders(),
      }),

      fetch('/api/pharmacy/suppliers', {
        credentials: 'include',
        headers: getAuthHeaders(),
      }),
    ]);

    // auth failure
    if (
      [
        salesRes.status,
        productsRes.status,
        purchaseRes.status,
        suppliersRes.status,
      ].includes(401)
    ) {
      router.push('/login');
      return;
    }

    const salesData = await salesRes.json();
    const productsData =
      await productsRes.json();
    const purchaseData =
      await purchaseRes.json();
    const suppliersData =
      await suppliersRes.json();

    const sales = Array.isArray(salesData)
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
          Number(
            p.stock_quantity || 0
          ) <=
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
    console.error(
      'Dashboard fetch error:',
      error
    );
  } finally {
    setLoading(false);
  }
};
/* --------------------------------
USE EFFECT
-------------------------------- */

useEffect(() => {
  getUserRole();
  fetchDashboardData();
}, []);

/* --------------------------------
CALCULATIONS
-------------------------------- */

const salesGrowth =
  useMemo(() => {
    if (
      statsData
        .yesterdaySales ===
      0
    )
      return 100;

    return (
      ((statsData.todaySales -
        statsData.yesterdaySales) /
        statsData.yesterdaySales) *
      100
    );
  }, [statsData]);

const lowStockProducts =
  products.filter(
    (p) =>
      Number(
        p.stock_quantity ||
          0
      ) <=
      Number(
        p.reorder_level ||
          10
      )
  );

const stats = [
  {
    title:
      'Today Sales',
    value: `₹${statsData.todaySales.toLocaleString()}`,
    icon: TrendingUp,
    change: `${salesGrowth.toFixed(
      1
    )}%`,
    positive:
      salesGrowth >= 0,
    gradient:
      'from-emerald-500 to-green-500',
  },
  {
    title:
      'Monthly Revenue',
    value: `₹${statsData.monthlySales.toLocaleString()}`,
    icon: IndianRupee,
    change: 'Live',
    positive: true,
    gradient:
      'from-blue-500 to-cyan-500',
  },
  {
    title:
      'Low Stock',
    value:
      statsData.lowStockCount.toString(),
    icon:
      AlertTriangle,
    change:
      statsData.lowStockCount >
      0
        ? 'Alert'
        : 'Healthy',
    positive:
      statsData.lowStockCount ===
      0,
    gradient:
      'from-orange-500 to-red-500',
  },
  {
    title:
      'Products',
    value:
      statsData.totalProducts.toString(),
    icon: Pill,
    change:
      'Inventory',
    positive: true,
    gradient:
      'from-violet-500 to-purple-500',
  },
];
/* --------------------------------
UI
-------------------------------- */

return (
  <div className="min-h-screen bg-[#f4f7fb]">
      {/* HEADER */}

    <main className="max-w-7xl mx-auto px-4 py-8">

      {/* HERO */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-2xl mb-8">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_25%)]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md mb-4">
              <Activity size={16} />
              MediQuick Rx
            </div>

            <h2 className="text-4xl font-bold">
              Pharmacy Operations Center
            </h2>

            <p className="mt-3 text-blue-100 max-w-2xl">
              Monitor medicine stock,
              purchase orders, billing
              and pharmacy business
              performance from one
              dashboard.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl px-6 py-5">
            <div className="text-sm text-blue-100">
              Total Revenue
            </div>

            <div className="text-3xl font-bold mt-2">
              ₹
              {statsData.monthlySales.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {stats.map(
          (
            stat,
            index
          ) => {
            const Icon =
              stat.icon;

            return (
              <div
                key={index}
                className="relative overflow-hidden rounded-3xl border border-white/50 bg-white p-6 shadow-sm hover:shadow-xl transition"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-[0.04]`}
                />

                <div className="relative z-10 flex items-start justify-between">

                  <div>
                    <p className="text-sm text-gray-500">
                      {
                        stat.title
                      }
                    </p>

                    <h3 className="text-3xl font-bold mt-3 text-gray-900">
                      {loading
                        ? '...'
                        : stat.value}
                    </h3>

                    <div
                      className={`mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                        stat.positive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {stat.positive ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}

                      {
                        stat.change
                      }
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl bg-gradient-to-br ${stat.gradient} p-4 text-white`}
                  >
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* MAIN GRID */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* QUICK ACTIONS */}

        <div className="xl:col-span-2 bg-white rounded-3xl p-6 shadow-sm">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Quick Actions
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Pharmacy modules
              </p>
            </div>

            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl text-sm font-semibold">
              {
                quickActions.length
              }{' '}
              Modules
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map(
              (
                action,
                index
              ) => {
                const Icon =
                  action.icon;

                return (
                  <button
                    key={
                      index
                    }
                    onClick={() =>
                      router.push(
                        action.link
                      )
                    }
                    className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-gray-50/70 p-5 text-left hover:bg-white hover:shadow-lg transition"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-[0.04] transition`}
                    />

                    <div className="relative z-10 flex justify-between">

                      <div>
                        <div
                          className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br ${action.gradient} p-4 text-white`}
                        >
                          <Icon size={22} />
                        </div>

                        <h3 className="font-bold text-gray-900 text-lg">
                          {
                            action.title
                          }
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          {
                            action.description
                          }
                        </p>
                      </div>

                      <ChevronRight className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>
                {/* RIGHT SIDEBAR */}

        <div className="space-y-6">

          {/* BUSINESS SUMMARY */}

          <div className="bg-white rounded-3xl p-6 shadow-sm">

            <h2 className="text-xl font-bold text-gray-900">
              Business Summary
            </h2>

            <div className="space-y-5 mt-6">

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">
                    Total Invoices
                  </div>

                  <div className="text-2xl font-bold mt-1">
                    {
                      statsData.totalInvoices
                    }
                  </div>
                </div>

                <div className="bg-blue-100 text-blue-700 p-3 rounded-2xl">
                  <Receipt size={22} />
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">
                    Purchase Orders
                  </div>

                  <div className="text-2xl font-bold mt-1">
                    {
                      statsData.totalPurchaseOrders
                    }
                  </div>
                </div>

                <div className="bg-green-100 text-green-700 p-3 rounded-2xl">
                  <Truck size={22} />
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">
                    Suppliers
                  </div>

                  <div className="text-2xl font-bold mt-1">
                    {
                      statsData.totalSuppliers
                    }
                  </div>
                </div>

                <div className="bg-violet-100 text-violet-700 p-3 rounded-2xl">
                  <Package size={22} />
                </div>
              </div>
            </div>
          </div>

          {/* LOW STOCK ALERT */}

          <div className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 to-orange-50 p-6 shadow-sm">

            <div className="flex items-center gap-3">
              <div className="bg-red-500 text-white p-3 rounded-2xl">
                <AlertTriangle size={22} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Inventory Alerts
                </h3>

                <p className="text-sm text-gray-600">
                  Low stock medicines
                </p>
              </div>
            </div>

            <div className="bg-white/80 rounded-2xl p-5 mt-5">

              <div className="text-4xl font-bold text-red-600">
                {
                  statsData.lowStockCount
                }
              </div>

              <div className="text-sm text-gray-600 mt-1">
                Medicines below reorder level
              </div>

              <button
                onClick={() =>
                  router.push(
                    '/pharmacy/inventory'
                  )
                }
                className="w-full mt-5 bg-red-500 hover:bg-red-600 text-white rounded-2xl py-3 font-semibold transition"
              >
                View Inventory
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT SALES */}

      <div className="bg-white rounded-3xl shadow-sm mt-8 overflow-hidden">

        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Recent Sales
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Latest invoices
            </p>
          </div>

          <button
            onClick={() =>
              router.push(
                '/pharmacy/sales'
              )
            }
            className="text-blue-600 font-semibold"
          >
            View All
          </button>
        </div>

        {sales.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No sales found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">

              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left">
                    Invoice
                  </th>

                  <th className="px-5 py-3 text-left">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-left">
                    Date
                  </th>

                  <th className="px-5 py-3 text-left">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-left">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {sales
                  .slice(0, 5)
                  .map(
                    (
                      sale
                    ) => (
                      <tr
                        key={
                          sale.id
                        }
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="px-5 py-4 font-medium text-blue-600">
                          {
                            sale.invoice_number
                          }
                        </td>

                        <td className="px-5 py-4">
                          {
                            sale.customer_name
                          }
                        </td>

                        <td className="px-5 py-4">
                          {sale.sale_date
                            ? new Date(
                                sale.sale_date
                              ).toLocaleDateString()
                            : '-'}
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          ₹
                          {Number(
                            sale.total_amount ||
                              0
                          ).toLocaleString()}
                        </td>

                        <td className="px-5 py-4">
                          {
                            sale.payment_status
                          }
                        </td>
                      </tr>
                    )
                  )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PURCHASE ORDERS */}

      <div className="bg-white rounded-3xl shadow-sm mt-8 overflow-hidden">

        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Recent Purchase Orders
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Procurement activity
            </p>
          </div>
        </div>

        {purchaseOrders.length ===
        0 ? (
          <div className="p-8 text-center text-gray-500">
            No purchase orders found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">

              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left">
                    PO Number
                  </th>

                  <th className="px-5 py-3 text-left">
                    Supplier
                  </th>

                  <th className="px-5 py-3 text-left">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-left">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {purchaseOrders
                  .slice(0, 5)
                  .map(
                    (
                      po
                    ) => (
                      <tr
                        key={po.id}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="px-5 py-4 font-medium text-blue-600">
                          {
                            po.po_number
                          }
                        </td>

                        <td className="px-5 py-4">
                          {
                            po.supplier_name
                          }
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          ₹
                          {Number(
                            po.total_amount ||
                              0
                          ).toLocaleString()}
                        </td>

                        <td className="px-5 py-4 capitalize">
                          {
                            po.status
                          }
                        </td>
                      </tr>
                    )
                  )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LOW STOCK TABLE */}

      <div className="bg-white rounded-3xl shadow-sm mt-8 overflow-hidden">

        <div className="px-6 py-5 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Low Stock Medicines
          </h2>
        </div>

        {lowStockProducts.length ===
        0 ? (
          <div className="p-8 text-center text-green-600 font-semibold">
            Inventory healthy
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">

              <thead className="bg-red-50">
                <tr>
                  <th className="px-5 py-3 text-left">
                    Medicine
                  </th>

                  <th className="px-5 py-3 text-left">
                    Stock
                  </th>

                  <th className="px-5 py-3 text-left">
                    Reorder
                  </th>
                </tr>
              </thead>

              <tbody>
                {lowStockProducts.map(
                  (
                    product
                  ) => (
                    <tr
                      key={
                        product.id
                      }
                      className="border-t hover:bg-red-50"
                    >
                      <td className="px-5 py-4 font-medium">
                        {
                          product.product_name
                        }
                      </td>

                      <td className="px-5 py-4 text-red-600 font-semibold">
                        {
                          product.stock_quantity
                        }
                      </td>

                      <td className="px-5 py-4">
                        {
                          product.reorder_level
                        }
                      </td>
                    </tr>
                  )
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