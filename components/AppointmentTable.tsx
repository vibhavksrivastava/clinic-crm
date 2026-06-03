'use client';

import { Appointment } from '@/hooks/useAppointments';

interface Props {
  appointments: Appointment[];
  onMarkOngoing: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}

export default function AppointmentTable({
  appointments,
  onMarkOngoing,
  onComplete,
  onCancel,
}: Props) {
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">ID</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {appointments.map((a) => (
            <tr key={a.id} className="border-t">
              <td className="p-3">{a.id}</td>

              <td className="p-3">{a.status}</td>

              <td className="p-3 flex gap-2">
                {a.status === 'scheduled' && (
                  <button
                    onClick={() => onMarkOngoing(a.id)}
                    className="px-2 py-1 bg-yellow-500 text-white rounded"
                  >
                    Start
                  </button>
                )}

                {a.status === 'ongoing' && (
                  <button
                    onClick={() => onComplete(a.id)}
                    className="px-2 py-1 bg-green-600 text-white rounded"
                  >
                    Complete
                  </button>
                )}

                {a.status !== 'completed' && (
                  <button
                    onClick={() => onCancel(a.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}