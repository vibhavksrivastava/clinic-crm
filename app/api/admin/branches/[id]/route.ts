import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';

/**
 * GET /api/admin/branches/[id]
 * Get a specific branch
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('x-token') || request.headers.get('authorization')?.slice(7);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: branch, error } = await supabase.from('branches').select('*').eq('id', id).single();

    if (error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ branch });
  } catch (error) {
    console.error('Get branch error:', error);
    return NextResponse.json({ error: 'Failed to fetch branch' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/branches/[id]
 * Delete a branch
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('x-token') || request.headers.get('authorization')?.slice(7);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase.from('branches').delete().eq('id', id);

    if (error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Branch deleted' });
  } catch (error) {
    console.error('Delete branch error:', error);
    return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 });
  }
}
