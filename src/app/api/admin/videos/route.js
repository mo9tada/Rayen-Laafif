import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { writeEntry } from '@/lib/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Saves the title and description for one video.
 * Reaching this handler means middleware already validated the session.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { id, title, description } = body || {};
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'A video id is required.' }, { status: 400 });
  }

  try {
    const saved = await writeEntry(id, { title, description });

    // Drop the cached listing and detail page so the edit is visible at once
    // instead of after the next revalidation window.
    revalidatePath('/');
    revalidatePath(`/work/${id}`);

    return NextResponse.json({ ok: true, entry: saved });
  } catch (error) {
    console.error('[admin] Failed to save entry', error);
    return NextResponse.json(
      { error: 'Could not save. The server may not have a writable data directory.' },
      { status: 500 }
    );
  }
}
