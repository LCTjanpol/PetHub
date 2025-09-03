// File: medicalrecords.tsx
// Description: Health app-style medical records management for pets with improved error handling

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { apiClient, ENDPOINTS } from '../../config/api';

const { width, height } = Dimensions.get('window');

// Medical record interface
interface MedicalRecord {
  id: number;
  type: string;
  medicineName: string;
  veterinarian: string;
  clinic: string;
  date: string;
  petId: number;
  pet?: {
    name: string;
    type: string;
  };
}

// Custom Warning Component for better UX
const WarningMessage = ({ message, isVisible, onClose }: { 
  message: string; 
  isVisible: boolean; 
  onClose: () => void; 
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-50)).current;

  React.useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.warningContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.warningContent}>
        <View style={styles.warningIconContainer}>
          <Text style={styles.warningIcon}>⚠️</Text>
        </View>
        <View style={styles.warningTextContainer}>
          <Text style={styles.warningTitle}>Medical Records Issue</Text>
          <Text style={styles.warningMessage}>{message}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.warningCloseButton}>
          <Text style={styles.warningCloseText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const MedicalRecordsScreen = () => {
  const route = useLocalSearchParams();
  const { petId } = route;
  const petIdNum = petId ? parseInt(petId as string, 10) : 0;

  // State management
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [recordType, setRecordType] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [clinic, setClinic] = useState('');
  const [recordDate, setRecordDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // UI states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  // Function to show warning message
  const showWarningMessage = (message: string) => {
    setWarningMessage(message);
    setShowWarning(true);
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowWarning(false);
    }, 5000);
  };

  // Fetch medical records on component mount
  const fetchMedicalRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        showWarningMessage('You need to be logged in to view medical records. Please log in again.');
        router.replace('/auth/login');
        return;
      }

      console.log('Fetching medical records for pet:', petId);
      const response = await apiClient.get(`${ENDPOINTS.PET.MEDICAL_RECORDS(petId.toString())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Medical records response:', response.data);
      setRecords(response.data || []);
    } catch (error: any) {
      console.error('Medical records fetch error:', error);
      
      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
        showWarningMessage('Your session has expired. Please log in again to continue.');
        setTimeout(() => {
          router.replace('/auth/login');
        }, 2000);
      } else if (error?.response?.status === 404) {
        showWarningMessage('Pet not found. Please check if you have access to this pet.');
      } else if (error?.code === 'NETWORK_ERROR' || error?.code === 'ECONNREFUSED') {
        showWarningMessage('Unable to connect to our servers. Please check your internet connection and try again.');
      } else {
        showWarningMessage('Unable to load medical records. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    fetchMedicalRecords();
  }, [fetchMedicalRecords]);

  // Handle date selection
  const handleDateConfirm = (date: Date) => {
    setRecordDate(date);
    setShowDatePicker(false);
  };

  // Add new medical record with enhanced error handling
  const handleAddRecord = async () => {
    // Validate all required fields
    if (!recordType.trim()) {
      showWarningMessage('Please enter the type of treatment or medication before continuing.');
      return;
    }

    if (!medicineName.trim()) {
      showWarningMessage('Please enter the medicine or treatment name before continuing.');
      return;
    }

    if (!veterinarian.trim()) {
      showWarningMessage('Please enter the veterinarian name before continuing.');
      return;
    }

    if (!clinic.trim()) {
      showWarningMessage('Please enter the clinic or hospital name before continuing.');
      return;
    }

    if (!recordDate) {
      showWarningMessage('Please select the date of the visit before continuing.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        showWarningMessage('You need to be logged in to add medical records. Please log in again.');
        router.replace('/auth/login');
        return;
      }

      console.log('Creating medical record:', {
        petId,
        type: recordType.trim(),
        medicineName: medicineName.trim(),
        veterinarian: veterinarian.trim(),
        clinic: clinic.trim(),
        date: recordDate.toISOString(),
      });

      const response = await apiClient.post(`${ENDPOINTS.PET.MEDICAL_RECORDS(petId.toString())}`, {
        petId,
        type: recordType.trim(),
        medicineName: medicineName.trim(),
        veterinarian: veterinarian.trim(),
        clinic: clinic.trim(),
        date: recordDate.toISOString(),
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Medical record created:', response.data);

      // Add new record to the list
      const newRecord = response.data.data || response.data;
      setRecords(prev => [newRecord, ...prev]);
      
      // Reset form and hide it
      setRecordType('');
      setMedicineName('');
      setVeterinarian('');
      setClinic('');
      setRecordDate(null);
      setShowAddForm(false);
      
      // Show success message
      Alert.alert('Success!', 'Medical record has been added successfully!', [
        { text: 'OK', style: 'default' }
      ]);

    } catch (error: any) {
      console.error('Medical record creation error:', error);
      
      if (error?.response?.status === 401) {
        showWarningMessage('Your session has expired. Please log in again to continue.');
        setTimeout(() => {
          router.replace('/auth/login');
        }, 2000);
      } else if (error?.response?.status === 400) {
        const errorMsg = error.response.data?.message || 'Please check that all fields are filled correctly.';
        showWarningMessage(errorMsg);
      } else if (error?.response?.status === 404) {
        showWarningMessage('Pet not found. Please check if you have access to this pet.');
      } else if (error?.code === 'NETWORK_ERROR' || error?.code === 'ECONNREFUSED') {
        showWarningMessage('Unable to connect to our servers. Please check your internet connection and try again.');
      } else {
        showWarningMessage('We encountered an issue while saving the medical record. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete medical record with enhanced error handling
  const handleDeleteRecord = async (recordId: number) => {
    Alert.alert(
      'Remove Medical Record',
      'Are you sure you want to remove this medical record? This action cannot be undone.',
      [
        { text: 'Keep Record', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              
              if (!token) {
                showWarningMessage('You need to be logged in to delete medical records. Please log in again.');
                router.replace('/auth/login');
                return;
              }

              await apiClient.delete(ENDPOINTS.PET.MEDICAL_RECORD(petId.toString(), recordId.toString()), {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              setRecords(prev => prev.filter(record => record.id !== recordId));
              
              Alert.alert('Success!', 'Medical record has been removed successfully!', [
                { text: 'OK', style: 'default' }
              ]);
            } catch (error: any) {
              console.error('Medical record deletion error:', error);
              
              if (error?.response?.status === 401) {
                showWarningMessage('Your session has expired. Please log in again to continue.');
              } else if (error?.response?.status === 404) {
                showWarningMessage('Medical record not found. It may have already been removed.');
                // Remove from local state anyway
                setRecords(prev => prev.filter(record => record.id !== recordId));
              } else {
                showWarningMessage('We encountered an issue while removing the medical record. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString([], { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get icon for record type
  const getRecordTypeIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('vaccine') || lowerType.includes('vaccination')) return 'syringe';
    if (lowerType.includes('surgery') || lowerType.includes('operation')) return 'cut';
    if (lowerType.includes('checkup') || lowerType.includes('examination')) return 'stethoscope';
    if (lowerType.includes('dental') || lowerType.includes('teeth')) return 'tooth';
    if (lowerType.includes('emergency') || lowerType.includes('urgent')) return 'ambulance';
    return 'pills';
  };

  // Get color for record type
  const getRecordTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('vaccine') || lowerType.includes('vaccination')) return '#666666';
    if (lowerType.includes('surgery') || lowerType.includes('operation')) return '#999999';
    if (lowerType.includes('checkup') || lowerType.includes('examination')) return '#666666';
    if (lowerType.includes('dental') || lowerType.includes('teeth')) return '#999999';
    if (lowerType.includes('emergency') || lowerType.includes('urgent')) return '#2C2C2C';
    return '#666666';
  };

  // Render individual medical record item
  const renderMedicalRecord = ({ item }: { item: MedicalRecord }) => (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.recordTypeContainer}>
          <View style={[styles.recordTypeIcon, { backgroundColor: getRecordTypeColor(item.type) }]}>
            <FontAwesome5 
              name={getRecordTypeIcon(item.type)} 
              size={16} 
              color="#FFFFFF" 
            />
          </View>
          <View style={styles.recordTypeInfo}>
            <Text style={styles.recordType}>{item.type}</Text>
            <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteRecord(item.id)}
        >
          <FontAwesome5 name="times" size={14} color="#FF4757" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.recordDetails}>
        <View style={styles.detailRow}>
          <FontAwesome5 name="pills" size={14} color="#666666" />
          <Text style={styles.detailLabel}>Medicine:</Text>
          <Text style={styles.detailValue}>{item.medicineName}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <FontAwesome5 name="user-md" size={14} color="#666666" />
          <Text style={styles.detailLabel}>Veterinarian:</Text>
          <Text style={styles.detailValue}>{item.veterinarian}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <FontAwesome5 name="hospital" size={14} color="#666666" />
          <Text style={styles.detailLabel}>Clinic:</Text>
          <Text style={styles.detailValue}>{item.clinic}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" translucent />
      
      {/* Warning Message Component */}
      <WarningMessage 
        message={warningMessage}
        isVisible={showWarning}
        onClose={() => setShowWarning(false)}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <FontAwesome5 name="arrow-left" size={18} color="#0E0F0F" />
            </TouchableOpacity>
            <Text style={styles.title}>Medical Records</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeIconContainer}>
              <FontAwesome5 name="heartbeat" size={32} color="#0E0F0F" />
            </View>
            <Text style={styles.welcomeText}>Pet Health Records</Text>
            <Text style={styles.welcomeSubtext}>
              Keep track of vaccinations, treatments, and veterinary visits
            </Text>
          </View>

          {/* Quick Add Button */}
          {!showAddForm && (
            <View style={styles.quickAddSection}>
              <TouchableOpacity
                style={styles.quickAddButton}
                onPress={() => setShowAddForm(true)}
              >
                <FontAwesome5 name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.quickAddText}>Add Medical Record</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Add Record Form */}
          {showAddForm && (
            <View style={styles.formSection}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Add Medical Record</Text>
                <TouchableOpacity
                  style={styles.closeFormButton}
                  onPress={() => {
                    setShowAddForm(false);
                    setRecordType('');
                    setMedicineName('');
                    setVeterinarian('');
                    setClinic('');
                    setRecordDate(null);
                  }}
                >
                  <FontAwesome5 name="times" size={16} color="#666666" />
                </TouchableOpacity>
              </View>

              {/* Treatment Type Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Treatment Type *</Text>
                <TextInput
                  style={styles.input}
                  value={recordType}
                  onChangeText={setRecordType}
                  placeholder="e.g., Vaccination, Surgery, Checkup"
                  placeholderTextColor="#999999"
                  autoCapitalize="words"
                />
              </View>

              {/* Medicine/Treatment Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Medicine/Treatment *</Text>
                <TextInput
                  style={styles.input}
                  value={medicineName}
                  onChangeText={setMedicineName}
                  placeholder="e.g., Rabies vaccine, Antibiotics"
                  placeholderTextColor="#999999"
                  autoCapitalize="words"
                />
              </View>

              {/* Veterinarian Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Veterinarian *</Text>
                <TextInput
                  style={styles.input}
                  value={veterinarian}
                  onChangeText={setVeterinarian}
                  placeholder="Doctor's name"
                  placeholderTextColor="#999999"
                  autoCapitalize="words"
                />
              </View>

              {/* Clinic Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Clinic/Hospital *</Text>
                <TextInput
                  style={styles.input}
                  value={clinic}
                  onChangeText={setClinic}
                  placeholder="Clinic or hospital name"
                  placeholderTextColor="#999999"
                  autoCapitalize="words"
                />
              </View>

              {/* Date Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date of Visit *</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <FontAwesome5 name="calendar" size={16} color="#0E0F0F" />
                  <Text style={styles.dateButtonText}>
                    {recordDate ? formatDate(recordDate.toISOString()) : 'Select date of visit'}
                  </Text>
                  <FontAwesome5 name="chevron-right" size={12} color="#666666" />
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!recordType.trim() || !medicineName.trim() || !veterinarian.trim() || !clinic.trim() || !recordDate || isSubmitting) && styles.submitButtonDisabled
                ]}
                onPress={handleAddRecord}
                disabled={!recordType.trim() || !medicineName.trim() || !veterinarian.trim() || !clinic.trim() || !recordDate || isSubmitting}
              >
                <FontAwesome5
                  name={isSubmitting ? "spinner" : "save"}
                  size={16}
                  color="#FFFFFF"
                  style={isSubmitting ? styles.spinningIcon : undefined}
                />
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Saving...' : 'Save Medical Record'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Records Section */}
          <View style={styles.recordsSection}>
            <View style={styles.recordsHeader}>
              <Text style={styles.recordsTitle}>
                Medical History ({records.length})
              </Text>
              {!isLoading && records.length > 0 && (
                <View style={styles.recordsStats}>
                  <View style={styles.statItem}>
                    <FontAwesome5 name="syringe" size={12} color="#4CAF50" />
                    <Text style={styles.statText}>
                      {records.filter(r => r.type.toLowerCase().includes('vaccine')).length} Vaccines
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <FontAwesome5 name="stethoscope" size={12} color="#2196F3" />
                    <Text style={styles.statText}>
                      {records.filter(r => r.type.toLowerCase().includes('checkup')).length} Checkups
                    </Text>
                  </View>
                </View>
              )}
            </View>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <FontAwesome5 name="spinner" size={24} color="#666666" style={styles.spinningIcon} />
                <Text style={styles.loadingText}>Loading medical records...</Text>
              </View>
            ) : records.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FontAwesome5 name="heartbeat" size={40} color="#E0E0E0" />
                <Text style={styles.emptyText}>No medical records yet</Text>
                <Text style={styles.emptySubtext}>
                  Tap &quot;Add Medical Record&quot; above to get started
                </Text>
              </View>
            ) : (
              <FlatList
                data={records}
                renderItem={renderMedicalRecord}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                contentContainerStyle={styles.recordsList}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
        maximumDate={new Date()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Warning Message Styles
  warningContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  warningContent: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEAA7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  warningIconContainer: {
    marginRight: 12,
  },
  warningIcon: {
    fontSize: 24,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  warningMessage: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  warningCloseButton: {
    padding: 4,
  },
  warningCloseText: {
    fontSize: 18,
    color: '#856404',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0E0F0F',
  },
  placeholder: {
    width: 40,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0E0F0F',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  quickAddSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  quickAddButton: {
    backgroundColor: '#0E0F0F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  quickAddText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0E0F0F',
  },
  closeFormButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0E0F0F',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  dateButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#0E0F0F',
    marginLeft: 12,
  },
  submitButton: {
    backgroundColor: '#0E0F0F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  recordsSection: {
    paddingHorizontal: 20,
  },
  recordsHeader: {
    marginBottom: 20,
  },
  recordsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0E0F0F',
    marginBottom: 10,
  },
  recordsStats: {
    flexDirection: 'row',
    gap: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
  },
  spinningIcon: {
    // Add spinning animation if needed
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999999',
    marginTop: 15,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  recordsList: {
    gap: 15,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recordTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordTypeInfo: {
    flex: 1,
  },
  recordType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 2,
  },
  recordDate: {
    fontSize: 14,
    color: '#666666',
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#0E0F0F',
    flex: 1,
    fontWeight: '500',
  },
});

export default MedicalRecordsScreen;