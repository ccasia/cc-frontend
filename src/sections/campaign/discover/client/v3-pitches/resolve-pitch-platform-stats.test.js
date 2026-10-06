import { it, expect, describe } from 'vitest';

import {
  scrapePlatformOf,
  resolveRowMetrics,
  seedPitchPlatform,
  availablePitchPlatforms,
  resolvePitchPlatformStats,
} from './resolve-pitch-platform-stats';

const scrapedPitch = {
  selectedPlatform: 'instagram',
  followerCount: '6849',
  engagementRate: '4.08',
  scrapedAverageLikes: 312,
  user: {
    creator: {
      isGuest: true,
      instagramProfileLink: 'https://www.instagram.com/jisoo/',
      manualInstagramFollowerCount: 0,
      manualFollowerCount: 6849,
    },
  },
};

describe('resolvePitchPlatformStats', () => {
  it('uses the Apify scrape when there is no connected account', () => {
    expect(resolvePitchPlatformStats({ pitch: scrapedPitch, platform: 'instagram' })).toEqual({
      followers: 6849,
      engagementRate: 4.08,
      averageLikes: 312,
    });
  });

  it('does not show Instagram scrape numbers on the TikTok toggle', () => {
    expect(resolvePitchPlatformStats({ pitch: scrapedPitch, platform: 'tiktok' })).toEqual({
      followers: null,
      engagementRate: null,
      averageLikes: null,
    });
  });

  it('prefers a connected TikTok account over the scrape', () => {
    const pitch = {
      ...scrapedPitch,
      selectedPlatform: 'tiktok',
      user: {
        creator: {
          tiktokUser: { follower_count: 12000, engagement_rate: 6.2, averageLikes: 900 },
          tiktokProfileLink: 'https://www.tiktok.com/@sam',
        },
      },
    };

    expect(resolvePitchPlatformStats({ pitch, platform: 'tiktok' })).toEqual({
      followers: 12000,
      engagementRate: 6.2,
      averageLikes: 900,
    });
  });
});

describe('availablePitchPlatforms', () => {
  it('includes the scrape platform even without a connected account', () => {
    expect(availablePitchPlatforms(scrapedPitch)).toEqual(['instagram']);
    expect(scrapePlatformOf(scrapedPitch)).toBe('instagram');
    expect(seedPitchPlatform(scrapedPitch)).toBe('instagram');
  });
});

describe('resolveRowMetrics', () => {
  // Instagram connected with no ER, shortlisted on TikTok, TikTok numbers
  // only on the pitch scrape.
  const tiktokPitchWithInstagramAccount = {
    userId: 'user-1',
    selectedPlatform: 'tiktok',
    followerCount: '23900',
    engagementRate: '2.00',
    user: {
      id: 'user-1',
      creator: {
        instagramUser: { username: 'aidansui', followers_count: 672, engagement_rate: null },
        tiktokUser: null,
      },
    },
  };

  it('keeps both metrics on the selected platform', () => {
    expect(resolveRowMetrics(tiktokPitchWithInstagramAccount)).toEqual({
      platform: 'tiktok',
      followerCount: 23900,
      engagementRate: 2,
      otherPlatform: 'instagram',
      otherPlatformHasData: true,
    });
  });

  it('reads the platform from the campaign shortlist when the row has none', () => {
    const pitch = { ...tiktokPitchWithInstagramAccount, selectedPlatform: undefined };
    const campaign = { shortlisted: [{ userId: 'user-1', selectedPlatform: 'tiktok' }] };

    expect(resolveRowMetrics(pitch, campaign).platform).toBe('tiktok');
    expect(resolveRowMetrics(pitch, campaign).followerCount).toBe(23900);
  });

  it('seeds the platform from the accounts when none was saved', () => {
    const pitch = {
      user: { creator: { tiktokUser: { follower_count: 5000, engagement_rate: 3.1 } } },
    };

    expect(resolveRowMetrics(pitch)).toMatchObject({
      platform: 'tiktok',
      followerCount: 5000,
      engagementRate: 3.1,
    });
  });

  it('keeps an unsaved-platform scrape on the row platform', () => {
    const pitch = { followerCount: '1200', engagementRate: '4.5', user: { creator: {} } };

    expect(resolveRowMetrics(pitch)).toMatchObject({
      platform: 'instagram',
      followerCount: 1200,
      engagementRate: 4.5,
    });
  });

  it('returns nothing instead of borrowing the other platform', () => {
    const pitch = {
      selectedPlatform: 'tiktok',
      user: { creator: { instagramUser: { followers_count: 672, engagement_rate: 1.2 } } },
    };

    expect(resolveRowMetrics(pitch)).toEqual({
      platform: 'tiktok',
      followerCount: null,
      engagementRate: null,
      otherPlatform: 'instagram',
      otherPlatformHasData: true,
    });
  });

  it('skips a connected account that reports 0 followers', () => {
    const pitch = {
      selectedPlatform: 'tiktok',
      followerCount: '8000',
      user: { creator: { tiktokUser: { follower_count: 0, engagement_rate: null } } },
    };

    expect(resolveRowMetrics(pitch).followerCount).toBe(8000);
  });

  it('reports no data on either platform', () => {
    const pitch = { selectedPlatform: 'instagram', user: { creator: { isGuest: true } } };

    expect(resolveRowMetrics(pitch)).toMatchObject({
      followerCount: null,
      engagementRate: null,
      otherPlatformHasData: false,
    });
  });
});
