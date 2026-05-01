'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { useState, useEffect } from 'react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  address: string;
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
  staff?: { first_name: string; last_name: string };
}

interface Prescription {
  id: string;
  patient_id: string;
  user_id?: string;
  medications?: Array<{
    medication_name: string;
    dosage: string;
    frequency: string;
    quantity: number;
  }>;
  issued_date: string;
  status: string;
  users?: { first_name: string; last_name: string };
  staff?: { first_name: string; last_name: string };
  notes?: string;
}

interface Invoice {
  id: string;
  patient_id: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
}

interface EmergencyContact {
  id: string;
  patient_id: string;
  contact_name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  priority?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface InsuranceDetail {
  id: string;
  patient_id: string;
  provider_name: string;
  policy_number: string;
  group_number?: string;
  coverage_type?: string;
  effective_date?: string;
  expiry_date?: string;
  is_primary?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
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
  const [patientHistory, setPatientHistory] = useState<{
    appointments: Appointment[];
    prescriptions: Prescription[];
    invoices: Invoice[];
    emergencyContacts: EmergencyContact[];
    insuranceDetails: InsuranceDetail[];
  } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [seedingStaff, setSeedingStaff] = useState(false);
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

  // Fetch patients and staff functions (declare before useEffect)
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
      
      if (!response.ok && response.status === 401) {
        alert('❌ Unauthorized: Please login first');
        return;
      }
      
      const data = await response.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      let staffUrl = '/api/staff?role=doctor';
      
      // Extract organization and branch from JWT token
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            console.log('JWT Payload:', payload);
            if (payload.organizationId) {
              staffUrl += `&organizationId=${payload.organizationId}`;
              console.log('✓ Using organizationId:', payload.organizationId);
            } else {
              console.warn('⚠️ organizationId NOT found in JWT');
            }
            if (payload.branchId) {
              staffUrl += `&branchId=${payload.branchId}`;
              console.log('✓ Using branchId:', payload.branchId);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse JWT:', parseError);
        }
      }
      
      console.log('Fetching staff from URL:', staffUrl);
      const response = await fetch(staffUrl, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        console.error('Staff API error:', response.status, response.statusText);
      }
      
      const data = await response.json();
      console.log('Fetched staff (raw):', data);
      console.log('Number of doctors:', Array.isArray(data) ? data.length : 'not an array');
      if (Array.isArray(data) && data.length > 0) {
        console.log('First doctor:', data[0]);
      }
      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  // Fetch patients and staff
  useEffect(() => {
    fetchPatients();
    fetchStaff();
  }, []);

  // Filter patients based on search query (name, phone, or patient ID)
  const filteredPatients = patients.filter(patient => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    const phone = patient.phone.toLowerCase();
    const patientId = patient.id.toLowerCase();
    return fullName.includes(query) || phone.includes(query) || patientId.includes(query);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/patients?id=${editingId}` : '/api/patients';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        data = {};
        console.error('Failed to parse JSON response:', parseError);
      }

      if (response.ok) {
        alert(`✅ Patient ${editingId ? 'updated' : 'created'} successfully!`);
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          date_of_birth: '',
          address: '',
        });
        setEditingId(null);
        setShowForm(false);
        fetchPatients();
      } else {
        const errorMessage = data.error || `Request failed with status ${response.status}`;
        alert(`❌ Error: ${errorMessage}`);
        console.error('API Error:', { status: response.status, statusText: response.statusText, data });
      }
    } catch (error) {
      console.error('Error saving patient:', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to save patient'}`);
    }
  };

  const handleEdit = (patient: Patient) => {
    setFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email,
      phone: patient.phone,
      date_of_birth: patient.date_of_birth,
      address: patient.address,
    });
    setEditingId(patient.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        const response = await fetch(`/api/patients?id=${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        const data = await response.json();

        if (response.ok) {
          alert('✅ Patient deleted successfully!');
          fetchPatients();
        } else {
          alert(`❌ Error: ${data.error || 'Failed to delete patient'}`);
        }
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to delete patient'}`);
      }
    }
  };

  const fetchPatientHistory = async (patientId: string) => {
    try {
      setHistoryLoading(true);
      const [appointmentsRes, prescriptionsRes, invoicesRes, emergencyContactsRes, insuranceRes] = await Promise.all([
        fetch(`/api/appointments?patient_id=${patientId}`),
        fetch(`/api/prescriptions?patient_id=${patientId}`),
        fetch(`/api/invoices?patient_id=${patientId}`),
        fetch(`/api/patient-emergency-contacts?patient_id=${patientId}`),
        fetch(`/api/patient-insurance?patient_id=${patientId}`),
      ]);

      const appointments = await appointmentsRes.json();
      const prescriptions = await prescriptionsRes.json();
      const invoices = await invoicesRes.json();
      const emergencyContacts = await emergencyContactsRes.json();
      const insuranceDetails = await insuranceRes.json();

      setPatientHistory({
        appointments: Array.isArray(appointments) ? appointments : [],
        prescriptions: Array.isArray(prescriptions) ? prescriptions : [],
        invoices: Array.isArray(invoices) ? invoices : [],
        emergencyContacts: Array.isArray(emergencyContacts) ? emergencyContacts : [],
        insuranceDetails: Array.isArray(insuranceDetails) ? insuranceDetails : [],
      });
    } catch (error) {
      console.error('Error fetching patient history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewHistory = (patient: Patient) => {
    setSelectedPatient(patient);
    fetchPatientHistory(patient.id);
  };

  const handleBookAppointment = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowBookAppointment(true);
    setAppointmentData({
      staff_id: '',
      appointment_date: '',
      appointment_time: '',
      duration_minutes: 30,
      notes: '',
    });
  };

  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      // Combine date and time
      const appointmentDateTime = `${appointmentData.appointment_date}T${appointmentData.appointment_time}:00`;

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          staff_id: appointmentData.staff_id,
          appointment_date: appointmentDateTime,
          duration_minutes: parseInt(appointmentData.duration_minutes.toString()),
          status: 'scheduled',
          notes: appointmentData.notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Appointment booked successfully!');
        setShowBookAppointment(false);
        setSelectedPatient(null);
        setAppointmentData({
          staff_id: '',
          appointment_date: '',
          appointment_time: '',
          duration_minutes: 30,
          notes: '',
        });
        fetchPatientHistory(selectedPatient.id);
      } else if (response.status === 409) {
        // Doctor scheduling conflict
        alert(`⚠️ Scheduling Conflict!\n\n${data.error}\n\n${data.message}\n\nPlease choose a different time slot or doctor.`);
      } else {
        alert(`❌ Error: ${data.message || data.error || 'Failed to book appointment'}`);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Error booking appointment');
    }
  };

  const closeHistory = () => {
    setSelectedPatient(null);
    setPatientHistory(null);
    setShowBookAppointment(false);
  };

  const handleCancel = () => {
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
  };

  const handleSeedStaff = async () => {
    setSeedingStaff(true);
    try {
      const response = await fetch('/api/staff/seed', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Staff seeded successfully:', data);
        // Refresh staff list
        await fetchStaff();
        alert(`✓ Successfully added ${data.data?.length || 0} staff members`);
      } else {
        throw new Error(data.error || 'Failed to seed staff');
      }
    } catch (error) {
      console.error('Error seeding staff:', error);
      alert('Failed to seed staff. Check console for details.');
    } finally {
      setSeedingStaff(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Patient Management</h1>
          <p className="mt-2 text-gray-600">Search patients and book appointments</p>
          <p className="mt-2 text-sm text-gray-500">
            📊 Doctors available: <span className="font-bold text-blue-600">{staff.filter(s => s.role === 'doctor').length}</span> | 
            Total staff: <span className="font-bold">{staff.length}</span>
          </p>
        </div>

        {/* Add New Patient Button */}
        {!showForm && !selectedPatient && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            + Add New Patient
          </button>
        )}

        {/* Add Patient Form */}
        {showForm && !selectedPatient && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? 'Edit Patient' : 'Add New Patient'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  required
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="date"
                  placeholder="Date of Birth"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    setFormData({ ...formData, date_of_birth: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <textarea
                placeholder="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                rows={3}
              ></textarea>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                >
                  {editingId ? 'Update Patient' : 'Create Patient'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Patient Selection Interface */}
        {!selectedPatient && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Bar and Patient List */}
            <div className="lg:col-span-1">
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search by name, phone, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Patient List */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center text-gray-500">Loading patients...</div>
                ) : filteredPatients.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    {patients.length === 0 ? 'No patients found' : 'No matching patients'}
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {filteredPatients.map((patient) => (
                      <li key={patient.id}>
                        <button
                          onClick={() => handleViewHistory(patient)}
                          className="w-full text-left px-4 py-4 hover:bg-blue-50 transition"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">
                                {patient.first_name} {patient.last_name}
                              </h3>
                              <p className="text-xs text-gray-600 mt-1">{patient.phone}</p>
                              <p className="text-xs text-gray-500 mt-1">ID: {patient.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  <strong>Total:</strong> {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Empty State for Right Column */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-12 text-center h-full flex items-center justify-center">
                <div className="text-gray-500">
                  <p className="text-lg font-semibold mb-2">Select a patient to view details</p>
                  <p className="text-sm">Click on any patient from the list to display their information and options.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Patient Details and Action Panel */}
        {selectedPatient && !showBookAppointment && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Back to List */}
            <div className="lg:col-span-1">
              <button
                onClick={closeHistory}
                className="w-full mb-4 px-4 py-2 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition"
              >
                ← Back to List
              </button>

              {/* Quick Info */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Patient Info</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Name</p>
                    <p className="font-semibold text-gray-900">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Phone</p>
                    <p className="font-semibold text-gray-900">{selectedPatient.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Email</p>
                    <p className="font-semibold text-gray-900">{selectedPatient.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase">DOB</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedPatient.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => handleBookAppointment(selectedPatient)}
                    className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                  >
                    📅 Book Appointment
                  </button>
                  <Link
                    href={`/patients/${selectedPatient.id}`}
                    className="block text-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                  >
                    👤 View Details
                  </Link>
                  <button
                    onClick={() => handleEdit(selectedPatient)}
                    className="w-full px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition"
                  >
                    ✏️ Edit Patient
                  </button>
                  <button
                    onClick={() => {
                      handleDelete(selectedPatient.id);
                      closeHistory();
                    }}
                    className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                  >
                    🗑️ Delete Patient
                  </button>
                </div>
              </div>
            </div>

            {/* Patient History */}
            <div className="lg:col-span-2">
              {historyLoading ? (
                <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500">
                  Loading patient history...
                </div>
              ) : patientHistory ? (
                <div className="space-y-6">
                  {/* Appointments */}
                  <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Appointments ({patientHistory.appointments.length})</h3>
                    {patientHistory.appointments.length === 0 ? (
                      <p className="text-gray-500">No appointments scheduled</p>
                    ) : (
                      <div className="space-y-3">
                        {patientHistory.appointments.map((apt) => (
                          <div key={apt.id} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {new Date(apt.appointment_date).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Dr. {apt.staff?.first_name} {apt.staff?.last_name} • {apt.duration_minutes} mins
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                                apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                apt.status === 'rescheduled' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {apt.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Prescriptions */}
                  <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">💊 Prescriptions ({patientHistory.prescriptions.length})</h3>
                    {patientHistory.prescriptions.length === 0 ? (
                      <p className="text-gray-500">No prescriptions issued</p>
                    ) : (
                      <div className="space-y-3">
                        {[...patientHistory.prescriptions].sort((a, b) => new Date(b.issued_date).getTime() - new Date(a.issued_date).getTime()).map((rx) => (
                          <div key={rx.id} className="bg-green-50 p-4 rounded-lg border border-green-200 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">📅 {new Date(rx.issued_date).toLocaleDateString()}</p>
                                <p className="font-semibold text-gray-900">{rx.medications && rx.medications.length > 0 ? rx.medications[0].medication_name : 'N/A'}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Issued by: Dr. {rx.users?.first_name} {rx.users?.last_name}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                rx.status === 'active' ? 'bg-green-100 text-green-800' :
                                rx.status === 'expired' ? 'bg-red-100 text-red-800' :
                                rx.status === 'refilled' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {rx.status.toUpperCase()}
                              </span>
                            </div>
                            <button
                              onClick={() => window.open(`/prescriptions?view=${rx.id}`, '_blank')}
                              className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition"
                            >
                              📋 View Details
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Invoices */}
                  <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Invoices ({patientHistory.invoices.length})</h3>
                    {patientHistory.invoices.length === 0 ? (
                      <p className="text-gray-500">No invoices issued</p>
                    ) : (
                      <div className="space-y-3">
                        {patientHistory.invoices.map((inv) => (
                          <div key={inv.id} className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-gray-900">₹{inv.amount.toFixed(2)}</p>
                                <p className="text-sm text-gray-600">
                                  Due: {new Date(inv.due_date).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                                inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {inv.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Insurance Details */}
                  <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">🛡️ Insurance ({patientHistory.insuranceDetails.length})</h3>
                    {patientHistory.insuranceDetails.length === 0 ? (
                      <p className="text-gray-500">No insurance details on file</p>
                    ) : (
                      <div className="space-y-3">
                        {patientHistory.insuranceDetails.map((ins) => (
                          <div key={ins.id} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                            <div>
                              <p className="font-semibold text-gray-900">{ins.provider_name}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Policy:</strong> {ins.policy_number}
                              </p>
                              {ins.group_number && (
                                <p className="text-sm text-gray-600">
                                  <strong>Group:</strong> {ins.group_number}
                                </p>
                              )}
                              {ins.coverage_type && (
                                <p className="text-sm text-gray-600">
                                  <strong>Coverage:</strong> {ins.coverage_type}
                                </p>
                              )}
                              {ins.effective_date && (
                                <p className="text-sm text-gray-600">
                                  <strong>Valid:</strong> {new Date(ins.effective_date).toLocaleDateString()} to {ins.expiry_date ? new Date(ins.expiry_date).toLocaleDateString() : 'N/A'}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Emergency Contacts */}
                  <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">🚨 Emergency Contacts ({patientHistory.emergencyContacts.length})</h3>
                    {patientHistory.emergencyContacts.length === 0 ? (
                      <p className="text-gray-500">No emergency contacts on file</p>
                    ) : (
                      <div className="space-y-3">
                        {patientHistory.emergencyContacts.map((ec) => (
                          <div key={ec.id} className="bg-red-50 p-3 rounded-lg border border-red-200">
                            <div>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-gray-900">{ec.contact_name}</p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    <strong>Relationship:</strong> {ec.relationship}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    <strong>Phone:</strong> {ec.phone}
                                  </p>
                                  {ec.email && (
                                    <p className="text-sm text-gray-600">
                                      <strong>Email:</strong> {ec.email}
                                    </p>
                                  )}
                                </div>
                                {ec.priority && (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                    Priority {ec.priority}
                                  </span>
                                )}
                              </div>
                              {ec.address && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <strong>Address:</strong> {ec.address}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Book Appointment Form */}
        {selectedPatient && showBookAppointment && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-6">
                <button
                  onClick={() => setShowBookAppointment(false)}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                >
                  ← Back to Patient Details
                </button>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-2">📅 Book Appointment</h2>
              <p className="text-gray-600 mb-6">
                Patient: <span className="font-semibold">{selectedPatient.first_name} {selectedPatient.last_name}</span>
              </p>

              <form onSubmit={handleSubmitAppointment}>
                {staff.length === 0 && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 font-semibold">⚠️ No staff members found</p>
                    <p className="text-yellow-700 text-sm mb-3">Please add staff members (doctors) to the system first.</p>
                    <button
                      type="button"
                      onClick={handleSeedStaff}
                      disabled={seedingStaff}
                      className="px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 disabled:bg-yellow-400 transition"
                    >
                      {seedingStaff ? '⏳ Loading...' : '➕ Add Test Staff'}
                    </button>
                  </div>
                )}
                
                {staff.length > 0 && staff.filter(s => s.role === 'doctor').length === 0 && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 font-semibold">⚠️ No doctors available</p>
                    <p className="text-yellow-700 text-sm mb-3">Please add staff members with role &quot;doctor&quot; to book appointments.</p>
                    <button
                      type="button"
                      onClick={handleSeedStaff}
                      disabled={seedingStaff}
                      className="px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 disabled:bg-yellow-400 transition"
                    >
                      {seedingStaff ? '⏳ Loading...' : '➕ Add Test Staff'}
                    </button>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Doctor/Staff *</label>
                    <select
                      value={appointmentData.staff_id}
                      onChange={(e) => setAppointmentData({ ...appointmentData, staff_id: e.target.value })}
                      required
                      disabled={staff.filter(s => s.role === 'doctor').length === 0}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Doctor</option>
                      {staff.filter(s => s.role === 'doctor').map((s) => (
                        <option key={s.id} value={s.id}>
                          Dr. {s.first_name} {s.last_name} {s.specialization && `(${s.specialization})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (Minutes) *</label>
                    <input
                      type="number"
                      min="15"
                      max="120"
                      step="15"
                      value={appointmentData.duration_minutes}
                      onChange={(e) => setAppointmentData({ ...appointmentData, duration_minutes: parseInt(e.target.value) })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Appointment Date *</label>
                    <input
                      type="date"
                      value={appointmentData.appointment_date}
                      onChange={(e) => setAppointmentData({ ...appointmentData, appointment_date: e.target.value })}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Appointment Time *</label>
                    <input
                      type="time"
                      value={appointmentData.appointment_time}
                      onChange={(e) => setAppointmentData({ ...appointmentData, appointment_time: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={appointmentData.notes}
                    onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })}
                    placeholder="Any special notes or instructions..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition shadow-md"
                  >
                    ✓ Book Appointment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBookAppointment(false)}
                    className="flex-1 px-6 py-3 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-12 text-center text-gray-600">
          <p className="text-lg font-semibold">Total Patients: {patients.length}</p>
        </div>
      </div>
    </div>
  );
}

