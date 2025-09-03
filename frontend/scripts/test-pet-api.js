// File: test-pet-api.js
// Description: Test script to verify pet API endpoints

const axios = require('axios');

// Test configuration
const API_BASE = 'http://192.168.254.140:3000/api';
const TEST_PET_ID = '14'; // Use the pet ID from your logs

console.log('🧪 Testing Pet API Endpoints...\n');

async function testPetAPI() {
  try {
    console.log('1️⃣ Testing GET /pet/{id} endpoint...');
    
    // Test without token (should fail with 401)
    try {
      const response = await axios.get(`${API_BASE}/pet/${TEST_PET_ID}`);
      console.log('❌ Unexpected success without token:', response.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected without token (401 Unauthorized)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.message);
      }
    }

    console.log('\n2️⃣ Testing API base URL...');
    console.log(`API Base: ${API_BASE}`);
    console.log(`Full URL: ${API_BASE}/pet/${TEST_PET_ID}`);
    
    // Test if the backend is reachable
    try {
      const healthCheck = await axios.get('http://192.168.254.140:3000/api/health', { timeout: 5000 });
      console.log('✅ Backend is reachable');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Backend connection refused - server may not be running');
      } else if (error.code === 'ENOTFOUND') {
        console.log('❌ Backend host not found - check IP address');
      } else {
        console.log('❌ Backend error:', error.message);
      }
    }

    console.log('\n3️⃣ Testing with mock token...');
    
    // Test with a mock token (should fail with 401 or 403)
    try {
      const response = await axios.get(`${API_BASE}/pet/${TEST_PET_ID}`, {
        headers: { Authorization: 'Bearer mock_token_123' }
      });
      console.log('❌ Unexpected success with mock token:', response.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected with invalid token (401 Unauthorized)');
      } else if (error.response?.status === 403) {
        console.log('✅ Correctly rejected with invalid token (403 Forbidden)');
      } else {
        console.log('❌ Unexpected error with mock token:', error.response?.status, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPetAPI().then(() => {
  console.log('\n🎯 Test completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Make sure backend is running on http://192.168.254.140:3000');
  console.log('2. Check if you can access the backend from your device');
  console.log('3. Verify the pet ID exists in your database');
  console.log('4. Check the frontend console for detailed error logs');
});
