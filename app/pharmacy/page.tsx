'use client';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import {
  Package,
  AlertTriangle,
  IndianRupee,
  Receipt,
  Pill,
  Clock3,
  ShoppingCart,
  Activity,
  Plus,
  FileText,
  Truck,
  BarChart3,
} from 'lucide-react';


const quickActions = [
  {
    title: 'Add Suppliers',
    icon: Plus,
    color: 'bg-blue-600',
    link: '/pharmacy/suppliers', // ✅ NEW LINK FOR ADD suppliers
  },
  {
    title: 'Create Purchase Order',
    icon: Truck,
    color: 'bg-green-600',
    link: '/pharmacy/purchase-orders/create', // ✅ NEW LINK FOR CREATE BILL
  },
  {
    title: 'View Purchase Orders',
    icon: FileText,
    color: 'bg-purple-600',
    link: '/pharmacy/purchase-orders', // ✅ NEW LINK FOR PURCHASE ORDER
  },
  {
    title: 'Dashboard',
    icon: Activity,
    color: 'bg-orange-600',
    link: '/pharmacy/dashboard', // ✅ NEW LINK FOR SALES REPORT
  },

    {
    title: 'Sales Report',
    icon: BarChart3,
    color: 'bg-orange-600',
    link: '/pharmacy/reports', // ✅ NEW LINK FOR SALES REPORT
  },

];

export default function PharmacyDashboardPage() {
  const router = useRouter(); // ✅ THIS LINE IS REQUIRED
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Same CRM Header */}
      <Header />

      <main className="p-4 md:p-6">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Pharmacy Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Manage pharmacy inventory, billing & sales
            </p>
          </div>

          <button
           onClick={() => router.push('/pharmacy/products')} // ✅ NAVIGATE TO NEW MEDICINE PAGE
           className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700">
            + Add New Medicine
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Quick Actions */}
          <div className="rounded-2xl bg-white p-5 shadow-sm xl:col-span-1">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Quick Actions
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;

                return (
                  <button
                    onClick={() => router.push(action.link)} // ✅ NAVIGATE TO NEW MEDICINE PAGE
           
                    key={index}
                    className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 p-5 transition hover:scale-[1.02] hover:shadow-md"
                  >
                    <div className={`rounded-2xl p-4 text-white ${action.color}`}>
                      <Icon size={24} />
                    </div>

                    <span className="mt-3 text-sm font-semibold text-gray-700">
                      {action.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}