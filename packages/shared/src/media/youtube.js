// Platform-safe YouTube helpers shared by the mobile app and admin dashboard.
//
// Staff paste a full, staff-approved tutorial URL into the admin Resources form.
// We never scrape, search, or auto-discover videos — these helpers only parse a
// URL that a human already supplied. Supported shapes:
//   https://www.youtube.com/watch?v=VIDEO_ID
//   https://youtu.be/VIDEO_ID
//   https://www.youtube.com/embed/VIDEO_ID
//   https://www.youtube.com/shorts/VIDEO_ID
//   https://m.youtube.com/watch?v=VIDEO_ID
// Extra query params (t=, list=, si=, etc.) are tolerated.

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

function cleanId(raw) {
  if (!raw) return null;
  // A path/param segment can carry its own query/hash; keep the first token.
  const id = String(raw).split(/[?&#/]/)[0];
  return VIDEO_ID.test(id) ? id : null;
}

/**
 * Extract an 11-character YouTube video id from a watch/share/embed/shorts URL.
 * Returns null for anything that is not a recognizable YouTube video URL.
 */
export function parseYouTubeId(input) {
  if (!input || typeof input !== 'string') return null;
  const value = input.trim();
  if (!value) return null;

  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = url.hostname
    .replace(/^www\./, '')
    .replace(/^m\./, '')
    .toLowerCase();

  if (host === 'youtu.be') {
    return cleanId(url.pathname.replace(/^\//, ''));
  }

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') return cleanId(url.searchParams.get('v'));
    const embedMatch = url.pathname.match(/^\/(?:embed|shorts|v)\/([^/?#]+)/);
    if (embedMatch) return cleanId(embedMatch[1]);
  }

  return null;
}

/** True when the string parses to a valid YouTube video URL. */
export function isYouTubeUrl(input) {
  return parseYouTubeId(input) !== null;
}

/**
 * Privacy-enhanced embed URL for the admin web preview iframe.
 * Returns null when the input is not a valid YouTube URL.
 */
export function getYouTubeEmbedUrl(input) {
  const id = parseYouTubeId(input);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

/**
 * Thumbnail image URL for a tutorial preview card.
 * `quality` is one of: default | mqdefault | hqdefault | sddefault | maxresdefault.
 */
export function getYouTubeThumbnail(input, quality = 'hqdefault') {
  const id = parseYouTubeId(input);
  return id ? `https://i.ytimg.com/vi/${id}/${quality}.jpg` : null;
}
