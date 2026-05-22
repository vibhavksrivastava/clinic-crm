'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Receipt,
  IndianRupee,
  CreditCard,
  CalendarDays,
  Eye,
  Plus,
  TrendingUp,
  Wallet,
  Smartphone,
  BadgeDollarSign,
  RefreshCcw,
} from 'lucide-react';

interface Sale {
  id: string;
  invoice_number: string;
  total_amount: number;
  payment_method: 'cash' | 'upi' | 'card';
  created_at: string;

  pharmacy_customers?: {
    name?: string;
    phone?: string;
  };
}

type FilterType = 'all' | 'cash' | 'upi' | 'card';

export default function PharmacySalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>('all');

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

  // ================= SUMMARY =================
  const totalSales = sales.length;

  const totalRevenue = sales.reduce(
    (sum, sale) =>
      sum + Number(sale.total_amount || 0),
    0
  );

  const todaySales = sales.filter((sale) => {
    const today = new Date();

    const saleDate = new Date(
      sale.created_at
    );

    return (
      saleDate.toDateString() ===
      today.toDateString()
    );
  });

  const todayRevenue = todaySales.reduce(
    (sum, sale) =>
      sum + Number(sale.total_amount || 0),
    0
  );

  const cashSales = sales.filter(
    (sale) => sale.payment_method === 'cash'
  ).length;

  const upiSales = sales.filter(
    (sale) => sale.payment_method === 'upi'
  ).length;

  const cardSales = sales.filter(
    (sale) => sale.payment_method === 'card'
  ).length;

  // ================= FILTER =================
  const filteredSales = useMemo(() => {
    let filtered = sales;

    filtered = filtered.filter((sale) => {
      const invoice =
        sale.invoice_number?.toLowerCase() ||
        '';

      const customer =
        sale.pharmacy_customers?.name?.toLowerCase() ||
        '';

      const phone =
        sale.pharmacy_customers?.phone?.toLowerCase() ||
        '';

      const q = search.toLowerCase();

      return (
        invoice.includes(q) ||
        customer.includes(q) ||
        phone.includes(q)
      );
    });

    switch (selectedFilter) {
      case 'cash':
        return filtered.filter(
          (sale) =>
            sale.payment_method === 'cash'
        );

      case 'upi':
        return filtered.filter(
          (sale) =>
            sale.payment_method === 'upi'
        );

      case 'card':
        return filtered.filter(
          (sale) =>
            sale.payment_method === 'card'
        );

      default:
        return filtered;
    }
  }, [sales, search, selectedFilter]);

  // ================= HELPERS =================
  const getPaymentBadge = (
    payment: string
  ) => {
    switch (payment) {
      case 'cash':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';

      case 'upi':
        return 'bg-blue-50 text-blue-700 border border-blue-200';

      case 'card':
        return 'bg-purple-50 text-purple-700 border border-purple-200';

      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getFilterCardClass = (
    filter: FilterType,
    activeClass: string
  ) => {
    return `
      rounded-3xl border p-5 transition-all cursor-pointer
      shadow-sm hover:shadow-md
      ${
        selectedFilter === filter
          ? `${activeClass} scale-[1.02] border-transparent`
          : 'bg-white border-gray-200 hover:border-gray-300'
      }
    `;
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <Header />

      <main className="p-4 md:p-6">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
              <Receipt size={16} />
              Pharmacy Billing
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              Sales Management
            </h1>

            <p className="mt-2 text-gray-500">
              Manage pharmacy invoices,
              customer billing & payment
              transactions
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchSales}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>

            <Link
              href="/pharmacy/sales/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:scale-[1.02]"
            >
              <Plus size={18} />
              Create Sale
            </Link>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {/* Total Sales */}
          <div
            onClick={() =>
              setSelectedFilter('all')
            }
            className={getFilterCardClass(
              'all',
              'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-white/20 p-3">
                <Receipt size={22} />
              </div>

              <span className="text-sm font-medium opacity-90">
                Total
              </span>
            </div>

            <h2 className="mt-5 text-3xl font-bold">
              {totalSales}
            </h2>

            <p className="mt-1 text-sm opacity-90">
              Total Invoices
            </p>
          </div>

          {/* Revenue */}
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-green-100 p-3">
                <IndianRupee
                  size={22}
                  className="text-green-700"
                />
              </div>

              <span className="text-sm text-gray-500">
                Revenue
              </span>
            </div>

            <h2 className="mt-5 text-2xl font-bold text-green-700">
              ₹
              {totalRevenue.toLocaleString(
                'en-IN'
              )}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Total Sales Revenue
            </p>
          </div>

          {/* Today */}
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-orange-100 p-3">
                <TrendingUp
                  size={22}
                  className="text-orange-700"
                />
              </div>

              <span className="text-sm text-gray-500">
                Today
              </span>
            </div>

            <h2 className="mt-5 text-2xl font-bold text-orange-700">
              ₹
              {todayRevenue.toLocaleString(
                'en-IN'
              )}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Today's Revenue
            </p>
          </div>

          {/* UPI */}
          <div
            onClick={() =>
              setSelectedFilter('upi')
            }
            className={getFilterCardClass(
              'upi',
              'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-white/20 p-3">
                <Smartphone size={22} />
              </div>

              <span className="text-sm opacity-90">
                UPI
              </span>
            </div>

            <h2 className="mt-5 text-3xl font-bold">
              {upiSales}
            </h2>

            <p className="mt-1 text-sm opacity-90">
              UPI Payments
            </p>
          </div>

          {/* Cash */}
          <div
            onClick={() =>
              setSelectedFilter('cash')
            }
            className={getFilterCardClass(
              'cash',
              'bg-gradient-to-br from-emerald-500 to-green-600 text-white'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-white/20 p-3">
                <Wallet size={22} />
              </div>

              <span className="text-sm opacity-90">
                Cash
              </span>
            </div>

            <h2 className="mt-5 text-3xl font-bold">
              {cashSales}
            </h2>

            <p className="mt-1 text-sm opacity-90">
              Cash Payments
            </p>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-4 top-3.5 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search invoice, customer or phone..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-2">
              {[
                {
                  key: 'all',
                  label: 'All',
                },
                {
                  key: 'cash',
                  label: 'Cash',
                },
                {
                  key: 'upi',
                  label: 'UPI',
                },
                {
                  key: 'card',
                  label: 'Card',
                },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() =>
                    setSelectedFilter(
                      filter.key as FilterType
                    )
                  }
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    selectedFilter ===
                    filter.key
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Sales Invoices
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Showing{' '}
                  {filteredSales.length} invoices
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 md:flex">
                <CalendarDays size={16} />
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Invoice
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Phone
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Amount
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Payment
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Date
                  </th>

                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-16 text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

                        <p className="text-sm text-gray-500">
                          Loading sales...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSales.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-16 text-center"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="rounded-full bg-gray-100 p-5">
                          <Receipt
                            size={40}
                            className="text-gray-400"
                          />
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-800">
                            No Sales Found
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            Try adjusting filters or
                            create a new invoice
                          </p>
                        </div>

                        <Link
                          href="/pharmacy/sales/create"
                          className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
                        >
                          <Plus size={16} />
                          Create Sale
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-t border-gray-100 transition hover:bg-blue-50/30"
                    >
                      {/* Invoice */}
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-bold text-gray-900">
                            {
                              sale.invoice_number
                            }
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Invoice ID:{' '}
                            {sale.id.slice(0, 8)}
                          </p>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {sale
                              .pharmacy_customers
                              ?.name ||
                              'Walk-in Customer'}
                          </p>

                          {!sale
                            .pharmacy_customers
                            ?.name && (
                            <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                              No Customer Linked
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-5 text-sm text-gray-600">
                        {sale.pharmacy_customers
                          ?.phone || '-'}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-1 rounded-2xl bg-green-50 px-3 py-2 font-bold text-green-700">
                          <BadgeDollarSign
                            size={16}
                          />
                          ₹
                          {Number(
                            sale.total_amount
                          ).toLocaleString(
                            'en-IN'
                          )}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold capitalize ${getPaymentBadge(
                            sale.payment_method
                          )}`}
                        >
                          <CreditCard
                            size={14}
                          />
                          {sale.payment_method}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-medium text-gray-800">
                            {new Date(
                              sale.created_at
                            ).toLocaleDateString()}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(
                              sale.created_at
                            ).toLocaleTimeString()}
                          </p>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-5 text-center">
                        <Link
                          href={`/pharmacy/sales/${sale.id}/view`}
                          className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          <Eye size={15} />
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