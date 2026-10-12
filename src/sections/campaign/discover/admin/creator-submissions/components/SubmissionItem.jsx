import PropTypes from 'prop-types';
import React, { useRef, useState, useEffect, forwardRef } from 'react';

import { Stack, Typography, ButtonBase } from '@mui/material';

import { fDate } from 'src/utils/format-time';

import StatusChip from './StatusChip';
import { COLORS } from '../utils/constants';
import { getSubmittedAt, getSubmissionLabel } from '../utils/utils';
import { openSubmissionViewer } from '../store/use-creator-submissions-store';

// Second click within this window opens the viewer
const DOUBLE_CLICK_MS = 600;

const formatSubmittedAt = (date) =>
  fDate(date, new Date(date).getFullYear() === new Date().getFullYear() ? 'dd MMM' : 'dd MMM yyyy');

const SubmissionItem = forwardRef(({ submission, selected, onSelect }, ref) => {
  const submittedAt = getSubmittedAt(submission);
  const clickTimeout = useRef();
  const [armed, setArmed] = useState(false);

  useEffect(() => () => clearTimeout(clickTimeout.current), []);

  const handleClick = () => {
    clearTimeout(clickTimeout.current);

    if (armed) {
      setArmed(false);
      openSubmissionViewer({ userId: submission.user.id, submissionId: submission.id });
      return;
    }

    onSelect?.();
    setArmed(true);
    clickTimeout.current = setTimeout(() => setArmed(false), DOUBLE_CLICK_MS);
  };

  return (
    <ButtonBase
      ref={ref}
      disableRipple
      aria-pressed={selected}
      onClick={handleClick}
      sx={{
        minHeight: 60,
        px: 1.5,
        flexShrink: 0,
        gap: 1,
        justifyContent: 'space-between',
        textAlign: 'left',
        borderRadius: 1,
        overflow: 'hidden',
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
