import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const date = searchParams.get('date'); // YYYY-MM-DD format
    const phone = searchParams.get('phone');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('walk_ins')
      .select(
        '*, created_by_user:users!created_by(id, first_name, last_name, specialization), updated_by_user:users!updated_by(id, first_name, last_name, specialization), patient:patients(id, first_name, last_name, email, phone, date_of_birth, address)',
        { count: 'exact' }
      );

    // Organization filter - required
    if (userContext.organizationId) {
      query = query.eq('organization_id', userContext.organizationId);
    }

    // Branch filter if applicable
    if (userContext.branchId) {
      query = query.eq('branch_id', userContext.branchId);
    }

    // Specific walk-in by ID
    if (id) {
      query = query.eq('id', id);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // Filter by date (today, this week, this month)
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query = query.gte('check_in_time', startDate.toISOString()).lt('check_in_time', endDate.toISOString());
    }

    // Filter by phone
    if (phone) {
      query = query.ilike('phone_number', `%${phone}%`);
    }

    // Order by check-in time (newest first)
    query = query.order('check_in_time', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // If single ID requested
    if (id && Array.isArray(data) && data.length > 0) {
      return NextResponse.json({
        success: true,
        data: data[0],
      });
    }

    return NextResponse.json({
      success: true,
      data: Array.isArray(data) ? data : [],
      count,
      limit,
      offset,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('❌ Error fetching walk-ins:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch walk-ins', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create walk-ins (receptionist, doctor, admin)
    const allowedRoles = ['receptionist', 'doctor', 'clinic_admin', 'branch_admin', 'super_admin'];
    if (!allowedRoles.includes(userContext.roleType)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create walk-in' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, phoneNumber, address, patientId, doctorId, notes } = body;

    // Validate required fields
    if (!name || !phoneNumber || !address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['name', 'phoneNumber', 'address'],
        },
        { status: 400 }
      );
    }

    // Create walk-in record
    const { data, error } = await supabase
      .from('walk_ins')
      .insert([
        {
          name,
          phone_number: phoneNumber,
          address,
          patient_id: patientId || null,
          doctor_id: doctorId || null,
          notes: notes || null,
          status: 'pending',
          check_in_time: new Date().toISOString(),
          created_by: userContext.userId,
          organization_id: userContext.organizationId,
          branch_id: userContext.branchId || null,
          additional_tests: [],
        },
      ])
      .select(
        '*, created_by_user:users!created_by(id, first_name, last_name, specialization), updated_by_user:users!updated_by(id, first_name, last_name, specialization), doctor:users!doctor_id(id, first_name, last_name, specialization), patient:patients(id, first_name, last_name, email, phone, date_of_birth, address)'
      );

    if (error) throw error;

    const walkIn = Array.isArray(data) ? data[0] : data;

    return NextResponse.json(
      {
        success: true,
        data: walkIn,
        message: 'Walk-in created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('❌ Error creating walk-in:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'Failed to create walk-in', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, additionalTests, notes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Walk-in ID is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_by: userContext.userId,
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.check_out_time = new Date().toISOString();
      }
    }

    if (additionalTests !== undefined) {
      updateData.additional_tests = additionalTests;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Update walk-in
    const { data, error } = await supabase
      .from('walk_ins')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', userContext.organizationId)
      .select(
        '*, created_by_user:users!created_by(id, first_name, last_name, specialization), updated_by_user:users!updated_by(id, first_name, last_name, specialization), patient:patients(id, first_name, last_name, email, phone, date_of_birth, address)'
      );

    if (error) throw error;

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Walk-in not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      message: 'Walk-in updated successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('❌ Error updating walk-in:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'Failed to update walk-in', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete walk-ins
    const adminRoles = ['clinic_admin', 'branch_admin', 'super_admin'];
    if (!adminRoles.includes(userContext.roleType)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to delete walk-in' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Walk-in ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by changing status to cancelled
    const { error } = await supabase
      .from('walk_ins')
      .update({
        status: 'cancelled',
        updated_by: userContext.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', userContext.organizationId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Walk-in deleted successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('❌ Error deleting walk-in:', errorMessage);
    return NextResponse.json(
      { success: false, error: 'Failed to delete walk-in', details: errorMessage },
      { status: 500 }
    );
  }
}
