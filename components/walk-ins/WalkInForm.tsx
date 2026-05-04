'use client';

import React, { useState, useEffect } from 'react';
import { CreateWalkInRequest, WalkIn } from '@/lib/types';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialization?: string;
}

interface WalkInFormProps {
  onSuccess?: (walkIn: WalkIn) => void;
  onError?: (error: string) => void;
}

export default function WalkInForm({ onSuccess, onError }: WalkInFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    address: '',
    doctorId: '',
    notes: '',
  });

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Fetch doctors on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setDoctorsLoading(true);
        
        // Get organization/branch context from localStorage
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        // Handle both camelCase (organizationId) and snake_case (organization_id) from database
        const organizationId = user?.organizationId || user?.organization_id;
        const branchId = user?.branchId || user?.branch_id;

        if (!organizationId) {
          console.error('❌ No organizationId found in user context', { user });
          setError('Organization context not found. Please log in again.');
          return;
        }

        const params = new URLSearchParams();
        params.append('organizationId', organizationId);
        
        if (branchId) {
          params.append('branchId', branchId);
        }

        console.log(`📋 Fetching doctors for organization: ${organizationId}`);
        const response = await fetch(`/api/doctors?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch doctors');
        }

        const data = await response.json();
        const doctorList = Array.isArray(data.data) ? data.data : [];
        console.log(`👨‍⚕️ Found ${doctorList.length} doctor(s) in this clinic`);
        setDoctors(doctorList);
        
        // Auto-select if only one doctor
        if (doctorList.length === 1) {
          setFormData(prev => ({ ...prev, doctorId: doctorList[0].id }));
          console.log(`✓ Auto-selected doctor: ${doctorList[0].first_name} ${doctorList[0].last_name}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch doctors';
        console.error('❌ Error fetching doctors:', errorMsg);
        setError(errorMsg);
      } finally {
        setDoctorsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields
    if (!formData.name.trim() || !formData.phoneNumber.trim() || !formData.address.trim()) {
      setError('Please fill in all required fields');
      onError?.('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const payload: CreateWalkInRequest = {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        address: formData.address.trim(),
        doctorId: formData.doctorId || undefined,
        notes: formData.notes.trim() || undefined,
      };

      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const response = await fetch('/api/walk-ins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create walk-in');
      }

      const data = await response.json();
      const successMsg = `Walk-in created for ${formData.name}`;
      setSuccess(successMsg);
      onSuccess?.(data.data);

      // Reset form
      setFormData({
        name: '',
        phoneNumber: '',
        address: '',
        doctorId: doctors.length === 1 ? doctors[0].id : '',
        notes: '',
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create walk-in';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">New Walk-in</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          ✓ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Patient Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter patient name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            disabled={loading}
            required
          />
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Enter phone number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            disabled={loading}
            required
          />
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter patient address"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 resize-none"
            disabled={loading}
            required
          />
        </div>

        {/* Doctor Selection */}
        <div>
          <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 mb-1">
            Assign Doctor
          </label>
          {doctorsLoading ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 text-sm">
              Loading doctors...
            </div>
          ) : (
            <select
              id="doctorId"
              name="doctorId"
              value={formData.doctorId}
              onChange={handleChange}
              disabled={loading || doctors.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
            >
              <option value="">
                {doctors.length === 0 ? 'No doctors available' : 'Select a doctor (Optional)'}
              </option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.first_name} {doctor.last_name}
                  {doctor.specialization && ` - ${doctor.specialization}`}
                </option>
              ))}
            </select>
          )}
          {doctors.length === 1 && (
            <p className="text-xs text-gray-500 mt-1">Doctor auto-selected (only one available)</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any notes or remarks"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 resize-none"
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-md transition duration-200 mt-6"
        >
          {loading ? 'Creating...' : 'Create Walk-in'}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Fields marked with * are required
      </p>
    </div>
  );
}
