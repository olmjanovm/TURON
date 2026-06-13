/**
 * Client-side API client.
 * - Barcha so'rovlar same-origin `/api/*` orqali ketadi (cookie avtomatik)
 * - JSON body, JSON response (default)
 * - Tarmoq xatosini (TypeError) human-readable o'zbek xabariga aylantiradi
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const DEFAULT_TIMEOUT_MS = 30_000;

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = path.startsWith('/api/') ? path : `/api/${path.replace(/^\//, '')}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  // Content-Type faqat BODY mavjud bo'lsa qo'yiladi.
  // Aks holda Fastify (Zod schema) bo'sh JSON tanasini parse qila olmay 400 qaytaradi.
  const hasBody = init?.body != null;
  const baseHeaders: Record<string, string> = hasBody ? { 'content-type': 'application/json' } : {};

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        ...baseHeaders,
        ...(init?.headers || {}),
      },
      credentials: 'same-origin',
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const aborted = err instanceof Error && err.name === 'AbortError';
    if (aborted) {
      throw new ApiError("So'rov vaqti tugadi. Internetni tekshiring.", 504);
    }
    // Safari/iOS "Load failed", Chrome "Failed to fetch" — barcha tarmoq xatolari
    throw new ApiError("Tarmoq xatosi. Internetni tekshirib qayta urining.", 0);
  }
  clearTimeout(timer);

  const ct = res.headers.get('content-type') ?? '';
  const isJson = ct.includes('application/json');
  let payload: unknown = null;

  if (isJson) {
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
  } else if (!res.ok) {
    // Backend HTML yoki text qaytarsa — matnli xabarni ushlab olamiz
    try {
      const text = await res.text();
      if (text) payload = { error: text.slice(0, 200) };
    } catch {
      /* swallow */
    }
  }

  if (!res.ok) {
    const obj = payload as { error?: string; message?: string } | null;
    const message =
      (obj && (obj.error || obj.message)) ||
      `Server xatosi (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return payload as T;
}
