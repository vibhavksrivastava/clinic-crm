import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth/constants';
import { JWT_SECRET } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // -----------------------------
    // VALIDATION
    // -----------------------------
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // -----------------------------
    // MOCK USERS (replace with DB later)
    // -----------------------------
    const mockUsers = [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@test.com',
        password: '123456',
        role: 'admin',
        organizationId: 'org-1',
        branchId: 'branch-1',
      },
      {
        id: '2',
        name: 'Dr Aditi',
        email: 'doctor@test.com',
        password: '123456',
        role: 'doctor',
        organizationId: 'org-1',
        branchId: 'branch-1',
      },
      {
        id: '3',
        name: 'Reception User',
        email: 'reception@test.com',
        password: '123456',
        role: 'receptionist',
        organizationId: 'org-1',
        branchId: 'branch-1',
      },
      {
        id: '4',
        name: 'Pharmacy User',
        email: 'pharmacy@test.com',
        password: '123456',
        role: 'pharmacist',
        organizationId: 'org-1',
        branchId: 'branch-1',
      },
      {
        id: '5',
        name: 'Patient User',
        email: 'patient@test.com',
        password: '123456',
        role: 'patient',
        organizationId: 'org-1',
        branchId: 'branch-1',
      },
    ];

    // -----------------------------
    // FIND USER
    // -----------------------------
    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // -----------------------------
    // JWT PAYLOAD (IMPORTANT: must match access-control.ts)
    // -----------------------------
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      roleType: user.role,
      name: user.name,
      organizationId: user.organizationId,
      branchId: user.branchId,
      permissions: [],
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(JWT_SECRET);

    // -----------------------------
    // RESPONSE
    // -----------------------------
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // -----------------------------
    // SET COOKIE
    // -----------------------------
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      ...AUTH_COOKIE_OPTIONS,
    });

    return response;
  } catch (error) {
    console.error('Login API Error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}