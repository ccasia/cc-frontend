/**
 * Public preview URLs derived from a post link. Nothing is stored.
 *
 * Instagram and TikTok both block hotlinked thumbnails from the browser.
 * Their official embed URLs still load in an iframe, so the modal can show
 * the post itself without writing media into the database.
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
