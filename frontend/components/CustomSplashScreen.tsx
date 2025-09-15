// File: CustomSplashScreen.tsx
// Description: Modern custom splash screen component for PetHub app with clean design and animated loading dots

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onAnimationComplete?: () => void;
}

const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({ onAnimationComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Initial fade in animation
    const initialAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    // Text fade in after logo
    const textAnimation = Animated.timing(textFadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    });

    // Loading dots animation
    const dotsAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(dot1Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot2Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot3Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot1Anim, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot2Anim, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot3Anim, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );

    // Start animation sequence
    initialAnimation.start(() => {
      textAnimation.start();
      dotsAnimation.start();
    });

    // Auto-hide after 3 seconds
    const timer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, logoScaleAnim, textFadeAnim, dot1Anim, dot2Anim, dot3Anim, onAnimationComplete]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Logo */}
        <Animated.View style={{ transform: [{ scale: logoScaleAnim }] }}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
              onError={(error) => {
                console.log('Logo loading error:', error.nativeEvent.error);
              }}
              onLoad={() => {
                console.log('Logo loaded successfully');
              }}
            />
          </View>
        </Animated.View>

        {/* App Name */}
        <Animated.Text style={[styles.appName, { opacity: textFadeAnim }]}>
          PetHub
        </Animated.Text>
        
        {/* Loading Dots */}
        <Animated.View style={[styles.loadingContainer, { opacity: textFadeAnim }]}>
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { opacity: dot1Anim }]} />
            <Animated.View style={[styles.dot, { opacity: dot2Anim }]} />
            <Animated.View style={[styles.dot, { opacity: dot3Anim }]} />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 60,
    letterSpacing: 1,
    fontFamily: 'serif',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A1A1A',
    marginHorizontal: 4,
  },
});

export default CustomSplashScreen;
