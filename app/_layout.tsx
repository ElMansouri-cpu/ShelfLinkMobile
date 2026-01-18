import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import { NotificationProvider } from '../context/NotificationContext'
import { LocationProvider } from '../context/LocationContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useColorScheme, AppState } from "react-native"
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen';
import 'expo-dev-client';
import Constants from 'expo-constants';
import Mapbox from '@rnmapbox/maps';
import '../i18n' // Import i18n configuration
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'
import Toast from 'react-native-toast-message';
import GlobalPaymentModal from '../components/GlobalPaymentModal';

import React from 'react'

function RootLayoutNav() {
  const colorScheme = useColorScheme()
  SplashScreen.preventAutoHideAsync(); // in your root component

  useEffect(() => {
    async function prepare() {
      // Initialize Mapbox token for both development and production
      const token = Constants.expoConfig?.extra?.mapboxAccessToken || 'pk.eyJ1IjoieGdoYXNlMTQiLCJhIjoiY21mNDhxMXRxMDB3eTJrczRwZTR5dnlydSJ9.-iWoOkmS7QXZqhqwTMLAAA'
      if (token) {
        Mapbox.setAccessToken(token)
      }
      
      // Preload assets or data
      await SplashScreen.hideAsync();
    }

    prepare();
  }, []);


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white"}}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none", // Disable animations to prevent layout bugs
          contentStyle: {
            backgroundColor: colorScheme === "dark" ? "#fff" : "#fff",
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false
          }}
        />
        
        <Stack.Screen
          name="(app)"
          options={{
            headerShown: false
          }}
        />
      </Stack>
    </SafeAreaView>
  )
}

export default function RootLayout() {
  const queryClient = new QueryClient()



  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <NotificationProvider >
                <I18nextProvider i18n={i18n}>
                  <RootLayoutNav />
                  <Toast />
                  <GlobalPaymentModal />
                </I18nextProvider>
              </NotificationProvider>
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}


