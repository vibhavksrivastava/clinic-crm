'use client';

export default function PharmacyDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Pharmacy Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-xl p-5 border">
          <h2 className="text-sm text-gray-500">Today's Sales</h2>
          <p className="text-3xl font-bold mt-2">₹12,540</p>
        </div>

        <div className="bg-white shadow rounded-xl p-5 border">
          <h2 className="text-sm text-gray-500">Medicines</h2>
          <p className="text-3xl font-bold mt-2">1,240</p>
        </div>

        <div className="bg-white shadow rounded-xl p-5 border">
          <h2 className="text-sm text-gray-500">Low Stock</h2>
          <p className="text-3xl font-bold mt-2 text-red-600">18</p>
        </div>

        <div className="bg-white shadow rounded-xl p-5 border">
          <h2 className="text-sm text-gray-500">Expired</h2>
          <p className="text-3xl font-bold mt-2 text-orange-600">5</p>
        </div>
      </div>
    </div>
  );
}