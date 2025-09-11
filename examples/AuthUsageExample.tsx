// examples/AuthUsageExample.tsx
// This file shows how to use the new authentication system

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useSafeUser } from '../hooks/useSafeUser';

// Example 1: Using the basic useAuth hook
export function BasicAuthExample() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!isAuthenticated) {
    return <Text>Please log in</Text>;
  }

  return (
    <View>
      <Text>Welcome, {user?.firstName}!</Text>
      <TouchableOpacity onPress={logout}>
        <Text>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

// Example 2: Using the safe user hook (recommended)
export function SafeUserExample() {
  const { user, isUserReady, hasRequiredFields, isLoggedIn } = useSafeUser();

  if (!isUserReady) {
    return <Text>Loading user data...</Text>;
  }

  if (!hasRequiredFields) {
    return <Text>User data incomplete</Text>;
  }

  return (
    <View>
      <Text>Welcome, {user.firstName} {user.lastName}!</Text>
      <Text>Phone: {user.phone}</Text>
      <Text>Role: {user.role}</Text>
      <Text>Onboarded: {user.isOnboarded ? 'Yes' : 'No'}</Text>
    </View>
  );
}

// Example 3: Conditional rendering based on user state
export function ConditionalUserExample() {
  const { user, isLoggedIn, loading } = useSafeUser();

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!isLoggedIn) {
    return <Text>Please log in to continue</Text>;
  }

  return (
    <View>
      <Text>User ID: {user.id}</Text>
      <Text>Email: {user.email || 'No email'}</Text>
      <Text>Location: {user.location.address || 'No address'}</Text>
    </View>
  );
}

// Example 4: Updating user data
export function UpdateUserExample() {
  const { updateUser, user } = useAuth();

  const handleUpdateProfile = () => {
    updateUser({
      firstName: 'New First Name',
      lastName: 'New Last Name',
      location: {
        address: 'New Address',
        lat: 36.81897,
        lng: 10.16579
      }
    });
  };

  return (
    <View>
      <Text>Current name: {user?.firstName} {user?.lastName}</Text>
      <TouchableOpacity onPress={handleUpdateProfile}>
        <Text>Update Profile</Text>
      </TouchableOpacity>
    </View>
  );
}
