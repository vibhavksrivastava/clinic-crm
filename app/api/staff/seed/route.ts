import { supabase } from '@/lib/db/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Test data for staff
    const testStaff = [
      {
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@clinic.com',
        role: 'doctor',
        phone: '+1-555-0101',
        specialization: 'Cardiology',
      },
      {
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@clinic.com',
        role: 'doctor',
        phone: '+1-555-0102',
        specialization: 'Pediatrics',
      },
      {
        first_name: 'Michael',
        last_name: 'Brown',
        email: 'michael.brown@clinic.com',
        role: 'doctor',
        phone: '+1-555-0103',
        specialization: 'General Practice',
      },
      {
        first_name: 'Emily',
        last_name: 'Davis',
        email: 'emily.davis@clinic.com',
        role: 'nurse',
        phone: '+1-555-0104',
        specialization: null,
      },
      {
        first_name: 'Robert',
        last_name: 'Wilson',
        email: 'robert.wilson@clinic.com',
        role: 'receptionist',
        phone: '+1-555-0105',
        specialization: null,
      },
    ];

    // Delete existing staff with these emails first (to handle duplicates)
    const emailsToDelete = testStaff.map(s => s.email);
    await supabase
      .from('staff')
      .delete()
      .in('email', emailsToDelete);

    // Insert fresh test staff
    const { data, error } = await supabase
      .from('staff')
      .insert(testStaff)
      .select();

    if (error) throw error;

    // Get all staff after insert to verify
    const { data: allStaff } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false });

    const doctors = allStaff?.filter(s => s.role === 'doctor') || [];

    return NextResponse.json({
      success: true,
      message: `Seeding complete. Total staff: ${allStaff?.length || 0}, Doctors: ${doctors.length}`,
      data: allStaff,
      doctors: doctors,
    });
  } catch (error) {
    console.error('Error seeding staff:', error);
    return NextResponse.json({ error: 'Failed to seed staff', details: error }, { status: 500 });
  }
}

// GET endpoint to check current staff and doctors
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const doctors = data?.filter(s => s.role === 'doctor') || [];
    const allRoles = data ? Array.from(new Set(data.map(s => s.role))) : [];

    console.log('Staff diagnostic:', {
      total: data?.length || 0,
      doctors: doctors.length,
      roles: allRoles,
      staff: data,
    });

    return NextResponse.json({
      total: data?.length || 0,
      doctors: doctors.length,
      allRoles,
      staff: data,
      doctorsList: doctors,
    });
  } catch (error) {
    console.error('Error checking staff:', error);
    return NextResponse.json({ error: 'Failed to check staff', details: error }, { status: 500 });
  }
}
