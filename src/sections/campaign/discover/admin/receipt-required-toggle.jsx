import PropTypes from 'prop-types';

import { Box, ButtonBase, CircularProgress } from '@mui/material';

const TRACK_WIDTH = 108;
const TRACK_HEIGHT = 26;
const INSET = 3;
const KNOB_SIZE = TRACK_HEIGHT - INSET * 2;
const KNOB_TRAVEL = TRACK_WIDTH - KNOB_SIZE - INSET * 2;
const TRANSITION = '220ms cubic-bezier(0.4, 0, 0.2, 1)';

const ReceiptRequiredToggle = ({ checked, disabled, loading, onChange }) => (
  <ButtonBase
    role="switch"
    aria-checked={checked}
    aria-label="Receipt required"
    disabled={disabled || loading}
    onClick={(e) => {
      e.stopPropagation();
      onChange(!checked);
    }}
    sx={{
      position: 'relative',
      flexShrink: 0,
      width: TRACK_WIDTH,
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      bgcolor: checked ? '#1340FF' : '#EBEBEB',
      transition: `background-color ${TRANSITION}`,
      '&:hover': { bgcolor: checked ? '#0a2dd9' : '#E0E0E0' },
      '&.Mui-disabled': { opacity: loading ? 1 : 0.5 },
      '&.Mui-focusVisible': { outline: '2px solid #1340FF', outlineOffset: 2 },
    }}
  >
    <Box
      component="span"
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pl: checked ? 0 : `${KNOB_SIZE + INSET}px`,
        pr: checked ? `${KNOB_SIZE + INSET}px` : 0,
        fontSize: 11.5,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        color: checked ? '#ffffff' : '#636366',
        transition: `padding ${TRANSITION}, color ${TRANSITION}`,
      }}
    >
      {checked ? 'Required' : 'Not required'}
    </Box>

    <Box
      component="span"
      sx={{
        position: 'absolute',
        top: INSET,
        left: INSET,
        width: KNOB_SIZE,
        height: KNOB_SIZE,
        borderRadius: '50%',
        bgcolor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translateX(${checked ? KNOB_TRAVEL : 0}px)`,
        transition: `transform ${TRANSITION}`,
      }}
    >
      {loading && <CircularProgress size={10} sx={{ color: '#1340FF' }} />}
    </Box>
  </ButtonBase>
);

ReceiptRequiredToggle.propTypes = {
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onChange: PropTypes.func,
};

export default ReceiptRequiredToggle;
