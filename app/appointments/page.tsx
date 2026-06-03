'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardUrl } from '@/lib/utils/dashboard';
import { Plus, SkipBack } from 'lucide-react';
import { Activity } from 'lucide-react';


interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
}

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialization?: string;
}

interface Prescription {
  id: string;
  status?: string;
  medications?: Record<string, unknown>;
}

interface AppointmentPayment {
  amount_paid: number;
  amount_due: number;
  payment_status: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  user_id: string;
  appointment_date: string;
  duration_minutes: number;
  status:
    | 'scheduled'
    | 'ongoing'
    | 'completed'
    | 'cancelled';
  appointment_type: string;
  fee_amount?: number | null;
  notes?: string;

  patients?: Patient;

  users?: {
    id: string;
    first_name: string;
    last_name: string;
  };

  appointment_payments?: AppointmentPayment[];

  prescriptions?: Prescription[];
}

interface UserContext {
  userId: string;
  roleType: string;
  permissions?: string[];
}

export default function AppointmentsPage() {
  const router = useRouter();

  const [dashboardUrl] = useState(
    getDashboardUrl()
  );

  const [loading, setLoading] =
    useState(true);

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [patients, setPatients] =
    useState<Patient[]>([]);

  const [doctors, setDoctors] =
    useState<Doctor[]>([]);

  const [userContext, setUserContext] =
    useState<UserContext | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [appointmentView, setAppointmentView] =
    useState<
      | 'scheduled'
      | 'ongoing'
      | 'completed'
      | 'cancelled'
    >('scheduled');

  const [selectedPatient, setSelectedPatient] =
    useState<Appointment | null>(null);

  const [
    showPatientDetails,
    setShowPatientDetails,
  ] = useState(false);

  // Schedule Form
  const [formData, setFormData] = useState({
    patient_id: '',
    user_id: '',
    appointment_date: '',
    appointment_time: '',
    duration_minutes: '30',
    appointment_type: 'consultation',
    notes: '',
  });

  // Completion
  const [
    showCompletionForm,
    setShowCompletionForm,
  ] = useState(false);

  const [
    completingAppointmentId,
    setCompletingAppointmentId,
  ] = useState<string | null>(null);

  const [completionData, setCompletionData] =
    useState({
      fee_amount: '',
      notes_from_doctor: '',
    });

  // Payment
  const [showPaymentForm, setShowPaymentForm] =
    useState(false);

  const [
    paymentAppointmentId,
    setPaymentAppointmentId,
  ] = useState<string | null>(null);

  const [pendingAmount, setPendingAmount] =
    useState(0);

  const [paymentData, setPaymentData] =
    useState({
      amount_paid: '',
      payment_method: 'cash',
      payment_reference: '',
      notes: '',
    });

  // Vitals
  const [showVitalsForm, setShowVitalsForm] =
    useState(false);

  const [
    vitalsAppointmentId,
    setVitalsAppointmentId,
  ] = useState<string | null>(null);

  const [vitalsData, setVitalsData] =
    useState({
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      heart_rate: '',
      temperature: '',
      oxygen_saturation: '',
      weight: '',
      height: '',
      temperature_unit: 'C' as 'C' | 'F',
      weight_unit: 'kg' as 'kg' | 'lbs',
      height_unit: 'cm' as 'cm' | 'inches',
    });

  // --------------------------------
  // AUTH ME
  // --------------------------------
  const getUserRole = async () => {
    try {
      const res = await fetch(
        '/api/auth/me'
      );

      const data = await res.json();

      console.log(
        'AUTH ME RESPONSE:',
        data
      );

      if (
        data.authenticated &&
        data.user
      ) {
        const role =
          data.user.role_type ||
          data.user.roleType ||
          '';

        console.log(
          'ROLE FOUND:',
          role
        );

        setUserContext({
          userId: data.user.id,
          roleType: role,
          permissions:
            data.user.permissions || [],
        });
      }
    } catch (error) {
      console.error(
        'Auth fetch error:',
        error
      );
    }
  };

  // --------------------------------
  // FETCH DATA
  // --------------------------------
  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        appointmentsRes,
        patientsRes,
        doctorsRes,
      ] = await Promise.all([
        fetch(
          '/api/appointments?include_details=true'
        ),
        fetch('/api/patients'),
        fetch('/api/staff?role=doctor'),
      ]);

      const appointmentsData =
        await appointmentsRes.json();

      const patientsData =
        await patientsRes.json();

      const doctorsData =
        await doctorsRes.json();

      setAppointments(
        Array.isArray(appointmentsData)
          ? appointmentsData
          : []
      );

      setPatients(
        Array.isArray(patientsData)
          ? patientsData
          : []
      );

      setDoctors(
        Array.isArray(doctorsData)
          ? doctorsData
          : []
      );
    } catch (error) {
      console.error(
        'Fetch error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserRole();
    fetchData();
  }, []);

  // --------------------------------
  // HELPERS
  // --------------------------------
  const resetForm = () => {
    setFormData({
      patient_id: '',
      user_id: '',
      appointment_date: '',
      appointment_time: '',
      duration_minutes: '30',
      appointment_type: 'consultation',
      notes: '',
    });

    setEditingId(null);
    setShowForm(false);
  };

  const filteredAppointments =
    appointments.filter(
      (a) => a.status === appointmentView
    );

    const [search, setSearch] = useState('');

  const fetchInvoiceForAppointment =
    async (appointmentId: string) => {
      try {
        const res = await fetch(
          `/api/invoices?appointment_id=${appointmentId}`
        );

        if (!res.ok) return 0;

        const data = await res.json();

        if (
          Array.isArray(data) &&
          data.length
        ) {
          return Number(
            data[0]?.total_amount || 0
          );
        }

        return 0;
      } catch {
        return 0;
      }
    };

  // --------------------------------
  // APPOINTMENT CREATE / UPDATE
  // --------------------------------
  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      const dateTime =
        `${formData.appointment_date}T${formData.appointment_time}:00`;

      const method =
        editingId ? 'PUT' : 'POST';

      const url = editingId
        ? `/api/appointments?id=${editingId}`
        : '/api/appointments';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          patient_id:
            formData.patient_id,
          user_id: formData.user_id,
          appointment_date:
            dateTime,
          duration_minutes:
            Number(
              formData.duration_minutes
            ) || 30,
          appointment_type:
            formData.appointment_type,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const err =
          await response.json();

        alert(
          err.error ||
            'Failed to save appointment'
        );
        return;
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error(
        'Save appointment error:',
        error
      );
    }
  };

  // --------------------------------
  // MARK ONGOING
  // --------------------------------
  const handleMarkOngoing =
    async (id: string) => {
      try {
        const response =
          await fetch(
            `/api/appointments?id=${id}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                status: 'ongoing',
              }),
            }
          );

        if (response.ok) {
          fetchData();
        }
      } catch (error) {
        console.error(
          'Mark ongoing error:',
          error
        );
      }
    };

  // --------------------------------
  // CANCEL APPOINTMENT
  // --------------------------------
  const handleCancelAppointment =
    async (id: string) => {
      if (
        !window.confirm(
          'Cancel this appointment?'
        )
      )
        return;

      try {
        const response =
          await fetch(
            `/api/appointments?id=${id}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                status: 'cancelled',
              }),
            }
          );

        if (response.ok) {
          fetchData();
        }
      } catch (error) {
        console.error(
          'Cancel error:',
          error
        );
      }
    };

  // --------------------------------
  // COMPLETE APPOINTMENT
  // --------------------------------
  const handleCompleteAppointment =
    (id: string) => {
      setCompletingAppointmentId(
        id
      );

      setCompletionData({
        fee_amount: '',
        notes_from_doctor: '',
      });

      setShowCompletionForm(true);
    };

  const handleSubmitCompletion =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (
        !completingAppointmentId
      )
        return;

      try {
        const response =
          await fetch(
            `/api/appointments?id=${completingAppointmentId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                status: 'completed',
                fee_amount:
                  Number(
                    completionData.fee_amount
                  ) || 0,
                notes_from_doctor:
                  completionData.notes_from_doctor,
              }),
            }
          );

        if (!response.ok) {
          const err =
            await response.json();

          alert(
            err.error ||
              'Failed'
          );
          return;
        }

        setShowCompletionForm(
          false
        );

        fetchData();
      } catch (error) {
        console.error(
          'Complete error:',
          error
        );
      }
    };

  // --------------------------------
  // PAYMENT
  // --------------------------------
  const handleOpenPayment =
    async (
      appointmentId: string,
      feeAmount?: number | null
    ) => {
      setPaymentAppointmentId(
        appointmentId
      );

      const invoiceAmount =
        await fetchInvoiceForAppointment(
          appointmentId
        );

      const pending =
        invoiceAmount ||
        feeAmount ||
        0;

      setPendingAmount(
        Number(pending)
      );

      setPaymentData({
        amount_paid:
          String(pending),
        payment_method:
          'cash',
        payment_reference:
          '',
        notes: '',
      });

      setShowPaymentForm(
        true
      );
    };

  const handleRecordPayment =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (
        !paymentAppointmentId
      ) {
        alert(
          'Appointment missing'
        );
        return;
      }

      try {
        const response =
          await fetch(
            '/api/appointments/payments',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                appointment_id:
                  paymentAppointmentId,
                amount_paid:
                  Number(
                    paymentData.amount_paid
                  ) || 0,
                amount_due:
                  pendingAmount,
                payment_method:
                  paymentData.payment_method,
                payment_reference:
                  paymentData.payment_reference,
                notes:
                  paymentData.notes,
              }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          alert(
            result.error ||
              'Payment failed'
          );
          return;
        }

        setShowPaymentForm(
          false
        );

        setPaymentData({
          amount_paid: '',
          payment_method:
            'cash',
          payment_reference:
            '',
          notes: '',
        });

        fetchData();
      } catch (error) {
        console.error(
          'Payment error:',
          error
        );
      }
    };

  // --------------------------------
  // VITALS
  // --------------------------------
  const handleSaveVitals =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (
        !vitalsAppointmentId
      )
        return;

      try {
        const response =
          await fetch(
            '/api/appointments/vitals',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                appointment_id:
                  vitalsAppointmentId,
                vitals: {
                  blood_pressure_systolic:
                    vitalsData.blood_pressure_systolic
                      ? Number(
                          vitalsData.blood_pressure_systolic
                        )
                      : null,

                  blood_pressure_diastolic:
                    vitalsData.blood_pressure_diastolic
                      ? Number(
                          vitalsData.blood_pressure_diastolic
                        )
                      : null,

                  heart_rate:
                    vitalsData.heart_rate
                      ? Number(
                          vitalsData.heart_rate
                        )
                      : null,

                  temperature:
                    vitalsData.temperature
                      ? Number(
                          vitalsData.temperature
                        )
                      : null,

                  oxygen_saturation:
                    vitalsData.oxygen_saturation
                      ? Number(
                          vitalsData.oxygen_saturation
                        )
                      : null,

                  weight:
                    vitalsData.weight
                      ? Number(
                          vitalsData.weight
                        )
                      : null,

                  height:
                    vitalsData.height
                      ? Number(
                          vitalsData.height
                        )
                      : null,

                  temperature_unit:
                    vitalsData.temperature_unit,

                  weight_unit:
                    vitalsData.weight_unit,

                  height_unit:
                    vitalsData.height_unit,
                },
              }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          alert(
            result.error
          );
          return;
        }

        alert(
          'Vitals saved'
        );

        setShowVitalsForm(
          false
        );

        fetchData();
      } catch (error) {
        console.error(
          'Vitals error:',
          error
        );
      }
    };

  // --------------------------------
  // PRESCRIPTION LINKS
  // --------------------------------
  const handleWriteRx =
    (
      appointmentId: string
    ) => {
      router.push(
        `/prescriptions/create?appointment_id=${appointmentId}`
      );
    };

  const handleViewRx =
    (
      patient_id: string
    ) => {
      router.push(
          `/prescriptions?patient_id=${patient_id}`
        //`/prescriptions?appointment_id=${appointmentId}`
      );
    };

    return (
  <div className="min-h-screen bg-gray-50">
    {/* <Header /> */}

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
               Appointment Management
            </p>
            <p className="mt-2 text-blue-100">
                Manage appointments, consultations, prescriptions and payments
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
                        {!selectedPatient && (
            <button
              onClick={() => router.push(dashboardUrl)}        
              //onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md mb-4">
               <SkipBack size={16} />
               Dashboard
            </button>
          )}
            </div>
          </div>


{/* ================= STATS CARDS ================= */}
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

  {/* TOTAL */}
  <div
    className="bg-white border border-gray-200
    rounded-3xl p-5 shadow-sm
    hover:shadow-lg transition"
  >
    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm font-medium text-gray-500">
          Total Appointments
        </p>

        <h3 className="mt-2 text-3xl font-bold text-gray-900">
          {appointments.length}
        </h3>

        <p className="mt-2 text-xs text-gray-400">
          All appointment records
        </p>
      </div>

      <div
        className="w-14 h-14 rounded-2xl
        bg-blue-50 flex items-center justify-center"
      >
        <span className="text-2xl">📅</span>
      </div>

    </div>
  </div>

  {/* SCHEDULED */}
  <div
    className="bg-white border border-gray-200
    rounded-3xl p-5 shadow-sm
    hover:shadow-lg transition"
  >
    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm font-medium text-gray-500">
          Scheduled
        </p>

        <h3 className="mt-2 text-3xl font-bold text-blue-600">
          {
            appointments.filter(
              (a) => a.status === 'scheduled'
            ).length
          }
        </h3>

        <p className="mt-2 text-xs text-gray-400">
          Upcoming visits
        </p>
      </div>

      <div
        className="w-14 h-14 rounded-2xl
        bg-blue-50 flex items-center justify-center"
      >
        <span className="text-2xl">🗓️</span>
      </div>

    </div>
  </div>

  {/* ONGOING */}
  <div
    className="bg-white border border-gray-200
    rounded-3xl p-5 shadow-sm
    hover:shadow-lg transition"
  >
    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm font-medium text-gray-500">
          Ongoing
        </p>

        <h3 className="mt-2 text-3xl font-bold text-yellow-600">
          {
            appointments.filter(
              (a) => a.status === 'ongoing'
            ).length
          }
        </h3>

        <p className="mt-2 text-xs text-gray-400">
          In consultation
        </p>
      </div>

      <div
        className="w-14 h-14 rounded-2xl
        bg-yellow-50 flex items-center justify-center"
      >
        <span className="text-2xl">🩺</span>
      </div>

    </div>
  </div>

  {/* COMPLETED */}
  <div
    className="bg-white border border-gray-200
    rounded-3xl p-5 shadow-sm
    hover:shadow-lg transition"
  >
    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm font-medium text-gray-500">
          Completed
        </p>

        <h3 className="mt-2 text-3xl font-bold text-green-600">
          {
            appointments.filter(
              (a) => a.status === 'completed'
            ).length
          }
        </h3>

        <p className="mt-2 text-xs text-gray-400">
          Finished visits
        </p>
      </div>

      <div
        className="w-14 h-14 rounded-2xl
        bg-green-50 flex items-center justify-center"
      >
        <span className="text-2xl">✅</span>
      </div>

    </div>
  </div>

</div>
{/* ================= ACTION BAR ================= */}
<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

  {/* LEFT ACTIONS */}
  <div className="flex flex-wrap gap-3">

    {!showForm &&
      ['receptionist', 'clinic_admin', 'branch_admin'].includes(
        userContext?.roleType || ''
      ) && (
        <button
          onClick={() => setShowForm(true)}
          className="
          inline-flex items-center gap-2
          px-5 py-3
          rounded-2xl
          bg-gradient-to-r from-blue-600 to-indigo-600
          text-white font-semibold
          shadow-lg hover:shadow-xl
          hover:scale-[1.02]
          transition-all"
        >
          <span className="text-lg">＋</span>
          Schedule Appointment
        </button>
      )}

  </div>

  {/* SEARCH */}
  <div className="w-full lg:w-96">

    <div className="relative">

      <input
        type="text"
        placeholder="Search patient / doctor..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="
        w-full
        rounded-2xl
        border border-gray-300
        bg-white
        pl-11 pr-4 py-3
        shadow-sm
        focus:ring-2
        focus:ring-blue-500
        focus:border-blue-500
        outline-none"
      />

      <svg
        className="absolute left-4 top-3.5 h-5 w-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-4.3-4.3m0 0A7.5 7.5 0 105.4 5.4a7.5 7.5 0 0011.3 11.3z"
        />
      </svg>

    </div>
  </div>

</div>

{/* ================= APPOINTMENT FORM ================= */}
{showForm && (
  <div
    className="
    mb-8
    rounded-3xl
    bg-white
    border border-gray-200
    shadow-xl
    overflow-hidden"
  >

    {/* FORM HEADER */}
    <div
      className="
      px-6 py-5
      border-b border-gray-200
      bg-gradient-to-r
      from-blue-50
      to-indigo-50"
    >
      <h2 className="text-2xl font-bold text-gray-900">
        Schedule Appointment
      </h2>

      <p className="text-gray-600 mt-1">
        Create and manage patient appointments
      </p>
    </div>

    {/* FORM BODY */}
    <form
      onSubmit={handleSubmit}
      className="p-6"
    >

      {/* PATIENT + DOCTOR */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Patient *
          </label>

          <select
            required
            value={formData.patient_id}
            onChange={(e) =>
              setFormData({
                ...formData,
                patient_id: e.target.value,
              })
            }
            className="
            w-full
            rounded-2xl
            border border-gray-300
            px-4 py-3
            bg-white
            focus:ring-2
            focus:ring-blue-500
            outline-none"
          >
            <option value="">
              Select Patient
            </option>

            {patients.map((p) => (
              <option
                key={p.id}
                value={p.id}
              >
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Doctor *
          </label>

          <select
            required
            value={formData.user_id}
            onChange={(e) =>
              setFormData({
                ...formData,
                user_id: e.target.value,
              })
            }
            className="
            w-full
            rounded-2xl
            border border-gray-300
            px-4 py-3
            bg-white
            focus:ring-2
            focus:ring-blue-500
            outline-none"
          >
            <option value="">
              Select Doctor
            </option>

            {doctors.map((d) => (
              <option
                key={d.id}
                value={d.id}
              >
                Dr. {d.first_name} {d.last_name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* DATE + TIME */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Appointment Date *
          </label>

          <input
            type="date"
            required
            value={formData.appointment_date}
            onChange={(e) =>
              setFormData({
                ...formData,
                appointment_date: e.target.value,
              })
            }
            className="
            w-full
            rounded-2xl
            border border-gray-300
            px-4 py-3
            focus:ring-2
            focus:ring-blue-500
            outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Appointment Time *
          </label>

          <input
            type="time"
            required
            value={formData.appointment_time}
            onChange={(e) =>
              setFormData({
                ...formData,
                appointment_time: e.target.value,
              })
            }
            className="
            w-full
            rounded-2xl
            border border-gray-300
            px-4 py-3
            focus:ring-2
            focus:ring-blue-500
            outline-none"
          />
        </div>

      </div>

      {/* DURATION + TYPE */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">

        <select
          value={formData.duration_minutes}
          onChange={(e) =>
            setFormData({
              ...formData,
              duration_minutes: e.target.value,
            })
          }
          className="
          rounded-2xl
          border border-gray-300
          px-4 py-3"
        >
          <option value="15">15 mins</option>
          <option value="30">30 mins</option>
          <option value="45">45 mins</option>
          <option value="60">60 mins</option>
        </select>

        <select
          value={formData.appointment_type}
          onChange={(e) =>
            setFormData({
              ...formData,
              appointment_type: e.target.value,
            })
          }
          className="
          rounded-2xl
          border border-gray-300
          px-4 py-3"
        >
          <option value="consultation">
            Consultation
          </option>

          <option value="follow-up">
            Follow Up
          </option>

          <option value="procedure">
            Procedure
          </option>
        </select>

      </div>

      {/* NOTES */}
      <textarea
        rows={4}
        value={formData.notes}
        placeholder="Appointment notes..."
        onChange={(e) =>
          setFormData({
            ...formData,
            notes: e.target.value,
          })
        }
        className="
        w-full
        rounded-2xl
        border border-gray-300
        px-4 py-3
        mb-6
        focus:ring-2
        focus:ring-blue-500
        outline-none"
      />

      {/* BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-3">

        <button
          type="submit"
          className="
          flex-1
          rounded-2xl
          px-5 py-3
          bg-gradient-to-r
          from-green-600
          to-emerald-600
          text-white
          font-semibold
          shadow-lg
          hover:shadow-xl
          transition"
        >
          Save Appointment
        </button>

        <button
          type="button"
          onClick={resetForm}
          className="
          flex-1
          rounded-2xl
          px-5 py-3
          bg-gray-100
          text-gray-700
          font-semibold
          hover:bg-gray-200
          transition"
        >
          Cancel
        </button>

      </div>
    </form>
  </div>
)}

{/* ================= STATUS TABS ================= */}
<div
  className="
  mb-6
  bg-white
  rounded-2xl
  border border-gray-200
  shadow-sm
  p-2
  flex gap-2
  overflow-x-auto"
>
  {[
    'scheduled',
    'ongoing',
    'completed',
    'cancelled',
  ].map((tab) => (
    <button
      key={tab}
      onClick={() =>
        setAppointmentView(tab as any)
      }
      className={`
      px-5 py-3
      rounded-xl
      font-semibold
      capitalize
      whitespace-nowrap
      transition
      ${
        appointmentView === tab
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {tab}
    </button>
  ))}
</div>

{/* ================= TABLE CARD OPEN ================= */}
<div
  className="
  bg-white
  rounded-3xl
  border border-gray-200
  shadow-xl
  overflow-hidden"
>
 {/* ===================== APPOINTMENTS TABLE ===================== */}
<div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">

  {/* TABLE HEADER */}
  <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h2 className="text-xl font-bold text-gray-900">
        Appointment List
      </h2>

      <p className="text-sm text-gray-500 mt-1">
        Manage appointments, prescriptions and patient visits
      </p>
    </div>

    <div className="flex items-center gap-2">
      <div className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold">
        {filteredAppointments.length} Records
      </div>
    </div>
  </div>

  {/* LOADING */}
  {loading ? (
    <div className="py-20 text-center">
      <div className="inline-flex items-center gap-3 text-gray-500">
        <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Loading appointments...
      </div>
    </div>
  ) : filteredAppointments.length === 0 ? (
    /* EMPTY */
    <div className="py-20 text-center">
      <div className="text-5xl mb-4">📅</div>

      <h3 className="text-lg font-semibold text-gray-800">
        No appointments found
      </h3>

      <p className="text-gray-500 mt-2">
        No records available for selected status
      </p>
    </div>
  ) : (
    <div className="overflow-x-auto">

      <table className="min-w-full">

        {/* TABLE HEADER */}
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
              Patient
            </th>

            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
              Doctor
            </th>

            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
              Date & Time
            </th>

            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
              Type
            </th>

            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
              Status
            </th>

            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
              Payment
            </th>

            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>

        {/* TABLE BODY */}
        <tbody className="divide-y divide-gray-100">

          {filteredAppointments.map((apt) => (

            <tr
              key={apt.id}
              className="hover:bg-blue-50/40 transition"
            >

              {/* PATIENT */}
              <td className="px-6 py-5">

                <button
                  onClick={() => {
                    setSelectedPatient(apt);
                    setShowPatientDetails(true);
                  }}
                  className="text-left group"
                >
                  <div className="font-semibold text-blue-700 group-hover:text-blue-900 group-hover:underline transition">
                    {apt.patients?.first_name}{' '}
                    {apt.patients?.last_name}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    Click to view details
                  </div>
                </button>

              </td>

              {/* DOCTOR */}
              <td className="px-6 py-5">
                <div className="font-medium text-gray-800">
                  Dr. {apt.users?.first_name}{' '}
                  {apt.users?.last_name}
                </div>
              </td>

              {/* DATE */}
              <td className="px-6 py-5">
                <div className="font-medium text-gray-800">
                  {new Date(
                    apt.appointment_date
                  ).toLocaleDateString()}
                </div>

                <div className="text-sm text-gray-500">
                  {new Date(
                    apt.appointment_date
                  ).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </td>

              {/* TYPE */}
              <td className="px-6 py-5">
                <span className="inline-flex px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold capitalize">
                  {apt.appointment_type}
                </span>
              </td>

              {/* STATUS */}
              <td className="px-6 py-5">

                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize
                  ${
                    apt.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : apt.status === 'ongoing'
                      ? 'bg-yellow-100 text-yellow-700'
                      : apt.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {apt.status}
                </span>

              </td>

              {/* PAYMENT */}
              <td className="px-6 py-5">

                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize
                  ${
                    apt
                      .appointment_payments?.[0]
                      ?.payment_status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : apt
                          .appointment_payments?.[0]
                          ?.payment_status ===
                        'partial'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {apt.appointment_payments?.[0]
                    ?.payment_status || 'Pending'}
                </span>

              </td>

              {/* ACTIONS */}
              <td className="px-6 py-5">

                <div className="flex flex-wrap gap-2">

                  {/* DOCTOR ACTIONS */}
                  {userContext?.roleType ===
                    'doctor' && (
                    <>
                      {apt.status ===
                        'scheduled' && (
                        <button
                          onClick={() =>
                            handleMarkOngoing(
                              apt.id
                            )
                          }
                          className="px-3 py-2 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-semibold transition"
                        >
                          Ongoing
                        </button>
                      )}

                      {(apt.status ===
                        'scheduled' ||
                        apt.status ===
                          'ongoing') && (
                        <>
                          <button
                            onClick={() =>
                              handleWriteRx(
                                apt.id
                              )
                            }
                            className="px-3 py-2 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs font-semibold transition"
                          >
                            Rx
                          </button>

                          <button
                            onClick={() =>
                              handleViewRx(
                                apt.id
                              )
                            }
                            className="px-3 py-2 rounded-xl bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs font-semibold transition"
                          >
                            Prescriptions
                          </button>

                          <button
                            onClick={() => {
                              setVitalsAppointmentId(
                                apt.id
                              );
                              setShowVitalsForm(
                                true
                              );
                            }}
                            className="px-3 py-2 rounded-xl bg-sky-100 text-sky-700 hover:bg-sky-200 text-xs font-semibold transition"
                          >
                            Vitals
                          </button>

                          <button
                            onClick={() =>
                              handleCompleteAppointment(
                                apt.id
                              )
                            }
                            className="px-3 py-2 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 text-xs font-semibold transition"
                          >
                            Complete
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {/* RECEPTION / ADMIN CANCEL */}
                  {[
                    'receptionist',
                    'clinic_admin',
                    'branch_admin',
                  ].includes(
                    userContext?.roleType || ''
                  ) &&
                    (apt.status ===
                      'scheduled' ||
                      apt.status ===
                        'ongoing') && (
                      <button
                        onClick={() =>
                          handleCancelAppointment(
                            apt.id
                          )
                        }
                        className="px-3 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                    )}

                  {/* PAYMENT */}
                  {[
                    'receptionist',
                    'clinic_admin',
                    'branch_admin',
                  ].includes(
                    userContext?.roleType || ''
                  ) &&
                    apt.status ===
                      'completed' && (
                      <button
                        onClick={() =>
                          handleOpenPayment(
                            apt.id,
                            apt.fee_amount
                          )
                        }
                        className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-semibold transition"
                      >
                        Payment
                      </button>
                    )}
                </div>

              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
{/* ===================== PATIENT DETAILS MODAL ===================== */}
{showPatientDetails && selectedPatient && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

    <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">

      {/* HEADER */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Patient Details
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Patient profile and appointment information
          </p>
        </div>

        <button
          onClick={() => {
            setShowPatientDetails(false);
            setSelectedPatient(null);
          }}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
        >
          ✕
        </button>
      </div>

      {/* BODY */}
      <div className="p-6 space-y-6">

        {/* PATIENT PROFILE CARD */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">

          <div className="flex items-center gap-4">

            <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow">
              {selectedPatient.patients?.first_name?.[0]}
              {selectedPatient.patients?.last_name?.[0]}
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {selectedPatient.patients?.first_name}{' '}
                {selectedPatient.patients?.last_name}
              </h3>

              <p className="text-sm text-gray-500">
                Patient Information
              </p>
            </div>
          </div>

        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* CONTACT CARD */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

            <h3 className="font-semibold text-gray-900 mb-4">
              Contact Information
            </h3>

            <div className="space-y-4 text-sm">

              <div>
                <p className="text-gray-500 mb-1">
                  Email
                </p>

                <p className="font-medium text-gray-900">
                  {selectedPatient.patients?.email || '-'}
                </p>
              </div>

              <div>
                <p className="text-gray-500 mb-1">
                  Phone
                </p>

                <p className="font-medium text-gray-900">
                  {selectedPatient.patients?.phone || '-'}
                </p>
              </div>

              <div>
                <p className="text-gray-500 mb-1">
                  Address
                </p>

                <p className="font-medium text-gray-900">
                  {selectedPatient.patients?.address || '-'}
                </p>
              </div>

            </div>
          </div>

          {/* PERSONAL CARD */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

            <h3 className="font-semibold text-gray-900 mb-4">
              Personal Details
            </h3>

            <div className="space-y-4 text-sm">

              <div>
                <p className="text-gray-500 mb-1">
                  Date of Birth
                </p>

                <p className="font-medium text-gray-900">
                  {selectedPatient.patients
                    ?.date_of_birth
                    ? new Date(
                        selectedPatient.patients.date_of_birth
                      ).toLocaleDateString()
                    : '-'}
                </p>
              </div>

              <div>
                <p className="text-gray-500 mb-1">
                  Patient ID
                </p>

                <p className="font-medium text-gray-900">
                  {selectedPatient.patients?.id ||
                    '-'}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* APPOINTMENT CARD */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

          <div className="flex items-center justify-between mb-5">

            <h3 className="font-semibold text-gray-900">
              Appointment Details
            </h3>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize
              ${
                selectedPatient.status ===
                'completed'
                  ? 'bg-green-100 text-green-700'
                  : selectedPatient.status ===
                    'ongoing'
                  ? 'bg-yellow-100 text-yellow-700'
                  : selectedPatient.status ===
                    'cancelled'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {selectedPatient.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">

            <div>
              <p className="text-gray-500 mb-1">
                Doctor
              </p>

              <p className="font-medium text-gray-900">
                Dr.{' '}
                {selectedPatient.users
                  ?.first_name}{' '}
                {selectedPatient.users
                  ?.last_name}
              </p>
            </div>

            <div>
              <p className="text-gray-500 mb-1">
                Appointment Type
              </p>

              <p className="font-medium text-gray-900 capitalize">
                {selectedPatient.appointment_type}
              </p>
            </div>

            <div>
              <p className="text-gray-500 mb-1">
                Date & Time
              </p>

              <p className="font-medium text-gray-900">
                {new Date(
                  selectedPatient.appointment_date
                ).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-gray-500 mb-1">
                Notes
              </p>

              <p className="font-medium text-gray-900">
                {selectedPatient.notes || '-'}
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="px-6 py-5 border-t border-gray-100 bg-gray-50 flex justify-end">

        <button
          onClick={() => {
            setShowPatientDetails(false);
            setSelectedPatient(null);
          }}
          className="px-5 py-3 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-black transition shadow-sm"
        >
          Close
        </button>

      </div>
    </div>
  </div>
)}
{/* ===================== COMPLETE APPOINTMENT MODAL ===================== */}
{showCompletionForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">

      {/* HEADER */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Complete Appointment
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Finalize consultation and record doctor notes
          </p>
        </div>

        <button
          onClick={() =>
            setShowCompletionForm(false)
          }
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
        >
          ✕
        </button>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmitCompletion}
        className="p-6 space-y-6"
      >

        {/* CONSULTATION FEE CARD */}
        <div className="rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-5">

          <div className="flex items-center justify-between">

            <div>
              <h3 className="font-semibold text-gray-900">
                Consultation Fee
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Enter total consultation charges
              </p>
            </div>

            <div className="text-2xl">
              💰
            </div>
          </div>

          <div className="mt-4">
            <input
              type="number"
              step="0.01"
              required
              value={completionData.fee_amount}
              onChange={(e) =>
                setCompletionData({
                  ...completionData,
                  fee_amount: e.target.value,
                })
              }
              placeholder="Enter consultation fee"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* NOTES */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">
              Doctor Notes
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Clinical notes or consultation summary
            </p>
          </div>

          <textarea
            rows={5}
            value={
              completionData.notes_from_doctor
            }
            onChange={(e) =>
              setCompletionData({
                ...completionData,
                notes_from_doctor:
                  e.target.value,
              })
            }
            placeholder="Enter consultation notes..."
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">

          <button
            type="submit"
            className="flex-1 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3.5 font-semibold shadow-md hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition"
          >
            ✓ Complete Appointment
          </button>

          <button
            type="button"
            onClick={() =>
              setShowCompletionForm(false)
            }
            className="flex-1 rounded-2xl border border-gray-300 bg-white text-gray-700 py-3.5 font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>

        </div>
      </form>
    </div>
  </div>
)}
{/* ===================== PAYMENT MODAL ===================== */}
{showPaymentForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">

      {/* HEADER */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50">

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Record Payment
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Capture appointment payment and transaction details
          </p>
        </div>

        <button
          onClick={() =>
            setShowPaymentForm(false)
          }
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
        >
          ✕
        </button>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleRecordPayment}
        className="p-6 space-y-6"
      >

        {/* PENDING AMOUNT CARD */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-5">

          <div className="flex items-center justify-between">

            <div>
              <h3 className="font-semibold text-gray-900">
                Pending Amount
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Outstanding consultation payment
              </p>
            </div>

            <div className="text-3xl">
              ₹
            </div>
          </div>

          <div className="mt-4">
            <input
              value={pendingAmount}
              readOnly
              className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-xl font-bold text-blue-700"
            />
          </div>
        </div>

        {/* AMOUNT + METHOD */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* AMOUNT PAID */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Amount Paid *
            </label>

            <input
              type="number"
              step="0.01"
              required
              value={paymentData.amount_paid}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  amount_paid:
                    e.target.value,
                })
              }
              placeholder="Enter amount"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* PAYMENT METHOD */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Payment Method
            </label>

            <select
              value={
                paymentData.payment_method
              }
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  payment_method:
                    e.target.value,
                })
              }
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cash">
                Cash
              </option>

              <option value="upi">
                UPI
              </option>

              <option value="card">
                Card
              </option>

              <option value="cheque">
                Cheque
              </option>

              <option value="bank_transfer">
                Bank Transfer
              </option>
            </select>
          </div>
        </div>

        {/* REFERENCE */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Payment Reference
          </label>

          <input
            value={
              paymentData.payment_reference
            }
            onChange={(e) =>
              setPaymentData({
                ...paymentData,
                payment_reference:
                  e.target.value,
              })
            }
            placeholder="Transaction ID / Reference No."
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* NOTES */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Notes
          </label>

          <textarea
            rows={4}
            value={paymentData.notes}
            onChange={(e) =>
              setPaymentData({
                ...paymentData,
                notes: e.target.value,
              })
            }
            placeholder="Additional payment remarks..."
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">

          <button
            type="submit"
            className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3.5 font-semibold shadow-md hover:shadow-lg hover:from-blue-700 hover:to-cyan-700 transition"
          >
            ✓ Save Payment
          </button>

          <button
            type="button"
            onClick={() =>
              setShowPaymentForm(false)
            }
            className="flex-1 rounded-2xl border border-gray-300 bg-white text-gray-700 py-3.5 font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>

        </div>
      </form>
    </div>
  </div>
)}
{/* ===================== VITALS MODAL ===================== */}
{showVitalsForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-auto p-4">

    <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">

      {/* HEADER */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 bg-gradient-to-r from-sky-50 to-cyan-50">

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Patient Vitals
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Record and manage patient vital signs
          </p>
        </div>

        <button
          onClick={() =>
            setShowVitalsForm(false)
          }
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
        >
          ✕
        </button>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSaveVitals}
        className="p-6 space-y-6"
      >

        {/* BLOOD PRESSURE */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-gray-900">
                Blood Pressure
              </h3>

              <p className="text-sm text-gray-500">
                Systolic / Diastolic
              </p>
            </div>

            <div className="text-2xl">
              🩺
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">

            <input
              type="number"
              placeholder="Systolic (mmHg)"
              value={
                vitalsData.blood_pressure_systolic
              }
              onChange={(e) =>
                setVitalsData({
                  ...vitalsData,
                  blood_pressure_systolic:
                    e.target.value,
                })
              }
              className="rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

            <input
              type="number"
              placeholder="Diastolic (mmHg)"
              value={
                vitalsData.blood_pressure_diastolic
              }
              onChange={(e) =>
                setVitalsData({
                  ...vitalsData,
                  blood_pressure_diastolic:
                    e.target.value,
                })
              }
              className="rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

          </div>
        </div>

        {/* HEART + OXYGEN */}
        <div className="grid md:grid-cols-2 gap-5">

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Heart Rate (BPM)
            </label>

            <input
              type="number"
              placeholder="Heart Rate"
              value={vitalsData.heart_rate}
              onChange={(e) =>
                setVitalsData({
                  ...vitalsData,
                  heart_rate:
                    e.target.value,
                })
              }
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Oxygen Saturation (%)
            </label>

            <input
              type="number"
              placeholder="SpO₂"
              value={
                vitalsData.oxygen_saturation
              }
              onChange={(e) =>
                setVitalsData({
                  ...vitalsData,
                  oxygen_saturation:
                    e.target.value,
                })
              }
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

        </div>

        {/* TEMP + WEIGHT */}
        <div className="grid md:grid-cols-2 gap-5">

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Temperature (°C)
            </label>

            <input
              type="number"
              step="0.1"
              placeholder="Temperature"
              value={vitalsData.temperature}
              onChange={(e) =>
                setVitalsData({
                  ...vitalsData,
                  temperature:
                    e.target.value,
                })
              }
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Weight (Kg)
            </label>

            <input
              type="number"
              step="0.1"
              placeholder="Weight"
              value={vitalsData.weight}
              onChange={(e) =>
                setVitalsData({
                  ...vitalsData,
                  weight:
                    e.target.value,
                })
              }
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

        </div>

        {/* HEIGHT */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">

          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Height (cm)
          </label>

          <input
            type="number"
            step="0.1"
            placeholder="Height"
            value={vitalsData.height}
            onChange={(e) =>
              setVitalsData({
                ...vitalsData,
                height: e.target.value,
              })
            }
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">

          <button
            type="submit"
            className="flex-1 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 text-white py-3.5 font-semibold shadow-md hover:shadow-lg hover:from-sky-700 hover:to-cyan-700 transition"
          >
            ✓ Save Vitals
          </button>

          <button
            type="button"
            onClick={() =>
              setShowVitalsForm(false)
            }
            className="flex-1 rounded-2xl border border-gray-300 bg-white text-gray-700 py-3.5 font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>

        </div>
      </form>
    </div>
  </div>
)}
  </div>
);
</div>
</div>
);}