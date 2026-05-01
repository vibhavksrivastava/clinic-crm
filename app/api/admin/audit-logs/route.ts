import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getUserContext, isSuperAdmin, forbiddenResponse, unauthorizedResponse } from '@/lib/db/access-control';

/**
 * GET /api/admin/audit-logs
 * Fetch audit logs (super admin sees all, others see their organization only)
 */
export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext(request);
    if (!userContext) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const userId = searchParams.get('userId');

    // Build query
    let query = supabase
      .from('audit_logs')
      .select(
        `
        id,
        user_id,
        organization_id,
        action,
        entity_type,
        entity_id,
        changes,
        ip_address,
        created_at,
        users:user_id(first_name, last_name, email),
        organizations:organization_id(name)
      `
      )
      .order('created_at', { ascending: false });

    // Apply filters based on user role
    if (!isSuperAdmin(userContext)) {
      // Non-super-admin users only see logs from their organization
      query = query.eq('organization_id', userContext.organizationId);
    }

    // Apply optional filters
    if (action) {
      query = query.eq('action', action);
    }
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) throw error;

    // Format response
    const formattedLogs = (logs || []).map((log: any) => ({
      id: log.id,
      user_id: log.user_id,
      user_name: log.users ? `${log.users.first_name} ${log.users.last_name}` : 'Unknown',
      user_email: log.users?.email,
      organization_id: log.organization_id,
      organization_name: log.organizations?.name || 'Unknown',
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      changes: log.changes,
      ip_address: log.ip_address,
      created_at: log.created_at,
    }));

    return NextResponse.json({
      logs: formattedLogs,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
