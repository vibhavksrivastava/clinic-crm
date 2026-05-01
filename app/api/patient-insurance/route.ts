import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patient_id');

  try {
    let query = supabase.from('patient_insurance').select('*');

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching patient insurance:', error);
    return NextResponse.json({ error: 'Failed to fetch patient insurance' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { error } = await supabase.from('patient_insurance').insert([body]);
    if (error) throw error;

    return NextResponse.json({ message: 'Insurance record created' }, { status: 201 });
  } catch (error) {
    console.error('Error creating insurance:', error);
    return NextResponse.json({ error: 'Failed to create insurance record' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    const { error } = await supabase
      .from('patient_insurance')
      .update(body)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Insurance record updated' });
  } catch (error) {
    console.error('Error updating insurance:', error);
    return NextResponse.json({ error: 'Failed to update insurance record' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const { error } = await supabase.from('patient_insurance').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ message: 'Insurance record deleted' });
  } catch (error) {
    console.error('Error deleting insurance:', error);
    return NextResponse.json({ error: 'Failed to delete insurance record' }, { status: 500 });
  }
}
