'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  AlertTriangle,
  IndianRupee,
  Receipt,
  Pill,
  ShoppingCart,
  Activity,
  FileText,
  Truck,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  roleType: string;
  first_name?: string;
}

interface DashboardStats {
  totalPatients: number;
  todaysAppointments: number;
  todaysWalkIns?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todaysAppointments: 0,
    todaysWalkIns: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);

  // -----------------------------
  // AUTH CHECK (COOKIE BASED)
  // -----------------------------
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        const data = await res.json();

        if (!data.authenticated) {
          router.push('/login');
          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error('Auth error:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // -----------------------------
  // FETCH STATS
  // -----------------------------
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats', {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Stats error:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'DELETE',
      credentials: 'include',
    });

    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  const today = new Date();

  const formattedDate = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

return (
  <div className="min-h-screen bg-slate-50">

    <div className="max-w-7xl mx-auto px-6 py-6">


            {/* HERO */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-2xl mb-8">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_25%)]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md mb-4">
              <Activity size={16} />
              MediQuick Rx
            </div>

            <h2 className="text-4xl font-bold">
               Welcome , {user.first_name}
            </h2>

            <p className="mt-3 text-blue-100 max-w-2xl">
                Manage clinic operations, returns, appointments and patient care
            </p>
          </div>

    {/* TODAY CARD */}
    <div
      className="bg-gradient-to-r from-blue-50 to-indigo-50
      border border-blue-100
      rounded-3xl px-5 py-4
      shadow-sm"
    >
      <div className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
        Today
      </div>

      <div className="mt-1 text-lg font-bold text-gray-900">
        {new Date().toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </div>
    </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-sm">
                Total Patients
              </p>
              <h2 className="text-3xl font-bold text-slate-800 mt-1">
                {stats.totalPatients}
              </h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              👨‍⚕️
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-sm">
                Today's Appointments
              </p>
              <h2 className="text-3xl font-bold text-slate-800 mt-1">
                {stats.todaysAppointments}
              </h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              📅
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-sm">
                Walk-ins
              </p>
              <h2 className="text-3xl font-bold text-slate-800 mt-1">
                {stats.todaysWalkIns || 0}
              </h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              🚶
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-sm">
                Role Access
              </p>
              <h2 className="text-lg font-semibold text-slate-800 mt-1 capitalize">
                {user.roleType}
              </h2>
            </div>

            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              🔐
            </div>
          </div>
        </div>

      </div>

      {/* Quick Access */}
      <div className="mt-8">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">
            Quick Access
          </h2>

          <p className="text-sm text-slate-500">
            Frequently used modules
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(user.roleType === 'doctor' ||
            user.roleType === 'admin' ||
            user.roleType === 'super_admin' ||
            user.roleType === 'receptionist') && (
          <Link
            href="/patients"
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition group"
          >
            <div className="text-3xl">🧑‍⚕️</div>

            <h3 className="font-semibold text-slate-800 mt-3 group-hover:text-blue-600">
              Patients
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Manage patient profiles and records
            </p>
          </Link>
          )}
          <Link
            href="/appointments"
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-green-300 transition group"
          >
            <div className="text-3xl">📆</div>

            <h3 className="font-semibold text-slate-800 mt-3 group-hover:text-green-600">
              Appointments
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Schedule and manage bookings
            </p>
          </Link>

          <Link
            href="/prescriptions"
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition group"
          >
            <div className="text-3xl">💊</div>

            <h3 className="font-semibold text-slate-800 mt-3 group-hover:text-purple-600">
              Prescriptions
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              View and generate prescriptions
            </p>
          </Link>

          <Link
            href="/invoicing"
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-orange-300 transition group"
          >
            <div className="text-3xl">💳</div>

            <h3 className="font-semibold text-slate-800 mt-3 group-hover:text-orange-600">
              Billing
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Invoice and payment management
            </p>
          </Link>

{(user.roleType === 'doctor' ||
            user.roleType === 'admin' ||
            user.roleType === 'super_admin' ||
            user.roleType === 'pharmacist') && (
          <Link
            href="/pharmacy"
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition group"
          >
            <div className="text-3xl">💊</div>

            <h3 className="font-semibold text-slate-800 mt-3 group-hover:text-blue-600">
              Pharmacy
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Manage patient profiles and records
            </p>
          </Link>
          )}

          {(user.roleType === 'admin' ||
            user.roleType === 'super_admin') && (
            <Link
              href="/admin"
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-red-300 transition group"
            >
              <div className="text-3xl">⚙️</div>

              <h3 className="font-semibold text-slate-800 mt-3 group-hover:text-red-600">
                Admin Panel
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                System configuration & RBAC
              </p>
            </Link>
          )}

        </div>
      </div>
    </div>
  </div>
);
}