import React from 'react';
import PropTypes from 'prop-types';

import { Stack, alpha, darken } from '@mui/material';

import StatusDot from './StatusDot';
import { getStatusChip } from '../utils';

const StatusChip = ({ status }) => {
  const { label, color } = getStatusChip(status);

  return (
    <Stack
      component="span"
      direction="row"
      alignItems="center"
      spacing={0.75}
      sx={{
        position: 'relative',
        px: 1.25,
        py: 0.5,
        flexShrink: 0,
        borderRadius: 100,
        bgcolor: alpha(color, 0.16),
        color: darken(color, 0.4),
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      <StatusDot status={status} size={7} />
      <span>{label}</span>
    </Stack>
  );
};

export default StatusChip;

StatusChip.propTypes = {
  status: PropTypes.string,
};
