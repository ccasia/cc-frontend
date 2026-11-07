import PropTypes from 'prop-types';

import Button from '@mui/material/Button';

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

export default function CampaignTabButton({ label, value, active, onClick, sx }) {
  return (
    <Button
      disableRipple
      size="large"
      onClick={onClick}
      data-tab-active={active}
      data-boot-tab={value}
      data-boot-active={active}
      sx={[
        {
          px: 1,
          py: 0.5,
          pb: 1,
          minWidth: 'fit-content',
          position: 'relative',
          color: active ? 'text.primary' : '#8e8e93',
          fontSize: '1.05rem',
          fontWeight: 650,
          transition: `transform 160ms ${EASE_OUT}, color 150ms ease`,
          '&:hover, &:focus': { bgcolor: 'transparent' },
          '&:focus': { outline: 'none' },
          '&:active': { transform: 'scale(0.97)' },
          '&::after': {
            content: '""',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '2px',
            bgcolor: '#1340ff',
            transform: 'scaleX(0)',
            transformOrigin: 'left',
            opacity: 0,
            transition: `transform 200ms ${EASE_OUT}, opacity 150ms ease`,
          },
          // The active underline is the shared CampaignTabIndicator; this is only a hover preview.
          '@media (hover: hover) and (pointer: fine)': {
            '&:hover::after': !active && { transform: 'scaleX(1)', opacity: 0.5 },
          },
          '@media (prefers-reduced-motion: reduce)': {
            '&::after': { transition: 'opacity 150ms ease' },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {label}
    </Button>
  );
}

CampaignTabButton.propTypes = {
  label: PropTypes.node,
  value: PropTypes.string,
  active: PropTypes.bool,
  onClick: PropTypes.func,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
