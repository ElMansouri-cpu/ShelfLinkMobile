// examples/login-usage.tsx
// Example of how to use the AuthContext for login

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { User } from '../utils/auth';

export default function LoginScreen() {
  const { login, loading, user } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      
      // Example API call to your login endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: '+1234567890',
          password: 'password123',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Use the login method from AuthContext
        await login(data.user, data.accessToken, data.refreshToken);
        
        // User is now automatically set in context and available throughout the app
        console.log('User logged in:', user);
        
        // Navigate to main app or show success message
        Alert.alert('Success', 'Login successful!');
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Login Screen</Text>
      <TouchableOpacity 
        onPress={handleLogin}
        disabled={isLoggingIn || loading}
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 8,
          marginTop: 20,
        }}
      >
        <Text style={{ color: 'white' }}>
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Example of how to use the user data in any component
export function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) {
    return <Text>No user logged in</Text>;
  }

  return (
    <View>
      <Text>Welcome, {user.firstName} {user.lastName}!</Text>
      <Text>Phone: {user.phone}</Text>
      <Text>Role: {user.role}</Text>
      <TouchableOpacity onPress={logout}>
        <Text>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
