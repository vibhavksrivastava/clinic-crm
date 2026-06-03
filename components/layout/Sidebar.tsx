'use client';

import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';

import { menuByRole }
from '@/lib/auth/menu';
type Role = keyof typeof menuByRole;


export default function Sidebar() {
  const { userContext: user, loading } =
    useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const role = (user as unknown as { role: Role }).role;
  const menus = menuByRole[role] || [];

  return (
    <aside className="w-64 h-screen bg-white border-r p-4">
      <h2 className="text-xl font-bold mb-6">
        Clinic CRM
      </h2>

      <nav className="space-y-2">
        {menus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            className="block px-4 py-2 rounded hover:bg-gray-100"
          >
            {menu.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}