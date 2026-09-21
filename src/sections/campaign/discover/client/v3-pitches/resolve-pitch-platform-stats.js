/**
 * Pitch modal stats: connected account first, then the Apify scrape for
 * that platform (pitch + manual creator columns).
 */

function toNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function firstPositive(...values) {
  for (const value of values) {
    const n = toNumber(value);
    if (n != null && n > 0) return n;
  }
  return null;
}

function firstRate(...values) {
  for (const value of values) {
    const n = toNumber(value);
    if (n != null) return n;
  }
  return null;
}

function linkLooksLike(link, platform) {
  if (!link || typeof link !== 'string') return false;
  if (platform === 'tiktok') return /tiktok\.com/i.test(link);
  return /instagram\.com/i.test(link);
}

/** Platform this pitch's scrape / shortlist snapshot belongs to. */
export function scrapePlatformOf(pitch) {
  const direct = pitch?.selectedPlatform;
  if (direct === 'tiktok' || direct === 'instagram') return direct;

  const creator = pitch?.user?.creator;
  if (linkLooksLike(creator?.tiktokProfileLink, 'tiktok')) return 'tiktok';
  if (linkLooksLike(creator?.instagramProfileLink, 'instagram')) return 'instagram';
  if (linkLooksLike(creator?.profileLink, 'tiktok')) return 'tiktok';
  if (linkLooksLike(creator?.profileLink, 'instagram')) return 'instagram';
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

export function resolvePitchPlatformStats({ pitch, creatorProfileFull, platform }) {
  const fromPitch = pitch?.user?.creator || {};
  const fromProfile = creatorProfileFull?.creator || {};
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
