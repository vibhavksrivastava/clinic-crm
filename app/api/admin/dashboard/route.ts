import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import {
  getUserContext,
  isSuperAdmin,
  unauthorizedResponse,
} from '@/lib/db/access-control';


type OrganizationRow = {
  id: string;
  name?: string;
  created_at?: string;
};

export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext(request);

    if (!userContext) {
  return unauthorizedResponse();
}

if (
  ![
    'super_admin',
    'clinic_admin',
    'branch_admin',
  ].includes(userContext.roleType)
) {
  return NextResponse.json(
    {
      error: 'Access denied',
    },
    { status: 403 }
  );
}
 
    const isSuperAdminUser = isSuperAdmin(userContext);
    const orgId = userContext.organizationId;

    // Base filter
    const orgFilter = isSuperAdminUser
      ? {}
      : { organization_id: orgId };

    // -----------------------------
    // Dashboard stats
    // -----------------------------
    const [
      orgsRes,
      branchesRes,
      usersRes,
      patientsRes,
      appointmentsRes,
    ] = await Promise.all([
      isSuperAdminUser
        ? supabase
            .from('organizations')
            .select('*', {
              count: 'exact',
              head: true,
            })
        : supabase
            .from('organizations')
            .select('*', {
              count: 'exact',
              head: true,
            })
            .eq('id', orgId),

      supabase
        .from('branches')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .match(orgFilter),

      supabase
        .from('users')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .match(orgFilter),

      supabase
        .from('patients')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .match(orgFilter),

      supabase
        .from('appointments')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .match(orgFilter),
    ]);

    // -----------------------------
    // Organizations list
    // -----------------------------
    let organizationsQuery = supabase
      .from('organizations')
      .select('*')
      .order('created_at', {
        ascending: false,
      })
      .limit(10);

    if (!isSuperAdminUser) {
      organizationsQuery =
        organizationsQuery.eq(
          'id',
          orgId
        );
    }

    const {
      data: organizations,
      error: orgError,
    } = await organizationsQuery;

    if (orgError) {
      throw orgError;
    }

    // -----------------------------
    // Counts
    // -----------------------------
    const orgIds = (
      organizations || []
    ).map(
      (o: OrganizationRow) => o.id
    );

    let branchCounts: any[] = [];
    let userCounts: any[] = [];

    if (orgIds.length > 0) {
      const [
        branchesAgg,
        usersAgg,
      ] = await Promise.all([
        supabase
          .from('branches')
          .select('organization_id')
          .in(
            'organization_id',
            orgIds
          ),

        supabase
          .from('users')
          .select('organization_id')
          .in(
            'organization_id',
            orgIds
          ),
      ]);

      branchCounts =
        branchesAgg.data || [];
      userCounts =
        usersAgg.data || [];
    }

    const branchMap =
      new Map<string, number>();
    const userMap =
      new Map<string, number>();

    branchCounts.forEach(
      (b: any) => {
        branchMap.set(
          b.organization_id,
          (branchMap.get(
            b.organization_id
          ) || 0) + 1
        );
      }
    );

    userCounts.forEach(
      (u: any) => {
        userMap.set(
          u.organization_id,
          (userMap.get(
            u.organization_id
          ) || 0) + 1
        );
      }
    );

    const orgsWithCounts = (
      organizations || []
    ).map((org: any) => ({
      ...org,
      branches_count:
        branchMap.get(org.id) || 0,
      users_count:
        userMap.get(org.id) || 0,
    }));

    // -----------------------------
    // Response
    // -----------------------------
    return NextResponse.json({
      success: true,
      stats: {
        totalOrganizations:
          orgsRes.count || 0,
        totalBranches:
          branchesRes.count || 0,
        totalUsers:
          usersRes.count || 0,
        activeUsers:
          usersRes.count || 0,
        totalPatients:
          patientsRes.count || 0,
        totalAppointments:
          appointmentsRes.count || 0,
      },
      organizations:
        orgsWithCounts,
    });
  } catch (error) {
    console.error(
      'Dashboard error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          'Failed to fetch dashboard data',
      },
      { status: 500 }
    );
  }
}