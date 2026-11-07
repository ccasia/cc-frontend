import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';

import { ButtonBase } from '@mui/material';

import Iconify from 'src/components/iconify';
import { SECONDARY_ACTION_SX } from 'src/components/campaign/action-button-styles';

import { EASE_OUT } from './motion';

// A field label counts as hidden once its top reaches the lower part of the fade,
// where the text is mostly washed out
const FADED = 40;

// A closed Collapse keeps its fields in layout with visibility: hidden; they do not count
const isShown = (el) =>
  el.checkVisibility
    ? el.checkVisibility({ visibilityProperty: true, checkVisibilityCSS: true })
    : el.offsetParent !== null;

const hiddenLabels = (box, inset) => {
  const bottom = box.getBoundingClientRect().bottom - inset;
  return Array.from(box.querySelectorAll('.MuiFormLabel-root')).filter(
    (el) => isShown(el) && el.getBoundingClientRect().top > bottom - FADED
  );
};

// Tells how many fields sit below the fold, and scrolls to the first one on click.
// Mostly for admins on zoomed-in or large-UI browsers, where a step does not fit.
export default function MoreBelowPill({ scrollRef, stepKey, inset = 0 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return undefined;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setCount(hiddenLabels(box, inset).length));
    };
    update();
    box.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(box);
    Array.from(box.children).forEach((child) => observer.observe(child));
    return () => {
      cancelAnimationFrame(frame);
      box.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [scrollRef, stepKey, inset]);

  const handleClick = () => {
    const box = scrollRef.current;
    const [first] = hiddenLabels(box, inset);
    if (!first) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top =
      box.scrollTop + first.getBoundingClientRect().top - box.getBoundingClientRect().top - 24;
    box.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const show = count > 0;
  // Keep the last number while the pill fades out, so it never reads "0 more fields"
  const shown = useRef(count);
  if (show) shown.current = count;

  return (
    <ButtonBase
      onClick={handleClick}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      sx={{
        ...SECONDARY_ACTION_SX,
        position: 'absolute',
        left: '50%',
        bottom: inset + 16,
        zIndex: 3,
        height: 36,
        padding: '8px 14px 11px',
        fontSize: 13,
        lineHeight: '16px',
        borderRadius: 999,
        boxShadow: `inset 0px -3px 0px #E7E7E7, 0px 6px 16px rgba(35, 31, 32, 0.1)`,
        '&:hover': {
          ...SECONDARY_ACTION_SX['&:hover'],
          boxShadow: `inset 0px -3px 0px #DEDEDE, 0px 6px 16px rgba(35, 31, 32, 0.1)`,
        },
        '&:active': {
          ...SECONDARY_ACTION_SX['&:active'],
          transform: 'translate(-50%, 0) scale(0.97)',
        },
        opacity: show ? 1 : 0,
        visibility: show ? 'visible' : 'hidden',
        pointerEvents: show ? 'auto' : 'none',
        transform: show ? 'translate(-50%, 0)' : 'translate(-50%, 4px)',
        // In: gentle settle. Out: a quick fade, the system is just responding.
        transition: show
          ? `opacity 200ms ${EASE_OUT}, transform 200ms ${EASE_OUT}, visibility 0s`
          : 'opacity 120ms ease-out, transform 120ms ease-out, visibility 0s 120ms',
        '@media (prefers-reduced-motion: reduce)': {
          transform: 'translate(-50%, 0)',
          '&:active': { transform: 'translate(-50%, 0)' },
        },
      }}
    >
      {shown.current} more field{shown.current === 1 ? '' : 's'}
      <Iconify icon="eva:arrow-downward-fill" width={16} />
    </ButtonBase>
  );
}

MoreBelowPill.propTypes = {
  scrollRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  stepKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  inset: PropTypes.number,
};
