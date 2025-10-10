import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, TextField } from '@mui/material';

/**
 * Shared posting link field component for submissions that require posting links
 */
const SubmissionPostingLinkField = ({ 
  postingLink, 
  onPostingLinkChange, 
  isEditable, 
  disabled = false,
  submissionContent = null 
}) => {
  return (
    <>
      <Typography
        variant="body2"
        sx={{
          mt: 2,
          mb: 1,
          fontWeight: 500,
          fontFamily:
            'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: '#636366',
        }}
      >
        Posting Link
      </Typography>

      {isEditable ? (
        <TextField
          fullWidth
          value={postingLink}
          onChange={onPostingLinkChange}
          placeholder="Posting Link"
          disabled={disabled}
          sx={{
            maxWidth: '100%',
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              backgroundColor: 'white',
            },
          }}
        />
      ) : (
        <Typography
          component="a"
          href={submissionContent}
          target="_blank"
          rel="noopener noreferrer"
          variant="body2"
          sx={{
            fontFamily:
              'Inter Display, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#1340FF',
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
            textDecoration: 'underline',
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8,
            },
          }}
        >
          {submissionContent || 'No posting link provided'}
        </Typography>
      )}
    </>
  );
};

SubmissionPostingLinkField.propTypes = {
  postingLink: PropTypes.string.isRequired,
  onPostingLinkChange: PropTypes.func.isRequired,
  isEditable: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  submissionContent: PropTypes.string,
};

export default SubmissionPostingLinkField;