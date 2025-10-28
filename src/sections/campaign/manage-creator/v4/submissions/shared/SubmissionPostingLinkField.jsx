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
        fontWeight={'bold'}
        color={'#636366'}
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
            mt: 1,
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
            color: '#0062CD',
            lineHeight: 1.5,
            mt: 1,
            p: 2,
            border: '1px solid #EBEBEB',
            borderRadius: 1,
            backgroundColor: '#fff',
            width: '100%',
            display: 'block',
            cursor: 'pointer',
            textDecoration: 'none'
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