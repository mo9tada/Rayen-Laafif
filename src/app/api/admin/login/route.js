import { NextResponse } from 'next/server';
import { SESSION_COOKIE, createSessionToken, verifyPassword } from '@/lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_TTL_SECONDS = 60 * 60 * 8;

// Throttle guessing. In-memory, so it resets on redeploy and is per-instance;
// enough to blunt a script against a single box, not a substitute for a WAF.
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map();

function clientKey(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return (forwarded ? forwarded.split(',')[0] : null)?.trim() || 'unknown';
}

function rateLimited(key) {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  record.count += 1;
  return record.count > MAX_ATTEMPTS;
}

export async function POST(request) {
  const credential = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!credential || !secret) {
    console.error('[admin] ADMIN_PASSWORD_HASH or ADMIN_SESSION_SECRET is not set');
    return NextResponse.json({ error: 'Admin login is not configured.' }, { status: 503 });
  }

  if (rateLimited(clientKey(request))) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in a few minutes.' },
      { status: 429 }
    );
  }

  let password;
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!(await verifyPassword(password, credential))) {
    // Deliberately vague: nothing here distinguishes a bad password from an
    // unknown account, because there are no accounts.
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(secret, SESSION_TTL_SECONDS), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
