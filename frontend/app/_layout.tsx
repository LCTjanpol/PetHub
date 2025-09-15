import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';
import GlobalNotificationManager from '../components/GlobalNotificationManager';
import ShopApprovalNotification from '../components/ShopApprovalNotification';
import CustomSplashScreen from '../components/CustomSplashScreen';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const router = useRouter();

  // Check authentication status on app startup
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('Checking authentication status...');
        const token = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');
        
        console.log('Token exists:', !!token);
        console.log('User data exists:', !!userData);
        
        if (token && userData) {
          const user = JSON.parse(userData);
          setIsAuthenticated(true);
          setUserRole(user.isAdmin ? 'admin' : user.isShopOwner ? 'shop' : 'user');
          
          console.log('User authenticated, routing to appropriate screen...');
          // Route to appropriate screen based on user role
          if (user.isAdmin) {
            router.replace('/admin/dashboard');
          } else if (user.isShopOwner) {
            router.replace('/(shop-tabs)/profile');
          } else {
            router.replace('/(tabs)/home');
          }
        } else {
          setIsAuthenticated(false);
          console.log('User not authenticated, routing to landing page...');
          // Route to landing page for unauthenticated users
          router.replace('/');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
        console.log('Error occurred, routing to landing page...');
        // Route to landing page on error
        router.replace('/');
      } finally {
        // Mark app as ready after auth check
        console.log('App is ready, setting isAppReady to true');
        setIsAppReady(true);
      }
    };

    checkAuthStatus();
  }, []);

  const handleShopStatusCheck = (status: any) => {
    try {
      // Handle shop status changes
      console.log('Shop status updated:', status);
      
      // If user just became a shop owner, update the role and route accordingly
      if (status && status.isShopOwner && status.hasShop && userRole !== 'shop') {
        console.log('🎉 User role changed to shop owner, updating routing...');
        setUserRole('shop');
        // The ShopApprovalNotification will handle the logout and re-routing
      }
    } catch (error) {
      console.error('Error handling shop status check:', error);
    }
  };

  // Show splash screen while fonts are loading or app is initializing
  if (!loaded || !isAppReady || showSplash) {
    console.log('Showing splash screen - loaded:', loaded, 'isAppReady:', isAppReady, 'showSplash:', showSplash);
    return (
      <CustomSplashScreen 
        onAnimationComplete={() => {
          console.log('Splash screen animation complete - hiding splash');
          setShowSplash(false);
        }} 
      />
    );
  }

  console.log('Rendering main app');

  // Force light theme
  return (
    <ThemeProvider value={DefaultTheme}>
      <GlobalNotificationManager>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(shop-tabs)" />
          <Stack.Screen name="editandaddscreens" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen name="shop-profile" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack>
        <ShopApprovalNotification onStatusCheck={handleShopStatusCheck} />
      </GlobalNotificationManager>
    </ThemeProvider>
  );
}
