import PropTypes from 'prop-types';
import React, { useId } from 'react';
import { m, LayoutGroup, AnimatePresence } from 'framer-motion';

import { Stack, Typography, ButtonBase } from '@mui/material';

import StatusDot from './StatusDot';
import SubmissionItem from './SubmissionItem';
import { COLORS, VISIBLE_COUNT } from '../constants';

const SubmissionList = ({ submissions, selectedId, expanded, onSelect, onToggle }) => {
  const groupId = useId();
  const visible = submissions.slice(0, VISIBLE_COUNT);
  const hidden = submissions.slice(VISIBLE_COUNT);

  const renderItem = (submission) => (
    <SubmissionItem
      key={submission.id}
      submission={submission}
      selected={submission.id === selectedId}
      onSelect={() => onSelect(submission.id)}
    />
  );

  return (
    <LayoutGroup id={groupId}>
      <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
        {visible.map(renderItem)}
        <AnimatePresence initial={false}>
          {expanded && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
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
            {!expanded && hidden.map(({ id, status }) => <StatusDot key={id} status={status} />)}
          </ButtonBase>
        )}{' '}
      </Stack>
    </LayoutGroup>
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
