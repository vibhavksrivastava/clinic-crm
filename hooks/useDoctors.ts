'use client';

import { useEffect, useState } from 'react';
import { UserContext } from './useAuth';

export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialization?: string;
}

export function useDoctors(userContext: UserContext | null) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!userContext?.organizationId) return;

      try {
        const res = await fetch(
          `/api/staff?role=doctor&organizationId=${userContext.organizationId}`
        );

        const data = await res.json();
        setDoctors(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching doctors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [userContext]);

  return { doctors, loading };
}