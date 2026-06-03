'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Printer,
  Receipt,
  User,
  Phone,
  Calendar,
  CreditCard,
  FileText,
  Package,
  ShieldCheck,
  CircleDollarSign,
  Building2,
  CheckCircle2,
} from 'lucide-react';

interface SaleItem {
  id: string;
  quantity: number;
  unit_price: number;
  gst_percent: number;
  total_amount: number;
  pharmacy_products?: {
    name: string;
    category?: string;
  };
}

interface Customer {
  name?: string;
  phone?: string;
}

interface Sale {
  id: string;
  invoice_number: string;
  created_at?: string;
  payment_method?: string;
  subtotal?: number;
  gst_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  pharmacy_customers?: Customer;
  pharmacy_sale_items?: SaleItem[];
}

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInvoice = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/pharmacy/sales/${params.id}`
      );

      const data = await response.json();

      setSale(data);
    } catch (error) {
      console.error('Failed to fetch invoice', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, []);

  const totalItems = useMemo(() => {
    return (
      sale?.pharmacy_sale_items?.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      ) || 0
    );
  }, [sale]);

  const paymentBadgeClass = useMemo(() => {
    switch (sale?.payment_method) {
      case 'cash':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'upi':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'card':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }, [sale]);

  const formatCurrency = (amount?: number) => {
    return `₹${Number(amount || 0).toFixed(2)}`;
  };

  const handlePrint = () => {
    window.print();
};

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">

        <div className="mx-auto max-w-7xl p-4 md:p-6">
          <div className="animate-pulse rounded-3xl bg-white p-8 shadow-sm">
            <div className="mb-6 h-8 w-56 rounded bg-gray-200" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((x) => (
                <div
                  key={x}
                  className="h-28 rounded-2xl bg-gray-100"
                />
              ))}
            </div>

            <div className="mt-8 h-96 rounded-2xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-slate-100">

        <div className="flex h-[70vh] items-center justify-center">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <Receipt className="mx-auto mb-4 text-gray-400" size={48} />

            <h2 className="text-2xl font-bold text-gray-900">
              Invoice Not Found
            </h2>

            <p className="mt-2 text-gray-500">
              Unable to load invoice details.
            </p>

            <button
              onClick={() => router.push('/pharmacy/sales')}
              className="mt-6 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Back To Sales
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 print:bg-white">

      <style jsx global>{`
  @media print {

    html,
    body {
      background: white !important;
      overflow: visible !important;
      height: auto !important;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body * {
      visibility: hidden;
    }

    #print-invoice,
    #print-invoice * {
      visibility: visible;
    }

    #print-invoice {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      background: white;
      margin: 0;
      padding: 0;
    }

    .no-print {
      display: none !important;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    thead {
      display: table-header-group;
    }

    tfoot {
      display: table-footer-group;
    }
  }
`}</style>
      
      <div className="print:hidden">
      </div>
      <main className="mx-auto max-w-7xl p-4 md:p-6">
        {/* Top Action Bar */}
        <div className="no-print mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              onClick={() => router.push('/pharmacy/sales')}
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
            >
              <ArrowLeft size={16} />
              Back To Sales
            </button>

            <h1 className="text-3xl font-bold text-gray-900">
              Sales Invoice
            </h1>

            <p className="mt-1 text-gray-500">
              Invoice details, billing summary &
              transaction records
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
            >
              <Printer size={18} />
              Print Invoice
            </button>

            <button
              onClick={() =>
                router.push('/pharmacy/sales/create')
              }
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:scale-[1.02]"
            >
              <Receipt size={18} />
              New Invoice
            </button>
          </div>
        </div>

        {/* Main Invoice */}
        <div
  id="print-invoice"
  className="rounded-[28px] border border-gray-200 bg-white shadow-sm print:rounded-none print:border-none print:shadow-none"
></div>
          <div className="border-b border-gray-100 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
                  <ShieldCheck size={16} />
                  Pharmacy Billing System
                </div>

                <h1 className="text-3xl font-bold md:text-4xl">
                  {sale.invoice_number}
                </h1>

                <p className="mt-2 text-slate-300">
                  Generated Invoice & Billing Receipt
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                  <Calendar size={15} />
                  Invoice Date
                </div>

                <p className="text-lg font-semibold">
                  {sale.created_at
                    ? new Date(
                        sale.created_at
                      ).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 border-b border-gray-100 p-6 md:grid-cols-4 md:p-8">
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Total Amount
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-blue-900">
                    {formatCurrency(sale.total_amount)}
                  </h2>
                </div>

                <div className="rounded-2xl bg-blue-600 p-3 text-white">
                  <CircleDollarSign size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-green-100 bg-green-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Payment Method
                  </p>

                  <h2 className="mt-2 text-xl font-bold capitalize text-green-900">
                    {sale.payment_method || '-'}
                  </h2>
                </div>

                <div className="rounded-2xl bg-green-600 p-3 text-white">
                  <CreditCard size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-purple-100 bg-purple-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">
                    Total Medicines
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-purple-900">
                    {totalItems}
                  </h2>
                </div>

                <div className="rounded-2xl bg-purple-600 p-3 text-white">
                  <Package size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">
                    Invoice Status
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-orange-900">
                    Completed
                  </h2>
                </div>

                <div className="rounded-2xl bg-orange-600 p-3 text-white">
                  <CheckCircle2 size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Customer + Payment */}
          <div className="grid grid-cols-1 gap-6 border-b border-gray-100 p-6 md:grid-cols-2 md:p-8">
            {/* Customer */}
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                  <User size={22} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Customer Details
                  </h2>

                  <p className="text-sm text-gray-500">
                    Patient / walk-in customer info
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Customer Name
                  </p>

                  <p className="font-semibold text-gray-900">
                    {sale.pharmacy_customers?.name ||
                      'Walk-in Customer'}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Phone Number
                  </p>

                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone size={15} />
                    {sale.pharmacy_customers?.phone ||
                      'Not Provided'}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-green-100 p-3 text-green-700">
                  <CreditCard size={22} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Payment Details
                  </h2>

                  <p className="text-sm text-gray-500">
                    Transaction & billing summary
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Payment Mode
                  </p>

                  <span
                    className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold capitalize ${paymentBadgeClass}`}
                  >
                    {sale.payment_method || '-'}
                  </span>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Invoice Number
                  </p>

                  <div className="flex items-center gap-2 font-semibold text-gray-900">
                    <FileText size={15} />
                    {sale.invoice_number}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Table */}
          <div className="p-6 md:p-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Invoice Items
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Medicines included in this invoice
                </p>
              </div>

              <div className="hidden rounded-2xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 md:block">
                {sale.pharmacy_sale_items?.length || 0}{' '}
                Items
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        Medicine
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        Quantity
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        Unit Price
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        GST
                      </th>

                      <th className="px-6 py-4 text-right text-sm font-bold text-slate-700">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {sale.pharmacy_sale_items?.map(
                      (item, index) => (
                        <tr
                          key={item.id}
                          className={`border-t border-gray-100 ${
                            index % 2 === 0
                              ? 'bg-white'
                              : 'bg-gray-50/40'
                          }`}
                        >
                          <td className="px-6 py-5">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {
                                  item.pharmacy_products
                                    ?.name
                                }
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {
                                  item.pharmacy_products
                                    ?.category
                                }
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                              {item.quantity}
                            </span>
                          </td>

                          <td className="px-6 py-5 font-medium text-gray-700">
                            {formatCurrency(
                              item.unit_price
                            )}
                          </td>

                          <td className="px-6 py-5">
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                              {item.gst_percent}%
                            </span>
                          </td>

                          <td className="px-6 py-5 text-right text-base font-bold text-gray-900">
                            {formatCurrency(
                              item.total_amount
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="mt-8 flex justify-end">
              <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-slate-50 p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-900 p-2 text-white">
                    <Building2 size={18} />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">
                    Billing Summary
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Subtotal</span>

                    <span className="font-semibold text-gray-900">
                      {formatCurrency(sale.subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <span>GST Amount</span>

                    <span className="font-semibold text-gray-900">
                      {formatCurrency(sale.gst_amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <span>Discount</span>

                    <span className="font-semibold text-gray-900">
                      {formatCurrency(
                        sale.discount_amount
                      )}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-gray-300 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        Grand Total
                      </span>

                      <span className="text-2xl font-bold text-blue-700">
                        {formatCurrency(
                          sale.total_amount
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 rounded-3xl bg-slate-900 p-6 text-center text-white">
              <h3 className="text-lg font-semibold">
                Thank You For Your Purchase
              </h3>

              <p className="mt-2 text-sm text-slate-300">
                Medicines once sold will not be taken back
                unless approved by management.
              </p>
            </div>
          </div> {/* print-invoice */}

</main>
    </div>
  );
}