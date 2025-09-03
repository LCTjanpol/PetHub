// File: test-formdata.js
// Description: Test script to verify FormData construction with image files

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing FormData construction...\n');

// Simulate the same logic used in the React Native app
function testFormDataConstruction() {
  const formData = new FormData();
  
  // Add text fields (same as the app)
  formData.append('name', 'Test Pet');
  formData.append('birthdate', '2020-01-01');
  formData.append('type', 'Dog');
  formData.append('breed', 'Golden Retriever');
  formData.append('healthCondition', 'Healthy');
  
  // Test case 1: New image (simulate ImagePicker result)
  const profileImage = '/path/to/new/image.jpg';
  const pet = { petPicture: '/uploads/old_image.jpg' };
  
  console.log('📸 Test Case 1: New image upload');
  console.log('profileImage:', profileImage);
  console.log('pet.petPicture:', pet.petPicture);
  
  if (profileImage && !profileImage.startsWith('/uploads') && !profileImage.startsWith('http')) {
    // New local image from ImagePicker
    const imageFile = {
      uri: profileImage,
      type: 'image/jpeg',
      name: `pet_${Date.now()}.jpg`,
    };
    formData.append('petPicture', imageFile);
    console.log('✅ New image added to FormData:', imageFile);
  } else {
    // Existing image or no change
    formData.append('petPicture', profileImage || pet.petPicture || '');
    console.log('✅ Existing image or no change:', profileImage || pet.petPicture);
  }
  
  console.log('\n📋 FormData contents:');
  for (let pair of formData.entries()) {
    console.log(`  ${pair[0]}: ${pair[1]}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test case 2: Image removal
  console.log('🗑️ Test Case 2: Image removal');
  const formData2 = new FormData();
  
  // Add text fields
  formData2.append('name', 'Test Pet');
  formData2.append('birthdate', '2020-01-01');
  formData2.append('type', 'Dog');
  formData2.append('breed', 'Golden Retriever');
  formData2.append('healthCondition', 'Healthy');
  
  const profileImage2 = null; // User removed image
  
  if (profileImage2 === null) {
    formData2.append('petPicture', '');
    console.log('✅ Image removed, sending empty string');
  }
  
  console.log('\n📋 FormData contents (removal):');
  for (let pair of formData2.entries()) {
    console.log(`  ${pair[0]}: ${pair[1]}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test case 3: No image change
  console.log('🔄 Test Case 3: No image change');
  const formData3 = new FormData();
  
  // Add text fields
  formData3.append('name', 'Test Pet');
  formData3.append('birthdate', '2020-01-01');
  formData3.append('type', 'Dog');
  formData3.append('breed', 'Golden Retriever');
  formData3.append('healthCondition', 'Healthy');
  
  const profileImage3 = '/uploads/existing_image.jpg'; // Same as existing
  const pet3 = { petPicture: '/uploads/existing_image.jpg' };
  
  if (profileImage3 && !profileImage3.startsWith('/uploads') && !profileImage3.startsWith('http')) {
    // New local image from ImagePicker
    const imageFile = {
      uri: profileImage3,
      type: 'image/jpeg',
      name: `pet_${Date.now()}.jpg`,
    };
    formData3.append('petPicture', imageFile);
    console.log('✅ New image added to FormData:', imageFile);
  } else {
    // Existing image or no change
    formData3.append('petPicture', profileImage3 || pet3.petPicture || '');
    console.log('✅ Existing image or no change:', profileImage3 || pet3.petPicture);
  }
  
  console.log('\n📋 FormData contents (no change):');
  for (let pair of formData3.entries()) {
    console.log(`  ${pair[0]}: ${pair[1]}`);
  }
}

// Run the test
testFormDataConstruction();

console.log('\n🎯 Test completed! Check the output above to verify FormData construction.');
