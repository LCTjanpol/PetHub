// File: applications.tsx
// Description: Modern shop applications management screen with approval/rejection functionality

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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
import { formatTimeForDisplay } from '../../utils/timeUtils';

interface ShopApplication {
  id: string;
  shopName: string;
  shopLocation: string;
  shopType: string;
  bio: string;
  contactNumber: string;
  message: string;
  openingTime: string;
  closingTime: string;
  daysAvailable: string;
  shopImage: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    name?: string; // backup field
    email: string;
  };
}

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState<ShopApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ShopApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ShopApplication | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await apiClient.get(ENDPOINTS.ADMIN.APPLICATIONS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setApplications(response.data);
      setFilteredApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredApplications(applications);
    } else {
      const filtered = applications.filter(app => app.status === filter);
      setFilteredApplications(filtered);
    }
  }, [filter, applications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
  }, [fetchApplications]);

  const handleApplicationAction = async (applicationId: string, action: 'approve' | 'reject') => {
    const actionText = action === 'approve' ? 'approve' : 'reject';
    const actionTitle = action === 'approve' ? 'Approve Application' : 'Reject Application';
    const actionMessage = action === 'approve' 
      ? 'Are you sure you want to approve this shop application?'
      : 'Are you sure you want to reject this shop application?';

    Alert.alert(
      actionTitle,
      actionMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'approve' ? 'Approve' : 'Reject',
          style: action === 'approve' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await apiClient.put(`/admin/shop-applications/${applicationId}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              Alert.alert('Success', `Application ${actionText}d successfully`);
              fetchApplications();
            } catch (error) {
              console.error(`Failed to ${actionText} application:`, error);
              Alert.alert('Error', `Failed to ${actionText} application`);
            }
          },
        },
      ]
    );
  };


  

  const handleViewApplication = (application: ShopApplication) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFEAA7';
      case 'approved': return '#96CEB4';
      case 'rejected': return '#FF6B6B';
      default: return '#CCCCCC';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  // Format time for display using the new utility
  const formatTime = (time: string) => formatTimeForDisplay(time);

  const renderApplicationItem = ({ item }: { item: ShopApplication }) => (
    <View style={styles.applicationCard}>
      <View style={styles.applicationHeader}>
        <View style={styles.shopInfo}>
          <View style={styles.shopImageContainer}>
            {item.shopImage ? (
              <Image source={{ uri: formatImageUrl(item.shopImage) || '' }} style={styles.shopImage} />
            ) : (
              <View style={styles.shopImagePlaceholder}>
                <FontAwesome5 name="store" size={20} color="#CCCCCC" />
              </View>
            )}
          </View>
          <View style={styles.shopDetails}>
            <Text style={styles.shopName}>{item.shopName}</Text>
            <Text style={styles.shopType}>{item.shopType}</Text>
            <Text style={styles.shopLocation}>{item.shopLocation}</Text>
            <Text style={styles.applicantName}>by {item.user.fullName || item.user.name || 'Unknown'}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.applicationContent}>
        <Text style={styles.messageText} numberOfLines={2}>
          {item.message}
        </Text>
                  <View style={styles.applicationStats}>
            <View style={styles.statItem}>
              <FontAwesome5 name="clock" size={12} color="#666666" />
              <Text style={styles.statText}>
                {formatTime(item.openingTime)} - {formatTime(item.closingTime)}
              </Text>
            </View>
          <View style={styles.statItem}>
            <FontAwesome5 name="calendar" size={12} color="#666666" />
            <Text style={styles.statText}>{item.daysAvailable}</Text>
          </View>
        </View>
      </View>

      <View style={styles.applicationActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewApplication(item)}
        >
          <FontAwesome5 name="eye" size={14} color="#4ECDC4" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        
        {item.status === 'pending' && (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApplicationAction(item.id, 'approve')}
            >
              <FontAwesome5 name="check" size={14} color="#96CEB4" />
              <Text style={[styles.actionText, { color: '#96CEB4' }]}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleApplicationAction(item.id, 'reject')}
            >
              <FontAwesome5 name="times" size={14} color="#FF6B6B" />
              <Text style={[styles.actionText, { color: '#FF6B6B' }]}>Reject</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  const ApplicationModal = () => (
    <Modal
      visible={showApplicationModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowApplicationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Application Details</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowApplicationModal(false)}
            >
              <FontAwesome5 name="times" size={16} color="#666666" />
            </TouchableOpacity>
          </View>
          
          {selectedApplication && (
            <ScrollView style={styles.applicationDetailsModal}>
              <View style={styles.modalShopImage}>
                {selectedApplication.shopImage ? (
                  <Image source={{ uri: formatImageUrl(selectedApplication.shopImage) || '' }} style={styles.modalImage} />
                ) : (
                  <View style={styles.modalImagePlaceholder}>
                    <FontAwesome5 name="store" size={48} color="#CCCCCC" />
                  </View>
                )}
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Shop Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Shop Name:</Text>
                  <Text style={styles.detailValue}>{selectedApplication.shopName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{selectedApplication.shopType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>{selectedApplication.shopLocation}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact:</Text>
                  <Text style={styles.detailValue}>{selectedApplication.contactNumber}</Text>
                </View>
              </View>

                        <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Business Hours</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Hours:</Text>
              <Text style={styles.detailValue}>
                {formatTime(selectedApplication.openingTime)} - {formatTime(selectedApplication.closingTime)}
              </Text>
            </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Days:</Text>
                  <Text style={styles.detailValue}>{selectedApplication.daysAvailable}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Applicant Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedApplication.user.fullName || selectedApplication.user.name || 'Unknown'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedApplication.user.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Applied:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedApplication.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.bioText}>{selectedApplication.bio}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Message</Text>
                <Text style={styles.messageTextFull}>{selectedApplication.message}</Text>
              </View>

              {selectedApplication.status === 'pending' && (
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalActionButton, styles.modalApproveButton]}
                    onPress={() => {
                      setShowApplicationModal(false);
                      handleApplicationAction(selectedApplication.id, 'approve');
                    }}
                  >
                    <FontAwesome5 name="check" size={16} color="#FFFFFF" />
                    <Text style={styles.modalActionText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalActionButton, styles.modalRejectButton]}
                    onPress={() => {
                      setShowApplicationModal(false);
                      handleApplicationAction(selectedApplication.id, 'reject');
                    }}
                  >
                    <FontAwesome5 name="times" size={16} color="#FFFFFF" />
                    <Text style={styles.modalActionText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop Applications</Text>
        <Text style={styles.headerSubtitle}>{applications.length} total applications</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
              All ({applications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'pending' && styles.activeFilterTab]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterText, filter === 'pending' && styles.activeFilterText]}>
              Pending ({applications.filter(app => app.status === 'pending').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'approved' && styles.activeFilterTab]}
            onPress={() => setFilter('approved')}
          >
            <Text style={[styles.filterText, filter === 'approved' && styles.activeFilterText]}>
              Approved ({applications.filter(app => app.status === 'approved').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'rejected' && styles.activeFilterTab]}
            onPress={() => setFilter('rejected')}
          >
            <Text style={[styles.filterText, filter === 'rejected' && styles.activeFilterText]}>
              Rejected ({applications.filter(app => app.status === 'rejected').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Applications List */}
      <FlatList
        data={filteredApplications}
        renderItem={renderApplicationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="clipboard-list" size={48} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Applications Found</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' ? 'No applications submitted yet' : `No ${filter} applications`}
            </Text>
          </View>
        }
      />

      <ApplicationModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0E0F0F',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  activeFilterTab: {
    backgroundColor: '#4ECDC4',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 20,
  },
  applicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  shopInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopImageContainer: {
    marginRight: 15,
  },
  shopImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  shopImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 2,
  },
  shopType: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  shopLocation: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 2,
  },
  applicantName: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E0F0F',
  },
  applicationContent: {
    marginBottom: 15,
  },
  messageText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 10,
  },
  applicationStats: {
    flexDirection: 'row',
    gap: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    color: '#666666',
  },
  applicationActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 5,
  },
  approveButton: {
    backgroundColor: '#E8F5E8',
  },
  rejectButton: {
    backgroundColor: '#FFE8E8',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0E0F0F',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applicationDetailsModal: {
    padding: 20,
  },
  modalShopImage: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  modalImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0E0F0F',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    color: '#0E0F0F',
    flex: 1,
    textAlign: 'right',
  },
  bioText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 10,
  },
  messageTextFull: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  modalApproveButton: {
    backgroundColor: '#96CEB4',
  },
  modalRejectButton: {
    backgroundColor: '#FF6B6B',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

