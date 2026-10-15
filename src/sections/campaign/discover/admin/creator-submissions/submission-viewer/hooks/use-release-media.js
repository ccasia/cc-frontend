import { useEffect } from 'react';

// Removing a <video> from the page doesn't reliably stop its download, so abandoned
// media keeps eating bandwidth/connections. Clearing src + load() aborts it.
export default function useReleaseMedia(ref) {
  useEffect(() => {
    const element = ref.current;

    return () => {
      if (!element) return;
      element.removeAttribute('src');
      element.load();
    };
  }, [ref]);
}
