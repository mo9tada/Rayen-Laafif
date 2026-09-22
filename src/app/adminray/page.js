import { getVideos } from '@/lib/videos.js';
import AdminDashboard from './dashboard.js';

// Always read current data; this page is behind auth and must not be cached.
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const { videos, error } = await getVideos();
  return <AdminDashboard videos={videos} error={error} />;
}
