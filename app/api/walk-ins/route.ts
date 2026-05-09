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

    // If patientId is not provided, check for duplicate and create if needed
    let finalPatientId = patientId;
    let isDuplicatePatient = false;
    
    if (!patientId) {
      // Extract first and last name from full name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Check if patient already exists with same phone number and organization/branch
      console.log('🔍 Checking for duplicate patient:', {
        phone: phoneNumber,
        firstName,
        lastName,
        organization_id: userContext.organizationId,
        branch_id: userContext.branchId,
      });

      const { data: existingPatients, error: searchError } = await supabase
        .from('patients')
        .select('id, first_name, last_name, phone')
        .eq('phone', phoneNumber)
        .eq('organization_id', userContext.organizationId)
        .eq('branch_id', userContext.branchId || null);

      if (searchError) {
        console.error('❌ Error searching for duplicate patient:', searchError);
      } else if (existingPatients && existingPatients.length > 0) {
        // Found existing patient(s) with same phone
        const existingPatient = existingPatients[0];
        
        // Additional check: verify name matches (case-insensitive)
        const nameMatch = 
          (existingPatient.first_name?.toLowerCase() === firstName.toLowerCase() &&
           existingPatient.last_name?.toLowerCase() === lastName.toLowerCase());
        
        if (nameMatch || existingPatients.length === 1) {
          // Use existing patient
          finalPatientId = existingPatient.id;
          isDuplicatePatient = true;
          console.log(`✓ Using existing patient: ${finalPatientId} (Phone: ${phoneNumber})`);
        } else {
          console.warn(`⚠️ Found patient with same phone but different name. Creating new patient.`);
        }
      }

      // Only create new patient if no existing patient was found
      if (!finalPatientId) {
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .insert([
            {
              first_name: firstName,
              last_name: lastName,
              phone: phoneNumber,
              address: address,
              organization_id: userContext.organizationId,
              branch_id: userContext.branchId || null,
            },
          ])
          .select('id');

        if (patientError) {
          console.error('❌ Error creating patient:', patientError);
          // Continue without patient - patient creation is not critical for walk-in creation
        } else if (patientData && Array.isArray(patientData) && patientData.length > 0) {
          finalPatientId = patientData[0].id;
          console.log(`✓ New patient created: ${finalPatientId}`);
        }
      }
    }

    // Create walk-in record
    const { data, error } = await supabase
      .from('walk_ins')
      .insert([
        {
          name,
          phone_number: phoneNumber,
          address,
          patient_id: finalPatientId || null,
          doctor_id: doctorId || null,
          notes: notes || null,
          status: 'pending',
          check_in_time: new Date().toISOString(),
          created_by: userContext.userId,
          organization_id: userContext.organizationId,
          branch_id: userContext.branchId || null,
          additional_tests: [],
          vitals: [],
          medicines: [],
        },
      ])
      .select(
        '*, created_by_user:users!created_by(id, first_name, last_name, specialization), updated_by_user:users!updated_by(id, first_name, last_name, specialization), doctor:users!doctor_id(id, first_name, last_name, specialization), patient:patients(id, first_name, last_name, email, phone, date_of_birth, address)'
      );

    if (error) throw error;

    const walkIn = Array.isArray(data) ? data[0] : data;

    // Determine message based on whether patient was new or duplicate
    let message = 'Walk-in created successfully';
    if (isDuplicatePatient) {
      message = `Walk-in created successfully (using existing patient record)`;
    }

    return NextResponse.json(
      {
        success: true,
        data: walkIn,
        isDuplicatePatient,
        message,
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
    const { id, status, additionalTests, vitals, medicines, notes, generatePrescription } = body;

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

    if (vitals !== undefined) {
      updateData.vitals = vitals;
    }

    if (medicines !== undefined) {
      updateData.medicines = medicines;
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
        '*, created_by_user:users!created_by(id, first_name, last_name, specialization), updated_by_user:users!updated_by(id, first_name, last_name, specialization), doctor:users!doctor_id(id, first_name, last_name, specialization), patient:patients(id, first_name, last_name, email, phone, date_of_birth, address)'
      );

    if (error) throw error;

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Walk-in not found or unauthorized' },
        { status: 404 }
      );
    }

    const updatedWalkIn = data[0];
    let prescription = null;

    // Auto-generate prescription if walk-in is completed with medicines
    const shouldGeneratePrescription = status === 'completed' && updatedWalkIn.patient_id;
    const medicinesToUse = medicines || updatedWalkIn.medicines || [];
    const testsToUse = additionalTests || updatedWalkIn.additional_tests || [];
    
    if (shouldGeneratePrescription && medicinesToUse && medicinesToUse.length > 0) {
      try {
        console.log('📝 Generating prescription for walk-in completion:', {
          walk_in_id: id,
          patient_id: updatedWalkIn.patient_id,
          medicines_count: medicinesToUse.length,
          medicines: JSON.stringify(medicinesToUse),
          tests_count: testsToUse.length,
          tests: JSON.stringify(testsToUse),
        });

        // Get the doctor ID from the walk-in or use the current user if they're a doctor
        let doctorId = updatedWalkIn.doctor_id;
        
        // If no doctor assigned to walk-in, use current user if they're a doctor
        if (!doctorId && userContext.roleType === 'doctor') {
          doctorId = userContext.userId;
          console.log('✓ Using current user as doctor (doctor role)');
        }
        
        if (!doctorId) {
          console.warn('⚠️ No doctor assigned to walk-in. Walk-in doctor_id:', updatedWalkIn.doctor_id, 'User role:', userContext.roleType);
          // Don't create prescription if no doctor
        } else {
          // Transform medicines to have the correct field names for prescription
          // Walk-in medicines have: {id, name, dosage, frequency}
          // Prescription expects: {medication_name, dosage, frequency, quantity}
          const transformedMedications = medicinesToUse.map((med: any) => ({
            medication_name: med.name || med.medication_name || 'Unknown',
            dosage: med.dosage || '',
            frequency: med.frequency || '',
            quantity: med.quantity || 0,
            id: med.id, // Keep original id as well
          }));

          console.log('📋 Transformed medications:', JSON.stringify(transformedMedications));

          // Get vitals from request or walk-in data
          let vitalesToUse = vitals || updatedWalkIn.vitals;
          
          // Convert vitals array format to prescription object format if needed
          let formattedVitals: any = null;
          if (vitalesToUse && Array.isArray(vitalesToUse) && vitalesToUse.length > 0) {
            // Check if vitals are in array format {id, name, value, unit} or object format
            if (vitalesToUse[0] && 'name' in vitalesToUse[0]) {
              // Convert from array format to object format
              formattedVitals = {};
              vitalesToUse.forEach((vital: any) => {
                const name = vital.name?.toLowerCase().replace(/\s+/g, '_');
                if (name && vital.value !== undefined && vital.value !== null) {
                  formattedVitals[name] = isNaN(vital.value) ? vital.value : parseFloat(vital.value);
                  if (vital.unit) {
                    formattedVitals[`${name}_unit`] = vital.unit;
                  }
                }
              });
              console.log('📊 Converted vitals from array to object format:', JSON.stringify(formattedVitals));
            } else {
              // Already in object format
              formattedVitals = vitalesToUse;
              console.log('📊 Using vitals in object format:', JSON.stringify(formattedVitals));
            }
          }
          
          if (formattedVitals && Object.keys(formattedVitals).length > 0) {
            console.log('📊 Including vitals in prescription:', JSON.stringify(formattedVitals));
          }

          // Create prescription
          const prescriptionData: any = {
            patient_id: updatedWalkIn.patient_id,
            user_id: doctorId,
            medications: transformedMedications,
            issued_date: new Date().toISOString().split('T')[0],
            status: 'active',
            notes: notes || updatedWalkIn.notes || null,
            organization_id: userContext.organizationId,
            branch_id: userContext.branchId || null,
          };
          
          // Add vitals if available (in structured format)
          if (formattedVitals && Object.keys(formattedVitals).length > 0) {
            prescriptionData.vitals = formattedVitals;
          }

          if (testsToUse && Array.isArray(testsToUse) && testsToUse.length > 0) {
            prescriptionData.additional_tests = testsToUse;
          }
          
          // Only add walk_in_id if column exists (after migration)
          if (id) {
            prescriptionData.walk_in_id = id;
          }

          console.log('📋 Creating prescription with data:', JSON.stringify(prescriptionData));

          const { data: prescriptionResult, error: prescriptionError } = await supabase
            .from('prescriptions')
            .insert([prescriptionData])
            .select('*')
            .single();

          if (prescriptionError) {
            console.error('❌ Error creating prescription:', JSON.stringify(prescriptionError));
            // If walk_in_id column doesn't exist, try without it
            if (prescriptionError.message?.includes('walk_in_id')) {
              console.warn('⚠️ walk_in_id column not found. Run migration: lib/db/migration_add_walk_in_id_to_prescriptions.sql');
              const prescriptionRetryData: any = {
                patient_id: updatedWalkIn.patient_id,
                user_id: doctorId,
                medications: transformedMedications,
                issued_date: new Date().toISOString().split('T')[0],
                status: 'active',
                notes: notes || updatedWalkIn.notes || null,
                organization_id: userContext.organizationId,
                branch_id: userContext.branchId || null,
              };
              
              if (formattedVitals && Object.keys(formattedVitals).length > 0) {
                prescriptionRetryData.vitals = formattedVitals;
              }
              
              const { data: prescriptionRetry, error: prescriptionRetryError } = await supabase
                .from('prescriptions')
                .insert([prescriptionRetryData])
                .select('*')
                .single();
              
              if (prescriptionRetryError) {
                console.error('❌ Prescription creation still failed:', JSON.stringify(prescriptionRetryError));
              } else {
                prescription = prescriptionRetry;
                console.log('✅ Prescription created (without walk_in_id):', prescription?.id);
              }
            }
          } else {
            prescription = prescriptionResult;
            console.log('✅ Prescription created successfully:', prescription?.id);
          }
        }
      } catch (prescriptionErr) {
        console.error('❌ Exception during prescription creation:', prescriptionErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedWalkIn,
      prescription: prescription,
      message: prescription ? 'Walk-in updated and prescription generated successfully' : 'Walk-in updated successfully',
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
