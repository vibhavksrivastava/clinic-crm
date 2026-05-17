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
      .eq('organization_id', userContext.organizationId);

    if (error) throw error;

    const lowStock = (data || []).filter(
      (item) => item.stock_quantity <= item.minimum_stock
    );

    return NextResponse.json(lowStock);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Failed to fetch low stock' },
      { status: 500 }
    );
  }
}
