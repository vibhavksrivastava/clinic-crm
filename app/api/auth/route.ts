import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { isValidEmail, validatePasswordStrength } from '@/lib/auth/utils';
import {
  checkLoginAttempts,
  recordLoginAttempt,
  clearLoginAttempts,
} from '@/lib/auth/login-attempts';
import { getUserByEmail } from '@/lib/auth/user';
import { createLoginResponse } from '@/lib/auth/response';

/**
 * POST /api/auth/login
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, organizationId, branchId } =
      await request.json();

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

    // ✅ login attempts check (FIXED TYPE USAGE)
    const attemptCheck = checkLoginAttempts(email);

    if (!attemptCheck?.allowed) {
      return NextResponse.json(
        { error: attemptCheck?.message || 'Too many attempts' },
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
      recordLoginAttempt(email, false);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(
      password,
      userData.password_hash
    );

    if (!passwordValid) {
      recordLoginAttempt(email, false);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Org validation
    if (organizationId && userData.organization_id !== organizationId) {
      recordLoginAttempt(email, false);
      return NextResponse.json(
        { error: 'Invalid organization' },
        { status: 403 }
      );
    }

    // Branch validation
    if (branchId && userData.branch_id !== branchId) {
      recordLoginAttempt(email, false);
      return NextResponse.json(
        { error: 'Invalid branch' },
        { status: 403 }
      );
    }

    // Fetch organization
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

    const organization = {
      ...orgRaw,
      logoUrl: orgRaw.logo_url || undefined,
    };

    // Fetch branch
    let branch = null;
    if (userData.branch_id) {
      const { data: branchData } = await supabase
        .from('branches')
        .select('*')
        .eq('id', userData.branch_id)
        .single();

      branch = branchData || null;
    }

    // Fetch role
    let role = null;
    if (userData.role_id) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('*')
        .eq('id', userData.role_id)
        .single();

      if (roleData) {
        role = {
          id: roleData.id,
          roleType: roleData.role_type || 'user',
          permissions: roleData.permissions || [],
          name: roleData.name,
        };
      }
    }

    // transform user
    const transformedUser = {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      phone: userData.phone,
      profilePictureUrl: userData.profile_picture_url,
      specialization: userData.specialization,
      licenseNumber: userData.license_number,
      roleId: userData.role_id,
      organizationId: userData.organization_id,
      branchId: userData.branch_id,
      userStatus: userData.user_status,
      lastLogin: userData.last_login,
      loginAttempts: userData.login_attempts,
      lockedUntil: userData.locked_until,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
      role,
    };

    // =========================
    // FIXED FLOW ORDER
    // =========================

    recordLoginAttempt(email, true);
    clearLoginAttempts(email);

    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userData.id);

    const loginResponse = await createLoginResponse(
      email,
      organization,
      branch ?? null
    );

    const response = NextResponse.json(
      {
        user: transformedUser,
        organization,
        branch,
        token: loginResponse.token,
      },
      { status: 200 }
    );

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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

/**
 * REGISTER
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

    if (!organizationName || !email || !password) {
      return NextResponse.json(
        { error: 'Required fields missing' },
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

    const isValidPassword = validatePasswordStrength(password);

if (!isValidPassword) {
  return NextResponse.json(
    {
      error: 'Weak password',
      feedback: [
        'Password must be at least 8 characters',
        'Include uppercase, lowercase, number',
      ],
    },
    { status: 400 }
  );
}

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    const { data: organization } = await supabase
      .from('organizations')
      .insert({
        name: organizationName,
        email: organizationEmail,
        phone,
        address,
        city,
        country,
        subscription_plan: 'free',
      })
      .select()
      .single();

      const { data: branch } = await supabase
      .from('branches')
      .insert({
        name: organizationName,
        email: organizationEmail,
        phone,
        address,
        city,
        country,
        subscription_plan: 'free',
      })
      .select()
      .single();

    const { data: role } = await supabase
      .from('roles')
      .insert({
        name: 'Super Admin',
        role_type: 'super_admin',
        permissions: ['manage_all'],
        is_system_role: true,
      })
      .select()
      .single();

    const passwordHash = await hashPassword(password);

    const { data: user } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        phone,
        role_id: role.id,
        organization_id: organization.id,
        user_status: 'active',
      })
      .select()
      .single();

    const loginResponse = await createLoginResponse(
      {
        ...user,
        role,
      },
      organization,
      branch ?? null
    );

    const response = NextResponse.json(
      {
        message: 'Registration successful',
        ...loginResponse,
      },
      { status: 201 }
    );

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
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}

/**
 * LOGOUT
 */
export async function DELETE() {
  const response = NextResponse.json({
    message: 'Logged out',
  });

  response.cookies.set({
    name: 'clinic_auth',
    value: '',
    maxAge: 0,
    path: '/',
  });

  return response;
}