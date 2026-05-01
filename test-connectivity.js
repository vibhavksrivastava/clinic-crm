// Simple connectivity test

async function test() {
  try {
    const res = await fetch('http://localhost:3000/login');
    console.log('Status:', res.status);
    console.log('OK');
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

test();
