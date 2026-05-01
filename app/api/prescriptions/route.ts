import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, JWTPayload } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User Context:', userContext);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const patient_id = searchParams.get('patient_id');
    const status = searchParams.get('status'); // active, dispensed, expired

    console.log('Query Parameters:', { id, patient_id, status });

    let query = supabase
      .from('prescriptions')
      .select('*, patients(id, first_name, last_name, phone), users!prescriptions_user_id_fkey(id, first_name, last_name)');

    if (id) {
      query = query.eq('id', id);
    }

    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Multi-tenant filtering if organization_id column exists
    if (userContext.organizationId) {
      query = query.eq('organization_id', userContext.organizationId);
      if (userContext.branchId) {
        query = query.eq('branch_id', userContext.branchId);
      }
    }

    query = query.order('issued_date', { ascending: false });

    let { data, error } = await query;

    if (error) throw error;

    // TypeScript type safety: ensure data is an array
    const prescriptions = Array.isArray(data) ? (data as any[]) : [];

    // If single ID was requested, return the first record
    let singleRecord = null;
    if (id && prescriptions.length > 0) {
      singleRecord = prescriptions[0];
    }

    // Filter based on role
    if (userContext.roleType === 'doctor') {
      // Doctors can view all prescriptions for a specific patient
      // But can only see their own prescriptions when listing without patient_id
      const userId = userContext.userId;
      if (singleRecord) {
        if (singleRecord.user_id === userId) {
          return NextResponse.json(singleRecord);
        } else {
          return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
      } else {
        // If patient_id is specified, allow viewing all prescriptions for that patient
        // Otherwise, only return prescriptions written by this doctor
        if (!patient_id) {
          const filteredData = prescriptions.filter((p: any) => p.user_id === userId);
          return NextResponse.json(filteredData);
        }
        // If patient_id is provided, return all prescriptions for that patient
        return NextResponse.json(prescriptions);
      }
    }

    if (singleRecord) {
      return NextResponse.json(singleRecord);
    }
    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only doctors can create prescriptions
    if (userContext.roleType !== 'doctor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { 
      patient_id, 
      medications, 
      issued_date, 
      appointment_id,
      notes 
    } = await request.json();

    console.log('📝 Creating prescription:', {
      patient_id,
      user_id: userContext.userId,
      appointment_id,
      medications: medications?.length,
      org_id: userContext.organizationId,
      branch_id: userContext.branchId,
    });

    if (!patient_id || !medications || medications.length === 0) {
      return NextResponse.json(
        { error: 'Patient ID and medications are required' },
        { status: 400 }
      );
    }

    // Verify doctor ownership of appointment if provided
    if (appointment_id) {
      const { data: apt } = await supabase
        .from('appointments')
        .select('user_id')
        .eq('id', appointment_id)
        .single();

      if (apt && apt.user_id !== userContext.userId) {
        return NextResponse.json(
          { error: 'Cannot create prescription for other doctor\'s appointment' },
          { status: 403 }
        );
      }
    }

    // Insert prescription with user_id
    const insertData: any = {
      patient_id,
      user_id: userContext.userId,
      medications,
      appointment_id: appointment_id || null,
      issued_date: issued_date || new Date().toISOString().split('T')[0],
      status: 'active',
      notes,
      organization_id: userContext.organizationId,
      branch_id: userContext.branchId,
    };

    const { data, error } = await supabase
      .from('prescriptions')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error inserting prescription:', error);
      throw error;
    }

    console.log('✅ Prescription created with user_id:', data?.id);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating prescription:', error);
    return NextResponse.json(
      { error: 'Failed to create prescription', details: (error as any).message },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: 'Prescription ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Get current prescription
    const { data: currentPrescription, error: fetchError } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentPrescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    // Doctors can only update their own prescriptions
    if (userContext.roleType === 'doctor' && currentPrescription.user_id !== userContext.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: Record<string, any> = {};

    if (body.medications !== undefined) updateData.medications = body.medications;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.expiry_date !== undefined) updateData.expiry_date = body.expiry_date;
    
    // Receptionist can mark as dispensed
    if (body.is_dispensed !== undefined && ['receptionist', 'clinic_admin', 'branch_admin', 'super_admin'].includes(userContext.roleType)) {
      updateData.is_dispensed = body.is_dispensed;
      if (body.is_dispensed) {
        updateData.dispensed_date = new Date();
        updateData.dispensed_by_id = userContext.userId;
      }
    }
    
    updateData.updated_at = new Date();

    const { data, error } = await supabase
      .from('prescriptions')
      .update(updateData)
      .eq('id', id)
      .select(`*,
               patients(first_name, last_name),
               users!user_id(first_name, last_name)`)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating prescription:', error);
    return NextResponse.json(
      { error: 'Failed to update prescription' },
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

    // Only admin can delete
    if (!['clinic_admin', 'branch_admin', 'super_admin'].includes(userContext.roleType)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Prescription ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    return NextResponse.json(
      { error: 'Failed to delete prescription' },
      { status: 500 }
    );
  }
}
