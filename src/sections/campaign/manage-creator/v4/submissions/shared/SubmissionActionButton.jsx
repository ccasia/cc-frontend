import React from 'react';
import PropTypes from 'prop-types';

import { Box, Stack, Typography, LinearProgress } from '@mui/material';

/**
 * Shared submit/reupload button component for all submission types
 */
// eslint-disable-next-line arrow-body-style
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

  // View Feedback Button (NEW)
  showViewFeedbackButton = false,
  onViewFeedback,
  hasNewFeedback = false,

  // Button text overrides
  reuploadText = 'Reupload Draft',
  submitText = 'Submit',
  submittedText = 'Submitted',
  uploadingText = 'Uploading...',
  postingText = 'Submitting...',

  sx,
}) => {
  const buttonColor = (() => {
    if (isDisabled) return '#A8A8A8';
    if (isReuploadButton) return '#1340FF';
    return '#3A3A3C';
  })();
  
  const buttonBorderColor = (() => {
    if (isDisabled) return '#0000001A';
    if (isReuploadButton) return '#00000073';
    return '#000';
  })();

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

  const hasLeadingFeedback = showViewFeedbackButton && onViewFeedback;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        mt: { xs: 2 },
        position: 'relative',
        zIndex: 10,
        gap: 2,
        ...sx,
      }}
    >
      {/* View Feedback — start / left */}
      {hasLeadingFeedback && (
        <Typography
          component="button"
          type="button"
          onClick={onViewFeedback}
          sx={{
            flexShrink: 0,
            px: 0,
            py: 1,
            textAlign: 'left',
            bgcolor: 'transparent',
            fontWeight: 800,
            fontSize: 14,
            color: hasNewFeedback ? '#1340FF' : '#919191',
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              opacity: 0.8,
            },
          }}
        >
          {hasNewFeedback ? 'View New Feedback' : 'View Feedback'}
        </Typography>
      )}

      {/* Progress + primary action — right; grows when only this cluster is shown */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 2,
          flex: hasLeadingFeedback || uploading ? '1 1 auto' : undefined,
          minWidth: 0,
          justifyContent: hasLeadingFeedback || uploading ? 'flex-end' : { xs: 'center', md: 'flex-end' },
          width: hasLeadingFeedback || uploading ? undefined : '100%',
        }}
      >
        {uploading && (
          <Box sx={{ flex: '1 1 auto', minWidth: 0, mr: hasLeadingFeedback ? 0 : 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Uploading... {Math.round(uploadProgress)}%
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        <Typography
          component="button"
          type="button"
          onClick={getButtonAction()}
          disabled={isDisabled}
          sx={{
            flexShrink: 0,
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
  
  // View Feedback Button (NEW)
  showViewFeedbackButton: PropTypes.bool,
  onViewFeedback: PropTypes.func,
  hasNewFeedback: PropTypes.bool,
  
  // Button text overrides
  reuploadText: PropTypes.string,
  submitText: PropTypes.string,
  submittedText: PropTypes.string,
  uploadingText: PropTypes.string,
  postingText: PropTypes.string,
  sx: PropTypes.object,
};

export default SubmissionActionButton;