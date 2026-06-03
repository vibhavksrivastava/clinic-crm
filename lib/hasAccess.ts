import { ROLE_PERMISSIONS } from './rbac';

export function hasAccess(
  role: string,
  pathname: string
) {
  const permissions = ROLE_PERMISSIONS[role] || [];

  if (permissions.includes('*')) {
    return true;
  }

  return permissions.some((route) =>
    pathname.startsWith(route)
  );
}