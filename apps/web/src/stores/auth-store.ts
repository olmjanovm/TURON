import { create } from 'zustand';
import type { UserRoleEnum } from '@turon/shared';

export interface AuthUser {
  id: string;
  telegramId: string;
  telegramUsername?: string | null;
  fullName: string;
  phoneNumber?: string | null;
  role: UserRoleEnum;
  language: string;
}

export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'error';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  setUser: (user: AuthUser) => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

/**
 * FAZA A2 — auth holati (faqat user profili xotirada).
 * JWT token httpOnly cookie'da, JS uchun KO'RINMAYDI (XSS xavfsiz),
 * shu sabab bu store'da token saqlanmaydi (eski miniapp'dan farqi).
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  error: null,
  setUser: (user) => set({ user, status: 'authenticated', error: null }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: 'error' }),
  reset: () => set({ user: null, status: 'idle', error: null }),
}));
