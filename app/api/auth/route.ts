import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import {
  hashPassword,
  verifyPassword,
  createLoginResponse,
  isValidEmail,
  checkLoginAttempts,
  recordLoginAttempt,
  clearLoginAttempts,
  validatePasswordStrength,
} from '@/lib/auth';
import { getUserByEmail, getOrganization, getBranch } from '@/lib/db/multi_tenant_utils';

/**
 * POST /api/auth/login
 * Login user with email and password
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, organizationId, branchId } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check login attempts
    const attemptCheck = checkLoginAttempts(email);
    if (!attemptCheck.allowed) {
      return NextResponse.json(
        { error: attemptCheck.message },
        { status: 429 }
      );
    }

    // Fetch user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('user_status', 'active')
      .single();

    if (userError || !userData) {
      recordLoginAttempt(email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(password, userData.password_hash);
    if (!passwordValid) {
      recordLoginAttempt(email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Validate organization and branch if provided
    if (organizationId && userData.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Invalid organization' },
        { status: 403 }
      );
    }

    if (branchId && userData.branch_id !== branchId) {
      return NextResponse.json(
        { error: 'Invalid branch' },
        { status: 403 }
      );
    }

    // Fetch user's organization and branch

    const { data: orgRaw, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userData.organization_id)
      .single();

    if (orgError || !orgRaw) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Map logo_url to logoUrl for frontend compatibility
    const organization = {
      ...orgRaw,
      logoUrl: orgRaw.logo_url || undefined,
    };

    let branch = null;
    if (userData.branch_id) {
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .eq('id', userData.branch_id)
        .single();

      if (!branchError) {
        branch = branchData;
      }
    }

    // Fetch user's role
    let userWithRole = { ...userData };
    if (userData.role_id) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('*')
        .eq('id', userData.role_id)
        .single();

      if (roleData) {
        userWithRole.role = {
          id: roleData.id,
          roleType: roleData.role_type || 'user',
          permissions: roleData.permissions || [],
          name: roleData.name,
        };
      }
    }

    // Transform user data from snake_case (database) to camelCase (frontend)
    const transformedUser = {
      id: userWithRole.id,
      email: userWithRole.email,
      firstName: userWithRole.first_name,
      lastName: userWithRole.last_name,
      phone: userWithRole.phone,
      profilePictureUrl: userWithRole.profile_picture_url,
      specialization: userWithRole.specialization,
      licenseNumber: userWithRole.license_number,
      roleId: userWithRole.role_id,
      organizationId: userWithRole.organization_id,
      branchId: userWithRole.branch_id,
      userStatus: userWithRole.user_status,
      lastLogin: userWithRole.last_login,
      loginAttempts: userWithRole.login_attempts,
      lockedUntil: userWithRole.locked_until,
      createdAt: userWithRole.created_at,
      updatedAt: userWithRole.updated_at,
      role: userWithRole.role,
    };

    // Create login response
    const response = await createLoginResponse(transformedUser, organization, branch);

    // Clear login attempts on success
    clearLoginAttempts(email);

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userData.id);

    // Create response with token cookie
    const res = NextResponse.json(response, { status: 200 });
    
    // Set secure HTTP-only cookie
    res.cookies.set({
      name: 'clinic_auth',
      value: response.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/register
 * Register a new organization and super admin user
 */
export async function PUT(request: NextRequest) {
  try {
    const {
      organizationName,
      organizationEmail,
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      phone,
      address,
      city,
      country,
    } = await request.json();

    // Validate input
    if (!organizationName || !email || !password) {
      return NextResponse.json(
        { error: 'Organization name, email, and password are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password is too weak', feedback: passwordValidation.feedback },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organizationName,
        email: organizationEmail,
        phone: phone,
        address: address,
        city: city,
        country: country,
        subscription_plan: 'free',
      })
      .select()
      .single();

    if (orgError || !organization) {
      throw new Error(orgError?.message || 'Failed to create organization');
    }

    // Create super admin role
    const { data: superAdminRole, error: roleError } = await supabase
      .from('roles')
      .insert({
        name: 'Super Admin',
        role_type: 'super_admin',
        description: 'Full system access',
        permissions: [
          'manage_organization',
          'manage_branches',
          'manage_staff',
          'manage_patients',
          'manage_appointments',
          'manage_prescriptions',
          'manage_pharmacy',
          'manage_invoices',
          'manage_roles',
          'manage_billing',
        ],
        is_system_role: true,
        organization_id: null,
      })
      .select()
      .single();

    if (roleError) {
      throw new Error(roleError?.message || 'Failed to create role');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user (super admin)
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        role_id: superAdminRole.id,
        organization_id: organization.id,
        user_status: 'active',
      })
      .select()
      .single();

    if (userError || !user) {
      throw new Error(userError?.message || 'Failed to create user');
    }

    // Create login response
    const userWithRole = { 
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      profilePictureUrl: user.profile_picture_url,
      specialization: user.specialization,
      licenseNumber: user.license_number,
      roleId: user.role_id,
      organizationId: user.organization_id,
      branchId: user.branch_id,
      userStatus: user.user_status,
      lastLogin: user.last_login,
      loginAttempts: user.login_attempts,
      lockedUntil: user.locked_until,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      role: {
        id: superAdminRole.id,
        roleType: superAdminRole.role_type,
        name: superAdminRole.name,
        permissions: superAdminRole.permissions || [],
        isSystemRole: superAdminRole.is_system_role || false,
        createdAt: superAdminRole.created_at,
        updatedAt: superAdminRole.updated_at,
      }
    };
    const loginResponse = await createLoginResponse(userWithRole, organization, undefined);

    const response = NextResponse.json(
      {
        message: 'Registration successful',
        ...loginResponse,
      },
      { status: 201 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: 'clinic_auth',
      value: loginResponse.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/logout
 * Logout user by clearing session
 */
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear auth cookie
    response.cookies.set({
      name: 'clinic_auth',
      value: '',
      httpOnly: true,
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
