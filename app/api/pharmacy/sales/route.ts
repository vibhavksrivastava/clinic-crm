import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);

    if (!userContext) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let query = supabase
      .from('pharmacy_sales')
      .select(`
        *,
        pharmacy_customers(name, phone)
      `)
      .order('created_at', { ascending: false });

    if (userContext.organizationId) {
      query = query.eq(
        'organization_id',
        userContext.organizationId
      );
    }

    if (userContext.branchId) {
      query = query.eq('branch_id', userContext.branchId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}
