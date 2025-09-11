// File: api.ts
// Description: API configuration with authentication and error handling

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Platform } from 'react-native';

// API base URL from environment variable or default based on platform
// To override this for your environment, create a .env file with:
// EXPO_PUBLIC_API_URL=http://your-ip-address:3000/api
const getApiBaseUrl = () => {
  // Check if environment variable is set
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Default URLs based on platform
  if (Platform.OS === 'ios') {
    // iOS simulator uses localhost
    return 'http://localhost:3000/api';
  } else if (Platform.OS === 'android') {
    // For physical Android devices, use the actual IP address
    // For Android emulator, use 10.0.2.2
    return 'http://192.168.254.140:3000/api';
  } else {
    // Web or other platforms
    return 'http://localhost:3000/api';
  }
};

const API_URL = getApiBaseUrl();

// API endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REGISTER_SIMPLE: '/auth/register-simple',
  },
  USER: {
    PROFILE: '/user/profile',
    SHOP_STATUS: '/user/shop-status',
  },
  PET: {
    LIST: '/pet',
    CREATE: '/pet',
    DETAIL: (id: string) => `/pet/${id}`,
    UPDATE: (id: string) => `/pet/${id}`,
    DELETE: (id: string) => `/pet/${id}`,
    MEDICAL_RECORDS: (id: string) => `/pets/${id}/medical-records`,
    MEDICAL_RECORD: (petId: string, recordId: string) => `/pets/${petId}/medical-records/${recordId}`,
  },
  TASK: {
    LIST: '/task',
    CREATE: '/task',
    DETAIL: (id: string) => `/task/${id}`,
    UPDATE: (id: string) => `/task/${id}`,
    DELETE: (id: string) => `/task/${id}`,
  },
  VACCINE: {
    LIST: '/vaccine',
    CREATE: '/vaccine',
    DETAIL: (id: string) => `/vaccine/${id}`,
    UPDATE: (id: string) => `/vaccine/${id}`,
    DELETE: (id: string) => `/vaccine/${id}`,
  },
  VACCINATION: {
    LIST: '/vaccine',
    CREATE: '/vaccine',
    DETAIL: (id: string) => `/vaccine/${id}`,
    UPDATE: (id: string) => `/vaccine/${id}`,
    DELETE: (id: string) => `/vaccine/${id}`,
  },
  POST: {
    LIST: '/posts',
    CREATE: '/post',
    DETAIL: (id: string) => `/posts/${id}`,
    UPDATE: (id: string) => `/posts/${id}`,
    DELETE: (id: string) => `/posts/${id}`,
    LIKE: (id: string) => `/posts/${id}/like`,
    UNLIKE: (id: string) => `/posts/${id}/unlike`,
    COMMENT: (id: string) => `/posts/${id}/comments`,
    REPLIES: (postId: string, commentId: string) => `/posts/${postId}/comments/${commentId}/replies`,
  },
  SHOP: {
    MAP: '/shops/map',
    LIST: '/shop',
    CREATE: '/shop',
    DETAIL: (id: string) => `/shop/${id}`,
    UPDATE: (id: string) => `/shop/${id}`,
    DELETE: (id: string) => `/shop/${id}`,
    APPLY: '/shop/apply',
    PROFILE: '/shop/profile',
    PROFILE_VIEW: (id: string) => `/shop/${id}/profile`,
    PROMOTIONAL_POST: '/shop/promotional-post',
  },
  ADMIN: {
    USERS: '/admin/users',
    PETS: '/admin/pets',
    SHOPS: '/admin/shops',
    APPLICATIONS: '/admin/shop-applications',
    STATS: '/admin/stats',
    DASHBOARD: '/admin/stats', // Dashboard uses stats endpoint
    DELETE_USER: (id: string) => `/admin/users/${id}`,
    DELETE_PET: (id: string) => `/admin/pets/${id}`,
    DELETE_SHOP: (id: string) => `/admin/shops/${id}`,
    PROCESS_APPLICATION: (id: string, action: string) => `/admin/shop-applications/${id}/${action}`,
  },
};

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[API Request] Error getting token:', error);
    }
    return config;
  },
  (error) => {
    console.error('[API Request] Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('[API Client] Response error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
    });

    // Handle 401 errors globally
    if (error.response?.status === 401) {
      console.log('[API Client] Unauthorized, clearing token and redirecting to login');
      await AsyncStorage.removeItem('token');
      router.replace('/auth/login');
    }

    return Promise.reject(error);
  }
);

export { apiClient, API_URL }; 