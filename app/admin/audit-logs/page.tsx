'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  organization_name: string;
  action: string;
  entity_type: string;
  ip_address: string;
  created_at: string;
}

export default function AuditLogsPage() {
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

const userRole = (() => {
  if (typeof window === 'undefined') return '';

  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return '';

    const user = JSON.parse(userStr);

    return typeof user.role === 'object'
      ? user.role?.roleType || ''
      : user.role || '';
  } catch {
    return '';
  }
})();
  const [page, setPage] = useState(1);
  const limit = 50;

  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');

  /**
   * AUTH + ROLE CHECK
   */

  /**
   * FETCH LOGS
   */
  const fetchLogs = async () => {
    try {
      setLoading(true);

      let url = `/api/admin/audit-logs?limit=${limit}&page=${page}`;

      if (action) url += `&action=${action}`;
      if (entityType) url += `&entityType=${entityType}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, action, entityType]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto p-6">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-gray-500">
              Role: {userRole || 'Unknown'}
            </p>
          </div>

          <Link
            href="/admin"
            className="text-blue-600 hover:underline"
          >
            ← Back
          </Link>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* FILTERS */}
        <div className="bg-white p-4 rounded shadow mb-4 grid grid-cols-3 gap-4">
          <select
            value={action}
            onChange={(e) => {
              setPage(1);
              setAction(e.target.value);
            }}
            className="border p-2 rounded"
          >
            <option value="">All Actions</option>
            <option value="create_user">Create User</option>
            <option value="update_user">Update User</option>
            <option value="delete_user">Delete User</option>
            <option value="user_login">Login</option>
          </select>

          <select
            value={entityType}
            onChange={(e) => {
              setPage(1);
              setEntityType(e.target.value);
            }}
            className="border p-2 rounded"
          >
            <option value="">All Entities</option>
            <option value="users">Users</option>
            <option value="appointments">Appointments</option>
            <option value="patients">Patients</option>
          </select>

          <button
            onClick={() => {
              setAction('');
              setEntityType('');
              setPage(1);
            }}
            className="bg-gray-200 rounded p-2"
          >
            Clear
          </button>
        </div>

        {/* TABLE */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">User</th>
                  <th className="p-3 text-left">Action</th>
                  <th className="p-3 text-left">Entity</th>
                  <th className="p-3 text-left">IP</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="p-3 text-sm">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="p-3">
                      <div className="font-medium">
                        {log.user_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.user_email}
                      </div>
                    </td>
                    <td className="p-3">{log.action}</td>
                    <td className="p-3">{log.entity_type}</td>
                    <td className="p-3 text-xs">
                      {log.ip_address || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}