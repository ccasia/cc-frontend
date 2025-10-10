import { useState, useCallback } from 'react';
import { enqueueSnackbar } from 'notistack';
import axiosInstance, { endpoints } from 'src/utils/axios';

/**
 * Custom hook for managing submission upload state and logic
 * @param {Object} submission - The submission object
 * @param {Function} onUpdate - Callback to refresh parent component
 * @param {Object} options - Configuration options
 * @param {boolean} options.hasCaption - Whether this submission type supports captions
 * @param {boolean} options.hasPostingLink - Whether this submission type supports posting links
 * @param {boolean} options.allowsMultipleUploads - Whether multiple files can be uploaded
 * @param {string} options.mediaType - Type of media ('video', 'photo', 'rawFootage')
 */
export const useSubmissionUpload = (submission, onUpdate, options = {}) => {
  const {
    hasCaption = false,
    hasPostingLink = false,
    allowsMultipleUploads = false,
    mediaType = 'video',
  } = options;

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isReuploadMode, setIsReuploadMode] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Caption state (only if hasCaption is true)
  const [caption, setCaption] = useState(hasCaption ? (submission.caption || '') : '');

  // Posting link state (only if hasPostingLink is true)
  const [postingLink, setPostingLink] = useState(hasPostingLink ? (submission.content || '') : '');
  const [postingLoading, setPostingLoading] = useState(false);

  // Media-specific state
  const [photosToRemove, setPhotosToRemove] = useState([]);

  // Handlers
  const handleCaptionChange = useCallback((e) => {
    setCaption(e.target.value);
  }, []);

  const handlePostingLinkChange = useCallback((e) => {
    setPostingLink(e.target.value);
  }, []);

  const handleFilesChange = useCallback((files) => {
    setSelectedFiles(files);
  }, []);

  const handleAdditionalFilesChange = useCallback((newFiles) => {
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleReuploadMode = useCallback(() => {
    setIsReuploadMode(true);
    setSelectedFiles([]);
    setHasSubmitted(false);
  }, []);

  const handleSubmitPostingLink = useCallback(async () => {
    if (!postingLink.trim()) {
      enqueueSnackbar('Please enter a posting link', { variant: 'error' });
      return;
    }

    try {
      setPostingLoading(true);
      await axiosInstance.put(endpoints.submission.creator.v4.updatePostingLink, {
        submissionId: submission.id,
        postingLink: postingLink.trim(),
      });

      enqueueSnackbar('Posting link submitted successfully', { variant: 'success' });
      onUpdate();
    } catch (error) {
      console.error('Error submitting posting link:', error);
      enqueueSnackbar(error.message || 'Failed to submit posting link', { variant: 'error' });
    } finally {
      setPostingLoading(false);
    }
  }, [postingLink, submission.id, onUpdate]);

  /**
   * Generic upload handler using XMLHttpRequest for progress tracking
   * @param {FormData} formData - The form data to upload
   * @param {string} endpoint - The API endpoint
   * @returns {Promise} Upload promise
   */
  const uploadWithProgress = useCallback((formData, endpoint) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(xhr.responseText || 'Upload failed'));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));

      xhr.open('POST', endpoint, true);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }, []);

  /**
   * Generic submit handler
   * @param {Function} prepareFormData - Function to prepare media-specific FormData
   * @param {Function} onSuccess - Optional success callback
   * @param {boolean} skipValidation - Whether to skip validation (for custom validation in components)
   */
  const handleSubmit = useCallback(async (prepareFormData, onSuccess, skipValidation = false) => {
    // Only validate if not skipped and if validation is needed
    if (!skipValidation) {
      if (!allowsMultipleUploads && !isReuploadMode && selectedFiles.length === 0) {
        enqueueSnackbar(`Please select at least one ${mediaType} file`, { variant: 'error' });
        return;
      }

      if (hasCaption && !caption.trim()) {
        enqueueSnackbar('Please enter a caption', { variant: 'error' });
        return;
      }
    }

    setHasSubmitted(true);
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = prepareFormData({
        selectedFiles,
        caption,
        submissionId: submission.id,
        photosToRemove,
      });

      await uploadWithProgress(formData, endpoints.submission.creator.v4.submitContent);

      if (onSuccess) {
        onSuccess();
      } else {
        enqueueSnackbar(`${mediaType}s uploaded successfully!`, { variant: 'success' });
      }

      onUpdate();
      setIsReuploadMode(false);
      setPhotosToRemove([]);
      setHasSubmitted(false);
    } catch (error) {
      console.error('Submit error:', error);
      setHasSubmitted(false);
      enqueueSnackbar(error.message || `Failed to upload ${mediaType}s`, { variant: 'error' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [
    allowsMultipleUploads,
    isReuploadMode,
    selectedFiles,
    hasCaption,
    caption,
    mediaType,
    submission.id,
    photosToRemove,
    uploadWithProgress,
    onUpdate,
  ]);

  return {
    // Upload state
    uploading,
    uploadProgress,
    selectedFiles,
    isReuploadMode,
    hasSubmitted,

    // Setters for upload state
    setSelectedFiles,
    setIsReuploadMode,
    setHasSubmitted,

    // Caption state
    caption,
    setCaption,

    // Posting link state
    postingLink,
    postingLoading,
    setPostingLink,

    // Media-specific state
    photosToRemove,
    setPhotosToRemove,

    // Handlers
    handleCaptionChange,
    handlePostingLinkChange,
    handleFilesChange,
    handleAdditionalFilesChange,
    handleRemoveFile,
    handleReuploadMode,
    handleSubmit,
    handleSubmitPostingLink,
  };
};
