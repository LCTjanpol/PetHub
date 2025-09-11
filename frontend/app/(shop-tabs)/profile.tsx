// File: profile.tsx
// Description: Unified shop profile screen with shop info, posts, and management options

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
  Modal,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { apiClient, ENDPOINTS } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatImageUrl } from '../../utils/imageUtils';
import { formatRelativeTime } from '../../utils/timeUtils';
import { router } from 'expo-router';
import PostCard from '../../components/PostCard';

interface ShopData {
  id: string;
  shopName: string;
  shopImage: string;
  bio: string;
  isAvailable: boolean;
  openingTime: string;
  closingTime: string;
  availableDays: string[];
  shopType: string;
  contactNumber: string;
  shopLocation: string;
}

interface UserData {
  id: string;
  fullName: string;
  email: string;
  profilePicture: string;
  birthdate: string;
  gender: string;
}

interface Post {
  id: number;
  userId: number;
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

export default function UnifiedShopProfileScreen() {
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchShopData(),
        fetchUserData(),
        fetchPosts()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShopData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await apiClient.get(ENDPOINTS.SHOP.PROFILE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        setShopData(response.data.data);
      } else {
        setShopData(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch shop data:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await apiClient.get(ENDPOINTS.USER.PROFILE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setUserData(response.data);
      setCurrentUserId(response.data.id?.toString() || '');
    } catch (error: any) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !userData?.id) return;

      const response = await apiClient.get(ENDPOINTS.POST.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      let postsData = [];
      if (Array.isArray(response.data)) {
        postsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        postsData = response.data.data;
      }
      
      // Filter posts by current user and sort by newest first
      const userPosts = postsData
        .filter((post: Post) => post.userId.toString() === userData.id?.toString())
        .sort((a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setPosts(userPosts);
    } catch (error: any) {
      console.error('Failed to fetch posts:', error);
      setPosts([]);
    }
  };

  const handleLogout = async () => {
    setShowMenu(false);
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('user');
              router.replace('/auth/login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await apiClient.delete(ENDPOINTS.POST.DELETE(postId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Refresh posts after deletion
      await fetchPosts();
      Alert.alert('Success', 'Post deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete post:', error);
      Alert.alert('Error', 'Failed to delete post. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <FontAwesome5 name="spinner" size={24} color="#0E0F0F" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!shopData || !userData) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome5 name="exclamation-triangle" size={48} color="#FF4757" />
        <Text style={styles.errorText}>Failed to load profile data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAllData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" translucent />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Menu */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shop Profile</Text>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(true)}
          >
            <FontAwesome5 name="ellipsis-v" size={20} color="#0E0F0F" />
          </TouchableOpacity>
        </View>

        {/* Shop Banner */}
        <View style={styles.bannerSection}>
          <Image
            source={
              shopData.shopImage
                ? { uri: formatImageUrl(shopData.shopImage) || '' }
                : require('../../assets/images/shop.png')
            }
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.statusOverlay}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: shopData.isAvailable ? '#4CAF50' : '#F44336' }
            ]}>
              <Text style={styles.statusText}>
                {shopData.isAvailable ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
        </View>

        {/* Shop Info */}
        <View style={styles.shopInfoSection}>
          <View style={styles.shopHeader}>
            <View style={styles.shopTitleContainer}>
              <Text style={styles.shopName}>{shopData.shopName}</Text>
              <Text style={styles.shopType}>{shopData.shopType}</Text>
            </View>
          </View>

          {/* Shop Details */}
          <View style={styles.detailsContainer}>
            {shopData.bio && (
              <View style={styles.detailRow}>
                <FontAwesome5 name="info-circle" size={16} color="#4ECDC4" />
                <Text style={styles.detailText}>{shopData.bio}</Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <FontAwesome5 name="clock" size={16} color="#4ECDC4" />
              <Text style={styles.detailText}>
                {shopData.openingTime} - {shopData.closingTime}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <FontAwesome5 name="calendar" size={16} color="#4ECDC4" />
              <Text style={styles.detailText}>
                {shopData.availableDays?.join(', ') || 'Not specified'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <FontAwesome5 name="map-marker-alt" size={16} color="#4ECDC4" />
              <Text style={styles.detailText}>{shopData.shopLocation}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <FontAwesome5 name="phone" size={16} color="#4ECDC4" />
              <Text style={styles.detailText}>{shopData.contactNumber}</Text>
            </View>
          </View>
        </View>

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Posts</Text>
            <Text style={styles.postsCount}>{posts.length} posts</Text>
          </View>
          
          {posts.length === 0 ? (
            <View style={styles.noPostsContainer}>
              <FontAwesome5 name="edit" size={48} color="#CCCCCC" />
              <Text style={styles.noPostsText}>No posts yet</Text>
              <Text style={styles.noPostsSubtext}>Share updates about your shop to get started</Text>
            </View>
          ) : (
            <View style={styles.postsList}>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  currentUserIsShopOwner={true}
                  onDeletePost={handleDeletePost}
                  showMenuButton={true}
                  showInteractions={false}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                router.push('/editandaddscreens/editshopprofile');
              }}
            >
              <FontAwesome5 name="store" size={16} color="#0E0F0F" />
              <Text style={styles.menuText}>Edit Shop Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                router.push('/editandaddscreens/editprofile');
              }}
            >
              <FontAwesome5 name="user-edit" size={16} color="#0E0F0F" />
              <Text style={styles.menuText}>Edit User Profile</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleLogout}
            >
              <FontAwesome5 name="sign-out-alt" size={16} color="#FF4757" />
              <Text style={[styles.menuText, styles.logoutText]}>Log Out</Text>
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
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF4757',
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#0E0F0F',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#F8F9FA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0E0F0F',
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerSection: {
    position: 'relative',
    height: 200,
    marginBottom: 0,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  statusOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
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
  shopInfoSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopHeader: {
    marginBottom: 20,
  },
  shopTitleContainer: {
    alignItems: 'center',
  },
  shopName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0E0F0F',
    marginBottom: 5,
    textAlign: 'center',
  },
  shopType: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#0E0F0F',
    flex: 1,
    lineHeight: 22,
  },
  postsSection: {
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0E0F0F',
  },
  postsCount: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  postsList: {
    gap: 16,
  },
  noPostsContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  noPostsText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 16,
    fontWeight: '500',
  },
  noPostsSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
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
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuText: {
    fontSize: 16,
    color: '#0E0F0F',
    marginLeft: 12,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  logoutText: {
    color: '#FF4757',
  },
});