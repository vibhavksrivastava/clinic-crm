import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const branchId = searchParams.get('branchId');

    // organizationId is required to fetch doctors from specific clinic
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      );
    }

    // Query doctors from the specified organization only
    let query = supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, specialization, organization_id, branch_id, role_id, roles(id, role_type, name)');
    
    // Filter by role type = 'doctor'
    query = query.eq('roles.role_type', 'doctor');
    
    // Filter strictly by organization - only doctors from this clinic
    query = query.eq('organization_id', organizationId);
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    
    const { data, error } = await query.order('first_name', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching doctors:', error);
      throw error;
    }
    
    // Transform to match Doctor interface
    const doctors = (data as any[])
      ?.filter((user: any) => user.role_id && user.roles?.role_type === 'doctor')
      ?.map((user: any) => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        specialization: user.specialization,
      })) || [];
    
    console.log(`✅ Fetched ${doctors.length} doctors from organization ${organizationId}`);
    
    return NextResponse.json({ success: true, data: doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch doctors';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
