import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, JWTPayload } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.message.includes('not found')) {
          return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }
        throw error;
      }
      return NextResponse.json(data);
    }

    // Build query with organization/branch filters
    let query = supabase
      .from('patients')
      .select('*');

    // Filter by organization (required for multi-tenant)
    if (userContext.organizationId) {
      query = query.eq('organization_id', userContext.organizationId);
      console.log('✓ Filtering patients by organizationId:', userContext.organizationId);
    }

    // Filter by branch if user has branch context
    if (userContext.branchId) {
      query = query.eq('branch_id', userContext.branchId);
      console.log('✓ Filtering patients by branchId:', userContext.branchId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching patients:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch patients';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { first_name, last_name, email, phone, date_of_birth, address } = await request.json();

    if (!first_name || !last_name) {
      return NextResponse.json({ error: 'First and last names are required' }, { status: 400 });
    }

    console.log('📝 Creating patient:', {
      first_name,
      last_name,
      organizationId: userContext.organizationId,
      branchId: userContext.branchId,
    });

    const { data, error } = await supabase
      .from('patients')
      .insert({
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        address,
        organization_id: userContext.organizationId,
        branch_id: userContext.branchId,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating patient:', error);
      const errorMsg = error.message || 'Failed to create patient';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    console.log('✅ Patient created:', data.id);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create patient';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    const { first_name, last_name, email, phone, date_of_birth, address } = await request.json();

    const { data, error } = await supabase
      .from('patients')
      .update({
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        address,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating patient:', error);
      const errorMsg = error.message || 'Failed to update patient';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating patient:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update patient';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error deleting patient:', error);
      const errorMsg = error.message || 'Failed to delete patient';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 });
  }
}
