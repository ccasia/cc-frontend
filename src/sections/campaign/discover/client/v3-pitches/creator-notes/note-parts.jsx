import React from 'react';
import PropTypes from 'prop-types';
import { isToday } from 'date-fns';

import { Box, Avatar } from '@mui/material';

import { fTime, fDateTime } from 'src/utils/format-time';

import { toNoteSegments } from './mentions';

export const NOTE_COLORS = {
  text: '#231F20',
  secondary: '#636366',
  border: '#EBEBEB',
  inputBorder: '#D9D9DE',
  surface: '#F7F7F8',
  accent: '#1340FF',
  accentSoft: '#F3F5FF',
};

const AVATAR_COLORS = ['#1340FF', '#7A4FD6', '#1F8A70', '#C2571A'];

const colorFor = (id = '') =>
  AVATAR_COLORS[[...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_COLORS.length];

const initialsOf = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

export const formatNoteTime = (date) =>
  isToday(new Date(date)) ? fTime(date) : fDateTime(date, 'd MMM, p');

export const firstName = (name = '') => name.split(/\s+/)[0];

export function NoteAvatar({ user, size = 28, sx }) {
  return (
    <Avatar
      src={user?.photoURL}
      alt={user?.name}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        fontSize: size * 0.38,
        fontWeight: 600,
        color: '#FFFFFF',
        bgcolor: colorFor(user?.id),
        ...sx,
      }}
    >
      {initialsOf(user?.name)}
    </Avatar>
  );
}

NoteAvatar.propTypes = {
  user: PropTypes.object,
  size: PropTypes.number,
  sx: PropTypes.object,
};

export function NoteText({ text }) {
  return toNoteSegments(text).map((segment, index) =>
    segment.type === 'mention' ? (
      <Box
        // Segments never reorder, so the index is a stable key.
        // eslint-disable-next-line react/no-array-index-key
        key={index}
        component="span"
        sx={{ color: NOTE_COLORS.accent, fontWeight: 600 }}
      >
        @{segment.name}
      </Box>
    ) : (
      // eslint-disable-next-line react/no-array-index-key
      <React.Fragment key={index}>{segment.value}</React.Fragment>
    )
  );
}

NoteText.propTypes = {
  text: PropTypes.string,
};
