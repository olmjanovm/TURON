import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Determine API base URL (can be env-driven)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor for Auth Token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor for Error Handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Transform system errors into human-readable Uzbek messages
    const message = error.response?.data?.message || 'Tizim xatosi. Iltimos birozdan so\'ng urunib ko\'ring.';
    return Promise.reject(new Error(message));
  }
);
