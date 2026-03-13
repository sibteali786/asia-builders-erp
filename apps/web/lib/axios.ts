import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

// / --- Request Interceptor ---
// Runs BEFORE every request is sent.
// Reads the token from Zustand and attaches it as a Bearer token.
// This way no component ever manually adds Authorization headers.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response Interceptor ---
// Runs AFTER every response comes back.
// On 401 (token expired or invalid): clears auth state + redirects to login.
apiClient.interceptors.response.use(
  (response) => response, // Pass through successful responses untouched

  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      // Hard redirect — clears all React state cleanly
      window.location.href = "/login";
    }

    // Re-throw so React Query can catch it and surface the error
    return Promise.reject(error);
  },
);

export default apiClient;
