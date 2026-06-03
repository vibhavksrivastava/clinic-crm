import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/db/client';
import { signToken } from '@/lib/auth/jwt';

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key';

export async function POST(
  request: NextRequest
) {
  try {
    const {
      email,
      password,
    } = await request.json();

    console.log(
      'LOGIN ATTEMPT:',
      email
    );

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Email and password required',
        },
        { status: 400 }
      );
    }

    const {
      data: user,
      error,
    } = await supabase
      .from('users')
      .select(
        `
        *,
        roles(
          id,
          name,
          role_type,
          permissions,
          is_system_role
        )
      `
      )
      .eq('email', email)
      .single();

    console.log(
      'USER DATA:',
      user
    );
    console.log(
      'USER ERROR:',
      error
    );

    if (error || !user) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid credentials',
        },
        { status: 401 }
      );
    }

    console.log(
      'PASSWORD CHECK START'
    );

    const valid =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    console.log(
      'PASSWORD VALID:',
      valid
    );

    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid credentials',
        },
        { status: 401 }
      );
    }

    const token =
  await signToken({
    userId: user.id,
    email: user.email,
    roleType:
      user.roles?.role_type,
    organizationId:
      user.organization_id,
    branchId:
      user.branch_id,
    permissions:
      user.roles
        ?.permissions || [],
  });
console.log(
  'LOGIN JWT SECRET:',
  process.env.JWT_SECRET
);
    // IMPORTANT FIX
    const response =
      NextResponse.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName:
            user.first_name,
          lastName:
            user.last_name,
          roleType:
            user.roles
              ?.role_type,
          roleName:
            user.roles?.name,
          organizationId:
            user.organization_id,
          branchId:
            user.branch_id,
        },
      });

    // SET COOKIE
    response.cookies.set(
      'authToken',
      token,
      {
        httpOnly: true,
        secure: false, // localhost
        sameSite: 'lax',
        path: '/',
        maxAge:
          60 * 60 * 24,
      }
    );

    console.log(
      '✅ authToken cookie set'
    );

    return response;
  } catch (error) {
    console.error(
      'LOGIN ERROR',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          'Login failed',
      },
      { status: 500 }
    );
  }
}