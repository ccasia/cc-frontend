import PropTypes from 'prop-types';

import { Box, TextField, Typography, IconButton } from '@mui/material';

const EditableLabel = () => (
  <Box
    sx={{
      position: 'absolute',
      top: 6,
      left: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 0.5,
      zIndex: 1,
    }}
  >
    <Typography sx={{ fontFamily: 'Aileron', fontSize: '10px', fontWeight: 400, color: '#3A3A3C' }}>
      Editable
    </Typography>
  </Box>
);

const PersonaCardEdit = ({
  titleField,
  emojiField,
  contentField,
  countField,
  color,
  wide,
  editableContent,
  setEditableContent,
  onEmojiClick,
  onDelete = null,
}) => {
  const cardWidth = wide ? '910px' : '480px';
  const circleLeft = wide ? '-60px' : '-70px';
  const contentRight = wide ? '12px' : '24px';
  const contentLeft = wide ? '70px' : '82px';
  const contentMaxWidth = wide ? 'calc(920px - 82px)' : 'calc(480px - 106px)';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: wide ? 'flex-start' : 'center',
        gap: 2,
        ...(wide ? { mb: 3, ml: 0, width: '100%', minWidth: 0, overflow: 'visible' } : {}),
      }}
    >
      {/* Card */}
      <Box
        sx={{
          width: cardWidth,
          ...(wide ? { minWidth: '470px', flexShrink: 0, overflow: 'visible' } : {}),
          height: '280px',
          borderRadius: '20px',
          background: '#F5F5F5',
          border: '10px solid #FFFFFF',
          boxShadow: '0px 4px 4px 0px #8E8E9340',
          position: 'relative',
          transition: 'height 0.3s ease',
        }}
      >
        {/* Circle with Icon */}
        <Box
          sx={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '8px solid #FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            left: circleLeft,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            boxShadow: '-4px 4px 4px 0px #8E8E9340',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -30,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              bgcolor: '#F3F4F6',
              px: 1,
              py: 0.5,
              borderRadius: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            <Typography sx={{ fontFamily: 'Aileron', fontSize: '12px', fontWeight: 600, color: '#3A3A3C' }}>
              Editable
            </Typography>
          </Box>
          {/* Inner gradient circle */}
          <Box
            onClick={onEmojiClick}
            sx={{
              width: '95px',
              height: '95px',
              borderRadius: '50%',
              background: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 },
            }}
          >
            {editableContent[emojiField]}
          </Box>
        </Box>

        {/* Content */}
        <Box
          sx={{
            position: 'absolute',
            right: contentRight,
            left: contentLeft,
            top: '20px',
            maxWidth: contentMaxWidth,
            transition: 'top 0.3s ease, transform 0.3s ease',
            overflow: wide ? 'visible' : undefined,
          }}
        >
          <Box sx={{ position: 'relative', mb: 0.75 }}>
            <EditableLabel />
            <TextField
              value={editableContent[titleField]}
              onChange={(e) => setEditableContent({ ...editableContent, [titleField]: e.target.value })}
              fullWidth
              inputProps={{
                maxLength: 200,
                style: {
                  fontFamily: 'Instrument Serif, serif',
                  fontWeight: 400,
                  fontSize: '28px',
                  lineHeight: '32px',
                  color: '#0067D5',
                  textAlign: 'left',
                },
              }}
              sx={{
                bgcolor: '#E5E7EB',
                borderRadius: '8px',
                '& .MuiInputBase-root': {
                  fontFamily: 'Instrument Serif, serif',
                  fontWeight: 400,
                  fontSize: '28px',
                  lineHeight: '32px',
                  color: '#0067D5',
                  textAlign: 'left',
                  padding: '8px',
                  paddingLeft: '6px',
                  paddingTop: '26px',
                  height: '56px',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
              }}
            />
          </Box>

          <Box sx={{ position: 'relative', mb: 0.75 }}>
            <EditableLabel />
            <TextField
              value={editableContent[contentField]}
              onChange={(e) => setEditableContent({ ...editableContent, [contentField]: e.target.value })}
              fullWidth
              multiline
              rows={2}
              sx={{
                bgcolor: '#E5E7EB',
                borderRadius: '8px',
                '& .MuiInputBase-root': {
                  fontFamily: 'Inter Display, sans-serif',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '18px',
                  color: '#000000',
                  padding: '8px',
                  paddingTop: '26px',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
              }}
            />
          </Box>

          <Box sx={{ mt: onDelete ? 1 : 0 }}>
            <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', fontWeight: 600, color: '#636366', mb: 1 }}>
              Number of Creators
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                value={editableContent[countField]}
                onChange={(e) => {
                  const {value} = e.target;
                  if (value === '' || /^\d+$/.test(value)) {
                    setEditableContent({ ...editableContent, [countField]: value });
                  }
                }}
                placeholder="Number of Creators"
                fullWidth
                sx={{
                  ...(onDelete ? { flex: 1 } : {}),
                  bgcolor: '#FFFFFF',
                  borderRadius: '8px',
                  '& .MuiInputBase-root': {
                    padding: '12px',
                    height: '48px',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E5E7EB',
                  },
                }}
                inputProps={{
                  maxLength: 200,
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  style: {
                    fontFamily: 'Aileron',
                    fontSize: '14px',
                    color: '#000000',
                  },
                }}
              />
              {onDelete && (
                <IconButton
                  onClick={onDelete}
                  sx={{
                    color: '#000000',
                    width: '48px',
                    height: '48px',
                    padding: 0,
                    '&:hover': { opacity: 0.7 },
                  }}
                >
                  <img src="/assets/delete.svg" alt="Delete" style={{ width: '20px', height: '20px' }} />
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

PersonaCardEdit.propTypes = {
  titleField: PropTypes.string.isRequired,
  emojiField: PropTypes.string.isRequired,
  contentField: PropTypes.string.isRequired,
  countField: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  wide: PropTypes.bool.isRequired,
  editableContent: PropTypes.object.isRequired,
  setEditableContent: PropTypes.func.isRequired,
  onEmojiClick: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
};

export default PersonaCardEdit;
