//'use client';

import Header from '@/components/Header';
import { supabase } from '@/lib/db/client';
import { getSessionFromRequest } from '@/lib/auth';

type Props = { params: Promise<{ id: string }> }

export default async function GET(
  //request: Request,
  { params }: Props
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('pharmacy_suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}