import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { fetchDoctorDailyReminders } from '@/lib/appointmentReminders';
import { sendWhatsAppMessage } from '@/lib/messaging';

export async function POST(request: NextRequest) {
  try {
    // Security check for cron requests
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all doctors with phone numbers
    const { data: doctors, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, phone, roles!inner(role_type)')
      .eq('roles.role_type', 'doctor')
      .not('phone', 'is', null);

    if (error) {
      console.error('Error fetching doctors:', error);
      return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
    }

    if (!doctors || doctors.length === 0) {
      return NextResponse.json({ message: 'No doctors with phone numbers found' });
    }

    const results = [];

    for (const doctor of doctors) {
      try {
        // Fetch today's reminders for this doctor
        const reminders = await fetchDoctorDailyReminders(doctor.id);

        if (reminders && reminders.length > 0 && reminders[0].message !== 'You have no scheduled appointments for today.') {
          // Format the message
          const messageBody = `Good morning Dr. ${doctor.first_name} ${doctor.last_name}!\n\n${reminders[0].message}`;

          // Send WhatsApp message
          let phoneNumber = doctor.phone;
          
          if (!phoneNumber.startsWith('+')) {
            // Assume Indian numbers - add +91 prefix for 10-digit numbers
            if (phoneNumber.length === 10 && /^\d{10}$/.test(phoneNumber)) {
              phoneNumber = '+91' + phoneNumber;
            } else {
              phoneNumber = '+' + phoneNumber;
            }
          }
          
          const messageSid = await sendWhatsAppMessage(phoneNumber, messageBody);

          results.push({
            doctor: `${doctor.first_name} ${doctor.last_name}`,
            phone: doctor.phone,
            appointments: reminders.length > 0 ? reminders[0].message.split('\n').length - 2 : 0, // rough count
            messageSid
          });
        } else {
          results.push({
            doctor: `${doctor.first_name} ${doctor.last_name}`,
            phone: doctor.phone,
            appointments: 0,
            message: 'No appointments today'
          });
        }
      } catch (err) {
        console.error(`Error sending to ${doctor.first_name}:`, err);
        results.push({
          doctor: `${doctor.first_name} ${doctor.last_name}`,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: 'Reminders sent',
      results
    });

  } catch (error) {
    console.error('Error in send-reminders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}