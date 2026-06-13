import jwt from 'jsonwebtoken';
import { parse as parseCookie } from 'cookie';
import type { Socket } from 'socket.io';
import { env } from './config.js';

export type AppRole = 'CUSTOMER' | 'COURIER' | 'ADMIN';

export interface SocketIdentity {
  userId: string;
  role: AppRole;
}

/**
 * Extract token from: handshake.auth.token > cookie > query.token.
 * Returns null if no token is present.
 */
function extractToken(socket: Socket): string | null {
  const fromAuth = (socket.handshake.auth as { token?: string } | undefined)?.token;
  if (typeof fromAuth === 'string' && fromAuth.trim()) return fromAuth.trim();

  const cookieHeader = socket.handshake.headers.cookie;
  if (cookieHeader) {
    const cookies = parseCookie(cookieHeader);
    const tok = cookies[env.AUTH_COOKIE_NAME];
    if (tok) return tok;
  }

  const fromQuery = socket.handshake.query?.token;
  if (typeof fromQuery === 'string' && fromQuery.trim()) return fromQuery.trim();

  return null;
}

export function verifyHandshake(socket: Socket): SocketIdentity | null {
  const token = extractToken(socket);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { id?: string; role?: AppRole };
    if (!payload?.id || !payload?.role) return null;
    return { userId: payload.id, role: payload.role };
  } catch {
    return null;
  }
}

/**
 * Room naming convention:
 *  - user:<userId>            — direct messages to a specific user
 *  - role:COURIER             — broadcast to all couriers
 *  - role:ADMIN               — broadcast to all admins
 *  - order:<orderId>          — both customer + assigned courier + admin
 */
export const Rooms = {
  user: (userId: string) => `user:${userId}`,
  role: (role: AppRole) => `role:${role}`,
  order: (orderId: string) => `order:${orderId}`,
};
