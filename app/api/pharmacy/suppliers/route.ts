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
        .from('pharmacy_suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.message.includes('not found')) {
          return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
        }
        throw error;
      }
      return NextResponse.json(data);
    }

    // Build query with organization/branch filters
    let query = supabase
      .from('pharmacy_suppliers')
      .select('*');

    // Filter by organization (required for multi-tenant)
    if (userContext.organizationId) {
      query = query.eq('organization_id', userContext.organizationId);
      console.log('✓ Filtering suppliers by organizationId:', userContext.organizationId);
    }

    // Filter by branch if user has branch context
    if (userContext.branchId) {
      query = query.eq('branch_id', userContext.branchId);
      console.log('✓ Filtering suppliers by branchId:', userContext.branchId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch suppliers';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supplier_name, contact_person, email, phone, gst_number, drug_license_number, city, state, pincode, address } = await request.json();

    if (!supplier_name || !contact_person) {
      return NextResponse.json({ error: 'Supplier name and contact person are required' }, { status: 400 });
    }

    console.log('📝 Creating supplier:', {
      supplier_name,
      contact_person,
      organizationId: userContext.organizationId,
      branchId: userContext.branchId,
    });

    const { data, error } = await supabase
      .from('pharmacy_suppliers')
      .insert({
        supplier_name,
        contact_person,
        email,
        phone,
        gst_number,
        drug_license_number,
        city,
        state,
        pincode,
        address,
        organization_id: userContext.organizationId,
        branch_id: userContext.branchId,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating supplier:', error);
      const errorMsg = error.message || 'Failed to create supplier';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    console.log('✅ Supplier created:', data.id);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create supplier';
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
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    const { supplier_name, contact_person, email, phone, gst_number, drug_license_number, city, state, pincode, address } = await request.json();

    const { data, error } = await supabase
      .from('pharmacy_suppliers')
      .update({
        supplier_name,
        contact_person,
        email,
        phone,
        gst_number,
        drug_license_number,
        city,
        state,
        pincode,
        address,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating supplier:', error);
      const errorMsg = error.message || 'Failed to update supplier';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating supplier:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update supplier';
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
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('pharmacy_suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error deleting supplier:', error);
      const errorMsg = error.message || 'Failed to delete supplier';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}
