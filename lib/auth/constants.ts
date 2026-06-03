export const AUTH_COOKIE_NAME =
  'authToken';

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure:
    process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 24, // 1 day
};

export const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
];

export const ROLE_ROUTES: Record<
  string,
  string
> = {
  admin: '/admin',

  super_admin: '/admin',

  clinic_admin: '/admin',

  branch_admin: '/admin',

  doctor: '/appointments',

  receptionist:
    '/patients',

  pharmacist: '/pharmacy',

  patient: '/patient/dashboard',
};