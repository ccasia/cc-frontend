import PropTypes from 'prop-types';
import { useRef, useState, useLayoutEffect } from 'react';

import Box from '@mui/material/Box';

// One underline that slides to the active tab, so a switch reads as one moving object.
// It measures its own parent row: a parent's ref is not attached yet when this mounts.
export default function CampaignTabIndicator({ activeKey }) {
  const barRef = useRef(null);
  const [rect, setRect] = useState(null);
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const container = barRef.current?.parentElement;
    if (!container) return undefined;

    const measure = () => {
      const tab = container.querySelector('[data-tab-active="true"]');
      if (!tab || !tab.offsetWidth) {
        setRect(null);
        return;
      }
      setRect({
        x: tab.offsetLeft,
        y: tab.offsetTop + tab.offsetHeight - 2,
        width: tab.offsetWidth,
      });
    };

    measure();

    // Counts, font loading and wrapping all change tab sizes after the first paint.
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [activeKey]);

  // Place the first position without a slide; only later switches animate.
  useLayoutEffect(() => {
    if (!rect || animate) return undefined;
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [rect, animate]);

  return (
    <Box
      ref={barRef}
      aria-hidden
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        m: '0 !important',
        width: '1px',
        height: '2px',
        bgcolor: '#1340ff',
        pointerEvents: 'none',
        transformOrigin: 'left',
        opacity: rect ? 1 : 0,
        transform: rect
          ? `translate(${rect.x}px, ${rect.y}px) scaleX(${rect.width})`
          : 'scaleX(0)',
        // On-screen movement from tab to tab: ease-in-out, so the slide is visible end to end.
        transition: animate ? 'transform 250ms cubic-bezier(0.77, 0, 0.175, 1)' : 'none',
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    />
  );
}

CampaignTabIndicator.propTypes = {
  activeKey: PropTypes.string,
};
