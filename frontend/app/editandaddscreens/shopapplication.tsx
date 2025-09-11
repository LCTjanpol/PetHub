// File: shopapplication.tsx
// Description: Shop application form for users to apply as shop owners

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { apiClient, ENDPOINTS } from '../../config/api';

const shopTypes = [
  'Grooming Service',
  'Vet Clinic',
  'Pet Shop Supplies',
  'Pet Accessories',
  'Pet Training',
  'Pet Boarding',
  'Pet Photography',
  'Pet Transportation',
  'Pet Insurance',
  'Other'
];

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const ShopApplication = () => {
  const [formData, setFormData] = useState({
    shopName: '',
    shopLocation: '',
    bio: '',
    contactNumber: '',
    shopMessage: '',
    shopType: '',
    openingTime: '',
    closingTime: '',
    availableDays: [] as string[],
    isAvailable: true,
  });
  const [shopImage, setShopImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [customType, setCustomType] = useState('');
  const [coordinates, setCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showOpeningTimePicker, setShowOpeningTimePicker] = useState(false);
  const [showClosingTimePicker, setShowClosingTimePicker] = useState(false);
  const [openingTimeDate, setOpeningTimeDate] = useState(new Date());
  const [closingTimeDate, setClosingTimeDate] = useState(new Date());
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isAlreadyShopOwner, setIsAlreadyShopOwner] = useState(false);

  // Check if user is already a shop owner when component loads
  useEffect(() => {
    checkIfAlreadyShopOwner();
  }, []);

  const checkIfAlreadyShopOwner = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await apiClient.get(ENDPOINTS.USER.SHOP_STATUS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const statusData = response.data.data;
      
      // If user already has an approved shop, redirect them
      if (statusData.shopApplication && statusData.shopApplication.status === 'approved') {
        setIsAlreadyShopOwner(true);
        Alert.alert(
          'Already a Shop Owner',
          'You are already an approved shop owner. You cannot submit another application.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
        return;
      }

      // If user has a pending application, show status
      if (statusData.shopApplication) {
        setApplicationStatus(statusData.shopApplication.status);
      }
    } catch (error) {
      console.error('Error checking shop owner status:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.Images],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setShopImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const checkApplicationStatus = async () => {
    try {
      setIsCheckingStatus(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please log in to check your application status.');
        return;
      }

      const response = await apiClient.get(ENDPOINTS.USER.SHOP_STATUS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const statusData = response.data.data;
      
      if (statusData.shopApplication) {
        setApplicationStatus(statusData.shopApplication.status);
        
        if (statusData.shopApplication.status === 'approved') {
          Alert.alert(
            '🎉 Congratulations!',
            'Your shop application has been approved! You will be logged out and redirected to the shop owner interface.',
            [
              {
                text: 'OK',
                onPress: async () => {
                  await AsyncStorage.removeItem('user');
                  await AsyncStorage.removeItem('token');
                  router.replace('/auth/login');
                },
              },
            ]
          );
        } else if (statusData.shopApplication.status === 'rejected') {
          Alert.alert(
            'Application Status',
            'Your shop application has been reviewed. Please contact support for more information.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Application Status',
            'Your application is still under review. Please check back later.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'No Application Found',
          'You haven\'t submitted a shop application yet.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Error checking application status:', error);
      Alert.alert('Error', 'Failed to check application status. Please try again.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      
      // Request permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to get your current location.');
        return;
      }

      // Get current position
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Reverse geocode to get address
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const formattedAddress = `${address.street ? address.street + ', ' : ''}${address.city ? address.city + ', ' : ''}${address.region ? address.region + ', ' : ''}${address.country || ''}`;
        
        setFormData({ 
          ...formData, 
          shopLocation: formattedAddress.replace(/^, |, $/g, '') // Remove leading/trailing commas
        });
        setCoordinates({ latitude, longitude });
        
        Alert.alert(
          'Location Detected! 📍', 
          `Coordinates captured: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\nYour shop will be pinned on the map when approved.`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location. Please enter manually.');
    } finally {
      setGettingLocation(false);
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  const handleOpeningTimeConfirm = (event: any, selectedTime?: Date) => {
    setShowOpeningTimePicker(false);
    if (selectedTime) {
      setOpeningTimeDate(selectedTime);
      const timeString = selectedTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      setFormData({ ...formData, openingTime: timeString });
    }
  };

  const handleClosingTimeConfirm = (event: any, selectedTime?: Date) => {
    setShowClosingTimePicker(false);
    if (selectedTime) {
      setClosingTimeDate(selectedTime);
      const timeString = selectedTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      setFormData({ ...formData, closingTime: timeString });
    }
  };

  const handleSubmit = async () => {
    // Check if user is already a shop owner
    if (isAlreadyShopOwner) {
      Alert.alert('Already a Shop Owner', 'You are already an approved shop owner and cannot submit another application.');
      return;
    }

    // Validate required fields
    if (!formData.shopName || !formData.shopLocation || !formData.bio || 
        !formData.contactNumber || !formData.shopMessage || !formData.shopType ||
        !formData.openingTime || !formData.closingTime || formData.availableDays.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!shopImage) {
      Alert.alert('Error', 'Please add a shop image');
      return;
    }

    // Validate coordinates for map pinning
    if (coordinates.latitude === 0 && coordinates.longitude === 0) {
      Alert.alert(
        'Location Required', 
        'Please use the "Current Location" button to get your shop coordinates for map pinning.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get Location', onPress: getCurrentLocation }
        ]
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('shopName', formData.shopName);
      formDataToSend.append('shopLocation', formData.shopLocation);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('contactNumber', formData.contactNumber);
      formDataToSend.append('shopMessage', formData.shopMessage);
      formDataToSend.append('shopType', formData.shopType === 'Other' ? customType : formData.shopType);
      formDataToSend.append('openingTime', formData.openingTime);
      formDataToSend.append('closingTime', formData.closingTime);
      formDataToSend.append('availableDays', JSON.stringify(formData.availableDays));
      formDataToSend.append('isAvailable', formData.isAvailable.toString());
      // Add coordinates for map pinning
      formDataToSend.append('latitude', coordinates.latitude.toString());
      formDataToSend.append('longitude', coordinates.longitude.toString());

      if (shopImage) {
        formDataToSend.append('shopImage', {
          uri: shopImage,
          type: 'image/jpeg',
          name: 'shop.jpg',
        } as any);
      }

      const response = await apiClient.post('/shop/apply', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        // Application submitted successfully - navigate back without popup
        router.back();
      }
    } catch (error: any) {
      console.error('Error submitting application:', error);
      
      // Handle specific error types
      if (error?.response?.status === 401) {
        Alert.alert(
          'Session Expired', 
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/auth/login'),
            },
          ]
        );
      } else if (error?.response?.status === 400) {
        Alert.alert('Validation Error', error.response.data.message || 'Please check your input and try again.');
      } else if (error?.response?.status === 500) {
        Alert.alert('Server Error', 'There was a problem with our servers. Please try again later.');
      } else if (error?.code === 'ECONNABORTED') {
        Alert.alert('Connection Timeout', 'The request took too long. Please check your connection and try again.');
      } else if (error?.code === 'NETWORK_ERROR') {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', 'Failed to submit application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#0E0F0F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Application</Text>
        <TouchableOpacity 
          onPress={checkApplicationStatus} 
          style={styles.statusCheckButton}
          disabled={isCheckingStatus}
        >
          <FontAwesome5 
            name={isCheckingStatus ? "spinner" : "sync-alt"} 
            size={16} 
            color="#0E0F0F" 
          />
        </TouchableOpacity>
      </View>

      {isAlreadyShopOwner ? (
        <View style={styles.alreadyOwnerContainer}>
          <FontAwesome5 name="store" size={64} color="#4CAF50" />
          <Text style={styles.alreadyOwnerTitle}>Already a Shop Owner</Text>
          <Text style={styles.alreadyOwnerSubtitle}>
            You are already an approved shop owner and cannot submit another application.
          </Text>
          <TouchableOpacity 
            style={styles.backToHomeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToHomeButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <FontAwesome5 name="store" size={32} color="#0E0F0F" />
              <Text style={styles.welcomeTitle}>Become a Shop Owner</Text>
              <Text style={styles.welcomeSubtitle}>
                Apply to provide pet services in our community
              </Text>
            </View>

          {/* Shop Image */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop Image *</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {shopImage ? (
                <Image source={{ uri: shopImage }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <FontAwesome5 name="camera" size={24} color="#666666" />
                  <Text style={styles.imagePlaceholderText}>Add Shop Image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Shop Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your shop name"
                value={formData.shopName}
                onChangeText={(text) => setFormData({ ...formData, shopName: text })}
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Shop Type *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
              >
                <Text style={[styles.dropdownText, !formData.shopType && styles.placeholderText]}>
                  {formData.shopType || 'Select shop type'}
                </Text>
                <FontAwesome5 name="chevron-down" size={16} color="#666666" />
              </TouchableOpacity>
              
              {showTypeDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView 
                    style={styles.dropdownScrollView} 
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {shopTypes.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFormData({ ...formData, shopType: type });
                          setShowTypeDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {formData.shopType === 'Other' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Specify Type *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your shop type"
                    value={customType}
                    onChangeText={setCustomType}
                    placeholderTextColor="#999999"
                  />
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location *</Text>
              <View style={styles.locationContainer}>
                <TextInput
                  style={styles.locationInput}
                  placeholder="Enter shop location"
                  value={formData.shopLocation}
                  onChangeText={(text) => setFormData({ ...formData, shopLocation: text })}
                  placeholderTextColor="#999999"
                  multiline
                />
                <TouchableOpacity 
                  style={styles.locationButton}
                  onPress={getCurrentLocation}
                  disabled={gettingLocation}
                >
                  <FontAwesome5 
                    name={gettingLocation ? "spinner" : "map-marker-alt"} 
                    size={16} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.locationButtonText}>
                    {gettingLocation ? 'Getting...' : 'Current Location'}
                  </Text>
                </TouchableOpacity>
              </View>
              {/* Location Status Indicator */}
              {coordinates.latitude !== 0 && coordinates.longitude !== 0 && (
                <View style={styles.locationStatus}>
                  <FontAwesome5 name="check-circle" size={14} color="#4CAF50" />
                  <Text style={styles.locationStatusText}>
                    Coordinates captured: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter contact number"
                value={formData.contactNumber}
                onChangeText={(text) => setFormData({ ...formData, contactNumber: text })}
                placeholderTextColor="#999999"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Business Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about your shop and services"
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholderTextColor="#999999"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Message to Admin *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Why should we approve your application?"
                value={formData.shopMessage}
                onChangeText={(text) => setFormData({ ...formData, shopMessage: text })}
                placeholderTextColor="#999999"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Operating Hours */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Operating Hours</Text>
            
            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Text style={styles.inputLabel}>Opening Time *</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowOpeningTimePicker(true)}
                >
                  <FontAwesome5 name="clock" size={16} color="#666666" style={styles.timeIcon} />
                  <Text style={styles.timeText}>
                    {formData.openingTime || '9:00 AM'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.timeInput}>
                <Text style={styles.inputLabel}>Closing Time *</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowClosingTimePicker(true)}
                >
                  <FontAwesome5 name="clock" size={16} color="#666666" style={styles.timeIcon} />
                  <Text style={styles.timeText}>
                    {formData.closingTime || '6:00 PM'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Available Days *</Text>
              <View style={styles.daysContainer}>
                {daysOfWeek.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      formData.availableDays.includes(day) && styles.dayButtonSelected
                    ]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      formData.availableDays.includes(day) && styles.dayButtonTextSelected
                    ]}>
                      {day.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <FontAwesome5 name="paper-plane" size={16} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.submitNote}>
              * Required fields. Your application will be reviewed by our admin team.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
        )}

      {/* Time Pickers */}
      {showOpeningTimePicker && (
        <DateTimePicker
          value={openingTimeDate}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleOpeningTimeConfirm}
        />
      )}
      
      {showClosingTimePicker && (
        <DateTimePicker
          value={closingTimeDate}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleClosingTimeConfirm}
        />
      )}
    </View>
  );
};

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
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0E0F0F',
  },
  placeholder: {
    width: 36,
  },
  statusCheckButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  alreadyOwnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F5F5F5',
  },
  alreadyOwnerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0E0F0F',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  alreadyOwnerSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  backToHomeButton: {
    backgroundColor: '#0E0F0F',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  backToHomeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0E0F0F',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
    position: 'relative',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0E0F0F',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0E0F0F',
    backgroundColor: '#FFFFFF',
  },
  locationContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0E0F0F',
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignSelf: 'flex-start',
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F8F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  locationStatusText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '500',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  placeholderText: {
    color: '#999999',
  },
  imagePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 200,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  dropdownButton: {
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
  dropdownList: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    zIndex: 1000,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownScrollView: {
    maxHeight: 240,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#0E0F0F',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  timeIcon: {
    marginRight: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#0E0F0F',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#0E0F0F',
    borderColor: '#0E0F0F',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  submitSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  submitButton: {
    backgroundColor: '#0E0F0F',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitNote: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ShopApplication; 