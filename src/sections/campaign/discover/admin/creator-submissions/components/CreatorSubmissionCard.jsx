import React from 'react';
import PropTypes from 'prop-types';

import { Box, Stack, Typography } from '@mui/material';

import MediaPreview from './MediaPreview';
import CreatorHeader from './CreatorHeader';
import ExpandableText from './ExpandableText';
import SubmissionList from './SubmissionList';
import { COLORS, VISIBLE_COUNT } from '../constants';
import {
  setExpanded,
  selectSubmission,
  useCreatorSubmissionsStore,
} from '../store/useCreatorSubmissionsStore';

const textSx = { fontSize: 14, lineHeight: '20px', color: COLORS.text };

const captionOverlaySx = {
  left: -20,
  right: -20,
  px: 2.5,
  pb: 2,
  bgcolor: COLORS.surface,
  borderRadius: '0 0 20px 20px',
  boxShadow: '0px 12px 16px -8px rgba(0, 0, 0, 0.12)',
};

const CreatorSubmissionCard = ({ creator, submissions }) => {
  const selectedId = useCreatorSubmissionsStore((state) => state.selectedByCreator[creator.id]);
  const expanded = useCreatorSubmissionsStore((state) => !!state.expandedByCreator[creator.id]);
  const selected = submissions.find((s) => s.id === selectedId) ?? submissions[0];

  const handleSelect = (submissionId) => selectSubmission(creator.id, submissionId);

  const handlePillSelect = (submissionId) => {
    const index = submissions.findIndex((s) => s.id === submissionId);
    if (index >= VISIBLE_COUNT) setExpanded(creator.id, true);
    handleSelect(submissionId);
  };

  return (
    <Stack spacing={2} sx={{ px: 2.5, py: 2, borderRadius: 2.5, bgcolor: COLORS.surface }}>
      <CreatorHeader creator={creator} submissions={submissions} onSelect={handlePillSelect} />

      <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ minHeight: 240 }}>
        <MediaPreview submission={selected} />
        <SubmissionList
          submissions={submissions}
          selectedId={selected?.id}
          expanded={expanded}
          onSelect={handleSelect}
          onToggle={() => setExpanded(creator.id, !expanded)}
        />
      </Stack>

      <Box sx={{ position: 'relative', height: 64 }}>
        {selected?.caption ? (
          <ExpandableText
            key={selected.id}
            text={selected.caption}
            sx={textSx}
            expandedSx={captionOverlaySx}
          />
        ) : (
          <Typography sx={{ ...textSx, color: COLORS.muted }}>No caption yet</Typography>
        )}
      </Box>
    </Stack>
  );
};

export default CreatorSubmissionCard;

CreatorSubmissionCard.propTypes = {
  creator: PropTypes.object.isRequired,
  submissions: PropTypes.array.isRequired,
};
