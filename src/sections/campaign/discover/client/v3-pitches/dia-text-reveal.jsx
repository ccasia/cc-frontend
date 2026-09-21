import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import { m, animate, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';

/** Magic UI Dia text reveal — https://magicui.design/docs/components/dia-text-reveal.md */
const DEFAULT_COLORS = ['#c679c4', '#fa3d1d', '#ffb005', '#e1e1fe', '#0358f7'];
const BAND_HALF = 17;
const SWEEP_START = -BAND_HALF;
const SWEEP_END = 100 + BAND_HALF;

const sweepEase = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

function buildGradient(pos, colors, textColor) {
  const bandStart = pos - BAND_HALF;
  const bandEnd = pos + BAND_HALF;

  if (bandStart >= 100) {
    return `linear-gradient(90deg, ${textColor}, ${textColor})`;
  }

  const n = colors.length;
  const parts = [];

  if (bandStart > 0) {
    parts.push(`${textColor} 0%`, `${textColor} ${bandStart.toFixed(2)}%`);
  }

  colors.forEach((c, i) => {
    const pct = n === 1 ? pos : bandStart + (i / (n - 1)) * BAND_HALF * 2;
    parts.push(`${c} ${pct.toFixed(2)}%`);
  });

  if (bandEnd < 100) {
    parts.push(`transparent ${bandEnd.toFixed(2)}%`, `transparent 100%`);
  }

  return `linear-gradient(90deg, ${parts.join(', ')})`;
}

export default function DiaTextReveal({
  text,
  colors = DEFAULT_COLORS,
  textColor = '#231F20',
  duration = 1.5,
  delay = 0,
  style,
  onComplete,
}) {
  const prefersReducedMotion = useReducedMotion();
  const stopRef = useRef(null);
  const optsRef = useRef({ colors, textColor, duration, delay, onComplete });
  optsRef.current = { colors, textColor, duration, delay, onComplete };

  const sweepPos = useMotionValue(SWEEP_START);
  const backgroundImage = useTransform(sweepPos, (pos) =>
    buildGradient(pos, optsRef.current.colors, optsRef.current.textColor)
  );

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) optsRef.current.onComplete?.();
    };

    if (prefersReducedMotion) {
      sweepPos.set(SWEEP_END);
      finish();
      return undefined;
    }

    sweepPos.set(SWEEP_START);
    const controls = animate(sweepPos, SWEEP_END, {
      duration: optsRef.current.duration,
      delay: optsRef.current.delay,
      ease: sweepEase,
    });
    stopRef.current = () => controls.stop();
    if (typeof controls.then === 'function') {
      controls.then(finish);
    }

    return () => {
      cancelled = true;
      stopRef.current?.();
    };
  }, [prefersReducedMotion, sweepPos, text]);

  return (
    <m.span
      data-testid="dia-text-reveal"
      style={{
        display: 'inline',
        lineHeight: '20px',
        color: 'transparent',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        backgroundSize: '100% 100%',
        backgroundImage,
        ...style,
      }}
    >
      {text}
    </m.span>
  );
}

DiaTextReveal.propTypes = {
  text: PropTypes.string.isRequired,
  colors: PropTypes.arrayOf(PropTypes.string),
  textColor: PropTypes.string,
  duration: PropTypes.number,
  delay: PropTypes.number,
  style: PropTypes.object,
  onComplete: PropTypes.func,
};
