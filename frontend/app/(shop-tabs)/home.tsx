// File: home.tsx
// Description: Shop owner's home screen for creating and viewing posts with content and images

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { apiClient, ENDPOINTS } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { formatImageUrl } from '../../utils/imageUtils';
import * as ImagePicker from 'expo-image-picker';
import PostCard from '../../components/PostCard';

const { width, height } = Dimensions.get('window');

// Interface for post data structure
interface Post {
  id: string;
  userId: string;
  userName: string;
  userProfilePicture: string;
  content: string;
  createdAt: string;
  isShopOwner?: boolean;
  shopId?: string;
  shopName?: string;
  user?: {
    fullName: string;
    profilePicture: string;
    id: string;
    isShopOwner: boolean;
  };
  image?: string;
}

export default function ShopOwnerHomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newPostImage, setNewPostImage] = useState<string | null>(null);

  // Fetch current user data
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Fetch posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await apiClient.get(ENDPOINTS.USER.PROFILE, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load user profile. Please try again.');
    }
  };

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }

      const response = await apiClient.get(ENDPOINTS.POST.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Fetched posts response:', response.data);
      
      // The backend returns the posts array directly for GET /api/post
      if (Array.isArray(response.data)) {
        setPosts(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setPosts(response.data.data);
      } else {
        console.error('[fetchPosts] Unexpected response structure:', response.data);
        setPosts([]);
      }
    } catch (error: any) {
      console.error('[fetchPosts] Error:', error.message, error.stack);
      
      let errorMessage = 'Failed to load posts. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        router.replace('/auth/login');
      } else if (error.response?.status === 404) {
        errorMessage = 'Posts endpoint not found. Please check your connection.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Posts Loading Failed', errorMessage);
      setPosts([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPosts();
    } catch (error) {
      console.error('[onRefresh] Error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Handle post deletion
  const handleDeletePost = async (postId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await apiClient.delete(ENDPOINTS.POST.DELETE(postId), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        // Refresh posts after successful deletion
        await fetchPosts();
        Alert.alert('Success', 'Post deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      Alert.alert('Error', 'Failed to delete post. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 15 * 1024 * 1024) {
          Alert.alert('Error', 'Image exceeds 15MB. Please choose a smaller image.');
          return;
        }
        setNewPostImage(asset.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      Alert.alert('Error', 'Please write something to post.');
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
      formData.append('content', newPostContent.trim());
      
      if (newPostImage) {
        formData.append('image', {
          uri: newPostImage,
          type: 'image/jpeg',
          name: `post_${Date.now()}.jpg`,
        } as any);
      }

      const response = await apiClient.post(ENDPOINTS.POST.CREATE, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setShowAddPostModal(false);
        setNewPostContent('');
        setNewPostImage(null);
        await fetchPosts(); // Refresh posts
        Alert.alert('Success! 🎉', 'Post created successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to create post');
      }
    } catch (error: any) {
      let errorMessage = 'Failed to create post. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        router.replace('/auth/login');
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || 'Invalid post data. Please check your input.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <FontAwesome5 name="spinner" size={24} color="#0E0F0F" />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" translucent />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>PetHub Community</Text>
            <Text style={styles.subtitle}>Share updates from your pet shop</Text>
          </View>
          <TouchableOpacity
            style={styles.addPostButton}
            onPress={() => setShowAddPostModal(true)}
          >
            <FontAwesome5 name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.addPostButtonText}>Create Post</Text>
          </TouchableOpacity>
        </View>

        {/* Posts */}
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="newspaper" size={48} color="#E0E0E0" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Create your first post to share updates!</Text>
          </View>
        ) : (
          <View style={styles.postsContainer}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUser?.id}
                onDeletePost={handleDeletePost}
                showMenuButton={true} // Shop owners can delete their own posts
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Post Modal */}
      <Modal
        visible={showAddPostModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddPostModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity
                onPress={() => setShowAddPostModal(false)}
                style={styles.closeButton}
              >
                <FontAwesome5 name="times" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.contentInput}
              placeholder="Write your message..."
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              numberOfLines={4}
              placeholderTextColor="#999999"
            />

            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <FontAwesome5 name="camera" size={16} color="#0E0F0F" />
              <Text style={styles.imagePickerText}>
                {newPostImage ? 'Change Image' : 'Add Image (Optional)'}
              </Text>
            </TouchableOpacity>

            {newPostImage && (
              <Image source={{ uri: newPostImage }} style={styles.selectedImage} />
            )}

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleCreatePost}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Creating...' : 'Create Post'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

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
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0E0F0F',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
  },
  addPostButton: {
    backgroundColor: '#0E0F0F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addPostButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
  },
  postsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    width: width - 40,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
  },
  closeButton: {
    padding: 5,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#0E0F0F',
    marginBottom: 15,
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  imagePickerText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#0E0F0F',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#0E0F0F',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
}); 