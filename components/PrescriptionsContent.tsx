'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Medicine {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  quantity: number;
  // Pharmacy fields
  dispensed_quantity?: number;
  pending_quantity?: number;
  dispense_status?: 'pending' | 'partial' | 'completed';
}

interface Vitals {
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  temperature?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  temperature_unit?: 'C' | 'F';
  weight_unit?: 'kg' | 'lbs';
  height_unit?: 'cm' | 'inches';
}

interface FormVitals {
  blood_pressure_systolic: string;
  blood_pressure_diastolic: string;
  heart_rate: string;
  temperature: string;
  oxygen_saturation: string;
  weight: string;
  height: string;
  temperature_unit: 'C' | 'F';
  weight_unit: 'kg' | 'lbs';
  height_unit: 'cm' | 'inches';
}

interface TestItem {
  id?: string;
  name: string;
}

interface Prescription {
  id: string;
  patient_id: string;
  user_id?: string;
  appointment_id?: string;
  walk_in_id?: string;
  medications: Medicine[];
  vitals?: Vitals;
  additional_tests?: TestItem[];
  issued_date: string;
  status: string;
  notes?: string;
  patients?: { first_name: string; last_name: string; phone?: string };
  users?: { first_name: string; last_name: string };
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export function PrescriptionsContent() {
    // Clinic and branch info from localStorage
    const [clinicInfo, setClinicInfo] = useState<{
      name: string;
      branch: string;
      phone: string;
      address: string;
      postalCode: string;
      branchPhone: string;
      branchAddress: string;
    }>({
      name: '',
      branch: '',
      phone: '',
      address: '',
      postalCode: '',
      branchPhone: '',
      branchAddress: '',
    });

    useEffect(() => {
      if (typeof window !== 'undefined') {
        setClinicInfo({
          name: localStorage.getItem('organizationName') || '',
          branch: localStorage.getItem('branchName') || '',
          phone: localStorage.getItem('organizationPhone') || '',
          address: localStorage.getItem('organizationAddress') || '',
          postalCode: localStorage.getItem('organizationPostalCode') || '',
          branchPhone: localStorage.getItem('branchPhone') || '',
          branchAddress: localStorage.getItem('branchAddress') || '',
        });
      }
    }, []);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicinesMaster, setMedicinesMaster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewId, setViewId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [medicines, setMedicines] = useState<Medicine[]>([
    //{ id: '1', medication_name: '', dosage: '', frequency: '', quantity: 0 }
    { id: '1',  medication_name: '',  dosage: '',  frequency: '',  quantity: 0,  dispensed_quantity: 0,  pending_quantity: 0,  dispense_status: 'pending',}
  ]);
  const [formData, setFormData] = useState({
    patient_id: '',
    user_id: '',
    issued_date: new Date().toISOString().split('T')[0],
    status: 'active',
    notes: '',
    vitals: {
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
    },
  });

  // Check for view parameter in URL
  useEffect(() => {
    const view = searchParams.get('view');
    const walkInId = searchParams.get('walk_in') || searchParams.get('walk_in_id');
    if (view) {
      setViewId(view);
      fetchData(undefined, false);
    } else if (walkInId) {
      setViewId(null);
      fetchData(walkInId, true);
    } else {
      fetchData();
    }
  }, [searchParams]);

  // Auto-select prescription when viewId changes or prescriptions load
  useEffect(() => {
    if (viewId && prescriptions.length > 0) {
      const prescription = prescriptions.find(p => p.id === viewId);
      if (prescription) {
        setSelectedPrescription(prescription);
      }
    }
  }, [viewId, prescriptions]);

  useEffect(() => {
    // Set current date as default
    setFormData(prev => ({
      ...prev,
      issued_date: new Date().toISOString().split('T')[0]
    }));
  }, []);

  const fetchData = async (walkInId?: string, autoSelectFirst = false) => {
    try {
      setLoading(true);
      let prescriptionsUrl = '/api/prescriptions';
      if (walkInId) {
        prescriptionsUrl += `?walk_in_id=${walkInId}`;
      }
      const [prescriptionsRes, patientsRes, medicinesRes] = await Promise.all([
        fetch(prescriptionsUrl),
        fetch('/api/patients'),
        fetch('/api/medicines'),
      ]);

      const prescriptionsData = await prescriptionsRes.json();
      const patientsData = await patientsRes.json();
      const medicinesData = await medicinesRes.json();

      setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : []);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
      setMedicinesMaster(Array.isArray(medicinesData) ? medicinesData : []);
      
      // Auto-select first prescription if filtering by walk_in
      if (walkInId && Array.isArray(prescriptionsData) && prescriptionsData.length > 0 && autoSelectFirst) {
        setViewId(prescriptionsData[0].id);
        setSelectedPrescription(prescriptionsData[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = () => {
    const newId = (Math.max(...medicines.map(m => parseInt(m.id) || 0), 0) + 1).toString();
    setMedicines([...medicines, { id: newId, medication_name: '', dosage: '', frequency: '', quantity: 0 }]);
  };

  const handleRemoveMedicine = (id: string) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter(m => m.id !== id));
    }
  };

  const handleMedicineChange = (id: string, field: string, value: string | number) => {
    setMedicines(medicines.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate at least one medicine
    if (medicines.some(m => !m.medication_name || !m.dosage || !m.frequency)) {
      alert('Please fill in all medicine details');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/prescriptions?id=${editingId}` : '/api/prescriptions';

      // Convert vitals to numbers, filtering out empty values
      const vitalsCleaned = Object.entries(formData.vitals || {}).reduce((acc, [key, value]) => {
        if (value === '' || value === null) return acc;
        if (['temperature_unit', 'weight_unit', 'height_unit'].includes(key)) {
          acc[key] = value;
        } else {
          acc[key] = parseFloat(value as string) || undefined;
        }
        return acc;
      }, {} as any);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: formData.patient_id,
          medications: medicines,
          vitals: vitalsCleaned,
          issued_date: formData.issued_date,
          status: formData.status,
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
    }
  };

  const handleEdit = (rx: Prescription) => {
    const convertedVitals: FormVitals = rx.vitals ? {
      blood_pressure_systolic: rx.vitals.blood_pressure_systolic?.toString() || '',
      blood_pressure_diastolic: rx.vitals.blood_pressure_diastolic?.toString() || '',
      heart_rate: rx.vitals.heart_rate?.toString() || '',
      temperature: rx.vitals.temperature?.toString() || '',
      oxygen_saturation: rx.vitals.oxygen_saturation?.toString() || '',
      weight: rx.vitals.weight?.toString() || '',
      height: rx.vitals.height?.toString() || '',
      temperature_unit: rx.vitals.temperature_unit || 'C',
      weight_unit: rx.vitals.weight_unit || 'kg',
      height_unit: rx.vitals.height_unit || 'cm',
    } : {
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      heart_rate: '',
      temperature: '',
      oxygen_saturation: '',
      weight: '',
      height: '',
      temperature_unit: 'C',
      weight_unit: 'kg',
      height_unit: 'cm',
    };

    setFormData({
      patient_id: rx.patient_id,
      user_id: rx.user_id || '',
      issued_date: rx.issued_date.split('T')[0],
      status: rx.status,
      notes: rx.notes || '',
      vitals: convertedVitals,
    });
    setMedicines(rx.medications && Array.isArray(rx.medications) && rx.medications.length > 0 ? rx.medications : [
      //{ id: '1', medication_name: '', dosage: '', frequency: '', quantity: 0 }
      { id: '1',  medication_name: '',  dosage: '',  frequency: '',  quantity: 0,  dispensed_quantity: 0,  pending_quantity: 0,  dispense_status: 'pending',}
    ]);
    setEditingId(rx.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      try {
        await fetch(`/api/prescriptions?id=${id}`, { method: 'DELETE' });
        fetchData();
      } catch (error) {
        console.error('Error deleting prescription:', error);
      }
    }
  };

  const resetForm = () => {
    setMedicines([
      //{ id: '1', medication_name: '', dosage: '', frequency: '', quantity: 0 }
      { id: '1',  medication_name: '',  dosage: '',  frequency: '',  quantity: 0,  dispensed_quantity: 0,  pending_quantity: 0,  dispense_status: 'pending',}
    ]);
    setFormData({
      patient_id: '',
      user_id: '',
      issued_date: new Date().toISOString().split('T')[0],
      status: 'active',
      notes: '',
      vitals: {
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        heart_rate: '',
        temperature: '',
        oxygen_saturation: '',
        weight: '',
        height: '',
        temperature_unit: 'C',
        weight_unit: 'kg',
        height_unit: 'cm',
      },
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredPrescriptions = prescriptions.filter(rx => {
    // If viewing a specific prescription, only show that one
    if (viewId && rx.id !== viewId) return false;
    
    // Filter by search query
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const patientName = `${rx.patients?.first_name || ''} ${rx.patients?.last_name || ''}`.toLowerCase();
    const phone = rx.patients?.phone?.toLowerCase() || '';
    return patientName.includes(query) || phone.includes(query);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Prescription Management</h1>
        <p className="mt-2 text-gray-600">Search, view, and manage patient prescriptions</p>
      </div>

      {showForm && (
        <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8 border-2 border-blue-200">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            {editingId ? '✏️ Edit Prescription' : '💊 Issue New Prescription'}
          </h2>
          <form onSubmit={handleSubmit}>
            {/* Patient and Prescriber Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Patient</label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Issued Date</label>
                <input
                  type="date"
                  value={formData.issued_date}
                  onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="refilled">Refilled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Vitals Section */}
            <div className="mb-6 bg-white rounded-lg p-6 border-2 border-green-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Patient Vitals (Optional)</h3>
              
              {/* Blood Pressure */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Pressure (mmHg)</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      type="number"
                      placeholder="Systolic"
                      value={(formData.vitals?.blood_pressure_systolic as any) || ''}
                      onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, blood_pressure_systolic: e.target.value as any } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Systolic</p>
                  </div>
                  <div className="flex items-end pb-2">
                    <span className="text-lg font-bold text-gray-400">/</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Diastolic"
                      value={(formData.vitals?.blood_pressure_diastolic as any) || ''}
                      onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, blood_pressure_diastolic: e.target.value as any } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Diastolic</p>
                  </div>
                </div>
              </div>

              {/* Heart Rate, Temperature, SpO2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    placeholder="60-100"
                    value={(formData.vitals?.heart_rate as any) || ''}
                    onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, heart_rate: e.target.value as any } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Temperature</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Temp"
                      value={(formData.vitals?.temperature as any) || ''}
                      onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, temperature: e.target.value as any } })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <select
                      value={formData.vitals?.temperature_unit || 'C'}
                      onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, temperature_unit: e.target.value as 'C' | 'F' } })}
                      className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="C">°C</option>
                      <option value="F">°F</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Oxygen Saturation (%)</label>
                  <input
                    type="number"
                    placeholder="95-100"
                    value={(formData.vitals?.oxygen_saturation as any) || ''}
                    onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, oxygen_saturation: e.target.value as any } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Weight and Height */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Weight</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Weight"
                      value={(formData.vitals?.weight as any) || ''}
                      onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, weight: e.target.value as any } })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <select
                      value={formData.vitals?.weight_unit || 'kg'}
                      onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, weight_unit: e.target.value as 'kg' | 'lbs' } })}
                      className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Height</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Height"
                      value={(formData.vitals?.height as any) || ''}
                      onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, height: e.target.value as any } })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <select
                      value={formData.vitals?.height_unit || 'cm'}
                      onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, height_unit: e.target.value as 'cm' | 'inches' } })}
                      className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="cm">cm</option>
                      <option value="inches">inches</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Medicines Section */}
            <div className="mb-6 bg-white rounded-lg p-6 border-2 border-blue-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">💊 Medicines</h3>
                <button
                  type="button"
                  onClick={handleAddMedicine}
                  className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition text-sm"
                >
                  + Add Medicine
                </button>
              </div>

              <div className="space-y-4">
                {medicines.map((med, index) => (
                  <div key={med.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-800">Medicine #{index + 1}</h4>
                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(med.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Medication Name</label>
                        <select
  value={med.medication_name}
  onChange={(e) =>
    handleMedicineChange(
      med.id,
      'medication_name',
      e.target.value
    )
  }
  required
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  <option value="">Select Medicine</option>

  {medicinesMaster.map((medicine) => (
    <option
      key={medicine.id}
      value={medicine.name}
    >
      {medicine.name}
    </option>
  ))}
</select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Dosage</label>
                        <input
                          type="text"
                          placeholder="e.g., 500mg"
                          value={med.dosage}
                          onChange={(e) => handleMedicineChange(med.id, 'dosage', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Frequency</label>
                        <select
                          value={med.frequency}
                          onChange={(e) => handleMedicineChange(med.id, 'frequency', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Frequency</option>
                          <option value="Once daily">Once daily</option>
                          <option value="Twice daily">Twice daily</option>
                          <option value="Three times daily">Three times daily</option>
                          <option value="Four times daily">Four times daily</option>
                          <option value="Every 6 hours">Every 6 hours</option>
                          <option value="Every 8 hours">Every 8 hours</option>
                          <option value="Every 12 hours">Every 12 hours</option>
                          <option value="As needed">As needed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          placeholder="Number of units"
                          value={med.quantity || ''}
                          onChange={(e) => handleMedicineChange(med.id, 'quantity', parseInt(e.target.value) || 0)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Section */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
              <textarea
                placeholder="Any special instructions or notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition shadow-md"
              >
                {editingId ? '✓ Update Prescription' : '✓ Issue Prescription'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-6 py-3 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Prescription List View */}
      {!showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search and List - Left Column */}
          <div className="lg:col-span-1">
            {/* Search and Date Filter */}
            <div className="mb-6 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Patient</label>
                <input
                  type="text"
                  placeholder="Search by patient name or phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedPrescription(null);
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Prescriptions List */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-gray-500">Loading prescriptions...</div>
              ) : filteredPrescriptions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {prescriptions.length === 0 ? 'No prescriptions found' : 'No matching prescriptions'}
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredPrescriptions.map((rx) => (
                    <li key={rx.id}>
                      <button
                        onClick={() => setSelectedPrescription(rx)}
                        className={`w-full text-left px-4 py-4 hover:bg-blue-50 transition border-l-4 ${
                          selectedPrescription?.id === rx.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              👤 {rx.patients?.first_name} {rx.patients?.last_name}
                            </h3>
                            {rx.patients?.phone && (
                              <p className="text-xs text-gray-600 mt-1">📱 {rx.patients.phone}</p>
                            )}
                            <p className="text-xs text-gray-600 mt-1">
                              👨‍⚕️ Dr. {rx.users?.first_name} {rx.users?.last_name}
                            </p>
                            {rx.walk_in_id && (
                              <p className="text-xs text-purple-600 font-semibold mt-1">🚶 Walk-in Prescription</p>
                            )}
                            {rx.appointment_id && !rx.walk_in_id && (
                              <p className="text-xs text-green-600 font-semibold mt-1">📅 Appointment Prescription</p>
                            )}
                            {rx.additional_tests && rx.additional_tests.length > 0 && (
                              <p className="text-xs text-blue-600 mt-1">🧪 {rx.additional_tests.length} test{rx.additional_tests.length !== 1 ? 's' : ''}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              📅 {new Date(rx.issued_date).toLocaleDateString()}
                            </p>
                            
                            {/* Vitals Summary */}
                            {rx.vitals && Object.values(rx.vitals).some(v => v) && (
                              <div className="mt-3 pt-2 border-t border-gray-200 text-xs">
                                <span className="font-semibold text-gray-700">📊 Vitals:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {rx.vitals.blood_pressure_systolic && (
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      BP: {rx.vitals.blood_pressure_systolic}/{rx.vitals.blood_pressure_diastolic}
                                    </span>
                                  )}
                                  {rx.vitals.heart_rate && (
                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                                      HR: {rx.vitals.heart_rate} bpm
                                    </span>
                                  )}
                                  {rx.vitals.temperature && (
                                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                      Temp: {rx.vitals.temperature}°{rx.vitals.temperature_unit || 'C'}
                                    </span>
                                  )}
                                  {rx.vitals.oxygen_saturation && (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                      O₂: {rx.vitals.oxygen_saturation}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <span
                            className={`ml-2 px-2 py-1 text-xs font-bold rounded whitespace-nowrap ${
                              rx.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : rx.status === 'expired'
                                ? 'bg-red-100 text-red-800'
                                : rx.status === 'refilled'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {rx.status.charAt(0).toUpperCase() + rx.status.slice(1)}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Summary */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-700 space-y-2">
                <div>
                  <strong>Date:</strong> {new Date(filterDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div>
                  <strong>📋 Total prescriptions:</strong> {filteredPrescriptions.length} prescription{filteredPrescriptions.length !== 1 ? 's' : ''}
                </div>
                <div>
                  <strong>✅ Active:</strong> {filteredPrescriptions.filter(p => p.status === 'active').length}
                </div>
                <div>
                  <strong>🔄 Refilled:</strong> {filteredPrescriptions.filter(p => p.status === 'refilled').length}
                </div>
                <div>
                  <strong>❌ Expired:</strong> {filteredPrescriptions.filter(p => p.status === 'expired').length}
                </div>
              </div>
            </div>
          </div>

{/* Prescription Details - Right Column */}
<div className="lg:col-span-2">
  {selectedPrescription ? (
    <div
      //id={`prescription-${selectedPrescription.id}`}
      id="print-prescription"
      className="bg-white shadow-2xl border border-gray-300 overflow-hidden"
      style={{ minHeight: '1120px' }}
    >
      {/* Hospital Header */}
      <div className="border-b-4 border-blue-800 px-10 pt-8 pb-6 bg-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 tracking-wide uppercase">
              {clinicInfo.name || 'CITY CARE HOSPITAL'}
            </h1>

            <div className="mt-3 text-sm text-gray-700 leading-6">
              <div>{clinicInfo.address}</div>
              <div>{clinicInfo.branchAddress}</div>
              <div>
                Phone: {clinicInfo.phone || '9876543210'}
                {clinicInfo.branchPhone && (
                  <span> | Branch: {clinicInfo.branchPhone}</span>
                )}
              </div>
              <div>Postal Code: {clinicInfo.postalCode}</div>
            </div>
          </div>

          <div className="text-right text-sm text-gray-700">
            <div className="font-bold text-lg text-blue-900 mb-2">
              MEDICAL PRESCRIPTION
            </div>
            <div>Reg No: MH-MED-2026-001</div>
            <div>Branch: {clinicInfo.branch || 'Main Branch'}</div>
            <div>
              Date:{' '}
              {new Date(selectedPrescription.issued_date).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Patient + Doctor Details */}
      <div className="px-10 py-6 border-b border-gray-300 bg-gray-50">
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="space-y-2">
            <div>
              <span className="font-semibold text-gray-800">Patient Name:</span>{' '}
              <span className="uppercase tracking-wide font-medium">
                {selectedPrescription.patients?.first_name}{' '}
                {selectedPrescription.patients?.last_name}
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-800">Phone:</span>{' '}
              {selectedPrescription.patients?.phone || 'N/A'}
            </div>

            <div>
              <span className="font-semibold text-gray-800">Prescription ID:</span>{' '}
              {selectedPrescription.id.slice(0, 10).toUpperCase()}
            </div>
          </div>

          <div className="space-y-2 text-right">
            <div>
              <span className="font-semibold text-gray-800">Consulting Doctor:</span>
            </div>

            <div className="text-lg font-bold text-blue-900">
              Dr. {selectedPrescription.users?.first_name}{' '}
              {selectedPrescription.users?.last_name}
            </div>

            <div className="text-gray-700">MBBS, MD</div>
          </div>
        </div>
      </div>

      {/* Vitals Section */}
      {selectedPrescription.vitals &&
        Object.values(selectedPrescription.vitals).some((v) => v) && (
          <div className="px-10 py-5 border-b border-gray-200">
            <h3 className="text-lg font-bold text-blue-900 mb-4 uppercase tracking-wide">
              Patient Vitals
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {selectedPrescription.vitals.blood_pressure_systolic && (
                <div className="border rounded-lg p-3 bg-blue-50">
                  <div className="font-semibold text-gray-700">Blood Pressure</div>
                  <div className="text-lg font-bold text-gray-900">
                    {selectedPrescription.vitals.blood_pressure_systolic}/
                    {selectedPrescription.vitals.blood_pressure_diastolic} mmHg
                  </div>
                </div>
              )}

              {selectedPrescription.vitals.heart_rate && (
                <div className="border rounded-lg p-3 bg-red-50">
                  <div className="font-semibold text-gray-700">Heart Rate</div>
                  <div className="text-lg font-bold text-gray-900">
                    {selectedPrescription.vitals.heart_rate} bpm
                  </div>
                </div>
              )}

              {selectedPrescription.vitals.temperature && (
                <div className="border rounded-lg p-3 bg-orange-50">
                  <div className="font-semibold text-gray-700">Temperature</div>
                  <div className="text-lg font-bold text-gray-900">
                    {selectedPrescription.vitals.temperature}°
                    {selectedPrescription.vitals.temperature_unit || 'C'}
                  </div>
                </div>
              )}

              {selectedPrescription.vitals.oxygen_saturation && (
                <div className="border rounded-lg p-3 bg-green-50">
                  <div className="font-semibold text-gray-700">SpO₂</div>
                  <div className="text-lg font-bold text-gray-900">
                    {selectedPrescription.vitals.oxygen_saturation}%
                  </div>
                </div>
              )}

              {selectedPrescription.vitals.weight && (
                <div className="border rounded-lg p-3 bg-purple-50">
                  <div className="font-semibold text-gray-700">Weight</div>
                  <div className="text-lg font-bold text-gray-900">
                    {selectedPrescription.vitals.weight}{' '}
                    {selectedPrescription.vitals.weight_unit}
                  </div>
                </div>
              )}

              {selectedPrescription.vitals.height && (
                <div className="border rounded-lg p-3 bg-indigo-50">
                  <div className="font-semibold text-gray-700">Height</div>
                  <div className="text-lg font-bold text-gray-900">
                    {selectedPrescription.vitals.height}{' '}
                    {selectedPrescription.vitals.height_unit}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Medicines */}
      <div className="px-10 py-8 min-h-[450px]">
        <div className="flex items-start gap-4 mb-8">
          <div className="text-7xl font-bold text-blue-900 leading-none">℞</div>

          <div>
            <h3 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">
              Prescription
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Follow the medications exactly as advised by the doctor.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {selectedPrescription.medications?.map((med, idx) => (
            <div
              key={idx}
              className="border-b border-dashed border-gray-300 pb-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {idx + 1}. {med.medication_name}
                  </div>

                  <div className="mt-3 text-gray-700 space-y-1 text-sm">
                    <div>
                      <span className="font-semibold">Dosage:</span>{' '}
                      {med.dosage}
                    </div>

                    <div>
                      <span className="font-semibold">Frequency:</span>{' '}
                      {med.frequency}
                    </div>

                    <div>
                      <span className="font-semibold">Quantity:</span>{' '}
                      {med.quantity} units
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-500 font-medium">
                  #{idx + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tests */}
      {selectedPrescription.additional_tests &&
        selectedPrescription.additional_tests.length > 0 && (
          <div className="px-10 pb-6">
            <div className="border rounded-xl p-5 bg-yellow-50">
              <h3 className="text-lg font-bold text-yellow-800 mb-3 uppercase tracking-wide">
                Recommended Tests
              </h3>

              <ul className="space-y-2 text-sm text-gray-800">
                {selectedPrescription.additional_tests.map((test, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-yellow-700">•</span>
                    <span>{test.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      {/* Notes */}
      {selectedPrescription.notes && (
        <div className="px-10 pb-6">
          <div className="border rounded-xl p-5 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-800 mb-2 uppercase tracking-wide">
              Doctor Notes
            </h3>

            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-7">
              {selectedPrescription.notes}
            </p>
          </div>
        </div>
      )}

      {/* Footer + Signature */}
      <div className="mt-10 border-t-2 border-blue-900 px-10 py-8 bg-gray-50">
        <div className="flex items-end justify-between">
          <div className="text-xs text-gray-600 leading-6 max-w-md">
            <div>
              ⚠️ This prescription is digitally generated and valid only with
              authorized doctor consultation.
            </div>

            <div>
              Please complete the full course of medicines unless advised
              otherwise.
            </div>
          </div>

          <div className="text-center min-w-[220px]">
            <div className="h-16 flex items-end justify-center text-2xl italic text-blue-900 font-semibold">
              Dr. {selectedPrescription.users?.last_name}
            </div>

            <div className="border-t-2 border-gray-700 pt-2 text-sm font-semibold text-gray-700">
              Authorized Signature
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="p-6 border-t bg-white flex gap-3 no-print">
        {viewId && (
          <button
            onClick={() => {
              setViewId(null);
              setSelectedPrescription(null);
              window.history.replaceState({}, '', '/prescriptions');
            }}
            className="flex-1 px-4 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition"
          >
            ← Back
          </button>
        )}

      <button
        onClick={() => window.print()}
        className="flex-1 px-4 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition"
      >
        🖨 Print Prescription
      </button>

        <button
          onClick={() => handleEdit(selectedPrescription)}
          className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
        >
          ✏ Edit
        </button>

        <button
          onClick={() => {
            handleDelete(selectedPrescription.id);
            setSelectedPrescription(null);
          }}
          className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  ) : (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-12 text-center h-full flex items-center justify-center">
      <div className="text-gray-500">
        <p className="text-lg font-semibold mb-2">
          Select a prescription to view details
        </p>
        <p className="text-sm">
          Click any prescription from the left panel.
        </p>
      </div>
    </div>
  )}
</div>
</div>
)}
</div>
);
}