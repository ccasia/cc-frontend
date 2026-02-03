// Ensures a URL always has a protocol and www prefix if needed (defaults to https://www.{domain})
export function normalizeUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  
  // Remove leading slashes
  url = url.replace(/^\/+/, '');
  
  // Add www. if not present and doesn't start with a protocol
  if (!url.startsWith('www.') && !url.startsWith('http')) {
    url = `www.${url}`;
  }
  
  // Prepend https://
  return `https://${url}`;
}
