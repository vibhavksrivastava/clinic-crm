
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/patients', label: 'Patients' },
    { href: '/appointments', label: 'Appointments' },
    { href: '/prescriptions', label: 'Prescriptions' },
    { href: '/invoicing', label: 'Invoicing' },
  ];

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        {/* Desktop & Mobile Header Row */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm sm:text-lg flex-shrink-0">
              🏥
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-bold">MediCare</h1>
              <p className="text-xs text-blue-100">Clinic Management System</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold">MediCare</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-4 items-center">
            {navLinks.map(link => (
              <Link 
                key={link.href}
                href={link.href} 
                className="text-sm hover:text-blue-200 transition"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* User Info - Desktop */}
            {userName && userRole ? (
              <div className="hidden sm:flex items-center gap-3">
                <span className="px-3 py-1 bg-white text-blue-600 rounded-lg font-semibold text-sm">
                  {userName} <span className="text-xs text-blue-400 font-normal">({userRole.replace(/_/g, ' ')})</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="hidden sm:block px-3 py-1 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition text-sm"
              >
                Logout
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-blue-700 rounded-lg transition"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 border-t border-blue-500 pt-4 space-y-2">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 hover:bg-blue-700 rounded-lg transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile User Info */}
            {userName && userRole && (
              <div className="px-4 py-3 bg-blue-700 rounded-lg mt-4">
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-xs text-blue-100">{userRole.replace(/_/g, ' ')}</p>
              </div>
            )}
            
            {/* Mobile Logout */}
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition text-sm"
            >
              Logout
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
