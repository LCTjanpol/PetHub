// File: ShopApprovalNotification.tsx
// Description: Component to handle shop approval notifications and routing

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { apiClient, ENDPOINTS } from '../config/api';

interface ShopStatusData {
  isShopOwner: boolean;
  hasShop: boolean;
  shopApplication: {
    id: number;
    status: string;
    shopName: string;
    createdAt: string;
  } | null;
}

interface ShopApprovalNotificationProps {
  onStatusCheck: (status: ShopStatusData) => void;
}

const ShopApprovalNotification: React.FC<ShopApprovalNotificationProps> = ({ onStatusCheck }) => {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [shopStatus, setShopStatus] = useState<ShopStatusData | null>(null);
  const [previousShopOwnerStatus, setPreviousShopOwnerStatus] = useState<boolean | null>(null);
  const [approvalPopupShown, setApprovalPopupShown] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check shop status with enhanced logic
  const checkShopStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await apiClient.get(ENDPOINTS.USER.SHOP_STATUS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const statusData = response.data.data;
      setShopStatus(statusData);
      onStatusCheck(statusData);

      // Shop approval popup removed - no longer shows
      // if (statusData.isShopOwner && statusData.hasShop && previousShopOwnerStatus === false && !approvalPopupShown) {
      //   console.log('🎉 Shop approval detected! User is now a shop owner');
      //   setShowApprovalModal(true);
      //   setApprovalPopupShown(true); // Mark that popup has been shown
      // }

      // Update previous status for next comparison
      setPreviousShopOwnerStatus(statusData.isShopOwner);
    } catch (error) {
      console.error('Error checking shop status:', error);
    }
  };

  // Initial check when component mounts
  useEffect(() => {
    checkShopStatus();
  }, []);

  // Set up continuous monitoring (check every 30 seconds)
  useEffect(() => {
    intervalRef.current = setInterval(checkShopStatus, 30000) as any; // 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [previousShopOwnerStatus]);

  const handleApprovalConfirm = async () => {
    setShowApprovalModal(false);
    
    try {
      // Clear all stored user data to force re-authentication
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      
      Alert.alert(
        'Congratulations! 🎉',
        'Your shop application has been approved! You will be logged out and redirected to the shop owner interface.',
        [
          {
            text: 'OK',
            onPress: async () => {
              // Navigate to login page
              router.replace('/auth/login');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: just navigate to login
      router.replace('/auth/login');
    }
  };

  return (
    <>
      <Modal
        visible={showApprovalModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowApprovalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Success Icon */}
            <View style={styles.iconContainer}>
              <FontAwesome5 name="check-circle" size={60} color="#4CAF50" />
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Congratulations! 🎉</Text>
            
            {/* Message */}
            <Text style={styles.modalMessage}>
              Your shop application has been approved! You are now a shop owner and can access the shop management features.
            </Text>

            {shopStatus?.shopApplication && (
              <View style={styles.shopInfo}>
                <Text style={styles.shopName}>{shopStatus.shopApplication.shopName}</Text>
                <Text style={styles.shopStatus}>Status: Approved</Text>
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleApprovalConfirm}
            >
              <Text style={styles.confirmButtonText}>Continue to Shop Owner Interface</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0E0F0F',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  shopInfo: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  shopName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 5,
  },
  shopStatus: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#0E0F0F',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: '100%',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ShopApprovalNotification;
