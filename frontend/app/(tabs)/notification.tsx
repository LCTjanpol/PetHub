import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ImageBackground, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient, ENDPOINTS } from '../../config/api';
import moment from 'moment';
import { FontAwesome5 } from '@expo/vector-icons';
import NotificationService, { TaskNotification } from '../../services/NotificationService';

interface PetMap { [id: number]: string; }
interface Task {
  id: number;
  type: string;
  description?: string;
  time: string;
  petId: number;
  createdAt?: string;
}
interface Notification {
  id: string;
  message: string;
  timestamp: string;
  type?: string;
  petName?: string;
  taskType?: string;
}

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationStats, setNotificationStats] = useState({ activeOverlays: 0, totalOverlays: 0, usingExpoGoMode: true, notificationsAvailable: false });
  const petsRef = useRef<PetMap>({});
  const notificationService = NotificationService.getInstance();

  // Fetch pets and tasks from API
  const fetchPetsAndTasks = useCallback(async (timeCheckOnly = false) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      let petMap = petsRef.current;
      if (!timeCheckOnly) {
        const petsResponse = await apiClient.get(ENDPOINTS.PET.LIST, {
          headers: { Authorization: `Bearer ${token}` },
        });
        petMap = {};
        (petsResponse.data as any[]).forEach((pet) => {
          petMap[pet.id] = pet.name;
        });
        petsRef.current = petMap;
      }
      const tasksResponse = await apiClient.get(ENDPOINTS.TASK.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tasks: Task[] = tasksResponse.data;
      if (!timeCheckOnly) {
        // Add a notification for every task in the system (added notification)
        const addedNotifications: Notification[] = tasks.map((task) => {
          const petName = petMap[task.petId] || 'Unknown Pet';
          
          // Check if task is daily or scheduled based on type field
          const isDaily = task.type === 'Daily';
          
          if (isDaily) {
            // Daily tasks: "Pet name's + task + now"
            const timeStr = task.time ? moment(task.time).format('hh:mm a') : '';
            return {
              id: `added-${task.id}`,
                             message: `${petName}'s ${task.type} now`,
              timestamp: moment(task.createdAt || new Date()).format('YYYY-MM-DD HH:mm:ss'),
              type: task.type,
              petName: petName,
              taskType: task.type,
            };
          } else {
            // Scheduled tasks: "Pet name + scheduled task + is today"
            const taskDate = moment(task.time);
            const today = moment();
            const isToday = taskDate.isSame(today, 'day');
            
            if (isToday) {
              const timeStr = taskDate.format('hh:mm a');
            return {
              id: `added-${task.id}`,
                                 message: `${petName}'s ${task.type} is today at ${timeStr}`,
              timestamp: moment(task.createdAt || new Date()).format('YYYY-MM-DD HH:mm:ss'),
                type: task.type,
                petName: petName,
                taskType: task.type,
            };
          } else {
              const dateStr = taskDate.format('MMM DD');
            return {
              id: `added-${task.id}`,
                                 message: `${petName}'s ${task.type} is on ${dateStr}`,
              timestamp: moment(task.createdAt || new Date()).format('YYYY-MM-DD HH:mm:ss'),
                type: task.type,
                petName: petName,
                taskType: task.type,
            };
            }
          }
        });
        setNotifications((prev) => {
          // Prevent duplicate notifications by ID
          const seen = new Set<string>();
          const all = [...addedNotifications, ...prev];
          return all.filter((n) => {
            if (seen.has(n.id)) return false;
            seen.add(n.id);
            return true;
          });
        });
      }
      await checkTaskTimes(tasks, petMap);
      
      // Schedule phone notifications for all tasks
      if (!timeCheckOnly) {
        await notificationService.scheduleAllTaskNotifications(tasks, petMap);
      }
      
      // Update notification stats
      setNotificationStats(notificationService.getNotificationStats());
    } catch (error: any) {
      console.error('[fetchPetsAndTasks] Error:', error.message, error.stack);
    }
  }, []);

  useEffect(() => {
    fetchPetsAndTasks();
    const interval = setInterval(() => fetchPetsAndTasks(true), 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkTaskTimes = async (tasks: Task[], petMap: PetMap) => {
    const now = moment();
    const newNotifications: Notification[] = [];
    
    // Use the notification service to check for tasks that need notifications
    const taskNotifications = await notificationService.checkTaskNotifications(tasks, petMap);
    
    for (const taskNotification of taskNotifications) {
      // Create overlay notification
      const overlayNotification = await notificationService.createOverlayNotification(
        { id: taskNotification.taskId, name: taskNotification.taskName, type: taskNotification.taskType, time: taskNotification.taskTime },
        taskNotification.petName
      );
      
      // Add to notification list
      newNotifications.push({
        id: taskNotification.id,
        message: taskNotification.message,
        timestamp: taskNotification.timestamp,
        type: 'task',
        petName: taskNotification.petName,
        taskType: taskNotification.taskType,
      });
    }
    
    if (newNotifications.length > 0) {
      setNotifications((prev: Notification[]) => [...newNotifications, ...prev]);
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <View style={styles.notificationContainer}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          <FontAwesome5 
            name={item.type === 'task' ? 'bell' : 'info-circle'} 
            size={16} 
            color={item.type === 'task' ? '#FF6B6B' : '#4ECDC4'} 
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          {item.petName && (
            <Text style={styles.petName}>🐾 {item.petName}</Text>
          )}
          <Text style={styles.notificationTimestamp}>{item.timestamp}</Text>
        </View>
      </View>
    </View>
  );

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            setNotifications([]);
            await notificationService.clearOverlayNotifications();
            setNotificationStats(notificationService.getNotificationStats());
          }
        },
      ]
    );
  };



  return (
    <ImageBackground source={require('../../assets/images/bg.png')} style={styles.bg} resizeMode="cover">
      <View style={styles.container}>
                 <View style={styles.header}>
           <Text style={styles.headerText}>Notifications</Text>
           {notifications.length > 0 && (
             <TouchableOpacity style={styles.clearButton} onPress={clearAllNotifications}>
               <FontAwesome5 name="trash" size={16} color="#FF6B6B" />
               <Text style={styles.clearButtonText}>Clear All</Text>
             </TouchableOpacity>
           )}
         </View>
        
                 {/* Enhanced Notification Stats */}
         <View style={styles.statsContainer}>
           <View style={styles.statCard}>
             <View style={styles.statIconContainer}>
               <FontAwesome5 name="bell" size={18} color="#4ECDC4" />
             </View>
             <Text style={styles.statNumber}>{notifications.length}</Text>
             <Text style={styles.statLabel}>Total</Text>
           </View>
           <View style={styles.statCard}>
             <View style={styles.statIconContainer}>
               <FontAwesome5 name="mobile-alt" size={18} color="#96CEB4" />
             </View>
              <Text style={styles.statNumber}>{notificationStats.totalOverlays}</Text>
              <Text style={styles.statLabel}>Total</Text>
           </View>
           <View style={styles.statCard}>
             <View style={styles.statIconContainer}>
               <FontAwesome5 name="eye" size={18} color="#FFEAA7" />
             </View>
             <Text style={styles.statNumber}>{notificationStats.activeOverlays}</Text>
             <Text style={styles.statLabel}>Active</Text>
           </View>
         </View>
        
                 {notifications.length === 0 ? (
           <View style={styles.emptyContainer}>
             <View style={styles.emptyIconContainer}>
               <FontAwesome5 name="bell-slash" size={48} color="#CCCCCC" />
             </View>
             <Text style={styles.emptyTitle}>No Notifications</Text>
             <Text style={styles.emptySubtitle}>You&apos;re all caught up! New task reminders will appear here.</Text>
           </View>
         ) : (
           <FlatList
             data={notifications}
             renderItem={renderNotification}
             keyExtractor={(item, idx) => `${item.id}-${idx}`}
             contentContainerStyle={styles.notificationList}
             showsVerticalScrollIndicator={false}
           />
         )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: { 
    flex: 1, 
    width: '100%', 
    height: '100%' 
  },
  container: { 
    flex: 1, 
    padding: 10, 
    backgroundColor: 'rgba(255,255,255,0.25)' 
  },
     header: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 20,
     marginTop: 25,
     paddingHorizontal: 5,
   },
   headerText: { 
     fontSize: 28, 
     fontWeight: 'bold', 
     color: '#0E0F0F',
     letterSpacing: 0.5,
   },
  
     clearButton: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(255, 107, 107, 0.15)',
     paddingHorizontal: 16,
     paddingVertical: 10,
     borderRadius: 20,
     shadowColor: '#FF6B6B',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.2,
     shadowRadius: 4,
     elevation: 3,
   },
   clearButtonText: {
     fontSize: 14,
     color: '#FF6B6B',
     fontWeight: '600',
     marginLeft: 6,
   },
  notificationList: {
    paddingBottom: 10 
  },
     statsContainer: {
     flexDirection: 'row',
     justifyContent: 'space-around',
     backgroundColor: 'rgba(255, 255, 255, 0.95)',
     borderRadius: 20,
     padding: 20,
     marginBottom: 20,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.15,
     shadowRadius: 8,
     elevation: 5,
   },
   statCard: {
     alignItems: 'center',
     flex: 1,
   },
   statIconContainer: {
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: 'rgba(78, 205, 196, 0.1)',
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 8,
   },
   statNumber: {
     fontSize: 20,
     fontWeight: 'bold',
     color: '#0E0F0F',
     marginBottom: 2,
   },
   statLabel: {
     fontSize: 12,
     color: '#666666',
     fontWeight: '500',
   },
     notificationContainer: {
     backgroundColor: 'rgba(255, 255, 255, 0.95)',
     borderRadius: 18,
     marginBottom: 15,
     padding: 18,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 3 },
     shadowOpacity: 0.12,
     shadowRadius: 6,
     elevation: 4,
     borderLeftWidth: 4,
     borderLeftColor: '#4ECDC4',
   },
   notificationHeader: {
     flexDirection: 'row',
     alignItems: 'flex-start',
   },
   notificationIcon: {
     width: 36,
     height: 36,
     borderRadius: 18,
     backgroundColor: 'rgba(78, 205, 196, 0.15)',
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: 15,
   },
  notificationContent: {
    flex: 1,
  },
     notificationMessage: { 
     fontSize: 16, 
     color: '#0E0F0F', 
     marginBottom: 6,
     fontWeight: '600',
     lineHeight: 22,
   },
   petName: {
     fontSize: 14,
     color: '#4ECDC4',
     marginBottom: 6,
     fontWeight: '500',
   },
   notificationTimestamp: { 
     fontSize: 12, 
     color: '#999999',
     fontWeight: '400',
     fontStyle: 'italic',
   },
   emptyContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     paddingHorizontal: 40,
     marginTop: 50,
   },
   emptyIconContainer: {
     width: 100,
     height: 100,
     borderRadius: 50,
     backgroundColor: 'rgba(255, 255, 255, 0.8)',
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 20,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 2,
   },
   emptyTitle: {
     fontSize: 20,
     fontWeight: 'bold',
     color: '#666666',
     marginBottom: 8,
     textAlign: 'center',
   },
   emptySubtitle: {
     fontSize: 14,
     color: '#999999',
     textAlign: 'center',
     lineHeight: 20,
   },
});

export default NotificationsScreen;