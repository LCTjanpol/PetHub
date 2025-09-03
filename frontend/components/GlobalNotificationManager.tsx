// File: GlobalNotificationManager.tsx
// Description: Global notification manager that handles overlay notifications across the entire app

import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import NotificationService, { OverlayNotification } from '../services/NotificationService';
import OverlayNotificationComponent from './OverlayNotification';

interface GlobalNotificationManagerProps {
  children: React.ReactNode;
}

const GlobalNotificationManager: React.FC<GlobalNotificationManagerProps> = ({ children }) => {
  const [activeNotifications, setActiveNotifications] = useState<OverlayNotification[]>([]);
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    // Check for active notifications every second
    const interval = setInterval(() => {
      const notifications = notificationService.getActiveOverlayNotifications();
      setActiveNotifications(notifications);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDismissNotification = (notificationId: string) => {
    notificationService.dismissOverlayNotification(notificationId);
    setActiveNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleCompleteNotification = (notificationId: string) => {
    const notification = activeNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.onComplete();
      setActiveNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      
      {/* Render overlay notifications */}
      {activeNotifications.map((notification) => (
        <OverlayNotificationComponent
          key={notification.id}
          notification={notification}
          onDismiss={() => handleDismissNotification(notification.id)}
          onComplete={() => handleCompleteNotification(notification.id)}
        />
      ))}
    </View>
  );
};

export default GlobalNotificationManager;
