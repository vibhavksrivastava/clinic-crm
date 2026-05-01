import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getUserContext, isSuperAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/db/access-control';

export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext(request);
    if (!userContext) {
      return unauthorizedResponse();
    }

    const { data: allDbRoles, error: dbError } = await supabase
      .from('roles')
      .select('*')
      .order('created_at', { ascending: true });

    if (dbError) throw dbError;

    return NextResponse.json({ roles: allDbRoles || [] });
  } catch (error: any) {
    console.error('Get roles error:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext(request);
    if (!userContext) {
      return unauthorizedResponse();
    }

    if (!isSuperAdmin(userContext)) {
      return forbiddenResponse('Only super admin can create roles');
    }

    const { name, description, organization_id, permissions } = await request.json();

    if (!name || !organization_id) {
      return NextResponse.json({ error: 'Name and organization_id are required' }, { status: 400 });
    }

    const { data: existingRole } = await supabase
      .from('roles')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('name', name)
      .single();

    if (existingRole) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 409 });
    }

    const { data: newRole, error } = await supabase
      .from('roles')
      .insert({
        name,
        description: description || '',
        organization_id,
        permissions: permissions || [],
        is_system_role: false,
        role_type: 'custom',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ role: newRole }, { status: 201 });
  } catch (error) {
    console.error('Create role error:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userContext = await getUserContext(request);
    if (!userContext) {
      return unauthorizedResponse();
    }

    if (!isSuperAdmin(userContext)) {
      return forbiddenResponse('Only super admin can update roles');
    }

    const { id, name, description, permissions } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    const { data: role } = await supabase
      .from('roles')
      .select('is_system_role')
      .eq('id', id)
      .single();

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (role.is_system_role) {
      return forbiddenResponse('System roles cannot be modified');
    }

    const { data: updatedRole, error } = await supabase
      .from('roles')
      .update({
        name,
        description,
        permissions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ role: updatedRole });
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userContext = await getUserContext(request);
    if (!userContext) {
      return unauthorizedResponse();
    }

    if (!isSuperAdmin(userContext)) {
      return forbiddenResponse('Only super admin can delete roles');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    const { data: role } = await supabase
      .from('roles')
      .select('is_system_role')
      .eq('id', id)
      .single();

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (role.is_system_role) {
      return forbiddenResponse('System roles cannot be deleted');
    }

    const { data: usersWithRole, count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role_id', id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete role with assigned users` },
        { status: 409 }
      );
    }

    const { error } = await supabase.from('roles').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Role deleted' });
  } catch (error) {
    console.error('Delete role error:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
