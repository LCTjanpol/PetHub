import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ImageBackground,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
  Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { apiClient, ENDPOINTS } from '../../config/api';

const { width, height } = Dimensions.get('window');

// Custom Warning Component for better user experience
const WarningMessage = ({ message, isVisible, onClose }: { 
  message: string; 
  isVisible: boolean; 
  onClose: () => void; 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  React.useEffect(() => {
    if (isVisible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.warningContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.warningContent}>
        <View style={styles.warningIconContainer}>
          <Text style={styles.warningIcon}>⚠️</Text>
        </View>
        <View style={styles.warningTextContainer}>
          <Text style={styles.warningTitle}>Login Issue</Text>
          <Text style={styles.warningMessage}>{message}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.warningCloseButton}>
          <Text style={styles.warningCloseText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Function to show warning message
  const showWarningMessage = (message: string) => {
    setWarningMessage(message);
    setShowWarning(true);
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowWarning(false);
    }, 5000);
  };

  // Function to handle keyboard appearance and scroll to focused input
  const handleInputFocus = (inputName: string) => {
    // Add a small delay to ensure the keyboard is fully shown
    setTimeout(() => {
      if (scrollViewRef.current) {
        // Scroll to different positions based on which input is focused
        switch (inputName) {
          case 'password':
            scrollViewRef.current.scrollTo({ y: 200, animated: true });
            break;
          case 'email':
            scrollViewRef.current.scrollTo({ y: 100, animated: true });
            break;
          default:
            scrollViewRef.current.scrollTo({ y: 150, animated: true });
        }
      }
    }, 100);
  };

  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      showWarningMessage('Please enter both your email address and password to continue.');
      return;
    }

    setIsLoading(true);

    try {
      // First test connection
      try {
        await apiClient.get('/health');
      } catch (healthError) {
        showWarningMessage('Unable to connect to our servers. Please check your internet connection and try again.');
        setIsLoading(false);
        return;
      }
      
      const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
        email: email.trim().toLowerCase(),
        password,
      });

      // Store the token in AsyncStorage so other screens can use it
      const { token, isAdmin, user } = response.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      if (isAdmin) {
        router.replace('/admin/dashboard');
      } else if (user.isShopOwner) {
        router.replace('/(shop-tabs)/shop');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      // Hide all technical error details from users
      
      // Show user-friendly warning messages instead of technical errors
      let message = 'The email address or password you entered is incorrect. Please check your credentials and try again.';
      
      if (error.code === 'ECONNABORTED') {
        message = 'The connection is taking too long. Please check your internet connection and try again.';
      } else if (error.code === 'NETWORK_ERROR') {
        message = 'Network connection issue detected. Please check your internet connection and try again.';
      } else if (error.code === 'ENOTFOUND') {
        message = 'Unable to reach our servers. Please check your internet connection and try again.';
      } else if (error.code === 'ECONNREFUSED') {
        message = 'Our servers are currently unavailable. Please try again in a few moments.';
      } else if (error.response?.status === 401) {
        message = 'The email address or password you entered is incorrect. Please check your credentials and try again.';
      } else if (error.response?.status === 400) {
        message = error.response.data?.message || 'Please check your email format and try again.';
      } else if (error.response?.data?.message) {
        // Convert technical messages to user-friendly ones
        const techMessage = error.response.data.message;
        if (techMessage.includes('Invalid email or password')) {
          message = 'The email address or password you entered is incorrect. Please check your credentials and try again.';
        } else if (techMessage.includes('required')) {
          message = 'Please make sure you have entered both your email address and password.';
        } else {
          message = 'We encountered an issue with your login. Please try again.';
        }
      }
      
      showWarningMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" translucent />
      
      {/* Warning Message Component */}
      <WarningMessage 
        message={warningMessage}
        isVisible={showWarning}
        onClose={() => setShowWarning(false)}
      />
      
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
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
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
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your PetHub account</Text>
              </View>

              {/* Form Section */}
              <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputContainer}>
                    <Image
                      source={require('../../assets/icons/email.png')}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#999999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => handleInputFocus('email')}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Image
                      source={require('../../assets/icons/password.png')}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      style={styles.inputPassword}
                      secureTextEntry={!showPassword}
                      placeholder="Enter your password"
                      placeholderTextColor="#999999"
                      onFocus={() => handleInputFocus('password')}
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

                {/* Login Button */}
                <TouchableOpacity 
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </TouchableOpacity>

                {/* Register Link */}
                <TouchableOpacity 
                  onPress={() => router.push('/auth/signup')}
                  style={styles.registerLink}
                  activeOpacity={0.7}
                >
                  <Text style={styles.registerText}>
                    Don&apos;t have an account? <Text style={styles.registerTextBold}>Create one</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  // Warning Message Styles
  warningContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  warningContent: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEAA7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  warningIconContainer: {
    marginRight: 12,
  },
  warningIcon: {
    fontSize: 24,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  warningMessage: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  warningCloseButton: {
    padding: 4,
  },
  warningCloseText: {
    fontSize: 18,
    color: '#856404',
    fontWeight: '600',
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
    marginBottom: 50,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0E0F0F',
    marginBottom: 10,
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
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 12,
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
  inputPassword: {
    flex: 1,
    fontSize: 16,
    color: '#0E0F0F',
    paddingVertical: 15,
    paddingRight: 10,
  },
  togglePasswordVisibility: {
    padding: 5,
  },
  togglePasswordIcon: {
    width: 20,
    height: 20,
    tintColor: '#666666',
  },
  loginButton: {
    marginTop: 20,
    marginBottom: 30,
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
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 16,
    color: '#666666',
    textDecorationLine: 'underline',
  },
  registerTextBold: {
    fontWeight: '600',
    color: '#0E0F0F',
  },
});

export default Login;