'use client';

export default function InventoryPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Inventory Management</h1>

      <div className="bg-white rounded-xl shadow border overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Medicine</th>
              <th className="p-3 text-left">Batch</th>
              <th className="p-3 text-left">Expiry</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">MRP</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-t">
              <td className="p-3">Paracetamol</td>
              <td className="p-3">PCM001</td>
              <td className="p-3">12/2027</td>
              <td className="p-3 text-green-600 font-bold">120</td>
              <td className="p-3">₹55</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}