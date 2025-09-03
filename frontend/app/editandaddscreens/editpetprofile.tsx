import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Image, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl,
  StatusBar,
  Platform,
  KeyboardAvoidingView
} from 'react-native';

import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ENDPOINTS } from '../../config/api';
import { formatImageUrl } from '../../utils/imageUtils';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome5 } from '@expo/vector-icons';

const EditPetProfileScreen = () => {
  const params = useLocalSearchParams();
  const { petId } = params as { petId: string };
  const [pet, setPet] = useState({ name: '', petPicture: '', birthdate: '', type: '', breed: '', healthCondition: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showPetTypeDropdown, setShowPetTypeDropdown] = useState(false);
  const petTypes = ['Dog', 'Cat', 'Fish', 'Hamster', 'Bird', 'Rabbit', 'Guinea Pig', 'Ferret', 'Reptile', 'Other'];

  const fetchPet = useCallback(async () => {
    try {
      console.log('[fetchPet] Starting fetch for pet ID:', petId);
      console.log('[fetchPet] API Base URL:', process.env.EXPO_PUBLIC_API_URL || 'Not set, using platform default');
      console.log('[fetchPet] Full API URL:', `${process.env.EXPO_PUBLIC_API_URL || 'Platform default'}/pet/${petId}`);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('[fetchPet] No token found');
        Alert.alert('Error', 'No token found. Please log in again.');
        return;
      }
      
      console.log('[fetchPet] Token found, making API call to:', ENDPOINTS.PET.DETAIL(petId));
      console.log('[fetchPet] API Client base URL:', apiClient.defaults.baseURL);
      
      const response = await apiClient.get(ENDPOINTS.PET.DETAIL(petId), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10 second timeout
      });
      
      console.log('[fetchPet] API response received:', {
        status: response.status,
        data: response.data,
        hasName: !!response.data?.name,
        hasType: !!response.data?.type,
        hasBirthdate: !!response.data?.birthdate
      });
      
      if (!response.data) {
        throw new Error('No data received from API');
      }
      
             // Ensure all fields are properly set, even if they're null/undefined
       const petData = {
         name: response.data.name || '',
         petPicture: response.data.petPicture || '',
         birthdate: response.data.birthdate || '',
         type: response.data.type || '',
         breed: response.data.breed || '',
         healthCondition: response.data.healthCondition || ''
       };
       
              console.log('[fetchPet] Setting pet state with:', petData);
       console.log('[fetchPet] Pet picture from backend:', response.data.petPicture);
        
        setPet(petData);
        setProfileImage(response.data.petPicture || null);
      
        if (response.data.birthdate) {
        const birthDate = new Date(response.data.birthdate);
        console.log('[fetchPet] Setting birthdate:', birthDate);
        setSelectedDate(birthDate);
      }
      
      console.log('[fetchPet] Pet state updated successfully');
    } catch (error: any) {
      console.error('[fetchPet] Error fetching pet:', error.message);
      console.error('[fetchPet] Error details:', {
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        message: error.message
      });
      
      let errorMessage = 'Failed to fetch pet profile. ';
      
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage += 'Network connection failed. Please check if the backend server is running.';
      } else if (error.response?.status === 401) {
        errorMessage += 'Authentication failed. Please log in again.';
        router.replace('/auth/login');
      } else if (error.response?.status === 404) {
        errorMessage += 'Pet not found. Please check the pet ID.';
      } else if (error.response?.status === 500) {
        errorMessage += 'Server error. Please try again later.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      Alert.alert('Fetch Error', errorMessage);
    } finally {
      setRefreshing(false);
    }
  }, [petId]);

  useEffect(() => {
    console.log('[useEffect] Component mounted, fetching pet with ID:', petId);
    console.log('[useEffect] Pet ID type:', typeof petId);
    console.log('[useEffect] Pet ID value:', petId);
    
    if (petId && petId.trim() !== '') {
      console.log('[useEffect] Pet ID is valid, calling fetchPet');
      fetchPet();
    } else {
      console.error('[useEffect] Invalid pet ID:', petId);
      Alert.alert('Error', 'Invalid pet ID. Please try again.');
    }
  }, [petId]); // Remove fetchPet from dependencies to avoid infinite loop

  // Debug: Log pet state changes
  useEffect(() => {
    console.log('[useEffect] Pet state updated:', {
      name: pet.name,
      type: pet.type,
      birthdate: pet.birthdate,
      breed: pet.breed,
      healthCondition: pet.healthCondition,
      petPicture: pet.petPicture
    });
    console.log('[useEffect] Profile image state:', profileImage);
    console.log('[useEffect] Is pet data loaded:', !!(pet.name && pet.type && pet.birthdate));
  }, [pet, profileImage]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPet();
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const image = result.assets[0];
        
        if (image.fileSize && image.fileSize > 15 * 1024 * 1024) {
          Alert.alert('Error', 'Image exceeds 15MB. Please choose a smaller image.');
          return;
        }
        
        setProfileImage(image.uri);
      }
    } catch (error) {
      console.error('[pickImage] Error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove the pet profile image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setProfileImage(null);
            setPet(prevPet => ({ ...prevPet, petPicture: '' }));
          },
        },
      ]
    );
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      setPet({ ...pet, birthdate: formattedDate });
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!pet.name?.trim() || !pet.type?.trim() || !pet.birthdate?.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields:\n\n• Pet Name\n• Pet Type\n• Birthdate');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'No token found. Please log in again.');
        return;
      }



      const formData = new FormData();
      
      // Always send all fields to ensure updates work
      formData.append('name', pet.name);
      formData.append('birthdate', pet.birthdate);
      formData.append('type', pet.type);
      formData.append('breed', pet.breed);
      formData.append('healthCondition', pet.healthCondition);
      
      // 🚀 SMART FIX: Handle image updates properly for React Native
      if (profileImage === null) {
        // User removed the image
        formData.append('petPicture', '');
        console.log('[handleSave] 🗑️ Image removed, sending empty string');
      } else if (profileImage && profileImage.startsWith('file://')) {
        // ✅ New local image from ImagePicker - MUST be uploaded as file
        const imageFile = {
          uri: profileImage,
          type: 'image/jpeg',
          name: `pet_${Date.now()}.jpg`,
        };
        
        // CRITICAL: This MUST go to files, not fields
        formData.append('petPicture', imageFile as any);
        console.log('[handleSave] ✅ New image added as file object for upload:', imageFile);
      } else if (profileImage && (profileImage.startsWith('/uploads') || profileImage.startsWith('http'))) {
        // Existing server image - keep it
        formData.append('petPicture', profileImage);
        console.log('[handleSave] 🔒 Keeping existing server image:', profileImage);
      } else if (pet.petPicture && pet.petPicture.startsWith('file://')) {
        // Current pet has corrupted local file URI - clean it up
        formData.append('petPicture', '');
        console.log('[handleSave] 🧹 Cleaning corrupted local file URI, removing image');
      } else if (profileImage === pet.petPicture) {
        // No image change - keep existing
        formData.append('petPicture', pet.petPicture || '');
        console.log('[handleSave] 🔄 No image change, keeping existing:', pet.petPicture);
      } else {
        // Fallback: no image change
        formData.append('petPicture', pet.petPicture || '');
        console.log('[handleSave] 🔄 Fallback: no image change, keeping existing:', pet.petPicture);
      }



      
      
      console.log('[handleSave] Sending update request to:', ENDPOINTS.PET.UPDATE(petId));
      console.log('[handleSave] Form data being sent:', {
        name: pet.name,
        type: pet.type,
        breed: pet.breed,
        birthdate: pet.birthdate,
        healthCondition: pet.healthCondition,
        hasImage: !!profileImage
      });
      
      const response = await apiClient.put(ENDPOINTS.PET.UPDATE(petId), formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Let Axios set Content-Type and boundary automatically for FormData
        },
        timeout: 30000, // 30 second timeout for image uploads
      });
      
      console.log('[handleSave] Update response status:', response.status);
      console.log('[handleSave] Update response data:', response.data);
      
      // Update local state with the response data
      if (response.data) {
        console.log('[handleSave] Update successful, response data:', response.data);
        console.log('[handleSave] Updated pet picture:', response.data.petPicture);
        
        // Update pet state with new data
        const updatedPet = {
          name: response.data.name || '',
          petPicture: response.data.petPicture || '',
          birthdate: response.data.birthdate || '',
          type: response.data.type || '',
          breed: response.data.breed || '',
          healthCondition: response.data.healthCondition || ''
        };
        
        setPet(updatedPet);
        
        // Update profile image state - use the new server path
        if (response.data.petPicture) {
          setProfileImage(response.data.petPicture);
          console.log('[handleSave] Profile image updated to:', response.data.petPicture);
        } else {
          setProfileImage(null);
          console.log('[handleSave] Profile image cleared');
        }
        
        // Show success message and navigate back
        Alert.alert('Success', 'Pet profile updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to pets screen
              router.back();
            }
          }
        ]);
      } else {
        throw new Error('No response data received from server');
      }
    } catch (error: any) {
      console.error('[handleSave] Error:', error.message, error.stack);
      console.error('[handleSave] Error details:', {
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data
      });
      
      let errorMessage = 'Failed to update pet profile. Please try again.';
      
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = 'Network connection failed. Please check:\n\n1. Your internet connection\n2. If the backend server is running\n3. Try again in a few moments';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your internet connection and try again.';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Unable to reach the server. Please check if the backend is running.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused. The server may be down or not accessible.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid pet data. Please check your input.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        router.replace('/auth/login');
      } else if (error.response?.status === 404) {
        errorMessage = 'Pet not found. Please refresh and try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Update Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };



  const handleDelete = async () => {
    Alert.alert(
      'Delete Pet',
      'Are you sure you want to delete this pet? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert('Error', 'No token found. Please log in again.');
                return;
              }
              const response = await apiClient.delete(ENDPOINTS.PET.DELETE(petId), {
                headers: { Authorization: `Bearer ${token}` },
              });
              console.log('[handleDelete] Delete response:', response.status, response.data);
              Alert.alert('Success', 'Pet deleted successfully!');
              router.back(); // Use router.back() instead of navigation.goBack()
            } catch (error: any) {
              console.error('[handleDelete] Error:', error.message, error.stack);
              console.error('[handleDelete] Error details:', {
                code: error.code,
                status: error.response?.status,
                statusText: error.response?.statusText,
                url: error.config?.url,
                method: error.config?.method,
                data: error.response?.data
              });
              
              let errorMessage = 'Failed to delete pet. Please try again.';
              
              if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
                errorMessage = 'Network connection failed. Please check your internet connection.';
              } else if (error.response?.status === 401) {
                errorMessage = 'Authentication failed. Please log in again.';
                router.replace('/auth/login');
              } else if (error.response?.status === 404) {
                errorMessage = 'Pet not found. Please refresh and try again.';
              } else if (error.response?.status === 500) {
                errorMessage = 'Server error. Please try again later.';
              } else if (error.message) {
                errorMessage = error.message;
              }
              
              Alert.alert('Delete Failed', errorMessage);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2C2C2C" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome5 name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🐾 Edit Pet Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
                     {/* Pet Image Section */}
           <View style={styles.imageSection}>
             <View style={styles.imageContainer}>
                               <Image
                  source={
                    profileImage && profileImage.startsWith('file://')
                      ? { uri: profileImage } // Show local selected image
                      : (profileImage && (profileImage.startsWith('/uploads') || profileImage.startsWith('http')))
                        ? { uri: formatImageUrl(profileImage) || '' } // Show server image
                        : pet.petPicture && pet.petPicture.trim() !== ''
                          ? { uri: formatImageUrl(pet.petPicture) || '' } // Show existing pet image
                          : require('../../assets/images/pet.png') // Default image
                  }
                  style={styles.petImage}
                  onError={(error) => {
                    console.log('[Image] Error loading image:', error.nativeEvent);
                    console.log('[Image] Failed source:', profileImage || pet.petPicture);
                    console.log('[Image] Profile image state:', profileImage);
                    console.log('[Image] Pet picture field:', pet.petPicture);
                  }}
                  onLoad={() => {
                    console.log('[Image] Image loaded successfully');
                    console.log('[Image] Source:', profileImage || pet.petPicture);
                  }}
                />
               <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                 <FontAwesome5 name="camera" size={16} color="#FFFFFF" />
               </TouchableOpacity>
               {(profileImage || pet.petPicture) && (
                 <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                   <FontAwesome5 name="times" size={12} color="#FFFFFF" />
                 </TouchableOpacity>
               )}
             </View>
                                         <Text style={styles.imageHint}>Tap the camera to change photo</Text>
              {(profileImage || pet.petPicture) && (
                <TouchableOpacity style={styles.removeImageTextButton} onPress={removeImage}>
                  <Text style={styles.removeImageText}>Remove Photo</Text>
                </TouchableOpacity>
              )}
              

            </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Pet Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🐕 Pet Name</Text>
              <View style={styles.inputContainer}>
                <FontAwesome5 name="paw" size={16} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your pet's name"
                  value={pet.name || ''}
                  onChangeText={(text) => setPet({ ...pet, name: text })}
                  placeholderTextColor="#999999"
                />
              </View>
            </View>

            {/* Pet Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🏷️ Pet Type</Text>
              <TouchableOpacity 
                style={styles.dropdownButton} 
                onPress={() => setShowPetTypeDropdown(!showPetTypeDropdown)}
              >
                <FontAwesome5 name="list" size={16} color="#666666" style={styles.inputIcon} />
                <Text style={styles.dropdownText}>
                  {pet.type ? pet.type : 'Select pet type'}
                </Text>
                <FontAwesome5 name="chevron-down" size={12} color="#666666" />
              </TouchableOpacity>
              
              {showPetTypeDropdown && (
                <View style={styles.dropdownOverlay}>
                  <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                    {petTypes.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setPet({ ...pet, type });
                          setShowPetTypeDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Breed */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🐾 Breed</Text>
              <View style={styles.inputContainer}>
                <FontAwesome5 name="dna" size={16} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter breed (e.g., Golden Retriever)"
                  value={pet.breed || ''}
                  onChangeText={(text) => setPet({ ...pet, breed: text })}
                  placeholderTextColor="#999999"
                />
              </View>
            </View>

            {/* Birthdate */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🎂 Birthdate</Text>
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowDatePicker(true)}
              >
                <FontAwesome5 name="calendar-alt" size={16} color="#666666" style={styles.inputIcon} />
                <Text style={styles.dateText}>
                  {pet.birthdate ? new Date(pet.birthdate).toLocaleDateString() : 'Select birthdate'}
                </Text>
                <FontAwesome5 name="chevron-down" size={12} color="#666666" />
              </TouchableOpacity>
            </View>

            {/* Health Condition */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🏥 Health Condition</Text>
              <View style={styles.inputContainer}>
                <FontAwesome5 name="heart" size={16} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Health condition (optional)"
                  value={pet.healthCondition || ''}
                  onChangeText={(text) => setPet({ ...pet, healthCondition: text })}
                  placeholderTextColor="#999999"
                  multiline
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
              disabled={isLoading}
            >
              <FontAwesome5 name={isLoading ? "spinner" : "save"} size={16} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>





            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <FontAwesome5 name="trash" size={16} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Delete Pet</Text>
            </TouchableOpacity>

            

             <TouchableOpacity 
               style={styles.cancelButton} 
                               onPress={() => router.back()}
             >
               <Text style={styles.cancelButtonText}>Cancel</Text>
             </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
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
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  petImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#666666',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF4757',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  removeImageTextButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  removeImageText: {
    fontSize: 14,
    color: '#FF4757',
    textDecorationLine: 'underline',
  },
  imageHint: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  formContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 15,
    color: '#666666',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0E0F0F',
    paddingVertical: 15,
  },

  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#0E0F0F',
    marginLeft: 15,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#0E0F0F',
    marginLeft: 15,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    maxHeight: 200,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#0E0F0F',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2C',
    borderRadius: 25,
    paddingVertical: 18,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingVertical: 18,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 25,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: '#666666',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default EditPetProfileScreen;
