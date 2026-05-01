'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  organization_id: string;
  organization_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: any;
  ip_address: string;
  created_at: string;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalLogs, setTotalLogs] = useState(0);
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

  // Filters
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;

  const actions = [
    'create_organization',
    'update_organization',
    'delete_organization',
    'create_branch',
    'update_branch',
    'delete_branch',
    'create_user',
    'update_user',
    'delete_user',
    'create_role',
    'update_role',
    'delete_role',
    'user_login',
    'user_logout',
  ];

  const entityTypes = ['organizations', 'branches', 'users', 'roles', 'patients', 'appointments', 'prescriptions'];

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchLogs();
  }, [router, page, action, entityType]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      let url = `/api/admin/audit-logs?limit=${limit}&offset=${offset}`;
      if (action) url += `&action=${action}`;
      if (entityType) url += `&entityType=${entityType}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotalLogs(data.total || 0);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to fetch audit logs');
      }
    } catch (err) {
      setError('Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatChanges = (changes: any) => {
    if (!changes) return '-';
    if (typeof changes === 'string') return changes;
    return JSON.stringify(changes, null, 2);
  };

  const totalPages = Math.ceil(totalLogs / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600 mt-2">Track all system activities and changes</p>
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
              <select
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Actions</option>
                {actions.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
              <select
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Types</option>
                {entityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setAction('');
                  setEntityType('');
                  setPage(1);
                }}
                className="w-full bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No audit logs found</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Date/Time
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Entity Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-gray-900 font-medium">{log.user_name}</div>
                        <div className="text-gray-500 text-xs">{log.user_email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.organization_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.entity_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono text-xs">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {logs.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
                {Math.min(page * limit, totalLogs)} of {totalLogs} logs
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 rounded ${
                          pageNum === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
