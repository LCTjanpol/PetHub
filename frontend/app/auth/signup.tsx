import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Image, Alert, ScrollView, ImageBackground, KeyboardAvoidingView,
  Platform, Keyboard, StatusBar, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import axios from 'axios';
import { apiClient, ENDPOINTS, API_URL } from '../../config/api';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [gender, setGender] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmBorderColor, setConfirmBorderColor] = useState('#ccc');
  const [isLoading, setIsLoading] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      const date = selectedDate.toISOString().split('T')[0];
      setBirthdate(date);
    }
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Images],
      quality: 1,
      allowsEditing: true, // Enable cropping
      aspect: [1, 1], // Force square crop for profile
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      // Check file size (Expo returns size in bytes)
      if (asset.fileSize && asset.fileSize > 15 * 1024 * 1024) {
        Alert.alert('Error', 'Profile image exceeds 15MB. Please choose a smaller image.');
        return;
      }
      setProfileImage(asset.uri);
    }
  };

  // Function to handle keyboard appearance and scroll to focused input
  const handleInputFocus = (inputName: string) => {
    // Add a small delay to ensure the keyboard is fully shown
    setTimeout(() => {
      if (scrollViewRef.current) {
        // Scroll to different positions based on which input is focused
        switch (inputName) {
          case 'password':
            scrollViewRef.current.scrollTo({ y: 400, animated: true });
            break;
          case 'confirmPassword':
            scrollViewRef.current.scrollTo({ y: 450, animated: true });
            break;
          case 'email':
            scrollViewRef.current.scrollTo({ y: 200, animated: true });
            break;
          case 'fullName':
            scrollViewRef.current.scrollTo({ y: 150, animated: true });
            break;
          default:
            scrollViewRef.current.scrollTo({ y: 300, animated: true });
        }
      }
    }, 100);
  };

  const handleRegister = async () => {
    // Enhanced input validation with user-friendly messages
    if (!fullName?.trim()) {
      Alert.alert("Missing Information", "Please enter your full name to continue.");
      return;
    }

    if (!email?.trim()) {
      Alert.alert("Missing Information", "Please enter your email address to continue.");
      return;
    }

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address (e.g., example@email.com).");
      return;
    }

    if (!birthdate) {
      Alert.alert("Missing Information", "Please select your birthdate to continue.");
      return;
    }

    if (!gender) {
      Alert.alert("Missing Information", "Please select your gender to continue.");
      return;
    }

    if (!password) {
      Alert.alert("Missing Information", "Please create a password to continue.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak Password", "Your password must be at least 6 characters long for security.");
      return;
    }

    if (!confirmPassword) {
      Alert.alert("Missing Information", "Please confirm your password to continue.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "The passwords you entered don't match. Please check and try again.");
      setConfirmBorderColor('red');
      return;
    }

    setIsLoading(true); 

    try {
      let response;
      
      if (profileImage) {
        // Use form data for image upload
        const formData = new FormData();
        formData.append('fullName', fullName.trim());
        formData.append('email', email.trim().toLowerCase());
        formData.append('birthdate', birthdate);
        formData.append('gender', gender.trim());
        formData.append('password', password);
        
        formData.append('profileImage', {
          uri: profileImage,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);

        response = await axios.post(`${API_URL}${ENDPOINTS.AUTH.REGISTER}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 15000, // 15 second timeout for file uploads
        });
      } else {
        // Use simple JSON registration (much faster)
        response = await apiClient.post(ENDPOINTS.AUTH.REGISTER_SIMPLE, {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          birthdate: birthdate,
          gender: gender.trim(),
          password: password,
        });
      }

      if (response.data.success) {
        Alert.alert(
          "Welcome to PetHub! 🎉",
          "Your account has been created successfully. You can now sign in and start connecting with the pet community.",
          [
            {
              text: "Sign In Now",
              onPress: () => router.push('/auth/login')
            }
          ]
        );
      } else {
        Alert.alert("Registration Issue", response.data.message || "We couldn't create your account at this time. Please try again.");
      }
    } catch (error: any) {
      let message = "We encountered an issue creating your account. Please try again.";
      
      if (error.code === 'ECONNABORTED') {
        message = 'The connection is taking too long. Please check your internet connection and try again.';
      } else if (error.code === 'NETWORK_ERROR') {
        message = 'Network connection issue detected. Please check your internet connection and try again.';
      } else if (error.code === 'ENOTFOUND') {
        message = 'Unable to reach our servers. Please check your internet connection and try again.';
      } else if (error.code === 'ECONNREFUSED') {
        message = 'Our servers are currently unavailable. Please try again in a few moments.';
      } else if (error.response?.status === 400) {
        const backendMessage = error.response.data.message;
        if (backendMessage?.includes('email')) {
          message = 'Please check your email format and try again.';
        } else if (backendMessage?.includes('password')) {
          message = 'Please check your password requirements and try again.';
        } else {
          message = backendMessage || 'Please check your information and try again.';
        }
      } else if (error.response?.status === 409) {
        message = 'An account with this email already exists. Please use a different email address or try signing in instead.';
      } else if (error.response?.status === 413) {
        message = 'Your profile image is too large. Please choose a smaller image (under 15MB) and try again.';
      } else if (error.response?.status === 500) {
        message = 'Server error. Please try again in a few moments.';
      } else if (error.response?.data?.message) {
        // Convert technical messages to user-friendly ones
        const techMessage = error.response.data.message;
        if (techMessage.includes('duplicate') || techMessage.includes('unique')) {
          message = 'An account with this email already exists. Please use a different email address.';
        } else if (techMessage.includes('validation')) {
          message = 'Please check your information and ensure all fields are filled correctly.';
        } else {
          message = 'We encountered an issue with your registration. Please try again.';
        }
      }
      
      Alert.alert("Registration Failed", message);
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" translucent />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <View style={styles.backButtonContainer}>
              <Text style={styles.backButtonText}>←</Text>
            </View>
          </TouchableOpacity>

          {/* Header Section */}
          <View style={styles.headerSection}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
            />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the PetHub community</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Personal Information */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <Image
                    source={require('../../assets/icons/name.png')}
                    style={styles.inputIconImage}
                  />
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#999999"
                    onFocus={() => handleInputFocus('fullName')}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Image
                    source={require('../../assets/icons/email.png')}
                    style={styles.inputIconImage}
                  />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    placeholder="Enter your email"
                    placeholderTextColor="#999999"
                    autoCapitalize="none"
                    onFocus={() => handleInputFocus('email')}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Birthdate</Text>
                <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateInputContainer}>
                  <Image
                    source={require('../../assets/icons/calendar.png')}
                    style={styles.inputIconImage}
                  />
                  <Text style={[styles.dateInputText, { color: birthdate ? '#0E0F0F' : '#999999' }]}>
                    {birthdate || 'Select Birthdate'}
                  </Text>
                </TouchableOpacity>
                {showPicker && (
                  <DateTimePicker
                    value={birthdate ? new Date(birthdate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderIconGroup}>
                  {['Male', 'Female', 'Others'].map(option => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setGender(option)}
                      style={[
                        styles.genderIconOption,
                        gender === option && styles.genderIconSelected
                      ]}
                    >
                      <Image 
                        source={
                          option === 'Male' ? require('../../assets/icons/male.png') :
                          option === 'Female' ? require('../../assets/icons/female.png') :
                          require('../../assets/icons/others.png')
                        }
                        style={[
                          styles.genderIcon,
                          gender === option && styles.genderIconActive
                        ]}
                      />
                      <Text style={[
                        styles.genderIconText,
                        gender === option && styles.genderIconTextSelected
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Profile Image */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionTitle}>Profile Picture</Text>
              <View style={styles.imagePickerContainer}>
                <TouchableOpacity onPress={handleImagePick} style={styles.imageButton}>
                  <Text style={styles.imageButtonText}>Add Photo</Text>
                </TouchableOpacity>
                <Text style={styles.imageStatus}>
                  {profileImage ? 'Photo selected' : 'No photo selected'}
                </Text>
              </View>
            </View>

            {/* Security */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionTitle}>Security</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <Image
                    source={require('../../assets/icons/password.png')}
                    style={styles.inputIconImage}
                  />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#999999"
                    onFocus={() => handleInputFocus('password')}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.inputContainer, { borderColor: confirmBorderColor }]}>
                  <Image
                    source={require('../../assets/icons/password.png')}
                    style={styles.inputIconImage}
                  />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setConfirmBorderColor('#E0E0E0');
                    }}
                    secureTextEntry={!showPassword}
                    placeholder="Confirm your password"
                    placeholderTextColor="#999999"
                    onFocus={() => handleInputFocus('confirmPassword')}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)} 
                    style={styles.togglePasswordVisibility}
                  >
                    <Image
                      source={showPassword ? require('../../assets/icons/hide-eye.png') : require('../../assets/icons/eye.png')}
                      style={styles.togglePasswordIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.toggleView}>
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.toggleButton}>
                  <Text style={styles.toggleText}>
                    {showPassword ? 'Hide Password' : 'Show Password'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity 
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]} 
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.registerText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.loginLink}>
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginTextBold}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContainer: {
    paddingHorizontal: 25,
    paddingBottom: 100,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0E0F0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0E0F0F',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '400',
  },
  formSection: {
    flex: 1,
  },
  sectionGroup: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 20,
    marginLeft: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 10,
    marginLeft: 5,
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 15,
    color: '#666666',
  },
  inputIconImage: {
    width: 20,
    height: 20,
    marginRight: 15,
    tintColor: '#666666',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0E0F0F',
    paddingVertical: 15,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateInputText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
  },
  genderIconGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  genderIconOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  genderIconSelected: {
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
  genderIconActive: {
    opacity: 1,
  },
  genderIconText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
  },
  genderIconTextSelected: {
    color: '#666666',
    fontWeight: '700',
  },
  imagePickerContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  imageButton: {
    backgroundColor: '#0E0F0F',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginBottom: 10,
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  imageStatus: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '400',
  },
  toggleView: {
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  toggleText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  togglePasswordVisibility: {
    padding: 5,
  },
  togglePasswordIcon: {
    width: 20,
    height: 20,
    tintColor: '#666666',
  },
  registerButton: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 25,
    backgroundColor: '#0E0F0F',
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  registerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loginText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  loginTextBold: {
    fontWeight: '600',
    color: '#0E0F0F',
    textDecorationLine: 'underline',
  },
});
