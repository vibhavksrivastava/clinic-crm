// Check what roles actually exist in database

const API_URL = 'http://localhost:3000/api';

async function test() {
  try {
    console.log('🔑 Login as admin...');
    const loginRes = await fetch(`${API_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@clinic.com',
        password: 'demo123'
      })
    });

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✓ Logged in\n');

    console.log('📋 Fetching all roles from database...');
    const rolesRes = await fetch(`${API_URL}/admin/roles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const rolesData = await rolesRes.json();
    console.log('\nRoles found:');
    console.log(JSON.stringify(rolesData.roles, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
