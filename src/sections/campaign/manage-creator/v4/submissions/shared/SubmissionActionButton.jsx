import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, LinearProgress, Stack } from '@mui/material';

/**
 * Shared submit/reupload button component for all submission types
 */
const SubmissionActionButton = ({
  // Button state
  isDisabled,
  isReuploadButton,
  isSubmitButton,
  
  // Loading states
  uploading = false,
  postingLoading = false,
  uploadProgress = 0,
  
  // Actions
  onReupload,
  onSubmit,
  onPostingLinkSubmit,
  
  // Conditional logic
  isPostingLinkEditable = false,
  
  // Button text overrides
  reuploadText = 'Reupload Draft',
  submitText = 'Submit',
  submittedText = 'Submitted',
  uploadingText = 'Uploading...',
  postingText = 'Submitting...'
}) => {
  const buttonColor = isDisabled ? '#A8A8A8' : isReuploadButton ? '#1340FF' : '#3A3A3C';
  const buttonBorderColor = isDisabled ? '#0000001A' : isReuploadButton ? '#00000073' : '#000';

  const getButtonText = () => {
    if (uploading) return uploadingText;
    if (postingLoading) return postingText;
    if (isReuploadButton) return reuploadText;
    if (isSubmitButton) return submitText;
    return !postingLoading ? submitText : submittedText;
  };

  const getButtonAction = () => {
    if (isReuploadButton) return onReupload;
    if (isPostingLinkEditable) return onPostingLinkSubmit;
    return onSubmit;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: { xs: 'center', md: 'flex-end' },
        alignItems: 'center',
        mt: { xs: 2 },
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ flex: 1, mr: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Uploading... {Math.round(uploadProgress)}%
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}
      
      {/* Action Button */}
      <Typography
        component="button"
        onClick={getButtonAction()}
        disabled={isDisabled}
        sx={{
          px: 2,
          py: 1,
          bgcolor: buttonColor,
          fontWeight: 800,
          fontSize: 14,
          color: '#fff',
          border: '1px solid',
          borderBottom: '3px solid',
          borderRadius: 1,
          borderColor: buttonBorderColor,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          '&:disabled': {
            bgcolor: '#A8A8A8',
            color: 'white',
          },
        }}
      >
        {getButtonText()}
      </Typography>
    </Box>
  );
};

SubmissionActionButton.propTypes = {
  // Button state
  isDisabled: PropTypes.bool.isRequired,
  isReuploadButton: PropTypes.bool.isRequired,
  isSubmitButton: PropTypes.bool.isRequired,
  
  // Loading states
  uploading: PropTypes.bool,
  postingLoading: PropTypes.bool,
  uploadProgress: PropTypes.number,
  
  // Actions
  onReupload: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onPostingLinkSubmit: PropTypes.func,
  
  // Conditional logic
  isPostingLinkEditable: PropTypes.bool,
  
  // Button text overrides
  reuploadText: PropTypes.string,
  submitText: PropTypes.string,
  submittedText: PropTypes.string,
  uploadingText: PropTypes.string,
  postingText: PropTypes.string,
};

export default SubmissionActionButton;