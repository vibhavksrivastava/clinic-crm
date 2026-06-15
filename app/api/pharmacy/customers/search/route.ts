import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { supabase } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const search =
      req.nextUrl.searchParams.get('q')?.trim() || '';

    if (!search) {
      return NextResponse.json({
        data: [],
      });
    }
console.log({
  organization_id: session?.organizationId,
  branch_id: session?.branchId,
});

    const { data, error } = await supabase
      .from('pharmacy_customers')
      .select(`
        id,
        name,
        phone,
        email,
        address,
        gst_number,
        drug_license_number,
        customer_type
      `)
      .eq(
        'organization_id',
        session.organizationId
      )
      .eq(
  'branch_id',
  session.branchId
)

      .or(
        `name.ilike.%${search}%,phone.ilike.%${search}%`
      )
      .order('name')
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      data: data || [],
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error.message ||
          'Failed to search customers',
      },
      { status: 500 }
    );
  }
}