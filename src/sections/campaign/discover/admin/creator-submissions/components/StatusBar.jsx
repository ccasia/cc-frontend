import React from 'react';
import PropTypes from 'prop-types';

import { Box, Stack, Tooltip, Typography } from '@mui/material';

import StatusChip from './StatusChip';
import { COLORS } from '../constants';
import { getStatusChip, getSubmissionLabel } from '../utils';

const tooltipSlotProps = {
  tooltip: {
    sx: {
      px: 1.25,
      py: 1,
      bgcolor: 'common.white',
      border: `1px solid ${COLORS.hover}`,
      borderRadius: 1.5,
      boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
    },
  },
  arrow: {
    sx: {
      color: 'common.white',
      '&::before': { border: `1px solid ${COLORS.hover}` },
    },
  },
};

const StatusBar = ({ submissions, onSelect }) => (
  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
    {submissions.map((submission) => (
      <Tooltip
        key={submission.id}
        arrow
        placement="top"
        slotProps={tooltipSlotProps}
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>
              {getSubmissionLabel(submission)}
            </Typography>
            <StatusChip status={submission.status} />
          </Stack>
        }
      >
        <Box
          onClick={() => onSelect(submission.id)}
          sx={{ py: 0.5, cursor: 'pointer', '&:hover > span': { transform: 'scale(1.15, 1.6)' } }}
        >
          <Box
            component="span"
            sx={{
              display: 'block',
              width: 18,
              height: 5,
              borderRadius: 5,
              bgcolor: getStatusChip(submission.status).color,
              transition: 'transform 150ms ease',
            }}
          />
        </Box>
      </Tooltip>
    ))}
  </Stack>
);

export default StatusBar;

StatusBar.propTypes = {
  submissions: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
};
