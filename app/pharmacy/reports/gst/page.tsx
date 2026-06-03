'use client';

import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardUrl } from '@/lib/utils/dashboard';
import {
  TrendingUp,
  Receipt,
  Wallet,
  FileBarChart2,
  Download,
  Activity,
  RefreshCw
} from 'lucide-react';
import { getPharmacyDashboardUrl } from '@/lib/utils/pharmacyDashboard';

interface GSTSummary {
  inputGST: number;
  outputGST: number;
  netGST: number;
  itcAvailable: number;
}

interface ProductRow {
  product_id: string;
  product_name: string;
  hsn_code: string;
  purchase_qty: number;
  sales_qty: number;
  taxable_amount: number;
  total_input_gst: number;
  input_gst_used: number;
  output_gst: number;
  net_gst: number;
  status: string;
}

interface GSTRate {
  rate: number;
  gst: number;
}

export default function GSTDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [summary, setSummary] =
    useState<GSTSummary | null>(
      null
    );

  const [products, setProducts] =
    useState<ProductRow[]>([]);

  const [gstRates, setGstRates] =
    useState<GSTRate[]>([]);

  const [from, setFrom] =
    useState('');

  const [to, setTo] =
    useState('');

  const loadData = async () => {
    try {
      setLoading(true);

      let url =
        '/api/pharmacy/reports/gst/dashboard';

      const params =
        new URLSearchParams();

      if (from)
        params.append(
          'from',
          from
        );

      if (to)
        params.append(
          'to',
          to
        );

      if (
        params.toString()
      ) {
        url +=
          '?' +
          params.toString();
      }

      const res =
        await fetch(url);

      const data =
        await res.json();

      setSummary(
        data.summary
      );

      setProducts(
        data.productComparison ||
          []
      );

      setGstRates(
        data.gstByRate ||
          []
      );
    } catch (error) {
      console.error(
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const cardClass =
    'bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/*<Header />*/}

      <div className="p-6 space-y-6">

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
              GST Dashboard
            </h2>

            <p className="mt-3 text-blue-100 max-w-2xl">
              Monitor GST compliance,
              input and output tax
              from one centralized
              dashboard. Get insights
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl px-6 py-5">
            <button
            onClick={() =>
              router.push(
                getPharmacyDashboardUrl ()
              )
            }
            className="px-4 py-2 rounded-xl bg-blue-900 text-white"
          >
            Dashboard
          </button>
          </div>
        </div>
      </div>

        {/* FILTERS */}

        <div className={`${cardClass} sticky top-4 z-20`}>

          <div className="flex flex-wrap gap-4 items-end">

            <div>
              <label className="text-sm text-slate-500">
                From
              </label>

              <input
                type="date"
                value={from}
                onChange={(e) =>
                  setFrom(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-slate-500">
                To
              </label>

              <input
                type="date"
                value={to}
                onChange={(e) =>
                  setTo(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl px-3 py-2 mt-1"
              />
            </div>

            <button
              onClick={
                loadData
              }
              className="px-5 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Apply
            </button>

            <button
              className="px-5 py-2 rounded-xl border flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </button>

          </div>
        </div>

        {/* KPI */}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i=>(
              <div
                key={i}
                className="h-32 rounded-2xl bg-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : (

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <div className={cardClass}>
              <Receipt className="text-blue-600" />
              <p className="text-sm text-slate-500 mt-2">
                Input GST
              </p>
              <h2 className="text-3xl font-bold mt-1">
                ₹
                {summary?.inputGST.toLocaleString()}
              </h2>
            </div>

            <div className={cardClass}>
              <TrendingUp className="text-green-600" />
              <p className="text-sm text-slate-500 mt-2">
                Output GST
              </p>
              <h2 className="text-3xl font-bold mt-1">
                ₹
                {summary?.outputGST.toLocaleString()}
              </h2>
            </div>

            <div className={cardClass}>
              <Wallet className="text-red-600" />
              <p className="text-sm text-slate-500 mt-2">
                Net GST
              </p>
              <h2 className="text-3xl font-bold mt-1">
                ₹
                {summary?.netGST.toLocaleString()}
              </h2>
            </div>

            <div className={cardClass}>
              <FileBarChart2 className="text-purple-600" />
              <p className="text-sm text-slate-500 mt-2">
                ITC Available
              </p>
              <h2 className="text-3xl font-bold mt-1">
                ₹
                {summary?.itcAvailable.toLocaleString()}
              </h2>
            </div>

          </div>
        )}

        {/* GST RATE */}

        <div className={cardClass}>

          <h2 className="font-semibold text-lg mb-4">
            GST Slab Summary
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {gstRates.map(
              (item) => (
                <div
                  key={
                    item.rate
                  }
                  className="rounded-xl bg-slate-100 dark:bg-slate-800 p-4"
                >
                  <div className="text-sm text-slate-500">
                    {
                      item.rate
                    }
                    %
                    GST
                  </div>

                  <div className="text-2xl font-bold mt-1">
                    ₹
                    {item.gst.toLocaleString()}
                  </div>
                </div>
              )
            )}

          </div>
        </div>

        {/* TABLE */}

        <div className={cardClass}>

          <h2 className="font-semibold text-lg mb-4">
            Product GST Comparison
          </h2>

          <div className="overflow-auto">

            <table className="w-full">

              <thead>

                <tr className="border-b">

                  <th className="text-left p-3">
                    Product
                  </th>

                  <th className="text-left p-3">
                    HSN
                  </th>

                  <th className="p-3">
                    Purchase
                  </th>

                  <th className="p-3">
                    Sales
                  </th>

                    <th className="p-3">
                    Total Input GST
                    </th>

                    <th className="p-3">
                    Input GST Used
                    </th>
                  <th className="p-3">
                    Output GST
                  </th>

                  <th className="p-3">
                    Net GST
                  </th>

                  <th className="p-3">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {products.map(
                  (item) => (
                    <tr
                      key={
                        item.product_id
                      }
                      className="border-b hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      <td className="p-3 font-medium">
                        {
                          item.product_name
                        }
                      </td>

                      <td className="p-3">
                        {
                          item.hsn_code
                        }
                      </td>

                      <td className="p-3 text-center">
                        {
                          item.purchase_qty
                        }
                      </td>

                      <td className="p-3 text-center">
                        {
                          item.sales_qty
                        }
                      </td>

                      <td className="p-3 text-center">
  ₹
  {item.total_input_gst.toLocaleString()}
</td>

<td className="p-3 text-center">
  ₹
  {item.input_gst_used.toLocaleString()}
</td>
                      <td className="p-3 text-center">
                        ₹
                        {
                          item.output_gst
                        }
                      </td>

                      <td className="p-3 text-center font-semibold">
                        ₹
                        {
                          item.net_gst
                        }
                      </td>

                      <td className="p-3 text-center">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.status ===
                            'Payable'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {
                            item.status
                          }
                        </span>

                      </td>

                    </tr>
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