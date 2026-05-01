// Test appointments endpoint after changes
const API_URL = 'http://localhost:3000/api';

async function test() {
  try {
    // Test login
    const loginRes = await fetch(`${API_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@clinic.com',
        password: 'demo123'
      })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.error('❌ Login failed:', loginData);
      return;
    }

    const token = loginData.token;
    console.log('✓ Logged in\n');

    // Test appointments endpoint
    console.log('Testing /api/appointments...');
    const appointmentsRes = await fetch(`${API_URL}/appointments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!appointmentsRes.ok) {
      console.error(`❌ Appointments fetch failed: ${appointmentsRes.status}`);
      console.error(await appointmentsRes.text());
      return;
    }

    const appointments = await appointmentsRes.json();
    console.log(`✓ Appointments endpoint working - Found ${Array.isArray(appointments) ? appointments.length : 'unknown'} appointments`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
