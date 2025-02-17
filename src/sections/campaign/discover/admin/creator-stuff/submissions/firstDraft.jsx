/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/media-has-caption */
import dayjs from 'dayjs';
import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
/* eslint-disable no-undef */
import React, { useMemo, useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import Avatar from '@mui/material/Avatar';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
  Tab,
  Grid,
  Chip,
  Tabs,
  Paper,
  Stack,
  Button,
  Dialog,
  Typography,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Divider,
  Checkbox,
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
  
  return `${Math.round(bytes / (k ** i))} ${sizes[i]}`;
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
  const [type, setType] = useState('approve');
  const approve = useBoolean();
  const request = useBoolean();
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
  const [selectedVideosForChange, setSelectedVideosForChange] = useState([]);

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

  const methods = useForm({
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

  const {
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { isSubmitting },
  } = methods;

  const scheduleStartDate = watch('schedule.startDate');

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  // console.log(submission);

  const onSubmit = handleSubmit(async (data) => {
    console.log({ ...data, selectedVideosForChange });

    try {
      const res = await axiosInstance.patch(endpoints.submission.admin.draft, {
        ...data,
        submissionId: submission.id,
        userId: creator?.user?.id,
        videosToUpdate: selectedVideosForChange,
      });
      mutate(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
      );
      enqueueSnackbar(res?.data?.message);
      approve.onFalse();
      request.onFalse();
      reset();
    } catch (error) {
      enqueueSnackbar('Error submitting', {
        variant: 'error',
      });
      approve.onFalse();
      request.onFalse();
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
            onSubmit();
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

          {/* Show selected reasons if any */}
          {watch('reasons')?.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Selected Reasons:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {watch('reasons').map((reason, index) => (
                  <Chip
                    key={index}
                    label={reason}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
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
          variant="contained"
          size="small"
          onClick={() => {
            setValue('type', 'request');
            onSubmit();
          }}
          disabled={type === 'request' && selectedVideosForChange.length === 0}
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

  const handlePreviewClick = (mediaUrl) => {
    setSelectedMedia(mediaUrl);
    setMediaType(type);
    setPreviewModalOpen(true);
  };

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
    setSelectedVideosForChange(prev => {
      if (prev.includes(id)) {
        return prev.filter(videoId => videoId !== id);
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
            p: 2,
            borderRadius: 2,
            bgcolor: 'warning.lighter',
            border: '1px solid',
            borderColor: 'warning.light',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Iconify icon="solar:danger-triangle-bold" color="warning.main" />
          <Typography color="warning.darker">
            Changes have been requested for this submission
          </Typography>
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
            gap: 1
          }}
        >
          <Iconify icon="solar:check-circle-bold" color="success.main" />
          <Typography color="success.darker">
            This submission has been approved
          </Typography>
        </Box>
      );
    }

    return null;
  };

  useEffect(() => {
    let initialTab = 'video';
    
    if (!campaign?.video) {
      if (campaign?.rawFootage) initialTab = 'rawFootages';
      else if (campaign?.photos) initialTab = 'photos';
    }
    
    setSelectedTab(initialTab);
  }, [campaign]);

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
              !submission?.content &&
              !submission?.videos?.length &&
              !submission?.photos?.length &&
              !submission?.rawFootages?.length && (
                <EmptyContent title="Creator has not uploaded any deliverables yet." />
              )}
            {(submission?.status === 'PENDING_REVIEW' ||
              submission?.status === 'APPROVED' ||
              submission?.status === 'CHANGES_REQUIRED' ||
              (submission?.status === 'IN_PROGRESS' &&
                (submission?.content ||
                  submission?.videos?.length > 0 ||
                  submission?.photos?.length > 0 ||
                  submission?.rawFootages?.length > 0))) && (
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
                          <Typography variant="caption">{submission?.video?.length || 0} videos</Typography>
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
                            <Typography variant="caption">{submission?.rawFootages?.length || 0} files</Typography>
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
                            <Typography variant="caption">{submission?.photos?.length || 0} images</Typography>
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
                      mb: 3
                    }}
                  >
                    {selectedTab === 'video' && (
                      <>
                        {submission?.video?.length > 0 ||
                        submission?.videos?.[0]?.url ||
                        submission?.content ||
                        submission?.draftVideo?.[0]?.preview ? (
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
                                  
                                  {/* Add indicator for videos that need changes */}
                                  {submission?.status === 'CHANGES_REQUIRED' && 
                                   submission?.feedback?.[0]?.videosToUpdate?.includes(videoItem.id) && (
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
                                        Needs Changes
                                      </Typography>
                                    </Box>
                                  )}

                                  {/* Existing checkbox for video selection */}
                                  {type === 'request' && (
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

                        {/* Schedule Post and Request Changes Section */}
                        {submission?.status === 'PENDING_REVIEW' && (
                          <Box
                            component={Paper}
                            sx={{
                              p: { xs: 2, sm: 3 },
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            {type === 'approve' && (
                              <FormProvider methods={methods} onSubmit={onSubmit}>
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
                                      minDate={dayjs(scheduleStartDate)}
                                    />
                                  </Stack>
                                </Stack>
                                <Typography variant="subtitle1" mb={1} mx={1}>
                                  Comments For Creator
                                </Typography>
                                <Stack gap={2}>
                                  <RHFTextField
                                    name="feedback"
                                    multiline
                                    minRows={5}
                                    placeholder="Comment"
                                  />
                                  <Stack
                                    alignItems={{ xs: 'stretch', sm: 'center' }}
                                    direction={{ xs: 'column', sm: 'row' }}
                                    gap={1.5}
                                    justifyContent="end"
                                  >
                                    <Button
                                      onClick={() => {
                                        setType('request');
                                        setValue('type', 'request');
                                        setValue('feedback', '');
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
                                          bgcolor: 'error.lighter',
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
                                    <LoadingButton
                                      onClick={approve.onTrue}
                                      disabled={isDisabled}
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
                                        '&:disabled': {
                                          display: 'none',
                                        },
                                        fontSize: '0.875rem',
                                        minWidth: '80px',
                                        height: '45px',
                                      }}
                                    >
                                      Approve
                                    </LoadingButton>
                                  </Stack>
                                </Stack>
                                {confirmationApproveModal(approve.value, approve.onFalse)}
                              </FormProvider>
                            )}
                            {type === 'request' && (
                              <>
                                <Typography variant="h6" mb={1} mx={1}>
                                  Request Changes
                                </Typography>
                                <FormProvider
                                  methods={methods}
                                  onSubmit={onSubmit}
                                  disabled={isDisabled}
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
                                      placeholder="Feedback"
                                    />

                                    {type === 'request' && selectedVideosForChange.length === 0 && (
                                      <Typography 
                                        color="warning.main" 
                                        sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                                      >
                                        <Iconify icon="solar:danger-triangle-bold" />
                                        Please select at least one video that needs changes
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
                                          setValue('type', 'approve');
                                          setValue('feedback', '');
                                          setValue('reasons', []);
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
                                        disabled={type === 'request' && selectedVideosForChange.length === 0}
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
                              </>
                            )}
                          </Box>
                        )}
                      </>
                    )}

                    {selectedTab === 'rawFootages' && (
                      <>
                        {submission?.rawFootages?.length > 0 ? (
                          <Grid container spacing={2}>
                            {submission.rawFootages.map((footage, index) => (
                              <Grid item xs={12} sm={6} md={4} key={footage.id || index}>
                                <Box
                                  sx={{
                                    position: 'relative',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    boxShadow: 2,
                                    height: '169px',
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
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      bgcolor: 'rgba(0, 0, 0, 0.3)',
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
                                    borderRadius: 2,
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
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        ) : (
                          <Typography>No photos uploaded yet.</Typography>
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
                      onClick={() => setCurrentVideoIndex((prev) => 
                        prev > 0 ? prev - 1 : submission.rawFootages.length - 1
                      )}
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
                      onClick={() => setCurrentVideoIndex((prev) => 
                        prev < submission.rawFootages.length - 1 ? prev + 1 : 0
                      )}
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
                    {submission?.rawFootages?.[currentVideoIndex]?.url?.split('/').pop() || 'Untitled Video'}
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
                      label={submission?.rawFootages?.[currentVideoIndex]?.url
                        ?.split('.')
                        ?.pop()
                        ?.toUpperCase()
                        ?.match(/(MP4|MOV|AVI|WMV|FLV|WEBM|MKV)/)?.[0] || 'Unknown'}
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
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'background.paper',
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
                      onClick={() => setCurrentDraftVideoIndex((prev) => 
                        prev > 0 ? prev - 1 : submission.video.length - 1
                      )}
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
                      onClick={() => setCurrentDraftVideoIndex((prev) => 
                        prev < submission.video.length - 1 ? prev + 1 : 0
                      )}
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
                    {submission?.video?.[currentDraftVideoIndex]?.url?.split('/').pop() || 'Untitled Video'}
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
                      label={submission?.video?.[currentDraftVideoIndex]?.url
                        ?.split('.')
                        ?.pop()
                        ?.toUpperCase()
                        ?.match(/(MP4|MOV|AVI|WEBM)/)?.[0] || 'Unknown'}
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
                      {Math.floor(draftVideoDetails.duration / 60)}m {draftVideoDetails.duration % 60}s
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
