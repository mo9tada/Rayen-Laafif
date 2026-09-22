/**
 * Persistence for the per-video text the admin writes.
 *
 * Backed by a JSON file so the site needs no database. That works on any host
 * with a writable disk (VPS, Docker volume, `next start` on a box you own).
 *
 * It does NOT survive on serverless platforms such as Vercel, where the
 * filesystem is read-only and every request may hit a fresh container. If you
 * deploy there, keep this module's exported functions and swap the body for a
 * real store (Vercel KV, Postgres, Redis); nothing else in the app needs to
 * change, because everything goes through readEntries/writeEntry.
 */

import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = process.env.ADMIN_DATA_FILE
  ? path.resolve(process.env.ADMIN_DATA_FILE)
  : path.join(process.cwd(), 'data', 'videos.json');

/** Shape of one stored record. Unknown keys are dropped on write. */
function normalize(entry = {}) {
  return {
    title: typeof entry.title === 'string' ? entry.title.slice(0, 200) : '',
    description: typeof entry.description === 'string' ? entry.description.slice(0, 5000) : '',
    updatedAt: entry.updatedAt || null,
  };
}

/** Reads every record, keyed by Drive file id. Missing file means no records. */
export async function readEntries() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out = {};
    for (const [id, entry] of Object.entries(parsed)) out[id] = normalize(entry);
    return out;
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    console.error('[store] Could not read', DATA_FILE, error);
    return {};
  }
}

/**
 * Writes one record. Reads-modifies-writes the whole file, which is fine at
 * this scale (a handful of videos, one admin) but is not safe for concurrent
 * writers; a real store would replace this wholesale.
 */
export async function writeEntry(id, entry) {
  if (!id || typeof id !== 'string') throw new Error('A video id is required');

  const entries = await readEntries();
  entries[id] = { ...normalize(entry), updatedAt: new Date().toISOString() };

  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  // Write to a temp file then rename, so a crash mid-write cannot truncate the
  // existing data.
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(entries, null, 2), 'utf8');
  await fs.rename(tmp, DATA_FILE);

  return entries[id];
}

/** Merges stored text onto a Drive listing. Stored title wins when set. */
export function applyEntries(videos, entries) {
  return videos.map((video) => {
    const entry = entries[video.id];
    if (!entry) return { ...video, description: '' };
    return {
      ...video,
      title: entry.title?.trim() ? entry.title : video.title,
      description: entry.description || '',
    };
  });
}
