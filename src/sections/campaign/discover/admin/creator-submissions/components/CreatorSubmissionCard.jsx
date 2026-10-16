import PropTypes from 'prop-types';
import React, { memo } from 'react';

import { Box, Stack, Typography } from '@mui/material';

import CtaButton from 'src/components/cta-button';

import MediaPreview from './MediaPreview';
import CreatorHeader from './CreatorHeader';
import ExpandableText from './ExpandableText';
import SubmissionList from './SubmissionList';
import { hasMedia } from '../submission-viewer/utils';
import { COLORS, HOVER_MEDIA, VISIBLE_COUNT, MIN_CARD_WIDTH } from '../utils/constants';
import {
  setExpanded,
  selectSubmission,
  openSubmissionViewer,
  useCreatorSubmissionsStore,
} from '../store/use-creator-submissions-store';

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
  // Captions often start with blank lines, which would fill the 2-line preview
  const caption = selected?.caption?.trim();

  const handleSelect = (submissionId) => selectSubmission(creator.id, submissionId);

  // The viewer only lists creators who have uploaded something
  const canView = submissions.some(hasMedia);
  const handleView = () => openSubmissionViewer({ userId: creator.id, submissionId: selected?.id });

  const handlePillSelect = (submissionId) => {
    const index = submissions.findIndex((s) => s.id === submissionId);
    if (index >= VISIBLE_COUNT) setExpanded(creator.id, true);
    handleSelect(submissionId);
  };

  return (
    <Stack
      spacing={2}
      sx={{
        px: 2.5,
        py: 2,
        borderRadius: 1.5,
        bgcolor: COLORS.surface,
        border: 1,
        borderColor: (theme) => theme.palette.divider,
        position: 'relative',
        containerType: 'inline-size',
        // Shadow sits on its own layer so hover only fades opacity, never repaints the card
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          boxShadow: '0 0 2px #CCC',
          opacity: 0,
          transition: 'opacity .3s ease',
          pointerEvents: 'none',
        },
        [HOVER_MEDIA]: { '&:hover::after': { opacity: 1 } },
      }}
    >
      <CreatorHeader creator={creator} submissions={submissions} onSelect={handlePillSelect} />

      <Stack
        direction="row"
        alignItems="flex-start"
        gap={2}
        sx={{
          minHeight: 240,
          // Only on very narrow screens (one column under the min card width)
          [`@container (max-width: ${MIN_CARD_WIDTH - 1}px)`]: { flexDirection: 'column' },
        }}
      >
        <MediaPreview submission={selected} disabled={!canView || !selected} onClick={handleView} />

        <SubmissionList
          submissions={submissions}
          selectedId={selected?.id}
          expanded={expanded}
          onSelect={handleSelect}
          onToggle={() => setExpanded(creator.id, !expanded)}
        />
      </Stack>

      <Box sx={{ position: 'relative', height: 64 }}>
        {caption ? (
          <ExpandableText
            key={selected.id}
            text={caption}
            sx={textSx}
            expandedSx={captionOverlaySx}
          />
        ) : (
          <Typography sx={{ ...textSx, color: COLORS.muted }}>No caption yet</Typography>
        )}
      </Box>

      <CtaButton
        variant="dark"
        disabled={!canView || !selected}
        onClick={handleView}
        sx={{ alignSelf: 'flex-start' }}
        fullWidth
      >
        View submission
      </CtaButton>
    </Stack>
  );
};

export default memo(CreatorSubmissionCard);

CreatorSubmissionCard.propTypes = {
  creator: PropTypes.object.isRequired,
  submissions: PropTypes.array.isRequired,
};
