// Comprehensive verification test
// This tests the full staff creation workflow to confirm the foreign key issue is resolved

const API_URL = 'http://localhost:3000/api';

async function runFullTest() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   STAFF CREATION VERIFICATION TEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Authentication
    console.log('📝 Step 1: Authentication');
    console.log('   Testing login with admin@clinic.com...');
    const loginRes = await fetch(`${API_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@clinic.com',
        password: 'demo123'
      })
    });

    if (!loginRes.ok) {
      console.error('   ❌ FAILED: Could not authenticate');
      return;
    }

    const { token } = await loginRes.json();
    console.log('   ✓ Authentication successful\n');

    // Step 2: Fetch roles
    console.log('📝 Step 2: Fetch System Roles');
    console.log('   Retrieving roles from /api/admin/roles...');
    const rolesRes = await fetch(`${API_URL}/admin/roles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!rolesRes.ok) {
      console.error('   ❌ FAILED: Could not fetch roles');
      return;
    }

    const { roles } = await rolesRes.json();
    const systemRoles = roles.filter(r => r.is_system_role);
    console.log(`   ✓ Found ${roles.length} total roles (${systemRoles.length} system roles)\n`);

    // Step 3: Get organization
    console.log('📝 Step 3: Fetch Organization');
    console.log('   Retrieving organization...');
    const orgsRes = await fetch(`${API_URL}/admin/organizations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const { organizations } = await orgsRes.json();
    const org = organizations[0];
    console.log(`   ✓ Using organization: ${org.name} (${org.id})\n`);

    // Step 4: Test staff creation with each role type
    console.log('📝 Step 4: Create Staff with Different Roles');
    
    const testRoles = [
      roles.find(r => r.role_type === 'doctor'),
      roles.find(r => r.role_type === 'receptionist'),
      roles.find(r => r.role_type === 'nurse'),
    ];

    let successCount = 0;
    for (const role of testRoles) {
      if (!role) continue;

      const email = `test-${role.role_type}-${Date.now()}@example.com`;
      console.log(`\n   Creating staff with role: ${role.name}`);
      console.log(`   Role ID: ${role.id}`);
      console.log(`   Email: ${email}`);

      const staffRes = await fetch(`${API_URL}/admin/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: 'Test',
          last_name: role.role_type.charAt(0).toUpperCase() + role.role_type.slice(1),
          email: email,
          phone: '+1234567890',
          organization_id: org.id,
          branch_id: null,
          role_id: role.id,
          password: 'TestPassword123!'
        })
      });

      if (!staffRes.ok) {
        const error = await staffRes.json();
        console.error(`   ❌ FAILED: ${error.error}`);
        continue;
      }

      const { user } = await staffRes.json();
      console.log(`   ✓ SUCCESS: Created staff user ${user.id}`);
      successCount++;
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`   RESULT: ${successCount}/${testRoles.length} staff created successfully`);
    console.log('═══════════════════════════════════════════════════════════');
    
    if (successCount === testRoles.length) {
      console.log('\n✅ ALL TESTS PASSED');
      console.log('   The staff creation foreign key issue has been RESOLVED!');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS');
      console.log(`   ${testRoles.length - successCount} roles failed`);
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
}

runFullTest();
