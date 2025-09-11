// File: home.tsx
// Description: User home screen using unified component with user permissions

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import UnifiedHomeScreen from '../../components/UnifiedHomeScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { apiClient, ENDPOINTS } from '../../config/api';

export default function HomeScreen() {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Get current user info on component mount
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          router.replace('/auth/login');
          return;
        }

        // Fetch current user profile to get user ID
        const response = await apiClient.get(ENDPOINTS.USER.PROFILE, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success && response.data.data) {
          setCurrentUserId(response.data.data.id?.toString() || '');
        } else if (response.data.id) {
          setCurrentUserId(response.data.id?.toString() || '');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        router.replace('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    getUserInfo();
  }, []);

  if (isLoading) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <UnifiedHomeScreen 
        currentUserIsShopOwner={false}
        currentUserId={currentUserId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});