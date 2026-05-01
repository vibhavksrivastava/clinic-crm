'use client';

import { useState, useEffect } from 'react';
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
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setOrganizations(data.organizations);
      } else if (response.status === 401) {
        window.location.href = '/login';
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      setError('Error loading dashboard: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, icon }: { label: string; value: number; icon: string }) => (
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage all clinics, branches, and system configuration</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">❌ {error}</p>
          </div>
        )}

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard label="Total Clinics" value={stats.totalOrganizations} icon="🏥" />
          <StatCard label="Total Branches" value={stats.totalBranches} icon="📍" />
          <StatCard label="Active Users" value={stats.activeUsers} icon="👥" />
          <StatCard label="Total Patients" value={stats.totalPatients} icon="🧑‍⚕️" />
          <StatCard label="Today's Appointments" value={stats.totalAppointments} icon="📅" />
          <StatCard label="System Users" value={stats.totalUsers} icon="🔑" />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link
              href="/admin/organizations"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <div>
                <p className="font-semibold text-gray-900">🏥 Manage Clinics</p>
                <p className="text-sm text-gray-600">Create, edit, delete organizations</p>
              </div>
            </Link>

            <Link
              href="/admin/branches"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
            >
              <div>
                <p className="font-semibold text-gray-900">📍 Manage Branches</p>
                <p className="text-sm text-gray-600">Handle clinic locations</p>
              </div>
            </Link>

            <Link
              href="/admin/staff"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
            >
              <div>
                <p className="font-semibold text-gray-900">👥 Manage Staff</p>
                <p className="text-sm text-gray-600">Users, roles, permissions</p>
              </div>
            </Link>

            <Link
              href="/admin/roles"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
            >
              <div>
                <p className="font-semibold text-gray-900">🎭 Manage Roles</p>
                <p className="text-sm text-gray-600">Create custom roles</p>
              </div>
            </Link>

            <Link
              href="/admin/audit-logs"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition"
            >
              <div>
                <p className="font-semibold text-gray-900">📋 Audit Logs</p>
                <p className="text-sm text-gray-600">View system activity</p>
              </div>
            </Link>

            <Link
              href="/admin/settings"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition"
            >
              <div>
                <p className="font-semibold text-gray-900">⚙️ Settings</p>
                <p className="text-sm text-gray-600">System configuration</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Organizations */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Clinics</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : organizations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600 mb-4">No clinics yet</p>
              <Link
                href="/admin/organizations?action=create"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create First Clinic
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Clinic Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Plan</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Branches</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Staff</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{org.name}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{org.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {org.subscription_plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{org.branches_count || 0}</td>
                      <td className="px-6 py-4 text-gray-600">{org.users_count || 0}</td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/organizations/${org.id}`}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
