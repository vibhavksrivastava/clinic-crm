import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';

/**
 * POST /api/auth/setup
 * Create demo organization and user for first-time setup
 */
export async function POST(request: NextRequest) {
  try {
    const { setupKey } = await request.json();

    // Simple validation - in production use a proper secret
    if (setupKey !== 'clinic-crm-setup-2026') {
      return NextResponse.json(
        { error: 'Invalid setup key' },
        { status: 401 }
      );
    }

    // Check if demo organization already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', 'Demo Clinic')
      .single();

    let organization = existingOrg;

    // Create demo organization if it doesn't exist
    if (!organization) {
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: 'Demo Clinic',
          email: 'demo@clinic.com',
          phone: '(555) 000-0000',
          address: '123 Medical Street, Health City, HC 12345',
          city: 'Health City',
          website: 'https://democlinic.com',
          subscription_plan: 'free',
          subscription_status: 'active',
        })
        .select()
        .single();

      if (orgError || !newOrg) {
        console.error('Organization creation error:', orgError);
        return NextResponse.json(
          { error: 'Failed to create organization', details: orgError?.message },
          { status: 500 }
        );
      }

      organization = newOrg;
    }

    // Ensure organization exists
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found and could not be created' },
        { status: 500 }
      );
    }

    // Check if super_admin role exists for this organization
    const { data: existingRole } = await supabase
      .from('roles')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('role_type', 'super_admin')
      .single();

    let roleId = existingRole?.id;

    // Create super_admin role if it doesn't exist
    if (!roleId) {
      const { data: newRole, error: roleError } = await supabase
        .from('roles')
        .insert({
          name: 'Super Admin',
          description: 'Super administrator with full access',
          role_type: 'super_admin',
          permissions: [],
          is_system_role: true,
          organization_id: organization.id,
        })
        .select('id')
        .single();

      if (roleError || !newRole) {
        console.error('Role creation error:', roleError);
        return NextResponse.json(
          { error: 'Failed to create admin role', details: roleError?.message },
          { status: 500 }
        );
      }

      roleId = newRole.id;
    }

    // Check if demo user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@clinic.com')
      .single();

    if (existingUser) {
      return NextResponse.json(
        {
          success: true,
          message: 'Demo user already exists',
          organization: organization,
        },
        { status: 200 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword('demo123');

    // Create demo user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: 'admin@clinic.com',
        password_hash: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        user_status: 'active',
        organization_id: organization.id,
        role_id: roleId,
      })
      .select()
      .single();

    if (userError || !newUser) {
      console.error('User creation error:', userError);
      return NextResponse.json(
        { error: 'Failed to create demo user', details: userError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Demo user created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: `${newUser.first_name} ${newUser.last_name}`,
          role: newUser.role,
        },
        organization: organization,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/setup
 * Check setup status
 */
export async function GET() {
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    return NextResponse.json(
      {
        setupRequired: !users || users.length === 0,
        message: !users || users.length === 0 ? 'Setup required' : 'System already set up',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Setup check error:', error);
    return NextResponse.json(
      { error: 'Setup check failed' },
      { status: 500 }
    );
  }
}
