// Test roles endpoint

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
    console.log('✓ Logged in\n');

    console.log('🎭 Getting roles...');
    const rolesRes = await fetch(`${API_URL}/admin/roles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Status:', rolesRes.status);
    console.log('Content-Type:', rolesRes.headers.get('content-type'));
    
    const rolesText = await rolesRes.text();
    console.log('Response preview:', rolesText.substring(0, 200));
    
    try {
      const rolesData = JSON.parse(rolesText);
      console.log('\n✓ Roles parsed successfully');
      console.log('Total roles:', rolesData.roles?.length || rolesData.length || 0);
      if (rolesData.roles && rolesData.roles.length > 0) {
        console.log('First role:', rolesData.roles[0].name);
      }
    } catch (e) {
      console.error('\n❌ Failed to parse JSON');
      console.error('Full response:', rolesText);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
