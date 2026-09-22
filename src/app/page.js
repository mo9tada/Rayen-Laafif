import Portfolio from './portfolio.js';
import { getVideos } from '@/lib/videos.js';

// Re-read the Drive folder at most once a minute, so a video added to or deleted
// from the folder appears or disappears on the site without a redeploy.
// Next requires a literal here; keep it in step with DRIVE_REVALIDATE_SECONDS.
export const revalidate = 60;

export default async function Home() {
  const { videos, error } = await getVideos();

  return <Portfolio videos={videos} error={error} />;
}
