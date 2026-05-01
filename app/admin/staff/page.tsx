'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  user_status: string;
  role_type: string;
  organization_name: string;
  branch_name: string;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
  role_type: string;
}

interface Organization {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    organization_id: '',
    branch_id: '',
    role_id: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, rolesRes, orgsRes, branchRes] = await Promise.all([
        fetch('/api/admin/staff', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }),
        fetch('/api/admin/roles', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }),
        fetch('/api/admin/organizations', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }),
        fetch('/api/admin/branches', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }),
      ]);

      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaffList(data.staff);
      }
      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setRoles(data.roles);
      }
      if (orgsRes.ok) {
        const data = await orgsRes.json();
        setOrganizations(data.organizations);
      }
      if (branchRes.ok) {
        const data = await branchRes.json();
        setBranches(data.branches);
      }
    } catch (err) {
      setError('Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('❌ Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('✅ Staff member created successfully!');
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          organization_id: '',
          branch_id: '',
          role_id: '',
          password: '',
          confirmPassword: '',
        });
        setShowForm(false);
        fetchData();
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
    if (!confirm('Delete this staff member?')) return;

    try {
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });

      if (response.ok) {
        alert('✅ Staff deleted!');
        fetchData();
      } else {
        alert('❌ Failed to delete');
      }
    } catch (err) {
      alert(`❌ Error: ${(err as Error).message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600 mt-2">Manage doctors, nurses, receptionists, and other staff</p>
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
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add Staff Member</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Clinic *</label>
                  <select
                    required
                    value={formData.organization_id}
                    onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Select clinic</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Select branch (optional)</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <select
                    required
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Staff'}
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

        {/* Staff List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">All Staff</h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                + Add Staff
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : staffList.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">No staff members yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Clinic</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Branch</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {staff.first_name} {staff.last_name}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{staff.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs">
                          {staff.role_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{staff.organization_name}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{staff.branch_name || '-'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs ${
                            staff.user_status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {staff.user_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(staff.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Delete
                        </button>
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
