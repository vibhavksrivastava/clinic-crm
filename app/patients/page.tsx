'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { useState, useEffect } from 'react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  created_at: string;
}

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  specialization?: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  staff_id: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  notes: string;
  staff?: {
    first_name: string;
    last_name: string;
  };
}

interface Prescription {
  id: string;
  patient_id: string;
  issued_date: string;
  status: string;
  notes?: string;
  medications?: Array<{
    medication_name: string;
    dosage: string;
    frequency: string;
    quantity: number;
  }>;
  users?: {
    first_name: string;
    last_name: string;
  };
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  due_date: string;
}

interface InsuranceDetail {
  id: string;
  provider_name: string;
  policy_number: string;
  coverage_type?: string;
  effective_date?: string;
  expiry_date?: string;
}

interface EmergencyContact {
  id: string;
  contact_name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBookAppointment, setShowBookAppointment] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  const [patientHistory, setPatientHistory] = useState<{
    appointments: Appointment[];
    prescriptions: Prescription[];
    invoices: Invoice[];
    insuranceDetails: InsuranceDetail[];
    emergencyContacts: EmergencyContact[];
  } | null>(null);

  const [appointmentData, setAppointmentData] = useState({
    staff_id: '',
    appointment_date: '',
    appointment_time: '',
    duration_minutes: 30,
    notes: '',
  });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
  });

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/patients', {
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff?role=doctor', {
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchStaff();
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const query = searchQuery.toLowerCase();

    return (
      `${patient.first_name} ${patient.last_name}`
        .toLowerCase()
        .includes(query) ||
      (patient.phone || '').toLowerCase().includes(query) ||
      patient.id.toLowerCase().includes(query)
    );
  });

  const fetchPatientHistory = async (patientId: string) => {
    try {
      setHistoryLoading(true);

      const [appointmentsRes, prescriptionsRes, invoicesRes, insuranceRes, emergencyRes] =
        await Promise.all([
          fetch(`/api/appointments?patient_id=${patientId}`),
          fetch(`/api/prescriptions?patient_id=${patientId}`),
          fetch(`/api/invoices?patient_id=${patientId}`),
          fetch(`/api/patient-insurance?patient_id=${patientId}`),
          fetch(`/api/patient-emergency-contacts?patient_id=${patientId}`),
        ]);

      const appointments = await appointmentsRes.json();
      const prescriptions = await prescriptionsRes.json();
      const invoices = await invoicesRes.json();
      const insuranceDetails = await insuranceRes.json();
      const emergencyContacts = await emergencyRes.json();

      setPatientHistory({
        appointments: Array.isArray(appointments) ? appointments : [],
        prescriptions: Array.isArray(prescriptions) ? prescriptions : [],
        invoices: Array.isArray(invoices) ? invoices : [],
        insuranceDetails: Array.isArray(insuranceDetails) ? insuranceDetails : [],
        emergencyContacts: Array.isArray(emergencyContacts)
          ? emergencyContacts
          : [],
      });
    } catch (error) {
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewHistory = async (patient: Patient) => {
    setSelectedPatient(patient);
    await fetchPatientHistory(patient.id);
  };

  const handleBookAppointment = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowBookAppointment(true);
  };

  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) return;

    try {
      const appointmentDateTime = `${appointmentData.appointment_date}T${appointmentData.appointment_time}:00`;

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          staff_id: appointmentData.staff_id,
          appointment_date: appointmentDateTime,
          duration_minutes: appointmentData.duration_minutes,
          status: 'scheduled',
          notes: appointmentData.notes,
        }),
      });

      if (response.ok) {
        alert('Appointment booked successfully');
        setShowBookAppointment(false);
        fetchPatientHistory(selectedPatient.id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `/api/patients?id=${editingId}`
        : '/api/patients';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchPatients();
        setShowForm(false);
        setEditingId(null);

        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          date_of_birth: '',
          address: '',
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (patient: Patient) => {
    setFormData({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      email: patient.email || '',
      phone: patient.phone || '',
      date_of_birth: patient.date_of_birth || '',
      address: patient.address || '',
    });

    setEditingId(patient.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete patient?')) return;

    try {
      const response = await fetch(`/api/patients?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        fetchPatients();
        setSelectedPatient(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const closeHistory = () => {
    setSelectedPatient(null);
    setPatientHistory(null);
    setShowBookAppointment(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Patient Management
            </h1>
            <p className="text-gray-600 mt-1">
              Search patients, manage appointments and history
            </p>
          </div>

          {!selectedPatient && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:scale-105 transition"
            >
              + Add Patient
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-gray-200">
            <h2 className="text-2xl font-bold mb-6">
              {editingId ? 'Edit Patient' : 'Add Patient'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.first_name || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      first_name: e.target.value,
                    })
                  }
                  className="px-4 py-3 border rounded-2xl"
                  required
                />

                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.last_name || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      last_name: e.target.value,
                    })
                  }
                  className="px-4 py-3 border rounded-2xl"
                  required
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  className="px-4 py-3 border rounded-2xl"
                />

                <input
                  type="text"
                  placeholder="Phone"
                  value={formData.phone || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value,
                    })
                  }
                  className="px-4 py-3 border rounded-2xl"
                />

                <input
                  type="date"
                  value={formData.date_of_birth || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date_of_birth: e.target.value,
                    })
                  }
                  className="px-4 py-3 border rounded-2xl"
                />
              </div>

              <textarea
                rows={3}
                placeholder="Address"
                value={formData.address || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border rounded-2xl mb-4"
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-green-600 text-white font-semibold"
                >
                  {editingId ? 'Update Patient' : 'Save Patient'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="px-6 py-3 rounded-2xl bg-gray-400 text-white font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {!selectedPatient && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <input
                type="text"
                placeholder="Search patient by name / phone / id"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl border shadow-sm mb-4"
              />

              <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-200">
                {loading ? (
                  <div className="p-6 text-center">Loading...</div>
                ) : (
                  filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => handleViewHistory(patient)}
                      className="w-full p-5 text-left border-b hover:bg-blue-50 transition"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </h3>

                          <p className="text-sm text-gray-500 mt-1">
                            {patient.phone}
                          </p>
                        </div>

                        <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                          View
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-gray-200 flex items-center justify-center min-h-[500px]">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Select a Patient
                </h2>

                <p className="text-gray-500">
                  Click patient from left panel to view details
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedPatient && !showBookAppointment && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <button
                onClick={closeHistory}
                className="w-full py-3 rounded-2xl bg-gray-700 text-white font-semibold shadow-md hover:bg-gray-800 transition"
              >
                ← Back
              </button>

              <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-200">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {selectedPatient.first_name?.charAt(0)}
                </div>

                <h2 className="text-2xl font-bold text-center text-gray-900">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </h2>

                <p className="text-center text-gray-500 mt-1">
                  Patient ID: {selectedPatient.id.slice(0, 8).toUpperCase()}
                </p>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded-2xl">
                    📞 {selectedPatient.phone || 'N/A'}
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl">
                    ✉️ {selectedPatient.email || 'N/A'}
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => handleBookAppointment(selectedPatient)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:scale-[1.02] transition"
                  >
                    📅 Book Appointment
                  </button>

                  <Link
                    href={`/patients/${selectedPatient.id}`}
                    className="block w-full text-center py-3 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold shadow-lg hover:scale-[1.02] transition"
                  >
                    👤 View Details
                  </Link>

                  <button
                    onClick={() => handleEdit(selectedPatient)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold shadow-lg hover:scale-[1.02] transition"
                  >
                    ✏️ Edit Patient
                  </button>

                  <button
                    onClick={() => handleDelete(selectedPatient.id)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold shadow-lg hover:scale-[1.02] transition"
                  >
                    🗑 Delete Patient
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 text-blue-800 font-medium">
                Click “View Details” to see all records for selected patient.
              </div>

              {historyLoading ? (
                <div className="bg-white rounded-3xl p-10 text-center shadow-xl">
                  Loading history...
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">📅 Latest Appointments</h3>
                      <Link
                        href={`/patients/${selectedPatient.id}`}
                        className="text-blue-600 font-semibold"
                      >
                        View All
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {patientHistory?.appointments.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          className="p-4 rounded-2xl bg-blue-50 border border-blue-100"
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="font-semibold">
                                {new Date(apt.appointment_date).toLocaleString()}
                              </p>

                              <p className="text-sm text-gray-600 mt-1">
                                Dr. {apt.staff?.first_name} {apt.staff?.last_name}
                              </p>
                            </div>

                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold h-fit">
                              {apt.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">💊 Latest Prescriptions</h3>
                      <Link
                        href={`/patients/${selectedPatient.id}`}
                        className="text-blue-600 font-semibold"
                      >
                        View All
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {patientHistory?.prescriptions.slice(0, 2).map((rx) => (
                        <div
                          key={rx.id}
                          className="p-4 rounded-2xl bg-green-50 border border-green-100"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">
                                {rx.medications?.[0]?.medication_name || 'Medicine'}
                              </p>

                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(rx.issued_date).toLocaleDateString()}
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                window.open(`/prescriptions?view=${rx.id}`, '_blank')
                              }
                              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">💰 Invoices</h3>
                        <Link
                          href={`/patients/${selectedPatient.id}`}
                          className="text-blue-600 font-semibold"
                        >
                          View All
                        </Link>
                      </div>

                      <div className="space-y-3">
                        {patientHistory?.invoices.slice(0, 2).map((invoice) => (
                          <div
                            key={invoice.id}
                            className="p-4 rounded-2xl bg-purple-50 border border-purple-100"
                          >
                            <p className="font-bold text-lg">
                              ₹{invoice.amount}
                            </p>

                            <p className="text-sm text-gray-500">
                              {invoice.status}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">🛡 Insurance</h3>
                        <Link
                          href={`/patients/${selectedPatient.id}`}
                          className="text-blue-600 font-semibold"
                        >
                          View All
                        </Link>
                      </div>

                      <div className="space-y-3">
                        {patientHistory?.insuranceDetails
                            .filter(
                              (ins) =>
                                ins.provider_name ||
                                ins.policy_number ||
                                ins.coverage_type
                            )
                          .slice(0, 2)
                          .map((insurance) => (
                            <div
                              key={insurance.id}
                              className="p-4 rounded-2xl bg-orange-50 border border-orange-100"
                            >
                              <p className="font-semibold">
                                {insurance.provider_name}
                              </p>

                              <p className="text-sm text-gray-500 mt-1">
                                {insurance.policy_number}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">
                        🚨 Emergency Contacts
                      </h3>

                      <Link
                        href={`/patients/${selectedPatient.id}`}
                        className="text-blue-600 font-semibold"
                      >
                        View All
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {patientHistory?.emergencyContacts
                        .slice(0, 2)
                        .map((contact) => (
                          <div
                            key={contact.id}
                            className="p-4 rounded-2xl bg-red-50 border border-red-100"
                          >
                            <p className="font-semibold">
                              {contact.contact_name}
                            </p>

                            <p className="text-sm text-gray-500 mt-1">
                              {contact.relationship} • {contact.phone}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {selectedPatient && showBookAppointment && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
            <button
              onClick={() => setShowBookAppointment(false)}
              className="mb-6 text-blue-600 font-semibold"
            >
              ← Back to Patient
            </button>

            <h2 className="text-3xl font-bold mb-6">
              📅 Book Appointment
            </h2>

            <form onSubmit={handleSubmitAppointment}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <select
                  value={appointmentData.staff_id}
                  onChange={(e) =>
                    setAppointmentData({
                      ...appointmentData,
                      staff_id: e.target.value,
                    })
                  }
                  className="px-4 py-4 border rounded-2xl"
                  required
                >
                  <option value="">Select Doctor</option>

                  {staff.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  value={appointmentData.duration_minutes}
                  onChange={(e) =>
                    setAppointmentData({
                      ...appointmentData,
                      duration_minutes: parseInt(e.target.value),
                    })
                  }
                  className="px-4 py-4 border rounded-2xl"
                />

                <input
                  type="date"
                  value={appointmentData.appointment_date}
                  onChange={(e) =>
                    setAppointmentData({
                      ...appointmentData,
                      appointment_date: e.target.value,
                    })
                  }
                  className="px-4 py-4 border rounded-2xl"
                  required
                />

                <input
                  type="time"
                  value={appointmentData.appointment_time}
                  onChange={(e) =>
                    setAppointmentData({
                      ...appointmentData,
                      appointment_time: e.target.value,
                    })
                  }
                  className="px-4 py-4 border rounded-2xl"
                  required
                />
              </div>

              <textarea
                rows={4}
                placeholder="Notes"
                value={appointmentData.notes}
                onChange={(e) =>
                  setAppointmentData({
                    ...appointmentData,
                    notes: e.target.value,
                  })
                }
                className="w-full px-4 py-4 border rounded-2xl mb-6"
              />

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold shadow-lg"
                >
                  ✓ Confirm Appointment
                </button>

                <button
                  type="button"
                  onClick={() => setShowBookAppointment(false)}
                  className="flex-1 py-4 rounded-2xl bg-gray-400 text-white font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
