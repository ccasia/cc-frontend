import { useState, useEffect } from 'react';

// How many px of the scroll box sit under a fixed bar (0 when the bar is hidden)
export default function useBottomOverlap(boxRef, barRef) {
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    const box = boxRef.current;
    const bar = barRef.current;
    if (!box || !bar) return undefined;

    const measure = () => {
      const shown = getComputedStyle(bar).display !== 'none';
      const next = shown
        ? Math.max(
            0,
            Math.round(box.getBoundingClientRect().bottom - bar.getBoundingClientRect().top)
          )
        : 0;
      setOverlap(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(bar);
    window.addEventListener('resize', measure);
    // The dialog opens with a small scale, which skews the first measure
    document.addEventListener('animationend', measure, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      document.removeEventListener('animationend', measure, true);
    };
  }, [boxRef, barRef]);

  return overlap;
}
