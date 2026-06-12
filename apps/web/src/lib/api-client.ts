/**
 * FAZA A2 — client-side API client.
 * Barcha so'rovlar same-origin `/api/*` orqali ketadi (cookie avtomatik yuboriladi),
 * Next route handler ularni backendga Bearer bilan uzatadi.
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = path.startsWith('/api/') ? path : `/api/${path.replace(/^\//, '')}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers || {}),
    },
    credentials: 'same-origin',
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (payload && (payload.error || payload.message)) ||
      `Server xatosi (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return payload as T;
}
