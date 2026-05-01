import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import {
  fetchDoctorDailyReminders,
  fetchPatientPreHourReminders,
} from '@/lib/appointmentReminders';

export async function GET(request: NextRequest) {
  const userContext = await getSessionFromRequest(request);
  if (!userContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (!type) {
    return NextResponse.json(
      { error: 'Missing reminder type. Use ?type=doctor or ?type=patient' },
      { status: 400 }
    );
  }

  try {
    if (type === 'doctor') {
      const doctorId =
        searchParams.get('user_id') ||
        (userContext.roleType === 'doctor' ? userContext.userId : null);

      if (!doctorId) {
        return NextResponse.json(
          { error: 'Doctor user_id is required for doctor reminders' },
          { status: 400 }
        );
      }

      const reminders = await fetchDoctorDailyReminders(
        doctorId,
        userContext.organizationId,
        userContext.branchId
      );

      return NextResponse.json({ reminders });
    }

    if (type === 'patient') {
      const patientId = searchParams.get('patient_id');
      if (!patientId) {
        return NextResponse.json(
          { error: 'patient_id is required for patient reminders' },
          { status: 400 }
        );
      }

      const reminders = await fetchPatientPreHourReminders(
        patientId,
        userContext.organizationId,
        userContext.branchId
      );

      return NextResponse.json({ reminders });
    }

    return NextResponse.json(
      { error: 'Unknown reminder type. Use ?type=doctor or ?type=patient' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching appointment reminders:', message, error);
    return NextResponse.json({ error: 'Failed to fetch reminders', details: message }, { status: 500 });
  }
}
