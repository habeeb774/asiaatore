// Test admin login
import fetch from 'node-fetch';

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await fetch('http://localhost:4003/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:4003'
      },
      body: JSON.stringify({
        identifier: 'admin@example.com',
        password: 'admin123'
      })
    });

    const data = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', data);

    if (response.ok) {
      const jsonData = JSON.parse(data);
      console.log('✅ Login successful!');
      console.log('Token:', jsonData.token);
      console.log('User role:', jsonData.user.role);
      
      // Test admin reviews API with the token
      console.log('\nTesting admin reviews API...');
      const reviewsResponse = await fetch('http://localhost:4003/api/admin/reviews', {
        headers: {
          'Authorization': `Bearer ${jsonData.token}`,
          'Origin': 'http://localhost:4003'
        }
      });

      const reviewsData = await reviewsResponse.text();
      console.log('Reviews API Status:', reviewsResponse.status);
      console.log('Reviews API Response:', reviewsData);
      
    } else {
      console.log('❌ Login failed');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAdminLogin();
