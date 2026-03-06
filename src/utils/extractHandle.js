export const extractHandle = (url) => {
  if (!url) return null;

  // Regular expression to match Instagram and TikTok URLs (protocol is optional)
    const instagramRegex = /(?:https?:\/\/)?(www\.)?instagram\.com\/([A-Za-z0-9_.]+)/;
    const tiktokRegex = /(?:https?:\/\/)?(www\.)?(vm\.|m\.|vt\.)?tiktok\.com\/@([A-Za-z0-9_.]+)/;

  let match = url.match(instagramRegex);
  if (match) {
    return { platform: 'Instagram', handle: match[2] };
  }

  match = url.match(tiktokRegex);
  if (match) {
    // Extract the username from the TikTok URL
    const tiktokHandleMatch = url.match(/tiktok\.com\/@([^/]+)/);
    if (tiktokHandleMatch) {
      return { platform: 'TikTok', handle: tiktokHandleMatch[1] };
    }
  }

  return null; // Return null if no valid handle is found
}