// Database utilities for multi-tenant operations
import { supabase } from './client';
import { User, Organization, Branch, Role, Permission } from '@/lib/types';

// =====================================================
// ORGANIZATION UTILITIES
// =====================================================

export async function getOrganization(orgId: string): Promise<Organization | null> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (error) throw error;
    if (!data) return null;
    // Map logo_url to logoUrl
    return {
      ...data,
      logoUrl: data.logo_url || undefined,
    };
  } catch (error) {
    console.error('Error fetching organization:', error);
    return null;
  }
}

export async function createOrganization(data: any): Promise<Organization | null> {
  try {
    const { data: org, error } = await supabase
      .from('organizations')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    if (!org) return null;
    // Map logo_url to logoUrl
    return {
      ...org,
      logoUrl: org.logo_url || undefined,
    };
  } catch (error) {
    console.error('Error creating organization:', error);
    return null;
  }
}

// =====================================================
// BRANCH UTILITIES
// =====================================================

export async function getBranchesByOrganization(orgId: string): Promise<Branch[]> {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching branches:', error);
    return [];
  }
}

export async function getBranch(branchId: string): Promise<Branch | null> {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', branchId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching branch:', error);
    return null;
  }
}

export async function createBranch(data: any): Promise<Branch | null> {
  try {
    const { data: branch, error } = await supabase
      .from('branches')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return branch;
  } catch (error) {
    console.error('Error creating branch:', error);
    return null;
  }
}

// =====================================================
// USER UTILITIES
// =====================================================

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

export async function getUsersByOrganization(orgId: string, branchId?: string): Promise<User[]> {
  try {
    let query = supabase
      .from('users')
      .select('*')
      .eq('organization_id', orgId);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function getUsersByRole(orgId: string, roleId: string, branchId?: string): Promise<User[]> {
  try {
    let query = supabase
      .from('users')
      .select('*')
      .eq('organization_id', orgId)
      .eq('role_id', roleId);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users by role:', error);
    return [];
  }
}

export async function createUser(data: any): Promise<User | null> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

export async function updateUser(userId: string, data: any): Promise<User | null> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

// =====================================================
// ROLE UTILITIES
// =====================================================

export async function getRoleById(roleId: string): Promise<Role | null> {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching role:', error);
    return null;
  }
}

export async function getRoleByType(orgId: string, roleType: string): Promise<Role | null> {
  try {
    let query = supabase
      .from('roles')
      .select('*')
      .eq('role_type', roleType);

    // For system roles, don't filter by organization
    if (roleType !== 'super_admin') {
      query = query.eq('organization_id', orgId);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching role by type:', error);
    return null;
  }
}

export async function getRolesByOrganization(orgId: string): Promise<Role[]> {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('organization_id', orgId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
}

export async function createRole(data: any): Promise<Role | null> {
  try {
    const { data: role, error } = await supabase
      .from('roles')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return role;
  } catch (error) {
    console.error('Error creating role:', error);
    return null;
  }
}

// =====================================================
// PERMISSION CHECKING UTILITIES
// =====================================================

export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  try {
    const user = await getUserById(userId);
    if (!user || !user.roleId) return false;

    const role = await getRoleById(user.roleId);
    if (!role) return false;

    return role.permissions.includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

export async function hasRole(userId: string, roleType: string): Promise<boolean> {
  try {
    const user = await getUserById(userId);
    if (!user || !user.roleId) return false;

    const role = await getRoleById(user.roleId);
    if (!role) return false;

    return role.roleType === roleType;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
}

// =====================================================
// AUDIT LOG UTILITIES
// =====================================================

export async function createAuditLog(data: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert(data);

    if (error) throw error;
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

export async function getAuditLogs(orgId: string, limit: number = 100): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

// =====================================================
// MULTI-TENANT QUERY HELPERS
// =====================================================

/**
 * Ensures a query is scoped to the organization
 * This should be used for all patient data queries to ensure multi-tenant isolation
 */
export function withOrganizationFilter(orgId: string, branchId?: string) {
  return {
    organization_id: orgId,
    ...(branchId && { branch_id: branchId }),
  };
}

/**
 * Helper to fetch patients for an organization/branch
 */
export async function getPatientsByOrganization(
  orgId: string,
  branchId?: string
): Promise<any[]> {
  try {
    let query = supabase
      .from('patients')
      .select('*')
      .eq('organization_id', orgId);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching patients:', error);
    return [];
  }
}

/**
 * Helper to fetch doctors for an organization/branch
 */
export async function getDoctorsByOrganization(
  orgId: string,
  branchId?: string
): Promise<User[]> {
  try {
    return await getUsersByRole(orgId, '', branchId); // This would need roleId lookup
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
}

/**
 * Helper to fetch staff for an organization/branch
 */
export async function getStaffByOrganization(
  orgId: string,
  branchId?: string
): Promise<User[]> {
  try {
    return await getUsersByOrganization(orgId, branchId);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return [];
  }
}
