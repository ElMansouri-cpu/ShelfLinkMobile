import React, { createContext, useContext, useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase';
import Toast from 'react-native-toast-message';
import { useAuth } from '../hooks/useAuth';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Order } from '../services/order-service/orders.type';

interface NotificationContextType {
  lastPayload: any;
  triggerRefresh: () => void;
  testInvalidation: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const queryClient = useQueryClient();
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

  // Test function to manually trigger invalidation
  const testInvalidation = () => {
    console.log('=== MANUAL INVALIDATION TEST ===');
    console.log('Invalidating all order-details, invoice, and PDF queries...');
    queryClient.invalidateQueries({ queryKey: ['order-details'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['invoice'] });
    queryClient.invalidateQueries({ queryKey: ['invoice-pdf'] });
    
    // Force refetch
    setTimeout(() => {
      console.log('Force refetching all queries...');
      queryClient.refetchQueries({ queryKey: ['order-details'] });
      queryClient.refetchQueries({ queryKey: ['orders'] });
      queryClient.refetchQueries({ queryKey: ['invoice'] });
      queryClient.refetchQueries({ queryKey: ['invoice-pdf'] });
    }, 100);
    
    console.log('Manual invalidation completed');
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
       if (!user?.id) {
         console.log('No user ID, skipping realtime setup');
         return;
       }

       console.log('Setting up realtime subscription for user:', user.id);

      // Create separate channels for orders and invoices
      const ordersChannel = supabase
        .channel("orders")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `assignedTo=eq.${user?.id}`,
          },
          (payload) => {
             console.log('=== REALTIME UPDATE RECEIVED ===');
             console.log('Full payload:', payload);
             console.log('Event type:', payload.eventType);
             console.log('New data:', payload.new);
             console.log('Old data:', payload.old);
             
            setLastPayload(payload);
             
            // Show toast for foreground notifications
            Toast.show({
              type: 'success',
              text1: 'Order Update!',
               text2: `Order ${(payload.new as any)?.id} updated`,
              position: 'top',
              visibilityTime: 4000,
            });
             
            // Schedule background notification
            scheduleLocalNotification(
              'Order Update!',
               `Order ${(payload.new as any)?.id} has been updated`
             );
             
             const newPayload = payload.new as Order;
             playSound();
             
             // Invalidate order details query for the specific order
             if (newPayload?.id && newPayload?.organizationId) {
               console.log('Invalidating queries for order:', newPayload.id, 'org:', newPayload.organizationId);
               
               // Invalidate specific order details
               queryClient.invalidateQueries({ 
                 queryKey: ['order-details', newPayload.id, newPayload.organizationId] 
               });
               
               // Invalidate all order details queries with predicate
               queryClient.invalidateQueries({ 
                 queryKey: ['order-details'],
                 predicate: (query) => {
                   const [_, orderId, orgId] = query.queryKey;
                   return orderId === newPayload.id && orgId === newPayload.organizationId;
                 }
               });
               
               // Force refetch all order details queries
               queryClient.invalidateQueries({ 
                 queryKey: ['order-details']
               });
               
               // Invalidate orders list for the current user
               if (user?.id) {
                 // Invalidate all orders queries for this user (regardless of status filter)
                 queryClient.invalidateQueries({ 
                   queryKey: ['orders', user.id],
                   exact: false
                 });
                 
                 // Also invalidate with organization filter if present
                 queryClient.invalidateQueries({ 
                   queryKey: ['orders', user.id, newPayload.organizationId],
                   exact: false
                 });
               }
               
               // Also invalidate all orders queries (fallback)
               queryClient.invalidateQueries({ 
                 queryKey: ['orders'] 
               });
               
               // Invalidate invoice queries for this order
               queryClient.invalidateQueries({ 
                 queryKey: ['invoice', newPayload.organizationId, newPayload.id]
               });
               
               // Invalidate all invoice queries (fallback)
               queryClient.invalidateQueries({ 
                 queryKey: ['invoice'] 
               });
               
               console.log('Queries invalidated successfully');
               
               // Force refetch after a short delay to ensure invalidation is processed
               setTimeout(() => {
                 console.log('Force refetching queries...');
                 queryClient.refetchQueries({ queryKey: ['order-details'] });
                 queryClient.refetchQueries({ queryKey: ['orders'] });
                 queryClient.refetchQueries({ queryKey: ['invoice'] });
               }, 100);
             } else {
               console.log('Missing order ID or organization ID in payload');
               console.log('Payload structure:', {
                 id: newPayload?.id,
                 organizationId: newPayload?.organizationId,
                 hasId: !!newPayload?.id,
                 hasOrgId: !!newPayload?.organizationId
               });
             }
             
             triggerRefresh();
           }
        );

      // Add invoices channel - listen to all invoice changes and filter by assigned orders
      const invoicesChannel = supabase
        .channel("invoices")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "invoices",
          },
          async (payload) => {
            console.log('=== INVOICE REALTIME UPDATE RECEIVED ===');
            console.log('Full payload:', payload);
            console.log('Event type:', payload.eventType);
            console.log('New data:', payload.new);
            console.log('Old data:', payload.old);
            
            const newPayload = payload.new as any;
            
            // Check if this invoice is related to an order assigned to the current user
            if (newPayload?.orderId) {
              try {
                // Fetch the order to check if it's assigned to the current user
                const { data: order, error } = await supabase
                  .from('orders')
                  .select('assignedTo, organizationId')
                  .eq('id', newPayload.orderId)
                  .single();
                
                if (error) {
                  console.error('Error fetching order for invoice notification:', error);
                  return;
                }
                
                // Only process notification if the order is assigned to the current user
                if (order?.assignedTo !== user?.id) {
                  console.log('Invoice not related to user assigned orders, skipping notification');
                  return;
                }
                
                console.log('Invoice is related to user assigned order, processing notification');
                
                setLastPayload(payload);
                
                // Show toast for foreground notifications
                Toast.show({
                  type: 'success',
                  text1: 'Invoice Update!',
                  text2: `Invoice ${newPayload?.invoiceNumber} updated`,
                  position: 'top',
                  visibilityTime: 4000,
                });
                
                // Schedule background notification
                scheduleLocalNotification(
                  'Invoice Update!',
                  `Invoice ${newPayload?.invoiceNumber} has been updated`
                );
                
                playSound();
              } catch (error) {
                console.error('Error processing invoice notification:', error);
                return;
              }
            } else {
              console.log('No orderId in invoice payload, skipping notification');
              return;
            }
            
            // Invalidate invoice queries for the specific invoice
            if (newPayload?.id && newPayload?.orderId) {
              // Get organizationId from the order we fetched earlier
              const { data: order } = await supabase
                .from('orders')
                .select('organizationId')
                .eq('id', newPayload.orderId)
                .single();
              
              if (order?.organizationId) {
                console.log('Invalidating invoice queries for invoice:', newPayload.id, 'org:', order.organizationId);
                
                // Invalidate specific invoice queries
                queryClient.invalidateQueries({ 
                  queryKey: ['invoice', order.organizationId, newPayload.orderId] 
                });
                
                // Invalidate all invoice queries with predicate
                queryClient.invalidateQueries({ 
                  queryKey: ['invoice'],
                  predicate: (query) => {
                    const [_, orgId, orderId] = query.queryKey;
                    return orgId === order.organizationId && orderId === newPayload.orderId;
                  }
                });
                
                // Force refetch all invoice queries
                queryClient.invalidateQueries({ 
                  queryKey: ['invoice']
                });
                
                // Also invalidate PDF queries for this invoice
                queryClient.invalidateQueries({ 
                  queryKey: ['invoice-pdf', order.organizationId, newPayload.id]
                });
                
                // Invalidate all PDF queries (fallback)
                queryClient.invalidateQueries({ 
                  queryKey: ['invoice-pdf']
                });
                
                console.log('Invoice queries invalidated successfully');
                
                // Force refetch after a short delay to ensure invalidation is processed
                setTimeout(() => {
                  console.log('Force refetching invoice queries...');
                  queryClient.refetchQueries({ queryKey: ['invoice'] });
                  queryClient.refetchQueries({ queryKey: ['invoice-pdf'] });
                }, 100);
              } else {
                console.log('Could not get organizationId from order');
              }
            } else {
              console.log('Missing invoice ID or order ID in payload');
              console.log('Payload structure:', {
                id: newPayload?.id,
                orderId: newPayload?.orderId,
                hasId: !!newPayload?.id,
                hasOrderId: !!newPayload?.orderId
              });
            }
            
            triggerRefresh();
          }
        );

      // Subscribe to both channels with error handling
      ordersChannel.subscribe((status) => {
        console.log('Orders realtime subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('Orders channel error - check table permissions and filter syntax');
        }
      });

      invoicesChannel.subscribe((status) => {
        console.log('Invoices realtime subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('Invoices channel error - check table permissions and filter syntax');
        }
      });

      return () => {
        console.log('Unsubscribing from realtime channels');
        ordersChannel.unsubscribe();
        invoicesChannel.unsubscribe();
      };
    };

    setupRealtime();
  }, [user?.id, queryClient]);

  // Cleanup sound when component unmounts
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return (
    <NotificationContext.Provider value={{ lastPayload, triggerRefresh, testInvalidation }}>
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