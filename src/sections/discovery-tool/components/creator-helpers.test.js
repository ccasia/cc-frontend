import { it, expect, describe } from 'vitest';

import { canInviteCreator, resolveProfileUrl, resolvePlatformData, formatEngagementRate, formatDiscoveryNumber } from './creator-helpers';

describe('saved Discovery profiles', () => {
  const creator = { platform: 'tiktok', isGuest: true, handles: { instagram: 'wrong', tiktok: 'right' },
    instagram: { connected: true, followers: 100 },
    tiktok: { available: true, connected: false, followers: 0, engagementRate: 24.39, profileUrl: 'https://www.tiktok.com/@right' } };
  it('uses the row platform even when only the other account is connected', () => {
    expect(resolvePlatformData(creator)).toMatchObject({ platform: 'tiktok', followers: 0, engagementRate: 24.39 });
    expect(resolveProfileUrl(creator, 'tiktok')).toBe('https://www.tiktok.com/@right');
  });
  it('separates missing values from zero', () => {
    expect(formatEngagementRate(null)).toBe('—');
    expect(formatEngagementRate(0)).toBe('0.00%');
    expect(formatDiscoveryNumber(null)).toBe('—');
    expect(formatDiscoveryNumber(0)).toBe('0');
  });
  it('excludes guests from invitations but allows registered creators without a connection', () => {
    expect(canInviteCreator(creator)).toBe(false);
    expect(canInviteCreator({ ...creator, isGuest: false, userId: 'u' })).toBe(true);
  });
});
