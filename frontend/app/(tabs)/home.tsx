// File: home.tsx
// Description: User home screen with forum-style text posts, commenting, and replying functionality

import React, { useState, useEffect, useRef } from 'react';
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

const { width, height } = Dimensions.get('window');

// Interface for post data structure
interface Post {
  id: string;
  userId: string;
  userName: string;
  userProfilePicture: string;
  content: string;
  createdAt: string;
  likes: number;
  likesCount?: number;
  comments: Comment[];
  isLiked: boolean;
  isShopOwner?: boolean;
  shopId?: string;
  shopName?: string;
  showAllComments?: boolean;
  user?: {
    fullName: string;
    profilePicture: string;
    id: string;
    isShopOwner: boolean;
  };
  image?: string; // Added image property
}

// Interface for comment data structure
interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  replies: Reply[];
  showReplies?: boolean;
}

// Interface for reply data structure
interface Reply {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPostContent, setEditPostContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [newPostImage, setNewPostImage] = useState<string | null>(null);

  // Fetch current user data
  useEffect(() => {
    fetchCurrentUser();
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
      console.error('[fetchCurrentUser] Error:', error);
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
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPosts();
    } catch (error) {
      console.error('[onRefresh] Error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle post like/unlike
  const handleLike = async (postId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        return;
      }

      // Find the post first
      const post = posts.find(p => p.id === postId);
      if (!post) {
        console.error('[handleLike] Post not found:', postId);
        return;
      }

      // Update local state immediately for better UX
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                likes: p.isLiked ? Math.max(0, (p.likes || 0) - 1) : (p.likes || 0) + 1,
                likesCount: p.isLiked ? Math.max(0, (p.likesCount || p.likes || 0) - 1) : (p.likesCount || p.likes || 0) + 1,
                isLiked: !p.isLiked 
              }
            : p
        )
      );
      
      // Try to sync with backend
      try {
        const endpoint = post.isLiked ? ENDPOINTS.POST.UNLIKE : ENDPOINTS.POST.LIKE;
        const response = await apiClient.post(endpoint(postId), {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.data.success) {
          console.log('[handleLike] Backend sync successful:', response.data.message);
        } else {
          console.log('[handleLike] Backend sync failed:', response.data.message);
        }
      } catch (backendError: any) {
        console.log('[handleLike] Backend sync failed, keeping local state:', backendError?.message || 'Unknown error');
        // Keep local state even if backend fails
      }
      
    } catch (error: any) {
      console.error('[handleLike] Error:', error.message, error.stack);
      Alert.alert('Error', 'Failed to like post. Please try again.');
    }
  };

  // Handle adding new post
  const handleAddPost = async () => {
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
      
      const response = await apiClient.post(ENDPOINTS.POST.CREATE, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setShowAddPostModal(false);
        setNewPostContent('');
        
        // Show success message
        Alert.alert('Success! 🎉', 'Post created successfully!');
        
        // Refresh posts to show the new post
        await fetchPosts();
      } else {
        throw new Error(response.data.message || 'Failed to create post');
      }
    } catch (error: any) {
      console.error('[handleAddPost] Error:', error.message, error.stack);
      
      let errorMessage = 'Unable to create post. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        router.replace('/auth/login');
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || 'Invalid post data. Please check your input.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Post Creation Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle adding comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) {
      Alert.alert('Error', 'Please write a comment.');
      return;
    }

    setIsCommenting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }

      const response = await apiClient.post(ENDPOINTS.POST.COMMENT(selectedPost.id), {
        content: newComment.trim(),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setShowCommentModal(false);
        setNewComment('');
        setSelectedPost(null);
        
        // Show success message
        Alert.alert('Success! 🎉', 'Comment added successfully!');
        
        // Refresh posts to show the new comment
        await fetchPosts();
      } else {
        throw new Error(response.data.message || 'Failed to add comment');
      }
    } catch (error: any) {
      console.error('[handleAddComment] Error:', error.message, error.stack);
      
      let errorMessage = 'Unable to post comment. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        router.replace('/auth/login');
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || 'Invalid comment data. Please check your input.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Post not found. Please refresh and try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Comment Failed', errorMessage);
    } finally {
      setIsCommenting(false);
    }
  };

  // Handle adding reply
  const handleAddReply = async () => {
    if (!newReply.trim() || !selectedComment || !selectedPost) {
      Alert.alert('Error', 'Please write a reply.');
      return;
    }

    setIsReplying(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        return;
      }

      const response = await apiClient.post(ENDPOINTS.POST.REPLIES(selectedPost.id, selectedComment.id), {
        content: newReply.trim(),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setShowReplyModal(false);
        setNewReply('');
        setSelectedComment(null);
        setSelectedPost(null);
        fetchPosts();
        Alert.alert('Success', 'Reply added successfully!');
      }
    } catch (error: any) {
      console.error('[handleAddReply] Error:', error.message, error.stack);
      Alert.alert('Error', 'Failed to add reply. Please try again.');
    } finally {
      setIsReplying(false);
    }
  };

  // Handle editing post
  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setEditPostContent(post.content);
    setShowEditModal(true);
  };

  // Handle updating post
  const handleUpdatePost = async () => {
    if (!editingPost || !editPostContent.trim()) {
      Alert.alert('Error', 'Please write something to post.');
      return;
    }

    setIsEditing(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        return;
      }

      const response = await apiClient.put(ENDPOINTS.POST.UPDATE(editingPost.id), {
        content: editPostContent.trim(),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setShowEditModal(false);
        setEditPostContent('');
        setEditingPost(null);
        fetchPosts();
        Alert.alert('Success', 'Post updated successfully!');
      }
    } catch (error: any) {
      console.error('[handleUpdatePost] Error:', error.message, error.stack);
      Alert.alert('Error', 'Failed to update post. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  // Handle post image pick
  const pickPostImage = async () => {
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
      console.error('[pickPostImage] Error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

    // Handle creating post with image
  const handleCreatePostWithImage = async () => {
    if (!newPostContent.trim()) {
      Alert.alert('Error', 'Please write something to post.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
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
        fetchPosts();
        Alert.alert('Success! 🎉', 'Post created successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to create post');
      }
    } catch (error: any) {
      console.error('[handleCreatePostWithImage] Error:', error.message, error.stack);
      
      let errorMessage = 'Unable to create post. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        router.replace('/auth/login');
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || 'Invalid post data. Please check your input.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Post Creation Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle replies visibility
  const toggleReplies = (postId: string, commentId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? {
              ...post,
              comments: post.comments.map(comment =>
                comment.id === commentId
                  ? { ...comment, showReplies: !comment.showReplies }
                  : comment
              )
            }
          : post
      )
    );
  };

  // Toggle comments visibility
  const toggleComments = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return { ...post, showAllComments: !post.showAllComments };
        }
        return post;
      })
    );
  };

  // Navigate to shop profile
  const handleShopProfilePress = (shopId: string, shopName: string) => {
    router.push(`/shop-profile/${shopId}`);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
      }
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Load posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" translucent />
      
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PetHub Community</Text>
          <View style={styles.headerButtons}>

            <TouchableOpacity
              style={styles.addPostButton}
              onPress={() => setShowAddPostModal(true)}
            >
              <FontAwesome5 name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.addPostButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts */}
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share something!</Text>
          </View>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              {/* Post Header */}
              <View style={styles.postHeader}>
                                 <TouchableOpacity 
                   style={styles.userInfo}
                   onPress={() => {
                     if (post.isShopOwner && post.shopId) {
                       handleShopProfilePress(post.shopId, post.shopName || '');
                     }
                   }}
                   activeOpacity={0.7}
                 >
                  <Image
                    source={
                      post.user?.profilePicture
                        ? { uri: formatImageUrl(post.user.profilePicture) || '' }
                        : require('../../assets/images/pet.png')
                    }
                    style={styles.userProfileImage}
                  />
                  <View style={styles.userDetails}>
                                         <Text style={[
                       styles.userName,
                       post.isShopOwner && styles.clickableShopName
                     ]}>
                       {post.isShopOwner ? post.shopName : (post.user?.fullName || post.userName)}
                     </Text>
                    <Text style={styles.postTime}>{formatDate(post.createdAt)}</Text>
                  </View>
                </TouchableOpacity>
                
                                 {post.isShopOwner && (
                   <TouchableOpacity 
                     style={styles.shopBadge}
                     onPress={() => {
                       if (post.shopId) {
                         handleShopProfilePress(post.shopId, post.shopName || '');
                       }
                     }}
                     activeOpacity={0.7}
                   >
                     <FontAwesome5 name="store" size={12} color="#0E0F0F" />
                     <Text style={styles.shopBadgeText}>Shop</Text>
                   </TouchableOpacity>
                 )}
                
                {/* Edit Button - Only show for user's own posts */}
                {post.userId === currentUser?.id && (
                  <TouchableOpacity
                    onPress={() => handleEditPost(post)}
                    style={styles.editButton}
                  >
                    <FontAwesome5 name="edit" size={14} color="#4ECDC4" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Post Content */}
              <Text style={styles.postContent}>{post.content}</Text>

              {/* Post Image */}
              {post.image && (
                <Image
                  source={{ uri: formatImageUrl(post.image) || '' }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              )}

              {/* Post Actions */}
              <View style={styles.postActions}>
                <TouchableOpacity
                  onPress={() => handleLike(post.id)}
                  style={styles.actionButton}
                  activeOpacity={0.7}
                >
                  <FontAwesome5
                    name="heart"
                    size={16}
                    color={post.isLiked ? '#FF4757' : '#666666'}
                    solid={post.isLiked}
                  />
                  <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
                    {post.likesCount || post.likes}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedPost(post);
                    setShowCommentModal(true);
                  }}
                  style={styles.actionButton}
                >
                  <FontAwesome5 name="comment" size={16} color="#666666" />
                  <Text style={styles.actionText}>{post.comments.length}</Text>
                </TouchableOpacity>
              </View>

              {/* Comments Section */}
              {post.comments.length > 0 && (
                <View style={styles.commentsSection}>
                  <Text style={styles.commentsTitle}>
                    {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
                  </Text>
                  
                  {/* Show only 2 most recent comments if more than 2 */}
                  {(post.comments.length > 2 && !post.showAllComments ? post.comments.slice(-2) : post.comments).map((comment) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentUserName}>{comment.userName}</Text>
                        <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
                      </View>
                      <Text style={styles.commentContent}>{comment.content}</Text>
                      
                      {/* Reply Button */}
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedPost(post);
                          setSelectedComment(comment);
                          setShowReplyModal(true);
                        }}
                        style={styles.replyButton}
                      >
                        <Text style={styles.replyButtonText}>Reply</Text>
                      </TouchableOpacity>

                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <View style={styles.repliesSection}>
                          <TouchableOpacity
                            onPress={() => toggleReplies(post.id, comment.id)}
                            style={styles.toggleRepliesButton}
                          >
                            <Text style={styles.toggleRepliesText}>
                              {comment.showReplies ? 'Hide' : 'Show'} {comment.replies.length} repl{comment.replies.length === 1 ? 'y' : 'ies'}
                            </Text>
                            <FontAwesome5
                              name={comment.showReplies ? 'chevron-up' : 'chevron-down'}
                              size={12}
                              color="#666666"
                            />
                          </TouchableOpacity>
                          
                          {comment.showReplies && (
                            <View style={styles.repliesList}>
                              {comment.replies.map((reply) => (
                                <View key={reply.id} style={styles.replyItem}>
                                  <View style={styles.replyHeader}>
                                    <Text style={styles.replyUserName}>{reply.userName}</Text>
                                    <Text style={styles.replyTime}>{formatDate(reply.createdAt)}</Text>
                                  </View>
                                  <Text style={styles.replyContent}>{reply.content}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                  
                  {/* Show more comments button */}
                  {post.comments.length > 2 && (
                    <TouchableOpacity
                      onPress={() => toggleComments(post.id)}
                      style={styles.toggleCommentsButton}
                    >
                      <Text style={styles.toggleCommentsText}>
                        {post.showAllComments ? 'Show less' : `View ${post.comments.length - 2} more comments`}
                      </Text>
                      <FontAwesome5
                        name={post.showAllComments ? 'chevron-up' : 'chevron-down'}
                        size={12}
                        color="#666666"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))
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
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              style={styles.postInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#999999"
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.imagePickerButton} onPress={pickPostImage}>
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
              onPress={handleCreatePostWithImage}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Posting...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Comment Modal */}
      <Modal
        visible={showCommentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommentModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Comment</Text>
              <TouchableOpacity
                onPress={() => setShowCommentModal(false)}
                style={styles.closeButton}
              >
                <FontAwesome5 name="times" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor="#999999"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, isCommenting && styles.submitButtonDisabled]}
              onPress={handleAddComment}
              disabled={isCommenting}
            >
              <Text style={styles.submitButtonText}>
                {isCommenting ? 'Commenting...' : 'Comment'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Reply Modal */}
      <Modal
        visible={showReplyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReplyModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reply to Comment</Text>
              <TouchableOpacity
                onPress={() => setShowReplyModal(false)}
                style={styles.closeButton}
              >
                <FontAwesome5 name="times" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Write a reply..."
              placeholderTextColor="#999999"
              value={newReply}
              onChangeText={setNewReply}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, isReplying && styles.submitButtonDisabled]}
              onPress={handleAddReply}
              disabled={isReplying}
            >
              <Text style={styles.submitButtonText}>
                {isReplying ? 'Replying...' : 'Reply'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Post Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Post</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <FontAwesome5 name="times" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.postInput}
              placeholder="Write your post..."
              value={editPostContent}
              onChangeText={setEditPostContent}
              multiline
              numberOfLines={6}
              placeholderTextColor="#999999"
            />

            <TouchableOpacity
              style={[styles.submitButton, isEditing && styles.submitButtonDisabled]}
              onPress={handleUpdatePost}
              disabled={isEditing}
            >
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Updating...' : 'Update Post'}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0E0F0F',
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
  postCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userDetails: {
    flex: 1,
  },
     userName: {
     fontSize: 16,
     fontWeight: '600',
     color: '#0E0F0F',
     marginBottom: 2,
   },
   clickableShopName: {
     color: '#4ECDC4',
     textDecorationLine: 'underline',
   },
  postTime: {
    fontSize: 12,
    color: '#999999',
  },
     shopBadge: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#F8F9FA',
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 12,
     borderWidth: 1,
     borderColor: '#4ECDC4',
   },
  shopBadgeText: {
    fontSize: 12,
    color: '#0E0F0F',
    fontWeight: '500',
    marginLeft: 4,
  },
  postContent: {
    fontSize: 16,
    color: '#0E0F0F',
    lineHeight: 24,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
    marginBottom: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 30,
  },
  actionText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 5,
  },
  likedText: {
    color: '#FF4757',
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  commentsTitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },
  commentItem: {
    marginBottom: 15,
    paddingLeft: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E0F0F',
  },
  commentTime: {
    fontSize: 12,
    color: '#999999',
  },
  commentContent: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
  replyButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  replyButtonText: {
    fontSize: 12,
    color: '#0E0F0F',
    fontWeight: '500',
  },
  repliesSection: {
    marginTop: 8,
  },
  toggleRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleRepliesText: {
    fontSize: 12,
    color: '#666666',
    marginRight: 5,
  },
  toggleCommentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 5,
  },
  toggleCommentsText: {
    fontSize: 12,
    color: '#666666',
    marginRight: 5,
  },
  repliesList: {
    marginLeft: 15,
  },
  replyItem: {
    marginBottom: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  replyUserName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E0F0F',
  },
  replyTime: {
    fontSize: 10,
    color: '#999999',
  },
  replyContent: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
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
    maxHeight: height * 0.6,
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
  postInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#0E0F0F',
    marginBottom: 20,
    minHeight: 120,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#0E0F0F',
    marginBottom: 20,
    minHeight: 100,
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 10,
  },
  editButtonText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '500',
    marginLeft: 5,
  },

  headerButtons: {
    flexDirection: 'row',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  imagePickerText: {
    fontSize: 14,
    color: '#0E0F0F',
    marginLeft: 10,
  },
  selectedImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
  },
});