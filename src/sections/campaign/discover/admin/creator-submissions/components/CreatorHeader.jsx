import React from 'react';
import PropTypes from 'prop-types';

import { Link, Stack, Avatar, Typography } from '@mui/material';

import StatusBar from './StatusBar';
import { COLORS, NEEDS_ACTION } from '../constants';
import { getInitials, getCreatorHandle } from '../utils';

const rowProps = {
  direction: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  spacing: 2,
};

const CreatorHeader = ({ creator, submissions, onSelect }) => {
  const needAction = submissions.filter((s) => NEEDS_ACTION.includes(s.status)).length;
  const handle = getCreatorHandle(creator);

  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Avatar
        src={creator.photoURL}
        alt={creator.name}
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
        {getInitials(creator.name)}
      </Avatar>

      <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
        <Stack {...rowProps}>
          <Typography
            noWrap
            sx={{ fontSize: 16, fontWeight: 600, lineHeight: '20px', color: COLORS.text }}
          >
            {creator.name}
          </Typography>
          <Typography
            noWrap
            sx={{ flexShrink: 0, fontSize: 14, lineHeight: '20px', color: COLORS.textSecondary }}
          >
            <Typography
              component="span"
              sx={{ font: 'inherit', fontWeight: 600, color: COLORS.text }}
            >
              {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
            </Typography>
            {needAction > 0 && ` · ${needAction} need action`}
          </Typography>
        </Stack>

        <Stack {...rowProps} sx={{ minHeight: 16 }}>
          {handle ? (
            <Link
              href={handle.url}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              noWrap
              sx={{
                fontSize: 12,
                lineHeight: '16px',
                color: COLORS.textSecondary,
                '&:hover': { color: COLORS.link },
              }}
            >
              @{handle.username}
            </Link>
          ) : (
            <span />
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
