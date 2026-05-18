'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';

export default function PatientDetailPage() {
  const params = useParams();
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
        <Header />
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
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-900">
            {data.patient.first_name} {data.patient.last_name}
          </h1>

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
