/**
 * Shared platform metadata and the platform's primary metric.
 *
 * Instagram and TikTok carry an engagement rate percent in the engagement-rate
 * slot. Threads carries Recent Views there instead: a whole number the admin
 * copies from the Threads app. The backend parser is the authority; this copy
 * only gives the admin early feedback.
 */

export const PLATFORMS = {
  instagram: {
    value: 'instagram',
    label: 'Instagram',
    icon: 'ri:instagram-line',
    color: '#C13584',
    linkField: 'instagramProfileLink',
  },
  tiktok: {
    value: 'tiktok',
    label: 'TikTok',
    icon: 'ic:baseline-tiktok',
    color: '#000000',
    linkField: 'tiktokProfileLink',
  },
  threads: {
    value: 'threads',
    label: 'Threads',
    icon: 'ri:threads-line',
    color: '#000000',
    linkField: 'threadsProfileLink',
  },
};

export const PLATFORM_LIST = Object.values(PLATFORMS);

export const isKnownPlatform = (platform) =>
  Object.prototype.hasOwnProperty.call(PLATFORMS, platform ?? '');

export const platformMeta = (platform) => PLATFORMS[platform] ?? PLATFORMS.instagram;

/** The saved profile link on a Creator record for this platform. Unknown reads as Instagram. */
export const storedProfileLink = (creatorAccount, platform) =>
  (creatorAccount?.[platformMeta(platform).linkField] || '').trim();

export const isRecentViewsPlatform = (platform) => platform === 'threads';

export const RECENT_VIEWS_HINT = 'Copy from the Threads app';
export const RECENT_VIEWS_ERROR =
  'Enter recent views as a whole number, for example 1,300,000 or 1.3M.';
export const ENGAGEMENT_RATE_ERROR = 'Enter a percentage from 0 to 1,000.';

export const metricLabel = (platform, { short = false } = {}) => {
  if (isRecentViewsPlatform(platform)) return short ? 'Recent views' : 'Recent Views';
  return short ? 'Engagement rate' : 'Engagement Rate';
};

/** Name of the manual-numbers edit action. Threads followers come from the fetch unless it failed. */
export function manualEditLabel(platform, { fetchFailed = false } = {}) {
  const metric = metricLabel(platform, { short: true }).toLowerCase();
  return isRecentViewsPlatform(platform) && !fetchFailed
    ? `Edit ${metric}`
    : `Edit follower count and ${metric}`;
}

export const metricError = (platform) =>
  isRecentViewsPlatform(platform) ? RECENT_VIEWS_ERROR : ENGAGEMENT_RATE_ERROR;

const MAX_RECENT_VIEWS = 1_000_000_000_000;
const SUFFIX = { k: 1e3, m: 1e6, b: 1e9 };

/** Digit string, null when empty, or 'invalid'. Mirrors the backend parser. */
export function parseRecentViews(value) {
  if (value == null) return null;
  if (typeof value !== 'number' && typeof value !== 'string') return 'invalid';
  const raw = String(value)
    .trim()
    .replace(/(recent\s*)?views$/i, '')
    .replace(/[,\s]/g, '');
  if (!raw) return null;

  let parsed;
  if (/^\d+$/.test(raw)) {
    parsed = Number(raw);
  } else {
    const match = raw.match(/^(\d+(?:\.\d+)?)([kmb])$/i);
    if (!match) return 'invalid';
    parsed = Math.round(Number(match[1]) * SUFFIX[match[2].toLowerCase()]);
  }
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > MAX_RECENT_VIEWS) return 'invalid';
  return String(parsed);
}

/** Matches the backend's typed-rate guard. Zero is a valid measured percentage. */
export function hasSafeEngagementRate(value) {
  const raw = typeof value === 'number' ? String(value) : value?.trim();
  if (typeof raw !== 'string' || !/^\d+(\.\d+)?$/.test(raw)) return false;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1000;
}

export function hasSafePrimaryMetric(platform, value) {
  if (!isRecentViewsPlatform(platform)) return hasSafeEngagementRate(value);
  const parsed = parseRecentViews(value);
  return parsed !== null && parsed !== 'invalid';
}

/** The value to send. Threads goes out as a digit string; a rate is left as typed. */
export function normalizePrimaryMetric(platform, value) {
  if (!isRecentViewsPlatform(platform)) return value;
  const parsed = parseRecentViews(value);
  return parsed === 'invalid' ? value : (parsed ?? '');
}

/** Drops characters that can never be valid. A second dot stays, so the field shows an error. */
export function sanitizePrimaryMetricInput(platform, value) {
  const text = String(value ?? '');
  return isRecentViewsPlatform(platform)
    ? text.replace(/[^0-9.kmb]/gi, '')
    : text.replace(/[^0-9.]/g, '');
}

/** "1250000" -> "1,250,000". Anything that is not plain digits shows as typed. */
export function withThousandsSeparators(value) {
  const text = String(value ?? '');
  return /^\d+$/.test(text) ? text.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : text;
}

/** Input display text. Typed Recent Views digits get commas; a rate shows as typed. */
export function formatPrimaryMetricInput(platform, value) {
  return isRecentViewsPlatform(platform) ? withThousandsSeparators(value) : String(value ?? '');
}

const compactFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Display text, or null when there is no value. */
export function formatPrimaryMetric(platform, value, { compact = false } = {}) {
  if (value == null || value === '') return null;
  if (isRecentViewsPlatform(platform)) {
    const parsed = parseRecentViews(value);
    if (parsed === null || parsed === 'invalid') return null;
    const n = Number(parsed);
    return compact ? compactFormatter.format(n) : n.toLocaleString('en-US');
  }
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  // "5.40" reads as false precision next to the handoff's "5.4".
  return `${Number(n.toFixed(2))}%`;
}
