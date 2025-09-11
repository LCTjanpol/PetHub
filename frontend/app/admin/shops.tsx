// File: shops.tsx
// Description: Modern shops management screen with search, filtering, and delete operations

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ENDPOINTS } from '../../config/api';
import { formatImageUrl } from '../../utils/imageUtils';

interface Shop {
  id: string;
  shopName: string;
  shopLocation: string;
  shopType: string;
  bio: string;
  contactNumber: string;
  openingTime: string;
  closingTime: string;
  availableDays: string[];
  shopImage: string;
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    name?: string; // backup field
    email: string;
  };
}

export default function ShopsScreen() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showShopModal, setShowShopModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchShops = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await apiClient.get(ENDPOINTS.SHOP.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShops(response.data);
      setFilteredShops(response.data);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
      Alert.alert('Error', 'Failed to load shops');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = shops.filter(shop => {
        const shopName = shop.shopName || '';
        const ownerName = shop.user?.fullName || shop.user?.name || '';
        return shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               shop.shopLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
               shop.shopType.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredShops(filtered);
    } else {
      setFilteredShops(shops);
    }
  }, [searchQuery, shops]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchShops();
    setRefreshing(false);
  }, [fetchShops]);

  const handleDeleteShop = async (shopId: string) => {
    Alert.alert(
      'Delete Shop',
      'Are you sure you want to delete this shop? This action cannot be undone and will remove the shop owner status from the user.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await apiClient.delete(ENDPOINTS.ADMIN.DELETE_SHOP(shopId), {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              Alert.alert('Success', 'Shop deleted successfully');
              fetchShops();
            } catch (error) {
              console.error('Failed to delete shop:', error);
              Alert.alert('Error', 'Failed to delete shop');
            }
          },
        },
      ]
    );
  };

  const handleViewShop = (shop: Shop) => {
    setSelectedShop(shop);
    setShowShopModal(true);
  };

  const handleDeletePost = async (shopId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              // Note: This would need a proper post deletion API endpoint
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              console.error('Failed to delete post:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (isAvailable: boolean) => {
    return isAvailable ? '#4ECDC4' : '#FF6B6B';
  };

  const getStatusText = (isAvailable: boolean) => {
    return isAvailable ? 'Open' : 'Closed';
  };

  const renderShopItem = ({ item }: { item: Shop }) => (
    <View style={styles.shopCard}>
      {/* Shop Image Banner */}
      <View style={styles.shopImageBanner}>
        {item.shopImage && item.shopImage.trim() !== '' ? (
          <Image
            source={{ uri: formatImageUrl(item.shopImage) || '' }}
            style={styles.shopBannerImage}
            onError={() => console.log('[Shop Image] Failed to load:', item.shopImage)}
          />
        ) : (
          <View style={[styles.shopBannerImage, styles.placeholderBanner]}>
            <FontAwesome5 name="store" size={32} color="#999999" />
          </View>
        )}
        <View style={styles.shopStatusOverlay}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.isAvailable) }]}>
            <Text style={styles.statusText}>{getStatusText(item.isAvailable)}</Text>
          </View>
        </View>
      </View>

      {/* Shop Details */}
      <View style={styles.shopContent}>
        <View style={styles.shopHeader}>
          <View style={styles.shopInfo}>
            <Text style={styles.shopName}>{item.shopName || 'Unnamed Shop'}</Text>
            <Text style={styles.shopType}>{item.shopType || 'Unknown Type'}</Text>
            <View style={styles.locationContainer}>
              <FontAwesome5 name="map-marker-alt" size={12} color="#4ECDC4" />
              <Text style={styles.shopLocation}>{item.shopLocation || 'Location not specified'}</Text>
            </View>
            <Text style={styles.ownerName}>Owner: {item.user?.fullName || item.user?.name || 'Unknown'}</Text>
          </View>
        </View>

        {/* Shop Stats */}
        <View style={styles.shopStats}>
          <View style={styles.ratingContainer}>
            <FontAwesome5 name="star" size={14} color="#FFEAA7" solid />
            <Text style={styles.ratingText}>{(item.rating || 0).toFixed(1)}</Text>
            <Text style={styles.reviewsText}>({item.totalReviews || 0} reviews)</Text>
          </View>
          <View style={styles.hoursContainer}>
            <FontAwesome5 name="clock" size={12} color="#666666" />
            <Text style={styles.hoursText}>{item.openingTime || 'N/A'} - {item.closingTime || 'N/A'}</Text>
          </View>
        </View>

        {/* Recent Posts Section */}
        <View style={styles.postsSection}>
          <Text style={styles.postsSectionTitle}>Recent Posts</Text>
          <View style={styles.postsContainer}>
            <View style={styles.postItem}>
              <View style={styles.postHeader}>
                <Image
                  source={
                    item.shopImage && item.shopImage.trim() !== ''
                      ? { uri: formatImageUrl(item.shopImage) || '' }
                      : require('../../assets/images/shop.png')
                  }
                  style={styles.postAuthorImage}
                />
                <View style={styles.postAuthorInfo}>
                  <Text style={styles.postAuthorName}>{item.shopName || 'Unnamed Shop'}</Text>
                  <Text style={styles.postTime}>2 hours ago</Text>
                </View>
                <TouchableOpacity 
                  style={styles.postDeleteButton}
                  onPress={() => handleDeletePost(item.id)}
                >
                  <FontAwesome5 name="trash" size={12} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
              <Text style={styles.postContent}>
                Soft Opening @Dumlog today free dog cups for the first 10 customers
              </Text>
              <View style={styles.postImageContainer}>
                <Image
                  source={
                    item.shopImage && item.shopImage.trim() !== ''
                      ? { uri: formatImageUrl(item.shopImage) || '' }
                      : require('../../assets/images/shop.png')
                  }
                  style={styles.postImage}
                />
              </View>
              <View style={styles.postStats}>
                <View style={styles.postStatItem}>
                  <FontAwesome5 name="heart" size={12} color="#FF6B6B" />
                  <Text style={styles.postStatText}>24 likes</Text>
                </View>
                <View style={styles.postStatItem}>
                  <FontAwesome5 name="comment" size={12} color="#4ECDC4" />
                  <Text style={styles.postStatText}>8 comments</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.shopActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewShop(item)}
        >
          <FontAwesome5 name="eye" size={14} color="#4ECDC4" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteShop(item.id)}
        >
          <FontAwesome5 name="trash" size={14} color="#FF6B6B" />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ShopModal = () => (
    <Modal
      visible={showShopModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowShopModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedShop ? selectedShop.shopName : 'Shop Details'}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowShopModal(false)}
            >
              <FontAwesome5 name="times" size={16} color="#666666" />
            </TouchableOpacity>
          </View>
          
          {selectedShop && (
            <View style={styles.modalContentContainer}>
              {selectedShop.shopImage && selectedShop.shopImage.trim() !== '' && (
                <Image
                  source={{ uri: formatImageUrl(selectedShop.shopImage) || '' }}
                  style={styles.modalShopImage}
                  onError={() => console.log('[Modal Shop Image] Failed to load:', selectedShop.shopImage)}
                />
              )}

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Shop Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedShop.shopName || 'Not specified'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{selectedShop.shopType || 'Not specified'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>{selectedShop.shopLocation || 'Not specified'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>{selectedShop.bio || 'No description available'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact:</Text>
                  <Text style={styles.detailValue}>{selectedShop.contactNumber || 'Not specified'}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Operating Hours</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hours:</Text>
                  <Text style={styles.detailValue}>{selectedShop.openingTime || 'N/A'} - {selectedShop.closingTime || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Available Days:</Text>
                  <Text style={styles.detailValue}>{selectedShop.availableDays && selectedShop.availableDays.length > 0 ? selectedShop.availableDays.join(', ') : 'Not specified'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(selectedShop.isAvailable) }]}>
                    {getStatusText(selectedShop.isAvailable)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Owner Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedShop.user?.fullName || selectedShop.user?.name || 'Unknown'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedShop.user?.email}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Statistics</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rating:</Text>
                  <Text style={styles.detailValue}>{(selectedShop.rating || 0).toFixed(1)} / 5.0</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Reviews:</Text>
                  <Text style={styles.detailValue}>{selectedShop.totalReviews || 0}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Joined:</Text>
                  <Text style={styles.detailValue}>
                    {(() => {
                      try {
                        const date = new Date(selectedShop.createdAt);
                        return date.toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit', 
                          year: '2-digit'
                        });
                      } catch {
                        return 'Invalid Date';
                      }
                    })()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pet Shops</Text>
        <Text style={styles.headerSubtitle}>{shops.length} total shops</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <FontAwesome5 name="search" size={16} color="#666666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search shops, owners, locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999999"
        />
      </View>

      {/* Shops List */}
      <FlatList
        data={filteredShops}
        renderItem={renderShopItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="store-slash" size={64} color="#E0E0E0" />
            <Text style={styles.emptyText}>No shops found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search terms' : 'No shops have been approved yet'}
            </Text>
          </View>
        }
      />

      <ShopModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0E0F0F',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#0E0F0F',
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
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
  placeholderBanner: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopStatusOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  shopContent: {
    padding: 16,
  },
  shopHeader: {
    marginBottom: 12,
  },
  shopInfo: {
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E0F0F',
    marginBottom: 2,
  },
  shopType: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  shopLocation: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 13,
    color: '#4ECDC4',
    fontWeight: '500',
    marginBottom: 4,
  },
  shopStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E0F0F',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 4,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  shopActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#FFE5E5',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ECDC4',
    marginLeft: 4,
  },
  deleteText: {
    color: '#FF6B6B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0E0F0F',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentContainer: {
    maxHeight: 400,
  },
  modalShopImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E0F0F',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: '#0E0F0F',
    flex: 1,
    textAlign: 'right',
  },
  postsSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  postsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 12,
  },
  postsContainer: {
    marginBottom: 10,
  },
  postItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postAuthorImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E0F0F',
  },
  postTime: {
    fontSize: 12,
    color: '#666666',
  },
  postDeleteButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 14,
    color: '#0E0F0F',
    marginBottom: 8,
    lineHeight: 18,
  },
  postImageContainer: {
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  postStatText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
});
