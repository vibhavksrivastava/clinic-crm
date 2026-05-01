'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardUrl } from '@/lib/utils/dashboard';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  specialization?: string;
}

interface ReminderMessage {
  appointment_id: string;
  type: 'doctor' | 'patient';
  title: string;
  message: string;
  appointment_date: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  doctor?: {
    id: string;
    first_name: string;
    last_name: string;
    specialization?: string;
  };
}

interface Appointment {
  id: string;
  patient_id: string;
  staff_id: string;
  appointment_date: string;
  duration_minutes: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  appointment_type: string;
  fee_amount: number | null;
  notes: string;
  patients?: Patient;
  staff?: Staff;
  invoice?: {
    id: string;
    amount: number;
    amount_paid: number;
    status: string;
    payment_mode?: string;
  };
  prescriptions?: Array<{
    id: string;
    medications: any;
    status: string;
  }>;
}

interface UserContext {
  roleType: string;
  userId: string;
  organizationId?: string;
  branchId?: string;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [invoices, setInvoices] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [appointmentView, setAppointmentView] = useState<'scheduled' | 'ongoing' | 'completed' | 'cancelled'>('scheduled');
  const [schedulingConflict, setSchedulingConflict] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Appointment | null>(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    staff_id: '',
    appointment_date: '',
    appointment_time: '',
    duration_minutes: '30',
    appointment_type: 'consultation',
    notes: '',
  });

  // Doctor-specific states
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [completingAppointmentId, setCompletingAppointmentId] = useState<string | null>(null);
  const [completionData, setCompletionData] = useState({
    fee_amount: '',
    notes_from_doctor: '',
  });

  // Receptionist-specific states
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAppointmentId, setPaymentAppointmentId] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [paymentData, setPaymentData] = useState({
    amount_paid: '',
    payment_method: 'cash',
    payment_reference: '',
    notes: '',
  });

  // Prescription-specific states
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [prescriptionAppointmentId, setPrescriptionAppointmentId] = useState<string | null>(null);
  const [prescriptionMedicines, setPrescriptionMedicines] = useState([
    { id: '1', medication_name: '', dosage: '', frequency: '', quantity: 0 }
  ]);
  const [prescriptionData, setPrescriptionData] = useState({
    notes: '',
  });
  const [appointmentPrescriptions, setAppointmentPrescriptions] = useState<any[]>([]);
  const [showViewPrescriptions, setShowViewPrescriptions] = useState(false);
  const [viewPrescriptionsId, setViewPrescriptionsId] = useState<string | null>(null);
  const [doctorReminders, setDoctorReminders] = useState<ReminderMessage[]>([]);
  const [doctorRemindersLoading, setDoctorRemindersLoading] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState<string>('/dashboard');

  useEffect(() => {
    setDashboardUrl(getDashboardUrl());
  }, []);

  useEffect(() => {
    getUserRole();
  }, []);

  // Fetch data when userContext is loaded
  useEffect(() => {
    if (userContext?.organizationId) {
      fetchData();
    }
  }, [userContext]);

  useEffect(() => {
    const fetchDoctorReminders = async () => {
      if (userContext?.roleType !== 'doctor') return;
      setDoctorRemindersLoading(true);
      try {
        const res = await fetch('/api/appointments/reminders?type=doctor');
        if (res.ok) {
          const data = await res.json();
          setDoctorReminders(Array.isArray(data.reminders) ? data.reminders : []);
        }
      } catch (error) {
        console.error('Error fetching doctor reminders:', error);
      } finally {
        setDoctorRemindersLoading(false);
      }
    };

    fetchDoctorReminders();
  }, [userContext]);

  const getUserRole = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Parse JWT to get user info
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('📋 JWT Payload:', payload);
          const context = {
            roleType: payload.role_type || payload.roleType,
            userId: payload.sub || payload.userId,
            organizationId: payload.organizationId || payload.organization_id,
            branchId: payload.branchId || payload.branch_id,
          };
          console.log('👤 User Context:', context);
          setUserContext(context);
        }
      } else {
        console.error('❌ No auth token found');
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Build staff query with organization and branch filters
      let staffUrl = '/api/staff?role=doctor';
      if (userContext?.organizationId) {
        staffUrl += `&organizationId=${userContext.organizationId}`;
        console.log('✓ Using organizationId:', userContext.organizationId);
      } else {
        console.warn('⚠️ organizationId NOT set in userContext');
      }
      if (userContext?.branchId) {
        staffUrl += `&branchId=${userContext.branchId}`;
        console.log('✓ Using branchId:', userContext.branchId);
      }
      
      console.log('Fetching staff from URL:', staffUrl);
      
      // Build appointments URL with organization filter
      let appointmentsUrl = '/api/appointments?include_details=true';
      if (userContext?.organizationId) {
        // Note: We're passing this as context in the JWT, so the API will auto-filter
        console.log('✓ Appointments will be filtered by organizationId:', userContext.organizationId);
      }
      
      const [appointmentsRes, patientsRes, staffRes] = await Promise.all([
        fetch(appointmentsUrl),
        fetch('/api/patients'),
        fetch(staffUrl),
      ]);

      const appointmentsData = await appointmentsRes.json();
      const patientsData = await patientsRes.json();
      const staffData = await staffRes.json();
      
      console.log('Staff API response:', staffData);
      console.log('Number of doctors returned:', Array.isArray(staffData) ? staffData.length : 'not an array');
      if (Array.isArray(staffData) && staffData.length > 0) {
        console.log('First doctor:', staffData[0]);
      }

      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
      setStaff(Array.isArray(staffData) ? staffData : []);

      // Fetch invoices for completed appointments
      const completedAppointments = Array.isArray(appointmentsData) ? appointmentsData.filter((apt: any) => apt.status === 'completed') : [];
      if (completedAppointments.length > 0) {
        const invoiceMap: { [key: string]: any } = {};
        await Promise.all(
          completedAppointments.map(async (apt: any) => {
            try {
              const invoiceRes = await fetch(`/api/invoices?appointment_id=${apt.id}`);
              if (invoiceRes.ok) {
                const invoiceData = await invoiceRes.json();
                invoiceMap[apt.id] = invoiceData;
              }
            } catch (error) {
              console.error(`Error fetching invoice for appointment ${apt.id}:`, error);
            }
          })
        );
        setInvoices(invoiceMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dateTime = `${formData.appointment_date}T${formData.appointment_time}:00`;

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/appointments?id=${editingId}` : '/api/appointments';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: formData.patient_id,
          user_id: formData.staff_id,
          appointment_date: dateTime,
          duration_minutes: parseInt(formData.duration_minutes),
          appointment_type: formData.appointment_type,
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const handleCompleteAppointment = (id: string) => {
    setCompletingAppointmentId(id);
    setCompletionData({ fee_amount: '', notes_from_doctor: '' });
    setShowCompletionForm(true);
  };

  const handleSubmitCompletion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!completingAppointmentId || !completionData.fee_amount) {
      alert('Please enter a fee amount');
      return;
    }

    try {
      console.log('📝 Completing appointment:', {
        appointmentId: completingAppointmentId,
        feeAmount: completionData.fee_amount,
        notes: completionData.notes_from_doctor,
      });

      const response = await fetch(`/api/appointments?id=${completingAppointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          fee_amount: parseFloat(completionData.fee_amount),
          notes: completionData.notes_from_doctor,
        }),
      });

      const responseData = await response.json();
      console.log('Response:', response.status, responseData);

      if (response.ok) {
        alert('✅ Appointment completed successfully');
        setShowCompletionForm(false);
        fetchData();
      } else {
        alert(`❌ Error: ${responseData.error || 'Failed to complete appointment'}`);
        console.error('Error response:', responseData);
      }
    } catch (error) {
      console.error('❌ Error completing appointment:', error);
      alert(`❌ Error: ${(error as any).message || 'Failed to complete appointment'}`);
    }
  };

  const handleMarkOngoing = async (id: string) => {
    try {
      const response = await fetch(`/api/appointments?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ongoing' }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error marking appointment as ongoing:', error);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const response = await fetch(`/api/appointments?id=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' }),
        });

        if (response.ok) {
          fetchData();
        }
      } catch (error) {
        console.error('Error cancelling appointment:', error);
      }
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentAppointmentId || !paymentData.amount_paid) {
      alert('Please enter payment amount');
      return;
    }

    try {
      // Fetch invoice by appointment_id to get invoice ID
      const invoiceRes = await fetch(`/api/invoices?appointment_id=${paymentAppointmentId}`);
      if (!invoiceRes.ok) {
        alert('❌ Invoice not found for this appointment');
        return;
      }

      const invoice = await invoiceRes.json();
      const invoiceId = invoice.id;

      console.log('📝 Recording payment:', {
        appointmentId: paymentAppointmentId,
        invoiceId: invoiceId,
        amount_paid: paymentData.amount_paid,
        payment_method: paymentData.payment_method,
      });

      // Update invoice with payment information
      const response = await fetch(`/api/invoices?id=${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          payment_mode: paymentData.payment_method,
          amount_paid: parseFloat(paymentData.amount_paid),
          notes: paymentData.notes || `Payment method: ${paymentData.payment_method}${paymentData.payment_reference ? ', Ref: ' + paymentData.payment_reference : ''}`,
        }),
      });

      if (response.ok) {
        alert('✅ Payment recorded successfully');
        setShowPaymentForm(false);
        setPaymentData({
          amount_paid: '',
          payment_method: 'cash',
          payment_reference: '',
          notes: '',
        });
        fetchData();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to record payment'}`);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert(`❌ Error recording payment: ${(error as any).message}`);
    }
  };

  const fetchInvoiceForAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/invoices?appointment_id=${appointmentId}`);
      if (response.ok) {
        const invoiceData = await response.json();
        if (invoiceData && invoiceData.amount) {
          return invoiceData.amount;
        }
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    }
    return 0;
  };

  const handleAddPrescriptionMedicine = () => {
    const newId = (Math.max(...prescriptionMedicines.map(m => parseInt(m.id) || 0), 0) + 1).toString();
    setPrescriptionMedicines([...prescriptionMedicines, { id: newId, medication_name: '', dosage: '', frequency: '', quantity: 0 }]);
  };

  const handleRemovePrescriptionMedicine = (id: string) => {
    if (prescriptionMedicines.length > 1) {
      setPrescriptionMedicines(prescriptionMedicines.filter(m => m.id !== id));
    }
  };

  const handlePrescriptionMedicineChange = (id: string, field: string, value: string | number) => {
    setPrescriptionMedicines(prescriptionMedicines.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleWritePrescription = (appointmentId: string, patientId: string) => {
    setPrescriptionAppointmentId(appointmentId);
    setPrescriptionMedicines([{ id: '1', medication_name: '', dosage: '', frequency: '', quantity: 0 }]);
    setPrescriptionData({ notes: '' });
    setShowPrescriptionForm(true);
  };

  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prescriptionAppointmentId) {
      alert('No appointment selected');
      return;
    }

    // Find the appointment to get patient and doctor info
    const appointment = appointments.find(a => a.id === prescriptionAppointmentId);
    if (!appointment) {
      alert('Appointment not found');
      return;
    }

    // Validate at least one medicine
    if (prescriptionMedicines.some(m => !m.medication_name || !m.dosage || !m.frequency)) {
      alert('Please fill in all medicine details');
      return;
    }

    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: appointment.patient_id,
          staff_id: userContext?.userId,
          appointment_id: prescriptionAppointmentId,
          medications: prescriptionMedicines,
          issued_date: new Date().toISOString().split('T')[0],
          status: 'active',
          notes: prescriptionData.notes,
        }),
      });

      if (response.ok) {
        alert('✅ Prescription created successfully');
        setShowPrescriptionForm(false);
        setPrescriptionMedicines([{ id: '1', medication_name: '', dosage: '', frequency: '', quantity: 0 }]);
        setPrescriptionData({ notes: '' });
        fetchData();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to create prescription'}`);
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      alert('❌ Error creating prescription');
    }
  };

  const handleViewPrescriptionsClick = (patientId: string) => {
    //setViewPrescriptionsId(appointmentId);
    setShowViewPrescriptions(true);
    fetchPrescriptionsForAppointment(patientId);
  };

  const fetchPrescriptionsForAppointment = async (patientId: string) => {
    try {
      const response = await fetch(`/api/prescriptions?patient_id=${patientId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Show all prescriptions for this patient, regardless of appointment
        const allPrescriptions = Array.isArray(data) ? data : [];
        setAppointmentPrescriptions(allPrescriptions);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  //const handleViewPrescriptions = (appointmentId: string, patientId: string) => {
  //  setViewPrescriptionsId(appointmentId);
    const handleViewPrescriptions = (patientId: string) => {
    //setViewPrescriptionsId(appointmentId);
    setShowViewPrescriptions(true);
    fetchPrescriptionsForAppointment(patientId);
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      staff_id: '',
      appointment_date: '',
      appointment_time: '',
      duration_minutes: '30',
      appointment_type: 'consultation',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
    setSchedulingConflict(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAppointments = appointments.filter((apt) => apt.status === appointmentView);
  const tableData = filteredAppointments;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push(dashboardUrl)}
              className="text-blue-600 hover:text-blue-900 font-semibold mb-2 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-gray-900">Appointment Management</h1>
            <p className="mt-2 text-gray-600">View and manage patient appointments</p>
          </div>
        </div>

        {/* Appointment Form */}
        {!showForm && (userContext?.roleType === 'receptionist' || userContext?.roleType === 'clinic_admin') && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            + Schedule Appointment
          </button>
        )}

        {showForm && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Schedule New Appointment</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg"
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
                  onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Doctor</option>
                  {staff
                    .filter((s) => s.specialization === 'doctor' || s.specialization)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <select
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                </select>
                <select
                  value={formData.appointment_type}
                  onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="procedure">Procedure</option>
                </select>
              </div>

              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                rows={3}
              ></textarea>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                >
                  Schedule Appointment
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {userContext?.roleType === 'doctor' && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Doctor Reminder</h2>
                <p className="text-sm text-gray-600">Daily appointment summary for your clinic day.</p>
              </div>
              {doctorRemindersLoading && <span className="text-sm text-gray-500">Loading reminders...</span>}
            </div>
            {doctorReminders.length === 0 ? (
              <p className="text-gray-600">No reminders available.</p>
            ) : (
              doctorReminders.map((reminder) => (
                <div key={reminder.appointment_id} className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{reminder.title}</h3>
                  <pre className="whitespace-pre-wrap text-gray-700">{reminder.message}</pre>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 overflow-x-auto">
          {['scheduled', 'ongoing', 'completed', 'cancelled'].map((tab) => {
            const tabCount = appointments.filter((apt) => apt.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setAppointmentView(tab as any)}
                className={`px-6 py-3 font-semibold border-b-2 transition capitalize ${
                  appointmentView === tab
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tabCount})
              </button>
            );
          })}
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading appointments...</div>
          ) : tableData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No {appointmentView} appointments available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Patient</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Doctor</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Date & Time</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Fee</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Payment</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tableData.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50">
                      <td
                        className="px-6 py-4 text-sm cursor-pointer text-blue-600 hover:underline"
                        onClick={() => {
                          setSelectedPatient(apt);
                          setShowPatientDetails(true);
                        }}
                      >
                        {apt.patients?.first_name} {apt.patients?.last_name}
                      </td>
                      <td className="px-6 py-4 text-sm">{apt.staff?.first_name} {apt.staff?.last_name}</td>
                      <td className="px-6 py-4 text-sm">{new Date(apt.appointment_date).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm capitalize">{apt.appointment_type}</td>
                      <td className="px-6 py-4 text-sm">
                        {apt.status === 'completed' && invoices[apt.id]
                          ? `$${invoices[apt.id].amount?.toFixed(2) || '0.00'}`
                          : `$${apt.fee_amount?.toFixed(2) || '-'}`}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {invoices[apt.id] ? (
                          <div className="space-y-1">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                invoices[apt.id].status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {invoices[apt.id].status}
                            </span>
                            {invoices[apt.id].amount_paid > 0 && (
                              <div className="text-xs text-gray-600 mt-1">
                                Paid: ${invoices[apt.id].amount_paid?.toFixed(2) || '0.00'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm space-y-2">
                        {apt.status === 'scheduled' && userContext?.roleType === 'doctor' && (
                          <>
                            <button
                              onClick={() => handleMarkOngoing(apt.id)}
                              className="block text-yellow-600 hover:text-yellow-900 font-semibold"
                            >
                              Mark Ongoing
                            </button>
                            <button
                              onClick={() => handleCompleteAppointment(apt.id)}
                              className="block text-green-600 hover:text-green-900 font-semibold"
                            >
                              Complete
                            </button>
                          </>
                        )}
                        {apt.status === 'ongoing' && userContext?.roleType === 'doctor' && (
                          <>
                            <button
                              onClick={() => handleWritePrescription(apt.id, apt.patient_id)}
                              className="block text-blue-600 hover:text-blue-900 font-semibold"
                            >
                              Rx Write Prescription
                            </button>
                            <button
                              onClick={() => handleViewPrescriptionsClick(apt.patient_id)}
                              className="block text-purple-600 hover:text-purple-900 font-semibold"
                            >
                              📋 View Prescriptions
                            </button>
                            <button
                              onClick={() => handleCompleteAppointment(apt.id)}
                              className="block text-green-600 hover:text-green-900 font-semibold"
                            >
                              Complete
                            </button>
                          </>
                        )}
                        {(apt.status === 'scheduled' || apt.status === 'ongoing') &&
                          ['receptionist', 'clinic_admin', 'branch_admin'].includes(userContext?.roleType || '') && (
                            <button
                              onClick={() => handleCancelAppointment(apt.id)}
                              className="block text-red-600 hover:text-red-900 font-semibold"
                            >
                              Cancel
                            </button>
                          )}
                        {apt.status === 'completed' && userContext?.roleType === 'receptionist' && (
                          <button
                            onClick={async () => {
                              setPaymentAppointmentId(apt.id);
                              // Fetch invoice to get pending amount
                              const invoiceAmount = await fetchInvoiceForAppointment(apt.id);
                              const pendingAmt = invoiceAmount || apt.fee_amount || 0;
                              setPendingAmount(pendingAmt);
                              setPaymentData({
                                amount_paid: pendingAmt.toString(),
                                payment_method: 'cash',
                                payment_reference: '',
                                notes: '',
                              });
                              setShowPaymentForm(true);
                            }}
                            className="block text-blue-600 hover:text-blue-900 font-semibold"
                          >
                            Record Payment
                          </button>
                        )}
                        {apt.status === 'completed' && userContext?.roleType === 'doctor' && (
                          <button
                            onClick={() => handleViewPrescriptionsClick(apt.patient_id)}
                            className="block text-purple-600 hover:text-purple-900 font-semibold"
                          >
                            📋 View Prescriptions
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Patient Details Modal */}
      {showPatientDetails && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Patient Details</h2>
                <button
                  onClick={() => setShowPatientDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              {selectedPatient.patients && (
                <div className="space-y-3">
                  <p>
                    <strong>Name:</strong> {selectedPatient.patients.first_name} {selectedPatient.patients.last_name}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedPatient.patients.email || '-'}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedPatient.patients.phone || '-'}
                  </p>
                  <p>
                    <strong>Date of Birth:</strong> {selectedPatient.patients.date_of_birth || '-'}
                  </p>
                  <p>
                    <strong>Address:</strong> {selectedPatient.patients.address || '-'}
                  </p>
                  <p>
                    <strong>Appointment Type:</strong> {selectedPatient.appointment_type}
                  </p>
                  <p>
                    <strong>Appointment Date:</strong> {new Date(selectedPatient.appointment_date).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Doctor Completion Modal */}
      {showCompletionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Complete Appointment</h2>
              <form onSubmit={handleSubmitCompletion}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Fee Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={completionData.fee_amount}
                    onChange={(e) => setCompletionData({ ...completionData, fee_amount: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter fee amount"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Doctor Notes</label>
                  <textarea
                    value={completionData.notes_from_doctor}
                    onChange={(e) => setCompletionData({ ...completionData, notes_from_doctor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Add any notes from the appointment"
                  ></textarea>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                  >
                    Complete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCompletionForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Recording Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Record Payment</h2>
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-sm font-semibold text-blue-900">Pending Amount: ${pendingAmount.toFixed(2)}</p>
              </div>
              <form onSubmit={handleRecordPayment}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Amount Paid * (editable)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.amount_paid}
                    onChange={(e) => setPaymentData({ ...paymentData, amount_paid: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Payment Method</label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Payment Reference</label>
                  <input
                    type="text"
                    value={paymentData.payment_reference}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_reference: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Transaction ID, Cheque No, etc."
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Notes</label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                    placeholder="Add any notes"
                  ></textarea>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                  >
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Write Prescription Modal */}
      {showPrescriptionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">💊 Write Prescription</h2>
                <button
                  onClick={() => setShowPrescriptionForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitPrescription}>
                {/* Medicines Section */}
                <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">💊 Add Medicines</h3>
                    <button
                      type="button"
                      onClick={handleAddPrescriptionMedicine}
                      className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition text-sm"
                    >
                      + Add Medicine
                    </button>
                  </div>

                  <div className="space-y-4">
                    {prescriptionMedicines.map((med, index) => (
                      <div key={med.id} className="bg-white p-4 rounded-lg border-2 border-blue-100">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-gray-800">Medicine #{index + 1}</h4>
                          {prescriptionMedicines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePrescriptionMedicine(med.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Medication Name *"
                            value={med.medication_name}
                            onChange={(e) => handlePrescriptionMedicineChange(med.id, 'medication_name', e.target.value)}
                            required
                            className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Dosage (e.g., 500mg) *"
                            value={med.dosage}
                            onChange={(e) => handlePrescriptionMedicineChange(med.id, 'dosage', e.target.value)}
                            required
                            className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Frequency (e.g., Twice daily) *"
                            value={med.frequency}
                            onChange={(e) => handlePrescriptionMedicineChange(med.id, 'frequency', e.target.value)}
                            required
                            className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="number"
                            placeholder="Quantity *"
                            value={med.quantity}
                            onChange={(e) => handlePrescriptionMedicineChange(med.id, 'quantity', parseInt(e.target.value) || 0)}
                            required
                            min="1"
                            className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
                  <textarea
                    value={prescriptionData.notes}
                    onChange={(e) => setPrescriptionData({ ...prescriptionData, notes: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="e.g., Take after food, Avoid dairy products"
                  ></textarea>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                  >
                    Create Prescription
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrescriptionForm(false)}
                    className="flex-1 px-4 py-3 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Prescriptions Modal */}
      {showViewPrescriptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">📋 Prescriptions</h2>
                <button
                  onClick={() => setShowViewPrescriptions(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl"
                >
                  ×
                </button>
              </div>
              {appointmentPrescriptions.length === 0 ? (
                <p className="text-gray-500 text-lg">No prescriptions yet for this appointment.</p>
              ) : (
                <div className="space-y-6">
                  {appointmentPrescriptions.map((presc: any) => (
                    <div key={presc.id} className="border-2 border-blue-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">💊 Prescription</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Issued: {new Date(presc.issued_date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold capitalize">
                          {presc.status || 'active'}
                        </span>
                      </div>

                      {/* Medicines */}
                      {presc.medications && Array.isArray(presc.medications) && presc.medications.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-bold text-gray-800 mb-3">Medicines:</h4>
                          <div className="space-y-2">
                            {presc.medications.map((med: any, idx: number) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="font-semibold text-gray-900">{med.medication_name}</p>
                                <div className="grid grid-cols-3 gap-2 text-sm text-gray-700 mt-2">
                                  <p><strong>Dosage:</strong> {med.dosage}</p>
                                  <p><strong>Frequency:</strong> {med.frequency}</p>
                                  <p><strong>Quantity:</strong> {med.quantity}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {presc.notes && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <p className="text-sm"><strong>Notes:</strong> {presc.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowViewPrescriptions(false)}
                  className="w-full px-4 py-3 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
