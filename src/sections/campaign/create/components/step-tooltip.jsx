import PropTypes from 'prop-types';

import { Box, Fade, Tooltip } from '@mui/material';

import { EASE_OUT } from './motion';

const tooltipSx = {
  bgcolor: '#3A3A3C',
  fontSize: 12,
  fontWeight: 500,
  px: 1,
  py: 0.5,
  borderRadius: 1,
  transformOrigin: 'top center',
  '@keyframes stepTooltipIn': {
    from: { transform: 'scale(0.97)' },
    to: { transform: 'scale(1)' },
  },
  animation: `stepTooltipIn 150ms ${EASE_OUT}`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
};

export const tooltipSlotSx = { display: 'flex', flexShrink: 1, minWidth: 0 };

// Disabled buttons fire no mouse events, so the tooltip listens on a wrapper span
export default function StepTooltip({ title, children }) {
  return (
    <Tooltip
      title={title}
      placement="bottom"
      enterDelay={200}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 150 }}
      slotProps={{ tooltip: { sx: tooltipSx } }}
    >
      <Box component="span" sx={tooltipSlotSx}>
        {children}
      </Box>
    </Tooltip>
  );
}

StepTooltip.propTypes = {
  title: PropTypes.node,
  children: PropTypes.node.isRequired,
};
