import React from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import { Stack, Typography, ButtonBase } from '@mui/material';

import { fDate } from 'src/utils/format-time';

import StatusChip from './StatusChip';
import { COLORS } from '../constants';
import { getSubmittedAt, getSubmissionLabel } from '../utils';

const SubmissionItem = ({ submission, selected, onSelect }) => {
  const submittedAt = getSubmittedAt(submission);

  return (
    <ButtonBase
      disableRipple
      aria-pressed={selected}
      onClick={onSelect}
      sx={{
        minHeight: 60,
        px: 1.5,
        flexShrink: 0,
        gap: 1,
        justifyContent: 'space-between',
        textAlign: 'left',
        borderRadius: 1,
        transition: 'background-color 150ms ease',
        '&:hover': { bgcolor: COLORS.hover },
      }}
    >
      {selected && (
        <m.div
          layoutId="active-submission"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 8,
            background: '#FFFFFF',
            border: `1px solid ${COLORS.border}`,
          }}
        />
      )}
      <Stack sx={{ position: 'relative' }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: COLORS.text }}>
          {getSubmissionLabel(submission)}
        </Typography>
        <Typography sx={{ fontSize: 12, lineHeight: '16px', color: COLORS.textSecondary }}>
          {submittedAt ? `Submitted on ${fDate(submittedAt, 'dd MMM')}` : 'Unsubmitted'}
        </Typography>
      </Stack>
      <StatusChip status={submission.status} />
    </ButtonBase>
  );
};

export default SubmissionItem;

SubmissionItem.propTypes = {
  submission: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
};
