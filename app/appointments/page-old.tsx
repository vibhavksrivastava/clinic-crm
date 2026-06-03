'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppointments } from '@/hooks/useAppointments';
import AppointmentTable from '@/components/AppointmentTable';
import AppointmentFormModal from '@/components/AppointmentFormModal';

export default function AppointmentsPage() {
  const { userContext } = useAuth();
  const { appointments, refetch } = useAppointments();

  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (data: any) => {
    await fetch('/api/appointments', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    setShowForm(false);
    refetch();
  };

  const handleUpdateStatus = async (id: string, status: string) => {
        await fetch(`/api/appointments?id=${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    refetch();
  };

  return (
    <div className="p-6">

      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Appointments</h1>

        {userContext?.roleType === 'receptionist' && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            New Appointment
          </button>
        )}
      </div>

      <AppointmentTable
        appointments={appointments}
        onMarkOngoing={(id) => handleUpdateStatus(id, 'ongoing')}
        onComplete={(id) => handleUpdateStatus(id, 'completed')}
        onCancel={(id) => handleUpdateStatus(id, 'cancelled')}
      />

      <AppointmentFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}