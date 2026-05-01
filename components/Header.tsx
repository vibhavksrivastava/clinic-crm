
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserName(
            user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.name || user.email || ''
          );
          const role = typeof user.role === 'object' ? user.role?.roleType : user.role;
          setUserRole(role || '');
        } catch (e) {
          setUserName('');
          setUserRole('');
        }
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 font-bold text-lg">
            🏥
          </div>
          <div>
            <h1 className="text-2xl font-bold">MediCare</h1>
            <p className="text-xs text-blue-100">Clinic Management System</p>
          </div>
        </Link>
        <nav className="hidden md:flex gap-6 items-center">
          <Link href="/dashboard" className="hover:text-blue-200 transition">Dashboard</Link>
          <Link href="/patients" className="hover:text-blue-200 transition">Patients</Link>
          <Link href="/appointments" className="hover:text-blue-200 transition">Appointments</Link>
          <Link href="/prescriptions" className="hover:text-blue-200 transition">Prescriptions</Link>
          <Link href="/invoicing" className="hover:text-blue-200 transition">Invoicing</Link>
        </nav>
        <div className="flex items-center gap-4">
          {userName && userRole ? (
            <span className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold">
              {userName} <span className="text-xs text-blue-400 font-normal">({userRole.replace(/_/g, ' ')})</span>
            </span>
          ) : null}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
