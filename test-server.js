// Test if server is actually working by fetching HTML pages

async function test() {
  try {
    // Test HTML page
    console.log('Testing /login (HTML page)...');
    const loginRes = await fetch('http://localhost:3000/login');
    console.log(`/login: ${loginRes.status} (${loginRes.headers.get('content-type')})`);

    // Test API health
    console.log('\nTesting /api/admin/staff (API)...');
    const apiRes = await fetch('http://localhost:3000/api/admin/staff', {
      headers: { 'Authorization': 'Bearer invalid' }
    });
    console.log(`/api/admin/staff: ${apiRes.status} (${apiRes.headers.get('content-type')})`);
    const text = await apiRes.text();
    console.log('Response:', text.substring(0, 50));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
