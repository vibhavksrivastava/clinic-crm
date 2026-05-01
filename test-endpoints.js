// Test different endpoints to find which one is broken

async function testEndpoints() {
  const endpoints = [
    '/login',
    '/api/auth',
    '/api/admin/staff',
    '/api/admin/organizations',
    '/api/admin/roles',
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`http://localhost:3000${endpoint}`, { method: 'GET' });
      console.log(`${endpoint}: ${res.status}`);
    } catch (error) {
      console.log(`${endpoint}: CONNECTION ERROR`);
    }
  }
}

testEndpoints();
