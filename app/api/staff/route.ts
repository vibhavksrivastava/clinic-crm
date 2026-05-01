import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';

function verifyToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  return authHeader?.startsWith('Bearer ') || false;
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const organizationId = searchParams.get('organizationId');
    const branchId = searchParams.get('branchId');
    const role = searchParams.get('role');
    
    console.log('📥 Staff API Request:', {
      id,
      organizationId,
      branchId,
      role,
      fullUrl: request.url
    });

    // If organization_id is provided, fetch from users table (multi-tenant approach)
    if (organizationId) {
      console.log('🔍 Querying users table with organizationId:', organizationId);
      
      let query = supabase
        .from('users')
        .select('id, first_name, last_name, email, phone, specialization, organization_id, branch_id, role_id, roles(id, role_type, name)');
      
      query = query.eq('organization_id', organizationId);
      
      if (branchId) {
        console.log('📍 Adding branch filter:', branchId);
        query = query.eq('branch_id', branchId);
      }
      
      // Filter by role type if specified (e.g., role=doctor)
      // This ensures we only get users with the doctor role via the role_id relationship
      if (role) {
        console.log('👨‍⚕️ Adding role filter:', role);
        query = query.eq('roles.role_type', role);
      } else {
        // Default to doctors if no role specified
        console.log('👨‍⚕️ Defaulting to doctor role');
        query = query.eq('roles.role_type', 'doctor');
      }
      
      const { data, error } = await query.order('first_name', { ascending: true });
      
      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }
      
      console.log('✅ Raw users data returned:', data?.length || 0, 'records');
      
      // Transform users data to match staff table structure
      // Filter to ensure role_id exists and role_type matches (extra safety check)
      const transformedData = (data as any[])
        ?.filter(user => user.role_id && user.roles?.role_type === (role || 'doctor'))
        ?.map(user => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.roles?.role_type || 'doctor',
          specialization: user.specialization,
          organization_id: user.organization_id,
          branch_id: user.branch_id,
          role_id: user.role_id,
          user_id: user.id,
        })) || [];
      
      console.log('✅ Transformed staff:', transformedData.length, 'doctors');
      transformedData.forEach(doc => {
        console.log(`  - ${doc.first_name} ${doc.last_name} (${doc.role})`);
      });
      
      return NextResponse.json(transformedData);
    }

    // For backward compatibility, fetch from staff table if no organization_id
    console.log('⚠️ No organizationId provided - falling back to staff table');
    
    if (id) {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    let query = supabase.from('staff').select('*');
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    
    if (role) {
      query = query.eq('role', role);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log('✅ Staff table returned:', data?.length || 0, 'records');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching staff:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch staff';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const { first_name, last_name, email, role, phone, specialization, organization_id, branch_id } = await request.json();

    if (!first_name || !last_name || !role) {
      return NextResponse.json({ error: 'First name, last name, and role are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('staff')
      .insert({
        first_name,
        last_name,
        email,
        role,
        phone,
        specialization,
        organization_id,
        branch_id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating staff:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create staff';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!verifyToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    const { first_name, last_name, email, role, phone, specialization, organization_id, branch_id } = await request.json();

    const { data, error } = await supabase
      .from('staff')
      .update({
        first_name,
        last_name,
        email,
        role,
        phone,
        specialization,
        organization_id,
        branch_id,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating staff:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update staff';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!verifyToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete staff';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
