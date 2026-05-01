import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getUserContext, unauthorizedResponse } from '@/lib/db/access-control';

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for the logged-in user
 */
export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext(request);
    if (!userContext) {
      return unauthorizedResponse();
    }

    const organizationId = userContext.organizationId;
    const userId = userContext.userId;
    const roleType = userContext.roleType;

    // Get today's date range in local time
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Build queries based on user role
    let stats = {
      totalPatients: 0,
      todaysAppointments: 0,
    };

    if (roleType === 'super_admin') {
      // Super admin sees all data
      const [patientsRes, appointmentsRes] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .gte('appointment_date', todayStart.toISOString())
          .lte('appointment_date', todayEnd.toISOString()),
      ]);

      stats = {
        totalPatients: patientsRes.count || 0,
        todaysAppointments: appointmentsRes.count || 0,
      };
    } else {
      // For doctors and other staff, get organization-specific data
      const [patientsRes, appointmentsRes] = await Promise.all([
        // Total patients in organization
        supabase.from('patients').select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        
        // Today's appointments for this organization
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .gte('appointment_date', todayStart.toISOString())
          .lte('appointment_date', todayEnd.toISOString()),
      ]);

      stats = {
        totalPatients: patientsRes.count || 0,
        todaysAppointments: appointmentsRes.count || 0,
      };
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}