import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patient_id');

  try {
    let query = supabase.from('patient_emergency_contacts').select('*');

    if (patientId) {
      query = query.eq('patient_id', patientId).order('priority', { ascending: true });
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch emergency contacts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { error } = await supabase.from('patient_emergency_contacts').insert([body]);
    if (error) throw error;

    return NextResponse.json({ message: 'Emergency contact created' }, { status: 201 });
  } catch (error) {
    console.error('Error creating emergency contact:', error);
    return NextResponse.json({ error: 'Failed to create emergency contact' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    const { error } = await supabase
      .from('patient_emergency_contacts')
      .update(body)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Emergency contact updated' });
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    return NextResponse.json({ error: 'Failed to update emergency contact' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const { error } = await supabase.from('patient_emergency_contacts').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ message: 'Emergency contact deleted' });
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    return NextResponse.json({ error: 'Failed to delete emergency contact' }, { status: 500 });
  }
}
