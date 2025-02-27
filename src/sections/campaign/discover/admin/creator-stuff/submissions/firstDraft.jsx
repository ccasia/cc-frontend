/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/media-has-caption */
import dayjs from 'dayjs';
import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
/* eslint-disable no-undef */
import React, { useMemo, useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Grid,
  Chip,
  Paper,
  Stack,
  Button,
  Dialog,
  Avatar,
  Checkbox,
  Typography,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Link,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import EmptyContent from 'src/components/empty-content/empty-content';
import { RHFTextField, RHFDatePicker, RHFMultiSelect } from 'src/components/hook-form';

const options_changes = [
  'Missing caption requirements',
  'Inverted logo',
  'Inverted brand name',
  'Audio not audible',
  'Video too dark',
  'Video too bright',
  'Mismatch of audio and video',
  'Frozen video',
  'Background too loud',
  'Voiceover not clear',
  'Audio not a good fit',
  'Audio too loud',
  'Speling in subtitles',
];

const PreviewModal = ({ open, onClose, selectedMedia, mediaType }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="md"
    sx={{
      '& .MuiDialog-paper': {
        p: 0,
        maxWidth: { xs: '95vw', sm: '85vw', md: '75vw' },
        margin: { xs: '16px', sm: '32px' },
      },
    }}
  >
    <DialogTitle sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" gap={2}>
        <Typography
          variant="h5"
          sx={{
            fontFamily: 'Instrument Serif, serif',
            fontSize: { xs: '2rem', sm: '2.4rem' },
            fontWeight: 550,
            m: 0,
          }}
        >
          Preview Draft
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{
            ml: 'auto',
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Iconify icon="hugeicons:cancel-01" width={20} />
        </IconButton>
      </Stack>
    </DialogTitle>

    <DialogContent sx={{ p: 2.5 }}>
      {mediaType === 'video' ? (
        <Box
          component="video"
          autoPlay
          controls
          src={selectedMedia}
          sx={{
            width: '100%',
            maxHeight: '60vh',
            borderRadius: 1,
            bgcolor: 'background.neutral',
          }}
        />
      ) : (
        <Box
          component="img"
          src={selectedMedia}
          alt="Preview"
          sx={{
            width: '100%',
            maxHeight: '60vh',
            objectFit: 'contain',
            borderRadius: 1,
            bgcolor: 'background.neutral',
          }}
        />
      )}
    </DialogContent>
  </Dialog>
);

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round(bytes / k ** i)} ${sizes[i]}`;
};

const getVideoSize = async (videoUrl) => {
  try {
    const response = await fetch(videoUrl);
    const blob = await response.blob();
    return formatFileSize(blob.size);
  } catch (error) {
    console.error('Error getting video size:', error);
    return 'Unknown';
  }
};

const FirstDraft = ({ campaign, submission, creator }) => {
  // Draft Video States
  const [type, setType] = useState('approve');
  const approve = useBoolean();
  const request = useBoolean();
  const [selectedVideosForChange, setSelectedVideosForChange] = useState([]);

  // Raw Footage States
  const [rawFootageType, setRawFootageType] = useState('approve');
  const rawFootageApprove = useBoolean();
  const rawFootageRequest = useBoolean();
  const [selectedRawFootagesForChange, setSelectedRawFootagesForChange] = useState([]);

  // Photos States
  const [photosType, setPhotosType] = useState('approve');
  const photosApprove = useBoolean();
  const photosRequest = useBoolean();
  const [selectedPhotosForChange, setSelectedPhotosForChange] = useState([]);

  // Reset handlers for each section
  const resetDraftVideoForm = () => {
    setType('approve');
    draftVideoMethods.reset({
      feedback: 'Thank you for submitting!',
      type: '',
      reasons: [],
      schedule: {
        startDate: null,
        endDate: null,
      },
    });
    setSelectedVideosForChange([]);
  };

  const resetRawFootageForm = () => {
    setRawFootageType('approve');
    rawFootageMethods.reset({
      footageFeedback: '',
      type: '',
      reasons: [],
    });
    setSelectedRawFootagesForChange([]);
  };

  const resetPhotosForm = () => {
    setPhotosType('approve');
    photoMethods.reset({
      feedback: '',
      type: '',
      reasons: [],
    });
    setSelectedPhotosForChange([]);
  };

  // Update the button click handlers to use the correct state setters
  const handleDraftVideoRequestClick = () => {
    setType('request');
    draftVideoMethods.setValue('type', 'request');
    draftVideoMethods.setValue('feedback', '');
  };

  const handleRawFootageRequestClick = () => {
    console.log('Request button clicked');
    setRawFootageType('request');
    rawFootageMethods.setValue('type', 'request');
    rawFootageMethods.setValue('footageFeedback', '');
  };

  const handlePhotosRequestClick = () => {
    setPhotosType('request');
    photoMethods.setValue('type', 'request');
    photoMethods.setValue('feedback', '');
  };

  const [openFeedbackModal, setOpenFeedbackModal] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const { user } = useAuthContext();
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [mediaType, setMediaType] = useState(null);
  const [selectedTab, setSelectedTab] = useState('video');
  const [fullImageOpen, setFullImageOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoDetails, setVideoDetails] = useState({
    size: 0,
    resolution: '',
    duration: 0,
  });
  const [draftVideoModalOpen, setDraftVideoModalOpen] = useState(false);
  const [currentDraftVideoIndex, setCurrentDraftVideoIndex] = useState(0);
  const [draftVideoDetails, setDraftVideoDetails] = useState({
    size: '0 Bytes',
    resolution: '',
    duration: 0,
  });

  const requestSchema = Yup.object().shape({
    feedback: Yup.string().required('This field is required'),
    type: Yup.string(),
  });

  const normalSchema = Yup.object().shape({
    feedback: Yup.string().required('Comment is required.'),
    schedule: Yup.object().shape({
      startDate: Yup.string().required('Start Date is required.'),
      endDate: Yup.string().required('End Date is required.'),
    }),
  });

  const draftVideoMethods = useForm({
    resolver: type === 'request' ? yupResolver(requestSchema) : yupResolver(normalSchema),
    defaultValues: {
      feedback: 'Thank you for submitting!',
      type: '',
      reasons: [],
      schedule: {
        startDate: null,
        endDate: null,
      },
    },
  });

  // raw footage
  const rawFootageRequestSchema = Yup.object().shape({
    footageFeedback: Yup.string().required('Feedback is required'),
  });

  // rawFootageMethods form initialization
  const rawFootageMethods = useForm({
    resolver: yupResolver(rawFootageRequestSchema),
    defaultValues: {
      footageFeedback: '',
    },
  });

  // photo form schema
  const photoRequestSchema = Yup.object().shape({
    photoFeedback: Yup.string().required('Feedback is required'),
  });

  // photoMethods form initialization
  const photoMethods = useForm({
    resolver: yupResolver(photoRequestSchema),
    defaultValues: {
      photoFeedback: '',
    },
  });

  const {
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { isSubmitting },
  } = draftVideoMethods;

  const scheduleStartDate = watch('schedule.startDate');

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  // console.log(submission);

  const onSubmitDraftVideo = draftVideoMethods.handleSubmit(async (data) => {
    try {
      const payload = {
        ...data,
        submissionId: submission.id,
        userId: creator?.user?.id,
        videosToUpdate: selectedVideosForChange,
        contentType: 'video',
        type: data.type,
      };

      const res = await axiosInstance.patch(endpoints.submission.admin.draft, payload);

      mutate(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
      );
      enqueueSnackbar(res?.data?.message);
      approve.onFalse();
      request.onFalse();
      resetDraftVideoForm();
    } catch (error) {
      console.error('Submission error:', error);
      enqueueSnackbar(error?.message || 'Failed to submit changes', {
        variant: 'error',
      });
      approve.onFalse();
      request.onFalse();
    }
  });

  const onSubmitRawFootage = rawFootageMethods.handleSubmit(async (data) => {
    console.log('Raw Footage Form Data:', data);
    console.log('Selected Footages:', selectedRawFootagesForChange);

    try {
      const payload = {
        submissionId: submission.id,
        userId: creator?.user?.id,
        rawFootageToUpdate: selectedRawFootagesForChange,
        footageFeedback: data.footageFeedback,
        rawFootageContent: data.footageFeedback,
        type: 'request',
      };

      console.log('Submitting Raw Footage Request:', payload);

      const res = await axiosInstance.patch(endpoints.submission.admin.draft, payload);
      console.log('Raw Footage Response:', res);

      mutate(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
      );
      enqueueSnackbar(res?.data?.message);
      rawFootageApprove.onFalse();
      rawFootageRequest.onFalse();
      rawFootageMethods.reset();
      setSelectedRawFootagesForChange([]);
    } catch (error) {
      console.error('Raw Footage Submission Error:', error);
      enqueueSnackbar('Error submitting', {
        variant: 'error',
      });
      rawFootageApprove.onFalse();
      rawFootageRequest.onFalse();
    }
  });

  // Update the onSubmitPhotos function
  const onSubmitPhotos = photoMethods.handleSubmit(async (data) => {
    try {
      const payload = {
        submissionId: submission.id,
        userId: creator?.user?.id,
        photosToUpdate: selectedPhotosForChange,
        photoFeedback: data.photoFeedback,
        photoContent: data.photoFeedback,
        type: 'request',
      };

      const res = await axiosInstance.patch(endpoints.submission.admin.draft, payload);
      mutate(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
      );
      enqueueSnackbar(res?.data?.message);
      photosApprove.onFalse();
      photosRequest.onFalse();
      photoMethods.reset();
      setSelectedPhotosForChange([]);
    } catch (error) {
      console.error('Photos Submission Error:', error);
      enqueueSnackbar('Error submitting', {
        variant: 'error',
      });
      photosApprove.onFalse();
      photosRequest.onFalse();
    }
  });

  const confirmationApproveModal = (open, onclose) => (
    <Dialog
      open={open}
      onClose={onclose}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: '500px',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
        }}
      >
        Approve Confirmation
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={2}>
          <DialogContentText>Are you sure you want to submit now?</DialogContentText>

          {/* Show schedule if set */}
          {watch('schedule.startDate') && watch('schedule.endDate') && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Schedule:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  bgcolor: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                }}
              >
                {`${dayjs(watch('schedule.startDate')).format('MMM D, YYYY')} - ${dayjs(watch('schedule.endDate')).format('MMM D, YYYY')}`}
              </Typography>
            </Box>
          )}

          {/* Show feedback comment */}
          {watch('feedback') && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Feedback:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  bgcolor: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                  maxHeight: '100px',
                  overflowY: 'auto',
                }}
              >
                {watch('feedback')}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 2 }}>
        <Button
          onClick={onclose}
          size="small"
          sx={{
            bgcolor: 'white',
            border: 1,
            borderRadius: 0.8,
            borderColor: '#e7e7e7',
            borderBottom: 3,
            borderBottomColor: '#e7e7e7',
            color: 'text.primary',
            '&:hover': {
              bgcolor: '#f5f5f5',
              borderColor: '#e7e7e7',
            },
            textTransform: 'none',
            px: 2.5,
            py: 1.2,
            fontSize: '0.875rem',
            minWidth: '80px',
            height: '45px',
          }}
        >
          Cancel
        </Button>
        <LoadingButton
          onClick={() => {
            setValue('type', 'approve');
            onSubmitDraftVideo();
          }}
          disabled={isDisabled}
          variant="contained"
          size="small"
          loading={isSubmitting}
          sx={{
            bgcolor: '#2e6c56',
            color: 'white',
            borderBottom: 3,
            borderBottomColor: '#1a3b2f',
            borderRadius: 0.8,
            px: 2.5,
            py: 1.2,
            '&:hover': {
              bgcolor: '#2e6c56',
              opacity: 0.9,
            },
            '&:disabled': {
              display: 'none',
            },
            fontSize: '0.875rem',
            minWidth: '80px',
            height: '45px',
            textTransform: 'none',
          }}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );

  // Update the confirmation modal for raw footage
  const confirmationRequestModal = (open, onclose) => (
    <Dialog
      open={open}
      onClose={onclose}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: '500px',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
        }}
      >
        Confirm Change Request
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={2}>
          <DialogContentText>
            Are you sure you want to submit this change request?
          </DialogContentText>

          {/* Show feedback and reasons for all content types */}
          {selectedTab === 'video' && (
            <>
              {draftVideoMethods.watch('reasons')?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Reasons for changes:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {draftVideoMethods.watch('reasons').map((reason, idx) => (
                      <Chip
                        key={idx}
                        label={reason}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
              {draftVideoMethods.watch('feedback') && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Feedback:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      bgcolor: 'grey.100',
                      p: 1.5,
                      borderRadius: 1,
                      maxHeight: '100px',
                      overflowY: 'auto',
                    }}
                  >
                    {draftVideoMethods.watch('feedback')}
                  </Typography>
                </Box>
              )}
            </>
          )}

          {/* Show feedback for raw footage and photos */}
          {(rawFootageMethods.watch('footageFeedback') || photoMethods.watch('photoFeedback')) && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Feedback:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  bgcolor: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                  maxHeight: '100px',
                  overflowY: 'auto',
                }}
              >
                {rawFootageMethods.watch('footageFeedback') || photoMethods.watch('photoFeedback')}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 2 }}>
        <Button
          onClick={onclose}
          size="small"
          sx={{
            bgcolor: 'white',
            border: 1,
            borderRadius: 0.8,
            borderColor: '#e7e7e7',
            borderBottom: 3,
            borderBottomColor: '#e7e7e7',
            color: 'text.primary',
            '&:hover': {
              bgcolor: '#f5f5f5',
              borderColor: '#e7e7e7',
            },
            textTransform: 'none',
            px: 2.5,
            py: 1.2,
            fontSize: '0.875rem',
            minWidth: '80px',
            height: '45px',
          }}
        >
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          size="small"
          onClick={() => {
            if (selectedTab === 'video') {
              draftVideoMethods.setValue('type', 'request');
              onSubmitDraftVideo();
            } else if (selectedTab === 'rawFootages') {
              onSubmitRawFootage();
            } else if (selectedTab === 'photos') {
              onSubmitPhotos();
            }
            onclose();
          }}
          disabled={
            (selectedTab === 'video' && selectedVideosForChange.length === 0) ||
            (selectedTab === 'rawFootages' && selectedRawFootagesForChange.length === 0) ||
            (selectedTab === 'photos' && selectedPhotosForChange.length === 0)
          }
          sx={{
            bgcolor: '#2e6c56',
            color: 'white',
            borderBottom: 3,
            borderBottomColor: '#1a3b2f',
            borderRadius: 0.8,
            px: 2.5,
            py: 1.2,
            '&:hover': {
              bgcolor: '#2e6c56',
              opacity: 0.9,
            },
            fontSize: '0.875rem',
            minWidth: '80px',
            height: '45px',
            textTransform: 'none',
          }}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );

  // const handleOpenFeedbackModal = () => setOpenFeedbackModal(true);
  // const handleCloseFeedbackModal = () => setOpenFeedbackModal(false);

  // Sort feedback by date, most recent first
  const sortedFeedback = React.useMemo(() => {
    if (submission?.feedback) {
      return [...submission.feedback].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return [];
  }, [submission?.feedback]);

  // const handlePreviewClick = (mediaUrl) => {
  //   setSelectedMedia(mediaUrl);
  //   setMediaType(type);
  //   setPreviewModalOpen(true);
  // };

  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
    setFullImageOpen(true);
  };

  const handleFullImageClose = () => {
    setFullImageOpen(false);
  };

  const handlePrevImage = (event) => {
    event.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : submission.photos.length - 1
    );
  };

  const handleNextImage = (event) => {
    event.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex < submission.photos.length - 1 ? prevIndex + 1 : 0
    );
  };

  const handleVideoClick = (index) => {
    setCurrentVideoIndex(index);
    setVideoModalOpen(true);
  };

  const handleVideoMetadata = async (event) => {
    const video = event.target;
    const videoUrl = submission?.rawFootages?.[currentVideoIndex]?.url;

    if (videoUrl) {
      const size = await getVideoSize(videoUrl);
      const resolution = `${video.videoWidth} x ${video.videoHeight}`;
      const duration = Math.round(video.duration);

      setVideoDetails({ size, resolution, duration });
    }
  };

  // download helper
  const handleDownload = async (videoUrl) => {
    try {
      const response = await fetch(videoUrl);
      const contentType = response.headers.get('content-type');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      let filename = videoUrl.split('/').pop() || 'video';

      const extensionMap = {
        'video/mp4': '.mp4',
        'video/quicktime': '.mov',
        'video/x-msvideo': '.avi',
        'video/webm': '.webm',
      };

      const extension = extensionMap[contentType] || `.${videoUrl.split('.').pop()}` || '.mp4';
      filename = filename.replace(/\.[^/.]+$/, '') + extension;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      enqueueSnackbar('Failed to download video', { variant: 'error' });
    }
  };

  const handleDraftVideoClick = (index) => {
    setCurrentDraftVideoIndex(index);
    setDraftVideoModalOpen(true);
  };

  const handleDraftVideoMetadata = async (event) => {
    const video = event.target;
    const videoUrl = submission?.video?.[currentDraftVideoIndex]?.url;

    if (videoUrl) {
      const size = await getVideoSize(videoUrl);
      const resolution = `${video.videoWidth} x ${video.videoHeight}`;
      const duration = Math.round(video.duration);

      setDraftVideoDetails({ size, resolution, duration });
    }
  };

  const handleVideoSelection = (id) => {
    setSelectedVideosForChange((prev) => {
      if (prev.includes(id)) {
        return prev.filter((videoId) => videoId !== id);
      }
      return [...prev, id];
    });
  };

  // handlers for raw footage and photo selection
  const handleRawFootageSelection = (event, id) => {
    event.stopPropagation();
    setSelectedRawFootagesForChange((prev) => {
      if (prev.includes(id)) {
        return prev.filter((footageId) => footageId !== id);
      }
      return [...prev, id];
    });
  };

  const handlePhotoSelection = (event, id) => {
    event.stopPropagation();
    setSelectedPhotosForChange((prev) => {
      if (prev.includes(id)) {
        return prev.filter((photoId) => photoId !== id);
      }
      return [...prev, id];
    });
  };

  const renderStatusBanner = () => {
    if (submission?.status === 'CHANGES_REQUIRED') {
      return (
        <Box
          sx={{
            mb: 3,
            p: 1.5,
            px: 3,
            bgcolor: 'warning.lighter',
            border: '1px solid',
            borderColor: 'warning.light',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 2px 8px rgba(255, 171, 0, 0.12)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: 4,
              height: '100%',
              bgcolor: 'warning.main',
            },
          }}
        >
          <Box
            sx={{
              minWidth: 40,
              height: 40,
              borderRadius: 1.2,
              bgcolor: 'warning.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify
              icon="solar:danger-triangle-bold"
              width={24}
              sx={{
                color: 'warning.contrastText',
              }}
            />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                color: 'warning.darker',
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              Changes Required
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'warning.dark',
                opacity: 0.8,
              }}
            >
              Changes have been requested for this submission.
            </Typography>
          </Box>
        </Box>
      );
    }

    if (submission?.status === 'APPROVED') {
      return (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: 'success.lighter',
            border: '1px solid',
            borderColor: 'success.light',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Iconify icon="solar:check-circle-bold" color="success.main" />
          <Typography color="success.darker">This submission has been approved</Typography>
        </Box>
      );
    }

    return null;
  };

  useEffect(() => {
    let initialTab = 'video';

    if (!submission?.video?.length) {
      if (submission?.rawFootages?.length) initialTab = 'rawFootages';
      else if (submission?.photos?.length) initialTab = 'photos';
    }

    setSelectedTab(initialTab);
  }, [submission]);

  // helper to check if all raw footages are marked for changes
  const areAllRawFootagesMarkedForChanges = () => {
    if (!submission?.rawFootages?.length || !submission?.status === 'CHANGES_REQUIRED')
      return false;
    return submission.rawFootages.every((footage) =>
      submission.feedback?.some((feedback) => feedback.rawFootageToUpdate?.includes(footage.id))
    );
  };

  // helper to check if all photos are marked for changes
  const areAllPhotosMarkedForChanges = () => {
    if (!submission?.photos?.length || !submission?.status === 'CHANGES_REQUIRED') return false;
    return submission.photos.every((photo) =>
      submission.feedback?.some((feedback) => feedback.photosToUpdate?.includes(photo.id))
    );
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box component={Paper} p={{ xs: 1, sm: 1.5 }}>
            <Stack direction="column" spacing={2} sx={{ mb: 3 }}>
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#8e8e93', fontSize: '0.875rem', fontWeight: 550 }}
                  >
                    Date Submitted:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#221f20', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    {submission?.submissionDate
                      ? dayjs(submission?.submissionDate).format('ddd, D MMM YYYY')
                      : '-'}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#8e8e93', fontSize: '0.875rem', fontWeight: 550 }}
                  >
                    Reviewed On:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#221f20', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    {submission?.isReview
                      ? dayjs(submission?.updatedAt).format('ddd, D MMM YYYY')
                      : '-'}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>

            {/* Feedback History Button */}
            {/* <Box sx={{ display: 'flex', mb: 2 }}>
              <Button 
                onClick={handleOpenFeedbackModal} 
                variant="outlined" 
                size="small"
                sx={{
                  boxShadow: 2,
                }}
              >
                View Feedback History
              </Button>
            </Box> */}

            {/* Commented out feedback history modal */}
            {/* <Modal
              open={openFeedbackModal}
              onClose={handleCloseFeedbackModal}
              aria-labelledby="feedback-history-modal"
              aria-describedby="feedback-history-description"
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: { xs: '95%', sm: '90%' },
                  maxWidth: 600,
                  maxHeight: '90vh',
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: 24,
                  p: 0,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography id="feedback-history-modal" variant="h6" component="h2">
                    Feedback History
                  </Typography>
                  <IconButton onClick={handleCloseFeedbackModal} size="small">
                    <CloseIcon />
                  </IconButton>
                </Box>
                <Box
                  sx={{ p: { xs: 2, sm: 3 }, maxHeight: 'calc(90vh - 60px)', overflowY: 'auto' }}
                >
                  {sortedFeedback.length > 0 ? (
                    <Timeline
                      position="right"
                      sx={{
                        [`& .MuiTimelineItem-root:before`]: {
                          flex: 0,
                          padding: 0,
                        },
                      }}
                    >
                      {sortedFeedback.map((feedback, index) => (
                        <TimelineItem key={index}>
                          <TimelineOppositeContent
                            sx={{
                              display: { xs: 'none', sm: 'block' },
                              flex: { sm: 0.2 },
                            }}
                            color="text.secondary"
                          >
                            {dayjs(feedback.createdAt).format('MMM D, YYYY HH:mm')}
                          </TimelineOppositeContent>
                          <TimelineSeparator>
                            <TimelineDot
                              sx={{
                                bgcolor: feedback.type === 'COMMENT' ? 'primary.main' : blue[700],
                              }}
                            >
                              {feedback.type === 'COMMENT' ? <CommentIcon /> : <ChangeCircleIcon />}
                            </TimelineDot>
                            {index < sortedFeedback.length - 1 && <TimelineConnector />}
                          </TimelineSeparator>
                          <TimelineContent sx={{ py: '12px', px: 2 }}>
                            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {feedback.type === 'COMMENT' ? 'Comment' : 'Change Request'}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {feedback.content}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: { xs: 'block', sm: 'none' }, mb: 1 }}
                              >
                                {dayjs(feedback.createdAt).format('MMM D, YYYY HH:mm')}
                              </Typography>
                              {feedback.reasons && feedback.reasons.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    Reasons for changes:
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {feedback.reasons.map((reason, idx) => (
                      <Chip
                        key={idx}
                        label={reason}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
                            </Paper>
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  ) : (
                    <Typography>No feedback history available.</Typography>
                  )}
                </Box>
              </Box>
            </Modal> */}

            {submission?.status === 'NOT_STARTED' && <EmptyContent title="No Submission" />}
            {submission?.status === 'IN_PROGRESS' &&
              !submission?.video?.length &&
              !submission?.photos?.length &&
              !submission?.rawFootages?.length && (
                <EmptyContent title="Creator has not uploaded any deliverables yet." />
              )}
            {(submission?.status === 'PENDING_REVIEW' ||
              submission?.status === 'APPROVED' ||
              submission?.status === 'CHANGES_REQUIRED' ||
              submission?.video?.length > 0 ||
              submission?.photos?.length > 0 ||
              submission?.rawFootages?.length > 0) && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  {/* Status Banner */}
                  {renderStatusBanner()}
                  {/* Media Selection Navigation */}
                  <Box sx={{ mb: 3 }}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={2}
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        boxShadow: '0 0 12px rgba(0,0,0,0.05)',
                      }}
                    >
                      <Button
                        onClick={() => setSelectedTab('video')}
                        startIcon={<Iconify icon="solar:video-frame-bold" />}
                        fullWidth
                        sx={{
                          p: 1.5,
                          color: selectedTab === 'video' ? '#1844fc' : 'text.secondary',
                          bgcolor: selectedTab === 'video' ? '#e6ebff' : 'transparent',
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: selectedTab === 'video' ? '#e6ebff' : 'action.hover',
                          },
                        }}
                      >
                        <Stack alignItems="center">
                          <Typography variant="subtitle2">Draft Videos</Typography>
                          <Typography variant="caption">
                            {submission?.video?.length || 0} videos
                          </Typography>
                        </Stack>
                      </Button>

                      {campaign?.rawFootage && (
                        <Button
                          onClick={() => setSelectedTab('rawFootages')}
                          startIcon={<Iconify icon="solar:gallery-wide-bold" />}
                          fullWidth
                          sx={{
                            p: 1.5,
                            color: selectedTab === 'rawFootages' ? '#1844fc' : 'text.secondary',
                            bgcolor: selectedTab === 'rawFootages' ? '#e6ebff' : 'transparent',
                            borderRadius: 1,
                            '&:hover': {
                              bgcolor: selectedTab === 'rawFootages' ? '#e6ebff' : 'action.hover',
                            },
                          }}
                        >
                          <Stack alignItems="center">
                            <Typography variant="subtitle2">Raw Footages</Typography>
                            <Typography variant="caption">
                              {submission?.rawFootages?.length || 0} files
                            </Typography>
                          </Stack>
                        </Button>
                      )}

                      {campaign?.photos && (
                        <Button
                          onClick={() => setSelectedTab('photos')}
                          startIcon={<Iconify icon="solar:camera-bold" />}
                          fullWidth
                          sx={{
                            p: 1.5,
                            color: selectedTab === 'photos' ? '#1844fc' : 'text.secondary',
                            bgcolor: selectedTab === 'photos' ? '#e6ebff' : 'transparent',
                            borderRadius: 1,
                            '&:hover': {
                              bgcolor: selectedTab === 'photos' ? '#e6ebff' : 'action.hover',
                            },
                          }}
                        >
                          <Stack alignItems="center">
                            <Typography variant="subtitle2">Photos</Typography>
                            <Typography variant="caption">
                              {submission?.photos?.length || 0} images
                            </Typography>
                          </Stack>
                        </Button>
                      )}
                    </Stack>
                  </Box>
                  {/* Content Display Box */}
                  <Box
                    component={Paper}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      boxShadow: '0 0 12px rgba(0,0,0,0.05)',
                      mb: 3,
                    }}
                  >
                    {selectedTab === 'video' && (
                      <>
                        {submission?.video?.length > 0 ? (
                          <Grid container spacing={{ xs: 1, sm: 2 }}>
                            {submission.video.map((videoItem, index) => (
                              <Grid item xs={12} sm={6} md={4} key={videoItem.id || index}>
                                <Box
                                  sx={{
                                    position: 'relative',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    boxShadow: 2,
                                    aspectRatio: '16/9',
                                    cursor: 'pointer',
                                    mb: 3,
                                  }}
                                >
                                  <Box
                                    component="video"
                                    src={videoItem.url}
                                    sx={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                  />

                                  {/* Changes Requested indicator */}
                                  {submission?.feedback?.some(feedback => 
                                    feedback.videosToUpdate?.includes(videoItem.id)
                                  ) && (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: 8,
                                        left: 8,
                                        bgcolor: 'warning.main',
                                        color: 'warning.contrastText',
                                        borderRadius: 1,
                                        px: 1,
                                        py: 0.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        zIndex: 1,
                                      }}
                                    >
                                      <Iconify icon="solar:pen-bold" width={16} />
                                      <Typography variant="caption" fontWeight="bold">
                                        Changes Requested
                                      </Typography>
                                    </Box>
                                  )}

                                  {/* Existing checkbox for video selection */}
                                  {type === 'request' && 
                                    !submission?.feedback?.some(feedback => 
                                      feedback.videosToUpdate?.includes(videoItem.id)
                                    ) && (
                                    <Checkbox
                                      checked={selectedVideosForChange.includes(videoItem.id)}
                                      onChange={() => handleVideoSelection(videoItem.id)}
                                      sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        color: 'white',
                                        '&.Mui-checked': {
                                          color: 'primary.main',
                                        },
                                        bgcolor: 'rgba(0,0,0,0.3)',
                                        borderRadius: 1,
                                      }}
                                    />
                                  )}
                                  <Box
                                    onClick={() => handleDraftVideoClick(index)}
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      bgcolor: 'rgba(0, 0, 0, 0.3)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Iconify
                                      icon="mdi:play"
                                      sx={{
                                        color: 'white',
                                        width: 40,
                                        height: 40,
                                        opacity: 0.9,
                                      }}
                                    />
                                  </Box>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        ) : (
                          <Typography>No draft video uploaded yet.</Typography>
                        )}
                        {/* Caption Section for legacy support */}
                        {submission?.caption && !submission?.videos?.length && (
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 1,
                              bgcolor: 'background.neutral',
                              mb: 4,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                display: 'block',
                                mb: 0.5,
                                fontWeight: 650,
                              }}
                            >
                              Caption
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'text.primary',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {submission.caption}
                            </Typography>
                          </Box>
                        )}

                        {!!submission?.publicFeedback?.length &&
                          submission.publicFeedback
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .map((feedback, index) => (
                              <Box
                                key={index}
                                mb={2}
                                p={2}
                                border={1}
                                borderColor="grey.300"
                                borderRadius={1}
                                display="flex"
                                alignItems="flex-start"
                                flexDirection="column"
                              >
                                {/* Title for Client Feedback */}
                                <Typography
                                  variant="h6"
                                  sx={{ fontWeight: 'bold', marginBottom: 2 }}
                                >
                                  Client Feedback
                                </Typography>
                                {/* Use company logo or fallback avatar */}
                                <Avatar
                                  src={campaign?.company?.logoURL || '/default-avatar.png'}
                                  alt={campaign?.company?.name || 'Company'}
                                  sx={{ mr: 2, mb: 2 }}
                                />
                                <Box
                                  flexGrow={1}
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    textAlign: 'left',
                                  }}
                                >
                                  <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 'bold', marginBottom: '2px' }}
                                  >
                                    {campaign?.company?.name || 'Unknown Company'}
                                  </Typography>

                                  {/* Feedback Content */}
                                  <Box sx={{ textAlign: 'left', mt: 1 }}>
                                    {feedback.content.split('\n').map((line, i) => (
                                      <Typography key={i} variant="body2">
                                        {line}
                                      </Typography>
                                    ))}

                                    {/* Display reasons if available */}
                                    {feedback.reasons && feedback.reasons.length > 0 && (
                                      <Box mt={1} sx={{ textAlign: 'left' }}>
                                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                          {feedback.reasons.map((reason, idx) => (
                                            <Box
                                              key={idx}
                                              sx={{
                                                border: '1.5px solid #e7e7e7',
                                                borderBottom: '4px solid #e7e7e7',
                                                borderRadius: 1,
                                                p: 0.5,
                                                display: 'inline-flex',
                                              }}
                                            >
                                              <Chip
                                                label={reason}
                                                size="small"
                                                color="default"
                                                variant="outlined"
                                                sx={{
                                                  border: 'none',
                                                  color: '#8e8e93',
                                                  fontSize: '0.75rem',
                                                  padding: '1px 2px',
                                                }}
                                              />
                                            </Box>
                                          ))}
                                        </Stack>
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                            ))}

                        {/* Schedule Post and Request Changes Section */}
                        {(submission?.status === 'PENDING_REVIEW' || submission?.status === 'CHANGES_REQUIRED') && (
                          <Box
                            component={Paper}
                            sx={{
                              p: { xs: 2, sm: 3 },
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >

//                             {type === 'approve' && submission?.status === 'PENDING_REVIEW' && (
//                               <FormProvider methods={draftVideoMethods} onSubmit={onSubmitDraftVideo}>

                            {type === 'approve' && (
                              <FormProvider
                                methods={draftVideoMethods}
                                onSubmit={onSubmitDraftVideo}
                              >

                                <Stack gap={1} mb={2}>
                                  <Typography variant="subtitle1" mb={1} mx={1}>
                                    Schedule This Post
                                  </Typography>
                                  <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    gap={{ xs: 2, sm: 3 }}
                                  >
                                    <RHFDatePicker
                                      name="schedule.startDate"
                                      label="Start Date"
                                      minDate={dayjs()}
                                    />
                                    <RHFDatePicker
                                      name="schedule.endDate"
                                      label="End Date"
                                      minDate={dayjs(draftVideoMethods.watch('schedule.startDate'))}
                                    />
                                  </Stack>
                                </Stack>

                                <Stack gap={2}>
                                <Typography variant="subtitle1" mb={1} mx={1}>
                                  Comments For Creator
                                </Typography>
                                  <RHFTextField
                                    name="feedback"
                                    multiline
                                    minRows={5}
                                    placeholder="Provide feedback for the creator."
                                    sx={{ mb: 2 }}
                                  />
                                </Stack>

                                  <Stack
                                    alignItems={{ xs: 'stretch', sm: 'center' }}
                                    direction={{ xs: 'column', sm: 'row' }}
                                    gap={1.5}
                                    justifyContent="end"
                                  >
                                    <Button
                                    onClick={handleDraftVideoRequestClick}
                                      size="small"
                                      variant="contained"
                                      startIcon={<Iconify icon="solar:close-circle-bold" />}
                                      sx={{
                                        bgcolor: 'white',
                                        border: 1,
                                        borderRadius: 0.8,
                                        borderColor: '#e7e7e7',
                                        borderBottom: 3,
                                        borderBottomColor: '#e7e7e7',
                                        color: 'error.main',
                                        '&:hover': {
                                          bgcolor: '#e7e7e7',
                                          borderColor: '#e7e7e7',
                                        },
                                        textTransform: 'none',
                                        px: 2.5,
                                        py: 1.2,
                                        fontSize: '0.875rem',
                                        minWidth: '80px',
                                        height: '45px',
                                      }}
                                    >
                                      Request a change
                                    </Button>
                                    <LoadingButton
                                      onClick={approve.onTrue}
                                      variant="contained"
                                      size="small"
                                      startIcon={<Iconify icon="solar:check-circle-bold" />}
                                      loading={isSubmitting}
                                      sx={{
                                        bgcolor: '#2e6c56',
                                        color: 'white',
                                        borderBottom: 3,
                                        borderBottomColor: '#1a3b2f',
                                        borderRadius: 0.8,
                                        px: 2.5,
                                        py: 1.2,
                                        '&:hover': {
                                          bgcolor: '#2e6c56',
                                          opacity: 0.9,
                                        },
                                        fontSize: '0.875rem',
                                        minWidth: '80px',
                                        height: '45px',
                                      textTransform: 'none',
                                      }}
                                    >
                                      Approve
                                    </LoadingButton>
                                  </Stack>
                              </FormProvider>
                            )}

                            {type === 'approve' && submission?.status === 'CHANGES_REQUIRED' && (
                                  <Stack
                                    alignItems={{ xs: 'stretch', sm: 'center' }}
                                    direction={{ xs: 'column', sm: 'row' }}
                                    gap={1.5}
                                    justifyContent="end"
                                  >
                                    <Button
                                  onClick={handleDraftVideoRequestClick}
                                      size="small"
                                      variant="contained"
                                      startIcon={<Iconify icon="solar:close-circle-bold" />}
                                      sx={{
                                        bgcolor: 'white',
                                        border: 1,
                                        borderRadius: 0.8,
                                        borderColor: '#e7e7e7',
                                        borderBottom: 3,
                                        borderBottomColor: '#e7e7e7',
                                        color: 'error.main',
                                        '&:hover': {
                                          bgcolor: '#e7e7e7',
                                          borderColor: '#e7e7e7',
                                        },
                                        textTransform: 'none',
                                        px: 2.5,
                                        py: 1.2,
                                        fontSize: '0.875rem',
                                        minWidth: '80px',
                                        height: '45px',
                                      }}
                                    >
                                      Request a change
                                    </Button>
                                  </Stack>
                            )}

                            {type === 'request' && (
                              <FormProvider methods={draftVideoMethods} onSubmit={onSubmitDraftVideo}>
                                <Typography variant="h6" mb={1} mx={1}>
                                  Request Changes
                                </Typography>

                                <FormProvider
                                  methods={draftVideoMethods}
                                  onSubmit={onSubmitDraftVideo}
                                >
                                  <Stack gap={2}>
                                  <RHFMultiSelect
                                    name="reasons"
                                    checkbox
                                    chip
                                    options={options_changes.map((item) => ({
                                      value: item,
                                      label: item,
                                    }))}
                                    label="Reasons"
                                  />
                                    <RHFTextField
                                    name="feedback"
                                      multiline
                                      minRows={5}
                                    placeholder="Provide feedback for the draft video."
                                    />

                                  {selectedVideosForChange.length === 0 && (
                                      <Typography
                                        color="warning.main"
                                        sx={{
                                          mt: 1,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1,
                                        }}
                                      >
                                        <Iconify icon="solar:danger-triangle-bold" />
                                      Please select at least one video that needs changes.
                                      </Typography>
                                    )}

                                    <Stack
                                      alignItems={{ xs: 'stretch', sm: 'center' }}
                                      direction={{ xs: 'column', sm: 'row' }}
                                      gap={1.5}
                                      alignSelf="end"
                                    >
                                    <Button
                                        onClick={() => {
                                        setType('approve');
                                        draftVideoMethods.setValue('type', 'approve');
                                        draftVideoMethods.setValue('feedback', '');
                                        draftVideoMethods.setValue('reasons', []);
                                        }}
                                        size="small"
                                        sx={{
                                          bgcolor: 'white',
                                          border: 1,
                                          borderRadius: 0.8,
                                          borderColor: '#e7e7e7',
                                          borderBottom: 3,
                                          borderBottomColor: '#e7e7e7',
                                          color: 'text.primary',
                                          '&:hover': {
                                            bgcolor: '#f5f5f5',
                                            borderColor: '#e7e7e7',
                                          },
                                          textTransform: 'none',
                                          px: 2.5,
                                          py: 1.2,
                                          fontSize: '0.875rem',
                                          minWidth: '80px',
                                          height: '45px',
                                        }}
                                      >
                                        Back
                                      </Button>
                                      <LoadingButton
                                        variant="contained"
                                        size="small"
                                      onClick={request.onTrue}
                                      disabled={selectedVideosForChange.length === 0}
                                        sx={{
                                          bgcolor: '#2e6c56',
                                          color: 'white',
                                          borderBottom: 3,
                                          borderBottomColor: '#1a3b2f',
                                          borderRadius: 0.8,
                                          px: 2.5,
                                          py: 1.2,
                                          '&:hover': {
                                            bgcolor: '#2e6c56',
                                            opacity: 0.9,
                                          },
                                          fontSize: '0.875rem',
                                          minWidth: '80px',
                                          height: '45px',
                                          textTransform: 'none',
                                        }}
                                      >
                                      Submit
                                    </LoadingButton>
                                  </Stack>
                                </Stack>

                                {confirmationRequestModal(request.value, request.onFalse)}
                              </FormProvider>
                            )}
                          </Box>
                        )}
                      </>
                    )}

                    {selectedTab === 'rawFootages' && (
                      <>
                        {submission?.rawFootages?.length > 0 ? (
                          <Grid container spacing={{ xs: 1, sm: 2 }}>
                            {submission.rawFootages.map((footage, index) => (
                              <Grid item xs={12} sm={6} md={4} key={footage.id || index}>
                                <Box
                                  sx={{
                                    position: 'relative',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    boxShadow: 2,
                                    aspectRatio: '16/9',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => handleVideoClick(index)}
                                >
                                  <Box
                                    component="video"
                                    src={footage.url}
                                    sx={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                  />
                                  {/* Add indicator for footages that need changes */}
                                  {submission?.status === 'CHANGES_REQUIRED' &&
                                    submission?.feedback?.some((feedback) =>
                                      feedback.rawFootageToUpdate?.includes(footage.id)
                                    ) && (
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          top: 8,
                                          left: 8,
                                          bgcolor: 'warning.main',
                                          color: 'warning.contrastText',
                                          borderRadius: 1,
                                          px: 1,
                                          py: 0.5,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.5,
                                          zIndex: 1,
                                        }}
                                      >
                                        <Iconify icon="solar:pen-bold" width={16} />
                                        <Typography variant="caption" fontWeight="bold">
                                          Changes Requested
                                        </Typography>
                                      </Box>
                                    )}
                                  {/* Checkbox for raw footage selection */}
                                  {rawFootageType === 'request' &&
                                    !(
                                      submission?.status === 'CHANGES_REQUIRED' &&
                                      submission?.feedback?.some((feedback) =>
                                        feedback.rawFootageToUpdate?.includes(footage.id)
                                      )
                                    ) && (
                                      <Checkbox
                                        checked={selectedRawFootagesForChange.includes(footage.id)}
                                        onChange={(event) =>
                                          handleRawFootageSelection(event, footage.id)
                                        }
                                        onClick={(event) => event.stopPropagation()}
                                        sx={{
                                          position: 'absolute',
                                          top: 8,
                                          right: 8,
                                          color: 'white',
                                          '&.Mui-checked': {
                                            color: 'primary.main',
                                          },
                                          bgcolor: 'rgba(0,0,0,0.3)',
                                          borderRadius: 1,
                                          zIndex: 1,
                                        }}
                                      />
                                    )}
                                  <Box
                                    onClick={() => handleVideoClick(index)}
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      bgcolor: 'rgba(0, 0, 0, 0.3)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Iconify
                                      icon="mdi:play"
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        color: 'white',
                                        opacity: 0.9,
                                      }}
                                    />
                                  </Box>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        ) : (
                          <Typography>No raw footage uploaded yet.</Typography>
                        )}

                        {/* Raw Footage Google Drive link */}
                        {submission?.rawFootagesDriveLink && (
                          <Box
                            sx={{
                              mt: 2,
                              display: 'flex',
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              bgcolor: 'background.neutral',
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                width: 64,
                                minHeight: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: '#e8ecfc',
                                borderRight: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <Iconify
                                icon="logos:google-drive"
                                sx={{
                                  width: 28,
                                  height: 28,
                                  color: '#1340ff',
                                }}
                              />
                            </Box>

                            <Box sx={{ p: 2, flex: 1 }}>
                              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                Additional Raw Footage
                              </Typography>
                              <Link
                                href={submission.rawFootagesDriveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: '#1340ff',
                                  textDecoration: 'none',
                                  '&:hover': {
                                    color: '#1340ff',
                                    textDecoration: 'underline',
                                    opacity: 0.8,
                                  },
                                  wordBreak: 'break-all',
                                }}
                              >
                                <Iconify
                                  icon="eva:external-link-fill"
                                  sx={{
                                    mr: 0.5,
                                    width: 16,
                                    height: 16,
                                    color: '#1340ff',
                                  }}
                                />
                                {submission.rawFootagesDriveLink}
                              </Link>
                            </Box>
                          </Box>
                        )}

                        {/* Raw Footage Request Section */}
                        {(submission?.status === 'PENDING_REVIEW' ||
                          submission?.status === 'CHANGES_REQUIRED') &&
                          !areAllRawFootagesMarkedForChanges() && (
                            <Box
                              component={Paper}
                              sx={{
                                p: { xs: 2, sm: 3 },
                                mt: 3,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              {rawFootageType === 'approve' && (
                                <FormProvider
                                  methods={rawFootageMethods}
                                  onSubmit={onSubmitRawFootage}
                                >
                                  <Stack gap={2}>
                                    <Stack
                                      alignItems={{ xs: 'stretch', sm: 'center' }}
                                      direction={{ xs: 'column', sm: 'row' }}
                                      gap={1.5}
                                      justifyContent="end"
                                    >
                                      <Button
                                        onClick={() => {
                                          setRawFootageType('request');
                                          setValue('type', 'request');
                                          setValue('footageFeedback', '');
                                        }}
                                        disabled={isDisabled}
                                        size="small"
                                        variant="contained"
                                        startIcon={<Iconify icon="solar:close-circle-bold" />}
                                        sx={{
                                          bgcolor: 'white',
                                          border: 1,
                                          borderRadius: 0.8,
                                          borderColor: '#e7e7e7',
                                          borderBottom: 3,
                                          borderBottomColor: '#e7e7e7',
                                          color: 'error.main',
                                          '&:hover': {
                                            bgcolor: '#e7e7e7',
                                            borderColor: '#e7e7e7',
                                          },
                                          '&:disabled': {
                                            display: 'none',
                                          },
                                          textTransform: 'none',
                                          px: 2.5,
                                          py: 1.2,
                                          fontSize: '0.875rem',
                                          minWidth: '80px',
                                          height: '45px',
                                        }}
                                      >
                                        Request a change
                                      </Button>
                                    </Stack>
                                  </Stack>
                                </FormProvider>
                              )}
                              {rawFootageType === 'request' && (
                                <>
                                  <Typography variant="h6" mb={1} mx={1}>
                                    Request Changes
                                  </Typography>
                                  <FormProvider
                                    methods={rawFootageMethods}
                                    onSubmit={onSubmitRawFootage}
                                    disabled={isDisabled}
                                  >
                                    <Stack gap={2}>
                                      <RHFTextField
                                        name="footageFeedback"
                                        multiline
                                        minRows={5}
                                        placeholder="Provide feedback for selected raw footage."
                                      />

                                      {rawFootageType === 'request' &&
                                        selectedRawFootagesForChange.length === 0 && (
                                          <Typography
                                            color="warning.main"
                                            sx={{
                                              mt: 1,
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 1,
                                            }}
                                          >
                                            <Iconify icon="solar:danger-triangle-bold" />
                                            Please select at least one raw footage that needs
                                            changes.
                                          </Typography>
                                        )}

                                      <Stack
                                        alignItems={{ xs: 'stretch', sm: 'center' }}
                                        direction={{ xs: 'column', sm: 'row' }}
                                        gap={1.5}
                                        alignSelf="end"
                                      >
                                        <Button
                                          onClick={() => {
                                            setRawFootageType('approve');
                                            rawFootageMethods.setValue('type', 'approve');
                                            rawFootageMethods.setValue('footageFeedback', '');
                                            rawFootageMethods.setValue('reasons', []);
                                          }}
                                          size="small"
                                          sx={{
                                            bgcolor: 'white',
                                            border: 1,
                                            borderRadius: 0.8,
                                            borderColor: '#e7e7e7',
                                            borderBottom: 3,
                                            borderBottomColor: '#e7e7e7',
                                            color: 'text.primary',
                                            '&:hover': {
                                              bgcolor: '#f5f5f5',
                                              borderColor: '#e7e7e7',
                                            },
                                            textTransform: 'none',
                                            px: 2.5,
                                            py: 1.2,
                                            fontSize: '0.875rem',
                                            minWidth: '80px',
                                            height: '45px',
                                          }}
                                        >
                                          Back
                                        </Button>
                                        <LoadingButton
                                          variant="contained"
                                          size="small"
                                          onClick={rawFootageRequest.onTrue}
                                          disabled={
                                            rawFootageType === 'request' &&
                                            selectedRawFootagesForChange.length === 0
                                          }
                                          sx={{
                                            bgcolor: '#2e6c56',
                                            color: 'white',
                                            borderBottom: 3,
                                            borderBottomColor: '#1a3b2f',
                                            borderRadius: 0.8,
                                            px: 2.5,
                                            py: 1.2,
                                            '&:hover': {
                                              bgcolor: '#2e6c56',
                                              opacity: 0.9,
                                            },
                                            fontSize: '0.875rem',
                                            minWidth: '80px',
                                            height: '45px',
                                            textTransform: 'none',
                                          }}
                                        >
                                          Submit
                                        </LoadingButton>
                                      </Stack>
                                    </Stack>

                                    {confirmationRequestModal(
                                      rawFootageRequest.value,
                                      rawFootageRequest.onFalse
                                    )}
                                  </FormProvider>
                                </>
                              )}
                            </Box>
                          )}
                      </>
                    )}

                    {selectedTab === 'photos' && (
                      <>
                        {submission?.photos?.length > 0 ? (
                          <Grid container spacing={2}>
                            {submission.photos.map((photo, index) => (
                              <Grid item xs={12} sm={6} md={4} key={photo.id || index}>
                                <Box
                                  sx={{
                                    position: 'relative',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    boxShadow: 2,
                                    height: '169px',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => handleImageClick(index)}
                                >
                                  <Box
                                    component="img"
                                    src={photo.url}
                                    alt={`Photo ${index + 1}`}
                                    sx={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                  />

                                  {/* Add indicator for photos that need changes */}
                                  {submission?.status === 'CHANGES_REQUIRED' &&
                                    submission?.feedback?.some((feedback) =>
                                      feedback.photosToUpdate?.includes(photo.id)
                                    ) && (
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          top: 8,
                                          left: 8,
                                          bgcolor: 'warning.main',
                                          color: 'warning.contrastText',
                                          borderRadius: 1,
                                          px: 1,
                                          py: 0.5,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.5,
                                          zIndex: 1,
                                        }}
                                      >
                                        <Iconify icon="solar:pen-bold" width={16} />
                                        <Typography variant="caption" fontWeight="bold">
                                          Changes Requested
                                        </Typography>
                                      </Box>
                                    )}
                                  {/* Checkbox for photo selection */}
                                  {photosType === 'request' &&
                                    !(
                                      submission?.status === 'CHANGES_REQUIRED' &&
                                      submission?.feedback?.some((feedback) =>
                                        feedback.photosToUpdate?.includes(photo.id)
                                      )
                                    ) && (
                                      <Checkbox
                                        checked={selectedPhotosForChange.includes(photo.id)}
                                        onChange={(event) => handlePhotoSelection(event, photo.id)}
                                        onClick={(event) => event.stopPropagation()}
                                        sx={{
                                          position: 'absolute',
                                          top: 8,
                                          right: 8,
                                          color: 'white',
                                          '&.Mui-checked': {
                                            color: 'primary.main',
                                          },
                                          bgcolor: 'rgba(0,0,0,0.3)',
                                          borderRadius: 1,
                                          zIndex: 1,
                                        }}
                                      />
                                    )}
                                  <Box
                                    onClick={() => handleImageClick(index)}
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      bgcolor: 'rgba(0, 0, 0, 0.3)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  />
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        ) : (
                          <Typography>No photos uploaded yet.</Typography>
                        )}

                        {/* Photos Google Drive link */}
                        {submission?.photosDriveLink && (
                          <Box
                            sx={{
                              mt: 2,
                              display: 'flex',
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              bgcolor: 'background.neutral',
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                width: 64,
                                minHeight: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: '#e8ecfc',
                                borderRight: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <Iconify
                                icon="logos:google-drive"
                                sx={{
                                  width: 28,
                                  height: 28,
                                  color: '#1340ff',
                                }}
                              />
                            </Box>

                            <Box sx={{ p: 2, flex: 1 }}>
                              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                Additional Photos
                              </Typography>
                              <Link
                                href={submission.photosDriveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: '#1340ff',
                                  textDecoration: 'none',
                                  '&:hover': {
                                    color: '#1340ff',
                                    textDecoration: 'underline',
                                    opacity: 0.8,
                                  },
                                  wordBreak: 'break-all',
                                }}
                              >
                                <Iconify
                                  icon="eva:external-link-fill"
                                  sx={{
                                    mr: 0.5,
                                    width: 16,
                                    height: 16,
                                    color: '#1340ff',
                                  }}
                                />
                                {submission.photosDriveLink}
                              </Link>
                            </Box>
                          </Box>
                        )}

                        {/* Photos Request Section */}
                        {(submission?.status === 'PENDING_REVIEW' ||
                          submission?.status === 'CHANGES_REQUIRED') &&
                          !areAllPhotosMarkedForChanges() && (
                            <Box
                              component={Paper}
                              sx={{
                                p: { xs: 2, sm: 3 },
                                mt: 3,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              {photosType === 'approve' && (
                                <FormProvider methods={photoMethods} onSubmit={onSubmitPhotos}>
                                  <Stack gap={2}>
                                    <Stack
                                      alignItems={{ xs: 'stretch', sm: 'center' }}
                                      direction={{ xs: 'column', sm: 'row' }}
                                      gap={1.5}
                                      justifyContent="end"
                                    >
                                      <Button
                                        onClick={() => {
                                          setPhotosType('request');
                                          photoMethods.setValue('type', 'request');
                                          photoMethods.setValue('photoFeedback', '');
                                        }}
                                        disabled={isDisabled}
                                        size="small"
                                        variant="contained"
                                        startIcon={<Iconify icon="solar:close-circle-bold" />}
                                        sx={{
                                          bgcolor: 'white',
                                          border: 1,
                                          borderRadius: 0.8,
                                          borderColor: '#e7e7e7',
                                          borderBottom: 3,
                                          borderBottomColor: '#e7e7e7',
                                          color: 'error.main',
                                          '&:hover': {
                                            bgcolor: '#e7e7e7',
                                            borderColor: '#e7e7e7',
                                          },
                                          '&:disabled': {
                                            display: 'none',
                                          },
                                          textTransform: 'none',
                                          px: 2.5,
                                          py: 1.2,
                                          fontSize: '0.875rem',
                                          minWidth: '80px',
                                          height: '45px',
                                        }}
                                      >
                                        Request a change
                                      </Button>
                                    </Stack>
                                  </Stack>
                                </FormProvider>
                              )}
                              {photosType === 'request' && (
                                <>
                                  <Typography variant="h6" mb={1} mx={1}>
                                    Request Changes
                                  </Typography>
                                  <FormProvider
                                    methods={photoMethods}
                                    onSubmit={onSubmitPhotos}
                                    disabled={isDisabled}
                                  >
                                    <Stack gap={2}>
                                      <RHFTextField
                                        name="photoFeedback"
                                        multiline
                                        minRows={5}
                                        placeholder="Provide feedback for selected photos."
                                      />

                                      {photosType === 'request' &&
                                        selectedPhotosForChange.length === 0 && (
                                          <Typography
                                            color="warning.main"
                                            sx={{
                                              mt: 1,
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 1,
                                            }}
                                          >
                                            <Iconify icon="solar:danger-triangle-bold" />
                                            Please select at least one photo that needs changes.
                                          </Typography>
                                        )}

                                      <Stack
                                        alignItems={{ xs: 'stretch', sm: 'center' }}
                                        direction={{ xs: 'column', sm: 'row' }}
                                        gap={1.5}
                                        alignSelf="end"
                                      >
                                        <Button
                                          onClick={() => {
                                            setPhotosType('approve');
                                            photoMethods.setValue('type', 'approve');
                                            photoMethods.setValue('photoFeedback', '');
                                          }}
                                          size="small"
                                          sx={{
                                            bgcolor: 'white',
                                            border: 1,
                                            borderRadius: 0.8,
                                            borderColor: '#e7e7e7',
                                            borderBottom: 3,
                                            borderBottomColor: '#e7e7e7',
                                            color: 'text.primary',
                                            '&:hover': {
                                              bgcolor: '#f5f5f5',
                                              borderColor: '#e7e7e7',
                                            },
                                            textTransform: 'none',
                                            px: 2.5,
                                            py: 1.2,
                                            fontSize: '0.875rem',
                                            minWidth: '80px',
                                            height: '45px',
                                          }}
                                        >
                                          Back
                                        </Button>
                                        <LoadingButton
                                          variant="contained"
                                          size="small"
                                          onClick={photosRequest.onTrue}
                                          disabled={
                                            photosType === 'request' &&
                                            selectedPhotosForChange.length === 0
                                          }
                                          sx={{
                                            bgcolor: '#2e6c56',
                                            color: 'white',
                                            borderBottom: 3,
                                            borderBottomColor: '#1a3b2f',
                                            borderRadius: 0.8,
                                            px: 2.5,
                                            py: 1.2,
                                            '&:hover': {
                                              bgcolor: '#2e6c56',
                                              opacity: 0.9,
                                            },
                                            fontSize: '0.875rem',
                                            minWidth: '80px',
                                            height: '45px',
                                            textTransform: 'none',
                                          }}
                                        >
                                          Submit
                                        </LoadingButton>
                                      </Stack>
                                    </Stack>

                                    {confirmationRequestModal(
                                      photosRequest.value,
                                      photosRequest.onFalse
                                    )}
                                  </FormProvider>
                                </>
                              )}
                            </Box>
                          )}
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Video/Photo Modal */}
      <PreviewModal
        open={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setSelectedMedia(null);
          setMediaType(null);
        }}
        selectedMedia={selectedMedia}
        mediaType={mediaType}
      />

      {/* Video Modal */}
      <Dialog
        open={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        maxWidth="xl"
        PaperProps={{
          sx: {
            width: '90vw',
            maxWidth: '1400px',
            height: 'auto',
            maxHeight: '90vh',
            m: 'auto',
            borderRadius: 2,
            bgcolor: 'background.paper',
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 3,
            pb: 1,
            mb: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: { xs: '2rem', sm: '2.4rem' },
                fontWeight: 550,
                m: 0,
              }}
            >
              Preview Raw Footage
            </Typography>
            <IconButton
              onClick={() => setVideoModalOpen(false)}
              sx={{
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Video Section */}
            <Grid item xs={12} md={8}>
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16/9',
                    bgcolor: 'black',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component="video"
                    src={submission?.rawFootages?.[currentVideoIndex]?.url}
                    controls
                    autoPlay
                    onLoadedMetadata={handleVideoMetadata}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>

                {/* Navigation Arrows */}
                {submission?.rawFootages?.length > 1 && (
                  <>
                    <IconButton
                      onClick={() =>
                        setCurrentVideoIndex((prev) =>
                          prev > 0 ? prev - 1 : submission.rawFootages.length - 1
                        )
                      }
                      sx={{
                        position: 'absolute',
                        left: -20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'background.paper',
                        boxShadow: 2,
                        '&:hover': { bgcolor: 'background.paper', opacity: 0.9 },
                      }}
                    >
                      <Iconify icon="eva:arrow-ios-back-fill" />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        setCurrentVideoIndex((prev) =>
                          prev < submission.rawFootages.length - 1 ? prev + 1 : 0
                        )
                      }
                      sx={{
                        position: 'absolute',
                        right: -20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'background.paper',
                        boxShadow: 2,
                        '&:hover': { bgcolor: 'background.paper', opacity: 0.9 },
                      }}
                    >
                      <Iconify icon="eva:arrow-ios-forward-fill" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Grid>

            {/* Metadata Section */}
            <Grid
              item
              xs={12}
              md={4}
              sx={{
                pl: { md: 4 },
                pt: { xs: 3, md: 0 },
              }}
            >
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    File Name
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      wordBreak: 'break-all',
                      bgcolor: 'grey.100',
                      p: 1.5,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                    }}
                  >
                    {submission?.rawFootages?.[currentVideoIndex]?.url?.split('/').pop() ||
                      'Untitled Video'}
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    p: 2,
                    bgcolor: 'background.neutral',
                    borderRadius: 1,
                  }}
                >
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      File Size
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {videoDetails.size}
                    </Typography>
                  </Box>

                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      File Type
                    </Typography>
                    <Chip
                      label={
                        submission?.rawFootages?.[currentVideoIndex]?.url
                          ?.split('.')
                          ?.pop()
                          ?.toUpperCase()
                          ?.match(/(MP4|MOV|AVI|WMV|FLV|WEBM|MKV)/)?.[0] || 'Unknown'
                      }
                      size="small"
                      sx={{
                        bgcolor: 'primary.lighter',
                        color: 'primary.main',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Stack>

                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    p: 2,
                    bgcolor: 'background.neutral',
                    borderRadius: 1,
                  }}
                >
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Resolution
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {videoDetails.resolution}
                    </Typography>
                  </Box>

                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Duration
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {Math.floor(videoDetails.duration / 60)}m {videoDetails.duration % 60}s
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Iconify icon="eva:download-fill" />}
                  onClick={() => handleDownload(submission?.rawFootages?.[currentVideoIndex]?.url)}
                  sx={{
                    mt: 1,
                    bgcolor: '#2e6c56',
                    color: 'white',
                    borderBottom: 3,
                    borderBottomColor: '#1a3b2f',
                    borderRadius: 0.8,
                    '&:hover': {
                      bgcolor: '#2e6c56',
                      opacity: 0.9,
                    },
                  }}
                >
                  Download
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Photo Modal */}
      <Dialog
        open={fullImageOpen}
        onClose={handleFullImageClose}
        maxWidth={false}
        PaperProps={{
          sx: {
            maxWidth: { xs: '90vw', md: '50vw' },
            maxHeight: { xs: '90vh', md: '120vh' },
            m: 'auto',
            borderRadius: 0,
            overflow: 'hidden',
            bgcolor: 'transparent',
            boxShadow: 'none',
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
          }}
        >
          <IconButton
            onClick={handleFullImageClose}
            sx={{
              position: 'fixed',
              right: 16,
              top: 16,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
              zIndex: 1,
            }}
          >
            <Iconify icon="eva:close-fill" />
          </IconButton>
          {submission?.photos?.[currentImageIndex] && (
            <Box
              component="img"
              src={submission.photos[currentImageIndex].url}
              alt={`Full size photo ${currentImageIndex + 1}`}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          )}
          {submission?.photos && submission.photos.length > 1 && (
            <>
              <IconButton
                onClick={handlePrevImage}
                sx={{
                  position: 'fixed',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                }}
              >
                <Iconify icon="eva:arrow-ios-back-fill" />
              </IconButton>
              <IconButton
                onClick={handleNextImage}
                sx={{
                  position: 'fixed',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                }}
              >
                <Iconify icon="eva:arrow-ios-forward-fill" />
              </IconButton>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Draft Video Modal */}
      <Dialog
        open={draftVideoModalOpen}
        onClose={() => setDraftVideoModalOpen(false)}
        maxWidth="xl"
        PaperProps={{
          sx: {
            width: '90vw',
            maxWidth: '1400px',
            height: 'auto',
            maxHeight: '90vh',
            m: 'auto',
            borderRadius: 2,
            bgcolor: 'background.paper',
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 3,
            pb: 2,
            mb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: { xs: '2rem', sm: '2.4rem' },
                fontWeight: 550,
                m: 0,
              }}
            >
              Preview Draft Video
            </Typography>
            <IconButton
              onClick={() => setDraftVideoModalOpen(false)}
              sx={{
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Iconify icon="hugeicons:cancel-01" width={20} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Video Section */}
            <Grid item xs={12} md={8}>
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    bgcolor: 'black',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component="video"
                    src={submission?.video?.[currentDraftVideoIndex]?.url}
                    controls
                    autoPlay
                    onLoadedMetadata={handleDraftVideoMetadata}
                    sx={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '70vh',
                      objectFit: 'contain',
                    }}
                  />
                </Box>

                {/* Navigation Arrows */}
                {submission?.video?.length > 1 && (
                  <>
                    <IconButton
                      onClick={() =>
                        setCurrentDraftVideoIndex((prev) =>
                          prev > 0 ? prev - 1 : submission.video.length - 1
                        )
                      }
                      sx={{
                        position: 'absolute',
                        left: -20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'background.paper',
                        boxShadow: 2,
                        '&:hover': { bgcolor: 'background.paper', opacity: 0.9 },
                      }}
                    >
                      <Iconify icon="eva:arrow-ios-back-fill" />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        setCurrentDraftVideoIndex((prev) =>
                          prev < submission.video.length - 1 ? prev + 1 : 0
                        )
                      }
                      sx={{
                        position: 'absolute',
                        right: -20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'background.paper',
                        boxShadow: 2,
                        '&:hover': { bgcolor: 'background.paper', opacity: 0.9 },
                      }}
                    >
                      <Iconify icon="eva:arrow-ios-forward-fill" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Grid>

            {/* Metadata Section */}
            <Grid
              item
              xs={12}
              md={4}
              sx={{
                pl: { md: 4 },
                pt: { xs: 3, md: 0 },
              }}
            >
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    File Name
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      wordBreak: 'break-all',
                      bgcolor: 'grey.100',
                      p: 1.5,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                    }}
                  >
                    {submission?.video?.[currentDraftVideoIndex]?.url?.split('/').pop() ||
                      'Untitled Video'}
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    p: 2,
                    bgcolor: 'background.neutral',
                    borderRadius: 1,
                  }}
                >
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      File Size
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {draftVideoDetails.size}
                    </Typography>
                  </Box>

                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      File Type
                    </Typography>
                    <Chip
                      label={
                        submission?.video?.[currentDraftVideoIndex]?.url
                          ?.split('.')
                          ?.pop()
                          ?.toUpperCase()
                          ?.match(/(MP4|MOV|AVI|WEBM)/)?.[0] || 'Unknown'
                      }
                      size="small"
                      sx={{
                        bgcolor: 'primary.lighter',
                        color: 'primary.main',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Stack>

                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    p: 2,
                    bgcolor: 'background.neutral',
                    borderRadius: 1,
                  }}
                >
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Resolution
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {draftVideoDetails.resolution}
                    </Typography>
                  </Box>

                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Duration
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {Math.floor(draftVideoDetails.duration / 60)}m{' '}
                      {draftVideoDetails.duration % 60}s
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Iconify icon="eva:download-fill" />}
                  onClick={() => handleDownload(submission?.video?.[currentDraftVideoIndex]?.url)}
                  sx={{
                    mt: 1,
                    bgcolor: '#2e6c56',
                    color: 'white',
                    borderBottom: 3,
                    borderBottomColor: '#1a3b2f',
                    borderRadius: 0.8,
                    '&:hover': {
                      bgcolor: '#2e6c56',
                      opacity: 0.9,
                    },
                  }}
                >
                  Download
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default FirstDraft;

FirstDraft.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  creator: PropTypes.object,
};
