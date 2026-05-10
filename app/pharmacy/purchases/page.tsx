'use client';

export default function PurchasesPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Supplier Purchases</h1>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          + New Purchase
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Supplier</th>
              <th className="p-3 text-left">Invoice</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Amount</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-t">
              <td className="p-3">ABC Pharma</td>
              <td className="p-3">INV-1001</td>
              <td className="p-3">10-May-2026</td>
              <td className="p-3">₹15,400</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}