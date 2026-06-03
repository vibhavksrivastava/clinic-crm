import { UserRole } from './types';

export const menuByRole: Record<
  UserRole,
  { label: string; href: string }[]
> = {
  admin: [
    { label: 'Dashboard', href: '/admin' },
  ],
  doctor: [
    { label: 'Dashboard', href: '/doctor/dashboard' },
  ],
  patient: [
    { label: 'Dashboard', href: '/patient/dashboard' },
  ],
  receptionist: [
    { label: 'Patients', href: '/patients' },
  ],
  pharmacist: [
    { label: 'Pharmacy', href: '/pharmacy' },
  ],
};
