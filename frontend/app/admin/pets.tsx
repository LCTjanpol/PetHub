// File: pets.tsx
// Description: Modern pets management screen with search, filtering, and CRUD operations

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
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ENDPOINTS } from '../../config/api';
import { formatImageUrl } from '../../utils/imageUtils';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  birthdate: string;
  healthCondition: string;
  petPicture?: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  medicalRecords?: any[];
  tasks?: any[];
}

export default function PetsScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showPetModal, setShowPetModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await apiClient.get(ENDPOINTS.ADMIN.PETS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPets(response.data);
      setFilteredPets(response.data);
    } catch (error) {
      console.error('Failed to fetch pets:', error);
      Alert.alert('Error', 'Failed to load pets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = pets.filter(pet => {
        const petName = pet.name || '';
        const petType = pet.type || '';
        const petBreed = pet.breed || '';
        const ownerName = pet.user?.fullName || '';
        
        return (
          petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          petType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          petBreed.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ownerName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
      setFilteredPets(filtered);
    } else {
      setFilteredPets(pets);
    }
  }, [searchQuery, pets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPets();
    setRefreshing(false);
  }, [fetchPets]);

  const handleDeletePet = async (petId: string) => {
    Alert.alert(
      'Delete Pet',
      'Are you sure you want to delete this pet? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await apiClient.delete(`${ENDPOINTS.ADMIN.PETS}/${petId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              Alert.alert('Success', 'Pet deleted successfully');
              fetchPets();
            } catch (error) {
              console.error('Failed to delete pet:', error);
              Alert.alert('Error', 'Failed to delete pet');
            }
          },
        },
      ]
    );
  };

  const handleViewPet = (pet: Pet) => {
    setSelectedPet(pet);
    setShowPetModal(true);
  };

  const getPetIcon = (type: string) => {
    const typeIcons: { [key: string]: string } = {
      'Dog': 'dog',
      'Cat': 'cat',
      'Bird': 'dove',
      'Fish': 'fish',
      'Rabbit': 'rabbit',
      'Hamster': 'mouse',
      'Guinea Pig': 'mouse',
      'Ferret': 'mouse',
      'Reptile': 'dragon',
      'Other': 'paw',
    };
    return typeIcons[type] || 'paw';
  };

  const renderPetItem = ({ item }: { item: Pet }) => (
    <View style={styles.petCard}>
      <View style={styles.petInfo}>
        <View style={styles.petImageContainer}>
          {item.petPicture ? (
            <Image 
              source={{ 
                uri: formatImageUrl(item.petPicture) || ''
              }} 
              style={styles.petImage} 
            />
          ) : (
            <View style={styles.petImagePlaceholder}>
              <FontAwesome5 
                name={getPetIcon(item.type)} 
                size={24} 
                color="#CCCCCC" 
              />
            </View>
          )}
        </View>
        <View style={styles.petDetails}>
          <Text style={styles.petName}>{item.name || 'Unknown Pet'}</Text>
          <Text style={styles.petType}>{item.type || 'Unknown'} • {item.breed || 'Unknown'}</Text>
          <Text style={styles.petOwner}>Owner: {item.user?.fullName || 'Unknown Owner'}</Text>
          <View style={styles.petStats}>
            <View style={styles.statBadge}>
              <FontAwesome5 name="calendar" size={10} color="#4ECDC4" />
              <Text style={styles.statText}>
                {new Date(item.birthdate).getFullYear()}
              </Text>
            </View>
            {item.medicalRecords && item.medicalRecords.length > 0 && (
              <View style={styles.statBadge}>
                <FontAwesome5 name="heartbeat" size={10} color="#FF6B6B" />
                <Text style={styles.statText}>
                  {item.medicalRecords.length} Records
                </Text>
              </View>
            )}
            {item.tasks && item.tasks.length > 0 && (
              <View style={styles.statBadge}>
                <FontAwesome5 name="tasks" size={10} color="#96CEB4" />
                <Text style={styles.statText}>
                  {item.tasks.length} Tasks
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={styles.petActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewPet(item)}
        >
          <FontAwesome5 name="eye" size={14} color="#4ECDC4" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeletePet(item.id)}
        >
          <FontAwesome5 name="trash" size={14} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const PetModal = () => (
    <Modal
      visible={showPetModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPetModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pet Details</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowPetModal(false)}
            >
              <FontAwesome5 name="times" size={16} color="#666666" />
            </TouchableOpacity>
          </View>
          
          {selectedPet && (
            <View style={styles.petDetailsModal}>
              <View style={styles.petImageModal}>
                {selectedPet.petPicture ? (
                                  <Image 
                  source={{ 
                    uri: formatImageUrl(selectedPet.petPicture) || ''
                  }} 
                  style={styles.petImageLarge} 
                />
                ) : (
                  <View style={styles.petImagePlaceholderLarge}>
                    <FontAwesome5 
                      name={getPetIcon(selectedPet.type)} 
                      size={48} 
                      color="#CCCCCC" 
                    />
                  </View>
                )}
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{selectedPet.name || 'Unknown'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>{selectedPet.type || 'Unknown'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Breed:</Text>
                <Text style={styles.detailValue}>{selectedPet.breed || 'Unknown'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Birthdate:</Text>
                <Text style={styles.detailValue}>
                  {selectedPet.birthdate ? new Date(selectedPet.birthdate).toLocaleDateString() : 'Unknown'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Health Condition:</Text>
                <Text style={styles.detailValue}>{selectedPet.healthCondition || 'Healthy'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Owner:</Text>
                <Text style={styles.detailValue}>{selectedPet.user?.fullName || 'Unknown Owner'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Owner Email:</Text>
                <Text style={styles.detailValue}>{selectedPet.user?.email || 'Unknown Email'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Medical Records:</Text>
                <Text style={styles.detailValue}>
                  {selectedPet.medicalRecords?.length || 0}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Active Tasks:</Text>
                <Text style={styles.detailValue}>
                  {selectedPet.tasks?.length || 0}
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
        <Text style={styles.headerTitle}>Pets Management</Text>
        <Text style={styles.headerSubtitle}>{pets.length} total pets</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <FontAwesome5 name="search" size={16} color="#666666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search pets by name, type, breed, or owner..."
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

      {/* Pets List */}
      <FlatList
        data={filteredPets}
        renderItem={renderPetItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="paw" size={48} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Pets Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search terms' : 'No pets registered yet'}
            </Text>
          </View>
        }
      />

      <PetModal />
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
  petCard: {
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
  petInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  petImageContainer: {
    marginRight: 15,
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  petImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 2,
  },
  petType: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  petOwner: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 8,
  },
  petStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  petActions: {
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  petDetailsModal: {
    gap: 16,
  },
  petImageModal: {
    alignItems: 'center',
    marginBottom: 10,
  },
  petImageLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  petImagePlaceholderLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
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

