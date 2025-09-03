import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const IndexScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" translucent />
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo Section */}
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
          onLoad={() => console.log('Image loaded successfully')}
        />

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.welcomeText}>Welcome to PetHub</Text>
          <Text style={styles.description}>
            Never miss important pet care reminders.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/auth/signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Capstone Project Group 2</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0E0F0F',
    marginBottom: 10,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: '#0E0F0F',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  primaryButton: {
    marginBottom: 15,
    borderRadius: 25,
    backgroundColor: '#0E0F0F',
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#0E0F0F',
    alignItems: 'center',
    backgroundColor: 'transparent',
    width: 200,
  },
  secondaryButtonText: {
    color: '#0E0F0F',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  footerSubtext: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '400',
  },
});

export default IndexScreen;