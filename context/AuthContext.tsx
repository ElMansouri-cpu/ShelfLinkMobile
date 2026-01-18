import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import * as SecureStore from "expo-secure-store"
import { setAuthToken } from "../lib/api"
import { User, handleSuccessfulLogin, clearAuthData } from "../utils/auth"
import React from 'react'

type AuthContextType = {
  user: User | null
  setUser: (user: User | null) => void
  updateUser: (userData: Partial<User>) => Promise<void>
  loading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
  login: (user: User, accessToken: string, refreshToken?: string) => Promise<void>
  setAuthToken: (token: string | null) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore tokens & fetch user on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("Initializing auth...")
        
        const token = await SecureStore.getItemAsync("accessToken")
        const userStr = await SecureStore.getItemAsync("user")
        
        console.log("Token exists:", !!token)
        console.log("User data exists:", !!userStr)
        
        if (token && userStr) {
          try {
            const userData = JSON.parse(userStr)
            console.log("Restoring user:", userData.id)
            setAuthToken(token)
            setUser(userData)
          } catch (err) {
            console.error("Failed to parse user data:", err)
            // Clear corrupted data
            await SecureStore.deleteItemAsync("user")
            await SecureStore.deleteItemAsync("accessToken")
            setUser(null)
            setAuthToken(null)
          }
        } else {
          console.log("No token or user data found - user not authenticated")
          setUser(null)
          setAuthToken(null)
        }
      } catch (err) {
        console.error("Failed to restore session:", err)
        setUser(null)
        setAuthToken(null)
      } finally {
        console.log("Auth initialization complete")
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  // Login method
  const login = useCallback(async (userData: User, accessToken: string, refreshToken?: string) => {
    try {
      await handleSuccessfulLogin({ user: userData, accessToken, refreshToken })
      setUser(userData)
      console.log("Login successful, user set in context")
    } catch (error) {
      console.error("Failed to login:", error)
      throw error
    }
  }, [])

  // Logout method
  const logout = useCallback(async () => {
    console.log("Logging out...")
    await clearAuthData()
    setUser(null)
    console.log("Logout complete")
  }, [])

  const setUserWithLogging = useCallback((userData: User | null) => {
    console.log("Setting user:", userData)
    setUser(userData)
  }, [])

  // Update user data and persist to SecureStore
  const updateUser = useCallback(async (userData: Partial<User>) => {
    if (!user) {
      console.error("Cannot update user: no current user")
      return
    }

    try {
      const updatedUser = { ...user, ...userData }
      console.log("AuthContext - Updating user from:", user)
      console.log("AuthContext - Updating user with data:", userData)
      console.log("AuthContext - Updated user result:", updatedUser)
      
      setUser(updatedUser)
      
      // Persist the updated user data to SecureStore
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser))
      console.log("AuthContext - User updated and persisted to SecureStore")
    } catch (error) {
      console.error("Failed to update user:", error)
      throw error
    }
  }, [user])

  const value: AuthContextType = {
    user,
    setUser: setUserWithLogging,
    updateUser,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    setAuthToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
