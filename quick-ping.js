// Ultra-simple connectivity test with timeout

async function quickTest() {
  try {
    console.log('Testing connection to http://localhost:3000');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const res = await fetch('http://localhost:3000/login', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log(`Status: ${res.status}`);
    console.log(`Server is responding`);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Timeout: Server not responding after 3 seconds');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

quickTest();
