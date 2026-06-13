import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, AUTH_COOKIE, buildForwardHeaders } from '@/lib/server/backend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Universal proxy: barcha /api/* so'rovlarni eski Fastify backendga uzatadi.
 * - httpOnly cookie'dagi JWT'ni Authorization: Bearer'ga aylantiradi
 * - Body'ni buffered tarzda forward qiladi (stream emas — barqarorroq)
 * - Idempotency-Key kabi maxsus headerlarni saqlaydi
 * - Backend timeout'ida 504, ulanmasa 502 — ikkalasi ham JSON, mijozda "Load failed" o'rniga aniq xato chiqadi
 */
async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const search = req.nextUrl.search;
  const target = `${BACKEND_URL}/${path.join('/')}${search}`;

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const headers = buildForwardHeaders(req.headers, token);

  // Eski miniapp idempotency uchun ishlatadigan custom header — saqlanadi
  const idemKey = req.headers.get('idempotency-key');
  if (idemKey) headers.set('idempotency-key', idemKey);

  // Body'ni oldindan o'qib olamiz — stream re-use muammosini chetlab o'tish
  let body: ArrayBuffer | undefined;
  if (hasBody) {
    try {
      body = await req.arrayBuffer();
    } catch {
      return NextResponse.json({ error: "So'rov tanasini o'qib bo'lmadi" }, { status: 400 });
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
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

  // Tana to'liq buffered → barqaror, hech qanday stream cut-off bo'lmaydi
  const buf = await upstream.arrayBuffer();
  const resHeaders = new Headers();
  const contentType = upstream.headers.get('content-type');
  if (contentType) resHeaders.set('content-type', contentType);

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
