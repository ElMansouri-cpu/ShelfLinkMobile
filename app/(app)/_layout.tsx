import { Stack } from 'expo-router'
import React from 'react'
import { StatusBar } from 'react-native'
export default function AppLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Stack>
        <Stack.Screen
          name="onboarding/onboarding-success"
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
      </Stack>

    </>
  )
} 