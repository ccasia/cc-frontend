/**
 * Public preview URLs derived from a post link. The fallback preview.
 *
 * New scrapes store a thumbnail copy in our bucket, and that is shown first.
 * Older scrapes kept the provider thumbnail, which expires and cannot be
 * hotlinked. Their official embed URLs still load in an iframe.
 */

export function embedFromPostUrl(url) {
  if (typeof url !== 'string' || !url) return null;

  const instagram = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  if (instagram) {
    return `https://www.instagram.com/p/${instagram[1]}/embed/`;
  }

  const tiktok = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i);
  if (tiktok) {
    return `https://www.tiktok.com/embed/v2/${tiktok[1]}`;
  }

  return null;
}
