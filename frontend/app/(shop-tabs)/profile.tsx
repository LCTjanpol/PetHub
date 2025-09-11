// File: profile.tsx
// Description: Shop owner's profile screen with posts, profile management, and enhanced UI

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Modal
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { apiClient, ENDPOINTS } from '../../config/api';
import { formatImageUrl } from '../../utils/imageUtils';
import { formatTimeForDisplay, formatRelativeTime } from '../../utils/timeUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface ShopData {
  id: string;
  shopName: string;
  shopImage: string;
  bio: string;
  contactNumber: string;
  shopLocation: string;
  openingTime: string;
  closingTime: string;
  availableDays: string[];
  isAvailable: boolean;
  shopType: string;
}

interface UserData {
  fullName: string;
  email: string;
  profilePicture: string;
  birthdate: string;
  gender: string;
}

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

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user?: {
    fullName: string;
  };
}

export default function ShopOwnerProfileScreen() {
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }
      
      // Fetch shop data
      const shopResponse = await apiClient.get(ENDPOINTS.SHOP.PROFILE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Handle different response structures
      let shopDataToSet;
      if (shopResponse.data.success && shopResponse.data.data) {
        shopDataToSet = shopResponse.data.data;
      } else if (shopResponse.data.success) {
        shopDataToSet = shopResponse.data;
      } else {
        shopDataToSet = shopResponse.data;
      }
      
      setShopData(shopDataToSet);
      
      // Fetch user data
      const userResponse = await apiClient.get(ENDPOINTS.USER.PROFILE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      let userDataToSet;
      if (userResponse.data.success && userResponse.data.data) {
        userDataToSet = userResponse.data.data;
      } else if (userResponse.data.success) {
        userDataToSet = userResponse.data;
      } else {
        userDataToSet = userResponse.data;
      }
      
      setUserData(userDataToSet);
      
      // Fetch user posts
      await fetchUserPosts();
    } catch (error: any) {
      console.error('[fetchData] Error:', error.message, error.stack);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.');
        router.replace('/auth/login');
      } else {
        Alert.alert('Error', 'Failed to load profile data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user posts from API
  const fetchUserPosts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !userData?.id) return;

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
      const currentUserPosts = postsData.filter((post: Post) => post.userId === userData.id);
      setUserPosts(currentUserPosts);
      
    } catch (error: any) {
      console.error('[fetchUserPosts] Error:', error.message, error.stack);
      setUserPosts([]);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      Alert.alert('Logged out', 'You have been logged out.');
      router.replace('/auth/login');
    } catch (err) {
      console.error('[handleLogout] Error:', err);
      Alert.alert('Error', 'Failed to log out.');
    }
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

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      console.error('[onRefresh] Error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Using the new time utility function
  const formatTime = (time: string | null | undefined) => formatTimeForDisplay(time || '');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile data...</Text>
      </View>
    );
  }

  if (!shopData || !userData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile data</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" translucent />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User Profile Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>User Profile</Text>
            <TouchableOpacity
              onPress={() => router.push('/editandaddscreens/editprofile')}
              style={styles.editButton}
            >
              <FontAwesome5 name="user-edit" size={16} color="#0E0F0F" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileCard}>
            <Image
              source={
                userData.profilePicture
                  ? { uri: formatImageUrl(userData.profilePicture) || '' }
                  : require('../../assets/images/pet.png')
              }
              style={styles.userProfileImage}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userData.fullName || 'Not set'}</Text>
              <Text style={styles.userEmail}>{userData.email || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Shop Profile Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop Profile</Text>
            <TouchableOpacity
              onPress={() => router.push('/shopedit/editshop')}
              style={styles.editButton}
            >
              <FontAwesome5 name="store" size={16} color="#0E0F0F" />
              <Text style={styles.editButtonText}>Edit Shop</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.shopCard}>
            <View style={styles.shopImageBanner}>
              <Image
                source={
                  shopData.shopImage
                    ? { uri: formatImageUrl(shopData.shopImage) || '' }
                    : require('../../assets/images/shop.png')
                }
                style={styles.shopBannerImage}
              />
              <View style={styles.shopStatusOverlay}>
                <View style={[styles.statusBadge, { backgroundColor: shopData.isAvailable ? '#4CAF50' : '#F44336' }]}>
                  <Text style={styles.statusText}>{shopData.isAvailable ? 'Open' : 'Closed'}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{shopData.shopName || 'Not set'}</Text>
              <Text style={styles.shopType}>{shopData.shopType || 'Not set'}</Text>
              <View style={styles.locationContainer}>
                <FontAwesome5 name="map-marker-alt" size={12} color="#4ECDC4" />
                <Text style={styles.shopLocation}>{shopData.shopLocation || 'Not set'}</Text>
              </View>
              <View style={styles.contactContainer}>
                <FontAwesome5 name="phone" size={12} color="#4ECDC4" />
                <Text style={styles.shopContact}>{shopData.contactNumber || 'Not set'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.shopDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Business Hours:</Text>
              <Text style={styles.detailValue}>
                {formatTime(shopData.openingTime)} - {formatTime(shopData.closingTime)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Available Days:</Text>
              <Text style={styles.detailValue}>
                {shopData.availableDays && shopData.availableDays.length > 0 
                  ? shopData.availableDays.join(', ') 
                  : 'Not set'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: shopData.isAvailable ? '#4CAF50' : '#F44336' }]} />
                <Text style={styles.statusText}>
                  {shopData.isAvailable ? 'Open' : 'Closed'}
                </Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bio:</Text>
              <Text style={styles.detailValue}>{shopData.bio || 'No bio available'}</Text>
            </View>
          </View>
        </View>

        {/* Posts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Posts</Text>
            <Text style={styles.postsCount}>{userPosts.length} posts</Text>
          </View>
          
          {userPosts.length > 0 ? (
            userPosts.map((post: Post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Image
                    source={
                      userData.profilePicture
                        ? { uri: formatImageUrl(userData.profilePicture) || '' }
                        : require('../../assets/images/pet.png')
                    }
                    style={styles.postProfilePicture}
                  />
                  <View style={styles.postUserInfo}>
                    <Text style={styles.postUserName}>{userData.fullName || 'User'}</Text>
                    <Text style={styles.postTime}>{formatRelativeTime(post.createdAt)}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.postMenuButton}
                    onPress={() => openPostMenu(post)}
                  >
                    <FontAwesome5 name="ellipsis-v" size={16} color="#666666" />
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
                    <FontAwesome5 name="heart" size={14} color="#FF6B6B" />
                    <Text style={styles.actionText}>{post.likesCount || post.likes || 0}</Text>
                  </View>
                  <View style={styles.postAction}>
                    <FontAwesome5 name="comment" size={14} color="#4ECDC4" />
                    <Text style={styles.actionText}>{post.comments?.length || 0}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noPostsContainer}>
              <FontAwesome5 name="edit" size={48} color="#CCCCCC" />
              <Text style={styles.noPostsText}>No posts yet</Text>
              <Text style={styles.noPostsSubtext}>Share updates about your shop to get started</Text>
            </View>
          )}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <FontAwesome5 name="sign-out-alt" size={16} color="#FFFFFF" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
              <FontAwesome5 name="trash" size={16} color="#FF4757" />
              <Text style={[styles.menuText, styles.deleteText]}>Delete Post</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4757',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#0E0F0F',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0E0F0F',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
  },
  postsCount: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  editButtonText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#0E0F0F',
    fontWeight: '500',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  shopImageBanner: {
    position: 'relative',
    height: 120,
  },
  shopBannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  shopStatusOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  shopInfo: {
    padding: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  shopName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 5,
  },
  shopType: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  shopLocation: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
    marginLeft: 5,
  },
  shopContact: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 5,
  },
  shopDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#0E0F0F',
    flex: 2,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  // Post styles
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
    color: '#0E0F0F',
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
    color: '#0E0F0F',
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
  actionText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 5,
  },
  noPostsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noPostsText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
    fontWeight: '500',
  },
  noPostsSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 5,
    textAlign: 'center',
  },
  logoutSection: {
    padding: 20,
  },
  logoutButton: {
    backgroundColor: '#FF4757',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal styles
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
    color: '#0E0F0F',
    marginLeft: 12,
  },
  deleteText: {
    color: '#FF4757',
  },
});