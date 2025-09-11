// File: profile.tsx
// Description: User profile screen with posts, profile management, and shop application functionality

import { StyleSheet, Text, View, TouchableOpacity, Alert, Image, ScrollView, RefreshControl, StatusBar, Modal } from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient, ENDPOINTS } from '../../config/api';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Dimensions } from 'react-native';
import { formatImageUrl } from '../../utils/imageUtils';

const { width } = Dimensions.get('window');

// Interface for user data structure
interface User {
  id: string;
  fullName: string;
  email: string;
  profilePicture: string;
  birthdate: string;
  gender: string;
  isShopOwner: boolean;
}

// Interface for post data structure
interface Post {
  id: string;
  content: string;
  image?: string;
  createdAt: string;
  likesCount?: number;
  likes?: number;
  comments?: Comment[];
  userId: string;
}

// Interface for comment data structure
interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user?: {
    fullName: string;
  };
}

const Profile = () => {
  const [user, setUser] = useState<User>({ 
    id: '',
    fullName: '', 
    email: '', 
    profilePicture: '', 
    birthdate: '', 
    gender: '',
    isShopOwner: false 
  });
  const [petCount, setPetCount] = useState(0);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [profileMenuPosition, setProfileMenuPosition] = useState({ x: 0, y: 0 });

  // Fetch user data from API
  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }

      const response = await apiClient.get(ENDPOINTS.USER.PROFILE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error: any) {
      console.error('[fetchUserData] Error:', error.message, error.stack);
      Alert.alert('Error', 'Failed to fetch user data. Please try again.');
    }
  };

  // Fetch pet count from API
  const fetchPetCount = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await apiClient.get(ENDPOINTS.PET.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPetCount(response.data.length);
    } catch (error: any) {
      console.error('[fetchPetCount] Error:', error.message, error.stack);
      // Don't show alert for pet count as it's not critical
    }
  };

  // Fetch user posts from API
  const fetchUserPosts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !user.id) return;

      const response = await apiClient.get(ENDPOINTS.POST.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Handle different API response structures
      let postsData = [];
      if (Array.isArray(response.data)) {
        postsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        postsData = response.data.data;
      } else {
        console.log('[fetchUserPosts] Unexpected response structure:', response.data);
        setUserPosts([]);
        return;
      }
      
      // Filter posts by current user
      const currentUserPosts = postsData.filter((post: Post) => post.userId === user.id);
      setUserPosts(currentUserPosts);
      
    } catch (error: any) {
      console.error('[fetchUserPosts] Error:', error.message, error.stack);
      setUserPosts([]);
    }
  };

  // Calculate age from birthdate
  const calculateAge = (birthdate: string): string => {
    if (!birthdate) return 'N/A';
    try {
      const birth = new Date(birthdate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return `${age} years old`;
    } catch (error) {
      return 'N/A';
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      Alert.alert('Logged out', 'You have been logged out successfully.');
      router.replace('/auth/login');
    } catch (err: any) {
      console.error('[handleLogout] Error:', err.message, err.stack);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  // Navigate to shop application screen
  const handleShopApplication = () => {
    setShowProfileMenu(false);
    router.push('/editandaddscreens/shopapplication');
  };

  // Navigate to edit profile screen
  const handleEditProfile = () => {
    setShowProfileMenu(false);
    router.push('/editandaddscreens/editprofile');
  };

  // Handle post editing (placeholder for future implementation)
  const handleEditPost = (post: Post) => {
    setShowPostMenu(false);
          // Navigate to edit post screen (to be implemented)
      console.log('Edit post:', post.id);
    Alert.alert('Coming Soon', 'Edit post functionality will be available soon.');
  };

  // Handle post deletion
  const handleDeletePost = async (post: Post) => {
    setShowPostMenu(false);
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert('Error', 'Authentication token not found. Please log in again.');
                return;
              }

              await apiClient.delete(ENDPOINTS.POST.DELETE(post.id), {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              // Refresh posts after deletion
              fetchUserPosts();
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error: any) {
              console.error('[handleDeletePost] Error:', error.message, error.stack);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Open post menu modal
  const openPostMenu = (post: Post) => {
    setSelectedPost(post);
    setShowPostMenu(true);
  };

  // Open profile menu modal
  const openProfileMenu = () => {
    // Position menu on the right side, below the button
    setProfileMenuPosition({ x: width - 220, y: 120 });
    setShowProfileMenu(true);
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

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchUserData(),
        fetchPetCount(),
        fetchUserPosts()
      ]);
    } catch (error) {
      console.error('[onRefresh] Error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchUserData();
    fetchPetCount();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
      fetchPetCount();
      if (user.id) {
        fetchUserPosts();
      }
    }, [user.id])
  );

  // Fetch user posts after user data is loaded
  useEffect(() => {
    if (user.id) {
      fetchUserPosts();
    }
  }, [user.id]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#424242" translucent />
      
      {/* Header with Profile Picture */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image
            source={
              user.profilePicture
                ? { uri: formatImageUrl(user.profilePicture) || '' }
                : require('../../assets/images/pet.png')
            }
            style={styles.profilePicture}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user.fullName || 'User'}</Text>
            <Text style={styles.userEmail}>{user.email || 'N/A'}</Text>
            <Text style={styles.userBirthdate}>{user.birthdate ? new Date(user.birthdate).toLocaleDateString() : 'N/A'}</Text>
            <Text style={styles.userPets}>Pets: {petCount}</Text>
          </View>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={openProfileMenu}
          >
            <Image source={require('../../assets/icons/menu.png')} style={styles.menuIcon} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Posts Section */}
        <View style={styles.postsSection}>
          <Text style={styles.postsTitle}>Posts</Text>
          {userPosts.length > 0 ? (
            userPosts.map((post: Post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Image
                    source={
                      user.profilePicture
                        ? { uri: formatImageUrl(user.profilePicture) || '' }
                        : require('../../assets/images/pet.png')
                    }
                    style={styles.postProfilePicture}
                  />
                  <View style={styles.postUserInfo}>
                    <Text style={styles.postUserName}>{user.fullName || 'User'}</Text>
                    <Text style={styles.postTime}>{formatDate(post.createdAt)}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.postMenuButton}
                    onPress={() => openPostMenu(post)}
                  >
                    <Image source={require('../../assets/icons/menu.png')} style={styles.postMenuIcon} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.postContent}>{post.content}</Text>
                
                {/* Post Image */}
                {post.image && (
                  <View style={styles.postImageContainer}>
                    <Image
                      source={{ uri: formatImageUrl(post.image) || '' }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
                
                <View style={styles.postActions}>
                  <View style={styles.postAction}>
                    <Image source={require('../../assets/icons/heart.png')} style={styles.actionIcon} />
                    <Text style={styles.actionText}>{post.likesCount || post.likes || 0}</Text>
                  </View>
                  <View style={styles.postAction}>
                    <Image source={require('../../assets/icons/comment.png')} style={styles.actionIcon} />
                    <Text style={styles.actionText}>{post.comments?.length || 0}</Text>
                  </View>
                </View>
                {post.comments && post.comments.length > 0 && (
                  <View style={styles.commentsSection}>
                    <Text style={styles.commentCount}>{post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}</Text>
                    {post.comments.slice(0, 1).map((comment: Comment, index: number) => (
                      <View key={index} style={styles.commentItem}>
                        <Text style={styles.commenterName}>{comment.user?.fullName || 'User'}</Text>
                        <Text style={styles.commentText}>{comment.content}</Text>
                        <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
                        <TouchableOpacity style={styles.replyButton}>
                          <Text style={styles.replyText}>Reply</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.noPostsContainer}>
              <Text style={styles.noPostsText}>No posts yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Profile Menu Modal */}
      <Modal
        visible={showProfileMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        >
          <View style={[styles.menuContainer, { 
            position: 'absolute',
            top: profileMenuPosition.y,
            left: profileMenuPosition.x,
          }]}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleEditProfile}
            >
              <Image source={require('../../assets/icons/edit.png')} style={styles.modalMenuIcon} />
              <Text style={styles.menuText}>Edit Profile</Text>
            </TouchableOpacity>
            
            {!user.isShopOwner && (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleShopApplication}
              >
                <Image source={require('../../assets/icons/shop.png')} style={styles.modalMenuIcon} />
                <Text style={styles.menuText}>Apply as Shop Owner</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleLogout}
            >
              <Image source={require('../../assets/icons/logout.png')} style={styles.modalMenuIcon} />
              <Text style={[styles.menuText, styles.logoutText]}>Log out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Post Menu Modal */}
      <Modal
        visible={showPostMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPostMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPostMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => selectedPost && handleDeletePost(selectedPost)}
            >
              <Image source={require('../../assets/icons/delete.png')} style={styles.modalMenuIcon} />
              <Text style={[styles.menuText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0E0E0',
  },
  header: {
    backgroundColor: '#424242',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    backgroundColor: '#E0E0E0',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#CCCCCC',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  userBirthdate: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userPets: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFFFFF',
  },
  modalMenuIcon: {
    width: 18,
    height: 18,
    tintColor: '#000000',
  },
  postMenuIcon: {
    width: 16,
    height: 16,
    tintColor: '#666666',
  },
  content: {
    flex: 1,
  },
  postsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  postsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postProfilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#E0E0E0',
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: '#666666',
  },
  postMenuButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
    marginBottom: 12,
  },
  postImageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
    tintColor: '#666666',
  },
  actionText: {
    fontSize: 14,
    color: '#666666',
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  commentCount: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
  },
  commentItem: {
    marginBottom: 8,
  },
  commenterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
  },
  replyButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  replyText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
  noPostsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noPostsText: {
    fontSize: 16,
    color: '#666666',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
  logoutText: {
    color: '#FF4757',
  },
  deleteText: {
    color: '#FF4757',
  },
});