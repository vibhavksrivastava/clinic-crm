'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { useState, useEffect, } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardUrl } from '@/lib/utils/dashboard';
import {
  Package,
  AlertTriangle,
  IndianRupee,
  Receipt,
  Pill,
  ShoppingCart,
  Activity,
  FileText,
  Truck,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Plus,
} from 'lucide-react';

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
  staff_id: string;
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

  staff?: {
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
    staff_id: '',
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
      staff_id: '',
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
          staff_id: formData.staff_id,
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
      appointmentId: string
    ) => {
      router.push(
        `/prescriptions?appointment_id=${appointmentId}`
      );
    };

    return (
      <div className="min-h-screen bg-[#f4f7fb]">
      {/*<Header />*/}

      <main className="p-4 md:p-6">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_25%)]" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md">
                <Activity size={16} />
                Appointments Management System
              </div>

              <h1 className="text-4xl font-bold tracking-tight">
                Appointments Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-base text-blue-100">
                Manage Appointments,
                Write Prescriptions, Record Payments and
                view patients Medical history and Growth Chart.
              </p>
            </div>

            <button
              onClick={() =>
                router.push(
                  '/pharmacy/sales/create'
                )
              }
              className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 font-semibold text-slate-900 transition hover:scale-[1.02]"
            >
              <Plus size={20} />
              Add Appointment
            </button>
          </div>
        </div>    

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
          <div className="text-sm text-slate-500 font-medium">
            Scheduled
          </div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {appointments.filter(a => a.status === 'scheduled').length}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
          <div className="text-sm text-slate-500 font-medium">
            Ongoing
          </div>
          <div className="mt-2 text-3xl font-bold text-amber-600">
            {appointments.filter(a => a.status === 'ongoing').length}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
          <div className="text-sm text-slate-500 font-medium">
            Completed
          </div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {appointments.filter(a => a.status === 'completed').length}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
          <div className="text-sm text-slate-500 font-medium">
            Cancelled
          </div>
          <div className="mt-2 text-3xl font-bold text-red-600">
            {appointments.filter(a => a.status === 'cancelled').length}
          </div>
        </div>

      </div>

      {/* APPOINTMENT FORM */}
      {showForm && (
        <div className="mb-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Schedule Appointment
            </h2>

            <button
              onClick={resetForm}
              className="text-slate-500 hover:text-red-500 text-xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

              <select
                value={formData.patient_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    patient_id: e.target.value,
                  })
                }
                required
                className="px-4 py-3 border border-slate-300 rounded-2xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>

              <select
                value={formData.staff_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    staff_id: e.target.value,
                  })
                }
                required
                className="px-4 py-3 border border-slate-300 rounded-2xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Doctor</option>

                {doctors.map((s) => (
                  <option key={s.id} value={s.id}>
                    Dr. {s.first_name} {s.last_name}
                  </option>
                ))}
              </select>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

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
                className="px-4 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
              />

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
                className="px-4 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

              <select
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: e.target.value,
                  })
                }
                className="px-4 py-3 border border-slate-300 rounded-2xl"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="45">45 Minutes</option>
                <option value="60">1 Hour</option>
              </select>

              <select
                value={formData.appointment_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    appointment_type: e.target.value,
                  })
                }
                className="px-4 py-3 border border-slate-300 rounded-2xl"
              >
                <option value="consultation">Consultation</option>
                <option value="follow-up">Follow-up</option>
                <option value="procedure">Procedure</option>
              </select>

            </div>

            <textarea
              rows={3}
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notes: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-slate-300 rounded-2xl mb-5"
            />

            <div className="flex flex-wrap gap-3">

              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold shadow hover:shadow-lg transition"
              >
                {editingId
                  ? 'Update Appointment'
                  : 'Schedule Appointment'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 rounded-2xl bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition"
              >
                Cancel
              </button>

            </div>
          </form>
        </div>
      )}

      {/* STATUS TABS */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-2 mb-6">

        <div className="flex overflow-x-auto gap-2">

          {(
            [
              'scheduled',
              'ongoing',
              'completed',
              'cancelled',
            ] as const
          ).map((tab) => {

            const count =
              appointments.filter(
                (a) => a.status === tab
              ).length;

            return (
              <button
                key={tab}
                onClick={() =>
                  setAppointmentView(tab)
                }
                className={`px-5 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition ${
                  appointmentView === tab
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() +
                  tab.slice(1)}{' '}
                ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* TABLE CONTAINER START */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
          <div className="p-14 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">
              Loading appointments...
            </p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-14 text-center">
            <div className="text-6xl mb-3">📅</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No {appointmentView} appointments
            </h3>
            <p className="text-slate-500">
              Appointments will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">
                      Doctor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">
                      Fee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">
                      Payment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((apt) => (
                    <tr
                      key={apt.id}
                      className="hover:bg-blue-50/50 transition"
                    >
                      {/* PATIENT */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedPatient(apt);
                            setShowPatientDetails(true);
                          }}
                          className="font-semibold text-blue-600 hover:text-blue-800"
                        >
                          {apt.patients?.first_name}{' '}
                          {apt.patients?.last_name}
                        </button>
                      </td>

                      {/* DOCTOR */}
                      <td className="px-6 py-4 text-slate-700">
                        Dr. {apt.staff?.first_name}{' '}
                        {apt.staff?.last_name}
                      </td>

                      {/* DATE */}
                      <td className="px-6 py-4 text-slate-700">
                        {new Date(
                          apt.appointment_date
                        ).toLocaleString()}
                      </td>

                      {/* TYPE */}
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold capitalize">
                          {apt.appointment_type}
                        </span>
                      </td>

                      {/* FEE */}
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        ₹
                        {apt.fee_amount != null
                          ? Number(
                              apt.fee_amount
                            ).toFixed(2)
                          : '-'}
                      </td>

                      {/* PAYMENT */}
                      <td className="px-6 py-4">
                        {apt.appointment_payments?.[0] ? (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              apt
                                .appointment_payments[0]
                                .payment_status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {
                              apt
                                .appointment_payments[0]
                                .payment_status
                            }
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">

                          {/* SCHEDULED */}
                          {apt.status ===
                            'scheduled' &&
                            userContext?.roleType ===
                              'doctor' && (
                              <button
                                onClick={() =>
                                  handleMarkOngoing(
                                    apt.id
                                  )
                                }
                                className="px-3 py-2 rounded-xl bg-amber-100 text-amber-700 text-sm font-semibold hover:bg-amber-200"
                              >
                                Mark Ongoing
                              </button>
                            )}

                          {/* ONGOING */}
                          {apt.status ===
                            'ongoing' &&
                            userContext?.roleType ===
                              'doctor' && (
                              <>
                                <button
                                  onClick={() => {
                                    setVitalsAppointmentId(
                                      apt.id
                                    );
                                    setShowVitalsForm(
                                      true
                                    );
                                  }}
                                  className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 text-sm font-semibold"
                                >
                                  Vitals
                                </button>

                                <button
                                  onClick={() =>
                                    router.push(
                                      `/prescriptions/create?appointment_id=${apt.id}`
                                    )
                                  }
                                  className="px-3 py-2 rounded-xl bg-indigo-100 text-indigo-700 text-sm font-semibold"
                                >
                                  Rx Write
                                </button>

                                <button
                                  onClick={() =>
                                    handleCompleteAppointment(
                                      apt.id
                                    )
                                  }
                                  className="px-3 py-2 rounded-xl bg-green-100 text-green-700 text-sm font-semibold"
                                >
                                  Complete
                                </button>
                              </>
                            )}

                          {/* COMPLETED */}
                          {apt.status ===
                            'completed' && (
                            <>
                              <button
                                onClick={() =>
                                  router.push(
                                    `/prescriptions?appointment_id=${apt.id}`
                                  )
                                }
                                className="px-3 py-2 rounded-xl bg-purple-100 text-purple-700 text-sm font-semibold"
                              >
                                View Rx
                              </button>
                            </>
                          )}

                          {/* CANCEL */}
                          {(apt.status ===
                            'scheduled' ||
                            apt.status ===
                              'ongoing') &&
                            [
                              'receptionist',
                              'clinic_admin',
                              'branch_admin',
                            ].includes(
                              userContext?.roleType ||
                                ''
                            ) && (
                              <button
                                onClick={() =>
                                  handleCancelAppointment(
                                    apt.id
                                  )
                                }
                                className="px-3 py-2 rounded-xl bg-red-100 text-red-700 text-sm font-semibold"
                              >
                                Cancel
                              </button>
                            )}

                          {/* PAYMENT */}
                          {apt.status ===
                            'completed' &&
                            userContext?.roleType ===
                              'receptionist' && (
                              <button
                                onClick={() => {
                                  setPaymentAppointmentId(
                                    apt.id
                                  );
                                  setPendingAmount(
                                    apt.fee_amount ||
                                      0
                                  );
                                  setShowPaymentForm(
                                    true
                                  );
                                }}
                                className="px-3 py-2 rounded-xl bg-cyan-100 text-cyan-700 text-sm font-semibold"
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

            {/* MOBILE CARDS */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-5 space-y-4"
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {
                          apt.patients
                            ?.first_name
                        }{' '}
                        {
                          apt.patients
                            ?.last_name
                        }
                      </h3>
                      <p className="text-sm text-slate-500">
                        Dr.{' '}
                        {
                          apt.staff
                            ?.first_name
                        }{' '}
                        {
                          apt.staff
                            ?.last_name
                        }
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold capitalize">
                      {apt.status}
                    </span>
                  </div>

                  <div className="text-sm text-slate-600">
                    {new Date(
                      apt.appointment_date
                    ).toLocaleString()}
                  </div>

                  <div className="flex flex-wrap gap-2">

                    {apt.status ===
                      'scheduled' &&
                      userContext?.roleType ===
                        'doctor' && (
                        <button
                          onClick={() =>
                            handleMarkOngoing(
                              apt.id
                            )
                          }
                          className="px-3 py-2 rounded-xl bg-amber-100 text-amber-700 text-sm font-semibold"
                        >
                          Mark Ongoing
                        </button>
                      )}

                    {apt.status ===
                      'completed' && (
                      <button
                        onClick={() =>
                          router.push(
                            `/prescriptions?appointment_id=${apt.id}`
                          )
                        }
                        className="px-3 py-2 rounded-xl bg-purple-100 text-purple-700 text-sm font-semibold"
                      >
                        View Rx
                      </button>
                    )}

                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
 </div>
);
}