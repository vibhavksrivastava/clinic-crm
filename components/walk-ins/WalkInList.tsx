'use client';

import React, { useEffect, useState } from 'react';
import { WalkIn, AdditionalTest, WalkInStatus } from '@/lib/types';
import WalkInCard from './WalkInCard';

interface WalkInListProps {
  refreshTrigger?: number;
}

export default function WalkInList({ refreshTrigger = 0 }: WalkInListProps) {
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<WalkInStatus | 'all'>('all');
  const [searchPhone, setSearchPhone] = useState('');

  const fetchWalkIns = async () => {
    try {
      setLoading(true);
      setError('');

      let url = '/api/walk-ins?limit=100';

      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      if (searchPhone.trim()) {
        url += `&phone=${encodeURIComponent(searchPhone)}`;
      }

      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch walk-ins');
      }

      const data = await response.json();
      const formattedWalkIns = (data.data || []).map((w: any) => ({
        id: w.id,
        patientId: w.patient_id,
        name: w.name,
        phoneNumber: w.phone_number,
        address: w.address,
        status: w.status,
        checkInTime: new Date(w.check_in_time),
        checkOutTime: w.check_out_time ? new Date(w.check_out_time) : null,
        additionalTests: w.additional_tests || [],
        notes: w.notes,
        createdBy: w.created_by,
        updatedBy: w.updated_by,
        organizationId: w.organization_id,
        branchId: w.branch_id,
        createdAt: new Date(w.created_at),
        updatedAt: new Date(w.updated_at),
      }));

      setWalkIns(formattedWalkIns);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load walk-ins';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalkIns();
  }, [statusFilter, searchPhone, refreshTrigger]);

  const handleStatusChange = async (id: string, status: WalkInStatus) => {
    try {
      const response = await fetch('/api/walk-ins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh the list
      fetchWalkIns();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleTestsChange = async (id: string, tests: AdditionalTest[]) => {
    try {
      const response = await fetch('/api/walk-ins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, additionalTests: tests }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tests');
      }

      // Update local state
      setWalkIns((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, additionalTests: tests } : w
        )
      );
    } catch (err) {
      console.error('Error updating tests:', err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Filters */}
      <div className="mb-6 space-y-4 bg-white p-4 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Walk-ins Tracking</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'in-progress', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search by Phone
            </label>
            <input
              type="tel"
              id="search"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Enter phone number..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border border-gray-300 border-t-blue-600"></div>
          </div>
          <p className="text-gray-600 mt-2">Loading walk-ins...</p>
        </div>
      )}

      {/* Walk-ins List */}
      {!loading && walkIns.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-lg">No walk-ins found</p>
          <p className="text-gray-500 text-sm">Create a new walk-in to get started</p>
        </div>
      )}

      {!loading && walkIns.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Showing {walkIns.length} walk-in{walkIns.length !== 1 ? 's' : ''}
          </div>

          {walkIns.map((walkIn) => (
            <WalkInCard
              key={walkIn.id}
              walkIn={walkIn}
              onStatusChange={handleStatusChange}
              onTestsChange={handleTestsChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
