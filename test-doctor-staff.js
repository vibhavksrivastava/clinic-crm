// Test staff creation with Doctor role

const API_URL = 'http://localhost:3000/api';

async function test() {
  try {
    console.log('🔑 Login...');
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

    console.log('\n🏢 Get org and roles...');
    const orgsRes = await fetch(`${API_URL}/admin/organizations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const orgsData = await orgsRes.json();
    const org = orgsData.organizations[0];

    const rolesRes = await fetch(`${API_URL}/admin/roles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const rolesData = await rolesRes.json();
    const doctorRole = rolesData.roles.find((r) => r.role_type === 'doctor');

    console.log('Organization:', org.name, '(' + org.id + ')');
    console.log('Role: Doctor (' + doctorRole.id + ')');

    console.log('\n👥 Try creating staff with Doctor role...');
    const staffRes = await fetch(`${API_URL}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'Smith',
        email: `doc-${Date.now()}@test.com`,
        phone: '+1234567890',
        organization_id: org.id,
        branch_id: null,
        role_id: doctorRole.id,
        password: 'TestPass123!'
      })
    });

    const staffData = await staffRes.json();
    
    if (!staffRes.ok) {
      console.error('❌ Failed:', staffData.error);
      return;
    }

    console.log('✓ Success! Created staff:');
    console.log('  ID:', staffData.user.id);
    console.log('  Name:', staffData.user.first_name, staffData.user.last_name);
    console.log('  Email:', staffData.user.email);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
