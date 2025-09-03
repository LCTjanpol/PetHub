// File: postsService.ts
// Description: Shared service for fetching posts data

import { apiClient, ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface Post {
  id: string;
  content: string;
  image?: string;
  createdAt: string;
  userId: string;
  isShopOwner: boolean;
  shopId?: string;
  shopName?: string;
  userName: string;
  userProfilePicture?: string;
  shopImage?: string;
}

export interface PostsResponse {
  success: boolean;
  data: Post[];
  message?: string;
}

/**
 * Fetch all posts for the home feed
 * @returns Promise<Post[]> - Array of all posts
 */
export const fetchAllPosts = async (): Promise<Post[]> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('Error', 'Authentication token not found. Please log in again.');
      return [];
    }

    const response = await apiClient.get(ENDPOINTS.POST.LIST, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // Handle different response structures
    if (response.data.success && response.data.data) {
      return response.data.data;
    } else if (response.data.success) {
      return response.data;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else {
      Alert.alert('Error', 'Unexpected response format from server');
      return [];
    }
  } catch (error: any) {
    let errorMessage = 'Failed to load posts. Please try again.';
    
    if (error.response?.status === 401) {
      errorMessage = 'Session expired. Please log in again.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Posts endpoint not found. Please check your connection.';
    } else if (error.response?.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Connection timeout. Please check your internet connection.';
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    Alert.alert('Posts Loading Failed', errorMessage);
    return [];
  }
};

/**
 * Fetch posts for a specific shop
 * @param shopId - The ID of the shop
 * @returns Promise<Post[]> - Array of shop posts
 */
export const fetchShopPosts = async (shopId: string): Promise<Post[]> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('Error', 'Authentication token not found. Please log in again.');
      return [];
    }

    // For now, we'll filter from all posts since there might not be a specific endpoint
    // In the future, you can implement: `/api/shop/${shopId}/posts`
    const allPosts = await fetchAllPosts();
    return allPosts.filter(post => post.shopId === shopId);
  } catch (error: any) {
    Alert.alert('Error', 'Failed to load shop posts. Please try again.');
    return [];
  }
};

/**
 * Delete a shop post
 * @param postId - The ID of the post to delete
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export const deleteShopPost = async (postId: string): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('Error', 'Authentication token not found. Please log in again.');
      return false;
    }

    const response = await apiClient.delete(ENDPOINTS.POST.DELETE(postId), {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (response.status === 200 || response.status === 204) {
      Alert.alert('Success', 'Post deleted successfully');
      return true;
    } else {
      Alert.alert('Error', 'Failed to delete post. Please try again.');
      return false;
    }
  } catch (error: any) {
    Alert.alert('Error', 'Failed to delete post. Please try again.');
    return false;
  }
};
