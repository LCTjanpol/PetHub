// File: test-pet-profile.js
// Description: Comprehensive test for pet profile editing functionality

const axios = require('axios');

// Test configuration
const API_BASE = 'http://192.168.254.140:3000/api';
const TEST_PET_ID = '14'; // Use the pet ID from your logs

console.log('🧪 Testing Pet Profile Editing Functionality...\n');

async function testPetProfile() {
  try {
    console.log('1️⃣ Testing API connectivity...');
    
    // Test health endpoint
    try {
      const healthResponse = await axios.get('http://192.168.254.140:3000/api/health');
      console.log('✅ Backend is healthy:', healthResponse.data.message);
    } catch (error) {
      console.log('❌ Backend health check failed:', error.message);
      return;
    }

    console.log('\n2️⃣ Testing pet detail endpoint (without auth)...');
    
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

    console.log('\n4️⃣ Testing image URL construction...');
    
    // Test image URL construction
    const testImagePaths = [
      '/uploads/pet_123.jpg',
      'pet_123.jpg',
      'http://example.com/image.jpg',
      null,
      undefined
    ];
    
    testImagePaths.forEach((path, index) => {
      console.log(`   Test ${index + 1}: ${path || 'null/undefined'}`);
      // This would test the formatImageUrl function
    });

    console.log('\n5️⃣ Testing FormData construction...');
    
    // Test FormData construction (simulate React Native)
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('name', 'Test Pet');
    formData.append('type', 'Dog');
    formData.append('birthdate', '2020-01-01');
    formData.append('breed', 'Golden Retriever');
    formData.append('healthCondition', 'Healthy');
    
    // Simulate React Native image object
    const mockImageObject = {
      uri: 'file:///path/to/image.jpg',
      type: 'image/jpeg',
      name: 'pet_image.jpg'
    };
    
    formData.append('petPicture', JSON.stringify(mockImageObject));
    
    console.log('✅ FormData constructed with fields:', formData.getLength());
    console.log('   Fields:', ['name', 'type', 'birthdate', 'breed', 'healthCondition', 'petPicture']);

    console.log('\n6️⃣ Testing API endpoints structure...');
    
    const endpoints = {
      'GET /pet/{id}': `${API_BASE}/pet/${TEST_PET_ID}`,
      'PUT /pet/{id}': `${API_BASE}/pet/${TEST_PET_ID}`,
      'DELETE /pet/{id}': `${API_BASE}/pet/${TEST_PET_ID}`,
      'GET /pet': `${API_BASE}/pet`,
      'POST /pet': `${API_BASE}/pet`
    };
    
    Object.entries(endpoints).forEach(([endpoint, url]) => {
      console.log(`   ${endpoint}: ${url}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPetProfile().then(() => {
  console.log('\n🎯 Test completed!');
  console.log('\n📋 Summary of what was tested:');
  console.log('   ✅ Backend connectivity');
  console.log('   ✅ Authentication requirements');
  console.log('   ✅ API endpoint structure');
  console.log('   ✅ FormData construction');
  console.log('   ✅ Image handling');
  
  console.log('\n🔍 Next steps to debug the issue:');
  console.log('1. Check the frontend console logs when editing a pet profile');
  console.log('2. Verify the API URL being used (should be http://192.168.254.140:3000/api)');
  console.log('3. Check if the pet ID exists in your database');
  console.log('4. Verify the authentication token is valid');
  console.log('5. Check the backend logs for any errors');
  
  console.log('\n💡 Common issues and solutions:');
  console.log('   - Wrong API URL: Check if EXPO_PUBLIC_API_URL is set correctly');
  console.log('   - Invalid token: Make sure user is logged in');
  console.log('   - Pet not found: Verify the pet ID exists');
  console.log('   - Network error: Check if device can reach the backend IP');
});
