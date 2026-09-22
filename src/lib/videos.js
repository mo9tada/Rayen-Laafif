/**
 * The site's read model: Drive supplies which videos exist, the store supplies
 * the text written in the admin dashboard.
 */

import { listDriveVideos } from '@/lib/drive.js';
import { readEntries, applyEntries } from '@/lib/store.js';

/** Every video in the folder, with admin text merged in. */
export async function getVideos() {
  const { videos, error } = await listDriveVideos();
  const entries = await readEntries();
  return { videos: applyEntries(videos, entries), error };
}

/** One video by Drive file id, or null when it is no longer in the folder. */
export async function getVideo(id) {
  const { videos } = await getVideos();
  return videos.find((video) => video.id === id) || null;
}

/**
 * Other videos to suggest alongside `id`.
 *
 * Deliberately deterministic: it takes the entries that follow the current one
 * and wraps around the end. Every video therefore gets a different set, the
 * result is stable across builds (these pages are statically generated), and
 * no video suggests itself.
 */
export async function getRelatedVideos(id, limit = 3) {
  const { videos } = await getVideos();
  const index = videos.findIndex((video) => video.id === id);
  if (index === -1) return [];

  const others = [];
  for (let step = 1; step < videos.length && others.length < limit; step += 1) {
    others.push(videos[(index + step) % videos.length]);
  }
  return others;
}
