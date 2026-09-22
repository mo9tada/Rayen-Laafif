import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth.js';

/**
 * Gate for the admin area.
 *
 * The dashboard, and every admin API route that mutates data, require a valid
 * signed session cookie. The login page and the login endpoint are exempt,
 * otherwise there would be no way to obtain one.
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === '/adminray/login';
  const isLoginApi = pathname === '/api/admin/login';
  if (isLoginPage || isLoginApi) return NextResponse.next();

  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authorized = Boolean(secret) && (await verifySessionToken(secret, token));

  if (authorized) return NextResponse.next();

  // APIs get a status they can act on; humans get redirected to the form.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const loginUrl = new URL('/adminray/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/adminray/:path*', '/api/admin/:path*'],
};
