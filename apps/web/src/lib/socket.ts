'use client';

import { io, type Socket } from 'socket.io-client';

/**
 * Singleton Socket.io client.
 * - Auto-resolves URL from NEXT_PUBLIC_SOCKET_URL (defaults to same-origin /socket).
 * - JWT goes in handshake (httpOnly cookie sent by browser; gateway reads it).
 * - Reconnect with exponential backoff.
 * - First-connect AND reconnect fire `connect` — caller may pass `since` to REST
 *   catch-up missed events.
 */

let socket: Socket | null = null;
let pendingConnect = false;

export interface SocketConfig {
  url?: string;
}

const defaultUrl = (): string => {
  if (typeof window === 'undefined') return '';
  const env = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (env) return env;
  // Same-origin /socket — gateway can be mounted at /socket.io with the same host
  return window.location.origin;
};

/**
 * Gateway boshqa originда (turonkafe.duckdns.org) → httpOnly `turon_token`
 * cookie cross-origin YUBORILMAYDI. Shuning uchun qisqa muddatli token'ni
 * backend'dan (proxy orqali, cookie→server-side) olib, handshake.auth.token'da
 * uzatamiz. `auth` CALLBACK har (re)connect'da chaqiriladi → token doim yangi.
 */
async function fetchSocketToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/users/me/socket-token', { credentials: 'same-origin' });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string };
    return typeof data?.token === 'string' ? data.token : null;
  } catch {
    return null;
  }
}

export function getSocket(cfg?: SocketConfig): Socket {
  if (socket) return socket;
  if (pendingConnect && socket) return socket;

  const url = cfg?.url ?? defaultUrl();
  pendingConnect = true;

  socket = io(url, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 15_000,
    randomizationFactor: 0.5,
    timeout: 10_000,
    // Har (re)connect'da yangi qisqa-muddatli token (cross-origin auth)
    auth: (cb: (data: { token?: string }) => void) => {
      void fetchSocketToken().then((token) => cb(token ? { token } : {})).catch(() => cb({}));
    },
  });

  socket.on('connect', () => {
    pendingConnect = false;
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      // Server explicitly disconnected — try manual reconnect
      socket?.connect();
    }
  });

  return socket;
}

export function closeSocket(): void {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
