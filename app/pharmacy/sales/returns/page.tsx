'use client';

import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardUrl } from '@/lib/utils/dashboard';
import {
  RotateCcw,
  Search,
  CheckCircle,
  Plus,
  RefreshCw,
  Receipt
} from 'lucide-react';

interface SalesReturn {
  id: string;
  return_number: string;
  refund_amount: number;
  status: string;
  created_at: string;
  sale?: {
    invoice_number?: string;
  };
}

export default function SalesReturnsPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [returns, setReturns] =
    useState<SalesReturn[]>(
      []
    );

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState('All');

  const loadReturns =
    async () => {
      try {
        setLoading(true);

        let url =
          '/api/pharmacy/sales-returns';

        if (
          status !== 'All'
        ) {
          url += `?status=${status}`;
        }

        const res =
          await fetch(
            url
          );

        const data =
          await res.json();

        setReturns(
          data || []
        );
      } catch (err) {
        console.error(
          err
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadReturns();
  }, [status]);

  const filtered =
    useMemo(() => {
      return returns.filter(
        (r) =>
          r.return_number
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||
          r.sale?.invoice_number
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );
    }, [
      returns,
      search,
    ]);

  const approveReturn =
    async (
      id: string
    ) => {
      const ok =
        confirm(
          'Approve sales return?'
        );

      if (!ok) return;

      try {
        const res =
          await fetch(
            '/api/pharmacy/sales-returns/approve',
            {
              method:
                'POST',
              headers:
                {
                  'Content-Type':
                    'application/json',
                },
              body: JSON.stringify(
                {
                  sales_return_id:
                    id,
                }
              ),
            }
          );

        const data =
          await res.json();

        if (
          !res.ok
        ) {
          alert(
            data.error
          );
          return;
        }

        alert(
          'Return approved'
        );

        loadReturns();
      } catch (
        err
      ) {
        console.error(
          err
        );
      }
    };

  const card =
    'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm';

  const totalRefund =
    filtered.reduce(
      (
        a,
        b
      ) =>
        a +
        Number(
          b.refund_amount ||
            0
        ),
      0
    );

  const draftCount =
    filtered.filter(
      (r) =>
        r.status ===
        'Draft'
    ).length;

  const approvedCount =
    filtered.filter(
      (r) =>
        r.status ===
        'Approved'
    ).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      <Header />

      <div className="p-6 space-y-6">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Sales Returns
            </h1>

            <p className="text-slate-500 mt-1">
              Customer refund
              and return
              management
            </p>

          </div>

          <div className="flex gap-3">

            <button
              onClick={() =>
                router.push(
                  getDashboardUrl()
                )
              }
              className="px-4 py-2 rounded-xl border"
            >
              Dashboard
            </button>

            <button
              className="px-4 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2"
            >
              <Plus size={18} />
              Create Return
            </button>

          </div>

        </div>

        {/* KPI */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div
            className={`${card} p-5`}
          >
            <RotateCcw className="text-blue-600" />

            <p className="text-sm text-slate-500 mt-2">
              Total Returns
            </p>

            <h2 className="text-3xl font-bold mt-1">
              {
                filtered.length
              }
            </h2>
          </div>

          <div
            className={`${card} p-5`}
          >
            <Receipt className="text-green-600" />

            <p className="text-sm text-slate-500 mt-2">
              Refund Amount
            </p>

            <h2 className="text-3xl font-bold mt-1">
              ₹
              {totalRefund.toLocaleString()}
            </h2>
          </div>

          <div
            className={`${card} p-5`}
          >
            <CheckCircle className="text-purple-600" />

            <p className="text-sm text-slate-500 mt-2">
              Approved
            </p>

            <h2 className="text-3xl font-bold mt-1">
              {
                approvedCount
              }
              /
              {
                filtered.length
              }
            </h2>
          </div>

        </div>

        {/* FILTER */}

        <div
          className={`${card} p-4`}
        >

          <div className="flex flex-col md:flex-row gap-3">

            <div className="relative flex-1">

              <Search
                size={18}
                className="absolute left-3 top-3 text-slate-400"
              />

              <input
                value={
                  search
                }
                onChange={(
                  e
                ) =>
                  setSearch(
                    e.target
                      .value
                  )
                }
                placeholder="Search return / invoice"
                className="w-full border rounded-xl pl-10 pr-4 py-2 bg-white dark:bg-slate-950"
              />

            </div>

            <select
              value={
                status
              }
              onChange={(
                e
              ) =>
                setStatus(
                  e.target
                    .value
                )
              }
              className="border rounded-xl px-3 py-2"
            >
              <option>
                All
              </option>
              <option>
                Draft
              </option>
              <option>
                Approved
              </option>
            </select>

            <button
              onClick={
                loadReturns
              }
              className="px-4 py-2 rounded-xl border flex items-center gap-2"
            >
              <RefreshCw
                size={16}
              />
              Refresh
            </button>

          </div>

        </div>

        {/* TABLE */}

        <div
          className={`${card} overflow-hidden`}
        >

          <div className="overflow-auto">

            <table className="w-full min-w-[900px]">

              <thead className="bg-slate-100 dark:bg-slate-800">

                <tr>

                  <th className="text-left p-4">
                    Return No
                  </th>

                  <th className="text-left p-4">
                    Invoice
                  </th>

                  <th className="text-left p-4">
                    Date
                  </th>

                  <th className="text-right p-4">
                    Refund
                  </th>

                  <th className="text-center p-4">
                    Status
                  </th>

                  <th className="text-center p-4">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td
                      colSpan={
                        6
                      }
                      className="p-10 text-center"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={
                        6
                      }
                      className="p-10 text-center text-slate-500"
                    >
                      No returns found
                    </td>
                  </tr>
                ) : (
                  filtered.map(
                    (
                      item
                    ) => (
                      <tr
                        key={
                          item.id
                        }
                        className="border-t hover:bg-slate-50 dark:hover:bg-slate-900"
                      >

                        <td className="p-4 font-medium">
                          {
                            item.return_number
                          }
                        </td>

                        <td className="p-4">
                          {item.sale
                            ?.invoice_number ||
                            '-'}
                        </td>

                        <td className="p-4">
                          {new Date(
                            item.created_at
                          ).toLocaleDateString()}
                        </td>

                        <td className="p-4 text-right font-semibold">
                          ₹
                          {Number(
                            item.refund_amount ||
                              0
                          ).toLocaleString()}
                        </td>

                        <td className="p-4 text-center">

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.status ===
                              'Approved'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {
                              item.status
                            }
                          </span>

                        </td>

                        <td className="p-4">

                          <div className="flex justify-center gap-2">

                            <button
                              onClick={() =>
                                router.push(
                                  `/pharmacy/sales/returns/${item.id}`
                                )
                              }
                              className="px-3 py-1 rounded-lg border text-sm"
                            >
                              View
                            </button>

                            {item.status ===
                              'Draft' && (
                              <button
                                onClick={() =>
                                  approveReturn(
                                    item.id
                                  )
                                }
                                className="px-3 py-1 rounded-lg bg-green-600 text-white text-sm"
                              >
                                Approve
                              </button>
                            )}

                          </div>

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}