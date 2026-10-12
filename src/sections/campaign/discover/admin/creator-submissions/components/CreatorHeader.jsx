import React from 'react';
import PropTypes from 'prop-types';

import { Link, Stack, Avatar, Typography } from '@mui/material';

import StatusBar from './StatusBar';
import { COLORS, NEEDS_ACTION } from '../utils/constants';
import { getInitials, getDisplayName, getCreatorHandle } from '../utils/utils';

// Wraps the right-hand side onto its own line only when the card is too narrow for both
const rowProps = {
  direction: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  columnGap: 2,
};

const leftSx = { flex: '1 1 120px', minWidth: 0 };

const CreatorHeader = ({ creator, submissions, onSelect }) => {
  const needAction = submissions.filter((s) => NEEDS_ACTION.includes(s.status)).length;
  const handle = getCreatorHandle(creator);
  const displayName = getDisplayName(creator);

  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Avatar
        src={creator.photoURL}
        alt={displayName}
        sx={{
          width: 40,
          height: 40,
          bgcolor: 'common.white',
          color: COLORS.text,
          border: '1px solid #EBEBEB',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {getInitials(displayName)}
      </Avatar>

      <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
        <Stack {...rowProps}>
          <Typography
            noWrap
            dir="auto"
            title={displayName}
            sx={{
              ...leftSx,
              fontSize: 16,
              fontWeight: 600,
              lineHeight: '20px',
              color: COLORS.text,
            }}
          >
            {displayName}
          </Typography>
          <Typography
            noWrap
            sx={{ minWidth: 0, fontSize: 14, lineHeight: '20px', color: COLORS.textSecondary }}
          >
            <Typography
              component="span"
              sx={{ font: 'inherit', fontWeight: 600, color: COLORS.text }}
            >
              {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
            </Typography>
            {needAction > 0 && ` · ${needAction} ${needAction === 1 ? 'needs' : 'need'} action`}
          </Typography>
        </Stack>

        <Stack {...rowProps} sx={{ minHeight: 16, rowGap: 0.5 }}>
          {handle ? (
            <Link
              href={handle.url}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              noWrap
              title={`@${handle.username}`}
              sx={{
                ...leftSx,
                fontSize: 12,
                lineHeight: '16px',
                color: COLORS.textSecondary,
                '&:hover': { color: COLORS.link },
              }}
            >
              @{handle.username}
            </Link>
          ) : (
            <span style={leftSx} />
          )}
          <StatusBar submissions={submissions} onSelect={onSelect} />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default CreatorHeader;

CreatorHeader.propTypes = {
  creator: PropTypes.object.isRequired,
  submissions: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
};
