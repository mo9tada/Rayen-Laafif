import AboutContent from './about-content.js';
import { readSkills } from '@/lib/store.js';

// Skills are editable in the dashboard, so this page must reflect saved edits.
export const dynamic = 'force-dynamic';

export default async function About() {
  const skills = await readSkills();

  return <AboutContent skills={skills} />;
}
