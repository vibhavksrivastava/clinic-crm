'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

interface DashboardStats {
  totalOrganizations: number;
  totalBranches: number;
  totalUsers: number;
  activeUsers: number;
  totalPatients: number;
  totalAppointments: number;
}

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  subscription_plan: string;
  created_at: string;
  branches_count?: number;
  users_count?: number;
}

export default function AdminDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    totalOrganizations: 0,
    totalBranches: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalPatients: 0,
    totalAppointments: 0,
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [error, setError] = useState('');

  /**
   * 1. AUTH CHECK (IMPORTANT FIX)
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        const data = await res.json();

        if (!data.authenticated) {
          router.replace('/login');
          return;
        }

        setAuthChecking(false);
      } catch (err) {
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  /**
   * 2. LOAD DASHBOARD DATA
   */
  useEffect(() => {
    if (authChecking) return;
    fetchDashboardData();
  }, [authChecking]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include',
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();

      setStats(data.stats);
      setOrganizations(data.organizations);
    } catch (err) {
      setError('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    label,
    value,
    icon,
  }: {
    label: string;
    value: number;
    icon: string;
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  /**
   * LOADING STATE
   */
  if (authChecking) {
    return (
      <div className="h-screen flex items-center justify-center">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/*<Header />*/}

      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage clinics, branches, and system configuration
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard label="Total Clinics" value={stats.totalOrganizations} icon="🏥" />
          <StatCard label="Total Branches" value={stats.totalBranches} icon="📍" />
          <StatCard label="Active Users" value={stats.activeUsers} icon="👥" />
          <StatCard label="Patients" value={stats.totalPatients} icon="🧑‍⚕️" />
          <StatCard label="Appointments" value={stats.totalAppointments} icon="📅" />
          <StatCard label="System Users" value={stats.totalUsers} icon="🔑" />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link href="/admin/organizations" className="p-4 border rounded hover:bg-blue-50">
              🏥 Clinics
            </Link>

            <Link href="/admin/branches" className="p-4 border rounded hover:bg-green-50">
              📍 Branches
            </Link>

            <Link href="/admin/staff" className="p-4 border rounded hover:bg-purple-50">
              👥 Staff
            </Link>

            <Link href="/admin/roles" className="p-4 border rounded hover:bg-indigo-50">
              🎭 Roles
            </Link>

            <Link href="/admin/settings" className="p-4 border rounded hover:bg-orange-50">
              ⚙️ Settings
            </Link>
          </div>
        </div>

        {/* Organizations */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold">Recent Clinics</h2>
          </div>

          {loading ? (
            <div className="p-6">Loading...</div>
          ) : organizations.length === 0 ? (
            <div className="p-6">No clinics found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Plan</th>
                  <th className="p-3 text-left">Branches</th>
                  <th className="p-3 text-left">Users</th>
                </tr>
              </thead>

              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id} className="border-t">
                    <td className="p-3">{org.name}</td>
                    <td className="p-3">{org.email}</td>
                    <td className="p-3">{org.subscription_plan}</td>
                    <td className="p-3">{org.branches_count || 0}</td>
                    <td className="p-3">{org.users_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}