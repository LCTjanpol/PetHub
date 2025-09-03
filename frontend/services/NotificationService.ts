// File: NotificationService.ts
// Description: Overlay-only notification service for task reminders (Expo Go compatible)

import { Platform, Alert, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

export interface TaskNotification {
  id: string;
  taskId: number;
  petName: string;
  taskName: string;
  taskType: string;
  taskTime: string;
  message: string;
  timestamp: string;
  isOverlay: boolean;
  isPhoneNotification: boolean;
}

export interface OverlayNotification {
  id: string;
  title: string;
  message: string;
  petName: string;
  taskType: string;
  taskTime: string;
  timestamp: string;
  isVisible: boolean;
  onDismiss: () => void;
  onComplete: () => void;
}

class NotificationService {
  private static instance: NotificationService;
  private overlayNotifications: OverlayNotification[] = [];

  private constructor() {
    // Initialize notifications asynchronously to avoid blocking
    setTimeout(() => {
      this.initializeNotifications();
    }, 1000);
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service (overlay-only for Expo Go)
   */
  private async initializeNotifications() {
    try {
      console.log('📱 Using overlay notifications only (Expo Go compatible)');
      this.showExpoGoNotification();
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
    }
  }

  /**
   * Show a one-time notification about Expo Go limitations
   */
  private async showExpoGoNotification() {
    try {
      const hasShownNotice = await AsyncStorage.getItem('expo-go-notice-shown');
      if (!hasShownNotice) {
        Alert.alert(
          '📱 Notification Notice',
          'Running in Expo Go: Task reminders will appear as in-app overlays.',
          [{ text: 'Got it!' }]
        );
        await AsyncStorage.setItem('expo-go-notice-shown', 'true');
      }
    } catch (error) {
      console.log('Could not show Expo Go notice');
    }
  }

  /**
   * Schedule a notification for a task (overlay-only in Expo Go)
   */
  public async schedulePhoneNotification(task: any, petName: string): Promise<string | null> {
    try {
      const taskTime = moment(task.time);
      const now = moment();
      
      // Don't schedule if the time has already passed
      if (taskTime.isBefore(now)) {
        console.log('📅 Cannot schedule notification for past time');
        return null;
      }

      console.log('📱 Phone notifications not available - will show overlay notification at task time');
      // Store task for overlay notification checking
      await this.storeTaskForOverlay(task, petName);
      return `overlay-${task.id}-${taskTime.format('YYYYMMDDHHmm')}`;
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Store task for overlay notification checking
   */
  private async storeTaskForOverlay(task: any, petName: string) {
    try {
      const existingTasks = await AsyncStorage.getItem('pending-overlay-tasks');
      const tasks = existingTasks ? JSON.parse(existingTasks) : [];
      
      tasks.push({
        ...task,
        petName,
        storedAt: new Date().toISOString(),
      });
      
      await AsyncStorage.setItem('pending-overlay-tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('❌ Failed to store task for overlay:', error);
    }
  }

  /**
   * Create an overlay notification that appears on all screens
   */
  public async createOverlayNotification(task: any, petName: string): Promise<OverlayNotification | null> {
    // Check if user is a regular user (not admin or shop owner)
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.isAdmin || user.isShopOwner) {
          console.log('📱 Skipping overlay notification for admin/shop owner');
          return null;
        }
      }
    } catch (error) {
      console.log('Could not check user role, showing notification');
    }

    const taskTime = moment(task.time);
    const notificationId = `overlay-${task.id}-${Date.now()}`;
    
    // Provide haptic feedback for better user experience
    try {
      Vibration.vibrate([100, 50, 100]);
    } catch (error) {
      console.log('Vibration not available');
    }
    
    // Check if task is daily or scheduled
    const isDaily = task.type === 'Daily';
    let message: string;
    
    if (isDaily) {
      // Daily tasks: "Pet name's + task + now"
      message = `${petName}'s ${task.name || task.type} now`;
    } else {
      // Scheduled tasks: "Pet name + scheduled task + is today"
      const taskDate = moment(task.time);
      const today = moment();
      const isToday = taskDate.isSame(today, 'day');
      
      if (isToday) {
        const timeStr = taskDate.format('hh:mm a');
        message = `${petName}'s ${task.name || task.type} is today at ${timeStr}`;
      } else {
        message = `${petName}'s ${task.name || task.type} is today`;
      }
    }
    
    const overlayNotification: OverlayNotification = {
      id: notificationId,
      title: `🐾 ${task.name || task.type} Time!`,
      message: message,
      petName: petName,
      taskType: task.type,
      taskTime: taskTime.format('HH:mm'),
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      isVisible: true,
      onDismiss: () => this.dismissOverlayNotification(notificationId),
      onComplete: () => this.completeTaskNotification(notificationId, task.id),
    };

    this.overlayNotifications.push(overlayNotification);
    
    console.log(`📱 Created overlay notification for ${petName}: ${task.name || task.type}`);
    
    // Auto-dismiss after 60 seconds (longer for better accessibility)
    setTimeout(() => {
      this.dismissOverlayNotification(notificationId);
    }, 60000);

    return overlayNotification;
  }

  /**
   * Dismiss an overlay notification
   */
  public dismissOverlayNotification(notificationId: string) {
    this.overlayNotifications = this.overlayNotifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isVisible: false }
        : notification
    );
  }

  /**
   * Complete a task notification
   */
  public async completeTaskNotification(notificationId: string, taskId: number) {
    try {
      // Mark task as completed in backend (you can implement this)
      console.log(`✅ Task ${taskId} marked as completed`);
      
      // Dismiss the overlay
      this.dismissOverlayNotification(notificationId);
      
      // Provide positive feedback
      try {
        Vibration.vibrate([50, 50, 150]);
      } catch (error) {
        console.log('Vibration not available');
      }
      
      // Show completion notification
      Alert.alert(
        '✅ Task Completed!',
        'Great job taking care of your pet!',
        [{ text: 'Thanks!' }]
      );
    } catch (error) {
      console.error('❌ Failed to complete task notification:', error);
    }
  }

  /**
   * Get all active overlay notifications
   */
  public getActiveOverlayNotifications(): OverlayNotification[] {
    return this.overlayNotifications.filter(notification => notification.isVisible);
  }

  /**
   * Check for tasks that need notifications
   */
  public async checkTaskNotifications(tasks: any[], petMap: { [id: number]: string }): Promise<TaskNotification[]> {
    const now = moment();
    const notifications: TaskNotification[] = [];

    // Check if user is a regular user (not admin or shop owner)
    let shouldShowOverlay = true;
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.isAdmin || user.isShopOwner) {
          shouldShowOverlay = false;
        }
      }
    } catch (error) {
      console.log('Could not check user role, showing notifications');
    }

    tasks.forEach((task) => {
      const petName = petMap[task.petId] || 'Unknown Pet';
      const taskTime = moment(task.time);
      
      // Check if it's time for the task (within 1 minute)
      const timeDiff = Math.abs(now.diff(taskTime, 'minutes'));
      
      if (timeDiff <= 1) {
        // Check if task is daily or scheduled
        const isDaily = task.type === 'Daily';
        let message: string;
        
        if (isDaily) {
          // Daily tasks: "Pet name's + task + now"
          message = `${petName}'s ${task.name || task.type} now`;
        } else {
          // Scheduled tasks: "Pet name + scheduled task + is today"
          const taskDate = moment(task.time);
          const today = moment();
          const isToday = taskDate.isSame(today, 'day');
          
          if (isToday) {
            const timeStr = taskDate.format('hh:mm a');
            message = `${petName}'s ${task.name || task.type} is today at ${timeStr}`;
          } else {
            message = `${petName}'s ${task.name || task.type} is today`;
          }
        }
        
        const notification: TaskNotification = {
          id: `task-${task.id}-${now.format('YYYYMMDDHHmm')}`,
          taskId: task.id,
          petName: petName,
          taskName: task.name || task.type,
          taskType: task.type,
          taskTime: taskTime.format('HH:mm'),
          message: message,
          timestamp: now.format('YYYY-MM-DD HH:mm:ss'),
          isOverlay: shouldShowOverlay,
          isPhoneNotification: false,
        };

        notifications.push(notification);
      }
    });

    return notifications;
  }

  /**
   * Schedule notifications for all upcoming tasks
   */
  public async scheduleAllTaskNotifications(tasks: any[], petMap: { [id: number]: string }) {
    try {
      // Cancel existing notifications
      await this.cancelAllNotifications();
      
      const now = moment();
      
      tasks.forEach(async (task) => {
        const petName = petMap[task.petId] || 'Unknown Pet';
        const taskTime = moment(task.time);
        
        // Only schedule for future tasks
        if (taskTime.isAfter(now)) {
          await this.schedulePhoneNotification(task, petName);
        }
      });
      
      console.log(`Scheduled notifications for ${tasks.length} tasks`);
    } catch (error) {
      console.error('Failed to schedule all task notifications:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  public async cancelAllNotifications() {
    try {
      console.log('📱 Clearing overlay notification storage (Expo Go mode)');
      await AsyncStorage.removeItem('pending-overlay-tasks');
      this.overlayNotifications = [];
    } catch (error) {
      console.error('❌ Failed to cancel notifications:', error);
    }
  }

  /**
   * Clear all overlay notifications
   */
  public async clearOverlayNotifications() {
    this.overlayNotifications = [];
    // Also clear stored tasks for overlay notifications
    try {
      await AsyncStorage.removeItem('pending-overlay-tasks');
      console.log('📱 Cleared stored overlay tasks');
    } catch (error) {
      console.error('❌ Failed to clear stored overlay tasks:', error);
    }
  }

  /**
   * Check stored tasks for overlay notifications
   */
  public async checkStoredTasksForNotifications(): Promise<TaskNotification[]> {
    // Check if user is a regular user (not admin or shop owner)
    let shouldShowOverlay = true;
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.isAdmin || user.isShopOwner) {
          shouldShowOverlay = false;
        }
      }
    } catch (error) {
      console.log('Could not check user role, showing notifications');
    }

    if (!shouldShowOverlay) {
      return [];
    }

    try {
      const storedTasks = await AsyncStorage.getItem('pending-overlay-tasks');
      if (!storedTasks) return [];

      const tasks = JSON.parse(storedTasks);
      const now = moment();
      const notifications: TaskNotification[] = [];
      const remainingTasks: any[] = [];

      tasks.forEach((task: any) => {
        const taskTime = moment(task.time);
        const timeDiff = Math.abs(now.diff(taskTime, 'minutes'));

        if (timeDiff <= 1) {
          // Check if task is daily or scheduled
          const isDaily = task.type === 'Daily';
          let message: string;
          
          if (isDaily) {
            // Daily tasks: "Pet name's + task + now"
            message = `${task.petName}'s ${task.name || task.type} now`;
          } else {
            // Scheduled tasks: "Pet name + scheduled task + is today"
            const taskDate = moment(task.time);
            const today = moment();
            const isToday = taskDate.isSame(today, 'day');
            
            if (isToday) {
              const timeStr = taskDate.format('hh:mm a');
              message = `${task.petName}'s ${task.name || task.type} is today at ${timeStr}`;
            } else {
              message = `${task.petName}'s ${task.name || task.type} is today`;
            }
          }
          
          // Time to show notification
          const notification: TaskNotification = {
            id: `stored-task-${task.id}-${now.format('YYYYMMDDHHmm')}`,
            taskId: task.id,
            petName: task.petName,
            taskName: task.name || task.type,
            taskType: task.type,
            taskTime: taskTime.format('HH:mm'),
            message: message,
            timestamp: now.format('YYYY-MM-DD HH:mm:ss'),
            isOverlay: true,
            isPhoneNotification: false,
          };
          notifications.push(notification);
        } else if (taskTime.isAfter(now)) {
          // Keep for future checking
          remainingTasks.push(task);
        }
        // Remove past tasks (no else needed)
      });

      // Update stored tasks
      await AsyncStorage.setItem('pending-overlay-tasks', JSON.stringify(remainingTasks));

      return notifications;
    } catch (error) {
      console.error('❌ Failed to check stored tasks:', error);
      return [];
    }
  }

  /**
   * Get notification statistics
   */
  public getNotificationStats() {
    return {
      activeOverlays: this.overlayNotifications.filter(n => n.isVisible).length,
      totalOverlays: this.overlayNotifications.length,
      usingExpoGoMode: true,
      notificationsAvailable: false,
    };
  }
}

export default NotificationService;
