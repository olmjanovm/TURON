/**
 * FAZA A2 — Server tomonda eski Fastify backendga ulanish.
 * Bu fayl FAQAT server (route handlers / middleware) tomonidan import qilinadi.
 */

export const BACKEND_URL = (
  process.env.BACKEND_API_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  'https://turonkafe.duckdns.org'
).replace(/\/$/, '');

/** Auth JWT saqlanadigan httpOnly cookie nomi. */
export const AUTH_COOKIE = 'turon_token';

/** Cookie umri (sekund) — 30 kun. */
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** Backendga so'rov yuborishda olib o'tiladigan (hop-by-hop bo'lmagan) sarlavhalar. */
const FORWARD_REQUEST_HEADERS = ['content-type', 'accept', 'accept-language'];

/**
 * Haqiqiy klient IP'sini backendga uzatamiz. Aks holda backend FAQAT Vercel
 * egress IP'sini ko'radi → rate-limit hamma foydalanuvchini bitta bucket'ga
 * yig'adi (429 "Yuborilmadi"). Vercel ushbu header'larni ishonchli o'rnatadi;
 * backend `trustProxy` bilan ulardan IP oladi.
 */
const CLIENT_IP_HEADERS = ['x-forwarded-for', 'x-real-ip', 'x-vercel-forwarded-for'];

export function buildForwardHeaders(incoming: Headers, token?: string | null): Headers {
  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = incoming.get(name);
    if (value) headers.set(name, value);
  }
  for (const name of CLIENT_IP_HEADERS) {
    const value = incoming.get(name);
    if (value) headers.set(name, value);
  }
  if (token) headers.set('authorization', `Bearer ${token}`);
  return headers;
}
