import { useRef, useEffect, useLayoutEffect } from 'react';

function scrollParent(node) {
  for (let el = node.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) return el;
  }
  return document.scrollingElement;
}

// When the list gets shorter than the scroll position, the browser clamps the scroll and the
// page jumps. The spacer takes up the missing height so the filters stay where they were, and
// gives it back as the user scrolls up.
export default function useHoldScroll(spacerRef) {
  const hold = useRef({ scroller: null, top: 0, reserve: 0 });

  const fit = (restore) => {
    const spacer = spacerRef.current;
    if (!spacer?.isConnected) return;
    if (!hold.current.scroller) {
      hold.current.scroller = scrollParent(spacer);
      hold.current.top = hold.current.scroller.scrollTop;
    }

    const { scroller, top, reserve } = hold.current;
    const slack = scroller.scrollHeight - top - scroller.clientHeight;
    // Sub-pixel scroll positions leave a fraction of slack; acting on it makes the spacer creep.
    const gap = Math.abs(slack) < 1 ? 0 : slack;
    let next = Math.max(0, Math.round(reserve - gap));
    // Scrolling only gives space back; only a shorter list (a render) may add it.
    if (!restore) next = Math.min(next, reserve);
    if (next !== reserve) {
      hold.current.reserve = next;
      spacer.style.height = `${next}px`;
    }
    if (restore && Math.abs(scroller.scrollTop - top) > 1) scroller.scrollTop = top;
  };

  useEffect(() => {
    // Scroll events don't bubble, so listen in the capture phase and pick out our scroller.
    const onScroll = (event) => {
      const { scroller } = hold.current;
      const target = event.target === document ? document.scrollingElement : event.target;
      if (!scroller || target !== scroller) return;
      hold.current.top = scroller.scrollTop;
      fit(false);
    };
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', onScroll, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Every render: runs before paint, after the list shrinks but before the clamp's scroll event.
  useLayoutEffect(() => fit(true));
}
