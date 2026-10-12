import { useRef, useState, useEffect } from 'react';

export const isHeicFile = (file) =>
  file instanceof File && (/^image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name));

let converter;
const loadConverter = () => {
  converter ??= import('heic-to').then((module) => module.heicTo);
  return converter;
};

let queue = Promise.resolve();
const oneAtATime = (task) => {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
};

export default function useHeicPreviews(files) {
  const [previews, setPreviews] = useState(() => new Map());
  const requested = useRef(new Set());
  const urls = useRef(new Set());
  const mounted = useRef(true);

  useEffect(() => {
    const setPreview = (file, preview) =>
      setPreviews((current) => new Map(current).set(file, preview));

    files.filter(isHeicFile).forEach((file) => {
      if (requested.current.has(file)) return;
      requested.current.add(file);
      setPreview(file, { status: 'pending' });

      oneAtATime(async () => {
        const heicTo = await loadConverter();
        const jpeg = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.8 });
        return URL.createObjectURL(jpeg);
      })
        .then((url) => {
          urls.current.add(url);
          if (mounted.current) setPreview(file, { status: 'ready', url });
        })
        .catch((error) => {
          console.error('HEIC preview conversion failed:', error);
          if (mounted.current) setPreview(file, { status: 'failed' });
        });
    });
  }, [files]);

  useEffect(() => {
    mounted.current = true;
    const created = urls.current;
    return () => {
      mounted.current = false;
      created.forEach((url) => URL.revokeObjectURL(url));
      created.clear();
    };
  }, []);

  return previews;
}
