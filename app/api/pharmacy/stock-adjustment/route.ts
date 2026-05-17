import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      stock_id,
      quantity,
      type,
      product_id,
      organization_id,
      branch_id,
      performed_by_id,
      notes,
    } = body;

    // Get current stock
    const { data: stock } = await supabase
      .from('pharmacy_stock')
      .select('*')
      .eq('id', stock_id)
      .single();

    if (!stock) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    let newQty = stock.quantity;

    if (type === 'ADD') {
      newQty += quantity;
    } else {
      newQty -= quantity;

      if (newQty < 0) {
        return NextResponse.json(
          { error: 'Insufficient stock' },
          { status: 400 }
        );
      }
    }

    // Update stock
    const { error: updateError } = await supabase
      .from('pharmacy_stock')
      .update({
        quantity: newQty,
      })
      .eq('id', stock_id);

    if (updateError) {
      throw updateError;
    }

    // Insert transaction log
    await supabase
      .from('pharmacy_transactions')
      .insert([
        {
          product_id,
          organization_id,
          branch_id,
          quantity,
          transaction_type: type,
          performed_by_id,
          notes,
        },
      ]);

    return NextResponse.json({
      success: true,
      updated_quantity: newQty,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

const addStock = async (
  stockId: string,
  qty: number
) => {
  await fetch(
    '/api/pharmacy/stock-adjustment',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stock_id: stockId,
        quantity: qty,
        type: 'ADD',
        product_id: selectedProduct.id,
        organization_id,
        branch_id,
        performed_by_id: user.id,
        notes: 'Stock added manually',
      }),
    }
  );

  fetchStock();
};

const removeStock = async (
  stockId: string,
  qty: number
) => {
  await fetch(
    '/api/pharmacy/stock-adjustment',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stock_id: stockId,
        quantity: qty,
        type: 'REMOVE',
        product_id: selectedProduct.id,
        organization_id,
        branch_id,
        performed_by_id: user.id,
        notes: 'Medicine sold',
      }),
    }
  );

  fetchStock();
};