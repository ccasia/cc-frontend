import PropTypes from 'prop-types';

import { Box } from '@mui/material';

import { pressSx, EASE_OUT } from './motion';

// The real buttons only ever look done or upcoming. The current step is shown by the
// blue-on-white copy of the row inside the sliding highlight (see StepHighlight), so a pill
// that becomes current keeps its last look under it and nothing has to be timed.
const lookSx = {
  // Same blue as the current step, so the filled part of the row reads as one run;
  // the tick is what marks it done rather than current
  done: {
    bgcolor: '#1340FF',
    borderColor: '#1340FF',
    boxShadow: 'none',
    color: '#fff',
    fontWeight: 500,
    transition: 'background-color 150ms ease, color 150ms ease, transform 140ms ease',
    '@media (hover: hover) and (pointer: fine)': {
      '&:hover:not(:disabled)': { bgcolor: '#0F35E0', borderColor: '#0F35E0' },
    },
  },
  upcoming: {
    bgcolor: '#fff',
    borderColor: '#E7E7E7',
    boxShadow: '0px -1.5px 0px 0px #E7E7E7 inset',
    color: '#8E8E93',
    fontWeight: 500,
    transition: 'color 150ms ease, transform 140ms ease',
  },
  current: { fontWeight: 600 },
};

// The current step: a white pill with a blue edge, so it stands out from the blue
// done steps around it
const overlaySx = {
  bgcolor: 'transparent',
  borderColor: '#1340FF',
  boxShadow: '0px -1.5px 0px 0px #1340FF inset',
  color: '#1340FF',
  transition: 'none',
};

// `look` is done/upcoming for a real button, or the real state for the highlight copy
export const stepButtonSx = (look, clickable, overlay = false) => ({
  appearance: 'none',
  font: 'inherit',
  position: 'relative',
  zIndex: 1,
  height: 45,
  borderRadius: 1,
  border: '1px solid',
  cursor: clickable ? 'pointer' : 'default',
  '&:focus-visible': { outline: '2px solid #1340FF', outlineOffset: 2 },
  ...lookSx[look],
  ...(overlay ? overlaySx : clickable && pressSx),
});

function CheckMark() {
  return (
    <Box
      component="svg"
      viewBox="0 0 16 16"
      aria-hidden
      sx={{
        width: 14,
        height: 14,
        flexShrink: 0,
        color: 'inherit',
        '& path': {
          strokeDasharray: 1,
          strokeDashoffset: 0,
          '@keyframes stepCheckDraw': {
            from: { strokeDashoffset: 1 },
            to: { strokeDashoffset: 0 },
          },
          animation: `stepCheckDraw 200ms ${EASE_OUT} 120ms backwards`,
        },
        '@media (prefers-reduced-motion: reduce)': {
          '& path': { animation: 'none' },
          '@keyframes stepCheckFade': { from: { opacity: 0 }, to: { opacity: 1 } },
          animation: 'stepCheckFade 200ms ease',
        },
      }}
    >
      <path
        d="M3.5 8.5l3 3 6-7"
        pathLength="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}

// The visible label and its hidden sizer share one grid cell
const contentSx = { gridArea: '1 / 1', display: 'flex', alignItems: 'center', gap: 0.5 };

export default function StepPill({ label, state, look, clickable, onClick, overlay }) {
  const shown = overlay ? state : look;
  const buttonProps = overlay
    ? { component: 'div' }
    : {
        component: 'button',
        type: 'button',
        onClick,
        disabled: !clickable,
        'aria-current': state === 'current' ? 'step' : undefined,
      };
  return (
    <Box
      {...buttonProps}
      sx={{
        ...stepButtonSx(shown, clickable, overlay),
        display: 'grid',
        placeItems: 'center',
        minWidth: { sm: 72, md: 92, lg: 104 },
        flexShrink: 1,
        px: { sm: 1, md: 1.5 },
        fontSize: { sm: 12, lg: 13 },
        whiteSpace: 'nowrap',
      }}
    >
      <Box component="span" sx={contentSx}>
        {shown === 'done' && <CheckMark />}
        {label}
      </Box>
      {/* Holds the widest look (tick + bold text), so a state change never resizes the pill */}
      <Box
        component="span"
        aria-hidden
        sx={{ ...contentSx, visibility: 'hidden', fontWeight: 600 }}
      >
        <Box component="span" sx={{ width: 14, flexShrink: 0 }} />
        {label}
      </Box>
    </Box>
  );
}

StepPill.propTypes = {
  label: PropTypes.string.isRequired,
  state: PropTypes.oneOf(['current', 'done', 'upcoming']).isRequired,
  look: PropTypes.oneOf(['done', 'upcoming']),
  clickable: PropTypes.bool,
  onClick: PropTypes.func,
  overlay: PropTypes.bool,
};
