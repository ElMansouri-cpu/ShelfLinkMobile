import { Stack } from 'expo-router'
import React from 'react'
import { StatusBar, View } from 'react-native'
import BottomNavigation from '../../components/BottomNavigation'
import { usePathname } from 'expo-router'

export default function AppLayout() {
  const pathname = usePathname()
  
  // Define routes that should show the bottom navigation
  const showBottomNav = [
    '/(app)/home',
    '/(app)/discover', 
    '/(app)/orders',
    '/(app)/invoices',
    '/(app)/payments',
    '/(app)/account'
  ].some(route => pathname.includes(route.replace('/(app)/', '')))

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#1A2A4F " />

      <Stack>
        <Stack.Screen
          name="onboarding/onboarding-success"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="invoice"
          options={{
            headerShown: false
          }}
        />

        <Stack.Screen
          name="onboarding/onboarding-stepper"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="discover"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="cart/cart"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="account/language/language-selection"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="account/information/phone-number"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="account/information/password"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="account/information/my-information"
          options={{
            headerShown: false
          }}
        />

        <Stack.Screen
          name="account/language/language-settings"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="order-details"
          options={{
            headerShown: false,
            gestureEnabled: false,
             // Disables swipe back gesture

          }}
        />
    
        <Stack.Screen
          name="store/[id]"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name="store/[id]/categories/[categoryId]"
          options={{
            headerShown: false
          }}
        />

        <Stack.Screen
          name="search"
          options={{
            headerShown: false
          }}
        />

        <Stack.Screen
          name="account"
          options={{
            headerShown: false
          }}
        />

        <Stack.Screen
          name="checkout"
          options={{
            headerShown: false
          }}
        />

        <Stack.Screen
          name="order-tracking"
          options={{
            headerShown: false
          }}
        />

        <Stack.Screen
          name="orders"
          options={{
            headerShown: false
          }}
        />

        <Stack.Screen
          name="order-confirmation"
          options={{
            headerShown: false,
            
        
          }}
        />

        <Stack.Screen
          name="invoices"
          options={{
            headerShown: false
          }}
        />

        <Stack.Screen
          name="payments"
          options={{
            headerShown: false
          }}
        />
      </Stack>

      {/* Global Bottom Navigation */}
      {showBottomNav && <BottomNavigation />}
    </View>
  )
} 