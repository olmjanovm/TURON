import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Determine API base URL (can be env-driven)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
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
    const responseData = error.response?.data;
    const validationMessage = Array.isArray(error.response?.data?.issues)
      ? error.response.data.issues.map((issue: { message?: string }) => issue.message).filter(Boolean).join(', ')
      : null;
    const stringPayload =
      typeof responseData === 'string' ? responseData.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : null;
    const fallbackServerMessage = error.response
      ? `Server ${error.response.status} xatosi. Iltimos, qayta urinib ko'ring.`
      : null;
    const message =
      validationMessage ||
      error.response?.data?.message ||
      error.response?.data?.error ||
      stringPayload ||
      (!error.response
        ? "Server bilan aloqa uzildi. Internetni tekshirib yana urinib ko'ring."
        : fallbackServerMessage || 'Tizim xatosi. Iltimos birozdan so\'ng urunib ko\'ring.');
    return Promise.reject(new Error(message));
  }
);
