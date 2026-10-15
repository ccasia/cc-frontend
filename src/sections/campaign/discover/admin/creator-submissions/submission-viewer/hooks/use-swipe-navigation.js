import { useRef, useEffect } from 'react';

// Accumulated wheel delta (px) that counts as one swipe
const SWIPE_THRESHOLD = 50;
// Quiet gap that ends a gesture
const GESTURE_IDLE_MS = 120;
// After a swipe fires, ignore everything this long (fingers may still be moving)
const MIN_LOCK_MS = 300;
// Recent wheel magnitudes kept to tell momentum (decaying) from a new swipe (rising)
const HISTORY_SIZE = 8;
// A new swipe must be at least this much stronger than the momentum it interrupts
const NEW_GESTURE_RATIO = 1.3;
// Ignore near-zero noise at the end of momentum when comparing
const MIN_NEW_GESTURE_DELTA = 6;
// Firefox can report lines/pages instead of pixels
const LINE_HEIGHT_PX = 16;

const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

const toPixels = (event) => {
  let scale = 1;
  if (event.deltaMode === 1) scale = LINE_HEIGHT_PX;
  if (event.deltaMode === 2) scale = window.innerHeight;
  return { x: event.deltaX * scale, y: event.deltaY * scale };
};

/**
 * Trackpad two-finger swipes (wheel events) -> one navigation action per gesture.
 * Follows natural scrolling: swipe left = next, swipe up = next.
 *
 * macOS keeps sending decaying "momentum" wheel events after the fingers lift. Those are
 * swallowed, but a fresh swipe during momentum is detected by its deltas rising again,
 * so quick consecutive swipes each count.
 *
 * @param {React.RefObject<HTMLElement>} ref element that receives the swipes
 * @param {{ onUp?: Function, onDown?: Function, onLeft?: Function, onRight?: Function }} handlers
 * @param {{ enabled?: boolean }} [options]
 */
export default function useSwipeNavigation(ref, handlers, { enabled = true } = {}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return undefined;

    let deltaX = 0;
    let deltaY = 0;
    let locked = false;
    let lockedAt = 0;
    let magnitudes = [];
    let idleTimer;

    const resetGesture = () => {
      deltaX = 0;
      deltaY = 0;
      locked = false;
      magnitudes = [];
    };

    // Momentum only decays; a rise in the recent deltas means the fingers are moving again
    const isNewGesture = () => {
      if (magnitudes.length < HISTORY_SIZE) return false;
      const half = HISTORY_SIZE / 2;
      const older = average(magnitudes.slice(0, half));
      const recent = average(magnitudes.slice(half));
      return recent >= MIN_NEW_GESTURE_DELTA && recent > older * NEW_GESTURE_RATIO;
    };

    const onWheel = (event) => {
      // Pinch-to-zoom arrives as ctrl + wheel
      if (event.ctrlKey) return;

      // Stops page scroll and the browser's swipe-to-go-back
      event.preventDefault();

      const { x, y } = toPixels(event);

      clearTimeout(idleTimer);
      idleTimer = setTimeout(resetGesture, GESTURE_IDLE_MS);

      magnitudes.push(Math.max(Math.abs(x), Math.abs(y)));
      if (magnitudes.length > HISTORY_SIZE) magnitudes.shift();

      if (locked) {
        if (performance.now() - lockedAt < MIN_LOCK_MS || !isNewGesture()) return;
        // A new swipe started during the previous one's momentum
        deltaX = 0;
        deltaY = 0;
        locked = false;
        magnitudes = [];
      }

      deltaX += x;
      deltaY += y;

      const { onUp, onDown, onLeft, onRight } = handlersRef.current;
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      const distance = isHorizontal ? deltaX : deltaY;

      if (Math.abs(distance) < SWIPE_THRESHOLD) return;

      locked = true;
      lockedAt = performance.now();

      if (isHorizontal) (deltaX > 0 ? onRight : onLeft)?.();
      else (deltaY > 0 ? onDown : onUp)?.();
    };

    // React's onWheel is passive, so preventDefault needs a native listener
    element.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      element.removeEventListener('wheel', onWheel);
      clearTimeout(idleTimer);
    };
  }, [ref, enabled]);
}
