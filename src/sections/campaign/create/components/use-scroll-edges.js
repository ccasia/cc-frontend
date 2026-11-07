import { useState, useEffect } from 'react';

// Tells if a scroll box has more content above or below the visible part
export default function useScrollEdges(ref) {
  const [edges, setEdges] = useState({ above: false, below: false });

  useEffect(() => {
    const box = ref.current;
    if (!box) return undefined;

    const update = () => {
      const above = box.scrollTop > 1;
      const below = box.scrollTop + box.clientHeight < box.scrollHeight - 1;
      setEdges((prev) => (prev.above === above && prev.below === below ? prev : { above, below }));
    };

    update();
    box.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(box);
    Array.from(box.children).forEach((child) => observer.observe(child));
    const mutations = new MutationObserver(() => {
      Array.from(box.children).forEach((child) => observer.observe(child));
      update();
    });
    mutations.observe(box, { childList: true });

    return () => {
      box.removeEventListener('scroll', update);
      observer.disconnect();
      mutations.disconnect();
    };
  }, [ref]);

  return edges;
}
