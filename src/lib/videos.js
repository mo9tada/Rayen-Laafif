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
