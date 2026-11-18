import { useState, useEffect } from 'react';

import { snapBox } from '../snap-box';

const done = new WeakMap();
const running = new WeakMap();

const readPixels = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.onerror = reject;
    img.src = url;
  });

// Snaps each Gemini box to the real text pixels. Cached per fields array.
export const snapFields = (url, fields) => {
  if (done.has(fields)) return Promise.resolve(done.get(fields));
  if (!running.has(fields)) {
    const task = readPixels(url)
      .then((pixels) => fields.map((field) => (field.box ? { ...field, box: snapBox(pixels, field.box) } : field)))
      .catch(() => fields)
      .then((result) => {
        done.set(fields, result);
        return result;
      });
    running.set(fields, task);
  }
  return running.get(fields);
};

// Returns null until the boxes are snapped, so raw boxes never flash on screen.
export function useSnappedFields(url, fields) {
  const [snapped, setSnapped] = useState(() => (fields ? done.get(fields) ?? null : null));

  useEffect(() => {
    if (!fields) {
      setSnapped(null);
      return undefined;
    }

    let cancelled = false;
    setSnapped(done.get(fields) ?? null);
    snapFields(url, fields).then((result) => !cancelled && setSnapped(result));

    return () => {
      cancelled = true;
    };
  }, [url, fields]);

  return snapped;
}
