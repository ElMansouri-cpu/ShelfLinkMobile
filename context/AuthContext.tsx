import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import * as SecureStore from "expo-secure-store"
import { setAuthToken } from "../lib/api"
import { User, handleSuccessfulLogin, clearAuthData } from "../utils/auth"
import React from 'react'

type AuthContextType = {
  user: User | null
  setUser: (user: User | null) => void
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
        const token = await SecureStore.getItemAsync("accessToken")
        const userStr = await SecureStore.getItemAsync("user")
        
        if (token && userStr) {
          try {
            const userData = JSON.parse(userStr)
            setAuthToken(token)
            setUser(userData)
          } catch (err) {
            console.error("Failed to parse user data:", err)
            setUser(null)
            setAuthToken(null)
          }
        } else {
          console.log("No token or user data found")
        }
      } catch (err) {
        console.error("Failed to restore session:", err)
        setUser(null)
        setAuthToken(null)
      } finally {
        console.log("Setting loading to false")
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

  const value: AuthContextType = {
    user,
    setUser: setUserWithLogging,
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
