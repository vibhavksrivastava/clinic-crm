'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: {
    id: string;
    roleType: string;
    permissions: string[];
    name: string;
  };
}

interface DashboardStats {
  totalPatients: number;
  todaysAppointments: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todaysAppointments: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [router]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const response = await fetch('/api/dashboard/stats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Welcome, {user.first_name}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Role: <span className="font-semibold capitalize">{user.role?.name || user.role?.roleType || 'User'}</span>
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-12 mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ) : (
              <>
                <div className="text-blue-600 text-2xl sm:text-3xl font-bold">{stats.totalPatients}</div>
                <p className="text-gray-600 text-xs sm:text-sm mt-2">Total Patients</p>
              </>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-12 mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ) : (
              <>
                <div className="text-green-600 text-2xl sm:text-3xl font-bold">{stats.todaysAppointments}</div>
                <p className="text-gray-600 text-xs sm:text-sm mt-2">Appointments Today</p>
              </>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-12 mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ) : (
              <>
                <div className="text-orange-600 text-2xl sm:text-3xl font-bold">0</div>
                <p className="text-gray-600 text-xs sm:text-sm mt-2">Pending Invoices</p>
              </>
            )}
          </div>
        </div>

        {/* Main Menu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Patients */}
          <Link
            href="/patients"
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="text-2xl sm:text-3xl mb-3">👥</div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Patients</h2>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage patient records and history</p>
          </Link>

          {/* Appointments */}
          <Link
            href="/appointments"
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="text-2xl sm:text-3xl mb-3">📅</div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Appointments</h2>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Schedule and manage appointments</p>
          </Link>

          {/* Prescriptions */}
          <Link
            href="/prescriptions"
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="text-2xl sm:text-3xl mb-3">💊</div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Prescriptions</h2>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Create and manage prescriptions</p>
          </Link>

          {/* Invoices */}
          <Link
            href="/invoicing"
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="text-2xl sm:text-3xl mb-3">💰</div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Invoicing</h2>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Generate and track invoices</p>
          </Link>

          {/* Admin Panel */}
          {(user.role?.roleType === 'admin' || user.role?.roleType === 'super_admin' || user.role?.roleType === 'clinic_admin' || user.role?.roleType === 'branch_admin') && (
            <Link
              href="/admin"
              className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition cursor-pointer"
            >
              <div className="text-2xl sm:text-3xl mb-3">⚙️</div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Admin Panel</h2>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">System administration and settings</p>
            </Link>
          )}
        </div>

        {/* Logout Button */}
        <div className="text-center">
          <button
            onClick={handleLogout}
            className="px-4 sm:px-6 py-2 bg-red-600 text-white font-semibold text-sm sm:text-base rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
