import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import config from '../config/environment';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface PushNotificationService {
  registerForPushNotifications: () => Promise<string | undefined>;
  scheduleLocalNotification: (title: string, body: string, data?: any) => Promise<void>;
  addNotificationReceivedListener: (callback: (notification: Notifications.Notification) => void) => Notifications.Subscription;
  addNotificationResponseReceivedListener: (callback: (response: Notifications.NotificationResponse) => void) => Notifications.Subscription;
}

class NotificationService implements PushNotificationService {
  async registerForPushNotifications(): Promise<string | undefined> {
    // Skip on web
    if (Platform.OS === 'web') {
      console.log('Push notifications not supported on web');
      return undefined;
    }

    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return undefined;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return undefined;
      }

      // Get the Expo push token
      const expoPushToken = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your Expo project ID
      });

      console.log('Push token:', expoPushToken.data);

      // Register token with backend
      await this.registerTokenWithBackend(expoPushToken.data);

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1337ec',
        });
      }

      return expoPushToken.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return undefined;
    }
  }

  private async registerTokenWithBackend(pushToken: string): Promise<void> {
    try {
      const { token } = useAuthStore.getState();
      if (!token) return;

      const apiUrl = config.apiUrl;
      const response = await fetch(apiUrl + '/api/notifications/register-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({
          pushToken,
          deviceType: Platform.OS,
        }),
      });

      if (!response.ok) {
        console.error('Failed to register push token with backend');
      }
    } catch (error) {
      console.error('Error registering token with backend:', error);
    }
  }

  async scheduleLocalNotification(title: string, body: string, data?: any): Promise<void> {
    if (Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  }

  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();

// Hook for easy notification setup in components
export const useNotifications = () => {
  const registerForNotifications = async () => {
    return await notificationService.registerForPushNotifications();
  };

  return {
    registerForNotifications,
    scheduleLocalNotification: notificationService.scheduleLocalNotification,
    addNotificationReceivedListener: notificationService.addNotificationReceivedListener,
    addNotificationResponseReceivedListener: notificationService.addNotificationResponseReceivedListener,
  };
};
