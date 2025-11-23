// Test frontend login
// Run this in browser console when the app is open

console.log('🔍 Testing Frontend Login...');

// Test 1: Check if AuthContext is available
if (typeof window !== 'undefined') {
  // Try to access auth context (might need to find the component)
  console.log('1. Checking for auth context...');
  
  // Test 2: Try dev login
  setTimeout(() => {
    console.log('2. Testing dev login...');
    // Look for any global auth object or try to find it via React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) { // Check if hook exists
      console.log('React DevTools found');
    }
    
    // Test 3: Check localStorage
    console.log('3. Checking localStorage...');
    const token = localStorage.getItem('my_store_token');
    const user = localStorage.getItem('my_store_user');
    console.log('Token exists:', !!token);
    console.log('User exists:', !!user);
    
    // Test 4: Try API call
    console.log('4. Testing API call...');
    fetch('/api/auth/me', {
      credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
      console.log('Current user response:', data);
    })
    .catch(error => {
      console.error('API call failed:', error);
    });
    
    // Test 5: Try login
    console.log('5. Testing login endpoint...');
    fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        identifier: 'admin@example.com',
        password: 'admin123'
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Login response:', data);
      if (data.ok) {
        console.log('✅ Login successful!');
        localStorage.setItem('my_store_token', data.accessToken);
        localStorage.setItem('my_store_user', JSON.stringify(data.user));
        console.log('Token and user saved to localStorage');
      }
    })
    .catch(error => {
      console.error('Login failed:', error);
    });
  }, 1000);
}
