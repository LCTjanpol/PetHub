// File: test-api.js
// Description: Script to test API endpoints and verify connectivity

const axios = require('axios');

// Test configuration
const API_BASE = 'http://localhost:3000/api'; // Change this to your backend URL
const TEST_TOKEN = 'your-test-token-here'; // Replace with a valid token

// Test endpoints
const endpoints = {
  posts: `${API_BASE}/post`,
  comments: `${API_BASE}/posts/1/comments`,
  like: `${API_BASE}/posts/1/like`,
};

async function testEndpoint(name, url, method = 'GET', data = null) {
  try {
    console.log(`\n🧪 Testing ${name}: ${method} ${url}`);
    
    const config = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ ${name} - Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    
  } catch (error) {
    console.log(`❌ ${name} - Error: ${error.response?.status || error.code}`);
    if (error.response?.data) {
      console.log(`   Error details:`, error.response.data);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting API endpoint tests...\n');
  
  // Test GET posts
  await testEndpoint('List Posts', endpoints.posts, 'GET');
  
  // Test POST comment
  await testEndpoint('Add Comment', endpoints.comments, 'POST', {
    content: 'Test comment from API test script'
  });
  
  // Test POST like
  await testEndpoint('Toggle Like', endpoints.like, 'POST');
  
  console.log('\n🏁 API tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };
