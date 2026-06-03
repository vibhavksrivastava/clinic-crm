'use client';

import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function AppointmentFormModal({ open, onClose, onSubmit }: Props) {
  const [form, setForm] = useState({
    patient_id: '',
    staff_id: '',
    date: '',
    time: '',
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-[400px]">
        <h2 className="text-lg font-bold mb-4">New Appointment</h2>

        <input
          placeholder="Patient ID"
          className="w-full border p-2 mb-2"
          onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
        />

        <input
          placeholder="Doctor ID"
          className="w-full border p-2 mb-2"
          onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
        />

        <button
          onClick={() => onSubmit(form)}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Save
        </button>

        <button onClick={onClose} className="mt-2 text-sm text-gray-500 w-full">
          Close
        </button>
      </div>
    </div>
  );
}