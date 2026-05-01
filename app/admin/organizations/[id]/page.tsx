'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  subscription_plan: string;
  created_at: string;
}

interface Branch {
  id: string;
  name: string;
  city: string;
  country: string;
  phone: string;
  email: string;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_type: string;
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const orgId = params.id as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [orgId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orgRes, branchRes, staffRes] = await Promise.all([
        fetch(`/api/admin/organizations/${orgId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }),
        fetch(`/api/admin/branches?org=${orgId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }),
        fetch(`/api/admin/staff?org=${orgId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }),
      ]);

      if (orgRes.ok) {
        const data = await orgRes.json();
        setOrganization(data.organization);
      }

      if (branchRes.ok) {
        const data = await branchRes.json();
        setBranches(data.branches || []);
      }

      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaff(data.staff || []);
      }
    } catch (err) {
      setError('Error loading organization details: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-6xl mx-auto py-8 px-4">
          <p className="text-gray-600">Loading...</p>
        </main>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-6xl mx-auto py-8 px-4">
          <p className="text-red-600">Organization not found</p>
          <Link href="/admin/organizations" className="text-blue-600 hover:underline">
            Back to Organizations
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto py-8 px-4">
        <Link href="/admin/organizations" className="text-blue-600 hover:text-blue-900 mb-4 inline-block">
          ← Back to Organizations
        </Link>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Organization Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
              <p className="text-gray-600 mt-2">{organization.address}</p>
              <p className="text-gray-600">
                {organization.city}, {organization.country}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Subscription Plan</p>
              <p className="text-2xl font-bold text-blue-600 capitalize">{organization.subscription_plan}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{organization.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium text-gray-900">{organization.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-medium text-gray-900">{new Date(organization.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Branches */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Branches ({branches.length})</h2>
          </div>
          {branches.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No branches created yet
              <br />
              <Link href="/admin/branches" className="text-blue-600 hover:underline">
                Create a branch
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Branch Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch) => (
                    <tr key={branch.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{branch.name}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {branch.city}, {branch.country}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{branch.email}</td>
                      <td className="px-6 py-4 text-gray-600">{branch.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Staff */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Staff Members ({staff.length})</h2>
          </div>
          {staff.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No staff members added yet
              <br />
              <Link href="/admin/staff" className="text-blue-600 hover:underline">
                Add staff
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {member.first_name} {member.last_name}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{member.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs">
                          {member.role_type}
                        </span>
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
