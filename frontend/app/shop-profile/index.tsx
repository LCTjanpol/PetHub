// File: index.tsx
// Description: Default screen for shop-profile directory - shows a list of shops or redirects

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { apiClient, ENDPOINTS } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';

interface Shop {
  id: string;
  shopName: string;
  shopType: string;
  shopLocation: string;
  rating: number;
}

export default function ShopProfileIndex() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await apiClient.get(ENDPOINTS.SHOP.MAP, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShops(response.data);
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShopPress = (shop: Shop) => {
    router.push(`/shop-profile/${shop.id}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading shops...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Shop Profiles</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {shops.length > 0 ? (
          shops.map((shop) => (
            <TouchableOpacity
              key={shop.id}
              style={styles.shopCard}
              onPress={() => handleShopPress(shop)}
            >
              <View style={styles.shopInfo}>
                <Text style={styles.shopName}>{shop.shopName}</Text>
                <Text style={styles.shopType}>{shop.shopType}</Text>
                <Text style={styles.shopLocation}>{shop.shopLocation}</Text>
                <View style={styles.ratingContainer}>
                  <FontAwesome5 name="star" size={14} color="#FFD700" />
                  <Text style={styles.rating}>{shop.rating.toFixed(1)}</Text>
                </View>
              </View>
              <FontAwesome5 name="chevron-right" size={16} color="#666666" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="store" size={50} color="#E0E0E0" />
            <Text style={styles.emptyText}>No shops available</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2C2C2C',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 4,
  },
  shopType: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  shopLocation: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  text: {
    fontSize: 16,
    color: '#666666',
  },
});
