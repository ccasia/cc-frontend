import PropTypes from 'prop-types';
import { useRef, useEffect, useLayoutEffect } from 'react';
import { animate, useMotionValue, useReducedMotion, useMotionTemplate } from 'framer-motion';

import { Box, Stack } from '@mui/material';

const RADIUS = 8;

// A spring keeps its speed when a fast click retargets it, so the highlight never
// stalls between steps the way a restarted ease-in-out curve does
const SPRING = { type: 'spring', duration: 0.3, bounce: 0 };

const SIDES = ['top', 'right', 'bottom', 'left'];

const insetsOf = (container, el) => ({
  top: el.offsetTop,
  right: container.clientWidth - el.offsetLeft - el.offsetWidth,
  bottom: container.clientHeight - el.offsetTop - el.offsetHeight,
  left: el.offsetLeft,
});

// One white layer over the step pills, with a blue copy of the row inside it. It clips
// itself to the current step, so a step change glides it from the old step to the new
// one, and the pill under it turns white on the same frame the layer reaches it.
export default function StepHighlight({ activeKey, children }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();

  const top = useMotionValue(0);
  const right = useMotionValue(0);
  const bottom = useMotionValue(0);
  const left = useMotionValue(0);
  const clipPath = useMotionTemplate`inset(${top}px ${right}px ${bottom}px ${left}px round ${RADIUS}px)`;
  const values = useRef({ top, right, bottom, left }).current;

  // Where the highlight was last sent: { index, width }
  const placed = useRef(null);

  // Paint the clip straight onto the node; no React render per frame
  useEffect(
    () =>
      clipPath.on('change', (clip) => {
        if (ref.current) ref.current.style.clipPath = clip;
      }),
    [clipPath]
  );

  useLayoutEffect(() => {
    const layer = ref.current;
    const container = layer?.parentElement;
    if (!container) return undefined;

    const buttons = () => Array.from(container.querySelectorAll('button'));
    const moving = () => SIDES.some((side) => values[side].isAnimating());
    const jumpTo = (el) => {
      const insets = insetsOf(container, el);
      SIDES.forEach((side) => values[side].jump(insets[side]));
      layer.style.clipPath = clipPath.get();
    };
    const glideTo = (el) => {
      const insets = insetsOf(container, el);
      SIDES.forEach((side) => animate(values[side], insets[side], SPRING));
    };

    const list = buttons();
    const index = list.findIndex((el) => el.getAttribute('aria-current') === 'step');
    const step = list[index];
    if (!step?.offsetWidth) {
      layer.style.opacity = '0';
      placed.current = null;
      return undefined;
    }

    const prev = placed.current;
    const width = container.clientWidth;
    // The row changed size in the same update, so a resting clip points at an empty
    // spot: start from where the old step is now. A moving clip just keeps going.
    if (prev && prev.width !== width && !moving() && list[prev.index]) jumpTo(list[prev.index]);
    if (prev && !reduceMotion) glideTo(step);
    else jumpTo(step);
    layer.style.opacity = '1';
    placed.current = { index, width };

    // Layout moved with no step change (e.g. the save status grew): keep up with it
    const observer = new ResizeObserver(() => {
      const el = buttons()[placed.current?.index ?? -1];
      if (!el?.offsetWidth) return;
      if (moving()) glideTo(el);
      else jumpTo(el);
      placed.current = { ...placed.current, width: container.clientWidth };
    });
    observer.observe(container);
    buttons().forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeKey, reduceMotion, clipPath, values]);

  return (
    <Box
      ref={ref}
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        m: '0 !important',
        zIndex: 2,
        bgcolor: '#fff',
        pointerEvents: 'none',
        opacity: 0,
        clipPath: 'inset(50%)',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="center" sx={{ height: 1 }}>
        {children}
      </Stack>
    </Box>
  );
}

StepHighlight.propTypes = {
  activeKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  children: PropTypes.node,
};
