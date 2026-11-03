import PropTypes from 'prop-types';
import { useRef, useState, useLayoutEffect } from 'react';

import { alpha } from '@mui/material/styles';
import { Box, ButtonBase } from '@mui/material';

import { ACTION_BLUE } from '../utils';

const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';

const rowSx = {
  display: 'flex',
  gap: '2px',
  p: '3px',
  minWidth: 1,
  width: 'max-content',
};

const tabSx = {
  flex: { xs: '1 0 auto', sm: 'none' },
  gap: 0.75,
  px: { xs: 1, sm: 1.5 },
  py: 0.875,
  borderRadius: 1,
  fontSize: 13,
  // Buttons don't inherit the page font by default; the copy row must match them exactly.
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
};

// The selected pill is a copy of the row styled as selected and clipped to the chosen tab.
// Moving the clip slides the pill, and its text changes colour in step with it.
export default function CampaignStatusTabs({ tab, tabs, onChange }) {
  const rowRef = useRef(null);
  const [clip, setClip] = useState(null);
  const widthKey = tabs.map((t) => `${t.label}${t.count}`).join('|');

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return undefined;

    const update = () => {
      const button = row.querySelector('[aria-pressed="true"]');
      if (!button) return;
      // Sub-pixel rects, so the clip sits exactly on the tab.
      const r = row.getBoundingClientRect();
      const b = button.getBoundingClientRect();
      const px = (n) => `${Math.max(0, n).toFixed(2)}px`;
      setClip(
        `inset(${px(b.top - r.top)} ${px(r.right - b.right)} ${px(r.bottom - b.bottom)} ${px(b.left - r.left)} round 8px)`
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(row);
    return () => observer.disconnect();
  }, [tab, widthKey]);

  return (
    <Box
      role="group"
      aria-label="Show campaigns"
      sx={(theme) => ({
        flex: { xs: '1 1 100%', sm: 'none' },
        maxWidth: 1,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        borderRadius: '10px',
        bgcolor: alpha(theme.palette.grey[500], 0.16),
      })}
    >
      <Box ref={rowRef} sx={{ ...rowSx, position: 'relative' }}>
        {tabs.map((item) => {
          const selected = item.value === tab;
          return (
            <ButtonBase
              key={item.value}
              aria-pressed={selected}
              onClick={() => onChange(item.value)}
              sx={{
                ...tabSx,
                color: 'grey.700',
                // No press scale: the clip is measured from this button's rect, and the sliding
                // pill is the feedback.
                transition: 'color 150ms ease, background-color 150ms ease',
                '@media (hover: hover) and (pointer: fine)': {
                  '&:hover': {
                    color: 'text.primary',
                    bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
                  },
                },
                '&:focus-visible': { outline: `2px solid ${ACTION_BLUE}`, outlineOffset: 1 },
              }}
            >
              <TabContent item={item} />
            </ButtonBase>
          );
        })}

        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            // Applied after the clip, so the shadow follows the pill's shape.
            filter: 'drop-shadow(0 1px 1px rgba(18, 18, 20, 0.12))',
            visibility: clip ? 'visible' : 'hidden',
          }}
        >
          <Box
            sx={{
              ...rowSx,
              height: 1,
              bgcolor: 'background.paper',
              clipPath: clip ?? 'none',
              transition: `clip-path 200ms ${EASE_IN_OUT}`,
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
          >
            {tabs.map((item) => (
              <Box
                key={item.value}
                sx={{
                  ...tabSx,
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: 'text.primary',
                }}
              >
                <TabContent item={item} active />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

CampaignStatusTabs.propTypes = {
  tab: PropTypes.string.isRequired,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string, label: PropTypes.string, count: PropTypes.number })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};

function TabContent({ item, active = false }) {
  let countColor = active ? 'text.secondary' : 'grey.500';
  if (!item.count) countColor = 'text.disabled';

  return (
    <>
      {/* Same weight in both rows, so the copy lines up with the real tabs. */}
      <Box component="span" sx={{ fontWeight: 500 }}>
        {item.label}
      </Box>
      <Box
        component="span"
        sx={{ fontSize: 12, color: countColor, fontVariantNumeric: 'tabular-nums' }}
      >
        {item.count}
      </Box>
    </>
  );
}

TabContent.propTypes = {
  item: PropTypes.shape({ label: PropTypes.string, count: PropTypes.number }).isRequired,
  active: PropTypes.bool,
};
