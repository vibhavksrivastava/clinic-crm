import { supabase } from '@/lib/db/client';

export interface ReminderMessage {
  appointment_id: string;
  type: 'doctor' | 'patient';
  title: string;
  message: string;
  appointment_date: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  doctor?: {
    id: string;
    first_name: string;
    last_name: string;
    specialization?: string;
  };
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function pad(num: number) {
  return num.toString().padStart(2, '0');
}

function formatLocalTimestamp(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getStartOfTomorrow() {
  const tomorrow = getStartOfToday();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

export async function fetchDoctorDailyReminders(
  doctorId: string,
  organizationId?: string,
  branchId?: string
): Promise<ReminderMessage[]> {
  const start = formatLocalTimestamp(getStartOfToday());
  const end = formatLocalTimestamp(getStartOfTomorrow());

  let query = supabase
    .from('appointments')
    .select('*, patients(id, first_name, last_name, email, phone), users!user_id(id, first_name, last_name, specialization)')
    .eq('user_id', doctorId)
    .in('status', ['scheduled', 'ongoing'])
    .gte('appointment_date', start)
    .lt('appointment_date', end)
    .order('appointment_date', { ascending: true });

  if (organizationId) query = query.eq('organization_id', organizationId);
  if (branchId) query = query.eq('branch_id', branchId);

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  const appointments = Array.isArray(data) ? data : [];

  if (appointments.length === 0) {
    return [
      {
        appointment_id: 'doctor-daily-summary',
        type: 'doctor',
        title: 'Daily Appointment Reminder',
        message: 'You have no scheduled appointments for today.',
        appointment_date: new Date().toISOString(),
      },
    ];
  }

  const summary = `You have ${appointments.length} appointment${appointments.length > 1 ? 's' : ''} scheduled for today.`;
  const details = appointments
    .map((apt: any, index: number) => {
      const patientName = apt.patients
        ? `${apt.patients.first_name} ${apt.patients.last_name}`
        : 'Unknown patient';
      const time = formatTime(apt.appointment_date);
      const type = apt.appointment_type || 'appointment';
      return `${index + 1}. ${time} — ${patientName} (${type})`;
    })
    .join('\n');

  return [
    {
      appointment_id: 'doctor-daily-summary',
      type: 'doctor',
      title: 'Daily Appointment Reminder',
      message: `${summary}\n${details}`,
      appointment_date: new Date().toISOString(),
    },
  ];
}

export async function fetchPatientPreHourReminders(
  patientId: string,
  organizationId?: string,
  branchId?: string
): Promise<ReminderMessage[]> {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  let query = supabase
    .from('appointments')
    .select('*, patients(id, first_name, last_name, email, phone), users!user_id(id, first_name, last_name, specialization)')
    .eq('patient_id', patientId)
    .in('status', ['scheduled', 'ongoing'])
    .gte('appointment_date', formatLocalTimestamp(now))
    .lte('appointment_date', formatLocalTimestamp(oneHourLater))
    .order('appointment_date', { ascending: true });

  if (organizationId) query = query.eq('organization_id', organizationId);
  if (branchId) query = query.eq('branch_id', branchId);

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  const appointments = Array.isArray(data) ? data : [];

  return appointments.map((apt: any) => {
    const appointmentTime = new Date(apt.appointment_date);
    const minutesUntil = Math.max(
      0,
      Math.round((appointmentTime.getTime() - now.getTime()) / 60000)
    );
    const doctorName = apt.users
      ? `${apt.users.first_name} ${apt.users.last_name}`
      : 'your doctor';
    const patientName = apt.patients
      ? `${apt.patients.first_name} ${apt.patients.last_name}`
      : 'Patient';

    return {
      appointment_id: apt.id,
      type: 'patient',
      title: 'Appointment Reminder',
      message: `${patientName}, you have an appointment with Dr. ${doctorName} at ${formatTime(apt.appointment_date)} (${minutesUntil} minute${minutesUntil === 1 ? '' : 's'} from now). Please arrive on time.`,
      appointment_date: apt.appointment_date,
      patient: apt.patients,
      doctor: apt.users,
    };
  });
}
