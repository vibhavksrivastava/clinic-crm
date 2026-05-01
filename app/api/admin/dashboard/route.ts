import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getUserContext, isSuperAdmin, unauthorizedResponse } from '@/lib/db/access-control';

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics (super admin sees all, others see only their organization)
 */
export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext(request);
    if (!userContext) {
      return unauthorizedResponse();
    }

    // Build query filters based on role
    const isSuperAdminUser = isSuperAdmin(userContext);
    const userOrgId = userContext.organizationId;

    // Get statistics
    const orgsQuery = isSuperAdminUser
      ? supabase.from('organizations').select('id', { count: 'exact', head: true })
      : supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('id', userOrgId);

    const branchesQuery = isSuperAdminUser
      ? supabase.from('branches').select('id', { count: 'exact', head: true })
      : supabase.from('branches').select('id', { count: 'exact', head: true }).eq('organization_id', userOrgId);

    const usersQuery = isSuperAdminUser
      ? supabase.from('users').select('id', { count: 'exact', head: true })
      : supabase.from('users').select('id', { count: 'exact', head: true }).eq('organization_id', userOrgId);

    const patientsQuery = isSuperAdminUser
      ? supabase.from('patients').select('id', { count: 'exact', head: true })
      : supabase.from('patients').select('id', { count: 'exact', head: true }).eq('organization_id', userOrgId);

    const appointmentsQuery = isSuperAdminUser
      ? supabase.from('appointments').select('id', { count: 'exact', head: true })
      : supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('organization_id', userOrgId);

    const [orgsRes, branchesRes, usersRes, patientsRes, appointmentsRes] = await Promise.all([
      orgsQuery,
      branchesQuery,
      usersQuery,
      patientsQuery,
      appointmentsQuery,
    ]);

    // Get organizations with counts
    let organizationsQuery = supabase.from('organizations').select('*').order('created_at', { ascending: false }).limit(10);

    if (!isSuperAdminUser) {
      organizationsQuery = organizationsQuery.eq('id', userOrgId);
    }

    const { data: organizations } = await organizationsQuery;

    // Count branches and users per organization
    let orgsWithCounts = organizations || [];
    for (let org of orgsWithCounts) {
      const [{ count: branchCount }, { count: userCount }] = await Promise.all([
        supabase
          .from('branches')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
      ]);
      org.branches_count = branchCount || 0;
      org.users_count = userCount || 0;
    }

    return NextResponse.json({
      stats: {
        totalOrganizations: orgsRes.count || 0,
        totalBranches: branchesRes.count || 0,
        totalUsers: usersRes.count || 0,
        activeUsers: usersRes.count || 0,
        totalPatients: patientsRes.count || 0,
        totalAppointments: appointmentsRes.count || 0,
      },
      organizations: orgsWithCounts,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
