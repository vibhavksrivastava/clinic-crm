'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import WalkInForm from '@/components/walk-ins/WalkInForm';
import WalkInList from '@/components/walk-ins/WalkInList';
import WalkInStatsCard from '@/components/walk-ins/WalkInStatsCard';
import WalkInReports from '@/components/walk-ins/WalkInReports';
import { WalkIn } from '@/lib/types';

interface User {
  id: string;
  role?: {
    roleType: string;
  };
}

export default function WalkInsPage() {
  const [activeTab, setActiveTab] = useState<'tracking' | 'reports'>('tracking');
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  const handleWalkInCreated = (walkIn: WalkIn) => {
    // Refresh the list and stats when new walk-in is created
    setRefreshKey((prev) => prev + 1);
  };

  const handleError = (error: string) => {
    console.error('Walk-in error:', error);
  };

  // Check if user is receptionist
  const isReceptionist = user?.role?.roleType === 'receptionist';
  // Check if user can view reports
  const canViewReports = !isReceptionist;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-gray-700 font-bold text-lg"
                title="Back to Dashboard"
              >
                ←
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Walk-in Management</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Track and manage daily clinic walk-ins efficiently
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
              System Online
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Stats Section - Hide full stats from receptionists */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
          <WalkInStatsCard refreshTrigger={refreshKey} hideFullStats={isReceptionist} />
        </div>

        {/* Two Column Layout: Form + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form (sticky on desktop) */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 lg:h-fit">
            <WalkInForm
              onSuccess={handleWalkInCreated}
              onError={handleError}
            />
          </div>

          {/* Right Column: Tracking and Reports */}
          <div className="lg:col-span-2">
            {/* Tabs - Hide Reports for Receptionists */}
            <div className="flex gap-2 mb-6 bg-white p-2 rounded-lg border border-gray-200">
              <button
                onClick={() => setActiveTab('tracking')}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
                  activeTab === 'tracking'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📋 Tracking
              </button>
              {canViewReports && (
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
                    activeTab === 'reports'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📊 Reports
                </button>
              )}
            </div>

            {/* Content */}
            {activeTab === 'tracking' && (
              <div>
                <WalkInList refreshTrigger={refreshKey} />
              </div>
            )}

            {canViewReports && activeTab === 'reports' && (
              <div>
                <WalkInReports />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
