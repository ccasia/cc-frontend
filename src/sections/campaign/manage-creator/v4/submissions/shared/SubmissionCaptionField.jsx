import React from 'react';
import PropTypes from 'prop-types';

import { Box, TextField, Typography } from '@mui/material';

/**
 * Shared caption field component for submissions that support captions
 */
const SubmissionCaptionField = ({ 
  caption, 
  onCaptionChange, 
  isEditable, 
  disabled = false,
  required = true 
}) => (
  <Box sx={{ mb: 2 }}>
    <Typography
      variant="body2"
      fontWeight="bold"
      color="#636366"
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
            mt: 1,
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
            mt: 1,
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
          }}
        >
          {caption || 'No caption provided'}
        </Typography>
      )}
  </Box>
);

SubmissionCaptionField.propTypes = {
  caption: PropTypes.string.isRequired,
  onCaptionChange: PropTypes.func.isRequired,
  isEditable: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
};

export default SubmissionCaptionField;