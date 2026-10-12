import PropTypes from 'prop-types';
import React, { forwardRef } from 'react';

import { Stack, Typography, ButtonBase } from '@mui/material';

import { fDate } from 'src/utils/format-time';

import StatusChip from './StatusChip';
import { COLORS } from '../constants';
import { getSubmittedAt, getSubmissionLabel } from '../utils';

const formatSubmittedAt = (date) =>
  fDate(date, new Date(date).getFullYear() === new Date().getFullYear() ? 'dd MMM' : 'dd MMM yyyy');

const SubmissionItem = forwardRef(({ submission, selected, onSelect }, ref) => {
  const submittedAt = getSubmittedAt(submission);

  return (
    <ButtonBase
      ref={ref}
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
        // The selected row's white highlight sits behind it, in SubmissionList
        '&:hover': { bgcolor: selected ? 'transparent' : COLORS.hover },
      }}
    >
      <Stack sx={{ position: 'relative' }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: COLORS.text }}>
          {getSubmissionLabel(submission)}
        </Typography>
        <Typography sx={{ fontSize: 12, lineHeight: '16px', color: COLORS.textSecondary }}>
          {submittedAt ? `Submitted on ${formatSubmittedAt(submittedAt)}` : 'Unsubmitted'}
        </Typography>
      </Stack>
      <StatusChip status={submission.status} />
    </ButtonBase>
  );
});

export default SubmissionItem;

SubmissionItem.propTypes = {
  submission: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
};
