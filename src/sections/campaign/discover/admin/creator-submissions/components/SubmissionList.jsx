import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';
import React, { useRef, useState, useLayoutEffect } from 'react';

import { Box, Stack, Typography, ButtonBase } from '@mui/material';

import StatusDot from './StatusDot';
import SubmissionItem from './SubmissionItem';
import {
  COLORS,
  EASE_OUT,
  VISIBLE_COUNT,
  EASE_IN_OUT_CSS,
  REDUCED_MOTION_MEDIA,
} from '../constants';

// More dots than this would overflow the button; the count already says how many
const MAX_DOTS = 5;

const SubmissionList = ({ submissions, selectedId, expanded, onSelect, onToggle }) => {
  const visible = submissions.slice(0, VISIBLE_COUNT);
  const hidden = submissions.slice(VISIBLE_COUNT);

  const itemRefs = useRef({});
  const [indicator, setIndicator] = useState(null);

  // The highlight moves with a CSS transform, so it stays smooth while the new media mounts
  useLayoutEffect(() => {
    const isShown = expanded || visible.some((s) => s.id === selectedId);
    const item = isShown ? itemRefs.current[selectedId] : null;
    setIndicator(item ? { top: item.offsetTop, height: item.offsetHeight } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, expanded, submissions]);

  const renderItem = (submission) => (
    <SubmissionItem
      key={submission.id}
      ref={(node) => {
        itemRefs.current[submission.id] = node;
      }}
      submission={submission}
      selected={submission.id === selectedId}
      onSelect={() => onSelect(submission.id)}
    />
  );

  return (
    <Stack sx={{ position: 'relative', flexGrow: 1, minWidth: 0, alignSelf: 'stretch' }}>
      {indicator && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: indicator.height,
            transform: `translateY(${indicator.top}px)`,
            transition: `transform 250ms ${EASE_IN_OUT_CSS}`,
            [REDUCED_MOTION_MEDIA]: { transition: 'none' },
            borderRadius: 1,
            bgcolor: 'common.white',
            border: `1px solid ${COLORS.border}`,
            pointerEvents: 'none',
          }}
        />
      )}
      {visible.map(renderItem)}
      <AnimatePresence initial={false}>
        {expanded && (
          <m.div
            initial={{ opacity: 0, transform: 'translateY(-8px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <Stack>{hidden.map(renderItem)}</Stack>
          </m.div>
        )}
      </AnimatePresence>
      {hidden.length > 0 && (
        <ButtonBase
          onClick={onToggle}
          sx={{
            mt: 0.5,
            px: 1.5,
            py: 1,
            gap: 1,
            justifyContent: 'flex-start',
            borderRadius: 1.5,
            border: '1px dashed #D9D9D9',
          }}
        >
          <Typography
            sx={{ fontSize: 12, fontWeight: 600, lineHeight: '16px', color: COLORS.link }}
          >
            {expanded ? 'Show less' : `+${hidden.length} more`}
          </Typography>
          {!expanded &&
            hidden
              .slice(0, MAX_DOTS)
              .map(({ id, status }) => <StatusDot key={id} status={status} />)}
        </ButtonBase>
      )}
    </Stack>
  );
};

export default SubmissionList;

SubmissionList.propTypes = {
  submissions: PropTypes.array.isRequired,
  selectedId: PropTypes.string,
  expanded: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
};
