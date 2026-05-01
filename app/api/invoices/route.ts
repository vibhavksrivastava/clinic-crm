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
    const patient_id = searchParams.get('patient_id');
    const appointment_id = searchParams.get('appointment_id');

    if (id) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, patients(first_name, last_name, phone, email, date_of_birth)')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Verify the invoice belongs to user's organization
      if (userContext.organizationId && data.organization_id !== userContext.organizationId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      return NextResponse.json(data);
    }

    if (appointment_id) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, patients(first_name, last_name, phone, email)')
        .eq('appointment_id', appointment_id)
        .order('created_at', { ascending: false })
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    if (patient_id) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, patients(first_name, last_name, phone, email)')
        .eq('patient_id', patient_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Build query with organization filtering via patient join
    let query = supabase
      .from('invoices')
      .select('*, patients(id, first_name, last_name, phone, email, organization_id)')
      .order('created_at', { ascending: false });

    // Apply organization filter for non-super-admin users
    // We need to filter via the patients table since invoices don't have organization_id directly
    if (userContext.organizationId) {
      // First get patients for this organization, then filter invoices
      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('organization_id', userContext.organizationId);
      
      const patientIds = patientData?.map(p => p.id) || [];
      
      if (patientIds.length > 0) {
        query = query.in('patient_id', patientIds);
      } else {
        return NextResponse.json([]);
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Format response to remove nested patient organization_id
    const formattedData = data?.map(inv => ({
      ...inv,
      patients: inv.patients ? {
        id: inv.patients.id,
        first_name: inv.patients.first_name,
        last_name: inv.patients.last_name,
        phone: inv.patients.phone,
        email: inv.patients.email
      } : null
    })) || [];
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { patient_id, appointment_id, amount, due_date, notes } = await request.json();

    if (!patient_id || !amount) {
      return NextResponse.json({ error: 'Patient ID and amount are required' }, { status: 400 });
    }

    // Verify the patient belongs to user's organization
    if (userContext.organizationId) {
      const { data: patientData } = await supabase
        .from('patients')
        .select('organization_id')
        .eq('id', patient_id)
        .single();

      if (!patientData || patientData.organization_id !== userContext.organizationId) {
        return NextResponse.json({ error: 'Patient not found in your organization' }, { status: 403 });
      }
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        patient_id,
        appointment_id,
        amount,
        due_date,
        notes,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userContext = await getSessionFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only receptionist and admins can update invoice payment status
    if (!['receptionist', 'clinic_admin', 'branch_admin', 'super_admin'].includes(userContext.roleType)) {
      return NextResponse.json({ error: 'Forbidden: Only receptionists and admins can update invoices' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const { status, payment_mode, amount_paid, notes } = await request.json();

    // Validate status if provided
    if (status && !['pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, paid, overdue, cancelled' },
        { status: 400 }
      );
    }

    // Validate payment_mode if provided
    if (payment_mode && !['cash', 'card', 'upi'].includes(payment_mode)) {
      return NextResponse.json(
        { error: 'Invalid payment mode. Must be one of: cash, card, upi' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date(),
    };

    if (status) {
      updateData.status = status;
      // If marking as paid, set paid_date to now
      if (status === 'paid') {
        updateData.paid_date = new Date();
      }
    }

    if (payment_mode) {
      updateData.payment_mode = payment_mode;
    }

    if (amount_paid !== undefined && amount_paid !== null) {
      updateData.amount_paid = parseFloat(amount_paid);
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    console.log('💳 Updating invoice:', {
      invoiceId: id,
      status,
      payment_mode,
      amount_paid,
      updatedBy: userContext.userId,
    });

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select('*, patients(first_name, last_name, organization_id)')
      .single();

    if (error) {
      console.error('❌ Error updating invoice:', {
        message: error.message,
        code: error.code,
        details: error.details,
        invoiceId: id,
      });
      throw error;
    }

    // Verify the invoice belongs to user's organization
    if (userContext.organizationId && data.patients?.organization_id !== userContext.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('✅ Invoice updated successfully:', {
      invoiceId: id,
      newStatus: data.status,
      payment_mode: data.payment_mode,
    });

    // Format response
    const formattedData = {
      ...data,
      patients: data.patients ? {
        first_name: data.patients.first_name,
        last_name: data.patients.last_name
      } : null
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('❌ Error in PUT /api/invoices:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to update invoice', details: errorMessage },
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Get the invoice first to verify ownership
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*, patients(organization_id)')
      .eq('id', id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify the invoice belongs to user's organization
    if (userContext.organizationId && invoice.patients?.organization_id !== userContext.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
