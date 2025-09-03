// File: users.tsx
// Description: Modern users management screen with search, filtering, and CRUD operations

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
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ENDPOINTS } from '../../config/api';
import { router } from 'expo-router';

interface User {
  id: string;
  fullName: string;
  name?: string; // backup field
  email: string;
  isShopOwner: boolean;
  createdAt: string;
  pets?: any[];
  _count?: {
    pets: number;
  };
}

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }
      
      const response = await apiClient.get(ENDPOINTS.ADMIN.USERS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error: any) {
      console.error('[fetchUsers] Error:', error.message, error.stack);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(user => {
        const userName = user.fullName || user.name || '';
        return userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               user.email.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, [fetchUsers]);

  const handleDeleteUser = async (userId: string) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await apiClient.delete(`${ENDPOINTS.ADMIN.DELETE_USER(userId)}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              Alert.alert('Success', 'User deleted successfully');
              fetchUsers();
            } catch (error) {
              console.error('Failed to delete user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <FontAwesome5 
            name={item.isShopOwner ? 'store' : 'user'} 
            size={20} 
            color={item.isShopOwner ? '#96CEB4' : '#4ECDC4'} 
          />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.fullName || item.name || 'No Name'}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.userBadges}>
            {item.isShopOwner && (
              <View style={styles.badge}>
                <FontAwesome5 name="store" size={10} color="#96CEB4" />
                <Text style={styles.badgeText}>Shop Owner</Text>
              </View>
            )}
            <View style={styles.badge}>
              <FontAwesome5 name="paw" size={10} color="#FFEAA7" />
              <Text style={styles.badgeText}>{item._count?.pets || item.pets?.length || 0} Pets</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewUser(item)}
        >
          <FontAwesome5 name="eye" size={14} color="#4ECDC4" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteUser(item.id)}
        >
          <FontAwesome5 name="trash" size={14} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const UserModal = () => (
    <Modal
      visible={showUserModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowUserModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedUser ? (selectedUser.fullName || selectedUser.name || 'User Details') : 'User Details'}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowUserModal(false)}
            >
              <FontAwesome5 name="times" size={16} color="#666666" />
            </TouchableOpacity>
          </View>
          
          {selectedUser && (
            <View style={styles.userDetailsModal}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{selectedUser.fullName || selectedUser.name || 'No Name'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{selectedUser.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>
                  {selectedUser.isShopOwner ? 'Shop Owner' : 'Regular User'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pets:</Text>
                <Text style={styles.detailValue}>{selectedUser._count?.pets || selectedUser.pets?.length || 0}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Joined:</Text>
                <Text style={styles.detailValue}>
                  {(() => {
                    try {
                      const date = new Date(selectedUser.createdAt);
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
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users Management</Text>
        <Text style={styles.headerSubtitle}>{users.length} total users</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <FontAwesome5 name="search" size={16} color="#666666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <FontAwesome5 name="times" size={16} color="#666666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="users" size={48} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search terms' : 'No users registered yet'}
            </Text>
          </View>
        }
      />

      <UserModal />
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
  searchContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0E0F0F',
  },
  listContainer: {
    padding: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
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
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  userBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFF5F5',
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
    padding: 20,
    width: '90%',
    maxWidth: 400,
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
  userDetailsModal: {
    gap: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  detailValue: {
    fontSize: 16,
    color: '#0E0F0F',
  },
});

