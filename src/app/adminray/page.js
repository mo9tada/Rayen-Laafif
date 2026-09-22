import { getVideos } from '@/lib/videos.js';
import { readSkills } from '@/lib/store.js';
import AdminDashboard from './dashboard.js';

// Always read current data; this page is behind auth and must not be cached.
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [{ videos, error }, skills] = await Promise.all([getVideos(), readSkills()]);

  return <AdminDashboard videos={videos} skills={skills} error={error} />;
}
