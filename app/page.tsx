'use client';

import Link from 'next/link';
//import Header from '@/components/Header';
import { useState, useEffect } from 'react';

interface DashboardStats {
  patients: number;
  appointments: number;
  staff: number;
  invoices: number;
  pharmacySales?: number;
  medicines?: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    patients: 0,
    appointments: 0,
    staff: 0,
    invoices: 0,
    pharmacySales: 0,
    medicines: 0,
  });

  const [loading, setLoading] = useState(true);

  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const [clinicInfo, setClinicInfo] = useState({
    name: 'MediCare Plus',
    branch: 'Smart Clinic & Pharmacy ERP',
    logo: '',
  });

  useEffect(() => {
    const token =
      localStorage.getItem('authToken');

    if (token) {
      setIsAuthenticated(true);

      const orgName =
        localStorage.getItem(
          'organizationName'
        );

      const branchName =
        localStorage.getItem(
          'branchName'
        );

      const orgLogo =
        localStorage.getItem(
          'organizationLogo'
        );

      setClinicInfo({
        name:
          orgName || 'MediCare Plus',
        branch:
          branchName ||
          'Smart Clinic & Pharmacy ERP',
        logo: orgLogo || '',
      });

      fetchStats();
    } else {
      setLoading(false);
    }
  }, []);

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem(
        'authToken'
      );

    return {
      'Content-Type': 'application/json',
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
    };
  };

  const safeJson = async (
    response: Response
  ) => {
    try {
      return await response.json();
    } catch {
      return [];
    }
  };

  const fetchStats = async () => {
    try {
      const [
        patientsRes,
        appointmentsRes,
        staffRes,
        invoicesRes,
        medicinesRes,
        salesRes,
      ] = await Promise.all([
        fetch('/api/patients', {
          headers: getAuthHeaders(),
        }),

        fetch('/api/appointments', {
          headers: getAuthHeaders(),
        }),

        fetch('/api/staff', {
          headers: getAuthHeaders(),
        }),

        fetch('/api/invoices', {
          headers: getAuthHeaders(),
        }),

        fetch(
          '/api/pharmacy/medicines',
          {
            headers:
              getAuthHeaders(),
          }
        ),

        fetch(
          '/api/pharmacy/sales',
          {
            headers:
              getAuthHeaders(),
          }
        ),
      ]);

      const patients =
        await safeJson(
          patientsRes
        );

      const appointments =
        await safeJson(
          appointmentsRes
        );

      const staff =
        await safeJson(staffRes);

      const invoices =
        await safeJson(
          invoicesRes
        );

      const medicines =
        await safeJson(
          medicinesRes
        );

      const sales =
        await safeJson(salesRes);

      setStats({
        patients: Array.isArray(
          patients
        )
          ? patients.length
          : 0,

        appointments:
          Array.isArray(
            appointments
          )
            ? appointments.length
            : 0,

        staff: Array.isArray(
          staff
        )
          ? staff.length
          : 0,

        invoices: Array.isArray(
          invoices
        )
          ? invoices.length
          : 0,

        medicines:
          Array.isArray(
            medicines
          )
            ? medicines.length
            : 0,

        pharmacySales:
          Array.isArray(sales)
            ? sales.length
            : 0,
      });
    } catch (error) {
      console.error(
        'Dashboard stats error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Patients',
      value: stats.patients,
      icon: '👥',
      color:
        'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
    },

    {
      title: 'Appointments',
      value: stats.appointments,
      icon: '📅',
      color:
        'from-emerald-500 to-green-500',
      bg: 'bg-emerald-50',
    },

    {
      title: 'Staff',
      value: stats.staff,
      icon: '🩺',
      color:
        'from-purple-500 to-fuchsia-500',
      bg: 'bg-purple-50',
    },

    {
      title: 'Invoices',
      value: stats.invoices,
      icon: '💳',
      color:
        'from-orange-500 to-amber-500',
      bg: 'bg-orange-50',
    },

    {
      title: 'Medicines',
      value: stats.medicines || 0,
      icon: '💊',
      color:
        'from-pink-500 to-rose-500',
      bg: 'bg-pink-50',
    },

    {
      title: 'Pharmacy Sales',
      value:
        stats.pharmacySales || 0,
      icon: '🧾',
      color:
        'from-indigo-500 to-blue-600',
      bg: 'bg-indigo-50',
    },
  ];

  const modules = [
    {
      title:
        'Patient Management',
      icon: '👥',
      href: '/patients',
      description:
        'Manage patient records, demographics and history',
    },

    {
      title:
        'Appointments',
      icon: '📅',
      href: '/appointments',
      description:
        'Schedule and manage doctor appointments',
    },

    {
      title: 'Prescriptions',
      icon: '📝',
      href: '/prescriptions',
      description:
        'Digital prescription management system',
    },

    {
      title: 'Pharmacy',
      icon: '💊',
      href: '/pharmacy',
      description:
        'Inventory, billing and medicine management',
    },

    {
      title:
        'Billing & Invoices',
      icon: '💳',
      href: '/invoicing',
      description:
        'Invoices, payments and financial reports',
    },

    {
      title:
        'Staff Management',
      icon: '🩺',
      href: '/staff',
      description:
        'Doctors, nurses and employee management',
    },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50">
        {/* HERO */}

        <div className="relative overflow-hidden">

          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-800" />

          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

          <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

              <div>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-blue-100 text-sm mb-6">

                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />

                  Smart Healthcare ERP
                </div>

                <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight">
                  Modern
                  <span className="block text-cyan-300">
                    Clinic &
                  </span>
                  Pharmacy ERP
                </h1>

                <p className="mt-6 text-lg text-blue-100 leading-relaxed max-w-xl">
                  Complete digital healthcare platform for
                  clinics, pharmacies, hospitals and healthcare
                  organizations.
                </p>

                <div className="flex flex-wrap gap-4 mt-10">

                  <Link
                    href="/login"
                    className="px-8 py-4 rounded-2xl bg-white text-blue-700 font-bold hover:scale-105 transition-all shadow-2xl"
                  >
                    Login to Dashboard
                  </Link>

                  <button className="px-8 py-4 rounded-2xl border border-white/30 text-white hover:bg-white/10 transition-all backdrop-blur">
                    Explore Features
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-6 mt-12">

                  <div>
                    <h3 className="text-4xl font-black text-white">
                      24/7
                    </h3>

                    <p className="text-blue-200 text-sm mt-1">
                      Cloud Access
                    </p>
                  </div>

                  <div>
                    <h3 className="text-4xl font-black text-white">
                      AI
                    </h3>

                    <p className="text-blue-200 text-sm mt-1">
                      Smart Automation
                    </p>
                  </div>

                  <div>
                    <h3 className="text-4xl font-black text-white">
                      ERP
                    </h3>

                    <p className="text-blue-200 text-sm mt-1">
                      Enterprise Ready
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT */}

              <div className="relative">

                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[32px] p-8 shadow-2xl">

                  <div className="grid grid-cols-2 gap-5">

                    {[
                      {
                        icon: '👨‍⚕️',
                        title:
                          'Doctor Workflow',
                      },

                      {
                        icon: '💊',
                        title:
                          'Pharmacy Billing',
                      },

                      {
                        icon: '📊',
                        title:
                          'Analytics',
                      },

                      {
                        icon: '🔐',
                        title:
                          'Secure Access',
                      },

                      {
                        icon: '📅',
                        title:
                          'Appointments',
                      },

                      {
                        icon: '🧾',
                        title:
                          'Invoices',
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl bg-white/10 border border-white/10 p-6 text-center hover:bg-white/20 transition"
                      >

                        <div className="text-5xl mb-4">
                          {item.icon}
                        </div>

                        <p className="text-white font-semibold text-sm">
                          {item.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute -bottom-8 -left-8 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl">
                  <p className="font-bold">
                    Multi Branch Ready
                  </p>
                </div>

                <div className="absolute -top-8 -right-8 bg-white text-slate-800 px-6 py-4 rounded-2xl shadow-2xl">
                  <p className="font-bold">
                    Real Time Reports
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURES */}

        <div className="max-w-7xl mx-auto px-6 py-20">

          <div className="text-center mb-14">

            <h2 className="text-4xl font-black text-slate-900">
              Powerful Healthcare Modules
            </h2>

            <p className="text-slate-500 mt-4 text-lg">
              Everything required to run a modern healthcare
              organization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

            {[
              {
                icon: '👥',
                title:
                  'Patient Management',
              },

              {
                icon: '📅',
                title:
                  'Appointments',
              },

              {
                icon: '💊',
                title:
                  'Pharmacy ERP',
              },

              {
                icon: '🧾',
                title:
                  'Billing System',
              },

              {
                icon: '🩺',
                title:
                  'Doctor Workflow',
              },

              {
                icon: '📊',
                title:
                  'Reports & Analytics',
              },

              {
                icon: '🔐',
                title:
                  'Role Based Access',
              },

              {
                icon: '☁️',
                title:
                  'Cloud Infrastructure',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
              >

                <div className="text-5xl mb-5">
                  {feature.icon}
                </div>

                <h3 className="text-xl font-bold text-slate-800">
                  {feature.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/*<Header />*/}

      {/* TOP SECTION */}

      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900">

        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14">

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-10">

            <div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur text-blue-100 text-sm mb-5">

                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />

                System Operational
              </div>

              <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight">
                Welcome Back
              </h1>

              <p className="text-blue-100 text-lg mt-4 max-w-2xl">
                Manage patients, pharmacy inventory,
                appointments, billing and clinic operations
                from one smart dashboard.
              </p>
            </div>

            {/* QUICK ACTIONS */}

            <div className="grid grid-cols-2 gap-4">

              <Link
                href="/appointments"
                className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 rounded-3xl p-5 transition-all"
              >

                <div className="text-4xl">
                  📅
                </div>

                <p className="text-white font-semibold mt-3">
                  Appointments
                </p>
              </Link>

              <Link
                href="/patients"
                className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 rounded-3xl p-5 transition-all"
              >

                <div className="text-4xl">
                  👥
                </div>

                <p className="text-white font-semibold mt-3">
                  Patients
                </p>
              </Link>

              <Link
                href="/pharmacy"
                className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 rounded-3xl p-5 transition-all"
              >

                <div className="text-4xl">
                  💊
                </div>

                <p className="text-white font-semibold mt-3">
                  Pharmacy
                </p>
              </Link>

              <Link
                href="/invoicing"
                className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 rounded-3xl p-5 transition-all"
              >

                <div className="text-4xl">
                  🧾
                </div>

                <p className="text-white font-semibold mt-3">
                  Billing
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* STATS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">

          {loading
            ? Array.from({
                length: 6,
              }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-6 animate-pulse h-40"
                />
              ))
            : statsCards.map(
                (card) => (
                  <div
                    key={card.title}
                    className={`${card.bg} border border-white rounded-[28px] shadow-sm overflow-hidden relative`}
                  >

                    <div
                      className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${card.color}`}
                    />

                    <div className="p-7">

                      <div className="flex items-start justify-between">

                        <div>

                          <p className="text-slate-500 font-medium">
                            {card.title}
                          </p>

                          <h3 className="text-5xl font-black text-slate-800 mt-4">
                            {card.value}
                          </h3>
                        </div>

                        <div className="text-6xl opacity-20">
                          {card.icon}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
        </div>

        {/* MODULES */}

        <div className="mb-12">

          <div className="flex items-center justify-between mb-8">

            <div>

              <h2 className="text-3xl font-black text-slate-900">
                Smart Modules
              </h2>

              <p className="text-slate-500 mt-1">
                Access your healthcare operations instantly
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {modules.map((module) => (
              <Link
                href={module.href}
                key={module.title}
              >

                <div className="group bg-white rounded-[30px] border border-slate-200 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-1 overflow-hidden">

                  <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500" />

                  <div className="p-8">

                    <div className="flex items-center justify-between mb-6">

                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-4xl group-hover:scale-110 transition">
                        {module.icon}
                      </div>

                      <div className="text-blue-600 font-bold text-lg">
                        →
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-800 mb-3">
                      {module.title}
                    </h3>

                    <p className="text-slate-500 leading-relaxed">
                      {module.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* BOTTOM GRID */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* LEFT */}

          <div className="xl:col-span-2 bg-white rounded-[30px] border border-slate-200 shadow-sm p-8">

            <div className="flex items-center justify-between mb-8">

              <div>

                <h2 className="text-3xl font-black text-slate-900">
                  Platform Highlights
                </h2>

                <p className="text-slate-500 mt-1">
                  Built for scalable healthcare operations
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {[
                {
                  icon: '⚡',
                  title:
                    'Fast Performance',
                },

                {
                  icon: '🔐',
                  title:
                    'Secure Authentication',
                },

                {
                  icon: '📱',
                  title:
                    'Mobile Responsive',
                },

                {
                  icon: '☁️',
                  title:
                    'Cloud Ready',
                },

                {
                  icon: '📊',
                  title:
                    'Live Reports',
                },

                {
                  icon: '🤖',
                  title:
                    'AI Ready Platform',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl bg-slate-50 border border-slate-200 p-6"
                >

                  <div className="text-4xl mb-4">
                    {item.icon}
                  </div>

                  <h3 className="text-lg font-bold text-slate-800">
                    {item.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[30px] shadow-2xl p-8 text-white relative overflow-hidden">

            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />

            <div className="absolute -bottom-16 -left-10 w-52 h-52 rounded-full bg-white/10" />

            <div className="relative">

              <div className="text-6xl mb-6">
                🚀
              </div>

              <h2 className="text-3xl font-black leading-tight">
                Smart Healthcare Platform
              </h2>

              <p className="mt-5 text-blue-100 leading-relaxed">
                Unified ERP platform for clinics, hospitals and
                pharmacies with scalable architecture and
                enterprise-ready workflows.
              </p>

              <div className="space-y-4 mt-8">

                {[
                  'Role Based Access',
                  'Pharmacy Inventory',
                  'Prescription Workflow',
                  'Advanced Billing',
                  'Cloud Infrastructure',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >

                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">
                      ✓
                    </div>

                    <p className="text-white">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/pharmacy"
                className="inline-flex items-center justify-center mt-10 w-full px-6 py-4 rounded-2xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition"
              >
                Open Pharmacy Module
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}