/**
 * Browser copy of the profile link rules.
 *
 * The backend is the authority. `profileUrlNormalizer.ts` in cc-backend
 * re-normalizes every link it receives and derives the platform itself, and it
 * ignores anything the browser sends about platform. This copy exists only so
 * the admin sees the problem while typing, instead of after a request.
 *
 * If the two ever drift, the server still decides. The worst case is a
 * message that is friendlier or stricter than it needs to be.
 */

const HOSTS = {
  'instagram.com': 'instagram',
  'www.instagram.com': 'instagram',
  'tiktok.com': 'tiktok',
  'www.tiktok.com': 'tiktok',
};

const RESERVED = {
  instagram: new Set([
    'p',
    'reel',
    'reels',
    'tv',
    'stories',
    'explore',
    'accounts',
    'direct',
    'about',
    'developer',
    'legal',
    'privacy',
    'terms',
    'session',
    'challenge',
    'emails',
    'push',
    'web',
    'graphql',
    'api',
    'oauth',
    'ajax',
    'topics',
  ]),
  tiktok: new Set([
    'video',
    'photo',
    'tag',
    'music',
    'discover',
    'foryou',
    'following',
    'live',
    'upload',
    'search',
    'explore',
    'about',
    'legal',
    'privacy',
    'terms',
    'business',
    'embed',
    'api',
    'node',
    'passport',
    'login',
  ]),
};

const USERNAME = {
  instagram: /^[a-z0-9._]{1,30}$/,
  tiktok: /^[a-z0-9._]{1,24}$/,
};

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

const reject = (code, message) => ({ ok: false, code, message });

function isValidUsername(platform, username) {
  if (!USERNAME[platform].test(username)) return false;
  if (username.startsWith('.') || username.endsWith('.')) return false;
  if (username.includes('..')) return false;
  return /[a-z0-9_]/.test(username);
}

export function validateProfileLink(input) {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw) return reject('EMPTY', 'Enter a profile link.');

  if (HAS_SCHEME.test(raw) && !/^https?:/i.test(raw)) {
    return reject('UNSUPPORTED_SCHEME', 'Use an http or https profile link.');
  }

  let url;
  try {
    url = new URL(HAS_SCHEME.test(raw) ? raw : `https://${raw}`);
  } catch {
    return reject('MALFORMED_URL', 'This is not a valid link.');
  }

  if (url.username || url.password) {
    return reject('USERINFO_NOT_ALLOWED', 'Remove the user name and password from the link.');
  }
  if (url.port) return reject('PORT_NOT_ALLOWED', 'Remove the port from the link.');

  const platform = HOSTS[url.hostname.toLowerCase()];
  if (!platform) return reject('UNSUPPORTED_HOST', 'Use an Instagram or TikTok profile link.');

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length !== 1) {
    return reject(
      'NOT_A_PROFILE_URL',
      segments.length === 0
        ? 'This link has no profile name.'
        : 'Use the profile link, not a post link.'
    );
  }

  const [segment] = segments;
  let username;
  if (platform === 'tiktok') {
    if (!segment.startsWith('@')) {
      return reject('NOT_A_PROFILE_URL', 'A TikTok profile link contains @ before the name.');
    }
    username = decodeURIComponent(segment.slice(1)).toLowerCase();
  } else {
    username = decodeURIComponent(segment).toLowerCase();
  }

  if (RESERVED[platform].has(username)) {
    return reject('NOT_A_PROFILE_URL', 'Use the profile link, not a page link.');
  }
  if (!isValidUsername(platform, username)) {
    return reject('INVALID_USERNAME', 'This profile name is not valid.');
  }

  const path = platform === 'tiktok' ? `@${username}` : username;
  return {
    ok: true,
    profile: {
      platform,
      username,
      canonicalUrl: `https://www.${platform}.com/${path}`,
      canonicalKey: `${platform}:${username}`,
    },
  };
}

const PLATFORM_LABELS = { instagram: 'Instagram', tiktok: 'TikTok' };

/** Read-only label for the derived platform chip. */
export const platformLabel = (platform) => PLATFORM_LABELS[platform] ?? '—';
