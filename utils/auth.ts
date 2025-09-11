// utils/auth.ts
import * as SecureStore from "expo-secure-store";
import { setAuthToken } from "../lib/api";

export type User = {
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
  organizationId: string;
};

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

/**
 * Handles successful login by storing tokens and user data securely
 * @param loginData - The login response containing user and tokens
 * @returns Promise<void>
 */
export const handleSuccessfulLogin = async (loginData: LoginResponse): Promise<void> => {
  try {
    // Store tokens securely
    await SecureStore.setItemAsync("accessToken", loginData.accessToken);
    if (loginData.refreshToken) {
      await SecureStore.setItemAsync("refreshToken", loginData.refreshToken);
    }
    
    // Store user data securely
    await SecureStore.setItemAsync("user", JSON.stringify(loginData.user));
    
    // Set auth token for API calls
    setAuthToken(loginData.accessToken);
    
    console.log("Login data stored successfully");
  } catch (error) {
    console.error("Failed to store login data:", error);
    throw new Error("Failed to store login data");
  }
};

/**
 * Clears all stored authentication data
 * @returns Promise<void>
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("user");
    setAuthToken(null);
    console.log("Auth data cleared successfully");
  } catch (error) {
    console.error("Failed to clear auth data:", error);
    throw new Error("Failed to clear auth data");
  }
};

/**
 * Retrieves stored user data
 * @returns Promise<User | null>
 */
export const getStoredUser = async (): Promise<User | null> => {
  try {
    const userStr = await SecureStore.getItemAsync("user");
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch (error) {
    console.error("Failed to retrieve stored user:", error);
    return null;
  }
};

/**
 * Retrieves stored access token
 * @returns Promise<string | null>
 */
export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync("accessToken");
  } catch (error) {
    console.error("Failed to retrieve stored token:", error);
    return null;
  }
};
