'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

interface SystemSettings {
  system_name: string;
  support_email: string;
  support_phone: string;
  max_login_attempts: number;
  login_lockout_minutes: number;
  session_timeout_hours: number;
  enable_whatsapp: boolean;
  enable_pharmacy: boolean;
  enable_billing: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    system_name: 'Clinic CRM',
    support_email: 'support@clinicrm.com',
    support_phone: '+1-800-CLINIC',
    max_login_attempts: 5,
    login_lockout_minutes: 15,
    session_timeout_hours: 24,
    enable_whatsapp: true,
    enable_pharmacy: true,
    enable_billing: true,
  });
  const [userRole, setUserRole] = useState<string>('');

  // Get user role from localStorage on mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = typeof user.role === 'object' ? user.role?.roleType : user.role;
        setUserRole(role || '');
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  // Get dashboard URL based on role
  const getDashboardUrl = () => {
    return userRole === 'super_admin' ? '/admin' : '/dashboard';
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else if (response.status === 401) {
        window.location.href = '/login';
      } else {
        setError('Failed to load settings');
      }
    } catch (err) {
      setError('Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSuccess('✅ Settings saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setError(`❌ Error: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-6xl mx-auto py-8 px-4">
          <p className="text-gray-600">Loading settings...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-2">Configure system-wide settings and features</p>
          </div>
          <Link href={getDashboardUrl()} className="text-blue-600 hover:text-blue-900">
            ← Back to Dashboard
          </Link>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {/* General Settings */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">General Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">System Name</label>
                <input
                  type="text"
                  value={settings.system_name}
                  onChange={(e) => setSettings({ ...settings, system_name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                  <input
                    type="email"
                    value={settings.support_email}
                    onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Support Phone</label>
                  <input
                    type="tel"
                    value={settings.support_phone}
                    onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.max_login_attempts}
                  onChange={(e) =>
                    setSettings({ ...settings, max_login_attempts: parseInt(e.target.value) })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <p className="text-xs text-gray-600 mt-1">Number of failed attempts before lockout</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lockout Duration (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={settings.login_lockout_minutes}
                  onChange={(e) =>
                    setSettings({ ...settings, login_lockout_minutes: parseInt(e.target.value) })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <p className="text-xs text-gray-600 mt-1">How long to lock account after failed attempts</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (hours)</label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={settings.session_timeout_hours}
                  onChange={(e) =>
                    setSettings({ ...settings, session_timeout_hours: parseInt(e.target.value) })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <p className="text-xs text-gray-600 mt-1">Session expiration time</p>
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Features</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.enable_whatsapp}
                  onChange={(e) => setSettings({ ...settings, enable_whatsapp: e.target.checked })}
                  className="w-4 h-4 border-gray-300 rounded"
                />
                <span className="text-gray-700">
                  <p className="font-medium">Enable WhatsApp Integration</p>
                  <p className="text-xs text-gray-600">Allow appointment reminders and notifications via WhatsApp</p>
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.enable_pharmacy}
                  onChange={(e) => setSettings({ ...settings, enable_pharmacy: e.target.checked })}
                  className="w-4 h-4 border-gray-300 rounded"
                />
                <span className="text-gray-700">
                  <p className="font-medium">Enable Pharmacy Module</p>
                  <p className="text-xs text-gray-600">Allow clinics to manage medicines and inventory</p>
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.enable_billing}
                  onChange={(e) => setSettings({ ...settings, enable_billing: e.target.checked })}
                  className="w-4 h-4 border-gray-300 rounded"
                />
                <span className="text-gray-700">
                  <p className="font-medium">Enable Billing & Invoicing</p>
                  <p className="text-xs text-gray-600">Allow clinics to create and manage invoices</p>
                </span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="px-6 py-6 bg-gray-50 rounded-b-lg">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save Settings'}
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ System Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• System Version: 1.0.0</li>
            <li>• Database: PostgreSQL (Multi-tenant)</li>
            <li>• Authentication: JWT Tokens</li>
            <li>• API: RESTful</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
