/**
 * Generates the two environment values the admin area needs.
 *
 * Usage:  node scripts/set-admin-password.mjs "your password here"
 *
 * The password itself is never written anywhere. Copy the printed lines into
 * .env.local (or your host's environment settings) and restart the server.
 */

import { derivePasswordHash, formatCredential } from '../src/lib/auth.js';

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/set-admin-password.mjs "your password"');
  process.exit(1);
}

// Length is your call. A short password still gets the full PBKDF2 treatment,
// but it is the one part of this setup that brute force can actually reach.
if (password.length < 12) {
  console.warn(`Note: ${password.length} characters. Short passwords are the weak link here.
`);
}

const toHex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
const hash = await derivePasswordHash(password, salt);
const sessionSecret = toHex(crypto.getRandomValues(new Uint8Array(32)));

console.log('\nAdd these to .env.local:\n');
console.log(`ADMIN_PASSWORD_HASH=${formatCredential(salt, hash)}`);
console.log(`ADMIN_SESSION_SECRET=${sessionSecret}`);
console.log('\nRotating ADMIN_SESSION_SECRET signs out every existing session.\n');
