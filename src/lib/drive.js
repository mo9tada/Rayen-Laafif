/**
 * Lists the videos that live in a public Google Drive folder.
 *
 * The folder is the single source of truth: whatever sits in it shows up on the
 * site, and anything removed from it disappears on the next revalidation.
 *
 * Share the folder as "Anyone with the link -> Viewer", otherwise nothing is
 * readable without credentials.
 */

// The Drive folder holding the videos. Paste the share link here, or set
// GOOGLE_DRIVE_FOLDER_URL in .env.local to override it per environment.
export const DRIVE_FOLDER_URL =
  process.env.GOOGLE_DRIVE_FOLDER_URL ||
  '' /* <- paste the folder share link here, e.g. 'https://drive.google.com/drive/folders/1a2b3c...' */;

// How long a fetched listing is cached before Drive is polled again (seconds).
export const DRIVE_REVALIDATE_SECONDS = 60;

/** Pulls the folder id out of a share link, or passes a bare id straight through. */
export function parseFolderId(urlOrId) {
  if (!urlOrId) return null;
  const value = String(urlOrId).trim();
  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]{10,})/, // .../drive/folders/<id>
    /[?&]id=([a-zA-Z0-9_-]{10,})/,     // ...open?id=<id>
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1];
  }
  return /^[a-zA-Z0-9_-]{20,}$/.test(value) ? value : null;
}

/** Drive file id -> the embeddable player URL used by the modal iframe. */
export function driveEmbedUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/** Drive file id -> a poster image that works for publicly shared files. */
export function driveThumbnailUrl(fileId) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

/**
 * Alternate poster host. Google throttles thumbnail requests per referring page
 * and starts answering 429, so the card falls back to this host if the first
 * request fails. Both are served without a referrer (see referrerPolicy below).
 */
export function driveThumbnailFallbackUrl(fileId) {
  return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
}

/** "Break The Pattern (REEL).mp4" -> "Break The Pattern (REEL)" */
function stripExtension(name) {
  return name.replace(/\.[a-z0-9]{2,5}$/i, '');
}

/**
 * A clip counts as a reel when the filename says so, or when Drive reports
 * portrait dimensions. The flag drives the 9:16 modal layout.
 */
function detectReel(name, metadata) {
  if (/\breels?\b/i.test(name)) return true;
  const width = Number(metadata?.width);
  const height = Number(metadata?.height);
  if (width > 0 && height > 0) return height > width;
  return false;
}

function toVideo(file) {
  return {
    year: file.year || null,
    id: file.id,
    title: stripExtension(file.name || 'Untitled'),
    thumb: driveThumbnailUrl(file.id),
    thumbFallback: driveThumbnailFallbackUrl(file.id),
    videoUrl: driveEmbedUrl(file.id),
    isReel: detectReel(file.name || '', file.videoMediaMetadata),
  };
}

/**
 * Preferred path: the Drive REST API. A browser-key API key is enough for a
 * link-shared folder, and the response is stable and documented.
 */
async function listViaApi(folderId, apiKey) {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false and mimeType contains 'video/'`,
    key: apiKey,
    fields: 'files(id,name,mimeType,createdTime,videoMediaMetadata(width,height))',
    orderBy: 'name',
    pageSize: '200',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    next: { revalidate: DRIVE_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Drive API responded ${response.status}: ${await response.text()}`);
  }

  const { files = [] } = await response.json();
  return files.map((file) => toVideo({
    ...file,
    year: file.createdTime ? new Date(file.createdTime).getFullYear() : null,
  }));
}

/**
 * Fallback for when no API key is configured: read the public folder page and
 * pull the file listing out of the payload Drive inlines into it.
 *
 * This is best effort. It needs no credentials, but it leans on markup Google
 * can change at any time, so set GOOGLE_DRIVE_API_KEY for anything important.
 */
async function listViaPublicPage(folderId) {
  const response = await fetch(`https://drive.google.com/drive/folders/${folderId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PortfolioBot/1.0)' },
    next: { revalidate: DRIVE_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Drive folder page responded ${response.status}`);
  }

  const html = await response.text();
  const payload = html.match(/_DRIVE_ivd(?:'\])?\s*=\s*'([^']+)'/);
  if (!payload) {
    throw new Error('Could not find the file listing in the Drive folder page');
  }

  // The payload is hex-escaped JSON, e.g. \x5b\x22fileId\x22...
  const decoded = payload[1].replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  // Each entry looks like ["<fileId>",["<parentId>"],"<name>","video\/mp4",...]
  // Note the escaped solidus in the mime type - match it loosely rather than literally.
  const entry = /\["([a-zA-Z0-9_-]{20,})",\["[a-zA-Z0-9_-]{20,}"\],"((?:[^"\\]|\\.)*)","(video[^"]+)"([^\[]{0,160})/g;
  const files = [];
  const seen = new Set();

  for (let match = entry.exec(decoded); match; match = entry.exec(decoded)) {
    const [, id, rawName, , trailing = ''] = match;
    if (seen.has(id)) continue;
    seen.add(id);
    let name = rawName;
    try {
      name = JSON.parse(`"${rawName}"`);
    } catch {
      // Keep the raw name if it is not valid JSON string content.
    }
    const stamp = trailing.match(/[0-9]{13}/);
    const year = stamp ? new Date(Number(stamp[0])).getFullYear() : null;
    files.push({ id, name, year });
  }

  files.sort((a, b) => a.name.localeCompare(b.name));
  return files.map(toVideo);
}

/**
 * Returns the videos currently in the Drive folder.
 *
 * Never throws: a misconfigured or unreachable folder yields an empty list plus
 * an error string, so the page can render an explanation instead of crashing.
 */
export async function listDriveVideos(folderUrl = DRIVE_FOLDER_URL) {
  const folderId = parseFolderId(folderUrl);
  if (!folderId) {
    return {
      videos: [],
      error:
        'No Google Drive folder configured. Set GOOGLE_DRIVE_FOLDER_URL in .env.local, or edit DRIVE_FOLDER_URL in src/lib/drive.js.',
    };
  }

  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  try {
    const videos = apiKey
      ? await listViaApi(folderId, apiKey)
      : await listViaPublicPage(folderId);
    return { videos, error: null };
  } catch (error) {
    console.error('[drive] Failed to list folder', folderId, error);
    return {
      videos: [],
      error:
        'Could not read the Google Drive folder. Check that it is shared with "Anyone with the link".',
    };
  }
}
