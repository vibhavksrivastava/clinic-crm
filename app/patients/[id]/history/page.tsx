// app/patient/[id]/history/page.tsx

'use client';

import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Activity, StepBackIcon } from 'lucide-react';

export default function PatientHistoryPage() {
  const params = useParams();

  const patientId = params?.id as string;

  const [loading, setLoading] =
    useState(true);

  const [patient, setPatient] =
    useState<any>(null);

  const [prescriptions, setPrescriptions] =
    useState<any[]>([]);

  const [vitalsTimeline, setVitalsTimeline] =
    useState<any[]>([]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        `/api/patients/${patientId}/history`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed'
        );
      }

      setPatient(data.patient || null);

      setPrescriptions(
        data.prescriptions || []
      );

      setVitalsTimeline(
        data.vitalsTimeline || []
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchHistory();
    }
  }, [patientId]);

  if (loading) {
    return (
      <div className="p-10">
        Loading...
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold">
              {patient?.first_name}{' '}
              {patient?.last_name}
            </h1>
            <p className="text-blue-100">
              Patient History Dashboard.
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

        {/* CHARTS */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          {/* WEIGHT */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">
              Weight Trend
            </h2>

            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <LineChart
                data={vitalsTimeline}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="date" />

                <YAxis />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#2563eb"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* HEART RATE */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">
              Heart Rate
            </h2>

            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <LineChart
                data={vitalsTimeline}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="date" />

                <YAxis />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="heart_rate"
                  stroke="#dc2626"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* TEMPERATURE */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">
              Temperature
            </h2>

            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <LineChart
                data={vitalsTimeline}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="date" />

                <YAxis />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#f59e0b"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* SPO2 */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">
              Oxygen Saturation
            </h2>

            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <LineChart
                data={vitalsTimeline}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="date" />

                <YAxis />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="oxygen_saturation"
                  stroke="#10b981"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* BLOOD PRESSURE */}
          <div className="rounded-2xl bg-white p-4 shadow-sm md:col-span-2">
            <h2 className="mb-4 text-lg font-bold">
              Blood Pressure
            </h2>

            <ResponsiveContainer
              width="100%"
              height={350}
            >
              <LineChart
                data={vitalsTimeline}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="date" />

                <YAxis />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="blood_pressure_systolic"
                  stroke="#2563eb"
                  strokeWidth={3}
                  name="Systolic"
                />

                <Line
                  type="monotone"
                  dataKey="blood_pressure_diastolic"
                  stroke="#dc2626"
                  strokeWidth={3}
                  name="Diastolic"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* VISIT TIMELINE */}
        <div className="mt-8">
          <h2 className="mb-4 text-2xl font-bold">
            Visit Timeline
          </h2>

          <div className="space-y-6">
            {prescriptions.map(
              (prescription: any) => (
                <div
                  key={prescription.id}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">
                        {
                          prescription.issued_date
                        }
                      </h3>

                      <p className="text-sm text-gray-500">
                        Dr{' '}
                        {
                          prescription
                            ?.users
                            ?.first_name
                        }{' '}
                        {
                          prescription
                            ?.users
                            ?.last_name
                        }
                      </p>
                    </div>
                  </div>

                  {/* MEDICINES */}
                  <div className="mt-6">
                    <h4 className="mb-2 font-semibold">
                      Medicines
                    </h4>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {prescription.medications?.map(
                        (
                          med: any,
                          index: number
                        ) => (
                          <div
                            key={index}
                            className="rounded-xl border p-3"
                          >
                            <h5 className="font-semibold">
                              {
                                med.medication_name
                              }
                            </h5>

                            <div className="mt-2 text-sm text-gray-600">
                              <p>
                                Dosage:{' '}
                                {med.dosage}
                              </p>

                              <p>
                                Frequency:{' '}
                                {
                                  med.frequency
                                }
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* TESTS */}
                  <div className="mt-6">
                    <h4 className="mb-2 font-semibold">
                      Tests Recommended
                    </h4>

                    <div className="flex flex-wrap gap-2">
                      {prescription.additional_tests?.map(
                        (
                          test: any,
                          index: number
                        ) => (
                          <span
                            key={index}
                            className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                          >
                            {test.test_name}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* NOTES */}
                  {prescription.notes && (
                    <div className="mt-6">
                      <h4 className="mb-2 font-semibold">
                        Notes
                      </h4>

                      <p className="text-gray-600">
                        {
                          prescription.notes
                        }
                      </p>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}