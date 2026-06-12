import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/server/backend';

/**
 * FAZA A2 — himoyalangan route'lar uchun yengil cookie gate.
 *
 * Telegram auth client'da boshlanadi (initData faqat brauzerda mavjud), shu sabab
 * customer sahifalari bloklanmaydi — ular auth bootstrap'ni o'zi boshqaradi.
 * Faqat aniq rol-panellari (/admin, /courier) cookie bo'lmasa bosh sahifaga
 * yo'naltiriladi. To'liq rol tekshiruvi backend + RoleGuard'da bo'ladi (keyingi fazalar).
 */
const PROTECTED_PREFIXES = ['/admin', '/courier'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // _next, statik fayllar va API route'larni chetlab o'tamiz.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
