/**
 * Get all status-related flags for a submission
 * @param {Object} submission - The submission object
 * @param {Object} campaign - The campaign object (optional)
 * @returns {Object} Status flags
 */
export const getSubmissionStatusFlags = (submission, campaign = null) => {
  const {status} = submission;
  const campaignType = campaign?.campaignType || submission.campaign?.campaignType;

  // Basic status flags
  const isApproved = ['APPROVED', 'CLIENT_APPROVED'].includes(status);
  const hasChangesRequired = ['CHANGES_REQUIRED', 'REJECTED'].includes(status);
  const isPosted = status === 'POSTED';
  const isPendingReview = status === 'PENDING_REVIEW';
  const isNotStarted = status === 'NOT_STARTED';
  const isClientApproved = status === 'CLIENT_APPROVED';

  // Posting link related flags (only for non-UGC campaigns)
  const requiresPostingLink = campaignType !== 'ugc';
  const needsPostingLink = isApproved && !submission.content && requiresPostingLink;
  const isPostingLinkRejected = status === 'REJECTED' && !submission.content &&
    (submission.video?.length > 0 || submission.photos?.length > 0);
  const isPostingLinkEditable = (needsPostingLink || isPostingLinkRejected) && requiresPostingLink;

  return {
    // Basic status
    isApproved,
    hasChangesRequired,
    isPosted,
    isPendingReview,
    isNotStarted,
    isClientApproved,

    // Posting link
    requiresPostingLink,
    needsPostingLink,
    isPostingLinkRejected,
    isPostingLinkEditable,
  };
};

/**
 * Get relevant feedback for display
 * Standardized across all submission types
 * @param {Object} submission - The submission object
 * @returns {Array} Filtered and sorted feedback array
 */
export const getRelevantFeedback = (submission) => {
  if (!submission.feedback?.length) return [];

  const sentFeedback = submission.feedback.filter((feedback) => feedback.sentToCreator);

  // First, try to find feedback matching this specific submission
  const matchingFeedback = sentFeedback.filter((feedback) => feedback.submissionId === submission.id);

  if (matchingFeedback.length > 0) {
    const sortedFeedback = matchingFeedback.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return [sortedFeedback[0]];
  }

  // Fallback: return most recent sent feedback
  if (sentFeedback.length > 0) {
    const sortedFeedback = sentFeedback.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return [sortedFeedback[0]];
  }

  return [];
};

/**
 * Determine button states based on submission status and current state
 * @param {Object} params - Parameters object
 * @returns {Object} Button state flags
 */
export const getButtonStates = ({
  submission,
  isReuploadMode,
  selectedFiles,
  caption,
  uploading,
  postingLoading,
  isPostingLinkEditable,
  isPostingLinkRejected,
  hasCaption = false,
}) => {
  const {status} = submission;

  // Determine if disabled - improved logic to prevent re-submission during upload/review
  const isDisabled =
    uploading ||
    (hasCaption && !caption.trim()) ||
    postingLoading ||
    status === 'PENDING_REVIEW' ||
    status === 'POSTED' ||
    status === 'APPROVED' || // Added - prevent submission when already approved
    (status !== 'CHANGES_REQUIRED' &&
      status !== 'NOT_STARTED' &&
      status !== 'CLIENT_APPROVED' &&
      !isPostingLinkEditable) ||
    ((status === 'NOT_STARTED' || status === 'CLIENT_APPROVED') &&
      selectedFiles.length === 0 &&
      !isPostingLinkEditable);

  // Determine if showing reupload button
  const isReuploadButton =
    status === 'CHANGES_REQUIRED' && !isReuploadMode && !isPostingLinkRejected;

  // Determine if showing submit button - improved to prevent showing during PENDING_REVIEW
  const isSubmitButton =
    (isReuploadMode && status === 'CHANGES_REQUIRED') ||
    ((status === 'NOT_STARTED' || status === 'CLIENT_APPROVED') &&
      selectedFiles.length > 0 &&
      !uploading); // Added - prevent showing submit button during upload

  return {
    isDisabled,
    isReuploadButton,
    isSubmitButton,
  };
};

/**
 * Determine if caption should be editable
 * @param {Object} params - Parameters object
 * @returns {boolean} Whether caption is editable
 */
export const getIsCaptionEditable = ({
  isReuploadMode,
  submittedMediaCount,
  hasSubmitted,
  selectedFilesCount,
  hasChangesRequired,
}) => {
  if (hasSubmitted && !isReuploadMode && !hasChangesRequired) {
    return false;
  }

  return (
    isReuploadMode ||
    submittedMediaCount === 0 ||
    (!hasSubmitted && selectedFilesCount > 0) ||
    hasChangesRequired
  );
};

/**
 * Prepare FormData for video submission
 * @param {Object} params - Parameters object
 * @returns {FormData} Prepared FormData
 */
export const prepareVideoFormData = ({ selectedFiles, caption, submissionId }) => {
  const formData = new FormData();

  const requestData = {
    submissionId,
    caption: caption.trim(),
  };
  formData.append('data', JSON.stringify(requestData));

  selectedFiles.forEach((file) => {
    formData.append('videos', file);
  });

  return formData;
};

/**
 * Prepare FormData for photo submission
 * @param {Object} params - Parameters object
 * @returns {FormData} Prepared FormData
 */
export const preparePhotoFormData = ({ selectedFiles, caption, submissionId, photosToRemove }) => {
  const formData = new FormData();

  const newFiles = selectedFiles.filter((file) => file instanceof File);
  const requestData = {
    submissionId,
    caption: caption.trim(),
    isAdditiveUpdate: true,
    photosToRemove: photosToRemove || [],
  };
  formData.append('data', JSON.stringify(requestData));

  newFiles.forEach((file) => {
    formData.append('photos', file);
  });

  return formData;
};

/**
 * Prepare FormData for raw footage submission
 * @param {Object} params - Parameters object
 * @returns {FormData} Prepared FormData
 */
export const prepareRawFootageFormData = ({ selectedFiles, caption, submissionId, submission }) => {
  const formData = new FormData();

  const existingRawFootages = selectedFiles.filter(
    (file) => file && typeof file === 'object' && file.url && file.id
  );
  const newFiles = selectedFiles.filter((file) => file instanceof File);

  const requestData = {
    submissionId,
    caption: caption.trim(),
    isSelectiveUpdate: ['CHANGES_REQUIRED', 'REJECTED'].includes(submission?.status),
    keepExistingRawFootages: existingRawFootages.map((rawFootage) => ({
      id: rawFootage.id,
      url: rawFootage.url,
    })),
  };
  formData.append('data', JSON.stringify(requestData));

  newFiles.forEach((file) => {
    formData.append('rawFootages', file);
  });

  return formData;
};

/**
 * Generate success message for photo uploads
 * @param {Object} params - Parameters object
 * @returns {string} Success message
 */
export const getPhotoUploadSuccessMessage = ({
  isUpdate,
  uploadedFilesCount,
  removedPhotosCount,
  existingPhotosCount,
}) => {
  if (!isUpdate) {
    return 'Photos uploaded successfully!';
  }

  const finalPhotoCount = existingPhotosCount - removedPhotosCount + uploadedFilesCount;

  if (uploadedFilesCount > 0 && removedPhotosCount > 0) {
    return `Updated photos: Added ${uploadedFilesCount} new, removed ${removedPhotosCount} existing. Total photos: ${finalPhotoCount}.`;
  }
  if (uploadedFilesCount > 0) {
    return `Added ${uploadedFilesCount} new photo(s)! Total photos: ${finalPhotoCount}.`;
  }
  if (removedPhotosCount > 0) {
    return `Removed ${removedPhotosCount} photo(s)! Total photos: ${finalPhotoCount}.`;
  }
  return 'Caption updated successfully!';
};

/**
 * Generate success message for raw footage uploads
 * @param {Object} params - Parameters object
 * @returns {string} Success message
 */
export const getRawFootageUploadSuccessMessage = ({
  isUpdate,
  uploadedFilesCount,
  keptRawFootagesCount,
}) => {
  if (!isUpdate) {
    return 'Raw footages uploaded successfully!';
  }

  if (uploadedFilesCount > 0 && keptRawFootagesCount > 0) {
    return `Raw footages updated successfully! Added ${uploadedFilesCount} new video(s), kept ${keptRawFootagesCount} existing video(s).`;
  }
  if (uploadedFilesCount > 0) {
    return `${uploadedFilesCount} new raw footage(s) added successfully!`;
  }
  return 'Raw footages updated successfully!';
};
