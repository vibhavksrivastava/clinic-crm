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
  appointment_payments?: Array<{
    payment_status: string;
    amount_paid: number;
    amount_due: number;
  }>;
  prescriptions?: Array<{
    id: string;
    medications: any;
    status: string;
  }>;
}

interface UserContext {
  roleType: string;
  userId: string;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
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
  const [paymentData, setPaymentData] = useState({
    amount_paid: '',
    payment_method: 'cash',
    payment_reference: '',
    notes: '',
  });
  const [dashboardUrl, setDashboardUrl] = useState<string>('/dashboard');

  useEffect(() => {
    setDashboardUrl(getDashboardUrl());
  }, []);

  useEffect(() => {
    fetchData();
    getUserRole();
  }, []);

  const getUserRole = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Parse JWT to get user info
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          setUserContext({
            roleType: payload.role_type || payload.roleType,
            userId: payload.sub || payload.userId,
          });
        }
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, patientsRes, staffRes] = await Promise.all([
        fetch('/api/appointments?include_details=true'),
        fetch('/api/patients'),
        fetch('/api/staff'),
      ]);

      const appointmentsData = await appointmentsRes.json();
      const patientsData = await patientsRes.json();
      const staffData = await staffRes.json();

      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
      setStaff(Array.isArray(staffData) ? staffData : []);
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
          staff_id: formData.staff_id,
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
      const response = await fetch(`/api/appointments?id=${completingAppointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          fee_amount: parseFloat(completionData.fee_amount),
          notes_from_doctor: completionData.notes_from_doctor,
        }),
      });

      if (response.ok) {
        setShowCompletionForm(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
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
      const response = await fetch('/api/appointments/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: paymentAppointmentId,
          amount_paid: parseFloat(paymentData.amount_paid),
          payment_method: paymentData.payment_method,
          payment_reference: paymentData.payment_reference,
          notes: paymentData.notes,
        }),
      });

      if (response.ok) {
        setShowPaymentForm(false);
        setPaymentData({
          amount_paid: '',
          payment_method: 'cash',
          payment_reference: '',
          notes: '',
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error recording payment:', error);
    }
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

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 overflow-x-auto">
          {['scheduled', 'ongoing', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setAppointmentView(tab as any)}
              className={`px-6 py-3 font-semibold border-b-2 transition capitalize ${
                appointmentView === tab
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({filteredAppointments.length})
            </button>
          ))}
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading appointments...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No {appointmentView} appointments</div>
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
                  {filteredAppointments.map((apt) => (
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
                      <td className="px-6 py-4 text-sm">${apt.fee_amount?.toFixed(2) || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        {apt.appointment_payments && apt.appointment_payments[0] ? (
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              apt.appointment_payments[0].payment_status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {apt.appointment_payments[0].payment_status}
                          </span>
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
                          <button
                            onClick={() => handleCompleteAppointment(apt.id)}
                            className="block text-green-600 hover:text-green-900 font-semibold"
                          >
                            Complete
                          </button>
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
                            onClick={() => {
                              setPaymentAppointmentId(apt.id);
                              setShowPaymentForm(true);
                            }}
                            className="block text-blue-600 hover:text-blue-900 font-semibold"
                          >
                            Record Payment
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
              <form onSubmit={handleRecordPayment}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Amount Paid *</label>
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
    </div>
  );
}
