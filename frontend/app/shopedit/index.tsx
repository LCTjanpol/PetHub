// File: index.tsx
// Description: Main index file for shop edit screens

import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

export default function ShopEditIndex() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Shop Edit Screens</Text>
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
    fontSize: 18,
    color: '#0E0F0F',
  },
});
