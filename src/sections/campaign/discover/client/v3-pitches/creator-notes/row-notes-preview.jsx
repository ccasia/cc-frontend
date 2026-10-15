import React from 'react';
import PropTypes from 'prop-types';

import { Box, ButtonBase, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { toPlainText } from './mentions';
import { firstName, NOTE_COLORS } from './note-parts';

const buttonSx = {
  gap: 0.75,
  maxWidth: 320,
  justifyContent: 'flex-start',
  alignItems: 'center',
  textAlign: 'left',
  borderRadius: 0.75,
  fontSize: 12.5,
  lineHeight: '18px',
  color: NOTE_COLORS.secondary,
  '&:hover': { color: NOTE_COLORS.text },
  '&.Mui-focusVisible': { outline: `2px solid ${NOTE_COLORS.accent}`, outlineOffset: 2 },
};

export default function RowNotesPreview({ summary, onOpen }) {
  const handleClick = (event) => {
    // The row itself opens the pitch modal.
    event.stopPropagation();
    onOpen();
  };

  const latest = summary?.pinned ?? summary?.lastNote;

  if (!latest) {
    return (
      <ButtonBase disableRipple onClick={handleClick} sx={buttonSx}>
        <Iconify icon="solar:document-text-bold" width={14} />
        Add note
      </ButtonBase>
    );
  }

  const unread = summary.unreadCount || 0;
  const author = summary.lastNote ? `${firstName(latest.author?.name)}:` : 'Sidenote:';

  return (
    <ButtonBase
      disableRipple
      onClick={handleClick}
      aria-label={unread ? `Open notes, ${unread} unread` : 'Open notes'}
      sx={buttonSx}
    >
      <Box
        component="span"
        sx={{
          width: 6,
          height: 6,
          flexShrink: 0,
          borderRadius: '50%',
          bgcolor: unread ? NOTE_COLORS.accent : '#C7C7CC',
        }}
      />
      <Typography
        component="span"
        noWrap
        sx={{ fontSize: 'inherit', lineHeight: 'inherit', color: 'inherit' }}
      >
        <Box component="b" sx={{ fontWeight: 600, color: NOTE_COLORS.text }}>
          {author}
        </Box>{' '}
        {toPlainText(latest.text)}
      </Typography>
    </ButtonBase>
  );
}

RowNotesPreview.propTypes = {
  summary: PropTypes.object,
  onOpen: PropTypes.func.isRequired,
};
