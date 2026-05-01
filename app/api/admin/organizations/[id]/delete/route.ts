import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';

/**
 * DELETE /api/admin/organizations/[id]
 * Delete an organization
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('x-token') || request.headers.get('authorization')?.slice(7);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Delete organization (cascades to branches and users)
    const { error } = await supabase.from('organizations').delete().eq('id', id);

    if (error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Organization deleted' });
  } catch (error) {
    console.error('Delete organization error:', error);
    return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 });
  }
}
