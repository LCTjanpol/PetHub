import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Image, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  StatusBar,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiClient, ENDPOINTS } from '../../config/api';
import { formatImageUrl } from '../../utils/imageUtils';
import { FontAwesome5 } from '@expo/vector-icons';

const genderOptions = ['Male', 'Female', 'Other'];

const EditProfileScreen = () => {
  const [originalUser, setOriginalUser] = useState<any>(null);
  const [user, setUser] = useState<any>({ fullName: '', profilePicture: '', birthdate: '', gender: '' });
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await apiClient.get(ENDPOINTS.USER.PROFILE, {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      setUser({
        fullName: response.data.fullName || '',
        profilePicture: response.data.profilePicture || '',
        birthdate: response.data.birthdate ? response.data.birthdate.substring(0, 10) : '',
        gender: response.data.gender || '',
      });
      setOriginalUser({
        fullName: response.data.fullName || '',
        profilePicture: response.data.profilePicture || '',
        birthdate: response.data.birthdate ? response.data.birthdate.substring(0, 10) : '',
        gender: response.data.gender || '',
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        console.log('Selected image:', {
          uri: selectedImage.uri,
          width: selectedImage.width,
          height: selectedImage.height,
          type: selectedImage.type
        });
        
        // Check file size (limit to 10MB)
        if (selectedImage.fileSize && selectedImage.fileSize > 10 * 1024 * 1024) {
          Alert.alert('Image Too Large', 'Please select an image smaller than 10MB.');
          return;
        }
        
        setProfileImage(selectedImage.uri);
      }
    } catch (error: any) {
      let errorMessage = 'Failed to select image. Please try again.';
      
      if (error.message?.includes('cancelled')) {
        return; // User cancelled, no need to show error
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Camera roll access is required to select photos. Please check your app permissions.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error while selecting image. Please check your connection.';
      }
      
      Alert.alert('Image Selection Failed', errorMessage);
    }
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        return;
      }

      const formData = new FormData();
      
      // Always send all fields to ensure updates work
      formData.append('fullName', user.fullName || '');
      formData.append('birthdate', user.birthdate || '');
      formData.append('gender', user.gender || '');
      
      // Handle profile image - always send if there's an image
      if (profileImage) {
        // Check if it's a new image (local URI) or existing image
        if (profileImage.startsWith('file://') || profileImage.startsWith('content://') || profileImage.startsWith('http://localhost')) {
          // New image selected from gallery/camera
          formData.append('profileImage', {
            uri: profileImage,
            type: 'image/jpeg',
            name: `profile_${Date.now()}.jpg`,
          } as any);
        } else if (profileImage.startsWith('/uploads')) {
          // Existing image from backend - send the path to keep it
          formData.append('profileImage', profileImage);
        }
      }

      const response = await apiClient.put(ENDPOINTS.USER.PROFILE, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update local user data with new image if it was changed
      const newProfilePicture = profileImage && (profileImage.startsWith('file://') || profileImage.startsWith('content://') || profileImage.startsWith('http://localhost')) 
        ? profileImage // Use local image URI for immediate display
        : response.data.profilePicture || user.profilePicture;
      
      setUser({
        fullName: response.data.fullName || user.fullName,
        profilePicture: newProfilePicture,
        birthdate: response.data.birthdate ? response.data.birthdate.substring(0, 10) : user.birthdate,
        gender: response.data.gender || user.gender,
      });

      // Update stored user data
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const updatedUserData = {
          ...userData,
          fullName: response.data.fullName || userData.fullName,
          profilePicture: newProfilePicture, // Use the same logic for stored data
          gender: response.data.gender || userData.gender,
          birthdate: response.data.birthdate || userData.birthdate,
        };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
      }

      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error: any) {
      let errorMessage = 'Failed to update your profile. Please try again.';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'The update is taking too long. Please check your internet connection and try again.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network connection issue. Please check your internet connection and try again.';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Unable to reach our servers. Please check your connection and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
        router.replace('/auth/login');
      } else if (error.response?.status === 400) {
        const backendMessage = error.response.data?.message;
        if (backendMessage?.includes('image')) {
          errorMessage = 'There was an issue with your profile image. Please try selecting a different image.';
        } else if (backendMessage?.includes('name')) {
          errorMessage = 'Please check your name and try again.';
        } else {
          errorMessage = backendMessage || 'Please check your information and try again.';
        }
      } else if (error.response?.status === 413) {
        errorMessage = 'Your profile image is too large. Please choose a smaller image and try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again in a few moments.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Profile Update Failed', errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2C2C2C" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <FontAwesome5 name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👤 Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              <Image
                source={
                  profileImage 
                    ? { uri: profileImage } 
                    : user.profilePicture && user.profilePicture.startsWith('/uploads') 
                      ? { uri: formatImageUrl(user.profilePicture) || '' } 
                      : user.profilePicture 
                        ? { uri: user.profilePicture } 
                        : require('../../assets/images/pet.png')
                }
                style={styles.profileImage}
                defaultSource={require('../../assets/images/pet.png')}
              />
              <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                <FontAwesome5 name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              {profileImage && (
                <TouchableOpacity 
                  style={styles.removeImageButton} 
                  onPress={() => setProfileImage(null)}
                >
                  <FontAwesome5 name="times" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.imageHint}>Tap the camera to change photo</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>👤 Full Name</Text>
              <View style={styles.inputContainer}>
                <FontAwesome5 name="user" size={16} color="#666666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={user.fullName}
                  onChangeText={(text) => setUser({ ...user, fullName: text })}
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
                  {user.birthdate ? new Date(user.birthdate).toLocaleDateString() : 'Select birthdate'}
                </Text>
                <FontAwesome5 name="chevron-down" size={12} color="#666666" />
              </TouchableOpacity>
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>⚧ Gender</Text>
              <View style={styles.genderContainer}>
                {genderOptions.map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderOption,
                      user.gender === gender && styles.genderOptionSelected
                    ]}
                    onPress={() => setUser({ ...user, gender })}
                  >
                    <Image 
                      source={
                        gender === 'Male' ? require('../../assets/icons/male.png') :
                        gender === 'Female' ? require('../../assets/icons/female.png') :
                        require('../../assets/icons/others.png')
                      }
                      style={[
                        styles.genderIcon,
                        user.gender === gender && styles.genderIconSelected
                      ]}
                    />
                    <Text style={[
                      styles.genderText,
                      user.gender === gender && styles.genderTextSelected
                    ]}>
                      {gender === 'Other' ? 'Others' : gender}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.saveButton, updating && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={updating}
            >
              <FontAwesome5 name={updating ? "spinner" : "save"} size={16} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {updating ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleCancel}
              disabled={updating}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={user.birthdate ? new Date(user.birthdate) : new Date()}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) setUser({ ...user, birthdate: date.toISOString().substring(0, 10) });
          }}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
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
  profileImage: {
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
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    marginBottom: 24,
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
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  genderOptionSelected: {
    borderColor: '#666666',
    borderWidth: 2,
    backgroundColor: '#F5F5F5',
  },
  genderIcon: {
    width: 32,
    height: 32,
    marginBottom: 8,
    opacity: 0.6,
  },
  genderIconSelected: {
    opacity: 1,
  },
  genderText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  genderTextSelected: {
    color: '#666666',
    fontWeight: '700',
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
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
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


export default EditProfileScreen;