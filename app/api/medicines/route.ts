import { supabase } from '@/lib/db/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {

    const { data, error } = await supabase
      .from('pharmacy_products')
      .select(`
        id,
        name,
        category,
        unit_price,
        cost_price,
        reorder_level,
        pharmacy_stock (
          quantity,
          batch_number,
          expiry_date
        )
      `)
      .order('name');

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Transform response
    const medicines = data.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      selling_price: item.unit_price,
      purchase_price: item.cost_price,
      reorder_level: item.reorder_level,

      current_stock:
        item.pharmacy_stock?.reduce(
          (sum: number, stock: any) =>
            sum + (stock.quantity || 0),
          0
        ) || 0,
    }));

    return NextResponse.json(medicines);

  } catch (err: any) {

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}