import { describe, expect, it } from 'vitest';

import {
  availablePitchPlatforms,
  resolvePitchPlatformStats,
  scrapePlatformOf,
  seedPitchPlatform,
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
