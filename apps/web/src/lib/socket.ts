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
