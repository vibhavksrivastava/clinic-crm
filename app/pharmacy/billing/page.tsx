'use client';

import { useState } from 'react';

export default function BillingPage() {
  const [items, setItems] = useState([
    {
      medicine: '',
      qty: 1,
      price: 0,
    },
  ]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Pharmacy Billing</h1>

      <div className="bg-white rounded-xl shadow border p-6">
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-4">
              <input
                placeholder="Medicine"
                className="border rounded-lg px-4 py-2"
              />

              <input
                type="number"
                placeholder="Qty"
                className="border rounded-lg px-4 py-2"
              />

              <input
                type="number"
                placeholder="Price"
                className="border rounded-lg px-4 py-2"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            + Add Item
          </button>

          <button className="bg-green-600 text-white px-6 py-2 rounded-lg">
            Generate Bill
          </button>
        </div>
      </div>
    </div>
  );
}