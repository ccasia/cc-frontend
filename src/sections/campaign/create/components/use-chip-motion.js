import { useRef, useState, useLayoutEffect } from 'react';

import { EASE_OUT } from './motion';

// Same timing as ChipSelect, so every chip field in the step moves alike
const ENTER_MS = 150;
const EXIT_MS = 120;
const SLIDE_MS = 200;

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// With reduced motion a chip only fades
const frames = (from, to) =>
  reduceMotion()
    ? [{ opacity: from }, { opacity: to }]
    : [
        { opacity: from, transform: `scale(${from ? 1 : 0.9})` },
        { opacity: to, transform: `scale(${to ? 1 : 0.9})` },
      ];

const rectsOf = (root) =>
  new Map(
    Array.from(root?.querySelectorAll('[data-chip]') ?? [], (el) => [
      el.dataset.chip,
      el.getBoundingClientRect(),
    ])
  );

/**
 * Motion for a multi-pick field whose chips can change without the user touching it
 * (e.g. the form adds or drops client managers). A new chip fades and scales in. A
 * chip that leaves stays as a ghost in its old place while it fades out, then the
 * chips after it slide over. Each chip needs `data-chip={key}`; pass the rendered
 * chips through the returned `withGhosts`.
 */
export default function useChipMotion(rootRef, items, getKey) {
  const keys = items.map((item) => String(getKey(item)));
  const keyString = keys.join('\u0000');
  const shown = useRef(null);
  const [ghosts, setGhosts] = useState([]);
  const slideFrom = useRef(null);

  useLayoutEffect(() => {
    const previous = shown.current;
    shown.current = { items, keys };
    // The chips already there when the field mounts stay still
    if (!previous) return;

    rootRef.current?.querySelectorAll('[data-chip]').forEach((el) => {
      if (!previous.keys.includes(el.dataset.chip)) {
        el.animate(frames(0, 1), { duration: ENTER_MS, easing: EASE_OUT });
      }
    });

    const gone = previous.items
      .map((item, index) => ({ item, index, key: previous.keys[index] }))
      .filter(({ key }) => !keys.includes(key));
    if (gone.length) setGhosts(gone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyString]);

  useLayoutEffect(() => {
    if (!ghosts.length) return undefined;
    const root = rootRef.current;
    const fades = Array.from(root?.querySelectorAll('[data-chip-ghost]') ?? [], (el) =>
      el.animate(frames(1, 0), { duration: EXIT_MS, easing: EASE_OUT, fill: 'forwards' })
    );
    const id = setTimeout(() => {
      slideFrom.current = rectsOf(root);
      setGhosts([]);
    }, EXIT_MS);
    return () => {
      clearTimeout(id);
      fades.forEach((fade) => fade.cancel());
    };
  }, [ghosts, rootRef]);

  // Once a ghost is gone, the chips after it glide into its place
  useLayoutEffect(() => {
    const before = slideFrom.current;
    if (!before) return;
    slideFrom.current = null;
    if (reduceMotion()) return;
    rootRef.current?.querySelectorAll('[data-chip]').forEach((el) => {
      const was = before.get(el.dataset.chip);
      if (!was) return;
      const now = el.getBoundingClientRect();
      const dx = was.left - now.left;
      const dy = was.top - now.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], {
        duration: SLIDE_MS,
        easing: EASE_OUT,
      });
    });
  });

  // Puts each ghost back at its old index, in order, so it fades where the chip was
  const withGhosts = (chips, renderGhost) => {
    const list = [...chips];
    ghosts
      .filter(({ key }) => !keys.includes(key))
      .forEach(({ item, index }) =>
        list.splice(Math.min(index, list.length), 0, renderGhost(item))
      );
    return list;
  };

  return withGhosts;
}
