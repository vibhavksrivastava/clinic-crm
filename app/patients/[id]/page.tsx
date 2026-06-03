'use client';

import { useParams, usePathname  } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, GitGraphIcon, StepBackIcon } from 'lucide-react';

export default function PatientDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const patientId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('appointments');

  useEffect(() => {
    fetch(`/api/patients/${patientId}`)
      .then((res) => res.json())
      .then((res) => setData(res));
  }, [patientId]);

  if (!data) {
    return (
      <div>
        <div className="p-10">Loading...</div>
      </div>
    );
  }

  const tabs = [
    'appointments',
    'prescriptions',
    'invoices',
    'insurance',
    'emergencyContacts',
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      
      <div className="max-w-7xl mx-auto px-4 py-6">

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-2xl mb-8">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_25%)]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md mb-4">
              <Activity size={16} />
              MediQuick Rx
            </div>

            <p className="mt-3 text-blue-100 max-w-2xl">
              Patient Dashboard: Manage appointments, prescriptions, and history in one place.
            </p>
          </div>

                          
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md mb-4">
              <StepBackIcon size={18} />
                👨‍⚕️ Back to Patients
            </button>
        </div>
      </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mt-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {data.patient.first_name} {data.patient.last_name}
            </h1>
            <button
              onClick={() => window.open(`/patients/${patientId}/history`, '_blank')}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md mb-4">
                <GitGraphIcon size={18} />
                  History
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-2xl bg-blue-50">
              📞 {data.patient.phone}
            </div>

            <div className="p-4 rounded-2xl bg-green-50">
              ✉️ {data.patient.email}
            </div>

            <div className="p-4 rounded-2xl bg-purple-50">
              🎂 {data.patient.date_of_birth}
            </div>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-2xl font-semibold whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6">
          {activeTab === 'appointments' && (
            <div className="space-y-4">
              {data.appointments.map((item: any) => (
                <div key={item.id} className="p-5 rounded-2xl bg-blue-50">
                  <p className="font-bold">
                    {new Date(item.appointment_date).toLocaleString()}
                  </p>

                  <p className="text-sm text-gray-600 mt-1">
                    Status: {item.status}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              {data.prescriptions.map((item: any) => (
                <div key={item.id} className="p-5 rounded-2xl bg-green-50">
                  <p className="font-bold">
                    {item.medications?.[0]?.medication_name}
                  </p>

                  <button
                    onClick={() =>
                      window.open(`/prescriptions?view=${item.id}`, '_blank')
                    }
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl"
                  >
                    View Prescription
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-4">
              {data.invoices.map((item: any) => (
                <div key={item.id} className="p-5 rounded-2xl bg-purple-50">
                  <p className="font-bold">₹{item.amount}</p>
                  <p>{item.status}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'insurance' && (
            <div className="space-y-4">
              {data.insuranceDetails.map((item: any) => (
                <div key={item.id} className="p-5 rounded-2xl bg-orange-50">
                  <p className="font-bold">{item.provider_name}</p>
                  <p>{item.policy_number}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'emergencyContacts' && (
            <div className="space-y-4">
              {data.emergencyContacts.map((item: any) => (
                <div key={item.id} className="p-5 rounded-2xl bg-red-50">
                  <p className="font-bold">{item.contact_name}</p>
                  <p>
                    {item.relationship} • {item.phone}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
