'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserContext {
  userId: string;
  roleType: string;
  organizationId?: string;
}

export default function WalkInsPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(userData);

      setUser({
        userId: parsed.id,
        roleType: parsed.role?.roleType,
        organizationId: parsed.organizationId,
      });
    } catch (err) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!user?.organizationId) return;

      const token = localStorage.getItem('authToken');

      const res = await fetch(
        `/api/staff?role=doctor&organizationId=${user.organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setDoctors(Array.isArray(data) ? data : []);
    };

    if (user?.organizationId) {
      fetchDoctors();
    }
  }, [user]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Walk-ins</h1>

      {doctors.length === 0 ? (
        <p>No doctors available</p>
      ) : (
        <ul className="space-y-2">
          {doctors.map((doc) => (
            <li key={doc.id} className="p-2 bg-white rounded shadow">
              Dr. {doc.first_name} {doc.last_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}