// lib/api.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.error("EXPO_PUBLIC_API_URL is not defined!");
}

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper to set/remove Authorization header
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// Flag to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue: any[] = [];

// Helper to resolve/reject queued requests
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// RESPONSE interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired and request wasn’t retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait until refresh finishes
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const { data } = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken }
        );

        const newAccessToken = data.accessToken;

        // Save new access token
        await SecureStore.setItemAsync("accessToken", newAccessToken);

        // Update axios headers
        setAuthToken(newAccessToken);

        processQueue(null, newAccessToken);

        // Retry original request with new token
        originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);

        // Optional: clear tokens and force logout
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        setAuthToken(null);

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    return Promise.reject(error);
  }
);

// REQUEST interceptor (kept clean)
api.interceptors.request.use(
  (config) => {
    // The token will be set via setAuthToken
    return config;
  },
  (error) => Promise.reject(error)
);
