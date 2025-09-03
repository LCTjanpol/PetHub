// File: addtask.tsx
// Description: User-friendly task management designed for all ages and tech levels

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
  Dimensions
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { apiClient, ENDPOINTS } from '../../config/api';

const { width, height } = Dimensions.get('window');

// Enhanced task interface
interface Task {
  id: number;
  name: string;
  description: string;
  type: 'Daily' | 'Scheduled';
  time: string;
  frequency: string;
  petId: number;
  pet?: {
    name: string;
    type: string;
  };
}

const AddTaskScreen = () => {
  const route = useLocalSearchParams();
  const { petId } = route;
  const petIdNum = petId ? parseInt(petId as string, 10) : 0;

  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskTime, setTaskTime] = useState<Date | null>(null);
  const [isDaily, setIsDaily] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // UI states
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'scheduled'>('daily');
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch tasks on component mount
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await apiClient.get(`${ENDPOINTS.TASK.LIST}?petId=${petIdNum}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem('token');
        Alert.alert('Session expired', 'Please log in again.', [
          { text: 'OK', onPress: () => { router.replace('/auth/login'); } }
        ]);
      } else {
        Alert.alert('Error', 'Failed to fetch tasks: ' + (error?.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [petIdNum]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle time selection
  const handleTimeConfirm = (time: Date) => {
    setTaskTime(time);
    setShowTimePicker(false);
  };

  // Handle date selection for scheduled tasks
  const handleDateConfirm = (date: Date) => {
    if (taskTime) {
      // Combine the selected date with the existing time
      const combinedDateTime = new Date(date);
      combinedDateTime.setHours(taskTime.getHours(), taskTime.getMinutes());
      setTaskTime(combinedDateTime);
    } else {
      setTaskTime(date);
    }
    setShowDatePicker(false);
  };

  // Add new task
  const handleAddTask = async () => {
    if (!taskName.trim()) {
      Alert.alert('Missing Information', 'Please enter what you want to do for your pet');
      return;
    }

    if (!taskTime) {
      Alert.alert('Missing Information', 'Please select when you want to do this');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await apiClient.post(ENDPOINTS.TASK.CREATE, {
        petId: petIdNum,
        name: taskName.trim(),
        description: taskDescription.trim(),
        time: taskTime.toISOString(),
        isDaily,
        frequency: isDaily ? 'daily' : 'once'
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Add new task to the list
      setTasks(prev => [...prev, response.data]);
      
      // Reset form and hide it
      setTaskName('');
      setTaskDescription('');
      setTaskTime(null);
      setShowAddForm(false);
      
      Alert.alert('Success!', 'Your pet task has been added successfully!');
    } catch (error: any) {
      Alert.alert('Oops!', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: number) => {
    Alert.alert(
      'Remove Task',
      'Are you sure you want to remove this task?',
      [
        { text: 'Keep It', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await apiClient.delete(ENDPOINTS.TASK.DELETE(taskId.toString()), {
                headers: { Authorization: `Bearer ${token}` },
              });
              setTasks(prev => prev.filter(task => task.id !== taskId));
              Alert.alert('Done!', 'Task removed successfully!');
            } catch (error: any) {
              Alert.alert('Oops!', 'Something went wrong. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  // Format date for display
  const formatDate = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Render individual task item
  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskName}>{item.name}</Text>
          <View style={styles.taskTypeBadge}>
            <FontAwesome5 
              name={item.type === 'Daily' ? "sync" : "calendar"} 
              size={10} 
              color="#FFFFFF" 
            />
            <Text style={styles.taskTypeText}>
              {item.type === 'Daily' ? 'Every Day' : 'One Time'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteTask(item.id)}
        >
          <FontAwesome5 name="times" size={14} color="#FF4757" />
        </TouchableOpacity>
      </View>
      
      {item.description && (
        <Text style={styles.taskDescription}>{item.description}</Text>
      )}
      
      <View style={styles.taskTimeContainer}>
        <FontAwesome5 name="clock" size={14} color="#0E0F0F" />
        <Text style={styles.taskTime}>
          {formatTime(item.time)}
          {item.type === 'Scheduled' && ` • ${formatDate(item.time)}`}
        </Text>
      </View>
    </View>
  );

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter(task => 
    activeTab === 'daily' ? task.type === 'Daily' : task.type === 'Scheduled'
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" translucent />
      
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
            <Text style={styles.title}>Pet Care Tasks</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeIconContainer}>
              <FontAwesome5 name="heart" size={32} color="#0E0F0F" />
            </View>
            <Text style={styles.welcomeText}>Take Care of Your Pet</Text>
            <Text style={styles.welcomeSubtext}>
              Set reminders for feeding, walks, medicine, or anything your pet needs
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
                <Text style={styles.quickAddText}>Add New Task</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Add Task Form */}
          {showAddForm && (
            <View style={styles.formSection}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Add New Task</Text>
                <TouchableOpacity
                  style={styles.closeFormButton}
                  onPress={() => {
                    setShowAddForm(false);
                    setTaskName('');
                    setTaskDescription('');
                    setTaskTime(null);
                  }}
                >
                  <FontAwesome5 name="times" size={16} color="#666666" />
                </TouchableOpacity>
              </View>
              
              {/* Step 1: What to do */}
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepTitle}>What do you want to do?</Text>
                </View>
                <TextInput
                  style={styles.largeInput}
                  placeholder="Example: Feed my dog, Give medicine, Take for walk"
                  placeholderTextColor="#999999"
                  value={taskName}
                  onChangeText={setTaskName}
                  autoCapitalize="words"
                />
              </View>

              {/* Step 2: Additional details */}
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepTitle}>Any details? (Optional)</Text>
                </View>
                <TextInput
                  style={[styles.largeInput, styles.textArea]}
                  placeholder="Example: Give 2 scoops of food, Take to vet appointment"
                  placeholderTextColor="#999999"
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Step 3: How often */}
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepTitle}>How often?</Text>
                </View>
                <View style={styles.frequencyContainer}>
                  <TouchableOpacity
                    style={[styles.frequencyButton, isDaily && styles.frequencyButtonActive]}
                    onPress={() => setIsDaily(true)}
                  >
                    <FontAwesome5 name="sync" size={16} color={isDaily ? '#FFFFFF' : '#666666'} />
                    <Text style={[styles.frequencyText, isDaily && styles.frequencyTextActive]}>
                      Every Day
                    </Text>
                    <Text style={[styles.frequencySubtext, isDaily && styles.frequencySubtextActive]}>
                      Daily reminder
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.frequencyButton, !isDaily && styles.frequencyButtonActive]}
                    onPress={() => setIsDaily(false)}
                  >
                    <FontAwesome5 name="calendar" size={16} color={!isDaily ? '#FFFFFF' : '#666666'} />
                    <Text style={[styles.frequencyText, !isDaily && styles.frequencyTextActive]}>
                      One Time
                    </Text>
                    <Text style={[styles.frequencySubtext, !isDaily && styles.frequencySubtextActive]}>
                      Specific date
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Step 4: When */}
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>4</Text>
                  </View>
                  <Text style={styles.stepTitle}>When?</Text>
                </View>
                
                {/* Time Selection */}
                <TouchableOpacity
                  style={styles.timeSelectionButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <FontAwesome5 name="clock" size={16} color="#0E0F0F" />
                  <View style={styles.timeSelectionText}>
                    <Text style={styles.timeSelectionLabel}>Time</Text>
                    <Text style={styles.timeSelectionValue}>
                      {taskTime ? formatTime(taskTime.toISOString()) : 'Tap to select time'}
                    </Text>
                  </View>
                  <FontAwesome5 name="chevron-right" size={12} color="#666666" />
                </TouchableOpacity>

                {/* Date Selection for One Time tasks */}
                {!isDaily && (
                  <TouchableOpacity
                    style={styles.timeSelectionButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <FontAwesome5 name="calendar" size={16} color="#0E0F0F" />
                    <View style={styles.timeSelectionText}>
                      <Text style={styles.timeSelectionLabel}>Date</Text>
                      <Text style={styles.timeSelectionValue}>
                        {taskTime ? formatDate(taskTime.toISOString()) : 'Tap to select date'}
                      </Text>
                    </View>
                    <FontAwesome5 name="chevron-right" size={12} color="#666666" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!taskName.trim() || !taskTime || isSubmitting) && styles.submitButtonDisabled
                ]}
                onPress={handleAddTask}
                disabled={!taskName.trim() || !taskTime || isSubmitting}
              >
                <FontAwesome5 
                  name={isSubmitting ? "spinner" : "check"} 
                  size={16} 
                  color="#FFFFFF" 
                  style={isSubmitting ? styles.spinningIcon : undefined}
                />
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Adding...' : 'Add Task'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tasks List */}
          <View style={styles.tasksSection}>
            <View style={styles.tasksHeader}>
              <Text style={styles.tasksTitle}>
                Your Tasks ({filteredTasks.length})
              </Text>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'daily' && styles.activeTab]}
                  onPress={() => setActiveTab('daily')}
                >
                  <FontAwesome5 name="sync" size={14} color={activeTab === 'daily' ? '#FFFFFF' : '#666666'} />
                  <Text style={[styles.tabText, activeTab === 'daily' && styles.activeTabText]}>
                    Daily
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'scheduled' && styles.activeTab]}
                  onPress={() => setActiveTab('scheduled')}
                >
                  <FontAwesome5 name="calendar" size={14} color={activeTab === 'scheduled' ? '#FFFFFF' : '#666666'} />
                  <Text style={[styles.tabText, activeTab === 'scheduled' && styles.activeTabText]}>
                    One Time
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <FontAwesome5 name="spinner" size={24} color="#666666" style={styles.spinningIcon} />
                <Text style={styles.loadingText}>Loading your tasks...</Text>
              </View>
            ) : filteredTasks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FontAwesome5 name="tasks" size={40} color="#E0E0E0" />
                <Text style={styles.emptyText}>
                  No {activeTab === 'daily' ? 'daily' : 'one-time'} tasks yet
                </Text>
                <Text style={styles.emptySubtext}>
                  Tap &quot;Add New Task&quot; above to get started
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredTasks}
                renderItem={renderTask}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                contentContainerStyle={styles.taskList}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Time Picker */}
      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        onConfirm={handleTimeConfirm}
        onCancel={() => setShowTimePicker(false)}
      />

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
        minimumDate={new Date()}
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
    paddingBottom: 40,
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
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
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
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  welcomeIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 22,
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
    paddingHorizontal: 20,
  },
  quickAddSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  quickAddButton: {
    backgroundColor: '#0E0F0F',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  quickAddText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  formSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E0F0F',
  },
  closeFormButton: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
  },
  stepContainer: {
    marginBottom: 25,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0E0F0F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E0F0F',
  },
  largeInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#0E0F0F',
    backgroundColor: '#FFFFFF',
    minHeight: 50,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  frequencyButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: '#0E0F0F',
    borderColor: '#0E0F0F',
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginTop: 6,
    marginBottom: 2,
  },
  frequencyTextActive: {
    color: '#FFFFFF',
  },
  frequencySubtext: {
    fontSize: 11,
    color: '#999999',
  },
  frequencySubtextActive: {
    color: '#CCCCCC',
  },
  timeSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  timeSelectionText: {
    flex: 1,
    marginLeft: 12,
  },
  timeSelectionLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  timeSelectionValue: {
    fontSize: 16,
    color: '#0E0F0F',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#0E0F0F',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  spinningIcon: {
    transform: [{ rotate: '360deg' }],
  },
  tasksSection: {
    paddingHorizontal: 20,
  },
  tasksHeader: {
    marginBottom: 15,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E0F0F',
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#0E0F0F',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  taskList: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 6,
  },
  taskTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0F0F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  taskTypeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 15,
    backgroundColor: '#FFF5F5',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTime: {
    fontSize: 14,
    color: '#0E0F0F',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default AddTaskScreen;