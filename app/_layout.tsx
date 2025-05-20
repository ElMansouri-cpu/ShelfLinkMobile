import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import { setAuthToken } from '../lib/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useColorScheme, AppState } from "react-native"
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen';


import React from 'react'

function RootLayoutNav() {
  const { setSession } = useAuth()
  const [loading, setLoading] = React.useState(true)
  const colorScheme = useColorScheme()
  SplashScreen.preventAutoHideAsync(); // in your root component

  useEffect(() => {
    async function prepare() {
      // Preload assets or data
      await SplashScreen.hideAsync();
    }
  
    prepare();
  }, []);
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthToken(session?.access_token ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setAuthToken(session?.access_token ?? null)
    })

    // Optionally, listen for app state changes to refresh data, but do NOT remount providers
    const appSubscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // Optionally trigger a data refresh here
      }
    })

    return () => {
      subscription.unsubscribe()
      appSubscription.remove()
    }
  }, [])

  if (loading) return null; // or show splash screen

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
  const colorScheme = useColorScheme()

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // Optionally trigger a data refresh here
      }
    })
    return () => subscription.remove()
  }, [])

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <RootLayoutNav />
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
} 

  
