// File: pets.tsx
// Description: Enhanced pets screen with medical records, health conditions, and professional UI

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { apiClient, ENDPOINTS } from '../../config/api';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatImageUrl } from '../../utils/imageUtils';

const { width, height } = Dimensions.get('window');

// Interface for pet data structure
interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  age: number;
  birthdate: string;
  petPicture: string;
  healthCondition: string;
  latestMedicalRecord?: MedicalRecord;
}

// Interface for medical record data structure
interface MedicalRecord {
  id: string;
  type: string;
  medicineName: string;
  veterinarian: string;
  clinic: string;
  date: string;
}

export default function PetsScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Popular pet types for reference
  const popularPets = [
    'Dog', 'Cat', 'Bird', 'Fish', 'Hamster', 
    'Rabbit', 'Guinea Pig', 'Turtle', 'Snake', 'Horse'
  ];

  // Fetch pets from API
  const fetchPets = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }

      const response = await apiClient.get(ENDPOINTS.PET.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('[fetchPets] API Response length:', response.data?.length || 0);
      console.log('[fetchPets] First pet data:', response.data?.[0] || 'No pets');
      console.log('[fetchPets] Pet picture field:', response.data?.[0]?.petPicture || 'No picture');
      console.log('[fetchPets] Full response data:', JSON.stringify(response.data, null, 2));
      
      setPets(response.data || []);
    } catch (error: any) {
      console.error('[fetchPets] Error:', error.message, error.stack);
      if (!isRefresh) {
        Alert.alert('Error', 'Failed to fetch pets. Please try again.');
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  // Handle pull-to-refresh
  const onRefresh = () => {
    fetchPets(true);
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

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Navigate to edit pet profile
  const handleEditPet = (petId: string) => {
    router.push(`/editandaddscreens/editpetprofile?petId=${petId}`);
  };

  // Navigate to medical records
  const handleMedicalRecords = (petId: string) => {
    router.push(`/editandaddscreens/medicalrecords?petId=${petId}`);
  };

  // Navigate to add task
  const handleAddTask = (petId: string) => {
    router.push(`/editandaddscreens/addtask?petId=${petId}`);
  };

  // Load data on component mount
  useEffect(() => {
    fetchPets();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[PetsScreen] Screen focused, refreshing pets...');
      fetchPets();
    }, [])
  );

  // Debug: Log current state
  console.log('[PetsScreen] Current state:', {
    isLoading,
    petsLength: pets.length,
    pets: pets.map(pet => ({ id: pet.id, name: pet.name, hasPicture: !!pet.petPicture }))
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading pets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" translucent />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2C2C2C']}
            tintColor={'#2C2C2C'}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Pets</Text>
          <TouchableOpacity
            onPress={() => router.push('/editandaddscreens/addpet')}
            style={styles.addPetButton}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.addPetButtonText}>Add Pet</Text>
          </TouchableOpacity>
        </View>

        {/* Pets Grid */}
        {pets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="paw" size={60} color="#E0E0E0" />
            <Text style={styles.emptyText}>No pets yet</Text>
            <Text style={styles.emptySubtext}>Add your first pet to get started!</Text>
          </View>
        ) : (
          <View style={styles.petsGrid}>
            {pets.map((pet) => {
              const imageUrl = formatImageUrl(pet.petPicture);
              console.log('[Pet Render] Rendering pet:', pet.name, 'ID:', pet.id, 'Has image:', !!pet.petPicture);
              console.log('[Pet Render] Pet picture field:', pet.petPicture);
              console.log('[Pet Render] Formatted URL:', imageUrl);
              console.log('[Pet Render] Will use image source:', pet.petPicture && imageUrl ? 'Custom image' : 'Default image');
              
              return (
                <View key={pet.id} style={styles.petCard}>
                  <Image
                    source={
                      pet.petPicture && pet.petPicture.trim() !== '' && imageUrl && imageUrl.trim() !== ''
                        ? { uri: imageUrl }
                        : require('../../assets/images/pet.png')
                    }
                    style={styles.petImage}
                    onError={(error) => {
                      console.log('[Pet Image] Error loading image for pet:', pet.name);
                      console.log('[Pet Image] Pet picture field:', pet.petPicture);
                      console.log('[Pet Image] Formatted URL:', imageUrl);
                      console.log('[Pet Image] Error:', error.nativeEvent);
                      console.log('[Pet Image] Source object:', {
                        uri: imageUrl || '',
                        fallback: require('../../assets/images/pet.png'),
                        originalField: pet.petPicture
                      });
                    }}
                    onLoad={() => {
                      console.log('[Pet Image] Image loaded successfully for pet:', pet.name);
                      console.log('[Pet Image] URL:', imageUrl);
                    }}
                  />
                  
                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petType}>{pet.type}</Text>
                    <Text style={styles.petBreed}>{pet.breed}</Text>
                    <Text style={styles.petAge}>{calculateAge(pet.birthdate)}</Text>
                    
                    {pet.healthCondition && (
                      <View style={styles.healthConditionContainer}>
                        <FontAwesome5 name="heartbeat" size={12} color="#FF4757" />
                        <Text style={styles.healthCondition}>{pet.healthCondition}</Text>
                      </View>
                    )}

                    {pet.latestMedicalRecord && (
                      <View style={styles.medicalRecordContainer}>
                        <FontAwesome5 name="stethoscope" size={12} color="#4CAF50" />
                        <Text style={styles.medicalRecordText}>
                          Latest: {pet.latestMedicalRecord.type} - {formatDate(pet.latestMedicalRecord.date)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.petActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditPet(pet.id)}
                    >
                      <FontAwesome5 name="edit" size={14} color="#0E0F0F" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleMedicalRecords(pet.id)}
                    >
                      <FontAwesome5 name="heartbeat" size={14} color="#0E0F0F" />
                      <Text style={styles.actionButtonText}>Medical Records</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleAddTask(pet.id)}
                    >
                      <FontAwesome5 name="tasks" size={14} color="#0E0F0F" />
                      <Text style={styles.actionButtonText}>Add Task</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
  addPetButton: {
    backgroundColor: '#0E0F0F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addPetButtonText: {
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
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
  },
  petsGrid: {
    padding: 20,
  },
  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petImage: {
    width: width - 60, // Larger width with some margin
    height: width - 60, // Square aspect ratio
    borderRadius: 15,
    marginBottom: 20,
    alignSelf: 'center', // Center horizontally
    aspectRatio: 1,
  },
  petInfo: {
    marginBottom: 15,
  },
  petName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 5,
  },
  petType: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 3,
  },
  petBreed: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 3,
  },
  petAge: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  healthConditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  healthCondition: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 5,
    fontWeight: '500',
  },
  medicalRecordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicalRecordText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 5,
    fontWeight: '500',
  },
  petActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 15,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#0E0F0F',
    marginTop: 5,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
    minHeight: 200,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    width: width - 40,
    maxHeight: height * 0.9,
    margin: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0E0F0F',
    marginBottom: 15,
    backgroundColor: '#F8F8F8',
    minHeight: 48,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#0E0F0F',
    marginLeft: 10,
  },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#0E0F0F',
    marginLeft: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 15,
  },
  dropdownContainer: {
    marginBottom: 15,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0E0F0F',
    marginBottom: 10,
  },
  dropdownList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemSelected: {
    backgroundColor: '#0E0F0F',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#0E0F0F',
  },
  dropdownItemTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#0E0F0F',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 50,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  // New styles for enhanced Add Pet modal
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0E0F0F',
    marginTop: 10,
    marginBottom: 5,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    padding: 5,
    borderRadius: 5,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 8,
  },
  inputHelpText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  inputRequired: {
    borderColor: '#FF4757',
  },
  requiredText: {
    fontSize: 12,
    color: '#FF4757',
    marginTop: 5,
    fontStyle: 'italic',
  },
  imagePreviewContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginTop: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4757',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  submitHelpText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});