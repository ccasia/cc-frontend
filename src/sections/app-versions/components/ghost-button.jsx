import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import { ButtonBase } from '@mui/material';

import { COLORS } from '../utils';

// Small text button with a muted hover, used inside fields and card headers
const GhostButton = forwardRef(({ sx, children, ...other }, ref) => (
  <ButtonBase
    ref={ref}
    sx={{
      gap: 0.5,
      px: 1,
      height: 28,
      borderRadius: 1,
      fontSize: 12,
      fontWeight: 600,
      color: 'text.secondary',
      transition: 'background-color 120ms, color 120ms',
      '&:hover, &:focus-visible, &[aria-expanded="true"]': {
        bgcolor: COLORS.muted,
        color: COLORS.text,
      },
      ...sx,
    }}
    {...other}
  >
    {children}
  </ButtonBase>
));

GhostButton.propTypes = {
  sx: PropTypes.object,
  children: PropTypes.node,
};

export default GhostButton;
