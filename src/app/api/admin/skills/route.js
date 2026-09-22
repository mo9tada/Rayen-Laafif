import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { writeSkills } from '@/lib/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Replaces the whole skill list.
 * Reaching this handler means middleware already validated the session.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!Array.isArray(body?.skills)) {
    return NextResponse.json({ error: 'Expected a list of skills.' }, { status: 400 });
  }

  try {
    const saved = await writeSkills(body.skills);
    revalidatePath('/about');
    return NextResponse.json({ ok: true, skills: saved });
  } catch (error) {
    console.error('[admin] Failed to save skills', error);
    return NextResponse.json(
      { error: 'Could not save. The server may not have a writable data directory.' },
      { status: 500 }
    );
  }
}
