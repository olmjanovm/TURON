import { NextRequest, NextResponse } from 'next/server';
import {
  BACKEND_URL,
  AUTH_COOKIE,
  AUTH_COOKIE_MAX_AGE,
} from '@/lib/server/backend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * FAZA A2 — Telegram auth.
 * Client initData yuboradi -> backend signature'ni verify qiladi va JWT qaytaradi.
 * JWT'ni httpOnly cookie'ga yozamiz (XSS'dan himoya). User ma'lumotini qaytaramiz.
 */
export async function POST(req: NextRequest) {
  let initData: string | undefined;
  try {
    const body = await req.json();
    initData = body?.initData;
  } catch {
    return NextResponse.json({ error: "Noto'g'ri so'rov tanasi" }, { status: 400 });
  }

  if (!initData || typeof initData !== 'string') {
    return NextResponse.json({ error: 'initData majburiy' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/auth/telegram`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { error: 'Auth serveriga ulanib bo‘lmadi' },
      { status: 502 },
    );
  }

  const data = await upstream.json().catch(() => null);

  if (!upstream.ok || !data?.token) {
    return NextResponse.json(
      { error: data?.error || 'Telegram autentifikatsiyasi muvaffaqiyatsiz' },
      { status: upstream.status || 401 },
    );
  }

  const res = NextResponse.json({ user: data.user });
  res.cookies.set(AUTH_COOKIE, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
  return res;
}
