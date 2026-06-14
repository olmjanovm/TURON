import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, AUTH_COOKIE, buildForwardHeaders } from '@/lib/server/backend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Universal proxy: barcha /api/* so'rovlarni eski Fastify backendga uzatadi.
 * - httpOnly cookie'dagi JWT'ni Authorization: Bearer'ga aylantiradi
 * - Body'ni buffered tarzda forward qiladi (stream emas — barqarorroq)
 * - Idempotency-Key kabi maxsus headerlarni saqlaydi
 * - Backend timeout'ida 504, ulanmasa 502 — ikkalasi ham JSON
 *
 *  KESH STRATEGIYASI (FAZA P1):
 *  • Public GET (menu/*, restaurant/identity, branches/list) →
 *    next.revalidate=60 + Cache-Control: public, max-age=60, swr=300
 *    Edge/CDN/proxy/brauzer keshlaydi, backendga ~1/60s
 *  • Auth'd yoki mutation → cache:'no-store' + Cache-Control: private, no-store
 *    Boshqa foydalanuvchining ma'lumoti hech qachon keshlanmaydi
 */

const PUBLIC_GET_PATTERNS: RegExp[] = [
  /^menu(\/|$)/,
  /^restaurant\/identity$/,
];

function isPublicGet(method: string, path: string): boolean {
  if (method !== 'GET') return false;
  return PUBLIC_GET_PATTERNS.some((re) => re.test(path));
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const pathStr = path.join('/');
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const search = req.nextUrl.search;
  const target = `${BACKEND_URL}/${pathStr}${search}`;

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const headers = buildForwardHeaders(req.headers, token);

  const idemKey = req.headers.get('idempotency-key');
  if (idemKey) headers.set('idempotency-key', idemKey);

  let body: ArrayBuffer | undefined;
  if (hasBody) {
    try {
      body = await req.arrayBuffer();
    } catch {
      return NextResponse.json({ error: "So'rov tanasini o'qib bo'lmadi" }, { status: 400 });
    }
  }

  // Kesh siyosatini PUBLIC GET / authed-yoki-mutation bo'lishiga qarab tanlash
  //
  //  Public GET: search bo'lsa ham (?lang=uz) bir xil URL → cache key shu URL.
  //  Authorization header bormi yoki yo'qmi farqi yo'q — backend public
  //  endpoint sifatida bir xil javob qaytaradi.
  //
  //  Auth'd: 'no-store' shart. Token har xil bo'lsa, har xil javob.
  //  Bu yerda biz hatto Authorization bo'lsa ham public path uchun cache
  //  ishlatamiz — backend uni e'tiborsiz qoldiradi (publik endpoint).
  const cacheable = isPublicGet(req.method, pathStr);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      ...(cacheable
        ? { next: { revalidate: 60, tags: ['proxy:public'] } }
        : { cache: 'no-store' }),
      redirect: 'manual',
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const aborted = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { error: aborted ? "Backend javob bermadi (timeout)" : "Backend bilan aloqa uzildi. Qayta urinib ko'ring." },
      { status: aborted ? 504 : 502 },
    );
  }
  clearTimeout(timer);

  const buf = await upstream.arrayBuffer();
  const resHeaders = new Headers();
  const contentType = upstream.headers.get('content-type');
  if (contentType) resHeaders.set('content-type', contentType);

  if (cacheable && upstream.ok) {
    // CDN/Vercel Edge va brauzer keshi uchun aniq direktivalar
    resHeaders.set('cache-control', 'public, max-age=60, stale-while-revalidate=300');
  } else {
    // Auth'd/mutation — keshlamaslik kafolati
    resHeaders.set('cache-control', 'private, no-store, max-age=0');
  }

  return new NextResponse(buf, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
