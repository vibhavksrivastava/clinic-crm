// Simple test: check if system roles actually exist in the database

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
    if (!loginRes.ok) {
      console.error('❌ Login failed:', loginData);
      return;
    }

    const token = loginData.token;
    console.log('✓ Logged in\n');

    // Check system roles
    console.log('🔍 Checking system roles...');
    const rolesRes = await fetch(`${API_URL}/admin/roles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!rolesRes.ok) {
      console.error('❌ Roles fetch failed:', rolesRes.status);
      return;
    }

    const rolesData = await rolesRes.json();
    console.log(`✓ Found ${rolesData.roles.length} roles\n`);

    // Show roles with IDs
    console.log('System Roles:');
    rolesData.roles.forEach((role, i) => {
      if (role.is_system_role) {
        console.log(`  ${i + 1}. ${role.name}`);
        console.log(`     ID: ${role.id}`);
        console.log(`     Type: ${role.role_type}`);
      }
    });

    // Now try to use one of these role IDs to create staff
    console.log('\n👥 Testing staff creation with first role...');
    const firstRole = rolesData.roles.find(r => r.is_system_role);
    
    if (!firstRole) {
      console.error('❌ No system roles found!');
      return;
    }

    const orgsRes = await fetch(`${API_URL}/admin/organizations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const orgsData = await orgsRes.json();
    const org = orgsData.organizations[0];

    if (!org) {
      console.error('❌ No organization found!');
      return;
    }

    console.log(`Using role: ${firstRole.name} (${firstRole.id})`);
    console.log(`Using org: ${org.name}\n`);

    const staffRes = await fetch(`${API_URL}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        first_name: 'Test',
        last_name: 'User',
        email: `test-${Date.now()}@example.com`,
        phone: '+1234567890',
        organization_id: org.id,
        branch_id: null,
        role_id: firstRole.id,
        password: 'TestPassword123!'
      })
    });

    const staffData = await staffRes.json();
    
    if (!staffRes.ok) {
      console.error('❌ Staff creation failed:');
      console.error(`   Status: ${staffRes.status}`);
      console.error(`   Error: ${staffData.error}`);
      return;
    }

    console.log('✅ Staff created successfully!');
    console.log(`   ID: ${staffData.user.id}`);
    console.log(`   Email: ${staffData.user.email}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
