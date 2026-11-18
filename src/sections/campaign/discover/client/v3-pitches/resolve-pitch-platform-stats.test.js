import { it, vi, expect, describe } from 'vitest';

import {
  scrapePlatformOf,
  resolveRowMetrics,
  seedPitchPlatform,
  availablePitchPlatforms,
  resolvePitchPlatformStats,
} from './resolve-pitch-platform-stats';

// c-agreement pulls in an OTP input whose ESM build cannot load under vitest.
vi.mock('../../admin/c-agreement', () => ({ resolveTierForFollowerCount: () => null }));

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

describe('a Threads pitch', () => {
  const threadsPitch = {
    selectedPlatform: 'threads',
    followerCount: 36,
    engagementRate: '1300000',
    user: {
      creator: {
        threadsProfileLink: 'https://www.threads.com/@pandapandiy_',
        manualInstagramFollowerCount: 9000,
        manualInstagramEngagementRate: '3.1',
      },
    },
  };

  it('reads followers and Recent Views from the pitch snapshot only', () => {
    expect(resolvePitchPlatformStats({ pitch: threadsPitch, platform: 'threads' })).toEqual({
      followers: 36,
      engagementRate: 1300000,
      averageLikes: null,
    });
  });

  it('never puts Threads numbers on the Instagram toggle', () => {
    expect(
      resolvePitchPlatformStats({ pitch: threadsPitch, platform: 'instagram' }).engagementRate
    ).toBe(3.1);
    expect(
      resolvePitchPlatformStats({
        pitch: { ...threadsPitch, selectedPlatform: 'instagram' },
        platform: 'threads',
      })
    ).toEqual({ followers: null, engagementRate: null, averageLikes: null });
  });

  it('is detected from the link and listed as a platform', () => {
    const unsaved = { ...threadsPitch, selectedPlatform: null };
    expect(scrapePlatformOf(unsaved)).toBe('threads');
    expect(scrapePlatformOf({ user: { creator: { profileLink: 'https://threads.net/@x' } } })).toBe(
      'threads'
    );
    expect(availablePitchPlatforms(threadsPitch)).toEqual(['threads']);
    expect(seedPitchPlatform(threadsPitch)).toBe('threads');
  });

  it('points the row at whichever other platform has data', () => {
    const metrics = resolveRowMetrics(threadsPitch, null);
    expect(metrics).toMatchObject({
      platform: 'threads',
      followerCount: 36,
      engagementRate: 1300000,
      otherPlatform: 'instagram',
      otherPlatformHasData: true,
    });

    const bare = { ...threadsPitch, user: { creator: { threadsProfileLink: 'x' } } };
    expect(resolveRowMetrics(bare, null)).toMatchObject({
      otherPlatform: null,
      otherPlatformHasData: false,
    });
  });

  it('keeps the Instagram row paired with TikTok', () => {
    expect(resolveRowMetrics(scrapedPitch, null)).toMatchObject({
      platform: 'instagram',
      otherPlatform: 'tiktok',
      otherPlatformHasData: false,
    });
  });
});
