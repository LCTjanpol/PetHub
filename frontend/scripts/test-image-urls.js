// File: test-image-urls.js
// Description: Test script to verify image URL formatting

// Mock the environment variable
process.env.EXPO_PUBLIC_API_URL = 'http://192.168.254.140:3000/api';

// Mock the formatImageUrl function logic
const getBaseUrl = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.254.140:3000/api';
  // Remove /api suffix to get base URL
  return apiUrl.replace('/api', '');
};

const formatImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it starts with /uploads, prepend the base URL
  if (imagePath.startsWith('/uploads')) {
    return `${getBaseUrl()}${imagePath}`;
  }
  
  // If it doesn't start with /, assume it's a relative path
  if (!imagePath.startsWith('/')) {
    return `${getBaseUrl()}/uploads/${imagePath}`;
  }
  
  // Default case: prepend base URL
  return `${getBaseUrl()}${imagePath}`;
};

console.log('🧪 Testing Image URL Formatting...\n');

// Test cases
const testCases = [
  '/uploads/pet_123.jpg',
  'pet_123.jpg',
  'http://example.com/image.jpg',
  'https://example.com/image.jpg',
  '/uploads/shop_123.jpg',
  'shop_123.jpg',
  null,
  undefined,
  '',
  'uploads/pet_123.jpg'
];

console.log('Base URL:', getBaseUrl());
console.log('API URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('');

testCases.forEach((testCase, index) => {
  const result = formatImageUrl(testCase);
  console.log(`Test ${index + 1}:`);
  console.log(`  Input: ${testCase || 'null/undefined'}`);
  console.log(`  Output: ${result || 'null'}`);
  console.log('');
});

console.log('🎯 Test completed!');
console.log('\n📋 Expected behavior:');
console.log('  - /uploads/pet_123.jpg → http://192.168.254.140:3000/uploads/pet_123.jpg');
console.log('  - pet_123.jpg → http://192.168.254.140:3000/uploads/pet_123.jpg');
console.log('  - http://example.com/image.jpg → http://example.com/image.jpg (unchanged)');
console.log('  - null/undefined → null');
