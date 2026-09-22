/**
 * Streams a Drive video through this server.
 *
 * Why proxy at all: Drive's /preview embed is a cross-origin iframe, so the
 * page cannot start, stop, or even observe playback. Serving the bytes from
 * our own origin means the page can use a plain <video> element and control it
 * directly, which is what makes tap-to-play work on every phone.
 *
 * Range requests are forwarded verbatim. Without that, mobile Safari refuses to
 * play at all: it opens with a range request before it will commit to a source.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ID_PATTERN = /^[a-zA-Z0-9_-]{10,}$/;

/** Where to pull the bytes from, preferring the documented API when keyed. */
function sourceUrl(id) {
  const key = process.env.GOOGLE_DRIVE_API_KEY;
  if (key) {
    const params = new URLSearchParams({ alt: 'media', key, supportsAllDrives: 'true' });
    return `https://www.googleapis.com/drive/v3/files/${id}?${params}`;
  }
  // Keyless fallback. Works for link-shared files, but Drive may answer with an
  // interstitial for very large ones, which is one more reason to set a key.
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

export async function GET(request, { params }) {
  const { id } = await params;

  if (!ID_PATTERN.test(id || '')) {
    return new Response('Bad video id', { status: 400 });
  }

  const range = request.headers.get('range');

  let upstream;
  try {
    upstream = await fetch(sourceUrl(id), {
      headers: range ? { Range: range } : {},
      redirect: 'follow',
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[video] upstream fetch failed', id, error);
    return new Response('Upstream unavailable', { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    console.error('[video] upstream status', upstream.status, 'for', id);
    return new Response('Video unavailable', { status: upstream.status === 404 ? 404 : 502 });
  }

  const contentType = upstream.headers.get('content-type') || '';
  // The keyless endpoint answers with HTML when it wants a confirmation click.
  if (contentType.includes('text/html')) {
    return new Response('Video not directly streamable', { status: 409 });
  }

  const headers = new Headers({
    'Content-Type': contentType || 'video/mp4',
    'Accept-Ranges': 'bytes',
    // Immutable in practice: a Drive file id always names the same bytes.
    'Cache-Control': 'public, max-age=3600',
  });

  for (const header of ['content-length', 'content-range', 'etag', 'last-modified']) {
    const value = upstream.headers.get(header);
    if (value) headers.set(header, value);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
