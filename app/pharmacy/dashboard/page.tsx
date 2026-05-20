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

const statsCards = [
  {
    title: 'Total Inventory Value',
    value: '₹12,45,890',
    icon: IndianRupee,
    color: 'bg-green-100 text-green-700',
  },
  {
    title: 'Out Of Stock',
    value: '18',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-700',
  },
  {
    title: "Today's Revenue",
    value: '₹28,450',
    icon: Activity,
    color: 'bg-blue-100 text-blue-700',
  },
  {
    title: 'GST Collected',
    value: '₹4,280',
    icon: Receipt,
    color: 'bg-yellow-100 text-yellow-700',
  },
  {
    title: 'Total Products',
    value: '2,438',
    icon: Pill,
    color: 'bg-purple-100 text-purple-700',
  },
  {
    title: 'Near Expiry',
    value: '26',
    icon: Clock3,
    color: 'bg-orange-100 text-orange-700',
  },
];

const dashboardFeatures = [
  {
    title: 'Total Medicines',
    value: '2438',
    icon: Pill,
    color: 'bg-blue-500',
  },
  {
    title: "Today's Sales",
    value: '₹28,450',
    icon: IndianRupee,
    color: 'bg-green-500',
  },
  {
    title: 'Low Stock Alerts',
    value: '34',
    icon: AlertTriangle,
    color: 'bg-red-500',
  },
  {
    title: 'Expiring Medicines',
    value: '26',
    icon: Clock3,
    color: 'bg-orange-500',
  },
  {
    title: 'Pending Purchase Orders',
    value: '12',
    icon: ShoppingCart,
    color: 'bg-purple-500',
  },
];

const topSellingMedicines = [
  {
    name: 'Paracetamol 650',
    sold: 245,
  },
  {
    name: 'Azithromycin',
    sold: 198,
  },
  {
    name: 'Vitamin D3',
    sold: 175,
  },
  {
    name: 'Cetirizine',
    sold: 152,
  },
];

const recentBills = [
  {
    billNo: 'INV-1024',
    customer: 'Rahul Sharma',
    amount: '₹1,250',
    status: 'Paid',
  },
  {
    billNo: 'INV-1025',
    customer: 'Sneha Patil',
    amount: '₹860',
    status: 'Paid',
  },
  {
    billNo: 'INV-1026',
    customer: 'Amit Verma',
    amount: '₹2,450',
    status: 'Pending',
  },
];

const quickActions = [
  {
    title: 'Add Suppliers',
    icon: Plus,
    color: 'bg-blue-600',
    link: '/pharmacy/suppliers', // ✅ NEW LINK FOR ADD suppliers
  },
  {
    title: 'Create Bill',
    icon: FileText,
    color: 'bg-green-600',
    link: '/pharmacy/bills/create', // ✅ NEW LINK FOR CREATE BILL
  },
  {
    title: 'Purchase Orders',
    icon: Truck,
    color: 'bg-purple-600',
    link: '/pharmacy/purchase-orders', // ✅ NEW LINK FOR PURCHASE ORDER
  },
  {
    title: 'Sales Report',
    icon: BarChart3,
    color: 'bg-orange-600',
    link: '/pharmacy/reports/sales', // ✅ NEW LINK FOR SALES REPORT
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

        {/* Feature Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {dashboardFeatures.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{item.title}</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-800">
                      {item.value}
                    </h2>
                  </div>

                  <div className={`rounded-xl p-3 text-white ${item.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Stats Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statsCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <div
                key={index}
                className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.title}</p>
                    <h2 className="mt-3 text-3xl font-bold text-gray-800">
                      {card.value}
                    </h2>
                  </div>

                  <div className={`rounded-2xl p-4 ${card.color}`}>
                    <Icon size={28} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Top Selling Medicines */}
          <div className="rounded-2xl bg-white p-5 shadow-sm xl:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Top Selling Medicines
              </h2>

              <button className="text-sm font-medium text-blue-600">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {topSellingMedicines.map((medicine, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-3"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {medicine.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {medicine.sold} units sold
                    </p>
                  </div>

                  <div className="rounded-lg bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                    Top
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Bills */}
          <div className="rounded-2xl bg-white p-5 shadow-sm xl:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Recent Bills
              </h2>

              <button className="text-sm font-medium text-blue-600">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {recentBills.map((bill, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {bill.billNo}
                      </p>
                      <p className="text-sm text-gray-500">
                        {bill.customer}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        {bill.amount}
                      </p>

                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${
                          bill.status === 'Paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {bill.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

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