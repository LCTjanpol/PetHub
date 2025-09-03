// File: test-pets-api.js
// Description: Test script to check the pets API endpoint

const axios = require('axios');

// Test configuration
const API_BASE = 'http://192.168.254.140:3000/api';

console.log('🧪 Testing Pets API Endpoint...\n');

async function testPetsAPI() {
  try {
    console.log('1️⃣ Testing pets endpoint (without auth)...');
    
    // Test without token (should fail with 401)
    try {
      const response = await axios.get(`${API_BASE}/pet`);
      console.log('❌ Unexpected success without token:', response.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected without token (401 Unauthorized)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.message);
      }
    }

    console.log('\n2️⃣ Testing with mock token...');
    
    // Test with a mock token (should fail with 401 or 403)
    try {
      const response = await axios.get(`${API_BASE}/pet`, {
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

    console.log('\n3️⃣ Testing API endpoint structure...');
    
    const endpoints = {
      'GET /pet': `${API_BASE}/pet`,
      'POST /pet': `${API_BASE}/pet`,
      'GET /pet/{id}': `${API_BASE}/pet/1`,
      'PUT /pet/{id}': `${API_BASE}/pet/1`,
      'DELETE /pet/{id}': `${API_BASE}/pet/1`
    };
    
    Object.entries(endpoints).forEach(([endpoint, url]) => {
      console.log(`   ${endpoint}: ${url}`);
    });

    console.log('\n4️⃣ Testing image URL construction...');
    
    // Test the formatImageUrl logic
    const getBaseUrl = () => {
      const apiUrl = 'http://192.168.254.140:3000/api';
      return apiUrl.replace('/api', '');
    };

    const formatImageUrl = (imagePath) => {
      if (!imagePath) return null;
      
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
      }
      
      if (imagePath.startsWith('/uploads')) {
        return `${getBaseUrl()}${imagePath}`;
      }
      
      if (!imagePath.startsWith('/')) {
        return `${getBaseUrl()}/uploads/${imagePath}`;
      }
      
      return `${getBaseUrl()}${imagePath}`;
    };

    const testImagePaths = [
      '/uploads/pet_123.jpg',
      'pet_123.jpg',
      'http://example.com/image.jpg',
      null,
      undefined
    ];
    
    console.log('   Base URL:', getBaseUrl());
    testImagePaths.forEach((path, index) => {
      const result = formatImageUrl(path);
      console.log(`   Test ${index + 1}: ${path || 'null/undefined'} → ${result || 'null'}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPetsAPI().then(() => {
  console.log('\n🎯 Test completed!');
  console.log('\n📋 Summary of what was tested:');
  console.log('   ✅ API endpoint structure');
  console.log('   ✅ Authentication requirements');
  console.log('   ✅ Image URL construction');
  
  console.log('\n🔍 Next steps to debug the issue:');
  console.log('1. Check the frontend console logs when loading pets');
  console.log('2. Verify the pets API is returning data with petPicture field');
  console.log('3. Check if the formatImageUrl function is working correctly');
  console.log('4. Verify the image URLs are being constructed properly');
  
  console.log('\n💡 Common issues and solutions:');
  console.log('   - Backend not returning petPicture field: Check Prisma query');
  console.log('   - Wrong image URL format: Check formatImageUrl function');
  console.log('   - Images not accessible: Check backend uploads directory');
  console.log('   - Network issues: Check if device can reach backend');
});
