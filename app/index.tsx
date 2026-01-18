import React, { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import { useAuth } from '../hooks/useAuth'
import '../styles/global.css'

export default function Index() {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loading while auth is initializing
  if (loading) {
    return null; // or a loading spinner
  }

  // Redirect based on authentication status
  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />
  } else {
    // Check if user needs onboarding
    if (!user.isOnboarded) {
      return <Redirect href="/(app)/onboarding/onboarding-stepper" />
    } else {
      return <Redirect href="/(app)/home" />
    }
  }
} 