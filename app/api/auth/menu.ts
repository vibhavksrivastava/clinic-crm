export type MenuItem = {
  label: string;
  href: string;
};

export const menuByRole: {
  [key: string]: MenuItem[];
} = {
  admin: [
    {
      label: 'Dashboard',
      href: '/admin',
    },
    {
      label: 'Patients',
      href: '/patients',
    },
    {
      label: 'Appointments',
      href: '/appointments',
    },
  ],

  doctor: [
    {
      label: 'Appointments',
      href: '/appointments',
    },
    {
      label: 'Prescriptions',
      href: '/prescriptions',
    },
  ],

  patient: [
    {
      label: 'Dashboard',
      href:
        '/patient/dashboard',
    },
    {
      label: 'Prescriptions',
      href:
        '/patient/prescriptions',
    },
  ],
};