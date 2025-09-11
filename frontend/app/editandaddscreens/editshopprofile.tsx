// File: editshopprofile.tsx
// Description: Screen for editing shop profile information

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { apiClient, ENDPOINTS } from '../../config/api';
import { formatImageUrl } from '../../utils/imageUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

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

export default function EditShopProfileScreen() {
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Form fields
  const [shopName, setShopName] = useState('');
  const [bio, setBio] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [shopType, setShopType] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const shopTypes = [
    'Pet Store',
    'Veterinary Clinic',
    'Pet Grooming',
    'Pet Training',
    'Pet Boarding',
    'Pet Supplies',
    'Pet Food',
    'Pet Accessories',
    'Other'
  ];

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        router.replace('/auth/login');
        return;
      }

      const response = await apiClient.get(ENDPOINTS.SHOP.PROFILE, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const shop = response.data.data || response.data;
        setShopData(shop);
        setShopName(shop.shopName || '');
        setBio(shop.bio || '');
        setContactNumber(shop.contactNumber || '');
        setShopLocation(shop.shopLocation || '');
        setOpeningTime(shop.openingTime || '');
        setClosingTime(shop.closingTime || '');
        setShopType(shop.shopType || '');
        setIsAvailable(shop.isAvailable !== undefined ? shop.isAvailable : true);
        setSelectedDays(shop.availableDays || []);
        setSelectedImage(shop.shopImage || null);
      } else {
        Alert.alert('Error', 'No shop found. Please apply to become a shop owner first.');
        router.back();
      }
    } catch (error: any) {
      console.error('Error fetching shop data:', error);
      Alert.alert('Error', 'Failed to load shop data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      if (error.code === 'E_NO_CAMERA_PERMISSION') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions in your device settings.');
      } else if (error.code === 'E_PICKER_CANCELLED') {
        return;
      } else {
        Alert.alert('Error', 'Failed to pick image. Please try again.');
      }
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSave = async () => {
    // All fields are optional for editing - no validation required

    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const formData = new FormData();
      formData.append('shopName', shopName.trim() || '');
      formData.append('bio', bio.trim() || '');
      formData.append('contactNumber', contactNumber.trim() || '');
      formData.append('shopLocation', shopLocation.trim() || '');
      formData.append('openingTime', openingTime.trim() || '');
      formData.append('closingTime', closingTime.trim() || '');
      formData.append('shopType', shopType.trim() || '');
      formData.append('isAvailable', isAvailable.toString());
      formData.append('availableDays', JSON.stringify(selectedDays));

      // Handle shop image - only send new images as files
      if (selectedImage && (selectedImage.startsWith('file://') || selectedImage.startsWith('content://'))) {
        formData.append('shopImage', {
          uri: selectedImage,
          type: 'image/jpeg',
          name: 'shop-image.jpg',
        } as any);
      }
      // Don't send existing server images - let backend keep existing

      const response = await apiClient.put(
        ENDPOINTS.SHOP.PROFILE,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Shop profile updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update shop profile');
      }
    } catch (error: any) {
      console.error('Error updating shop profile:', error);
      Alert.alert('Error', 'Failed to update shop profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading shop data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#2C2C2C" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Shop Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Shop Image */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Shop Image</Text>
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            {selectedImage ? (
              <Image
                source={{ 
                  uri: selectedImage.startsWith('http') 
                    ? formatImageUrl(selectedImage) 
                    : selectedImage 
                }}
                style={styles.shopImage}
              />
            ) : (
              <View style={[styles.shopImage, styles.placeholderImage]}>
                <FontAwesome5 name="store" size={32} color="#999999" />
              </View>
            )}
            <View style={styles.imageOverlay}>
              <FontAwesome5 name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Shop Name</Text>
            <TextInput
              style={styles.textInput}
              value={shopName}
              onChangeText={setShopName}
              placeholder="Enter shop name"
              placeholderTextColor="#999999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Shop Type</Text>
            <View style={styles.dropdown}>
              <Text style={[styles.dropdownText, !shopType && styles.placeholderText]}>
                {shopType || 'Select shop type'}
              </Text>
              <FontAwesome5 name="chevron-down" size={12} color="#666666" />
            </View>
            {shopTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.dropdownOption, shopType === type && styles.selectedOption]}
                onPress={() => setShopType(type)}
              >
                <Text style={[styles.dropdownOptionText, shopType === type && styles.selectedOptionText]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell customers about your shop..."
              placeholderTextColor="#999999"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contact Number</Text>
            <TextInput
              style={styles.textInput}
              value={contactNumber}
              onChangeText={setContactNumber}
              placeholder="Enter contact number"
              placeholderTextColor="#999999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.textInput}
              value={shopLocation}
              onChangeText={setShopLocation}
              placeholder="Enter shop location"
              placeholderTextColor="#999999"
            />
          </View>
        </View>

        {/* Business Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Hours</Text>
          
          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <Text style={styles.inputLabel}>Opening Time</Text>
              <TextInput
                style={styles.textInput}
                value={openingTime}
                onChangeText={setOpeningTime}
                placeholder="e.g., 09:00"
                placeholderTextColor="#999999"
              />
            </View>
            <View style={styles.timeInput}>
              <Text style={styles.inputLabel}>Closing Time</Text>
              <TextInput
                style={styles.textInput}
                value={closingTime}
                onChangeText={setClosingTime}
                placeholder="e.g., 18:00"
                placeholderTextColor="#999999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Available Days</Text>
            <View style={styles.daysContainer}>
              {availableDays.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    selectedDays.includes(day) && styles.selectedDayButton
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={[
                    styles.dayButtonText,
                    selectedDays.includes(day) && styles.selectedDayButtonText
                  ]}>
                    {day.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={[styles.toggleButton, isAvailable && styles.toggleButtonActive]}
              onPress={() => setIsAvailable(!isAvailable)}
            >
              <Text style={[styles.toggleButtonText, isAvailable && styles.toggleButtonTextActive]}>
                {isAvailable ? 'Shop is Open' : 'Shop is Closed'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2C2C2C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  saveButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  saveButton: {
    backgroundColor: '#2C2C2C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0E0F0F',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  shopImage: {
    width: 200,
    height: 120,
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 8,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    color: '#0E0F0F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 16,
    color: '#0E0F0F',
  },
  placeholderText: {
    color: '#999999',
  },
  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedOption: {
    backgroundColor: '#E8F8F5',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#0E0F0F',
  },
  selectedOptionText: {
    color: '#0E0F0F',
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 1,
    marginRight: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  selectedDayButton: {
    backgroundColor: '#0E0F0F',
    borderColor: '#0E0F0F',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  selectedDayButtonText: {
    color: '#FFFFFF',
  },
  toggleButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#0E0F0F',
    borderColor: '#0E0F0F',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
});
