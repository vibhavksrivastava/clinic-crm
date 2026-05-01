import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { hashPassword } from '@/lib/auth';
import { getUserContext, isSuperAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/db/access-control';

/**
 * GET /api/admin/staff
 * List staff members filtered by user's organization/branch
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
      .from('users')
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        phone,
        user_status,
        created_at,
        role_id,
        organization_id,
        branch_id,
        roles:role_id(role_type, name),
        organizations:organization_id(name),
        branches:branch_id(name)
      `
      )
      .eq('organization_id', filterOrgId);

    const { data: staff, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const result = (staff || []).map((user: any) => ({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      user_status: user.user_status,
      created_at: user.created_at,
      role_type: user.roles?.role_type || 'unknown',
      role_name: user.roles?.name || 'Unknown Role',
      organization_name: user.organizations?.name || 'Unknown',
      branch_name: user.branches?.name || 'N/A',
    }));

    return NextResponse.json({ staff: result });
  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

/**
 * POST /api/admin/staff
 * Create a new staff member (only for user's own organization)
 */
export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext(request);
    if (!userContext) {
      return unauthorizedResponse();
    }

    const { first_name, last_name, email, phone, organization_id, branch_id, role_id, password } = await request.json();

    if (!first_name || !last_name || !email || !password || !organization_id || !role_id) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    // Check if user has access to this organization
    if (!isSuperAdmin(userContext) && organization_id !== userContext.organizationId) {
      return forbiddenResponse('You can only add staff to your own organization');
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        first_name,
        last_name,
        email,
        phone,
        password_hash: passwordHash,
        organization_id,
        branch_id: branch_id || null,
        role_id,
        user_status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    let errorMsg = 'Failed to create staff member';
    console.error('Create staff error:', error);
    if (error?.message) {
      console.error('Error message:', error.message);
      errorMsg = error.message;
    }
    if (error?.code) {
      console.error('Error code:', error.code);
      errorMsg = `${error.code}: ${error.message || errorMsg}`;
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/staff/[id]
 * Delete a staff member (only from user's own organization)
 * NOTE: This endpoint is deprecated. Use DELETE /api/admin/staff/[id] instead.
 */
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Use DELETE /api/admin/staff/[id] instead' },
    { status: 404 }
  );
}
