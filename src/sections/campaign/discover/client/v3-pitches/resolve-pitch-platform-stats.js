/**
 * Pitch modal stats: connected account first, then the Apify scrape for
 * that platform (pitch + manual creator columns).
 */

import { isKnownPlatform } from 'src/utils/platform-metric';
import { resolveRecordedPlatform, resolveTierPlatformForDisplay } from 'src/utils/credit-tier-platform';

import { resolveTierForFollowerCount } from '../../admin/c-agreement';

function toNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function firstPositive(...values) {
  const found = values.map(toNumber).find((n) => n != null && n > 0);
  return found ?? null;
}

function firstRate(...values) {
  const found = values.map(toNumber).find((n) => n != null);
  return found ?? null;
}

function linkLooksLike(link, platform) {
  if (!link || typeof link !== 'string') return false;
  if (platform === 'tiktok') return /tiktok\.com/i.test(link);
  if (platform === 'threads') return /threads\.(com|net)/i.test(link);
  return /instagram\.com/i.test(link);
}

/** Platform this pitch's scrape / shortlist snapshot belongs to. */
export function scrapePlatformOf(pitch) {
  const direct = pitch?.selectedPlatform;
  if (isKnownPlatform(direct)) return direct;

  const creator = pitch?.user?.creator;
  if (linkLooksLike(creator?.tiktokProfileLink, 'tiktok')) return 'tiktok';
  if (linkLooksLike(creator?.instagramProfileLink, 'instagram')) return 'instagram';
  if (linkLooksLike(creator?.threadsProfileLink, 'threads')) return 'threads';
  if (linkLooksLike(creator?.profileLink, 'tiktok')) return 'tiktok';
  if (linkLooksLike(creator?.profileLink, 'instagram')) return 'instagram';
  if (linkLooksLike(creator?.profileLink, 'threads')) return 'threads';
  return null;
}

export function availablePitchPlatforms(pitch) {
  const creator = pitch?.user?.creator;
  const scrape = scrapePlatformOf(pitch);
  const list = [];
  if (creator?.instagramUser || creator?.instagramProfileLink || scrape === 'instagram') {
    list.push('instagram');
  }
  if (creator?.tiktokUser || creator?.tiktokProfileLink || scrape === 'tiktok') {
    list.push('tiktok');
  }
  if (creator?.threadsProfileLink || scrape === 'threads') list.push('threads');
  if (!list.length && scrape) list.push(scrape);
  return list;
}

export function seedPitchPlatform(pitch) {
  const platforms = availablePitchPlatforms(pitch);
  const scrape = scrapePlatformOf(pitch);
  if (scrape && platforms.includes(scrape)) return scrape;

  const creator = pitch?.user?.creator;
  const ig = creator?.instagramUser;
  const tt = creator?.tiktokUser;
  if (!ig && tt && platforms.includes('tiktok')) return 'tiktok';
  if (ig && tt && (tt.follower_count || 0) > (ig.followers_count || 0) && platforms.includes('tiktok')) {
    return 'tiktok';
  }
  return platforms[0] || 'instagram';
}

/**
 * Threads has no connected account and no per-platform manual columns. Its
 * numbers live only on the pitch snapshot, and the rate slot holds Recent Views.
 */
function resolveThreadsStats(pitch, fromProfile, fromPitch) {
  if (scrapePlatformOf(pitch) !== 'threads') {
    return { followers: null, engagementRate: null, averageLikes: null };
  }
  return {
    followers: firstPositive(
      pitch?.followerCount,
      fromProfile.manualFollowerCount,
      fromPitch.manualFollowerCount
    ),
    engagementRate: firstRate(pitch?.engagementRate),
    averageLikes: firstPositive(pitch?.scrapedAverageLikes),
  };
}

export function resolvePitchPlatformStats({ pitch, creatorProfileFull, platform }) {
  const fromPitch = pitch?.user?.creator || {};
  const fromProfile = creatorProfileFull?.creator || {};
  if (platform === 'threads') return resolveThreadsStats(pitch, fromProfile, fromPitch);
  const connected =
    platform === 'tiktok'
      ? fromProfile.tiktokUser || fromPitch.tiktokUser
      : fromProfile.instagramUser || fromPitch.instagramUser;

  const scrapePlatform = scrapePlatformOf(pitch);
  const scrapeApplies = scrapePlatform ? scrapePlatform === platform : false;

  const followers = firstPositive(
    platform === 'tiktok' ? connected?.follower_count : connected?.followers_count,
    platform === 'tiktok' ? fromProfile.manualTiktokFollowerCount : fromProfile.manualInstagramFollowerCount,
    platform === 'tiktok' ? fromPitch.manualTiktokFollowerCount : fromPitch.manualInstagramFollowerCount,
    scrapeApplies ? pitch?.followerCount : null,
    scrapeApplies ? fromProfile.manualFollowerCount : null,
    scrapeApplies ? fromPitch.manualFollowerCount : null
  );

  const engagementRate = firstRate(
    connected?.engagement_rate,
    platform === 'tiktok' ? fromProfile.manualTiktokEngagementRate : fromProfile.manualInstagramEngagementRate,
    platform === 'tiktok' ? fromPitch.manualTiktokEngagementRate : fromPitch.manualInstagramEngagementRate,
    scrapeApplies ? pitch?.engagementRate : null
  );

  const averageLikes = firstPositive(
    connected?.averageLikes,
    scrapeApplies ? pitch?.scrapedAverageLikes : null
  );

  return { followers, engagementRate, averageLikes };
}

/** Platforms a row may point to when its own platform has no numbers. */
const otherPlatformsOf = (platform) => {
  if (platform === 'threads') return ['instagram', 'tiktok'];
  return [platform === 'tiktok' ? 'instagram' : 'tiktok'];
};

/**
 * Master list row metrics. The row shows one platform: the one saved on the
 * pitch or shortlist, else the one the modal would open on. Both numbers come
 * from that platform only, so a row never mixes Instagram and TikTok values.
 */
export function resolveRowMetrics(pitch, campaign) {
  const recorded = resolveRecordedPlatform(pitch, campaign);
  const platform = recorded ?? seedPitchPlatform(pitch);

  // A pitch with no saved platform has scrape numbers of unknown origin. They
  // belong to the platform the row shows, the way they did before.
  const rowPitch = { ...pitch, selectedPlatform: platform };
  const stats = resolvePitchPlatformStats({ pitch: rowPitch, platform });
  const others = otherPlatformsOf(platform);
  const otherWithData = others.find((other) => {
    const otherStats = resolvePitchPlatformStats({ pitch: rowPitch, platform: other });
    return otherStats.followers != null || otherStats.engagementRate != null;
  });

  return {
    platform,
    followerCount: stats.followers,
    engagementRate: stats.engagementRate,
    otherPlatform: otherWithData ?? (others.length === 1 ? others[0] : null),
    otherPlatformHasData: Boolean(otherWithData),
  };
}

/**
 * Master list row tier and the platform it is priced on: the tier approval saved for this campaign,
 * else the creator's live tier on the platform chosen at shortlisting (Instagram when none was, as
 * agreements read it). Approval saves that same live tier (resolveLiveRowTier in cc-backend, which
 * copies this follower order), so the client is billed what the row showed. `tiers` is the active
 * tier list.
 */
export function resolveRowTier(pitch, campaign, tiers) {
  const platform = resolveTierPlatformForDisplay(pitch, campaign);

  if (pitch?._creditTier) {
    return {
      platform,
      name: pitch._creditTier.name,
      creditsPerVideo: pitch._creditPerVideo || pitch._creditTier.creditsPerVideo,
    };
  }

  const { followers } = resolvePitchPlatformStats({ pitch: { ...pitch, selectedPlatform: platform }, platform });
  const live = resolveTierForFollowerCount(tiers, followers);
  return live ? { platform, name: live.name, creditsPerVideo: live.creditsPerVideo } : null;
}
