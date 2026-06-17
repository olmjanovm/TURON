'use client';

import { useEffect, useRef } from 'react';
import { getSocket } from './socket';

/**
 * Shared real-time chat hook (Socket.io) — used by admin, customer AND courier.
 *
 * Delivery is recipient-targeted by the backend (see order-chat.service): the
 * gateway pushes `chat:message` / `chat:read` only to the participant rooms a
 * user already auto-joined on connect. There is therefore NO room to join here —
 * we simply listen and filter by `chatId`.
 *
 * `chatId` is the order id for order chats, or `support:<threadId>` for support
 * threads. The socket payload carries the same value in `orderId`, so a strict
 * equality match keeps every conversation isolated.
 *
 * Reliability: the hook calls `onReconnect` after a *reconnect* (not the initial
 * connect) so callers can do a one-shot REST catch-up for anything missed while
 * the socket was down. Components should keep a long (~30s) `refetchInterval` as
 * a safety net for when the gateway is unavailable.
 */

export interface ChatSocketMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: 'COURIER' | 'CUSTOMER' | 'ADMIN';
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  /** Only present on ADMIN messages. null/undefined = broadcast to all parties. */
  targetRole?: 'COURIER' | 'CUSTOMER' | null;
}

export interface ChatSocketRead {
  orderId: string;
  /** The role that just read messages (its peers' messages are now read). */
  readerRole: 'COURIER' | 'CUSTOMER' | 'ADMIN';
  readAt: string;
}

export interface ChatSocketHandlers {
  onMessage?: (msg: ChatSocketMessage) => void;
  onRead?: (read: ChatSocketRead) => void;
  /** Fired on socket reconnect (NOT the first connect) — do a REST catch-up. */
  onReconnect?: () => void;
}

/** Minimal shape any chat message cache entry must have for merge helpers. */
export interface MergeableChatMessage {
  id: string;
  senderRole: 'COURIER' | 'CUSTOMER' | 'ADMIN';
  content: string;
  isRead: boolean;
  /** Optimistic-only client state — undefined once confirmed by the server. */
  status?: 'pending' | 'failed';
}

/**
 * Append an incoming socket message to the cached list, deduping:
 *  - skip if the real id is already present (arrived twice / after a refetch),
 *  - replace a matching optimistic temp (the sender's own echo: same content +
 *    role, still `pending`) so we never show the message twice.
 */
export function mergeChatMessage<T extends MergeableChatMessage>(old: T[] | undefined, incoming: T): T[] {
  const list = old ?? [];
  if (list.some((m) => m.id === incoming.id)) return list;
  const tempIdx = list.findIndex(
    (m) => m.status === 'pending' && m.senderRole === incoming.senderRole && m.content === incoming.content,
  );
  if (tempIdx >= 0) {
    const copy = list.slice();
    copy[tempIdx] = incoming;
    return copy;
  }
  return [...list, incoming];
}

/** Mark every message NOT sent by `readerRole` as read (the reader just saw them). */
export function markChatRead<T extends MergeableChatMessage>(
  old: T[] | undefined,
  readerRole: 'COURIER' | 'CUSTOMER' | 'ADMIN',
): T[] {
  const list = old ?? [];
  let changed = false;
  const next = list.map((m) => {
    if (m.senderRole !== readerRole && !m.isRead) {
      changed = true;
      return { ...m, isRead: true };
    }
    return m;
  });
  return changed ? next : list;
}

export function useChatSocket(chatId: string | null | undefined, handlers: ChatSocketHandlers) {
  // Keep handlers in a ref so changing inline callbacks doesn't re-bind sockets.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!chatId) return;
    const socket = getSocket();

    const onMessage = (payload: ChatSocketMessage) => {
      if (payload && payload.orderId === chatId) handlersRef.current.onMessage?.(payload);
    };
    const onRead = (payload: ChatSocketRead) => {
      if (payload && payload.orderId === chatId) handlersRef.current.onRead?.(payload);
    };

    // Already-connected sockets are "armed": their next `connect` is a reconnect.
    // A socket still connecting at mount fires its first `connect` as the initial
    // connection (the query is already fetching) — we don't treat that as a miss.
    let armed = socket.connected;
    const onConnect = () => {
      if (armed) handlersRef.current.onReconnect?.();
      armed = true;
    };

    socket.on('chat:message', onMessage);
    socket.on('chat:read', onRead);
    socket.on('connect', onConnect);

    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:read', onRead);
      socket.off('connect', onConnect);
    };
  }, [chatId]);
}
