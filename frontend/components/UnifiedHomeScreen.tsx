// File: UnifiedHomeScreen.tsx
// Description: Unified home screen component for both users and shop owners with role-based permissions

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { apiClient, ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import PostCard from './PostCard';
import * as ImagePicker from 'expo-image-picker';

interface Post {
  id: string;
  userId: string;
  userName: string;
  userProfilePicture?: string;
  content: string;
  createdAt: string;
  likes: number;
  likesCount?: number;
  commentsCount?: number;
  isLiked: boolean;
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
  comments?: any[];
  showAllComments?: boolean;
}

interface UnifiedHomeScreenProps {
  currentUserIsShopOwner: boolean;
  currentUserId?: string;
}

export default function UnifiedHomeScreen({ currentUserIsShopOwner, currentUserId }: UnifiedHomeScreenProps) {
  // State management
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Post creation states (only for shop owners)
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch posts from API
  const fetchPosts = useCallback(async () => {
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

      if (response.data.success && response.data.data) {
        setPosts(response.data.data);
      } else if (Array.isArray(response.data)) {
        setPosts(response.data);
      } else {
        console.error('Unexpected response structure:', response.data);
        setPosts([]);
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.');
        router.replace('/auth/login');
      } else {
        Alert.alert('Error', 'Failed to load posts. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load posts on component mount
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, [fetchPosts]);

  // Image picker for post creation (shop owners only)
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNewPostImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Handle post creation (shop owners only)
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

  // Handle like/unlike post
  const handleLikePost = async (postId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await apiClient.post(ENDPOINTS.POST.LIKE(postId), {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, isLiked: true, likes: (post.likes || 0) + 1 }
            : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleUnlikePost = async (postId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await apiClient.post(ENDPOINTS.POST.UNLIKE(postId), {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, isLiked: false, likes: Math.max((post.likes || 0) - 1, 0) }
            : post
        )
      );
    } catch (error) {
      console.error('Error unliking post:', error);
    }
  };

  // Handle add comment
  const handleAddComment = async (postId: string, content: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please log in to comment.');
        return;
      }

      const response = await apiClient.post(ENDPOINTS.POST.COMMENT(postId), {
        content: content.trim(),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        Alert.alert('Success! 🎉', 'Comment added successfully!');
        await fetchPosts(); // Refresh posts to show new comment
      } else {
        throw new Error(response.data.message || 'Failed to add comment');
      }
    } catch (error: any) {
      let errorMessage = 'Failed to add comment. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        router.replace('/auth/login');
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || 'Invalid comment data. Please check your input.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Post not found. Please refresh and try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Comment Failed', errorMessage);
      throw error; // Re-throw to handle in PostCard
    }
  };

  // Handle toggle comments visibility
  const handleToggleComments = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, showAllComments: !post.showAllComments }
          : post
      )
    );
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
            <Text style={styles.subtitle}>
              {currentUserIsShopOwner 
                ? 'Share updates from your pet shop'
                : 'Connect with pet owners and shops'
              }
            </Text>
          </View>
          {currentUserIsShopOwner && (
            <TouchableOpacity
              style={styles.addPostButton}
              onPress={() => setShowAddPostModal(true)}
            >
              <FontAwesome5 name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.addPostButtonText}>Create Post</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Posts */}
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="newspaper" size={48} color="#E0E0E0" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>
              {currentUserIsShopOwner 
                ? 'Create your first post to share updates!'
                : 'Be the first to start a conversation!'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.postsContainer}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                currentUserIsShopOwner={currentUserIsShopOwner}
                onLikePost={handleLikePost}
                onUnlikePost={handleUnlikePost}
                onAddComment={handleAddComment}
                onToggleComments={handleToggleComments}
                showMenuButton={currentUserIsShopOwner}
                showInteractions={true}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Post Modal (Shop Owners Only) */}
      {currentUserIsShopOwner && (
        <Modal
          visible={showAddPostModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddPostModal(false)}
        >
          <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Post</Text>
                <TouchableOpacity
                  onPress={() => setShowAddPostModal(false)}
                  style={styles.closeButton}
                >
                  <FontAwesome5 name="times" size={20} color="#666666" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.postInput}
                placeholder="What's on your mind? Share updates about your shop, new arrivals, or pet care tips..."
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
                maxLength={1000}
                autoFocus
              />

              {newPostImage && (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: newPostImage }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setNewPostImage(null)}
                  >
                    <FontAwesome5 name="times" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={pickImage}
                >
                  <FontAwesome5 name="image" size={16} color="#4ECDC4" />
                  <Text style={styles.imageButtonText}>Add Photo</Text>
                </TouchableOpacity>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowAddPostModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton, 
                      styles.postButton,
                      (!newPostContent.trim() || isSubmitting) && styles.disabledButton
                    ]}
                    onPress={handleCreatePost}
                    disabled={!newPostContent.trim() || isSubmitting}
                  >
                    <Text style={styles.postButtonText}>
                      {isSubmitting ? 'Posting...' : 'Post'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
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
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  addPostButton: {
    backgroundColor: '#4ECDC4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  addPostButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  postsContainer: {
    padding: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
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
    padding: 4,
  },
  postInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0E0F0F',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  imageButtonText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  postButton: {
    backgroundColor: '#4ECDC4',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
