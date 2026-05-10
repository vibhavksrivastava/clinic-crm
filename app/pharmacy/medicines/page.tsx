'use client';

import { useState } from 'react';

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState([]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Medicine Master</h1>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          + Add Medicine
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Medicine</th>
              <th className="p-3 text-left">Generic</th>
              <th className="p-3 text-left">Manufacturer</th>
              <th className="p-3 text-left">GST</th>
            </tr>
          </thead>

          <tbody>
            {medicines.map((med: any, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-3">{med.name}</td>
                <td className="p-3">{med.generic_name}</td>
                <td className="p-3">{med.manufacturer}</td>
                <td className="p-3">{med.gst_percent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}