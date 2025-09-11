// File: addpet.tsx
// Description: Modern and professional Add Pet screen with enhanced UI/UX

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { apiClient, ENDPOINTS } from '../../config/api';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

export default function AddPetScreen() {
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [petBirthdate, setPetBirthdate] = useState<Date | null>(null);
  const [petHealthCondition, setPetHealthCondition] = useState('');
  const [petImage, setPetImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPetTypeDropdown, setShowPetTypeDropdown] = useState(false);
  const [customPetType, setCustomPetType] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);

  const popularPetTypes = [
    'Dog', 'Cat', 'Bird', 'Fish', 'Hamster', 
    'Rabbit', 'Guinea Pig', 'Turtle', 'Snake', 'Horse',
    'Lizard', 'Ferret', 'Chinchilla', 'Hedgehog', 'Sugar Glider',
    'Parrot', 'Canary', 'Goldfish', 'Betta Fish', 'Guppy',
    'Other'
  ];

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.Images],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 15 * 1024 * 1024) {
          Alert.alert('Error', 'Image exceeds 15MB. Please choose a smaller image.');
          return;
        }
        setPetImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('[pickImage] Error:', error);
      if (error.code === 'E_NO_CAMERA_PERMISSION') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions in your device settings.');
      } else if (error.code === 'E_PICKER_CANCELLED') {
        // User cancelled, no need to show error
        return;
      } else {
        Alert.alert('Error', 'Failed to pick image. Please try again.');
      }
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setPetBirthdate(selectedDate);
    }
  };

  const handleAddPet = async () => {
    const finalPetType = petType || customPetType;
    if (!petName.trim() || !finalPetType.trim() || !petBirthdate) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Type, and Birthdate).');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }

      const formData = new FormData();
      formData.append('name', petName.trim());
      formData.append('type', finalPetType.trim());
      formData.append('breed', petBreed.trim());
      formData.append('birthdate', petBirthdate.toISOString().split('T')[0]);
      formData.append('healthCondition', petHealthCondition.trim());
      
      if (petImage) {
        formData.append('petPicture', {
          uri: petImage,
          type: 'image/jpeg',
          name: 'pet.jpg',
        } as any);
      }

      console.log('[handleAddPet] Sending request to:', ENDPOINTS.PET.CREATE);
      console.log('[handleAddPet] Form data:', {
        name: petName.trim(),
        type: finalPetType.trim(),
        breed: petBreed.trim(),
        birthdate: petBirthdate.toISOString().split('T')[0],
        healthCondition: petHealthCondition.trim(),
        hasImage: !!petImage
      });
      
      const response = await apiClient.post(ENDPOINTS.PET.CREATE, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('[handleAddPet] Response status:', response.status);
      console.log('[handleAddPet] Response data:', response.data);

      if (response.data && response.data.id) {
        Alert.alert(
          'Success! 🎉', 
          'Pet added successfully! Your new furry friend is now part of your family.',
          [
            {
              text: 'View My Pets',
              onPress: () => router.push('/(tabs)/pets')
            },
            {
              text: 'Add Another Pet',
              onPress: () => resetForm()
            }
          ]
        );
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('[handleAddPet] Error:', error.message, error.stack);
      console.error('[handleAddPet] Error details:', {
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to add pet. Please try again.';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your internet connection and try again.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Unable to reach our servers. Please check your internet connection.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Our servers are currently unavailable. Please try again in a few moments.';
      } else if (error.response?.status === 400) {
        // Backend validation error
        errorMessage = error.response.data?.message || 'Invalid pet data. Please check your input and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        router.replace('/auth/login');
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to add pets. Please contact support.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Pet creation endpoint not found. Please check your connection.';
      } else if (error.response?.status === 413) {
        errorMessage = 'Image file is too large. Please choose a smaller image (under 5MB).';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        // Use the specific backend error message
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Pet Creation Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPetName('');
    setPetType('');
    setPetBreed('');
    setPetBirthdate(null);
    setPetHealthCondition('');
    setPetImage(null);
    setCustomPetType('');
    setShowPetTypeDropdown(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" translucent />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <FontAwesome5 name="arrow-left" size={20} color="#0E0F0F" />
            </TouchableOpacity>
            <Text style={styles.title}>Add New Pet</Text>
            <TouchableOpacity
              onPress={resetForm}
              style={styles.resetButton}
            >
              <FontAwesome5 name="undo" size={16} color="#666666" />
            </TouchableOpacity>
          </View>

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <FontAwesome5 name="paw" size={40} color="#0E0F0F" />
            <Text style={styles.welcomeText}>Welcome Your New Pet</Text>
            <Text style={styles.welcomeSubtext}>
              Fill in the details below to add your beloved pet to your family
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Pet Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pet Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your pet's name"
                placeholderTextColor="#999999"
                value={petName}
                onChangeText={setPetName}
                autoCapitalize="words"
              />
            </View>

            {/* Pet Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pet Type *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowPetTypeDropdown(!showPetTypeDropdown)}
              >
                <Text style={[
                  styles.dropdownButtonText,
                  !petType && !customPetType && styles.placeholderText
                ]}>
                  {petType || customPetType || 'Select pet type'}
                </Text>
                <FontAwesome5 
                  name={showPetTypeDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#666666" 
                />
              </TouchableOpacity>

              {showPetTypeDropdown && (
                <View style={styles.dropdownContainer}>
                  <ScrollView 
                    style={styles.dropdownScrollView} 
                    showsVerticalScrollIndicator={true}
                    indicatorStyle="black"
                  >
                    {popularPetTypes.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setPetType(type);
                          setCustomPetType('');
                          setShowPetTypeDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                    <View style={styles.customTypeSection}>
                      <Text style={styles.customTypeLabel}>Or specify custom type:</Text>
                      <TextInput
                        style={styles.customTypeInput}
                        placeholder="Enter custom pet type"
                        placeholderTextColor="#999999"
                        value={customPetType}
                        onChangeText={(text) => {
                          setCustomPetType(text);
                          setPetType('');
                        }}
                        autoCapitalize="words"
                      />
                    </View>
                  </ScrollView>
                  {/* Scroll indicator */}
                  <View style={styles.scrollIndicator}>
                    <FontAwesome5 name="chevron-down" size={12} color="#666666" />
                    <Text style={styles.scrollIndicatorText}>Scroll for more options</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Breed */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Breed</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Golden Retriever, Persian Cat"
                placeholderTextColor="#999999"
                value={petBreed}
                onChangeText={setPetBreed}
                autoCapitalize="words"
              />
            </View>

            {/* Birthdate */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Birthdate *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <FontAwesome5 name="calendar" size={16} color="#666666" />
                <Text style={styles.dateButtonText}>
                  {petBirthdate ? petBirthdate.toLocaleDateString() : 'Select birthdate'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Health Condition */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Health Condition</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Allergies, Diabetes, None"
                placeholderTextColor="#999999"
                value={petHealthCondition}
                onChangeText={setPetHealthCondition}
                autoCapitalize="words"
              />
            </View>

            {/* Pet Photo */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pet Photo</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={pickImage}
              >
                <FontAwesome5 name="camera" size={16} color="#666666" />
                <Text style={styles.imagePickerText}>
                  {petImage ? 'Change Photo' : 'Add Photo'}
                </Text>
              </TouchableOpacity>

              {petImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: petImage }}
                    style={styles.previewImage}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setPetImage(null)}
                  >
                    <FontAwesome5 name="times" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Submit Section */}
          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!petName || !petType || !petBirthdate || isSubmitting) && styles.submitButtonDisabled
              ]}
              onPress={handleAddPet}
              disabled={!petName || !petType || !petBirthdate || isSubmitting}
            >
              <FontAwesome5 
                name={isSubmitting ? "spinner" : "plus"} 
                size={16} 
                color="#FFFFFF" 
                style={isSubmitting ? styles.spinningIcon : undefined}
              />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Adding Pet...' : 'Add Pet'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.submitHelpText}>
              * Required fields must be filled
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={petBirthdate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0E0F0F',
  },
  resetButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0E0F0F',
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
    position: 'relative',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0E0F0F',
    backgroundColor: '#FFFFFF',
    minHeight: 52,
  },
  dateButton: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    minHeight: 52,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#0E0F0F',
    marginLeft: 12,
  },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    minHeight: 52,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#0E0F0F',
    marginLeft: 12,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginTop: 15,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#0E0F0F',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF4757',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  submitSection: {
    paddingHorizontal: 20,
    marginTop: 30,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#0E0F0F',
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitHelpText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 15,
    textAlign: 'center',
  },
  spinningIcon: {
    transform: [{ rotate: '360deg' }],
  },
  dropdownButton: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    minHeight: 52,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#0E0F0F',
  },
  placeholderText: {
    color: '#999999',
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginTop: 5,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    overflow: 'hidden',
  },
  dropdownScrollView: {
    maxHeight: 280,
    flexGrow: 0,
    flexShrink: 0,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 50,
    justifyContent: 'center',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#0E0F0F',
  },
  customTypeSection: {
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F8F8F8',
  },
  customTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  customTypeInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0E0F0F',
    backgroundColor: '#FFFFFF',
  },
  scrollIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#F8F8F8',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  scrollIndicatorText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 5,
  },
});
