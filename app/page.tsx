'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  patients: number;
  appointments: number;
  staff: number;
  invoices: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    patients: 0,
    appointments: 0,
    staff: 0,
    invoices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clinicInfo, setClinicInfo] = useState<{ name: string; branch: string; logo: string }>({ name: 'City Health Clinic', branch: 'Multi-Specialty Healthcare', logo: '' });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      // Get clinic info from localStorage
      const orgName = localStorage.getItem('organizationName');
      const branchName = localStorage.getItem('branchName');
      const orgLogo = localStorage.getItem('organizationLogo');
      if (orgName || branchName || orgLogo) {
        setClinicInfo({
          name: orgName || 'City Health Clinic',
          branch: branchName || 'Multi-Specialty Healthcare',
          logo: orgLogo || ''
        });
      }
      fetchStats();
    } else {
      setLoading(false);
    }
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const fetchStats = async () => {
    try {
      const [patientsRes, appointmentsRes, staffRes, invoicesRes] = await Promise.all([
        fetch('/api/patients', { headers: getAuthHeaders() }),
        fetch('/api/appointments', { headers: getAuthHeaders() }),
        fetch('/api/staff', { headers: getAuthHeaders() }),
        fetch('/api/invoices', { headers: getAuthHeaders() }),
      ]);

      const patients = await patientsRes.json();
      const appointments = await appointmentsRes.json();
      const staff = await staffRes.json();
      const invoices = await invoicesRes.json();

      setStats({
        patients: Array.isArray(patients) ? patients.length : 0,
        appointments: Array.isArray(appointments) ? appointments.length : 0,
        staff: Array.isArray(staff) ? staff.length : 0,
        invoices: Array.isArray(invoices) ? invoices.length : 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show welcome page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              {clinicInfo.logo ? (
                <img src={clinicInfo.logo} alt="Clinic Logo" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 font-bold text-lg">
                  🏥
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{clinicInfo.name}</h1>
                <p className="text-xs text-blue-100">{clinicInfo.branch}</p>
              </div>
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Sign In
            </Link>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-16">
          {/* Scrolling Features Banner */}
          <div className="relative mb-16 rounded-2xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-indigo-900/70 z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=400&fit=crop" 
              alt="Modern Healthcare" 
              className="w-full h-80 object-cover"
            />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
              <div className="text-center text-white mb-8">
                <div className="text-6xl mb-4">🏥</div>
                <h1 className="text-5xl font-bold mb-4">Welcome to City Health Clinic</h1>
                <p className="text-xl text-blue-100 mb-8">
                  Comprehensive clinic management system for modern healthcare providers
                </p>
              </div>
              
              {/* Scrolling Features */}
              <div className="w-full overflow-hidden">
                <div className="flex animate-scroll gap-6 whitespace-nowrap">
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">👥</span> Patient Management
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">📅</span> Appointments
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">💊</span> Prescriptions
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">💳</span> Invoicing
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">👨‍⚕️</span> Staff Management
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">🔐</span> Role-Based Access
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">💬</span> WhatsApp Reminders
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">📊</span> Reports
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">🏢</span> Multi-Clinic
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">🔒</span> Secure Auth
                  </div>
                  {/* Duplicate for seamless scroll */}
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">👥</span> Patient Management
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">📅</span> Appointments
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">💊</span> Prescriptions
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">💳</span> Invoicing
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">👨‍⚕️</span> Staff Management
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">🔐</span> Role-Based Access
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">💬</span> WhatsApp Reminders
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">📊</span> Reports
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">🏢</span> Multi-Clinic
                  </div>
                  <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 text-white">
                    <span className="font-semibold">🔒</span> Secure Auth
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Core Features Banner */}
          <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-800/80 to-cyan-600/80 z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=1200&h=200&fit=crop" 
              alt="Core Features" 
              className="w-full h-40 object-cover"
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <h2 className="text-3xl font-bold text-white">Core Features</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-100 hover:shadow-xl transition">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Patient Management</h3>
                <p className="text-gray-600 text-sm">Complete patient records, medical history, insurance & emergency contacts</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-100 hover:shadow-xl transition">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Appointment Scheduling</h3>
                <p className="text-gray-600 text-sm">Calendar-based booking, reminders & automated scheduling</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-100 hover:shadow-xl transition">
                <div className="text-4xl mb-4">💊</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Prescriptions & EMR</h3>
                <p className="text-gray-600 text-sm">Digital prescriptions, EMR, drug interactions & pharmacy management</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-100 hover:shadow-xl transition">
                <div className="text-4xl mb-4">💳</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Invoicing & Billing</h3>
                <p className="text-gray-600 text-sm">Generate invoices, track payments & financial reporting</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-100 hover:shadow-xl transition">
                <div className="text-4xl mb-4">👨‍⚕️</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Staff Management</h3>
                <p className="text-gray-600 text-sm">Manage doctors, nurses, receptionists & role assignments</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-100 hover:shadow-xl transition">
                <div className="text-4xl mb-4">🏢</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Multi-Clinic Support</h3>
                <p className="text-gray-600 text-sm">Manage multiple branches & organizations from one platform</p>
              </div>
          </div>

          {/* Advanced Features Banner */}
          <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-800/80 to-pink-600/80 z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=1200&h=200&fit=crop" 
              alt="Advanced Features" 
              className="w-full h-40 object-cover"
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <h2 className="text-3xl font-bold text-white">Advanced Features</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6 border border-green-200 hover:shadow-xl transition">
                <div className="text-4xl mb-4">🔐</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Role-Based Access Control</h3>
                <p className="text-gray-600 text-sm">Super Admin, Clinic Admin, Branch Admin, Doctor, Nurse, Receptionist - granular permissions</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-6 border border-purple-200 hover:shadow-xl transition">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">WhatsApp Reminders</h3>
                <p className="text-gray-600 text-sm">Automated appointment reminders via Twilio WhatsApp API</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-md p-6 border border-orange-200 hover:shadow-xl transition">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Reports & Analytics</h3>
                <p className="text-gray-600 text-sm">Daily, Monthly, Yearly & YTD reports with exportable data</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border border-blue-200 hover:shadow-xl transition">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Secure Authentication</h3>
                <p className="text-gray-600 text-sm">JWT-based auth with role-specific dashboards & session management</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-md p-6 border border-red-200 hover:shadow-xl transition">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Audit Logs</h3>
                <p className="text-gray-600 text-sm">Track all system activities, user actions & compliance logging</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg shadow-md p-6 border border-indigo-200 hover:shadow-xl transition">
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">System Settings</h3>
                <p className="text-gray-600 text-sm">Configurable features, login policies & system preferences</p>
              </div>
          </div>

          {/* Technology Stack Banner */}
          <div className="relative rounded-xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-slate-800/80 z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=150&fit=crop" 
              alt="Technology" 
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Built with Modern Technology</h2>
                <div className="flex flex-wrap justify-center gap-4">
                  <span className="px-4 py-2 bg-blue-600 rounded-full text-sm font-semibold">Next.js 15</span>
                  <span className="px-4 py-2 bg-blue-600 rounded-full text-sm font-semibold">TypeScript</span>
                  <span className="px-4 py-2 bg-green-600 rounded-full text-sm font-semibold">Supabase</span>
                  <span className="px-4 py-2 bg-cyan-600 rounded-full text-sm font-semibold">Tailwind CSS</span>
                  <span className="px-4 py-2 bg-purple-600 rounded-full text-sm font-semibold">Twilio WhatsApp</span>
                  <span className="px-4 py-2 bg-yellow-600 rounded-full text-sm font-semibold">JWT Auth</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ...existing authenticated dashboard code...

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-600' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-600' },
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: number;
    icon: string;
    color: keyof typeof colorMap;
  }) => {
    const colors = colorMap[color];
    return (
      <div className={`${colors.bg} rounded-lg shadow-md p-6 border-l-4 ${colors.border} hover:shadow-lg transition`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className={`${colors.text} text-4xl font-bold mt-2`}>{value}</p>
          </div>
          <span className="text-5xl opacity-20">{icon}</span>
        </div>
      </div>
    );
  };

  const ModuleCard = ({
    href,
    icon,
    title,
    description,
    stats,
  }: {
    href: string;
    icon: string;
    title: string;
    description: string;
    stats: string;
  }) => (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition cursor-pointer border border-gray-100">
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4">{description}</p>
        <div className="flex items-center text-blue-600 font-semibold text-sm">
          {stats} <span className="ml-2">→</span>
        </div>
      </div>
    </Link>
  );

  const FeatureCard = ({
    icon,
    title,
    description,
  }: {
    icon: string;
    title: string;
    description: string;
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition border border-gray-100">
      <div className="text-5xl mb-4 inline-block">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h1 className="text-5xl font-bold mb-4">Welcome to MediCare</h1>
          <p className="text-xl text-blue-100">
            Comprehensive clinic management system for modern healthcare providers
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/patients"
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
            >
              Get Started
            </Link>
            <button className="px-6 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Stats Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        ) : (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Clinic Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Patients" value={stats.patients} icon="👥" color="blue" />
              <StatCard title="Appointments" value={stats.appointments} icon="📅" color="green" />
              <StatCard title="Staff Members" value={stats.staff} icon="👨‍⚕️" color="purple" />
              <StatCard title="Total Invoices" value={stats.invoices} icon="💳" color="orange" />
            </div>
          </div>
        )}

        {/* Quick Access Modules */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ModuleCard
              href="/patients"
              icon="👥"
              title="Patient Management"
              description="Manage patient records, insurance details, and emergency contacts"
              stats="Manage patients"
            />

            <ModuleCard
              href="/appointments"
              icon="📅"
              title="Appointment Scheduling"
              description="Schedule appointments with automatic conflict prevention"
              stats="Schedule appointments"
            />

            <ModuleCard
              href="/staff"
              icon="👨‍⚕️"
              title="Staff Directory"
              description="Manage doctors, nurses, and staff with specializations"
              stats="Manage staff"
            />

            <ModuleCard
              href="/prescriptions"
              icon="💊"
              title="Prescriptions"
              description="Issue and track patient medications and treatments"
              stats="Manage prescriptions"
            />

            <ModuleCard
              href="/invoicing"
              icon="💳"
              title="Billing & Invoicing"
              description="Generate invoices and track patient payments"
              stats="Manage invoices"
            />

            <ModuleCard
              href="/"
              icon="⚙️"
              title="System Settings"
              description="Configure clinic information and system preferences"
              stats="Settings"
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="py-12 border-t-2 border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Choose MediCare?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard icon="🔒" title="Secure & Compliant" description="HIPAA-compliant with encrypted patient data" />
            <FeatureCard
              icon="⚡"
              title="Lightning Fast"
              description="Real-time updates and instant data synchronization"
            />
            <FeatureCard icon="📱" title="Mobile Ready" description="Responsive design works on all devices" />
            <FeatureCard
              icon="🔄"
              title="Smart Scheduling"
              description="Automatic conflict prevention for doctors"
            />
            <FeatureCard icon="📊" title="Real Analytics" description="Live dashboard with instant statistics" />
            <FeatureCard icon="👥" title="Multi-Role Access" description="Role-based access control for all staff" />
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Streamline Your Clinic?</h2>
          <p className="text-lg text-blue-100 mb-8">Start managing your clinic more efficiently today</p>
          <Link
            href="/patients"
            className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition"
          >
            Launch Dashboard
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Compliance
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 MediCare. All rights reserved. Built for healthcare professionals.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
