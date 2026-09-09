import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Box, Stack, Button, Typography } from '@mui/material';

import {
  getDraftProgress,
  getDraftStepLabel,
} from 'src/sections/campaign/create/utils/campaign-steps';

import getDraftName from './get-draft-name';

dayjs.extend(relativeTime);

// ----------------------------------------------------------------------

// Both row buttons share the raised shape; only the fill and label colour differ.
const actionButtonSx = {
  boxSizing: 'border-box',
  height: 38,
  padding: '8px 12px 11px',
  gap: '4px',
  borderRadius: '8px',
  fontFamily: 'InterDisplay',
  fontWeight: 600,
  fontSize: 14,
  lineHeight: '18px',
  textTransform: 'none',
  whiteSpace: 'nowrap',
  transition:
    'transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease-out, border-color 140ms ease-out, box-shadow 140ms ease-out',
};

const deleteButtonSx = {
  ...actionButtonSx,
  minWidth: 70,
  bgcolor: '#D4321C',
  color: '#FFFFFF',
  boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
  '&:hover': { bgcolor: '#BC2C19', boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)' },
  '&:active': {
    bgcolor: '#A82616',
    boxShadow: 'inset 0px -1px 0px rgba(0, 0, 0, 0.45)',
    transform: 'translateY(2px)',
  },
};

const resumeButtonSx = {
  ...actionButtonSx,
  minWidth: 80,
  bgcolor: '#FFFFFF',
  color: '#1340FF',
  border: '1px solid #E8E8E8',
  boxShadow: 'inset 0px -3px 0px #E7E7E7',
  '&:hover': {
    bgcolor: '#F8F8F8',
    border: '1px solid #D6D6D6',
    boxShadow: 'inset 0px -3px 0px #DEDEDE',
  },
  '&:active': {
    bgcolor: '#F0F0F0',
    border: '1px solid #D6D6D6',
    boxShadow: 'inset 0px -1px 0px #DEDEDE',
    transform: 'translateY(2px)',
  },
};

// ----------------------------------------------------------------------

export default function DraftListItem({ draft, onResume, onDelete }) {
  const name = getDraftName(draft);
  const stepLabel = getDraftStepLabel(draft.activeStep);
  const progress = getDraftProgress(draft.activeStep, draft.showAdditionalDetails);
  const savedAt = draft.updatedAt ? dayjs(draft.updatedAt) : null;
  const savedLabel = savedAt?.isValid() ? savedAt.fromNow() : 'recently';

  const resume = () => onResume(draft.id);

  // The row is the primary target, so it carries button semantics -- Resume stays
  // as the visible affordance for anyone scanning the actions column.
  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    resume();
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`Resume ${name}`}
      onClick={resume}
      onKeyDown={handleKeyDown}
      sx={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2,
        p: 2.5,
        bgcolor: '#FFFFFF',
        border: '1px solid #EBEBEB',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'border-color 140ms ease-out, box-shadow 140ms ease-out',
        '&:hover': {
          borderColor: '#D6D6D6',
          boxShadow: '0px 2px 8px rgba(35, 31, 32, 0.06)',
        },
        '&:focus-visible': {
          outline: '2px solid #1340FF',
          outlineOffset: 2,
        },
      }}
    >
      <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          noWrap
          sx={{
            fontFamily: 'InterDisplay',
            fontWeight: 600,
            fontSize: 18,
            lineHeight: '22px',
            color: '#231F20',
          }}
        >
          {name}
        </Typography>

        <Typography
          noWrap
          sx={{
            fontFamily: 'InterDisplay',
            fontWeight: 500,
            fontSize: 14,
            lineHeight: '18px',
            color: '#8E8E93',
          }}
        >
          Last reached {stepLabel} tab - Saved {savedLabel}
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          // Figma caps the progress cluster at 295px -- it reads as a small status
          // chip under the name, not a full-row rule.
          sx={{ pt: 0.5, maxWidth: 295 }}
          aria-label={`${progress}% complete`}
        >
          <Box sx={{ flex: 1, height: 6, borderRadius: '8px', bgcolor: '#D9D9D9' }}>
            <Box
              sx={{
                width: `${progress}%`,
                height: 1,
                borderRadius: '8px',
                bgcolor: '#1340FF',
                transition: 'width 240ms ease-out',
              }}
            />
          </Box>
          <Typography
            sx={{
              fontFamily: 'InterDisplay',
              fontWeight: 500,
              fontSize: 12,
              lineHeight: '16px',
              color: '#636366',
            }}
          >
            {progress}%
          </Typography>
        </Stack>
      </Stack>

      {/* Stop the row's own click here so Delete never reads as "resume". */}
      <Stack
        direction="row"
        spacing={1}
        onClick={(event) => event.stopPropagation()}
        sx={{ justifyContent: 'flex-end', flexShrink: 0 }}
      >
        <Button onClick={() => onDelete(draft)} sx={deleteButtonSx}>
          Delete
        </Button>
        <Button onClick={resume} sx={resumeButtonSx}>
          Resume
        </Button>
      </Stack>
    </Box>
  );
}

DraftListItem.propTypes = {
  draft: PropTypes.object.isRequired,
  onResume: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
