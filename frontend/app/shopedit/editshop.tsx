// File: editshop.tsx
// Description: Shop owner's comprehensive edit screen for both shop and user profile

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  StatusBar,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { apiClient, ENDPOINTS } from '../../config/api';
import { formatImageUrl } from '../../utils/imageUtils';
import { formatTimeForDisplay } from '../../utils/timeUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Interface for shop data structure
interface ShopData {
  id: string;
  shopName: string;
  shopImage: string;
  bio: string;
  contactNumber: string;
  shopLocation: string;
  openingTime: string;
  closingTime: string;
  availableDays: string[];
  isAvailable: boolean;
  shopType: string;
}

// Interface for user data structure
interface UserData {
  id: string;
  fullName: string;
  email: string;
  profilePicture: string;
  birthdate: string;
  gender: string;
}

export default function EditShopScreen() {
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMode, setEditMode] = useState<'shop' | 'user'>('shop');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shop edit form state
  const [shopName, setShopName] = useState('');
  const [shopBio, setShopBio] = useState('');
  const [shopContact, setShopContact] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  const [shopImage, setShopImage] = useState<string | null>(null);
  const [shopIsAvailable, setShopIsAvailable] = useState(true);
  const [shopType, setShopType] = useState('');

  // User edit form state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);

  // Available shop types
  const shopTypes = [
    'Pet Shop', 'Veterinary Clinic', 'Pet Grooming', 'Pet Training',
    'Pet Boarding', 'Pet Sitting', 'Pet Supplies', 'Other'
  ];

  // Available days
  const availableDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }
      
      // Fetch shop data
      const shopResponse = await apiClient.get(ENDPOINTS.SHOP.PROFILE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Handle different response structures
      let shopDataToSet;
      if (shopResponse.data.success && shopResponse.data.data) {
        shopDataToSet = shopResponse.data.data;
      } else if (shopResponse.data.success) {
        shopDataToSet = shopResponse.data;
      } else {
        shopDataToSet = shopResponse.data;
      }
      
      setShopData(shopDataToSet);
      
      // Fetch user data
      const userResponse = await apiClient.get(ENDPOINTS.USER.PROFILE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      let userDataToSet;
      if (userResponse.data.success && userResponse.data.data) {
        userDataToSet = userResponse.data.data;
      } else if (userResponse.data.success) {
        userDataToSet = userResponse.data;
      } else {
        userDataToSet = userResponse.data;
      }
      
      setUserData(userDataToSet);
    } catch (error: any) {
      console.error('[fetchData] Error:', error.message, error.stack);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.');
        router.replace('/auth/login');
      } else {
        Alert.alert('Error', 'Failed to load profile data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const openEditModal = (mode: 'shop' | 'user') => {
    setEditMode(mode);
    
    if (mode === 'shop' && shopData) {
      setShopName(shopData.shopName);
      setShopBio(shopData.bio);
      setShopContact(shopData.contactNumber);
      setShopLocation(shopData.shopLocation);
      setShopIsAvailable(shopData.isAvailable);
      setShopType(shopData.shopType);
      setShopImage(null); // Reset image selection
    } else if (mode === 'user' && userData) {
      setUserName(userData.fullName);
      setUserEmail(userData.email);
      setUserProfileImage(null); // Reset image selection
    }
    
    setShowEditModal(true);
  };

  const handleImagePick = async (type: 'shop' | 'user') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: type === 'shop' ? [16, 9] : [1, 1],
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 15 * 1024 * 1024) {
          Alert.alert('Error', 'Image exceeds 15MB. Please choose a smaller image.');
          return;
        }
        
        if (type === 'shop') {
          setShopImage(asset.uri);
        } else {
          setUserProfileImage(asset.uri);
        }
      }
    } catch (error) {
      console.error('[handleImagePick] Error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSaveChanges = async () => {
    if (editMode === 'shop') {
      if (!shopName.trim() || !shopBio.trim() || !shopContact.trim() || !shopLocation.trim() || !shopType.trim()) {
        Alert.alert('Error', 'Please fill in all required fields.');
        return;
      }
    } else {
      if (!userName.trim() || !userEmail.trim()) {
        Alert.alert('Error', 'Please fill in all required fields.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }
      
      if (editMode === 'shop') {
        // Update shop profile
        const formData = new FormData();
        formData.append('shopName', shopName.trim());
        formData.append('bio', shopBio.trim());
        formData.append('contactNumber', shopContact.trim());
        formData.append('shopLocation', shopLocation.trim());
        formData.append('shopType', shopType.trim());
        formData.append('isAvailable', shopIsAvailable.toString());
        
        if (shopImage) {
          formData.append('shopImage', {
            uri: shopImage,
            type: 'image/jpeg',
            name: 'shop.jpg',
          } as any);
        }

        const response = await apiClient.put(ENDPOINTS.SHOP.PROFILE, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          setShowEditModal(false);
          await fetchData(); // Refresh data
          Alert.alert('Success! 🎉', 'Shop profile updated successfully!');
        } else {
          throw new Error(response.data.message || 'Failed to update shop profile');
        }
      } else {
        // Update user profile
        const formData = new FormData();
        formData.append('fullName', userName.trim());
        formData.append('email', userEmail.trim());
        
        if (userProfileImage) {
          formData.append('profilePicture', {
            uri: userProfileImage,
            type: 'image/jpeg',
            name: 'profile.jpg',
          } as any);
        }

        const response = await apiClient.put(ENDPOINTS.USER.PROFILE, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          setShowEditModal(false);
          await fetchData(); // Refresh data
          Alert.alert('Success! 🎉', 'User profile updated successfully!');
        } else {
          throw new Error(response.data.message || 'Failed to update user profile');
        }
      }
    } catch (error: any) {
      console.error('[handleSaveChanges] Error:', error.message, error.stack);
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        router.replace('/auth/login');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Update Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to original values
    if (editMode === 'shop' && shopData) {
      setShopName(shopData.shopName);
      setShopBio(shopData.bio);
      setShopContact(shopData.contactNumber);
      setShopLocation(shopData.shopLocation);
      setShopIsAvailable(shopData.isAvailable);
      setShopType(shopData.shopType);
      setShopImage(null);
    } else if (editMode === 'user' && userData) {
      setUserName(userData.fullName);
      setUserEmail(userData.email);
      setUserProfileImage(null);
    }
    
    setShowEditModal(false);
  };

  // Using the new time utility function
  const formatTime = (time: string | null | undefined) => formatTimeForDisplay(time || '');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile data...</Text>
      </View>
    );
  }

  if (!shopData || !userData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile data</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#0E0F0F" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Profile Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>User Profile</Text>
            <TouchableOpacity
              onPress={() => openEditModal('user')}
              style={styles.editButton}
            >
              <FontAwesome5 name="edit" size={16} color="#0E0F0F" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileCard}>
            <Image
              source={
                userData.profilePicture
                  ? { uri: formatImageUrl(userData.profilePicture) || '' }
                  : require('../../assets/images/pet.png')
              }
              style={styles.userProfileImage}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userData.fullName || 'Not set'}</Text>
              <Text style={styles.userEmail}>{userData.email || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Shop Profile Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop Profile</Text>
            <TouchableOpacity
              onPress={() => openEditModal('shop')}
              style={styles.editButton}
            >
              <FontAwesome5 name="edit" size={16} color="#0E0F0F" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.shopCard}>
            <Image
              source={
                shopData.shopImage
                  ? { uri: formatImageUrl(shopData.shopImage) || '' }
                  : require('../../assets/images/shop.png')
              }
              style={styles.shopImage}
            />
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{shopData.shopName || 'Not set'}</Text>
              <Text style={styles.shopType}>{shopData.shopType || 'Not set'}</Text>
              <Text style={styles.shopLocation}>{shopData.shopLocation || 'Not set'}</Text>
              <Text style={styles.shopContact}>{shopData.contactNumber || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.shopDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Business Hours:</Text>
              <Text style={styles.detailValue}>
                {formatTime(shopData.openingTime)} - {formatTime(shopData.closingTime)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Available Days:</Text>
              <Text style={styles.detailValue}>
                {shopData.availableDays && shopData.availableDays.length > 0 
                  ? shopData.availableDays.join(', ') 
                  : 'Not set'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: shopData.isAvailable ? '#4CAF50' : '#F44336' }]} />
                <Text style={styles.statusText}>
                  {shopData.isAvailable ? 'Open' : 'Closed'}
                </Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bio:</Text>
              <Text style={styles.detailValue}>{shopData.bio || 'No bio available'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelEdit}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            {/* Modern Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <FontAwesome5 
                  name={editMode === 'shop' ? 'store' : 'user'} 
                  size={24} 
                  color="#0E0F0F" 
                />
                <Text style={styles.modalTitle}>
                  Edit {editMode === 'shop' ? 'Shop' : 'User'} Profile
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCancelEdit}
                style={styles.closeButton}
              >
                <FontAwesome5 name="times" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
              {editMode === 'shop' ? (
                <>
                  {/* Shop Image Section */}
                  <View style={styles.imageSection}>
                    <TouchableOpacity
                      onPress={() => handleImagePick('shop')}
                      style={styles.imagePickerButton}
                    >
                      <FontAwesome5 name="camera" size={20} color="#0E0F0F" />
                      <Text style={styles.imagePickerText}>
                        {shopImage ? 'Change Shop Image' : 'Add Shop Image'}
                      </Text>
                    </TouchableOpacity>

                    {shopImage && (
                      <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: shopImage }} style={styles.previewImage} />
                        <TouchableOpacity
                          onPress={() => setShopImage(null)}
                          style={styles.removeImageButton}
                        >
                          <FontAwesome5 name="times" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Shop Form Fields */}
                  <View style={styles.formSection}>
                    <Text style={styles.fieldLabel}>Shop Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter shop name"
                      placeholderTextColor="#999999"
                      value={shopName}
                      onChangeText={setShopName}
                    />

                    <Text style={styles.fieldLabel}>Shop Type *</Text>
                    <View style={styles.dropdownContainer}>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => {
                          // Show shop type picker
                          Alert.alert(
                            'Select Shop Type',
                            'Choose your shop type:',
                            shopTypes.map(type => ({
                              text: type,
                              onPress: () => setShopType(type)
                            }))
                          );
                        }}
                      >
                        <Text style={[styles.dropdownText, !shopType && styles.placeholderText]}>
                          {shopType || 'Select shop type'}
                        </Text>
                        <FontAwesome5 name="chevron-down" size={16} color="#666666" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.fieldLabel}>Shop Bio *</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Describe your shop..."
                      placeholderTextColor="#999999"
                      value={shopBio}
                      onChangeText={setShopBio}
                      multiline
                      numberOfLines={4}
                    />

                    <Text style={styles.fieldLabel}>Contact Number *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter contact number"
                      placeholderTextColor="#999999"
                      value={shopContact}
                      onChangeText={setShopContact}
                      keyboardType="phone-pad"
                    />

                    <Text style={styles.fieldLabel}>Shop Location *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter shop address"
                      placeholderTextColor="#999999"
                      value={shopLocation}
                      onChangeText={setShopLocation}
                    />

                    <View style={styles.switchContainer}>
                      <Text style={styles.switchLabel}>Currently Available</Text>
                      <Switch
                        value={shopIsAvailable}
                        onValueChange={setShopIsAvailable}
                        trackColor={{ false: '#E0E0E0', true: '#4ECDC4' }}
                        thumbColor={shopIsAvailable ? '#FFFFFF' : '#FFFFFF'}
                      />
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* User Image Section */}
                  <View style={styles.imageSection}>
                    <TouchableOpacity
                      onPress={() => handleImagePick('user')}
                      style={styles.imagePickerButton}
                    >
                      <FontAwesome5 name="camera" size={20} color="#0E0F0F" />
                      <Text style={styles.imagePickerText}>
                        {userProfileImage ? 'Change Profile Image' : 'Add Profile Image'}
                      </Text>
                    </TouchableOpacity>

                    {userProfileImage && (
                      <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: userProfileImage }} style={styles.previewImage} />
                        <TouchableOpacity
                          onPress={() => setUserProfileImage(null)}
                          style={styles.removeImageButton}
                        >
                          <FontAwesome5 name="times" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* User Form Fields */}
                  <View style={styles.formSection}>
                    <Text style={styles.fieldLabel}>Full Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor="#999999"
                      value={userName}
                      onChangeText={setUserName}
                    />

                    <Text style={styles.fieldLabel}>Email *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#999999"
                      value={userEmail}
                      onChangeText={setUserEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </>
              )}
            </ScrollView>

            {/* Modern Footer with Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                onPress={handleSaveChanges}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <View style={styles.loadingContainer}>
                    <FontAwesome5 name="spinner" size={16} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Saving...</Text>
                  </View>
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4757',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#0E0F0F',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#0E0F0F',
    textAlign: 'center',
    marginLeft: 20,
  },
  headerSpacer: {
    width: 36,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  editButtonText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#0E0F0F',
    fontWeight: '500',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
  },
  shopCard: {
    marginBottom: 15,
  },
  shopImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 15,
  },
  shopInfo: {
    marginBottom: 15,
  },
  shopName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 5,
  },
  shopType: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  shopLocation: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  shopContact: {
    fontSize: 14,
    color: '#666666',
  },
  shopDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#0E0F0F',
    flex: 2,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#0E0F0F',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
    marginLeft: 10,
  },
  closeButton: {
    padding: 5,
  },
  modalScrollView: {
    flex: 1,
  },
  imageSection: {
    marginBottom: 20,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  imagePickerText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#0E0F0F',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSection: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#0E0F0F',
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdownContainer: {
    marginBottom: 15,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 16,
    color: '#0E0F0F',
  },
  placeholderText: {
    color: '#999999',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: '#0E0F0F',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
});
