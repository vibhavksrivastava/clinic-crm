import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';

/**
 * GET /api/admin/staff/[id]
 * Get a specific staff member
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('x-token') || request.headers.get('authorization')?.slice(7);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: staff, error } = await supabase
      .from('users')
      .select(
        `
        *,
        roles:role_id(name, role_type),
        organizations:organization_id(name),
        branches:branch_id(name)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/staff/[id]
 * Delete a staff member
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('x-token') || request.headers.get('authorization')?.slice(7);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Staff member deleted' });
  } catch (error) {
    console.error('Delete staff error:', error);
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
  }
}
