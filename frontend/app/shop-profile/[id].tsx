// File: shop-profile/[id].tsx
// Description: Shop profile screen showing shop details and posts

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
  Dimensions
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { apiClient, ENDPOINTS } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatImageUrl } from '../../utils/imageUtils';
import PostCard from '../../components/PostCard';

const { width } = Dimensions.get('window');

interface Shop {
  id: string;
  shopName: string;
  shopType: string;
  shopLocation: string;
  bio: string;
  contactNumber: string;
  openingTime: string;
  closingTime: string;
  availableDays: string[];
  shopImage: string;
  isAvailable: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    profilePicture: string;
  };
}

interface Post {
  id: string;
  userId: string;
  userName: string;
  userProfilePicture?: string;
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

export default function ShopProfileScreen() {
  const { id } = useLocalSearchParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch current user data
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Fetch shop data and posts on component mount
  useEffect(() => {
    if (id) {
      fetchShopData();
      fetchShopPosts();
    }
  }, [id]);

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

  // Fetch shop data
  const fetchShopData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please log in to view shop profile');
        return;
      }

      const response = await apiClient.get(ENDPOINTS.SHOP.DETAIL(id as string), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.shop) {
        setShop(response.data.shop);
      } else if (response.data) {
        setShop(response.data);
      } else {
        Alert.alert('Error', 'Unable to load shop information. Please try again.');
      }
    } catch (error: any) {
      let errorMessage = 'Unable to load shop information. Please try again.';
      
      if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network connection issue. Please check your internet connection.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to view shop profiles.';
        router.replace('/auth/login');
      } else if (error.response?.status === 404) {
        errorMessage = 'This shop profile could not be found. It may have been removed.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again in a few moments.';
      }
      
      Alert.alert('Shop Profile Unavailable', errorMessage);
    }
  };

  // Fetch shop posts
  const fetchShopPosts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await apiClient.get(ENDPOINTS.POST.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      let allPosts: Post[] = [];
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        allPosts = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        allPosts = response.data.data;
      } else {
        setPosts([]);
        return;
      }

      // Filter posts by shopId or userId if shop owner
      const shopPosts = allPosts.filter(post => 
        post.shopId === id || (post.user?.isShopOwner && post.userId === id)
      );
      setPosts(shopPosts);
    } catch (error: any) {
      // Don't show error for posts loading failure, just show empty state
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchShopData(), fetchShopPosts()]);
    } catch (error) {
      // Handle refresh errors silently
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  // Format join date
  const formatJoinDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return 'Today';
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
      if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
      return `${Math.floor(diffInDays / 365)} years ago`;
    } catch {
      return 'Unknown date';
    }
  };

  // Format available days
  const formatAvailableDays = (days: string[]) => {
    if (!days || !Array.isArray(days) || days.length === 0) {
      return 'Not specified';
    }
    
    const dayAbbreviations = {
      'Monday': 'Mon',
      'Tuesday': 'Tue', 
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat',
      'Sunday': 'Sun'
    };
    
    return days.map(day => dayAbbreviations[day as keyof typeof dayAbbreviations] || day).join(', ');
  };

  // Get status color
  const getStatusColor = (isAvailable: boolean) => {
    return isAvailable ? '#4CAF50' : '#F44336';
  };

  // Get status text
  const getStatusText = (isAvailable: boolean) => {
    return isAvailable ? 'Open' : 'Closed';
  };

  // Handle post deletion (only for shop owners)
  const handleDeletePost = async (postId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await apiClient.delete(ENDPOINTS.POST.DELETE(postId), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        // Refresh posts after successful deletion
        await fetchShopPosts();
        Alert.alert('Success', 'Post deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      Alert.alert('Error', 'Failed to delete post. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading shop profile...</Text>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Shop not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
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
        {/* Shop Header */}
        <View style={styles.shopHeader}>
          <View style={styles.shopImageContainer}>
            {shop.shopImage && shop.shopImage.trim() !== '' ? (
              <Image
                source={{ uri: formatImageUrl(shop.shopImage) || '' }}
                style={styles.shopImage}
                onError={() => console.log('[Shop Image] Failed to load:', shop.shopImage)}
              />
            ) : (
              <View style={[styles.shopImage, styles.placeholderImage]}>
                <FontAwesome5 name="store" size={48} color="#999999" />
              </View>
            )}
          </View>
          
          <View style={styles.shopInfo}>
            <Text style={styles.shopName}>{shop.shopName || 'Unnamed Shop'}</Text>
            <Text style={styles.shopType}>{shop.shopType || 'Unknown Type'}</Text>
            <Text style={styles.ownerName}>by {shop.user?.fullName || 'Unknown'}</Text>
            
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shop.isAvailable) }]}>
                <Text style={styles.statusText}>{getStatusText(shop.isAvailable)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Shop Details */}
        <View style={styles.shopDetails}>
          <View style={styles.detailRow}>
            <FontAwesome5 name="map-marker-alt" size={16} color="#4ECDC4" />
            <Text style={styles.detailText}>{shop.shopLocation || 'Location not specified'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <FontAwesome5 name="phone" size={16} color="#4ECDC4" />
            <Text style={styles.detailText}>{shop.contactNumber || 'Contact not available'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <FontAwesome5 name="clock" size={16} color="#4ECDC4" />
            <Text style={styles.detailText}>
              {shop.openingTime || 'N/A'} - {shop.closingTime || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <FontAwesome5 name="calendar" size={16} color="#4ECDC4" />
            <Text style={styles.detailText}>{formatAvailableDays(shop.availableDays)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <FontAwesome5 name="calendar-alt" size={16} color="#4ECDC4" />
            <Text style={styles.detailText}>Joined {formatJoinDate(shop.createdAt)}</Text>
          </View>
        </View>

        {/* Shop Bio */}
        {shop.bio && (
          <View style={styles.bioSection}>
            <Text style={styles.bioTitle}>About</Text>
            <Text style={styles.bioText}>{shop.bio}</Text>
          </View>
        )}

        {/* Shop Posts */}
        <View style={styles.postsSection}>
          <Text style={styles.postsTitle}>
            {posts.length === 0 ? 'No posts yet' : `${posts.length} post${posts.length !== 1 ? 's' : ''}`}
          </Text>
          
          {posts.length === 0 ? (
            <View style={styles.emptyPostsContainer}>
              <FontAwesome5 name="newspaper" size={48} color="#E0E0E0" />
              <Text style={styles.emptyPostsText}>No posts from this shop yet</Text>
              <Text style={styles.emptyPostsSubtext}>Check back later for updates!</Text>
            </View>
          ) : (
            <View style={styles.postsContainer}>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUser?.id}
                  onDeletePost={handleDeletePost}
                  showMenuButton={currentUser?.id === post.userId} // Only show delete for own posts
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
    fontSize: 18,
    color: '#666666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  shopHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  shopImageContainer: {
    marginRight: 20,
  },
  shopImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0E0F0F',
    marginBottom: 4,
  },
  shopType: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  shopDetails: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 12,
    flex: 1,
  },
  bioSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 10,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  postsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  postsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 16,
  },
  emptyPostsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPostsText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  emptyPostsSubtext: {
    fontSize: 14,
    color: '#999999',
  },
  postsContainer: {
    // Posts will be rendered by PostCard components
  },
}); 