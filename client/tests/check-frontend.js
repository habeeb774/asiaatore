// Check if frontend can reach API
console.log('Checking frontend API connection...');

// Test API endpoints
const tests = [
  { name: 'Health Check', url: '/api/auth/me', method: 'GET' },
  { name: 'Login', url: '/api/auth/login', method: 'POST', body: { identifier: 'admin@example.com', password: 'admin123' } }
];

async function runTests() {
  for (const test of tests) {
    try {
      const options = {
        method: test.method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (test.body) {
        options.body = JSON.stringify(test.body);
      }
      
      console.log(`Testing ${test.name}: ${test.url}`);
      const response = await fetch(test.url, options);
      const data = await response.json();
      
      console.log(`✅ ${test.name} - Status: ${response.status}`);
      console.log('Response:', data);
    } catch (error) {
      console.error(`❌ ${test.name} - Error:`, error.message);
    }
  }
}

// Check if we're in browser
if (typeof window !== 'undefined') {
  window.runAPITests = runTests;
  console.log('API tests ready. Run window.runAPITests() in console to test.');
} else {
  runTests();
}
