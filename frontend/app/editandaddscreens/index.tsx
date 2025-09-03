// File: index.tsx
// Description: Default screen for editandaddscreens directory - redirects to appropriate screen

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function EditAndAddScreensIndex() {
  useEffect(() => {
    // Redirect to a default screen or show a selection
    // For now, we'll redirect to the pets screen as it's commonly used
    router.replace('/(tabs)/pets');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Redirecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  text: {
    fontSize: 16,
    color: '#666666',
  },
});
