'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  organizationId?: string;
  role?: {
    roleType: string;
  };
}

interface Doctor {
  id: string;
  name: string;
  specialization?: string;
}

export default function WalkInForm() {
  const [user, setUser] = useState<User | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user safely
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');

      if (!storedUser) {
        setError('User not found. Please login again.');
        setLoading(false);
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } catch (err) {
      console.error('Error parsing user:', err);
      setError('Invalid user session. Please login again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch doctors AFTER user is available
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!user) return;

      const organizationId = user.organizationId;

      if (!organizationId) {
        console.error('❌ No organizationId found in user context', user);
        setError('Organization context not found. Please login again.');
        return;
      }

      try {
        setLoading(true);

        const token = localStorage.getItem('authToken');

        if (!token) {
          setError('Auth token missing. Please login again.');
          return;
        }

        const res = await fetch(
          `/api/doctors?organizationId=${organizationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error('Failed to fetch doctors');
        }

        const data = await res.json();
        setDoctors(data?.doctors || []);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [user]);

  // UI states
  if (loading) {
    return (
      <div className="p-4 text-gray-600">
        Loading walk-in form...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Walk-in Registration</h2>

      {/* Doctor Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Select Doctor
        </label>

        <select className="w-full border p-2 rounded">
          <option value="">Select doctor</option>
          {doctors.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Debug info (remove in production) */}
      <div className="text-xs text-gray-400">
        Organization: {user?.organizationId || 'N/A'}
      </div>
    </div>
  );
}