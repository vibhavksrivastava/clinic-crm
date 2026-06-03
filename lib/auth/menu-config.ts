import {
  LayoutDashboard,
  Users,
  Calendar,
  Pill,
  Receipt,
  Shield,
} from 'lucide-react';

export const MENU_ITEMS = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permissions: [],
  },

  {
    title: 'Patients',
    href: '/patients',
    icon: Users,
    permissions: ['manage_patients'],
  },

  {
    title: 'Appointments',
    href: '/appointments',
    icon: Calendar,
    permissions: [
      'manage_appointments',
    ],
  },

  {
    title: 'Pharmacy',
    href: '/pharmacy',
    icon: Pill,
    permissions: [
      'manage_pharmacy',
    ],
  },

  {
    title: 'Billing',
    href: '/invoices',
    icon: Receipt,
    permissions: [
      'manage_billing',
    ],
  },

  {
    title: 'Access Control',
    href: '/admin/access',
    icon: Shield,
    permissions: [
      'manage_roles',
    ],
  },
];