'use client';

import { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  subscription_plan: 'free' | 'basic' | 'professional' | 'enterprise';
  created_at: string;
  branches_count?: number;
  users_count?: number;
}

function OrganizationsPageContent() {
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const [userRole, setUserRole] = useState<string>('');

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(action === 'create');

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

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    subscription_plan: 'free' as const,
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/organizations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations);
      } else if (response.status === 401) {
        window.location.href = '/login';
      } else {
        setError('Failed to load organizations');
      }
    } catch (err) {
      setError('Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('✅ Clinic created successfully!');
        setFormData({ name: '', email: '', phone: '', address: '', city: '', country: '', subscription_plan: 'free' });
        setShowForm(false);
        fetchOrganizations();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      alert(`❌ Error: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this clinic? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/organizations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });

      if (response.ok) {
        alert('✅ Clinic deleted successfully!');
        fetchOrganizations();
      } else {
        alert('❌ Failed to delete clinic');
      }
    } catch (err) {
      alert(`❌ Error: ${(err as Error).message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clinic Management</h1>
            <p className="text-gray-600 mt-2">Create and manage clinic organizations</p>
          </div>
          <Link href={getDashboardUrl()} className="text-blue-600 hover:text-blue-900">
            ← Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">❌ {error}</p>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Clinic</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Clinic Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="e.g., City Medical Center"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="clinic@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Plan</label>
                  <select
                    value={formData.subscription_plan}
                    onChange={(e) =>
                      setFormData({ ...formData, subscription_plan: e.target.value as any })
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="USA"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Clinic'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Clinics List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">All Clinics</h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                + New Clinic
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : organizations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">No clinics created yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Plan</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Branches</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Staff</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{org.name}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{org.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
                          {org.subscription_plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{org.branches_count || 0}</td>
                      <td className="px-6 py-4 text-gray-600">{org.users_count || 0}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/organizations/${org.id}`}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDelete(org.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
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

export default function OrganizationsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <OrganizationsPageContent />
    </Suspense>
  );
}
