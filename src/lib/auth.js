/**
 * Admin authentication: password verification and signed session cookies.
 *
 * Everything here uses Web Crypto rather than node:crypto so the same helpers
 * run in middleware (Edge runtime) and in route handlers (Node runtime).
 *
 * The password is never stored. What lives in the environment is a PBKDF2
 * digest plus its salt, produced by `npm run set-admin-password`.
 */

export const SESSION_COOKIE = 'ray_admin';
const PBKDF2_ITERATIONS = 210000; // OWASP guidance for PBKDF2-HMAC-SHA256
const KEY_BITS = 256;

const encoder = new TextEncoder();

/* ------------------------------------------------------------------ bytes */

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function base64url(bytes) {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Compares two strings in time independent of where they first differ. */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/* --------------------------------------------------------------- password */

/** Derives the PBKDF2 digest of `password` under `salt` (hex in, hex out). */
export async function derivePasswordHash(password, saltHex, iterations = PBKDF2_ITERATIONS) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations },
    key,
    KEY_BITS
  );
  return toHex(bits);
}

/**
 * Formats a credential for ADMIN_PASSWORD_HASH.
 *
 * Fields are colon-separated on purpose. Next runs .env files through
 * dotenv-expand, which reads a dollar sign as a variable reference and would
 * silently truncate the stored hash.
 */
export function formatCredential(saltHex, hashHex, iterations = PBKDF2_ITERATIONS) {
  return `pbkdf2:${iterations}:${saltHex}:${hashHex}`;
}

/**
 * Checks a submitted password against the stored credential.
 * Returns false rather than throwing on a malformed credential.
 */
export async function verifyPassword(password, credential) {
  if (!password || !credential) return false;
  const parts = String(credential).split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;

  const [, iterationsRaw, saltHex, expectedHash] = parts;
  const iterations = Number(iterationsRaw);
  if (!Number.isInteger(iterations) || iterations < 1000) return false;
  if (!/^[0-9a-f]+$/i.test(saltHex) || !/^[0-9a-f]+$/i.test(expectedHash)) return false;

  const actualHash = await derivePasswordHash(password, saltHex, iterations);
  return safeEqual(actualHash, expectedHash);
}

/* ---------------------------------------------------------------- session */

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function sign(secret, payload) {
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(payload));
  return base64url(signature);
}

/**
 * Builds a session token of the form `<expiry>.<hmac>`. There is no user data
 * in it, so the only thing worth forging is the expiry, which the HMAC covers.
 */
export async function createSessionToken(secret, ttlSeconds = 60 * 60 * 8) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const payload = String(expiresAt);
  return `${payload}.${await sign(secret, payload)}`;
}

/** True only for a well-formed, correctly signed, unexpired token. */
export async function verifySessionToken(secret, token) {
  if (!secret || !token || typeof token !== 'string') return false;

  const separator = token.lastIndexOf('.');
  if (separator <= 0) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!/^[0-9]+$/.test(payload)) return false;

  // Verify before trusting the expiry, so an attacker cannot extend a session.
  if (!safeEqual(await sign(secret, payload), signature)) return false;

  return Number(payload) > Date.now();
}