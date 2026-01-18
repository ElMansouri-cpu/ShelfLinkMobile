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
  pendingPayment: any;
  showPaymentModal: (payment: any) => void;
  hidePaymentModal: () => void;
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
  const [pendingPayment, setPendingPayment] = useState<any>(null);
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
    console.log('=== MANUAL INVALIDATION TEST (RETAILER FILTERED) ===');
    console.log('Invalidating all order-details, invoice, and PDF queries for retailer:', user?.id);
    queryClient.invalidateQueries({ queryKey: ['order-details'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['invoice'] });
    queryClient.invalidateQueries({ queryKey: ['invoice-pdf'] });
    
    // Force refetch
    setTimeout(() => {
      console.log('Force refetching all queries for retailer...');
      queryClient.refetchQueries({ queryKey: ['order-details'] });
      queryClient.refetchQueries({ queryKey: ['orders'] });
      queryClient.refetchQueries({ queryKey: ['invoice'] });
      queryClient.refetchQueries({ queryKey: ['invoice-pdf'] });
    }, 100);
    
    console.log('Manual invalidation completed for retailer');
  };

  // Payment modal functions
  const showPaymentModal = (payment: any) => {
    setPendingPayment(payment);
  };

  const hidePaymentModal = () => {
    setPendingPayment(null);
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

       console.log('Setting up realtime subscription for retailer:', user.id);

      // Create separate channels for orders and invoices
      const ordersChannel = supabase
        .channel("orders")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `retailerId=eq.${user?.id}`,
          },
          (payload) => {
             console.log('=== ORDER REALTIME UPDATE RECEIVED ===');
             console.log('Full payload:', payload);
             console.log('Event type:', payload.eventType);
             console.log('New data:', payload.new);
             console.log('Old data:', payload.old);
             console.log('Retailer ID filter:', user?.id);
             
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
               console.log('Invalidating queries for retailer order:', newPayload.id, 'org:', newPayload.organizationId, 'retailer:', newPayload.retailerId);
               
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
                 retailerId: newPayload?.retailerId,
                 hasId: !!newPayload?.id,
                 hasOrgId: !!newPayload?.organizationId,
                 hasRetailerId: !!newPayload?.retailerId
               });
             }
             
             triggerRefresh();
           }
        );

      // Add invoices channel - listen to invoice changes filtered by retailerId
      const invoicesChannel = supabase
        .channel("invoices")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "invoices",
            filter: `retailerId=eq.${user?.id}`,
          },
          async (payload) => {
            console.log('=== INVOICE REALTIME UPDATE RECEIVED ===');
            console.log('Full payload:', payload);
            console.log('Event type:', payload.eventType);
            console.log('New data:', payload.new);
            console.log('Old data:', payload.old);
            console.log('Retailer ID filter:', user?.id);
            
            const newPayload = payload.new as any;
            
            // Since we're filtering by retailerId, we know this invoice belongs to the current user
            if (newPayload?.id) {
              console.log('Invoice is related to current retailer, processing notification');
                
              setLastPayload(payload);
              
              // Check if this is a payment addition (new payment with pending status)
              if (newPayload?.payments && Array.isArray(newPayload.payments)) {
                const pendingPayments = newPayload.payments.filter((payment: any) => 
                  payment.validationStatus === 'pending'
                );
                
                // If there are pending payments, show the modal for the latest one
                if (pendingPayments.length > 0) {
                  const latestPayment = pendingPayments[pendingPayments.length - 1];
                  console.log('New pending payment detected, showing modal:', latestPayment);
                  
                  showPaymentModal({
                    id: latestPayment.id,
                    paymentAmount: latestPayment.paymentAmount,
                    paymentMethod: latestPayment.paymentMethod,
                    invoiceNumber: newPayload.invoiceNumber,
                    organizationId: newPayload.organizationId,
                    invoiceId: newPayload.id
                  });
                  
                  // Show toast for payment notification
                  Toast.show({
                    type: 'info',
                    text1: 'New Payment Notification',
                    text2: `A new payment requires your validation`,
                    position: 'top',
                    visibilityTime: 5000,
                  });
                  
                  // Schedule background notification
                  scheduleLocalNotification(
                    'New Payment Notification',
                    `A new payment requires your validation for invoice ${newPayload.invoiceNumber}`
                  );
                  
                  playSound();
                } else {
                  // Regular invoice update
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
                }
              } else {
                // Regular invoice update without payments
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
              }
              
              // Invalidate invoice queries for the specific invoice
              if (newPayload?.organizationId && newPayload?.orderId) {
                console.log('Invalidating invoice queries for retailer invoice:', newPayload.id, 'org:', newPayload.organizationId, 'retailer:', newPayload.retailerId);
                
                // Invalidate specific invoice queries
                queryClient.invalidateQueries({ 
                  queryKey: ['invoice', newPayload.organizationId, newPayload.orderId] 
                });
                
                // Invalidate all invoice queries with predicate
                queryClient.invalidateQueries({ 
                  queryKey: ['invoice'],
                  predicate: (query) => {
                    const [_, orgId, orderId] = query.queryKey;
                    return orgId === newPayload.organizationId && orderId === newPayload.orderId;
                  }
                });
                
                // Force refetch all invoice queries
                queryClient.invalidateQueries({ 
                  queryKey: ['invoice']
                });
                
                // Also invalidate PDF queries for this invoice
                queryClient.invalidateQueries({ 
                  queryKey: ['invoice-pdf', newPayload.organizationId, newPayload.id]
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
                console.log('Missing organizationId or orderId in invoice payload');
                console.log('Payload structure:', {
                  id: newPayload?.id,
                  organizationId: newPayload?.organizationId,
                  orderId: newPayload?.orderId,
                  retailerId: newPayload?.retailerId,
                  hasId: !!newPayload?.id,
                  hasOrgId: !!newPayload?.organizationId,
                  hasOrderId: !!newPayload?.orderId,
                  hasRetailerId: !!newPayload?.retailerId
                });
              }
            } else {
              console.log('Missing invoice ID in payload');
            }
            
            triggerRefresh();
          }
        );

      // Add client_relationships channel - listen to client relationship changes filtered by clientId
      const clientRelationshipsChannel = supabase
        .channel("client_relationships")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "client_relationships",
            filter: `retailerId=eq.${user?.id}`,
          },
          (payload) => {
            console.log('=== CLIENT RELATIONSHIP REALTIME UPDATE RECEIVED ===');
            console.log('Full payload:', payload);
            console.log('Event type:', payload.eventType);
            console.log('New data:', payload.new);
            console.log('Old data:', payload.old);
            console.log('Client ID filter:', user?.id);
            
            const newPayload = payload.new as any;
            const oldPayload = payload.old as any;
            
            // Check if status changed to approved
            if (payload.eventType === 'UPDATE' && 
                oldPayload?.status !== 'approved' && 
                newPayload?.status === 'approved') {
              
              console.log('Client relationship approved!');
              
              Toast.show({
                type: 'success',
                text1: 'Access Granted!',
                text2: 'You have been approved as a client',
                position: 'top',
                visibilityTime: 5000,
              });
              
              // Schedule background notification
              scheduleLocalNotification(
                'Access Granted!',
                'You have been approved as a client and can now access the store'
              );
              
              playSound();
            }
            
            // Check if status changed from approved to something else
            if (payload.eventType === 'UPDATE' && 
                oldPayload?.status === 'approved' && 
                newPayload?.status !== 'approved') {
              
              console.log('Client relationship status changed from approved');
              
              Toast.show({
                type: 'warning',
                text1: 'Access Status Changed',
                text2: 'Your access status has been updated',
                position: 'top',
                visibilityTime: 4000,
              });
            }
            
            // For new relationships
            if (payload.eventType === 'INSERT') {
              console.log('New client relationship created');
              
              Toast.show({
                type: 'info',
                text1: 'Access Request Sent',
                text2: 'Your access request has been sent to the organization',
                position: 'top',
                visibilityTime: 4000,
              });
            }
            
            setLastPayload(payload);
            
            // Invalidate stores query to refresh the store list with updated statuses
            queryClient.invalidateQueries({ 
              queryKey: ['stores'] 
            });
            
            // Force refetch stores after a short delay
            setTimeout(() => {
              console.log('Force refetching stores...');
              queryClient.refetchQueries({ queryKey: ['stores'] });
            }, 100);
            
            triggerRefresh();
          }
        );

      // Subscribe to all channels with error handling
      ordersChannel.subscribe((status) => {
        console.log('Orders realtime subscription status (retailer filtered):', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('Orders channel error - check table permissions and retailerId filter syntax');
        }
      });

      invoicesChannel.subscribe((status) => {
        console.log('Invoices realtime subscription status (retailer filtered):', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('Invoices channel error - check table permissions and retailerId filter syntax');
        }
      });

      clientRelationshipsChannel.subscribe((status) => {
        console.log('Client relationships realtime subscription status (client filtered):', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('Client relationships channel error - check table permissions and clientId filter syntax');
        }
      });

      return () => {
        console.log('Unsubscribing from realtime channels');
        ordersChannel.unsubscribe();
        invoicesChannel.unsubscribe();
        clientRelationshipsChannel.unsubscribe();
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
    <NotificationContext.Provider value={{ 
      lastPayload, 
      triggerRefresh, 
      testInvalidation, 
      pendingPayment, 
      showPaymentModal, 
      hidePaymentModal 
    }}>
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