// lib/api.ts
import axios from 'axios'

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.error('EXPO_PUBLIC_API_URL is not defined!');
}

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

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Remove the interceptor that was using the hook
api.interceptors.request.use(
  (config) => {
    // The token will be set via setAuthToken function
    return config
  },
  (error) => Promise.reject(error)
)
