import { it, expect, describe } from 'vitest';

import { platformLabel, validateProfileLink } from './profile-link-validation';

/**
 * The same case table as cc-backend/test/guestProfileExtraction/
 * profileUrlNormalizer.test.ts. If these two ever disagree, the server still
 * decides, but the admin sees the wrong message.
 */

describe('canonical variants converge', () => {
  it.each([
    'https://instagram.com/example',
    'https://www.instagram.com/example/',
    'https://www.instagram.com/example/?hl=en',
    'https://www.instagram.com/example/#bio',
    'http://www.instagram.com/example',
    'www.instagram.com/example',
    'instagram.com/example',
    '  https://www.instagram.com/Example/  ',
    'https://www.instagram.com/EXAMPLE?igsh=abc123',
  ])('%s becomes one Instagram identity', (input) => {
    const result = validateProfileLink(input);
    expect(result.ok).toBe(true);
    expect(result.profile.canonicalKey).toBe('instagram:example');
    expect(result.profile.canonicalUrl).toBe('https://www.instagram.com/example');
  });

  it.each([
    'https://tiktok.com/@example',
    'https://www.tiktok.com/@example/',
    'https://www.tiktok.com/@example/?lang=en',
    'tiktok.com/@example',
    'https://www.tiktok.com/@Example/',
  ])('%s becomes one TikTok identity', (input) => {
    const result = validateProfileLink(input);
    expect(result.ok).toBe(true);
    expect(result.profile.canonicalKey).toBe('tiktok:example');
  });
});

describe('the platform is derived, never picked', () => {
  it('reads it from the link', () => {
    expect(validateProfileLink('https://www.instagram.com/x').profile.platform).toBe('instagram');
    expect(validateProfileLink('https://www.tiktok.com/@x').profile.platform).toBe('tiktok');
  });

  it('labels it for a read-only field', () => {
    expect(platformLabel('instagram')).toBe('Instagram');
    expect(platformLabel('tiktok')).toBe('TikTok');
    expect(platformLabel(null)).toBe('—');
  });
});

describe('rejected links', () => {
  it.each([
    ['', 'EMPTY'],
    // eslint-disable-next-line no-script-url
    ['javascript:alert(1)', 'UNSUPPORTED_SCHEME'],
    ['https://user:pass@www.instagram.com/example', 'USERINFO_NOT_ALLOWED'],
    ['https://www.instagram.com:8443/example', 'PORT_NOT_ALLOWED'],
    ['https://www.youtube.com/@example', 'UNSUPPORTED_HOST'],
    ['https://m.tiktok.com/@example', 'UNSUPPORTED_HOST'],
    ['https://vm.tiktok.com/ZMabcdef/', 'UNSUPPORTED_HOST'],
    ['https://www.instagram.com/p/C9aBcDeFgHi/', 'NOT_A_PROFILE_URL'],
    ['https://www.instagram.com/reel/C9aBcDeFgHi/', 'NOT_A_PROFILE_URL'],
    ['https://www.instagram.com/explore/tags/travel/', 'NOT_A_PROFILE_URL'],
    ['https://www.tiktok.com/@example/video/7401234567890123456', 'NOT_A_PROFILE_URL'],
    ['https://www.tiktok.com/example', 'NOT_A_PROFILE_URL'],
    ['https://www.instagram.com/.example', 'INVALID_USERNAME'],
    ['https://www.instagram.com/exa..mple', 'INVALID_USERNAME'],
    ['https://www.instagram.com/ex-ample', 'INVALID_USERNAME'],
  ])('rejects %s', (input, code) => {
    const result = validateProfileLink(input);
    expect(result.ok).toBe(false);
    expect(result.code).toBe(code);
    expect(result.message.length).toBeGreaterThan(0);
  });
});
