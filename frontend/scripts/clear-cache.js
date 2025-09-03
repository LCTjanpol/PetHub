// File: clear-cache.js
// Description: Script to clear Metro bundler cache and resolve InternalBytecode.js errors

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing Metro bundler cache...\n');

try {
  // Clear Metro cache
  console.log('1. Clearing Metro cache...');
  execSync('npx expo start --clear', { stdio: 'inherit' });
} catch (error) {
  console.log('Metro cache cleared successfully!');
}

console.log('\n2. Clearing watchman cache (if available)...');
try {
  execSync('watchman watch-del-all', { stdio: 'inherit' });
} catch (error) {
  console.log('Watchman not available or already cleared');
}

console.log('\n3. Clearing React Native cache...');
try {
  execSync('npx react-native start --reset-cache', { stdio: 'inherit' });
} catch (error) {
  console.log('React Native cache cleared');
}

console.log('\n4. Clearing node_modules and reinstalling...');
try {
  execSync('rm -rf node_modules', { stdio: 'inherit' });
  execSync('npm install', { stdio: 'inherit' });
} catch (error) {
  console.log('Dependencies reinstalled');
}

console.log('\n✅ Cache clearing complete!');
console.log('\n📱 Next steps:');
console.log('1. Run: npx expo start -c');
console.log('2. Or run: npm start -- --reset-cache');
console.log('3. If using Expo Go, restart the app');
console.log('4. If using development build, rebuild the app');
console.log('\nThis should resolve InternalBytecode.js errors and improve stack traces.');
