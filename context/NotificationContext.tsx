import React, { createContext, useContext, useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase';
import Toast from 'react-native-toast-message';
import { useAuth } from './AuthContext';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

interface NotificationContextType {
  lastPayload: any;
  triggerRefresh: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const { session } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();

  // Request notification permissions and get push token
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
  }, []);

  // Function to play notification sound
  const playSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../assets/alert.wav')
      );
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  // Function to trigger refresh
  const triggerRefresh = () => {
    // Implement your refresh logic here
  };

  // Function to schedule local notification
  const scheduleLocalNotification = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // null means show immediately
    });
  };

  useEffect(() => {
    const setupRealtime = async () => {
      if (!session?.user?.id) return;

      const channel = supabase
        .channel("orders")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `userId=eq.${session?.user?.id}`,
          },
          (payload) => {
            setLastPayload(payload);
            // Show toast for foreground notifications
            Toast.show({
              type: 'success',
              text1: 'Order Update!',
              text2: JSON.stringify(payload.new),
              position: 'top',
              visibilityTime: 4000,
            });
            // Schedule background notification
            scheduleLocalNotification(
              'Order Update!',
              `New order update: ${JSON.stringify(payload.new)}`
            );
            playSound();
            triggerRefresh();
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    };

    setupRealtime();
  }, [session?.user?.id]);

  // Cleanup sound when component unmounts
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return (
    <NotificationContext.Provider value={{ lastPayload, triggerRefresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

// Helper function to request notification permissions and get push token
async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }

  token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
} 