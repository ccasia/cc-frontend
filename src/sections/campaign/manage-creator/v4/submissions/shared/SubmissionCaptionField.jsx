import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, TextField } from '@mui/material';

/**
 * Shared caption field component for submissions that support captions
 */
const SubmissionCaptionField = ({ 
  caption, 
  onCaptionChange, 
  isEditable, 
  disabled = false,
  required = true 
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="body2"
        sx={{
          mb: 1,
          fontWeight: 700,
          color: '#636366',
        }}
      >
        Post Caption {required && <span style={{ color: 'red' }}>*</span>}
      </Typography>

      {isEditable ? (
        <TextField
          fullWidth
          multiline
          rows={3}
          value={caption}
          onChange={onCaptionChange}
          placeholder="Type your caption here..."
          disabled={disabled}
          sx={{
            maxWidth: '100%',
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              backgroundColor: '#fff',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            },
          }}
        />
      ) : (
        <Typography
          variant="body2"
          sx={{
            color: '#636366',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            minHeight: 'auto',
            p: 1.5,
            border: 'none',
            backgroundColor: 'transparent',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            maxWidth: '100%',
            width: '100%',
            display: 'block',
            overflow: 'visible',
            textOverflow: 'clip',
            WebkitLineClamp: 'unset',
            WebkitBoxOrient: 'unset',
            ml: -1.5,
          }}
        >
          {caption || 'No caption provided'}
        </Typography>
      )}
    </Box>
  );
};

SubmissionCaptionField.propTypes = {
  caption: PropTypes.string.isRequired,
  onCaptionChange: PropTypes.func.isRequired,
  isEditable: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
};

export default SubmissionCaptionField;