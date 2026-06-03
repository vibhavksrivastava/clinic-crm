'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface UserContext {
  userId: string;
  email?: string;
  roleType: string;
  organizationId?: string;
  branchId?: string;
  permissions?: string[];
}

export function useAuth() {
  const router = useRouter();

  const [userContext, setUserContext] =
    useState<UserContext | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch(
          '/api/auth/me',
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (!response.ok) {
          setUserContext(null);
          router.push('/login');
          return;
        }

        const data = await response.json();

        console.log(
          'AUTH /me response:',
          data
        );

        const user =
          data.userContext ||
          data.user ||
          data;

        if (!user) {
          router.push('/login');
          return;
        }

        setUserContext({
          userId:
            user.userId ||
            user.id,
          email: user.email,
          roleType:
            user.roleType ||
            user.role ||
            'user',
          organizationId:
            user.organizationId,
          branchId:
            user.branchId,
          permissions:
            user.permissions || [],
        });
      } catch (err) {
        console.error(
          'Auth load error:',
          err
        );
        setUserContext(null);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  return {
    userContext,
    loading,
    authenticated:
      !!userContext,
  };
}