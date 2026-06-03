export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],

  admin: [
    '/dashboard',
    '/patients',
    '/appointments',
    '/prescriptions',
    '/billing',
    '/pharmacy',
    '/admin',
  ],

  doctor: [
    '/dashboard',
    '/patients',
    '/appointments',
    '/prescriptions',
  ],

  receptionist: [
    '/dashboard',
    '/patients',
    '/appointments',
    '/billing',
  ],

  pharmacist: [
    '/dashboard',
    '/pharmacy',
    '/pharmacy/sales',
    '/pharmacy/returns',
  ],
};