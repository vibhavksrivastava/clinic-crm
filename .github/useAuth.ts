'use client';

import {
  useEffect,
  useState,
} from 'react';

export function useAuth() {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(
          '/api/auth/me'
        );

        const data =
          await response.json();

        if (data.authenticated) {
          setUser(data.user);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return {
    user,
    loading,
  };
}