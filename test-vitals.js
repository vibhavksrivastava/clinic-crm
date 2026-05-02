const fetch = require('node-fetch');

async function testVitals() {
  try {
    // First, get an active appointment
    const appointmentsRes = await fetch('http://localhost:3000/api/appointments?include_details=true');
    const appointments = await appointmentsRes.json();
    
    console.log('Appointments response:', appointments);
    
    if (!Array.isArray(appointments) || appointments.length === 0) {
      console.log('No appointments found');
      return;
    }
    
    const ongoingAppointment = appointments.find(apt => apt.status === 'ongoing');
    if (!ongoingAppointment) {
      console.log('No ongoing appointments found. Using first appointment:', appointments[0].id);
    }
    
    const appointmentId = ongoingAppointment?.id || appointments[0].id;
    console.log('Testing vitals save for appointment:', appointmentId);
    
    // Test saving vitals
    const vitalsRes = await fetch('http://localhost:3000/api/appointments/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointment_id: appointmentId,
        vitals: {
          blood_pressure_systolic: 120,
          blood_pressure_diastolic: 80,
          heart_rate: 72,
          temperature: 98.6,
          oxygen_saturation: 98,
          weight: 70.5,
          height: 175,
          temperature_unit: 'F',
          weight_unit: 'kg',
          height_unit: 'cm',
        },
      }),
    });
    
    const vitalsData = await vitalsRes.json();
    console.log('Vitals response status:', vitalsRes.status);
    console.log('Vitals response:', vitalsData);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testVitals();
