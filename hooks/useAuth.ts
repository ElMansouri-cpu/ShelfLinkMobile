// hooks/useAuth.ts
import { useEffect, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import {  setAuthToken } from "../lib/api";

type User = {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string | null;
  isOnboarded: boolean;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  role: string;
  status: string;
  phoneVerifiedAt: string | null;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  // extend with your fields
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore tokens & fetch user on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        const userStr = await SecureStore.getItemAsync("user");
        
        
        if (token && userStr) {
          try {
            const userData = JSON.parse(userStr);
            setAuthToken(token);
            setUser(userData);
          } catch (err) {
            console.error("Failed to parse user data:", err);
            // Don't call logout here as it might cause infinite loop
            setUser(null);
            setAuthToken(null);
          }
        } else {
          console.log("No token or user data found")
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
        // Don't call logout here as it might cause infinite loop
        setUser(null);
        setAuthToken(null);
      } finally {
        console.log("Setting loading to false")
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login method


  // Logout method
  const logout = useCallback(async () => {
    console.log("Logging out...")
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("user");
    setAuthToken(null);
    setUser(null);
    console.log("Logout complete")
  }, []);

  const setUserWithLogging = useCallback((userData: User | null) => {
    console.log("Setting user:", userData)
    setUser(userData)
  }, [])

  return {
    loading, // true while checking storage / fetching user
    isAuthenticated: !!user,
    user,
    logout,
    setAuthToken,
    setUser: setUserWithLogging,
  };
};
