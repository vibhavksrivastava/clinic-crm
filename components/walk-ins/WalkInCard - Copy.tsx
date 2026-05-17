'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WalkIn, AdditionalTest, Vital, Medicine } from '@/lib/types';

interface WalkInCardProps {
  walkIn: WalkIn;
  onUpdate?: (walkIn: WalkIn) => void;
  onStatusChange?: (id: string, status: 'in-progress' | 'completed') => void;
  onTestsChange?: (id: string, tests: AdditionalTest[]) => void;
  onVitalsChange?: (id: string, vitals: Vital[]) => void;
  onMedicinesChange?: (id: string, medicines: Medicine[]) => void;
}

export default function WalkInCard({
  walkIn,
  onUpdate,
  onStatusChange,
  onTestsChange,
  onVitalsChange,
  onMedicinesChange,
}: WalkInCardProps) {
  const [showTestsModal, setShowTestsModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showMedicinesModal, setShowMedicinesModal] = useState(false);
  const [newTest, setNewTest] = useState('');
  const [newVitalName, setNewVitalName] = useState('');
  const [newVitalValue, setNewVitalValue] = useState('');
  const [newVitalUnit, setNewVitalUnit] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'inches'>('cm');
  const [newMedicineName, setNewMedicineName] = useState('');
  const [newMedicineDosage, setNewMedicineDosage] = useState('');
  const [newMedicineFrequency, setNewMedicineFrequency] = useState('');
  const [updating, setUpdating] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'in-progress':
        return 'bg-blue-50 border-blue-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'cancelled':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateDuration = () => {
    if (!walkIn.checkOutTime) return null;
    const checkIn = new Date(walkIn.checkInTime);
    const checkOut = new Date(walkIn.checkOutTime);
    const minutes = Math.round((checkOut.getTime() - checkIn.getTime()) / 60000);
    return minutes;
  };

  const handleStatusChange = async (newStatus: 'in-progress' | 'completed') => {
    setUpdating(true);
    try {
      onStatusChange?.(walkIn.id, newStatus);
      setUpdating(false);
    } catch (error) {
      console.error('Error updating status:', error);
      setUpdating(false);
    }
  };

  const handleAddTest = async () => {
    if (!newTest.trim()) return;

    const updatedTests = [
      ...(walkIn.additionalTests || []),
      {
        id: Date.now().toString(),
        name: newTest.trim(),
      },
    ];

    setNewTest('');
    onTestsChange?.(walkIn.id, updatedTests);
  };

  const handleRemoveTest = (testId: string) => {
    const updatedTests = (walkIn.additionalTests || []).filter((t) => t.id !== testId);
    onTestsChange?.(walkIn.id, updatedTests);
  };

  const handleAddVital = async () => {
    if (!newVitalName.trim() || !newVitalValue.trim()) return;

    const updatedVitals = [
      ...(walkIn.vitals || []),
      {
        id: Date.now().toString(),
        name: newVitalName.trim(),
        value: newVitalValue.trim(),
        unit: newVitalUnit.trim() || undefined,
      },
    ];

    setNewVitalName('');
    setNewVitalValue('');
    setNewVitalUnit('');
    onVitalsChange?.(walkIn.id, updatedVitals);
  };

  const getWalkInVital = (name: string) => {
    return (walkIn.vitals || []).find((v) => v.name?.toLowerCase() === name.toLowerCase());
  };

  const loadWalkInVitals = () => {
    const systolic = getWalkInVital('Blood Pressure Systolic')?.value || '';
    const diastolic = getWalkInVital('Blood Pressure Diastolic')?.value || '';
    const heart = getWalkInVital('Heart Rate')?.value || '';
    const temp = getWalkInVital('Temperature')?.value || '';
    const tempUnit = getWalkInVital('Temperature')?.unit || 'C';
    const spo2 = getWalkInVital('Oxygen Saturation')?.value || '';
    const wt = getWalkInVital('Weight')?.value || '';
    const wtUnit = getWalkInVital('Weight')?.unit || 'kg';
    const ht = getWalkInVital('Height')?.value || '';
    const htUnit = getWalkInVital('Height')?.unit || 'cm';

    setBpSystolic(systolic?.toString() || '');
    setBpDiastolic(diastolic?.toString() || '');
    setHeartRate(heart?.toString() || '');
    setTemperature(temp?.toString() || '');
    setTemperatureUnit((tempUnit as 'C' | 'F') || 'C');
    setOxygenSaturation(spo2?.toString() || '');
    setWeight(wt?.toString() || '');
    setWeightUnit((wtUnit as 'kg' | 'lbs') || 'kg');
    setHeight(ht?.toString() || '');
    setHeightUnit((htUnit as 'cm' | 'inches') || 'cm');
  };

  const mergeWalkInVital = (
    updatedVitals: Vital[],
    name: string,
    value: string,
    unit?: string
  ) => {
    if (!value.trim()) return;
    const existingIndex = updatedVitals.findIndex(
      (v) => v.name?.toLowerCase() === name.toLowerCase()
    );
    const newVital: Vital = {
      id: Date.now().toString() + name.replace(/\s+/g, '-'),
      name,
      value: value.trim(),
      unit: unit?.trim() || undefined,
    };

    if (existingIndex !== -1) {
      updatedVitals[existingIndex] = {
        ...updatedVitals[existingIndex],
        value: value.trim(),
        unit: unit?.trim() || updatedVitals[existingIndex].unit,
      };
    } else {
      updatedVitals.push(newVital);
    }
  };

  const handleSaveVitals = () => {
    const updatedVitals = [...(walkIn.vitals || [])];

    mergeWalkInVital(updatedVitals, 'Blood Pressure Systolic', bpSystolic, 'mmHg');
    mergeWalkInVital(updatedVitals, 'Blood Pressure Diastolic', bpDiastolic, 'mmHg');
    mergeWalkInVital(updatedVitals, 'Heart Rate', heartRate, 'bpm');
    mergeWalkInVital(updatedVitals, 'Temperature', temperature, temperatureUnit);
    mergeWalkInVital(updatedVitals, 'Oxygen Saturation', oxygenSaturation, '%');
    mergeWalkInVital(updatedVitals, 'Weight', weight, weightUnit);
    mergeWalkInVital(updatedVitals, 'Height', height, heightUnit);

    onVitalsChange?.(walkIn.id, updatedVitals);
    setShowVitalsModal(false);
  };

  const handleRemoveVital = (vitalId: string) => {
    const updatedVitals = (walkIn.vitals || []).filter((v) => v.id !== vitalId);
    onVitalsChange?.(walkIn.id, updatedVitals);
  };

  const handleAddMedicine = async () => {
    if (!newMedicineName.trim()) return;

    const updatedMedicines = [
      ...(walkIn.medicines || []),
      {
        id: Date.now().toString(),
        name: newMedicineName.trim(),
        dosage: newMedicineDosage.trim() || undefined,
        frequency: newMedicineFrequency.trim() || undefined,
      },
    ];

    setNewMedicineName('');
    setNewMedicineDosage('');
    setNewMedicineFrequency('');
    onMedicinesChange?.(walkIn.id, updatedMedicines);
  };

  const handleRemoveMedicine = (medicineId: string) => {
    const updatedMedicines = (walkIn.medicines || []).filter((m) => m.id !== medicineId);
    onMedicinesChange?.(walkIn.id, updatedMedicines);
  };

  const duration = calculateDuration();
  const checkInTime = new Date(walkIn.checkInTime);

  return (
    <div className={`w-full p-4 rounded-lg border ${getStatusColor(walkIn.status)} transition-all`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{walkIn.name}</h3>
          <p className="text-sm text-gray-600">{walkIn.phoneNumber}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(walkIn.status)}`}>
          {walkIn.status.charAt(0).toUpperCase() + walkIn.status.slice(1).replace('-', ' ')}
        </span>
      </div>

      {/* Location */}
      <div className="mb-3 text-sm text-gray-700">
        <p className="line-clamp-2">
          <span className="font-medium">📍</span> {walkIn.address}
        </p>
      </div>

      {/* Doctor Information */}
      {walkIn.doctor && (
        <div className="mb-3 text-sm text-gray-700">
          <p>
            <span className="font-medium">👨‍⚕️</span> Assigned to: Dr. {walkIn.doctor.firstName} {walkIn.doctor.lastName}
            {walkIn.doctor.specialization && ` - ${walkIn.doctor.specialization}`}
          </p>
        </div>
      )}

      {/* Time Information */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div>
          <p className="text-gray-600">Check-in</p>
          <p className="font-medium text-gray-900">
            {checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {duration && (
          <div>
            <p className="text-gray-600">Duration</p>
            <p className="font-medium text-gray-900">{duration} min</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {walkIn.notes && (
        <div className="mb-3 p-2 bg-white bg-opacity-50 rounded text-sm text-gray-700">
          <p className="font-medium text-gray-600">Notes:</p>
          <p>{walkIn.notes}</p>
        </div>
      )}

      {/* Walk-in Care Panels */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setShowTestsModal(true)}
          className="flex items-center justify-between gap-2 px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100"
        >
          <span>🧪 Tests</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {(walkIn.additionalTests || []).length}
          </span>
        </button>

        <button
          onClick={() => {
            loadWalkInVitals();
            setShowVitalsModal(true);
          }}
          className="flex items-center justify-between gap-2 px-4 py-3 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100"
        >
          <span>🩺 Vitals</span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            {(walkIn.vitals || []).length}
          </span>
        </button>

        <button
          onClick={() => setShowMedicinesModal(true)}
          className="flex items-center justify-between gap-2 px-4 py-3 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-sm font-medium hover:bg-purple-100"
        >
          <span>💊 Medicines</span>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            {(walkIn.medicines || []).length}
          </span>
        </button>
      </div>

      {showTestsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Additional Tests</h3>
                <p className="text-sm text-gray-500">Manage required walk-in tests.</p>
              </div>
              <button
                onClick={() => setShowTestsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-4 p-5">
              {(walkIn.additionalTests || []).length > 0 ? (
                <div className="space-y-2">
                  {walkIn.additionalTests!.map((test) => (
                    <div key={test.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm">
                      <span>✓ {test.name}</span>
                      <button
                        onClick={() => handleRemoveTest(test.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 px-4 py-8 text-center text-sm text-blue-700">
                  No additional tests added yet.
                </div>
              )}

              {walkIn.status !== 'completed' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">New Test</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTest}
                      onChange={(e) => setNewTest(e.target.value)}
                      placeholder="Test name"
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTest()}
                    />
                    <button
                      onClick={handleAddTest}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showVitalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Vitals</h3>
                <p className="text-sm text-gray-500">Add or remove walk-in vitals.</p>
              </div>
              <button
                onClick={() => setShowVitalsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-6 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-slate-50 rounded-3xl border border-gray-200 p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Blood Pressure</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Systolic</label>
                      <input
                        type="number"
                        value={bpSystolic}
                        onChange={(e) => setBpSystolic(e.target.value)}
                        placeholder="120"
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Diastolic</label>
                      <input
                        type="number"
                        value={bpDiastolic}
                        onChange={(e) => setBpDiastolic(e.target.value)}
                        placeholder="80"
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-3xl border border-gray-200 p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Heart Rate</div>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="72"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div className="bg-slate-50 rounded-3xl border border-gray-200 p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Temperature</div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      placeholder="37.0"
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    />
                    <select
                      value={temperatureUnit}
                      onChange={(e) => setTemperatureUnit(e.target.value as 'C' | 'F')}
                      className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    >
                      <option value="C">°C</option>
                      <option value="F">°F</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-3xl border border-gray-200 p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-3">SpO2</div>
                  <input
                    type="number"
                    value={oxygenSaturation}
                    onChange={(e) => setOxygenSaturation(e.target.value)}
                    placeholder="98"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div className="bg-slate-50 rounded-3xl border border-gray-200 p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Weight</div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="65"
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    />
                    <select
                      value={weightUnit}
                      onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'lbs')}
                      className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    >
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-3xl border border-gray-200 p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Height</div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="170"
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    />
                    <select
                      value={heightUnit}
                      onChange={(e) => setHeightUnit(e.target.value as 'cm' | 'inches')}
                      className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    >
                      <option value="cm">cm</option>
                      <option value="inches">inches</option>
                    </select>
                  </div>
                </div>
              </div>

              {walkIn.status !== 'completed' && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleSaveVitals}
                    className="rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Save Vitals
                  </button>
                </div>
              )}

              {(walkIn.vitals || []).length > 0 ? (
                <div className="space-y-2">
                  {walkIn.vitals!.map((vital) => (
                    <div key={vital.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm">
                      <span>✓ {vital.name}: {vital.value}{vital.unit ? ` ${vital.unit}` : ''}</span>
                      <button
                        onClick={() => handleRemoveVital(vital.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-green-200 bg-emerald-50 px-4 py-8 text-center text-sm text-green-700">
                  No vitals recorded yet.
                </div>
              )}

              {walkIn.status !== 'completed' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Add Vital</label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      type="text"
                      value={newVitalName}
                      onChange={(e) => setNewVitalName(e.target.value)}
                      placeholder="Vital name"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    />
                    <input
                      type="text"
                      value={newVitalValue}
                      onChange={(e) => setNewVitalValue(e.target.value)}
                      placeholder="Value"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    />
                    <input
                      type="text"
                      value={newVitalUnit}
                      onChange={(e) => setNewVitalUnit(e.target.value)}
                      placeholder="Unit"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                  <button
                    onClick={handleAddVital}
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Add Vital
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showMedicinesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Medicines</h3>
                 <p className="text-sm text-gray-500">Add or remove medicines for the walk-in.</p>
              </div>
              <button
                onClick={() => setShowMedicinesModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-4 p-5">
              {(walkIn.medicines || []).length > 0 ? (
                <div className="space-y-2">
                  {walkIn.medicines!.map((medicine) => (
                    <div key={medicine.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm">
                      <span>
                        ✓ {medicine.name}
                        {medicine.dosage && ` - ${medicine.dosage}`}
                        {medicine.frequency && ` (${medicine.frequency})`}
                      </span>
                      <button
                        onClick={() => handleRemoveMedicine(medicine.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-purple-200 bg-purple-50 px-4 py-8 text-center text-sm text-purple-700">
                  No medicines added yet.
                </div>
              )}

              {walkIn.status !== 'completed' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">New Medicine</label>
                  <input
                    type="text"
                    value={newMedicineName}
                    onChange={(e) => setNewMedicineName(e.target.value)}
                    placeholder="Medicine name"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      value={newMedicineDosage}
                      onChange={(e) => setNewMedicineDosage(e.target.value)}
                      placeholder="Dosage (e.g., 500mg)"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                    />
                    <input
                      type="text"
                      value={newMedicineFrequency}
                      onChange={(e) => setNewMedicineFrequency(e.target.value)}
                      placeholder="Frequency (e.g., 3x daily)"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                  <button
                    onClick={handleAddMedicine}
                    className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                  >
                    Add Medicine
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-opacity-30 border-gray-300">
        {walkIn.status === 'pending' && (
          <button
            onClick={() => handleStatusChange('in-progress')}
            disabled={updating}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded transition"
          >
            {updating ? 'Updating...' : 'Start'}
          </button>
        )}

        {walkIn.status === 'in-progress' && (
          <button
            onClick={() => handleStatusChange('completed')}
            disabled={updating}
            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded transition"
          >
            {updating ? 'Updating...' : '✓ Complete'}
          </button>
        )}

        {walkIn.status === 'completed' && (
          <>
            <div className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded text-center">
              ✓ Completed
            </div>
            <Link
              href={`/prescriptions?walk_in_id=${walkIn.id}`}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition"
            >
              📋 Prescription
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
