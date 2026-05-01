import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getUserContext, isSuperAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/db/access-control';

/**
 * GET /api/admin/branches
 * List branches (super admin sees all, others see only their organization's branches)
 */
export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext(request);
    if (!userContext) {
      return unauthorizedResponse();
    }

    // Get organization filter from query params if provided
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org');

    // If orgId is provided, check if user has access to it
    if (orgId && !isSuperAdmin(userContext) && orgId !== userContext.organizationId) {
      return forbiddenResponse('You do not have access to this organization');
    }

    // Determine which organization to query
    const filterOrgId = orgId && isSuperAdmin(userContext) ? orgId : userContext.organizationId;

    let query = supabase
      .from('branches')
      .select(
        `
        *,
        organizations:organization_id(name)
      `
      )
      .eq('organization_id', filterOrgId);

    const { data: branches, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Map organization names and count users
    let result = (branches || []).map((branch: any) => ({
      ...branch,
      org_name: branch.organizations?.name || 'Unknown',
    }));

    for (let branch of result) {
      const { count: userCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branch.id);
      branch.users_count = userCount || 0;
    }

    return NextResponse.json({ branches: result });
  } catch (error) {
    console.error('Get branches error:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}

/**
 * POST /api/admin/branches
 * Create a new branch
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-token') || request.headers.get('authorization')?.slice(7);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, organization_id, address, city, country, phone, email } = await request.json();

    if (!name || !organization_id) {
      return NextResponse.json(
        { error: 'Branch name and organization are required' },
        { status: 400 }
      );
    }

    const { data: branch, error } = await supabase
      .from('branches')
      .insert({
        name,
        organization_id,
        address,
        city,
        country,
        phone,
        email,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    console.error('Create branch error:', error);
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
  }
}
