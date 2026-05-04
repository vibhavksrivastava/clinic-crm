'use client';

import React, { useState } from 'react';
import { WalkIn, AdditionalTest } from '@/lib/types';

interface WalkInCardProps {
  walkIn: WalkIn;
  onUpdate?: (walkIn: WalkIn) => void;
  onStatusChange?: (id: string, status: 'in-progress' | 'completed') => void;
  onTestsChange?: (id: string, tests: AdditionalTest[]) => void;
}

export default function WalkInCard({
  walkIn,
  onUpdate,
  onStatusChange,
  onTestsChange,
}: WalkInCardProps) {
  const [showTests, setShowTests] = useState(false);
  const [newTest, setNewTest] = useState('');
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

      {/* Tests Section */}
      <div className="mb-3">
        <button
          onClick={() => setShowTests(!showTests)}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <span>🧪 Additional Tests</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {(walkIn.additionalTests || []).length}
          </span>
        </button>

        {showTests && (
          <div className="mt-2 space-y-2">
            {/* Tests List */}
            {(walkIn.additionalTests || []).length > 0 && (
              <div className="space-y-1">
                {walkIn.additionalTests!.map((test) => (
                  <div key={test.id} className="flex items-center justify-between bg-white bg-opacity-70 p-2 rounded text-sm">
                    <span>✓ {test.name}</span>
                    <button
                      onClick={() => handleRemoveTest(test.id)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Test Form */}
            {walkIn.status !== 'completed' && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newTest}
                  onChange={(e) => setNewTest(e.target.value)}
                  placeholder="Add test..."
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTest()}
                />
                <button
                  onClick={handleAddTest}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
          <div className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded text-center">
            ✓ Completed
          </div>
        )}
      </div>
    </div>
  );
}
