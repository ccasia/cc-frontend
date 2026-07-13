import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

// Persona card (read-only) used in PCR report display mode. Comic/Educator render narrow (480px);
// Third/Fourth/Fifth render wide (890px) — dimensions below mirror the original per-card markup exactly.
const PersonaCardDisplay = ({ titleField, emojiField, contentField, color, wide, editableContent }) => {
  const cardWidth = wide ? '890px' : '480px';
  const contentMaxWidth = wide ? 'calc(890px - 92px)' : 'calc(480px - 92px)';

  return (
    <Box
      sx={{
        width: cardWidth,
        ...(wide ? { minWidth: '470px', flexShrink: 0 } : {}),
        minHeight: '220px',
        borderRadius: '20px',
        background: '#F5F5F5',
        border: '10px solid #FFFFFF',
        boxShadow: '0px 4px 4px 0px #8E8E9340',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Circle with Icon */}
      <Box
        sx={{
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: '#FFFFFF',
          border: '8px solid #FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          left: '-80px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1,
          boxShadow: '-4px 4px 4px 0px #8E8E9340',
        }}
      >
        <Box
          sx={{
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
          }}
        >
          {editableContent[emojiField]}
        </Box>
      </Box>

      {/* Content */}
      <Box
        sx={{
          ml: '80px',
          maxWidth: contentMaxWidth,
          pr: 3,
          py: 3,
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Instrument Serif, serif',
            fontWeight: 400,
            fontStyle: 'normal',
            fontSize: '32px',
            lineHeight: '36px',
            letterSpacing: '0%',
            color: '#0067D5',
            mb: 1.5,
            textAlign: 'left',
          }}
        >
          {editableContent[titleField]}
        </Typography>

        <Typography
          sx={{
            fontFamily: 'Inter Display, sans-serif',
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '22px',
            color: '#000000',
            textAlign: 'left',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {editableContent[contentField]}
        </Typography>
      </Box>
    </Box>
  );
};

PersonaCardDisplay.propTypes = {
  titleField: PropTypes.string.isRequired,
  emojiField: PropTypes.string.isRequired,
  contentField: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  wide: PropTypes.bool.isRequired,
  editableContent: PropTypes.object.isRequired,
};

export default PersonaCardDisplay;
