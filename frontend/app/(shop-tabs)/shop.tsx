// File: shop.tsx
// Description: Shop owner's shop information screen

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
  FlatList,
  Modal,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient, ENDPOINTS } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatImageUrl } from '../../utils/imageUtils';

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

interface ShopPost {
  id: string;
  content: string;
  image?: string;
  createdAt: string;
  shopId: string;
  shopName: string;
  shopImage: string;
}

export default function ShopScreen() {
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<ShopPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ShopPost | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchShopData();
    fetchShopPosts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchShopData(), fetchShopPosts()]);
    setRefreshing(false);
  };

  // Fetch shop data from API
  const fetchShopData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        return;
      }

      const response = await apiClient.get(ENDPOINTS.SHOP.PROFILE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        setShopData(response.data.data);
      } else {
        setShopData(response.data);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load shop data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch shop posts from API
  const fetchShopPosts = async () => {
    try {
      setPostsLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        return;
      }

      const response = await apiClient.get(ENDPOINTS.POST.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        // Sort posts in reverse chronological order (newest first)
        const sortedPosts = response.data.data.sort((a: ShopPost, b: ShopPost) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPosts(sortedPosts);
      } else {
        setPosts([]);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load shop posts. Please try again.');
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // Delete shop post
  const deleteShopPost = async (postId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        return;
      }

      const response = await apiClient.delete(`${ENDPOINTS.POST.DELETE(postId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.status === 200 || response.status === 204) {
        Alert.alert('Success', 'Post deleted successfully');
        // Re-fetch posts after successful deletion
        fetchShopPosts();
      } else {
        Alert.alert('Error', 'Failed to delete post. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to delete post. Please try again.');
    }
  };

  // Handle post menu button press
  const handlePostMenuPress = (post: ShopPost) => {
    setSelectedPost(post);
    setShowDeleteModal(true);
  };

  // Handle post deletion confirmation
  const handleDeletePost = () => {
    if (selectedPost) {
      deleteShopPost(selectedPost.id);
      setShowDeleteModal(false);
      setSelectedPost(null);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}hr${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  // Render individual post item
  const renderPostItem = ({ item }: { item: ShopPost }) => (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <Image
            source={
              item.shopImage
                ? { uri: formatImageUrl(item.shopImage) || '' }
                : require('../../assets/images/shop.png')
            }
            style={styles.postProfileImage}
          />
          <View style={styles.postHeaderInfo}>
            <Text style={styles.postShopName}>{item.shopName}</Text>
            <Text style={styles.postTime}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.postMenuButton}
          onPress={() => handlePostMenuPress(item)}
        >
          <FontAwesome5 name="ellipsis-v" size={16} color="#666666" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{item.content}</Text>

      {/* Post Image */}
      {item.image && (
        <Image
          source={{ uri: formatImageUrl(item.image) || '' }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <FontAwesome5 name="spinner" size={24} color="#0E0F0F" />
        <Text style={styles.loadingText}>Loading shop data...</Text>
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
        {/* Banner Image Section */}
        <View style={styles.bannerSection}>
          <Image
            source={
              shopData?.shopImage
                ? { uri: formatImageUrl(shopData.shopImage) || '' }
                : require('../../assets/images/shop.png')
            }
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

        {/* Shop Info Section */}
        <View style={styles.shopInfoSection}>
          <View style={styles.shopHeader}>
            <View style={styles.shopNameContainer}>
              <Text style={styles.shopName}>{shopData?.shopName}</Text>
              <Text style={styles.shopType}>{shopData?.shopType}</Text>
            </View>
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View style={styles.statusIndicator}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: shopData?.isAvailable ? "#4CAF50" : "#F44336" }
                ]} />
                <Text style={[
                  styles.statusText, 
                  { color: shopData?.isAvailable ? "#4CAF50" : "#F44336" }
                ]}>
                  {shopData?.isAvailable ? 'Open' : 'Closed'}
                </Text>
              </View>
            </View>
          </View>

          {/* Operating Hours */}
          <View style={styles.hoursContainer}>
            <View style={styles.hoursRow}>
              <FontAwesome5 name="clock" size={16} color="#0E0F0F" />
              <Text style={styles.hoursText}>
                {shopData?.openingTime} - {shopData?.closingTime}
              </Text>
            </View>
            <Text style={styles.availableDaysText}>
              {shopData?.availableDays?.join(', ')}
            </Text>
          </View>

          {/* Contact Information */}
          <View style={styles.contactContainer}>
            <View style={styles.contactRow}>
              <FontAwesome5 name="map-marker-alt" size={16} color="#0E0F0F" />
              <Text style={styles.contactText}>{shopData?.shopLocation}</Text>
            </View>
            <View style={styles.contactRow}>
              <FontAwesome5 name="phone" size={16} color="#0E0F0F" />
              <Text style={styles.contactText}>Contact No: {shopData?.contactNumber}</Text>
            </View>
            <View style={styles.contactRow}>
              <FontAwesome5 name="envelope" size={16} color="#0E0F0F" />
              <Text style={styles.contactText}>Email: johnsenna@gmail.com</Text>
            </View>
          </View>
        </View>

        {/* Posts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posts</Text>
          {postsLoading ? (
            <View style={styles.loadingContainer}>
              <FontAwesome5 name="spinner" size={24} color="#0E0F0F" />
              <Text style={styles.loadingText}>Loading posts...</Text>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.noPostsContainer}>
              <FontAwesome5 name="newspaper" size={30} color="#666666" />
              <Text style={styles.noPostsText}>No posts yet. Be the first to share!</Text>
            </View>
          ) : (
            <FlatList
              data={posts}
              renderItem={renderPostItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.postsList}
            />
          )}
        </View>
      </ScrollView>

      {/* Delete Post Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Post</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this post? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={handleDeletePost}
              >
                <Text style={styles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  bannerSection: {
    width: '100%',
    height: 200,
    marginBottom: 0,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  shopNameContainer: {
    flex: 1,
  },
  shopName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0E0F0F',
    marginBottom: 5,
  },
  shopType: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 5,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hoursContainer: {
    marginBottom: 15,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  hoursText: {
    fontSize: 14,
    color: '#0E0F0F',
    marginLeft: 8,
    fontWeight: '500',
  },
  availableDaysText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 24,
  },
  contactContainer: {
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#0E0F0F',
    marginLeft: 8,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 15,
  },


  postsList: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postHeaderInfo: {
    flex: 1,
  },
  postShopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E0F0F',
  },
  postTime: {
    fontSize: 12,
    color: '#666666',
  },
  postMenuButton: {
    padding: 5,
  },
  postContent: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  noPostsContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  noPostsText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0E0F0F',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalButtonCancel: {
    backgroundColor: '#E0E0E0',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  modalButtonDelete: {
    backgroundColor: '#F44336',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 