import React from 'react';
import PropTypes from 'prop-types';

import { Box } from '@mui/material';

import SubmissionFeedback from './SubmissionFeedback';
import SubmissionCaptionField from './SubmissionCaptionField';
import SubmissionPostingLinkField from './SubmissionPostingLinkField';

/**
 * Right sidebar container for all submission types that combines:
 * - Caption field (if supported)
 * - Posting link field (if required)
 * - Feedback display
 */
const SubmissionSection = ({
  // Caption props
  hasCaption = false,
  caption = '',
  onCaptionChange,
  isCaptionEditable = false,
  
  // Posting link props
  hasPostingLink = false,
  postingLink = '',
  onPostingLinkChange,
  isPostingLinkEditable = false,
  submissionContent = null,
  
  // Feedback props
  feedback = [],
  hasChangesRequired = false,
  
  // General state
  uploading = false,
  postingLoading = false,
}) => (
  <Box>
    {/* Caption Field */}
    {hasCaption && (
      <SubmissionCaptionField
        caption={caption}
        onCaptionChange={onCaptionChange}
        isEditable={isCaptionEditable}
        disabled={uploading}
      />
    )}

    {/* Posting Link Field */}
    {hasPostingLink && (
      <SubmissionPostingLinkField
        postingLink={postingLink}
        onPostingLinkChange={onPostingLinkChange}
        isEditable={isPostingLinkEditable}
        disabled={postingLoading}
        submissionContent={submissionContent}
      />
    )}

    {/* Feedback Section */}
    <SubmissionFeedback
      feedback={feedback}
      hasChangesRequired={hasChangesRequired}
    />
  </Box>
);

SubmissionSection.propTypes = {
  // Caption props
  hasCaption: PropTypes.bool,
  caption: PropTypes.string,
  onCaptionChange: PropTypes.func,
  isCaptionEditable: PropTypes.bool,
  
  // Posting link props
  hasPostingLink: PropTypes.bool,
  postingLink: PropTypes.string,
  onPostingLinkChange: PropTypes.func,
  isPostingLinkEditable: PropTypes.bool,
  submissionContent: PropTypes.string,
  
  // Feedback props
  feedback: PropTypes.array,
  hasChangesRequired: PropTypes.bool,
  
  // General state
  uploading: PropTypes.bool,
  postingLoading: PropTypes.bool,
};

export default SubmissionSection;