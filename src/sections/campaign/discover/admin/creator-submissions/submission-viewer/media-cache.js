// Session-wide memory of media shapes + background preloading, so switching
// submissions/creators doesn't start from an unknown shape or a cold load.

export const DEFAULT_RATIO = 9 / 16;

const ratios = new Map();
const preloaded = new Set();

export const getCachedRatio = (url) => ratios.get(url);

export const cacheRatio = (url, ratio) => {
  if (url && Number.isFinite(ratio) && ratio > 0) ratios.set(url, ratio);
};

// Fetches just enough to know the shape (video metadata / the image) and warm the browser cache
export const preloadMedia = ({ kind, url }) => {
  if (!url || preloaded.has(url)) return;
  preloaded.add(url);

  if (kind === 'photo') {
    const image = new Image();
    image.onload = () => cacheRatio(url, image.naturalWidth / image.naturalHeight);
    image.src = url;
    return;
  }

  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.onloadedmetadata = () => {
    cacheRatio(url, video.videoWidth / video.videoHeight);
    // Release the connection; the metadata is cached
    video.removeAttribute('src');
    video.load();
  };
  video.src = url;
};
