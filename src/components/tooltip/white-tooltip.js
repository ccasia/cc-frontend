const BORDER = '#EBEBEB';

// White tooltip with a hairline border. Pass to <Tooltip arrow slotProps={whiteTooltipSlotProps}>.
export const whiteTooltipSlotProps = {
  tooltip: {
    sx: {
      px: 1.25,
      py: 1,
      bgcolor: 'common.white',
      border: `1px solid ${BORDER}`,
      borderRadius: 1.5,
      boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
    },
  },
  arrow: {
    sx: {
      color: 'common.white',
      '&::before': { border: `1px solid ${BORDER}` },
    },
  },
};
