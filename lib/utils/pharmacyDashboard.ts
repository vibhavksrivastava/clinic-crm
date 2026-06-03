/**
 * Determines the correct dashboard URL based on user role
 */
export function getPharmacyDashboardUrl(): string {
  if (typeof window === 'undefined') {
    return '/pharmacy';
  }

  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return '/pharmacy';

    const user = JSON.parse(userStr);
    const roleType = typeof user?.role === 'object' ? user?.role?.roleType : user?.role;

    // Admin roles go to admin dashboard
    if (
      roleType === 'admin' ||
      roleType === 'super_admin' ||
      roleType === 'clinic_admin' ||
      roleType === 'branch_admin'
    ) {
      return '/admin';
    }

    // All other roles (receptionist, doctor, etc.) go to user dashboard
    return '/pharmacy';
  } catch (error) {
    console.error('Error determining dashboard URL:', error);
    return '/pharmacy';
  }
}
