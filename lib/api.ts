// lib/api.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Function to set the auth token
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

// Remove the interceptor that was using the hook
api.interceptors.request.use(
  (config) => {
    // The token will be set via setAuthToken function
    return config
  },
  (error) => Promise.reject(error)
)
