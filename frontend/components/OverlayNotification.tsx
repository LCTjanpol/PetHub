// File: OverlayNotification.tsx
// Description: Overlay notification component that appears on all screens for task reminders

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { OverlayNotification } from '../services/NotificationService';

const { width, height } = Dimensions.get('window');

interface OverlayNotificationProps {
  notification: OverlayNotification;
  onDismiss: () => void;
  onComplete: () => void;
}

const OverlayNotificationComponent: React.FC<OverlayNotificationProps> = ({
  notification,
  onDismiss,
  onComplete,
}) => {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for attention
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handleComplete = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType.toLowerCase()) {
      case 'feeding':
        return 'utensils';
      case 'drinking':
        return 'tint';
      case 'pooping':
        return 'poo';
      case 'walking':
        return 'walking';
      case 'grooming':
        return 'cut';
      case 'medicine':
        return 'pills';
      case 'vaccination':
        return 'syringe';
      default:
        return 'tasks';
    }
  };

  const getTaskColor = (taskType: string) => {
    switch (taskType.toLowerCase()) {
      case 'feeding':
        return '#FF6B6B';
      case 'drinking':
        return '#4ECDC4';
      case 'pooping':
        return '#45B7D1';
      case 'walking':
        return '#96CEB4';
      case 'grooming':
        return '#FFEAA7';
      case 'medicine':
        return '#DDA0DD';
      case 'vaccination':
        return '#98D8C8';
      default:
        return '#0E0F0F';
    }
  };

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.8)" />
      
      <Animated.View
        style={[
          styles.notificationCard,
          {
            transform: [{ scale: pulseAnim }],
            borderLeftColor: getTaskColor(notification.taskType),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <FontAwesome5
              name={getTaskIcon(notification.taskType)}
              size={24}
              color={getTaskColor(notification.taskType)}
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{notification.title}</Text>
            <Text style={styles.time}>{notification.taskTime}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
            <FontAwesome5 name="times" size={16} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.message}>{notification.message}</Text>
          <Text style={styles.petName}>🐾 {notification.petName}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
            <FontAwesome5 name="clock" size={14} color="#666666" />
            <Text style={styles.dismissButtonText}>Remind Later</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: getTaskColor(notification.taskType) }]}
            onPress={handleComplete}
          >
            <FontAwesome5 name="check" size={14} color="#FFFFFF" />
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: getTaskColor(notification.taskType) }]} />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    paddingHorizontal: 20,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: width - 40,
    maxWidth: 400,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E0F0F',
    marginBottom: 2,
  },
  time: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#0E0F0F',
    lineHeight: 22,
    marginBottom: 8,
  },
  petName: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  dismissButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
    marginLeft: 6,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  completeButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  progressContainer: {
    height: 3,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '100%',
    borderRadius: 2,
  },
});

export default OverlayNotificationComponent;
