'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

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

interface PatientInsurance {
  id: string;
  patient_id: string;
  provider_name: string;
  policy_number: string;
  group_number: string;
  coverage_type: string;
  effective_date: string;
  expiry_date: string;
  is_primary: boolean;
  notes: string;
}

interface EmergencyContact {
  id: string;
  patient_id: string;
  contact_name: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
  priority: number;
  notes: string;
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

export default function PatientDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [insurance, setInsurance] = useState<PatientInsurance[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [patientReminders, setPatientReminders] = useState<ReminderMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insurance' | 'emergency'>('insurance');

  // Insurance form states
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [editingInsuranceId, setEditingInsuranceId] = useState<string | null>(null);
  const [insuranceFormData, setInsuranceFormData] = useState({
    provider_name: '',
    policy_number: '',
    group_number: '',
    coverage_type: '',
    effective_date: '',
    expiry_date: '',
    is_primary: true,
    notes: '',
  });

  // Emergency contact form states
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [editingEmergencyId, setEditingEmergencyId] = useState<string | null>(null);
  const [emergencyFormData, setEmergencyFormData] = useState({
    contact_name: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
    priority: 1,
    notes: '',
  });

  useEffect(() => {
    if (patientId) {
      fetchData();
    }
  }, [patientId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patientRes, insuranceRes, emergencyRes] = await Promise.all([
        fetch(`/api/patients?id=${patientId}`),
        fetch(`/api/patient-insurance?patient_id=${patientId}`),
        fetch(`/api/patient-emergency-contacts?patient_id=${patientId}`),
      ]);

      const patientData = await patientRes.json();
      const insuranceData = await insuranceRes.json();
      const emergencyData = await emergencyRes.json();
      const reminderRes = await fetch(`/api/appointments/reminders?type=patient&patient_id=${patientId}`);
      const reminderData = await reminderRes.json();

      setPatient(Array.isArray(patientData) ? patientData[0] : patientData);
      setInsurance(Array.isArray(insuranceData) ? insuranceData : []);
      setEmergencyContacts(Array.isArray(emergencyData) ? emergencyData : []);
      setPatientReminders(Array.isArray(reminderData.reminders) ? reminderData.reminders : []);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInsuranceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingInsuranceId ? 'PUT' : 'POST';
      const url = editingInsuranceId ? `/api/patient-insurance?id=${editingInsuranceId}` : '/api/patient-insurance';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          ...insuranceFormData,
          is_primary: insuranceFormData.is_primary,
        }),
      });

      if (response.ok) {
        resetInsuranceForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error saving insurance:', error);
    }
  };

  const handleEmergencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingEmergencyId ? 'PUT' : 'POST';
      const url = editingEmergencyId ? `/api/patient-emergency-contacts?id=${editingEmergencyId}` : '/api/patient-emergency-contacts';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          ...emergencyFormData,
          priority: parseInt(emergencyFormData.priority.toString()),
        }),
      });

      if (response.ok) {
        resetEmergencyForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error saving emergency contact:', error);
    }
  };

  const handleEditInsurance = (ins: PatientInsurance) => {
    setInsuranceFormData({
      provider_name: ins.provider_name,
      policy_number: ins.policy_number,
      group_number: ins.group_number || '',
      coverage_type: ins.coverage_type || '',
      effective_date: ins.effective_date || '',
      expiry_date: ins.expiry_date || '',
      is_primary: ins.is_primary,
      notes: ins.notes || '',
    });
    setEditingInsuranceId(ins.id);
    setShowInsuranceForm(true);
  };

  const handleEditEmergency = (contact: EmergencyContact) => {
    setEmergencyFormData({
      contact_name: contact.contact_name,
      relationship: contact.relationship,
      phone: contact.phone,
      email: contact.email || '',
      address: contact.address || '',
      priority: contact.priority,
      notes: contact.notes || '',
    });
    setEditingEmergencyId(contact.id);
    setShowEmergencyForm(true);
  };

  const handleDeleteInsurance = async (id: string) => {
    if (window.confirm('Delete this insurance record?')) {
      try {
        await fetch(`/api/patient-insurance?id=${id}`, { method: 'DELETE' });
        fetchData();
      } catch (error) {
        console.error('Error deleting insurance:', error);
      }
    }
  };

  const handleDeleteEmergency = async (id: string) => {
    if (window.confirm('Delete this emergency contact?')) {
      try {
        await fetch(`/api/patient-emergency-contacts?id=${id}`, { method: 'DELETE' });
        fetchData();
      } catch (error) {
        console.error('Error deleting emergency contact:', error);
      }
    }
  };

  const resetInsuranceForm = () => {
    setInsuranceFormData({
      provider_name: '',
      policy_number: '',
      group_number: '',
      coverage_type: '',
      effective_date: '',
      expiry_date: '',
      is_primary: true,
      notes: '',
    });
    setEditingInsuranceId(null);
    setShowInsuranceForm(false);
  };

  const resetEmergencyForm = () => {
    setEmergencyFormData({
      contact_name: '',
      relationship: '',
      phone: '',
      email: '',
      address: '',
      priority: 1,
      notes: '',
    });
    setEditingEmergencyId(null);
    setShowEmergencyForm(false);
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!patient) return <div className="p-6 text-center">Patient not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Link href="/patients" className="text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Patients
      </Link>

      {/* Patient Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {patient.first_name} {patient.last_name}
        </h1>
        <div className="grid grid-cols-2 gap-4 text-gray-600">
          <p>📧 {patient.email}</p>
          <p>📱 {patient.phone}</p>
          <p>🎂 {patient.date_of_birth}</p>
          <p>📍 {patient.address}</p>
        </div>
      </div>

      {patientReminders.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-blue-500">
          <h2 className="text-2xl font-semibold mb-3">Upcoming Appointment Reminder</h2>
          {patientReminders.map((reminder) => (
            <div key={reminder.appointment_id} className="mb-4 rounded-lg bg-blue-50 p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{reminder.title}</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{reminder.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('insurance')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'insurance'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🏥 Insurance
          </button>
          <button
            onClick={() => setActiveTab('emergency')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'emergency'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🚨 Emergency Contacts
          </button>
        </div>

        <div className="p-6">
          {/* Insurance Tab */}
          {activeTab === 'insurance' && (
            <div>
              <button
                onClick={() => setShowInsuranceForm(true)}
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Add Insurance
              </button>

              {showInsuranceForm && (
                <form onSubmit={handleInsuranceSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold mb-4">{editingInsuranceId ? 'Edit Insurance' : 'New Insurance'}</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Provider Name"
                      value={insuranceFormData.provider_name}
                      onChange={(e) => setInsuranceFormData({ ...insuranceFormData, provider_name: e.target.value })}
                      required
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Policy Number"
                      value={insuranceFormData.policy_number}
                      onChange={(e) => setInsuranceFormData({ ...insuranceFormData, policy_number: e.target.value })}
                      required
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Group Number"
                      value={insuranceFormData.group_number}
                      onChange={(e) => setInsuranceFormData({ ...insuranceFormData, group_number: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Coverage Type"
                      value={insuranceFormData.coverage_type}
                      onChange={(e) => setInsuranceFormData({ ...insuranceFormData, coverage_type: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      value={insuranceFormData.effective_date}
                      onChange={(e) => setInsuranceFormData({ ...insuranceFormData, effective_date: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      value={insuranceFormData.expiry_date}
                      onChange={(e) => setInsuranceFormData({ ...insuranceFormData, expiry_date: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={insuranceFormData.is_primary}
                        onChange={(e) => setInsuranceFormData({ ...insuranceFormData, is_primary: e.target.checked })}
                        className="mr-2"
                      />
                      <span>Primary Insurance</span>
                    </label>
                  </div>
                  <textarea
                    placeholder="Notes"
                    value={insuranceFormData.notes}
                    onChange={(e) => setInsuranceFormData({ ...insuranceFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={resetInsuranceForm}
                      className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {insurance.length === 0 ? (
                  <p className="text-gray-500">No insurance records</p>
                ) : (
                  insurance.map((ins) => (
                    <div key={ins.id} className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold">{ins.provider_name}</h4>
                          <p className="text-sm text-gray-600">Policy: {ins.policy_number}</p>
                          {ins.group_number && <p className="text-sm text-gray-600">Group: {ins.group_number}</p>}
                          {ins.is_primary && <span className="inline-block mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">Primary</span>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditInsurance(ins)}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteInsurance(ins.id)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {ins.coverage_type && <p className="text-sm">Coverage: {ins.coverage_type}</p>}
                      {ins.effective_date && <p className="text-sm">Valid: {ins.effective_date} to {ins.expiry_date}</p>}
                      {ins.notes && <p className="text-sm text-gray-600 mt-2">Notes: {ins.notes}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Emergency Contacts Tab */}
          {activeTab === 'emergency' && (
            <div>
              <button
                onClick={() => setShowEmergencyForm(true)}
                className="mb-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                + Add Emergency Contact
              </button>

              {showEmergencyForm && (
                <form onSubmit={handleEmergencySubmit} className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold mb-4">{editingEmergencyId ? 'Edit Contact' : 'New Contact'}</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Contact Name"
                      value={emergencyFormData.contact_name}
                      onChange={(e) => setEmergencyFormData({ ...emergencyFormData, contact_name: e.target.value })}
                      required
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <input
                      type="text"
                      placeholder="Relationship"
                      value={emergencyFormData.relationship}
                      onChange={(e) => setEmergencyFormData({ ...emergencyFormData, relationship: e.target.value })}
                      required
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={emergencyFormData.phone}
                      onChange={(e) => setEmergencyFormData({ ...emergencyFormData, phone: e.target.value })}
                      required
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={emergencyFormData.email}
                      onChange={(e) => setEmergencyFormData({ ...emergencyFormData, email: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <input
                      type="text"
                      placeholder="Address"
                      value={emergencyFormData.address}
                      onChange={(e) => setEmergencyFormData({ ...emergencyFormData, address: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 col-span-2"
                    />
                    <select
                      value={emergencyFormData.priority}
                      onChange={(e) => setEmergencyFormData({ ...emergencyFormData, priority: parseInt(e.target.value) })}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="1">Priority 1 (First Contact)</option>
                      <option value="2">Priority 2</option>
                      <option value="3">Priority 3</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Notes"
                    value={emergencyFormData.notes}
                    onChange={(e) => setEmergencyFormData({ ...emergencyFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={resetEmergencyForm}
                      className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {emergencyContacts.length === 0 ? (
                  <p className="text-gray-500">No emergency contacts</p>
                ) : (
                  emergencyContacts.map((contact) => (
                    <div key={contact.id} className="border rounded-lg p-4 bg-red-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold">{contact.contact_name}</h4>
                          <p className="text-sm text-gray-600">{contact.relationship}</p>
                          <p className="text-sm">📱 {contact.phone}</p>
                          {contact.email && <p className="text-sm">📧 {contact.email}</p>}
                          <span className="inline-block mt-2 px-2 py-1 bg-red-600 text-white text-xs rounded">
                            Priority {contact.priority}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditEmergency(contact)}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEmergency(contact.id)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {contact.address && <p className="text-sm text-gray-600">📍 {contact.address}</p>}
                      {contact.notes && <p className="text-sm text-gray-600 mt-2">Notes: {contact.notes}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
