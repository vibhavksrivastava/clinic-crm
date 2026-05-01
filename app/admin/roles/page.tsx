'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

interface Role {
  id: string;
  name: string;
  description: string;
  role_type: string;
  organization_id: string | null;
  is_system_role: boolean;
  permissions: string[];
}

interface Organization {
  id: string;
  name: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [userRole, setUserRole] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    organization_id: '',
    permissions: [] as string[],
  });

  const availablePermissions = [
    'manage_organizations',
    'manage_branches',
    'manage_staff',
    'manage_roles',
    'manage_settings',
    'view_audit_logs',
    'manage_users',
    'manage_patients',
    'manage_appointments',
    'manage_prescriptions',
    'manage_pharmacy',
    'manage_invoices',
    'manage_whatsapp',
    'system_config',
    'view_reports',
    'manage_subscriptions',
  ];

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      const role = typeof user.role === 'object' ? user.role?.roleType : user.role;
      setUserRole(role || '');
    }
    fetchData();
  }, []);

  // Get dashboard URL based on role
  const getDashboardUrl = () => {
    return userRole === 'super_admin' ? '/admin' : '/dashboard';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, orgsRes] = await Promise.all([
        fetch('/api/admin/roles', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }),
        fetch('/api/admin/organizations', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }),
      ]);

      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setRoles(data.roles || []);
      } else {
        setError('Failed to fetch roles');
      }

      if (orgsRes.ok) {
        const data = await orgsRes.json();
        setOrganizations(data.organizations || []);
      }
    } catch (err) {
      setError('Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      organization_id: '',
      permissions: [],
    });
    setShowForm(true);
  };

  const handleEditRole = (role: Role) => {
    if (role.is_system_role) {
      alert('❌ System roles cannot be edited');
      return;
    }
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      organization_id: role.organization_id || '',
      permissions: role.permissions || [],
    });
    setShowForm(true);
  };

  const handlePermissionChange = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.organization_id) {
      alert('❌ Name and organization are required');
      return;
    }

    setSubmitting(true);

    try {
      if (editingRole) {
        // Update existing role
        const response = await fetch('/api/admin/roles', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            id: editingRole.id,
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions,
          }),
        });

        if (response.ok) {
          alert('✅ Role updated successfully!');
          setShowForm(false);
          fetchData();
        } else {
          const data = await response.json();
          alert(`❌ Error: ${data.error}`);
        }
      } else {
        // Create new role
        const response = await fetch('/api/admin/roles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          alert('✅ Role created successfully!');
          setFormData({
            name: '',
            description: '',
            organization_id: '',
            permissions: [],
          });
          setShowForm(false);
          fetchData();
        } else {
          const data = await response.json();
          alert(`❌ Error: ${data.error}`);
        }
      }
    } catch (err) {
      alert(`❌ Error: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (role?.is_system_role) {
      alert('❌ System roles cannot be deleted');
      return;
    }

    if (!confirm('Delete this role?')) return;

    try {
      const response = await fetch(`/api/admin/roles?id=${roleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });

      if (response.ok) {
        alert('✅ Role deleted!');
        fetchData();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      alert(`❌ Error: ${(err as Error).message}`);
    }
  };

  // Only super_admin can access this page
  if (userRole !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-6xl mx-auto py-8 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700 font-semibold">
              ❌ Access Denied: Only super admin can manage roles
            </p>
          </div>
          <div className="mt-4">
            <Link href={getDashboardUrl()} className="text-blue-600 hover:text-blue-900">
              ← Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
            <p className="text-gray-600 mt-2">Create and manage custom roles for clinics</p>
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

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading roles...</p>
          </div>
        ) : (
          <>
            {/* Create Form */}
            {showForm && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="e.g., Senior Doctor"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization *
                      </label>
                      <select
                        required
                        value={formData.organization_id}
                        onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        disabled={!!editingRole}
                      >
                        <option value="">Select organization</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Role description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Permissions
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availablePermissions.map((permission) => (
                        <label key={permission} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission)}
                            onChange={() => handlePermissionChange(permission)}
                            className="rounded border-gray-300 mr-2"
                          />
                          <span className="text-sm text-gray-700">{permission}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {submitting
                        ? 'Processing...'
                        : editingRole
                        ? 'Update Role'
                        : 'Create Role'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="bg-gray-300 text-gray-900 px-6 py-2 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Add Button */}
            {!showForm && (
              <button
                onClick={handleAddRole}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 mb-6"
              >
                + Create New Role
              </button>
            )}

            {/* Roles List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {role.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {role.organization_id
                          ? organizations.find((o) => o.id === role.organization_id)?.name ||
                            'Unknown'
                          : 'System'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            role.is_system_role
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {role.is_system_role ? 'System' : 'Custom'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {role.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {role.permissions?.length || 0} permissions
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        {!role.is_system_role ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleEditRole(role)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(role.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">System</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
