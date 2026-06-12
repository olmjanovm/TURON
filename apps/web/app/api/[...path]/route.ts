import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, AUTH_COOKIE, buildForwardHeaders } from '@/lib/server/backend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * FAZA A2 — universal proxy: barcha /api/* so'rovlarni eski Fastify backendga
 * uzatadi. httpOnly cookie'dagi JWT'ni `Authorization: Bearer`ga aylantiradi,
 * shu sabab client'da token JS uchun ko'rinmaydi (XSS xavfsiz).
 *
 * /api/auth/telegram va /api/auth/logout aniq route'lar bu catch-all'dan
 * ustun turadi, shuning uchun ular bu yerga tushmaydi.
 */
async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const search = req.nextUrl.search;
  const target = `${BACKEND_URL}/${path.join('/')}${search}`;

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const headers = buildForwardHeaders(req.headers, token);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    return NextResponse.json(
      { error: 'Backend bilan aloqa uzildi. Qayta urinib ko‘ring.' },
      { status: 502 },
    );
  }

  const resHeaders = new Headers();
  const contentType = upstream.headers.get('content-type');
  if (contentType) resHeaders.set('content-type', contentType);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
