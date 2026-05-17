import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);

    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('pharmacy_inventory')
      .select(`
        *,
        pharmacy_products(name)
      `)
      .lte(
        'expiry_date',
        new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split('T')[0]
      )
      .eq('organization_id', userContext.organizationId);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Failed to fetch expiry alerts' },
      { status: 500 }
    );
  }
}
