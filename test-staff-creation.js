// Test script to diagnose staff creation issue

const API_URL = 'http://localhost:3000/api';

async function test() {
  try {
    console.log('🔑 Step 1: Login as admin...');
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
    console.log('✓ Login successful, token:', token.substring(0, 30) + '...');

    console.log('\n🏢 Step 2: Get organizations...');
    const orgsRes = await fetch(`${API_URL}/admin/organizations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const orgsData = await orgsRes.json();
    if (!orgsRes.ok) {
      console.error('❌ Failed to get organizations:', orgsData);
      return;
    }

    if (!orgsData.organizations || orgsData.organizations.length === 0) {
      console.error('❌ No organizations found');
      return;
    }

    const org = orgsData.organizations[0];
    console.log('✓ Found organization:', org.name, '(ID:', org.id + ')');

    console.log('\n🎭 Step 3: Get roles...');
    const rolesRes = await fetch(`${API_URL}/admin/roles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const rolesData = await rolesRes.json();
    if (!rolesRes.ok) {
      console.error('❌ Failed to get roles:', rolesData);
      return;
    }

    if (!rolesData.roles || rolesData.roles.length === 0) {
      console.error('❌ No roles found');
      return;
    }

    const role = rolesData.roles[0];
    console.log('✓ Found role:', role.name, '(ID:', role.id + ')');

    console.log('\n👥 Step 4: Create staff member...');
    const staffRes = await fetch(`${API_URL}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        first_name: 'Test',
        last_name: 'Doctor',
        email: `doctor-${Date.now()}@test.com`,
        phone: '+1234567890',
        organization_id: org.id,
        branch_id: null,
        role_id: role.id,
        password: 'TestPass123!'
      })
    });

    const staffData = await staffRes.json();
    
    if (!staffRes.ok) {
      console.error('❌ Staff creation failed:');
      console.error('Status:', staffRes.status);
      console.error('Error:', staffData.error);
      if (staffData.details) {
        console.error('Details:', JSON.stringify(staffData.details, null, 2));
      }
      console.error('Full response:', JSON.stringify(staffData, null, 2));
      return;
    }

    console.log('✓ Staff created successfully!');
    console.log('User ID:', staffData.user.id);
    console.log('Email:', staffData.user.email);

  } catch (error) {
    console.error('🔥 Error:', error.message);
  }
}

test();
