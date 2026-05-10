'use client';

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Reports & GST</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white shadow rounded-xl p-5 border">
          <h2 className="text-sm text-gray-500">Monthly Sales</h2>
          <p className="text-3xl font-bold mt-2">₹4,52,000</p>
        </div>

        <div className="bg-white shadow rounded-xl p-5 border">
          <h2 className="text-sm text-gray-500">GST Collected</h2>
          <p className="text-3xl font-bold mt-2">₹54,200</p>
        </div>

        <div className="bg-white shadow rounded-xl p-5 border">
          <h2 className="text-sm text-gray-500">Profit</h2>
          <p className="text-3xl font-bold mt-2 text-green-600">
            ₹1,12,000
          </p>
        </div>

      </div>
    </div>
  );
}