/**
 * YouTube Embed & URL Parser Utility
 * 
 * Safely parses YouTube URLs and iframe embed codes.
 * Extracts video ID and returns a safe canonical embed URL.
 * Strictly prevents arbitrary HTML/JS injection and non-YouTube domain embedding.
 */

export interface ParsedYouTubeInfo {
  isYouTube: boolean;
  videoId?: string;
  embedUrl?: string;
  defaultThumbnailUrl?: string;
  error?: string;
}

export const ALLOWED_YOUTUBE_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
];

/**
 * Validates whether a given URL belongs to an official YouTube domain
 */
export function isTrustedYouTubeUrl(urlStr: string): boolean {
  try {
    let clean = urlStr.trim();
    if (clean.startsWith('//')) clean = 'https:' + clean;
    const parsed = new URL(clean);
    return ALLOWED_YOUTUBE_DOMAINS.includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Parses user/admin input which can be:
 * 1. Full <iframe> tag: <iframe src="https://www.youtube.com/embed/..." ...></iframe>
 * 2. Embed URL: https://www.youtube.com/embed/VIDEO_ID
 * 3. Standard Watch URL: https://www.youtube.com/watch?v=VIDEO_ID
 * 4. Short URL: https://youtu.be/VIDEO_ID
 * 5. Shorts URL: https://www.youtube.com/shorts/VIDEO_ID
 * 6. Mobile URL: https://m.youtube.com/watch?v=VIDEO_ID
 */
export function parseYouTubeVideo(input: string): ParsedYouTubeInfo {
  if (!input || typeof input !== 'string') {
    return { isYouTube: false };
  }

  let raw = input.trim();
  let candidateUrl = raw;

  // 1. If input contains an <iframe> tag, safely extract only the src attribute
  if (raw.includes('<iframe') || raw.startsWith('<iframe')) {
    const srcMatch = raw.match(/src=["']([^"']+)["']/i);
    if (!srcMatch || !srcMatch[1]) {
      return {
        isYouTube: false,
        error: 'Invalid iframe: Could not find a valid src="..." attribute.',
      };
    }
    candidateUrl = srcMatch[1].trim();
  }

  // 2. Normalize protocol if protocol-relative (//www.youtube.com/...)
  if (candidateUrl.startsWith('//')) {
    candidateUrl = 'https:' + candidateUrl;
  }

  // If user pasted just a raw video ID or text without protocol
  if (!candidateUrl.startsWith('http://') && !candidateUrl.startsWith('https://')) {
    // Check if it's a direct 11-char YouTube ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(candidateUrl)) {
      const videoId = candidateUrl;
      return {
        isYouTube: true,
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        defaultThumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
    candidateUrl = 'https://' + candidateUrl;
  }

  // 3. Parse URL and verify domain
  try {
    const parsed = new URL(candidateUrl);
    const hostname = parsed.hostname.toLowerCase();

    const isAllowed = ALLOWED_YOUTUBE_DOMAINS.includes(hostname);
    if (!isAllowed) {
      return {
        isYouTube: false,
        error: 'Untrusted domain. Only official YouTube embed codes or URLs are allowed.',
      };
    }

    let videoId: string | null = null;

    if (hostname === 'youtu.be') {
      // Path format: /VIDEO_ID
      const segment = parsed.pathname.replace(/^\/+/, '').split('/')[0];
      if (segment) videoId = segment;
    } else if (parsed.pathname.startsWith('/embed/')) {
      // Path format: /embed/VIDEO_ID
      const segment = parsed.pathname.replace(/^\/embed\//, '').split('/')[0];
      if (segment) videoId = segment;
    } else if (parsed.pathname.startsWith('/shorts/')) {
      // Path format: /shorts/VIDEO_ID
      const segment = parsed.pathname.replace(/^\/shorts\//, '').split('/')[0];
      if (segment) videoId = segment;
    } else if (parsed.pathname.startsWith('/v/')) {
      // Path format: /v/VIDEO_ID
      const segment = parsed.pathname.replace(/^\/v\//, '').split('/')[0];
      if (segment) videoId = segment;
    } else if (parsed.searchParams.has('v')) {
      // Query param format: ?v=VIDEO_ID
      videoId = parsed.searchParams.get('v');
    }

    // Clean videoId of any query strings or fragments if split missed them
    if (videoId) {
      videoId = videoId.split('?')[0].split('&')[0].split('#')[0];
    }

    // YouTube Video IDs are strictly 11 alphanumeric characters (plus - and _)
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return {
        isYouTube: false,
        error: 'Invalid YouTube video ID format. Expected an 11-character video ID.',
      };
    }

    return {
      isYouTube: true,
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      defaultThumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch (err: any) {
    return {
      isYouTube: false,
      error: err.message || 'Failed to parse video URL.',
    };
  }
}
