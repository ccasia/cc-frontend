import { formatNumber } from 'src/utils/socialMetricsCalculator';
import { createSocialProfileUrl } from 'src/utils/media-kit-utils';

// ─── Shared creator helpers ────────────────────────────────────────────────────
// Pure helpers shared by CreatorCard, CreatorProfilePanel and the discovery components.

export const ONYX = '#231F20';
export const BLUE = '#1340FF';

export const formatEngagementRate = (rate) => {
  if (rate == null || rate === '' || !Number.isFinite(Number(rate))) return '—';
  return `${Number(rate).toFixed(2)}%`;
};

export const normalizeRating = (value) => {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 0;
  if (rating > 5 && rating <= 100) return Math.min(5, Math.max(0, rating / 20));
  return Math.min(5, Math.max(0, rating));
};

export const resolveCreatorRating = (creator) =>
  normalizeRating(
    creator.creatorRating ??
      creator.rating ??
      creator.averageRating ??
      creator.score ??
      creator.creditScore
  );

export const hasCreatorRating = (creator) => {
  const raw =
    creator.creatorRating ??
    creator.rating ??
    creator.averageRating ??
    creator.score ??
    creator.creditScore;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0;
};

export const resolvePlatformData = (creator) => {
  if (creator.platform === 'instagram') {
    return { platform: 'instagram', ...creator.instagram };
  }

  if (creator.platform === 'tiktok') {
    return { platform: 'tiktok', ...creator.tiktok };
  }

  const ig = creator.instagram;
  const tt = creator.tiktok;

  if ((ig?.available || ig?.connected) && (tt?.available || tt?.connected)) {
    return ig.followers >= tt.followers
      ? { platform: 'instagram', ...ig }
      : { platform: 'tiktok', ...tt };
  }
  if ((ig?.available || ig?.connected)) return { platform: 'instagram', ...ig };
  if ((tt?.available || tt?.connected)) return { platform: 'tiktok', ...tt };
  return { platform: null };
};

export const getPlatformHandle = (creator, platform) => {
  if (platform === 'instagram')
    return creator.handles?.instagram ? `${creator.handles.instagram}` : null;
  if (platform === 'tiktok') return creator.handles?.tiktok ? `${creator.handles.tiktok}` : null;
  return null;
};

export const getPlatformIcon = (platform) => {
  if (platform === 'instagram') return 'mdi:instagram';
  if (platform === 'tiktok') return 'ic:baseline-tiktok';
  return null;
};

export const canInviteCreator = (creator) => Boolean(creator?.userId && !creator.isGuest && creator.type !== 'non-platform');

export const formatDiscoveryNumber = (value) => value == null || value === '' ? '—' : formatNumber(value);

export const resolveProfileUrl = (creator, platform) => creator?.[platform]?.profileUrl
  || (getPlatformHandle(creator, platform) ? createSocialProfileUrl(getPlatformHandle(creator, platform), platform) : null);

export const metricSourceLabel = (source) => ({ connected: 'Connected account', automatic: 'Saved scrape',
  manual_override: 'Manual entry', master_list: 'Master List', mixed: 'Connected / Master List' }[source] || '—');
