'use client';
import { Suspense } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, SkipBack } from 'lucide-react';
import { getDashboardUrl } from '@/lib/utils/dashboard';


interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
}

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  user_id: string;
  appointment_date: string;
  appointment_type: string;
  status: string;
  organization_id?: string;
  branch_id?: string;
  patients?: Patient;
  users?: Doctor;
}

interface Medicine {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

interface Vitals {
  blood_pressure_systolic: string;
  blood_pressure_diastolic: string;
  heart_rate: string;
  temperature: string;
  oxygen_saturation: string;
  weight: string;
  height: string;
}

function PrescriptionCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const appointmentId =
    searchParams.get('appointment_id');
  
  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [appointment, setAppointment] =
    useState<Appointment | null>(null);

  const [userContext, setUserContext] =
    useState({
      userId: '',
      roleType: '',
    });

  // -------------------
  // VITALS
  // -------------------

  const [vitals, setVitals] =
    useState<Vitals>({
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      heart_rate: '',
      temperature: '',
      oxygen_saturation: '',
      weight: '',
      height: '',
    });

  // -------------------
  // MEDICINES
  // -------------------

  const [medicines, setMedicines] =
    useState<Medicine[]>([
      {
        medicine_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: '',
      },
    ]);

  // -------------------
  // TESTS + NOTES
  // -------------------

  const [testInput, setTestInput] =
    useState('');

  const [additionalTests, setAdditionalTests] =
    useState<string[]>([]);

  const [notes, setNotes] =
    useState('');

  const [showFeeModal, setShowFeeModal] = useState(false);
  const [consultationFee, setConsultationFee] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [isSavingFee, setIsSavingFee] = useState(false);

  const handleSavePrescriptionInternal =
  async () => {
    if (!appointmentId) {
      alert(
        'Appointment not found'
      );
      return;
    }

    if (
      medicines.filter(
        (m) =>
          m.medicine_name
      ).length === 0
    ) {
      alert(
        'Please add at least one medicine'
      );
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          '/api/prescriptions/create',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              appointment_id:
                appointmentId,

              patient_id:
                appointment?.patient_id,

              medications:
                medicines.filter(
                  (m) =>
                    m.medicine_name
                ),

              vitals: {
                blood_pressure_systolic:
                  vitals.blood_pressure_systolic
                    ? parseInt(
                        vitals.blood_pressure_systolic
                      )
                    : null,

                blood_pressure_diastolic:
                  vitals.blood_pressure_diastolic
                    ? parseInt(
                        vitals.blood_pressure_diastolic
                      )
                    : null,

                heart_rate:
                  vitals.heart_rate
                    ? parseInt(
                        vitals.heart_rate
                      )
                    : null,

                temperature:
                  vitals.temperature
                    ? parseFloat(
                        vitals.temperature
                      )
                    : null,

                oxygen_saturation:
                  vitals.oxygen_saturation
                    ? parseInt(
                        vitals.oxygen_saturation
                      )
                    : null,

                weight:
                  vitals.weight
                    ? parseFloat(
                        vitals.weight
                      )
                    : null,

                height:
                  vitals.height
                    ? parseFloat(
                        vitals.height
                      )
                    : null,
              },

              additional_tests:
                additionalTests,

              notes,
            }),
          }
        );

      const data =
        await response.json();

      if (
        response.ok
      ) {
        alert(
          'Prescription created successfully'
        );

        router.push(
          '/appointments'
        );
      } else {
        alert(
          data.error ||
            'Failed to save prescription'
        );
      }
    } catch (
      error
    ) {
      console.error(
        error
      );

      alert(
        'Error saving prescription'
      );
    } finally {
      setSaving(
        false
      );
    }
  };

  const handleSavePrescription =
  async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setShowFeeModal(
      true
    );
  };
const handleSaveBillingAndPrescription = async () => {
  try {
    setIsSavingFee(true);

    const fee = Number(consultationFee || 0);
    const paid = Number(paidAmount || 0);
    const pending = fee - paid;

    const billingRes = await fetch(
  '/api/billing/consultation',
  {
    method: 'POST',
    headers: {
      'Content-Type':
        'application/json',
    },
    body: JSON.stringify({
      appointment_id:
        appointmentId,
      patient_id:
        appointment?.patient_id,
      organization_id:
        appointment?.organization_id,
      branch_id:
        appointment?.branch_id,
      consultation_fee: fee,
      paid_amount: paid,
      pending_amount: pending,
      payment_mode: 'cash',
    }),
  }
);
    
    if (!billingRes.ok) {
      throw new Error(
        'Billing save failed'
      );
    }

    setShowFeeModal(false);

    await handleSavePrescriptionInternal();
  } catch (err) {
    console.error(err);
    alert(
      'Failed to save billing'
    );
  } finally {
    setIsSavingFee(false);
  }
};    // -------------------
  // AUTH
  // -------------------

  const getUserRole = useCallback(
  async () => {
    try {
      const res =
        await fetch(
          '/api/auth/me'
        );

      const data =
        await res.json();

      console.log(
        'AUTH:',
        data
      );

      if (
        data.authenticated &&
        data.user
      ) {
        setUserContext({
          userId:
            data.user.id,
          roleType:
            data.user.roles
              ?.role_type ||
            data.user
              .roleType ||
            '',
        });
      }
    } catch (
      error
    ) {
      console.error(
        error
      );
    }
  },
  []
);

  // -------------------
  // FETCH APPOINTMENT
  // -------------------

  const fetchAppointment =
  useCallback(
    async () => {
      try {
        if (
          !appointmentId
        ) {
          setLoading(
            false
          );
          return;
        }

        const res =
          await fetch(
            `/api/appointments?id=${appointmentId}&include_details=true`
          );

        const data =
          await res.json();

        console.log(
          'APPOINTMENT:',
          data
        );

        if (
          data
        ) {
          setAppointment(
            data
          );
        }
      } catch (
        error
      ) {
        console.error(
          error
        );
      } finally {
        setLoading(
          false
        );
      }
    },
    [appointmentId]
  );

  useEffect(() => {
  const loadData =
    async () => {
      await Promise.all([
        getUserRole(),
        fetchAppointment(),
      ]);
    };

  loadData();
}, [
  getUserRole,
  fetchAppointment,
]);


  // -------------------
  // MEDICINE HELPERS
  // -------------------

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        medicine_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: '',
      },
    ]);
  };

  const removeMedicine = (
    index: number
  ) => {
    setMedicines(
      medicines.filter(
        (_, i) => i !== index
      )
    );
  };

  const updateMedicine = (
    index: number,
    field: keyof Medicine,
    value: string
  ) => {
    const updated = [
      ...medicines,
    ];

    updated[index][field] =
      value;

    setMedicines(updated);
  };

  // -------------------
  // TEST HELPERS
  // -------------------

  const addTest = () => {
    if (
      !testInput.trim()
    )
      return;

    setAdditionalTests([
      ...additionalTests,
      testInput.trim(),
    ]);

    setTestInput('');
  };

  const removeTest = (
    index: number
  ) => {
    setAdditionalTests(
      additionalTests.filter(
        (_, i) => i !== index
      )
    );
  };
  
  // -------------------
  // LOADING
  // -------------------

  if (
    loading &&
    !appointment
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow-lg px-8 py-6 text-center">
          <div className="text-lg font-semibold text-slate-700">
            Loading prescription...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto px-4 py-8">



         {/* HERO */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-2xl mb-8">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_25%)]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md mb-4">
              <Activity size={16} />
              MediQuick Rx
            </div>

            <p className="mt-3 text-blue-100 max-w-2xl">
               Prescription Management
            </p>
            <p className="mt-2 text-blue-100">
                Create Prescription
            </p>
                        <p className="text-slate-500 mt-1">
              Appointment ID:
              {' '}
              {appointmentId}
            </p>

          </div>

{/* ================= HEADER ================= */}
<div className="mb-8">

  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">


    {/* TODAY CARD */}
    <div
      className="bg-gradient-to-r from-blue-50 to-indigo-50
      border border-blue-100
      rounded-3xl px-5 py-4
      shadow-sm"
    >
      <div className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
        Today
      </div>

      <div className="mt-1 text-lg font-bold text-gray-900">
        {new Date().toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </div>
    </div>

  </div>
</div>

        </div>
      </div>


           <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md mb-4">

            
            <div className="text-3xl font-bold mt-2">
            <button
              onClick={() => router.back()}       
              //onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md mb-4">
               <SkipBack size={16} />
               Back
            </button>
            </div>
          </div>

        {/* PATIENT CARD */}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-6">

          <div className="flex flex-col md:flex-row md:justify-between gap-4">

            <div>

              <div className="text-sm text-slate-500">
                Patient
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                {appointment?.patients?.first_name}
                {' '}
                {appointment?.patients?.last_name}
              </h2>

              <div className="text-slate-500 mt-2">
                {appointment?.patients?.phone}
              </div>

              <div className="text-slate-500">
                {appointment?.patients?.email}
              </div>

            </div>

            <div className="text-right">

              <div className="text-sm text-slate-500">
                Appointment Type
              </div>

              <div className="font-semibold text-slate-800 capitalize">
                {appointment?.appointment_type}
              </div>

              <div className="mt-3 text-sm text-slate-500">
                Status
              </div>

              <span className="inline-flex px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium capitalize">
                {appointment?.status}
              </span>

            </div>

          </div>

        </div>

        <form
          onSubmit={
            handleSavePrescription
          }
        >

          {/* VITALS */}

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-6">

            <h2 className="text-xl font-bold text-slate-900 mb-5">
              Patient Vitals
            </h2>

            <div className="grid md:grid-cols-3 gap-4">

              <input
                type="number"
                placeholder="BP Systolic"
                value={
                  vitals.blood_pressure_systolic
                }
                onChange={(e) =>
                  setVitals({
                    ...vitals,
                    blood_pressure_systolic:
                      e.target.value,
                  })
                }
                className="border border-slate-300 rounded-2xl px-4 py-3"
              />

              <input
                type="number"
                placeholder="BP Diastolic"
                value={
                  vitals.blood_pressure_diastolic
                }
                onChange={(e) =>
                  setVitals({
                    ...vitals,
                    blood_pressure_diastolic:
                      e.target.value,
                  })
                }
                className="border border-slate-300 rounded-2xl px-4 py-3"
              />

              <input
                type="number"
                placeholder="Heart Rate"
                value={
                  vitals.heart_rate
                }
                onChange={(e) =>
                  setVitals({
                    ...vitals,
                    heart_rate:
                      e.target.value,
                  })
                }
                className="border border-slate-300 rounded-2xl px-4 py-3"
              />

              <input
                type="number"
                step="0.1"
                placeholder="Temperature"
                value={
                  vitals.temperature
                }
                onChange={(e) =>
                  setVitals({
                    ...vitals,
                    temperature:
                      e.target.value,
                  })
                }
                className="border border-slate-300 rounded-2xl px-4 py-3"
              />

              <input
                type="number"
                placeholder="Oxygen Saturation %"
                value={
                  vitals.oxygen_saturation
                }
                onChange={(e) =>
                  setVitals({
                    ...vitals,
                    oxygen_saturation:
                      e.target.value,
                  })
                }
                className="border border-slate-300 rounded-2xl px-4 py-3"
              />

              <input
                type="number"
                step="0.1"
                placeholder="Weight"
                value={
                  vitals.weight
                }
                onChange={(e) =>
                  setVitals({
                    ...vitals,
                    weight:
                      e.target.value,
                  })
                }
                className="border border-slate-300 rounded-2xl px-4 py-3"
              />

              <input
                type="number"
                step="0.1"
                placeholder="Height"
                value={
                  vitals.height
                }
                onChange={(e) =>
                  setVitals({
                    ...vitals,
                    height:
                      e.target.value,
                  })
                }
                className="border border-slate-300 rounded-2xl px-4 py-3"
              />

            </div>
          </div>
                    {/* MEDICINES */}

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-6">

            <div className="flex items-center justify-between mb-5">

              <h2 className="text-xl font-bold text-slate-900">
                Medicines
              </h2>

              <button
                type="button"
                onClick={addMedicine}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl font-medium"
              >
                + Add Medicine
              </button>

            </div>

            <div className="space-y-4">

              {medicines.map(
                (medicine, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-2xl p-5 bg-slate-50"
                  >

                    <div className="grid md:grid-cols-2 gap-4">

                      <input
                        placeholder="Medicine Name"
                        value={
                          medicine.medicine_name
                        }
                        onChange={(e) =>
                          updateMedicine(
                            index,
                            'medicine_name',
                            e.target.value
                          )
                        }
                        className="border border-slate-300 rounded-xl px-4 py-3"
                      />

                      <input
                        placeholder="Dosage"
                        value={
                          medicine.dosage
                        }
                        onChange={(e) =>
                          updateMedicine(
                            index,
                            'dosage',
                            e.target.value
                          )
                        }
                        className="border border-slate-300 rounded-xl px-4 py-3"
                      />

                      <input
                        placeholder="Frequency"
                        value={
                          medicine.frequency
                        }
                        onChange={(e) =>
                          updateMedicine(
                            index,
                            'frequency',
                            e.target.value
                          )
                        }
                        className="border border-slate-300 rounded-xl px-4 py-3"
                      />

                      <input
                        placeholder="Duration"
                        value={
                          medicine.duration
                        }
                        onChange={(e) =>
                          updateMedicine(
                            index,
                            'duration',
                            e.target.value
                          )
                        }
                        className="border border-slate-300 rounded-xl px-4 py-3"
                      />

                    </div>

                    <textarea
                      placeholder="Medicine Notes / Instructions"
                      value={
                        medicine.notes
                      }
                      onChange={(e) =>
                        updateMedicine(
                          index,
                          'notes',
                          e.target.value
                        )
                      }
                      rows={3}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 mt-4"
                    />

                    {medicines.length >
                      1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeMedicine(
                            index
                          )
                        }
                        className="mt-3 text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove Medicine
                      </button>
                    )}

                  </div>
                )
              )}

            </div>

          </div>

          {/* TESTS */}

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-6">

            <h2 className="text-xl font-bold text-slate-900 mb-5">
              Additional Tests
            </h2>

            <div className="flex gap-3 mb-4">

              <input
                value={
                  testInput
                }
                onChange={(e) =>
                  setTestInput(
                    e.target.value
                  )
                }
                placeholder="Add recommended test"
                className="flex-1 border border-slate-300 rounded-2xl px-4 py-3"
              />

              <button
                type="button"
                onClick={addTest}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 rounded-2xl"
              >
                Add
              </button>

            </div>

            <div className="flex flex-wrap gap-3">

              {additionalTests.map(
                (
                  test,
                  index
                ) => (
                  <div
                    key={index}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full flex items-center gap-2"
                  >
                    {test}

                    <button
                      type="button"
                      onClick={() =>
                        removeTest(
                          index
                        )
                      }
                      className="font-bold"
                    >
                      ×
                    </button>

                  </div>
                )
              )}

            </div>

          </div>

          {/* DOCTOR NOTES */}

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-6">

            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Doctor Notes
            </h2>

            <textarea
              rows={5}
              value={
                notes
              }
              onChange={(e) =>
                setNotes(
                  e.target.value
                )
              }
              placeholder="Clinical findings, diagnosis, observations..."
              className="w-full border border-slate-300 rounded-2xl px-4 py-4"
            />

          </div>

          {/* FOOTER */}

          <div className="flex justify-end gap-4">

            <button
              type="button"
              onClick={() =>
                router.back()
              }
              className="px-6 py-3 rounded-2xl border border-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving
              }
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-semibold disabled:opacity-50"
            >
              {saving
                ? 'Saving Prescription...'
                : 'Create Prescription'}
            </button>
{showFeeModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

      <h2 className="text-xl font-semibold mb-4">
        Consultation Billing
      </h2>

      <div className="space-y-4">

        <div>
          <label className="block text-sm mb-2">
            Consultation Fee
          </label>

          <input
            type="number"
            value={consultationFee}
            onChange={(e) =>
              setConsultationFee(
                e.target.value
              )
            }
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Enter fee"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">
            Paid Amount
          </label>

          <input
            type="number"
            value={paidAmount}
            onChange={(e) =>
              setPaidAmount(
                e.target.value
              )
            }
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Enter paid amount"
          />
        </div>

        <div className="bg-gray-50 rounded-xl p-3 text-sm">
          Pending Amount:{' '}
          <span className="font-semibold text-red-600">
            ₹
            {(
              Number(
                consultationFee || 0
              ) -
              Number(
                paidAmount || 0
              )
            ).toFixed(2)}
          </span>
        </div>

      </div>

      <div className="flex justify-end gap-3 mt-6">

        <button
          type="button"
          onClick={() =>
            setShowFeeModal(false)
          }
          className="border px-4 py-2 rounded-xl"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={
            isSavingFee
          }
          onClick={
            handleSaveBillingAndPrescription
          }
          className="bg-green-600 text-white px-4 py-2 rounded-xl disabled:opacity-50"
        >
          {isSavingFee
            ? 'Saving...'
            : 'Save & Create'}
        </button>

      </div>
    </div>
  </div>
)}          </div>

        </form>

      </div>
    </div>
    
  );
}
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          Loading...
        </div>
      }
    >
      <PrescriptionCreateContent />
    </Suspense>
  );
}