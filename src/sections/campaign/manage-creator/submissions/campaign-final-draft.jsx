/* eslint-disable no-nested-ternary */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable jsx-a11y/media-has-caption */
import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Chip,
  Stack,
  Paper,
  Button,
  Dialog,
  Avatar,
  Tooltip,
  useTheme,
  Typography,
  IconButton,
  DialogContent,
  DialogActions,
  useMediaQuery,
  LinearProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';

import UploadPhotoModal from './components/photo';
import UploadDraftVideoModal from './components/draft-video';
import UploadRawFootageModal from './components/raw-footage';
import { FinalDraftFileTypeModal } from './components/filetype-modal';
import {
  VideoModal,
  PhotoModal,
} from '../../discover/admin/creator-stuff/submissions/firstDraft/media-modals';

const truncateText = (text, maxLength) =>
  text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

const LoadingDots = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return `${prev}.`;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <span>{dots}</span>;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

const CampaignFinalDraft = ({
  campaign,
  timeline,
  submission,
  getDependency,
  fullSubmission,
  setCurrentTab,
  deliverablesData,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // const [progressName, setProgressName] = useState('');

  const [submitStatus, setSubmitStatus] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const dependency = getDependency(submission?.id);
  const { socket } = useSocketContext();
  const [progress, setProgress] = useState(0);
  const display = useBoolean();
  const inQueue = useBoolean();
  const savedCaption = localStorage.getItem('caption');
  // const [feedbackTab, setFeedbackTab] = useState('videos');
  const [uploadTypeModalOpen, setUploadTypeModalOpen] = useState(false);
  const [draftVideoModalOpen, setDraftVideoModalOpen] = useState(false);
  const [rawFootageModalOpen, setRawFootageModalOpen] = useState(false);
  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const { deliverables } = deliverablesData;
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [selectedRawFootageIndex, setSelectedRawFootageIndex] = useState(0);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Add state variables for media modals
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedVideoForModal, setSelectedVideoForModal] = useState(0);
  const [selectedPhotoForModal, setSelectedPhotoForModal] = useState(0);
  const [modalVideos, setModalVideos] = useState([]);
  const [modalPhotos, setModalPhotos] = useState([]);

  const { user } = useAuthContext();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const methods = useForm({
    defaultValues: {
      draft: [],
      caption: savedCaption || '',
    },
    resolver: (values) => {
      const errors = {};

      if (!values.caption || values.caption.trim() === '') {
        errors.caption = {
          type: 'required',
          message: 'Caption is required.',
        };
      }

      return {
        values,
        errors,
      };
    },
  });

  const { reset } = methods;

  const handleCancel = () => {
    if (isProcessing) {
      socket?.emit('cancel-processing', { submissionId: submission.id });
      setIsProcessing(false);
      setProgress(0);
      localStorage.removeItem('preview');
    }
  };

  // Handlers for media modals
  const handleVideoClick = (videos, index) => {
    setModalVideos(videos);
    setSelectedVideoForModal(index);
    setVideoModalOpen(true);
  };

  const handlePhotoClick = (photos, index) => {
    setModalPhotos(photos);
    setSelectedPhotoForModal(index);
    setPhotoModalOpen(true);
  };

  const previousSubmission = useMemo(
    () => fullSubmission?.find((item) => item?.id === dependency?.dependentSubmissionId),
    [fullSubmission, dependency]
  );

  useEffect(() => {
    if (!socket) return;

    const handleProgress = (data) => {
      if (submission?.id !== data.submissionId) return;

      setUploadProgress((prev) => {
        const exists = prev.some((item) => item.fileName === data.fileName);

        // const handleStatusQueue = (data) => {
        //   if (data?.status === 'queue') {
        //     inQueue.onTrue();
        //   }
        // };

        // socket.on('progress', handleProgress);
        // socket.on('statusQueue', handleStatusQueue);

        // socket.emit('checkQueue', { submissionId: submission?.id });

        //   return () => {
        //     socket.off('progress', handleProgress);
        //     socket.off('statusQueue');
        //   };
        // }, [socket, submission?.id, reset, campaign?.id, user?.id, inQueue]);

        if (exists) {
          return prev.map((item) =>
            item.fileName === data.fileName ? { ...item, ...data } : item
          );
        }
        return [...prev, data];
      });
    };

    socket.on('progress', handleProgress);

    // eslint-disable-next-line consistent-return
    return () => {
      socket.off('progress', handleProgress);
    };
  }, [socket, submission?.id, reset, campaign?.id, user?.id, inQueue]);

  const checkProgress = useCallback(() => {
    if (uploadProgress?.length && uploadProgress?.every((x) => x.progress === 100)) {
      const timer = setTimeout(() => {
        setIsProcessing(false);
        reset();
        localStorage.removeItem('preview');
        setUploadProgress([]);

        if (socket) {
          mutate(`${endpoints.submission.root}?creatorId=${user?.id}&campaignId=${campaign?.id}`);
        }
      }, 2000);

      return () => {
        clearTimeout(timer);
      };
    }
    return null;
  }, [uploadProgress, reset, campaign?.id, user?.id, socket]);

  useEffect(() => {
    checkProgress();
  }, [checkProgress]);

  const handleUploadTypeSelect = (type) => {
    if (submission?.status === 'PENDING_REVIEW') {
      enqueueSnackbar('Cannot upload while submission is under review', { variant: 'warning' });
      return;
    }

    switch (type) {
      case 'video':
        setDraftVideoModalOpen(true);
        break;
      case 'rawFootage':
        setRawFootageModalOpen(true);
        break;
      case 'photos':
        setPhotosModalOpen(true);
        break;
      default:
        break;
    }
    setUploadTypeModalOpen(false);
  };

  const handleUploadClick = () => {
    if (submission?.status === 'PENDING_REVIEW') {
      enqueueSnackbar('Cannot upload while submission is under review', { variant: 'warning' });
      return;
    }
    setUploadTypeModalOpen(true);
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setImageDialogOpen(true);
  };

  // Helper function to get the index for the caption tab
  const getTabIndex = (tab) => {
    if (tab === 'caption') {
      let index = 0;
      if (true) index += 1;
      if (deliverables?.rawFootages?.length > 0) index += 1;
      if (submission?.photos?.length > 0) index += 1;
      return index;
    }
    return 0;
  };

  // Helper function to get tab options for dropdown
  const getTabOptions = () => {
    const options = [{ value: 0, label: 'Draft Videos', icon: 'eva:video-outline' }];

    if (deliverables?.rawFootages?.length > 0) {
      options.push({ value: 1, label: 'Raw Footage', icon: 'eva:film-outline' });
    }

    if (submission?.photos?.length > 0) {
      options.push({
        value: deliverables?.rawFootages?.length > 0 ? 2 : 1,
        label: 'Photos',
        icon: 'eva:image-outline',
      });
    }

    return options;
  };

  return (
    previousSubmission?.status === 'CHANGES_REQUIRED' && (
      <Box p={1.5} sx={{ pb: 0 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            mt: { xs: 0, sm: -2 },
            ml: { xs: 0, sm: -1.2 },
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#221f20' }}>
            2nd Draft Submission 📝
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Due: {dayjs(submission?.dueDate).format('MMM DD, YYYY')}
          </Typography>
        </Box>

        <Box
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            mb: 3,
            mx: -1.5,
          }}
        />

        {/* To show upload progress */}
        <>
          {(submission?.status === 'IN_PROGRESS' || submission?.status === 'CHANGES_REQUIRED') &&
            !!uploadProgress.length && (
              <Stack spacing={1} mb={2}>
                {uploadProgress.length &&
                  uploadProgress.map((currentFile) => (
                    <Box
                      sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}
                      key={currentFile.fileName}
                    >
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          {currentFile?.type?.startsWith('video') ? (
                            <Box
                              sx={{
                                width: 120,
                                height: 68,
                                borderRadius: 1,
                                overflow: 'hidden',
                                position: 'relative',
                                bgcolor: 'background.paper',
                                boxShadow: theme.customShadows.z8,
                              }}
                            >
                              {currentFile.preview ? (
                                <Box
                                  component="img"
                                  src={currentFile.preview}
                                  sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'background.neutral',
                                  }}
                                >
                                  <Iconify
                                    icon="eva:video-outline"
                                    width={24}
                                    sx={{ color: 'text.secondary' }}
                                  />
                                </Box>
                              )}
                            </Box>
                          ) : (
                            <Box
                              component="img"
                              src="/assets/icons/files/ic_img.svg"
                              sx={{ width: 40, height: 40 }}
                            />
                          )}

                          <Stack spacing={1} flexGrow={1}>
                            <Typography variant="subtitle2" noWrap>
                              {truncateText(currentFile?.fileName, 50) || 'Uploading file...'}
                            </Typography>
                            <Stack spacing={1}>
                              <LinearProgress
                                variant="determinate"
                                value={currentFile?.progress || 0}
                                sx={{
                                  height: 6,
                                  borderRadius: 1,
                                  bgcolor: 'background.paper',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 1,
                                    bgcolor: progress === 100 ? 'success.main' : 'primary.main',
                                  },
                                }}
                              />
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {currentFile?.progress === 100 ? (
                                    <Box
                                      component="span"
                                      sx={{ color: 'success.main', fontWeight: 600 }}
                                    >
                                      Upload Complete
                                    </Box>
                                  ) : (
                                    `${currentFile?.name || 'Uploading'}... ${currentFile?.progress || 0}%`
                                  )}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {formatFileSize(currentFile?.fileSize || 0)}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Stack>
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
              </Stack>
            )}
        </>

        {submission?.status === 'PENDING_REVIEW' && (
          <Stack justifyContent="center" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 100,
                height: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                bgcolor: '#f4b84a',
                fontSize: '50px',
                mb: -2,
              }}
            >
              ⏳
            </Box>
            <Stack spacing={1} alignItems="center">
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Instrument Serif, serif',
                  fontSize: { xs: '1.5rem', sm: '2.5rem' },
                  fontWeight: 550,
                }}
              >
                In Review
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#636366',
                  mt: -1,
                }}
              >
                Your final draft is being reviewed.
              </Typography>
            </Stack>

            <Button
              onClick={() => {
                display.onTrue();
              }}
              variant="contained"
              startIcon={<Iconify icon="solar:document-bold" width={24} />}
              sx={{
                bgcolor: '#203ff5',
                color: 'white',
                borderBottom: 3.5,
                borderBottomColor: '#112286',
                borderRadius: 1.5,
                px: 2.5,
                py: 1,
                '&:hover': {
                  bgcolor: '#203ff5',
                  opacity: 0.9,
                },
              }}
            >
              Preview Draft
            </Button>
          </Stack>
        )}

        {submission?.status === 'IN_PROGRESS' && (
          <Stack gap={2}>
            <Box>
              {!uploadProgress.length && (
                <>
                  <Typography variant="body1" sx={{ color: '#221f20', mb: 2, ml: -1 }}>
                    Please submit your second draft for this campaign.
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#221f20', mb: 4, ml: -1 }}>
                    Make sure to address all the feedback provided for your first draft below.
                  </Typography>
                  <Box
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      mb: 2,
                      mx: -1.5,
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleUploadClick}
                      startIcon={<Iconify icon="material-symbols:add" width={24} />}
                      sx={{
                        bgcolor: '#203ff5',
                        color: 'white',
                        borderBottom: 3.5,
                        borderBottomColor: '#112286',
                        borderRadius: 1.5,
                        px: 2.5,
                        py: 1.2,
                        '&:hover': {
                          bgcolor: '#203ff5',
                          opacity: 0.9,
                        },
                      }}
                    >
                      Upload
                    </Button>
                  </Box>
                </>
              )}

              {previousSubmission?.status === 'CHANGES_REQUIRED' && (
                <Box sx={{ mt: 3 }}>
                  {campaign?.campaignCredits
                    ? previousSubmission?.feedback &&
                      previousSubmission.feedback.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                          <Stack spacing={1.5}>
                            {previousSubmission.feedback
                              .filter(
                                (feedback) =>
                                  feedback.type === 'REQUEST' &&
                                  (feedback.videosToUpdate?.length > 0 ||
                                    feedback.photosToUpdate?.length > 0 ||
                                    feedback.rawFootageToUpdate?.length > 0)
                              )
                              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                              .map((feedback, feedbackIndex) => (
                                <Box
                                  key={feedbackIndex}
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 1.5,
                                    bgcolor: '#FFFFFF',
                                    border: '1px solid',
                                    borderColor: '#e0e0e0',
                                  }}
                                >
                                  {/* Content Sections */}
                                  <Stack spacing={2}>
                                    {/* Videos requiring changes */}
                                    {feedback.videosToUpdate &&
                                      feedback.videosToUpdate.length > 0 &&
                                      deliverables?.videos && (
                                        <Box>
                                          <Box sx={{ mb: 2 }}>
                                            <Stack
                                              direction="row"
                                              alignItems="center"
                                              justifyContent="space-between"
                                              sx={{ mb: 1, ml: 1 }}
                                            >
                                              <Stack
                                                direction="row"
                                                alignItems="center"
                                                spacing={1}
                                              >
                                                <Iconify
                                                  icon="eva:video-outline"
                                                  sx={{ color: '#636366', width: 14, height: 14 }}
                                                />
                                                <Typography
                                                  variant="caption"
                                                  sx={{
                                                    color: '#636366',
                                                    display: 'block',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontWeight: 600,
                                                  }}
                                                >
                                                  Draft Videos
                                                </Typography>
                                              </Stack>
                                              <Stack
                                                direction="row"
                                                alignItems="center"
                                                spacing={1}
                                              >
                                                {feedback.videosToUpdate &&
                                                  feedback.videosToUpdate.length > 0 && (
                                                    <Stack
                                                      direction="row"
                                                      alignItems="center"
                                                      spacing={0.5}
                                                    >
                                                      <Iconify
                                                        icon="eva:close-fill"
                                                        sx={{
                                                          color: '#D4321C',
                                                          width: 14,
                                                          height: 14,
                                                        }}
                                                      />
                                                      <Typography
                                                        variant="caption"
                                                        sx={{
                                                          color: '#D4321C',
                                                          fontWeight: 600,
                                                          fontSize: '11px',
                                                        }}
                                                      >
                                                        {feedback.videosToUpdate.length}
                                                      </Typography>
                                                    </Stack>
                                                  )}
                                              </Stack>
                                            </Stack>
                                            <Box sx={{ height: '1px', bgcolor: '#e0e0e0' }} />
                                          </Box>
                                          <Stack spacing={2}>
                                            {deliverables.videos
                                              .filter((video) =>
                                                feedback.videosToUpdate.includes(video.id)
                                              )
                                              .map((video, index) => (
                                                <Box key={video.id}>
                                                  {/* Admin feedback */}
                                                  <Box
                                                    sx={{
                                                      p: 2,
                                                      borderRadius: 1.5,
                                                      bgcolor: '#f8f9fa',
                                                      border: '1px solid #e9ecef',
                                                      mb: 1.5,
                                                    }}
                                                  >
                                                    <Stack
                                                      direction="row"
                                                      alignItems="center"
                                                      spacing={1.5}
                                                    >
                                                      <Avatar
                                                        src={feedback.admin?.photoURL}
                                                        sx={{ width: 42, height: 42, mb: 0.5 }}
                                                      >
                                                        {feedback.admin?.name
                                                          ?.charAt(0)
                                                          ?.toUpperCase() || 'A'}
                                                      </Avatar>
                                                      <Box sx={{ flexGrow: 1 }}>
                                                        <Stack
                                                          direction="row"
                                                          alignItems="center"
                                                          spacing={1}
                                                        >
                                                          <Typography
                                                            variant="caption"
                                                            sx={{
                                                              fontWeight: 600,
                                                              color: '#212529',
                                                              fontSize: '0.9rem',
                                                            }}
                                                          >
                                                            {feedback.admin?.name || 'Admin'}
                                                          </Typography>
                                                          <Chip
                                                            label={
                                                              feedback.admin?.role
                                                                ? feedback.admin.role
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                  feedback.admin.role.slice(1)
                                                                : 'Admin'
                                                            }
                                                            size="small"
                                                            sx={{
                                                              bgcolor: '#e3f2fd',
                                                              color: '#1976d2',
                                                              fontSize: '0.7rem',
                                                              height: '18px',
                                                              fontWeight: 600,
                                                              '&:hover': {
                                                                bgcolor: '#e3f2fd',
                                                                color: '#1976d2',
                                                              },
                                                            }}
                                                          />
                                                        </Stack>
                                                        <Typography
                                                          variant="caption"
                                                          sx={{
                                                            color: '#6c757d',
                                                            fontSize: '0.7rem',
                                                            mb: -1,
                                                          }}
                                                        >
                                                          {dayjs(feedback.createdAt).format(
                                                            'MMM D, YYYY h:mm A'
                                                          )}
                                                        </Typography>
                                                      </Box>
                                                      {feedback.type === 'REQUEST' && (
                                                        <Box
                                                          sx={{
                                                            bgcolor: '#FFFFFF',
                                                            color: '#D4321C',
                                                            border: '1.5px solid',
                                                            borderColor: '#D4321C',
                                                            borderBottom: 3,
                                                            borderBottomColor: '#D4321C',
                                                            borderRadius: 1,
                                                            py: 0.8,
                                                            px: 1.5,
                                                            fontWeight: 600,
                                                            fontSize: '0.8rem',
                                                            height: '32px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            textTransform: 'none',
                                                          }}
                                                        >
                                                          CHANGES REQUESTED
                                                        </Box>
                                                      )}
                                                    </Stack>

                                                    {/* Feedback Text */}
                                                    {feedback.content && (
                                                      <Typography
                                                        variant="body2"
                                                        sx={{
                                                          color: '#495057',
                                                          mt: 1.5,
                                                          lineHeight: 1.5,
                                                          fontSize: '0.875rem',
                                                          mb: 2,
                                                        }}
                                                      >
                                                        {feedback.content}
                                                      </Typography>
                                                    )}

                                                    {/* Video and Reasons */}
                                                    <Stack
                                                      direction="row"
                                                      spacing={2}
                                                      alignItems="flex-start"
                                                    >
                                                      {/* Video */}
                                                      <Box
                                                        sx={{
                                                          border: '2px solid #D4321C',
                                                          borderRadius: 1.5,
                                                          overflow: 'hidden',
                                                          bgcolor: '#ffffff',
                                                          cursor: 'pointer',
                                                          flex: 1,
                                                          mb: 1,
                                                          '&:hover': {
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                          },
                                                        }}
                                                        onClick={() =>
                                                          handleVideoClick(
                                                            deliverables.videos.filter((v) =>
                                                              feedback.videosToUpdate.includes(v.id)
                                                            ),
                                                            index
                                                          )
                                                        }
                                                      >
                                                        <Box
                                                          sx={{
                                                            position: 'relative',
                                                            width: '100%',
                                                            paddingTop: '56.25%',
                                                            bgcolor: 'black',
                                                          }}
                                                        >
                                                          <Box
                                                            component="video"
                                                            src={video.url}
                                                            sx={{
                                                              position: 'absolute',
                                                              top: 0,
                                                              left: 0,
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
                                                                width: 48,
                                                                height: 48,
                                                                opacity: 0.9,
                                                              }}
                                                            />
                                                          </Box>
                                                        </Box>
                                                      </Box>

                                                      {/* Reasons */}
                                                      {feedback.reasons &&
                                                        feedback.reasons.length > 0 && (
                                                          <Box
                                                            sx={{ width: '200px', flexShrink: 0 }}
                                                          >
                                                            <Typography
                                                              sx={{
                                                                color: '#000000',
                                                                mt: 3,
                                                                mb: 1,
                                                                display: 'block',
                                                                fontWeight: 600,
                                                                fontSize: '0.875rem',
                                                              }}
                                                            >
                                                              Reasons:
                                                            </Typography>
                                                            <Stack spacing={0.5}>
                                                              {feedback.reasons.map(
                                                                (reason, reasonIndex) => (
                                                                  <Chip
                                                                    key={reasonIndex}
                                                                    label={reason}
                                                                    size="small"
                                                                    sx={{
                                                                      borderRadius: 1,
                                                                      bgcolor: '#fff3cd',
                                                                      color: '#856404',
                                                                      fontSize: '0.8rem',
                                                                      height: '28px',
                                                                      fontWeight: 600,
                                                                      justifyContent: 'flex-start',
                                                                      border: '1px solid #e0c46b',
                                                                      '&:hover': {
                                                                        bgcolor: '#fff3cd',
                                                                        color: '#856404',
                                                                      },
                                                                    }}
                                                                  />
                                                                )
                                                              )}
                                                            </Stack>
                                                          </Box>
                                                        )}
                                                    </Stack>
                                                  </Box>
                                                </Box>
                                              ))}
                                          </Stack>
                                        </Box>
                                      )}

                                    {/* Photos requiring changes */}
                                    {feedback.photosToUpdate &&
                                      feedback.photosToUpdate.length > 0 &&
                                      deliverables?.photos && (
                                        <Box>
                                          <Box sx={{ mb: 2 }}>
                                            <Stack
                                              direction="row"
                                              alignItems="center"
                                              justifyContent="space-between"
                                              sx={{ mb: 1, ml: 1 }}
                                            >
                                              <Stack
                                                direction="row"
                                                alignItems="center"
                                                spacing={1}
                                              >
                                                <Iconify
                                                  icon="eva:image-outline"
                                                  sx={{ color: '#636366', width: 14, height: 14 }}
                                                />
                                                <Typography
                                                  variant="caption"
                                                  sx={{
                                                    color: '#636366',
                                                    display: 'block',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontWeight: 600,
                                                  }}
                                                >
                                                  Photos
                                                </Typography>
                                              </Stack>
                                              <Stack
                                                direction="row"
                                                alignItems="center"
                                                spacing={1}
                                              >
                                                {feedback.photosToUpdate &&
                                                  feedback.photosToUpdate.length > 0 && (
                                                    <Stack
                                                      direction="row"
                                                      alignItems="center"
                                                      spacing={0.5}
                                                    >
                                                      <Iconify
                                                        icon="eva:close-fill"
                                                        sx={{
                                                          color: '#D4321C',
                                                          width: 14,
                                                          height: 14,
                                                        }}
                                                      />
                                                      <Typography
                                                        variant="caption"
                                                        sx={{
                                                          color: '#D4321C',
                                                          fontWeight: 600,
                                                          fontSize: '11px',
                                                        }}
                                                      >
                                                        {feedback.photosToUpdate.length}
                                                      </Typography>
                                                    </Stack>
                                                  )}
                                              </Stack>
                                            </Stack>
                                            <Box sx={{ height: '1px', bgcolor: '#e0e0e0' }} />
                                          </Box>
                                          <Stack spacing={2}>
                                            {deliverables.photos
                                              .filter((photo) =>
                                                feedback.photosToUpdate.includes(photo.id)
                                              )
                                              .map((photo, index) => (
                                                <Box key={photo.id}>
                                                  {/* Admin feedback */}
                                                  <Box
                                                    sx={{
                                                      p: 2,
                                                      borderRadius: 1.5,
                                                      bgcolor: '#f8f9fa',
                                                    }}
                                                  >
                                                    <Stack
                                                      direction="row"
                                                      alignItems="center"
                                                      spacing={1.5}
                                                    >
                                                      <Avatar
                                                        src={feedback.admin?.photoURL}
                                                        sx={{ width: 32, height: 32 }}
                                                      >
                                                        {feedback.admin?.name
                                                          ?.charAt(0)
                                                          ?.toUpperCase() || 'A'}
                                                      </Avatar>
                                                      <Box sx={{ flexGrow: 1 }}>
                                                        <Stack
                                                          direction="row"
                                                          alignItems="center"
                                                          spacing={1}
                                                        >
                                                          <Typography
                                                            variant="caption"
                                                            sx={{
                                                              fontWeight: 600,
                                                              color: '#212529',
                                                              fontSize: '0.9rem',
                                                            }}
                                                          >
                                                            {feedback.admin?.name || 'Admin'}
                                                          </Typography>
                                                          <Chip
                                                            label={
                                                              feedback.admin?.role
                                                                ? feedback.admin.role
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                  feedback.admin.role.slice(1)
                                                                : 'Admin'
                                                            }
                                                            size="small"
                                                            sx={{
                                                              bgcolor: '#e3f2fd',
                                                              color: '#1976d2',
                                                              fontSize: '0.7rem',
                                                              height: '18px',
                                                              fontWeight: 600,
                                                              '&:hover': {
                                                                bgcolor: '#e3f2fd',
                                                                color: '#1976d2',
                                                              },
                                                            }}
                                                          />
                                                        </Stack>
                                                        <Typography
                                                          variant="caption"
                                                          sx={{
                                                            color: '#6c757d',
                                                            fontSize: '0.7rem',
                                                            mb: -1,
                                                          }}
                                                        >
                                                          {dayjs(feedback.createdAt).format(
                                                            'MMM D, YYYY h:mm A'
                                                          )}
                                                        </Typography>
                                                      </Box>
                                                      {feedback.type === 'REQUEST' && (
                                                        <Box
                                                          sx={{
                                                            bgcolor: '#FFFFFF',
                                                            color: '#D4321C',
                                                            border: '1.5px solid',
                                                            borderColor: '#D4321C',
                                                            borderBottom: 3,
                                                            borderBottomColor: '#D4321C',
                                                            borderRadius: 1,
                                                            py: 0.8,
                                                            px: 1.5,
                                                            fontWeight: 600,
                                                            fontSize: '0.8rem',
                                                            height: '32px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            textTransform: 'none',
                                                          }}
                                                        >
                                                          CHANGES REQUESTED
                                                        </Box>
                                                      )}
                                                    </Stack>

                                                    {/* Feedback Text */}
                                                    {feedback.photoContent && (
                                                      <Typography
                                                        variant="body2"
                                                        sx={{
                                                          color: '#495057',
                                                          mt: 1.5,
                                                          lineHeight: 1.5,
                                                          fontSize: '0.875rem',
                                                          mb: 2,
                                                        }}
                                                      >
                                                        {feedback.photoContent}
                                                      </Typography>
                                                    )}

                                                    {/* Photo and Reasons side by side */}
                                                    <Stack
                                                      direction="row"
                                                      spacing={2}
                                                      alignItems="flex-start"
                                                    >
                                                      {/* Photo */}
                                                      <Box
                                                        sx={{
                                                          border: '2px solid #D4321C',
                                                          borderRadius: 1.5,
                                                          overflow: 'hidden',
                                                          bgcolor: '#ffffff',
                                                          cursor: 'pointer',
                                                          width: '300px',
                                                          flexShrink: 0,
                                                          mb: 1,
                                                          '&:hover': {
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                          },
                                                        }}
                                                        onClick={() =>
                                                          handlePhotoClick(
                                                            deliverables.photos.filter((p) =>
                                                              feedback.photosToUpdate.includes(p.id)
                                                            ),
                                                            index
                                                          )
                                                        }
                                                      >
                                                        <Box
                                                          component="img"
                                                          src={photo.url}
                                                          alt={`Photo ${index + 1}`}
                                                          sx={{
                                                            width: '100%',
                                                            height: 200,
                                                            objectFit: 'cover',
                                                          }}
                                                        />
                                                      </Box>
                                                    </Stack>
                                                  </Box>
                                                </Box>
                                              ))}
                                          </Stack>
                                        </Box>
                                      )}

                                    {/* Raw Footage requiring changes */}
                                    {feedback.rawFootageToUpdate &&
                                      feedback.rawFootageToUpdate.length > 0 &&
                                      deliverables?.rawFootages && (
                                        <Box>
                                          <Box sx={{ mb: 2 }}>
                                            <Stack
                                              direction="row"
                                              alignItems="center"
                                              justifyContent="space-between"
                                              sx={{ mb: 1, ml: 1 }}
                                            >
                                              <Stack
                                                direction="row"
                                                alignItems="center"
                                                spacing={1}
                                              >
                                                <Iconify
                                                  icon="eva:film-outline"
                                                  sx={{ color: '#636366', width: 14, height: 14 }}
                                                />
                                                <Typography
                                                  variant="caption"
                                                  sx={{
                                                    color: '#636366',
                                                    display: 'block',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontWeight: 600,
                                                  }}
                                                >
                                                  Raw Footage
                                                </Typography>
                                              </Stack>
                                              <Stack
                                                direction="row"
                                                alignItems="center"
                                                spacing={1}
                                              >
                                                {feedback.rawFootageToUpdate &&
                                                  feedback.rawFootageToUpdate.length > 0 && (
                                                    <Stack
                                                      direction="row"
                                                      alignItems="center"
                                                      spacing={0.5}
                                                    >
                                                      <Iconify
                                                        icon="eva:close-fill"
                                                        sx={{
                                                          color: '#D4321C',
                                                          width: 14,
                                                          height: 14,
                                                        }}
                                                      />
                                                      <Typography
                                                        variant="caption"
                                                        sx={{
                                                          color: '#D4321C',
                                                          fontWeight: 600,
                                                          fontSize: '11px',
                                                        }}
                                                      >
                                                        {feedback.rawFootageToUpdate.length}
                                                      </Typography>
                                                    </Stack>
                                                  )}
                                              </Stack>
                                            </Stack>
                                            <Box sx={{ height: '1px', bgcolor: '#e0e0e0' }} />
                                          </Box>
                                          <Stack spacing={2}>
                                            {deliverables.rawFootages
                                              .filter((footage) =>
                                                feedback.rawFootageToUpdate.includes(footage.id)
                                              )
                                              .map((footage, index) => (
                                                <Box key={footage.id}>
                                                  {/* Admin feedback */}
                                                  <Box
                                                    sx={{
                                                      p: 2,
                                                      borderRadius: 1.5,
                                                      bgcolor: '#f8f9fa',
                                                      mb: 1.5,
                                                    }}
                                                  >
                                                    <Stack
                                                      direction="row"
                                                      alignItems="center"
                                                      spacing={1.5}
                                                    >
                                                      <Avatar
                                                        src={feedback.admin?.photoURL}
                                                        sx={{ width: 32, height: 32 }}
                                                      >
                                                        {feedback.admin?.name
                                                          ?.charAt(0)
                                                          ?.toUpperCase() || 'A'}
                                                      </Avatar>
                                                      <Box sx={{ flexGrow: 1 }}>
                                                        <Stack
                                                          direction="row"
                                                          alignItems="center"
                                                          spacing={1}
                                                        >
                                                          <Typography
                                                            variant="caption"
                                                            sx={{
                                                              fontWeight: 600,
                                                              color: '#212529',
                                                              fontSize: '0.9rem',
                                                            }}
                                                          >
                                                            {feedback.admin?.name || 'Admin'}
                                                          </Typography>
                                                          <Chip
                                                            label={
                                                              feedback.admin?.role
                                                                ? feedback.admin.role
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                  feedback.admin.role.slice(1)
                                                                : 'Admin'
                                                            }
                                                            size="small"
                                                            sx={{
                                                              bgcolor: '#e3f2fd',
                                                              color: '#1976d2',
                                                              fontSize: '0.7rem',
                                                              height: '18px',
                                                              fontWeight: 600,
                                                              '&:hover': {
                                                                bgcolor: '#e3f2fd',
                                                                color: '#1976d2',
                                                              },
                                                            }}
                                                          />
                                                        </Stack>
                                                        <Typography
                                                          variant="caption"
                                                          sx={{
                                                            color: '#6c757d',
                                                            fontSize: '0.7rem',
                                                            mb: -1,
                                                          }}
                                                        >
                                                          {dayjs(feedback.createdAt).format(
                                                            'MMM D, YYYY h:mm A'
                                                          )}
                                                        </Typography>
                                                      </Box>
                                                      {feedback.type === 'REQUEST' && (
                                                        <Box
                                                          sx={{
                                                            bgcolor: '#FFFFFF',
                                                            color: '#D4321C',
                                                            border: '1.5px solid',
                                                            borderColor: '#D4321C',
                                                            borderBottom: 3,
                                                            borderBottomColor: '#D4321C',
                                                            borderRadius: 1,
                                                            py: 0.8,
                                                            px: 1.5,
                                                            fontWeight: 600,
                                                            fontSize: '0.8rem',
                                                            height: '32px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            textTransform: 'none',
                                                          }}
                                                        >
                                                          CHANGES REQUESTED
                                                        </Box>
                                                      )}
                                                    </Stack>

                                                    {/* Feedback Text */}
                                                    {feedback.rawFootageContent && (
                                                      <Typography
                                                        variant="body2"
                                                        sx={{
                                                          color: '#495057',
                                                          mt: 1.5,
                                                          lineHeight: 1.5,
                                                          fontSize: '0.875rem',
                                                          mb: 2,
                                                        }}
                                                      >
                                                        {feedback.rawFootageContent}
                                                      </Typography>
                                                    )}

                                                    {/* Raw Footage and Reasons side by side */}
                                                    <Stack
                                                      direction="row"
                                                      spacing={2}
                                                      alignItems="flex-start"
                                                    >
                                                      {/* Raw Footage */}
                                                      <Box
                                                        sx={{
                                                          border: '2px solid #D4321C',
                                                          borderRadius: 1.5,
                                                          overflow: 'hidden',
                                                          bgcolor: '#ffffff',
                                                          cursor: 'pointer',
                                                          flex: 1,
                                                          mb: 1,
                                                          maxWidth: 'calc(100% - 220px)',
                                                          '&:hover': {
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                          },
                                                        }}
                                                        onClick={() =>
                                                          handleVideoClick(
                                                            deliverables.rawFootages.filter((f) =>
                                                              feedback.rawFootageToUpdate.includes(
                                                                f.id
                                                              )
                                                            ),
                                                            index
                                                          )
                                                        }
                                                      >
                                                        <Box
                                                          sx={{
                                                            position: 'relative',
                                                            width: '100%',
                                                            paddingTop: '56.25%',
                                                            bgcolor: 'black',
                                                          }}
                                                        >
                                                          <Box
                                                            component="video"
                                                            src={footage.url}
                                                            sx={{
                                                              position: 'absolute',
                                                              top: 0,
                                                              left: 0,
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
                                                                width: 48,
                                                                height: 48,
                                                                opacity: 0.9,
                                                              }}
                                                            />
                                                          </Box>
                                                        </Box>
                                                      </Box>
                                                    </Stack>
                                                  </Box>
                                                </Box>
                                              ))}
                                          </Stack>
                                        </Box>
                                      )}
                                  </Stack>
                                </Box>
                              ))}
                          </Stack>
                        </Box>
                      )
                    : [...submission.feedback, ...previousSubmission.feedback]
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
                          >
                            <Avatar
                              src={feedback.admin?.photoURL || '/default-avatar.png'}
                              alt={feedback.admin?.name || 'User'}
                              sx={{ mr: 2 }}
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
                                {feedback.admin?.name || 'Unknown User'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {feedback.admin?.role || 'No Role'}
                              </Typography>
                              <Box sx={{ textAlign: 'left', mt: 1 }}>
                                {feedback.content.split('\n').map((line, i) => (
                                  <Typography key={i} variant="body2">
                                    {line}
                                  </Typography>
                                ))}
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
                </Box>
              )}
            </Box>
          </Stack>
        )}

        {submission?.status === 'CHANGES_REQUIRED' && (
          <>
            {campaign?.campaignCredits ? (
              <Stack spacing={2}>
                <Box>
                  {!uploadProgress.length && (
                    <>
                      <Typography variant="body1" sx={{ color: '#221f20', mb: 2, ml: -1 }}>
                        Please re-upload the required files for this campaign.
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#221f20', mb: 4, ml: -1 }}>
                        Make sure to address all the feedback provided for your first draft below.
                      </Typography>
                      <Box
                        sx={{
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          mb: 2,
                          mx: -1.5,
                        }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          onClick={handleUploadClick}
                          startIcon={<Iconify icon="material-symbols:add" width={24} />}
                          sx={{
                            bgcolor: '#203ff5',
                            color: 'white',
                            borderBottom: 3.5,
                            borderBottomColor: '#112286',
                            borderRadius: 1.5,
                            px: 2.5,
                            py: 1.2,
                            '&:hover': {
                              bgcolor: '#203ff5',
                              opacity: 0.9,
                            },
                          }}
                        >
                          Re-Upload
                        </Button>
                      </Box>
                    </>
                  )}

                  {previousSubmission?.feedback && previousSubmission.feedback.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Stack spacing={1.5}>
                        {previousSubmission.feedback
                          .filter(
                            (feedback) =>
                              feedback.type === 'REQUEST' &&
                              (feedback.videosToUpdate?.length > 0 ||
                                feedback.photosToUpdate?.length > 0 ||
                                feedback.rawFootageToUpdate?.length > 0)
                          )
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .map((feedback, feedbackIndex) => (
                            <Box
                              key={feedbackIndex}
                              sx={{
                                p: 1.5,
                                borderRadius: 1.5,
                                bgcolor: '#FFFFFF',
                                border: '1px solid',
                                borderColor: '#e0e0e0',
                              }}
                            >
                              {/* Content Sections */}
                              <Stack spacing={2}>
                                {/* Videos requiring changes */}
                                {feedback.videosToUpdate &&
                                  feedback.videosToUpdate.length > 0 &&
                                  deliverables?.videos && (
                                    <Box>
                                      <Box sx={{ mb: 2 }}>
                                        <Stack
                                          direction="row"
                                          alignItems="center"
                                          justifyContent="space-between"
                                          sx={{ mb: 1, ml: 1 }}
                                        >
                                          <Stack direction="row" alignItems="center" spacing={1}>
                                            <Iconify
                                              icon="eva:video-outline"
                                              sx={{ color: '#636366', width: 14, height: 14 }}
                                            />
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                color: '#636366',
                                                display: 'block',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                fontWeight: 600,
                                              }}
                                            >
                                              Draft Videos
                                            </Typography>
                                          </Stack>
                                          <Stack direction="row" alignItems="center" spacing={1}>
                                            {feedback.videosToUpdate &&
                                              feedback.videosToUpdate.length > 0 && (
                                                <Stack
                                                  direction="row"
                                                  alignItems="center"
                                                  spacing={0.5}
                                                >
                                                  <Iconify
                                                    icon="eva:close-fill"
                                                    sx={{ color: '#D4321C', width: 14, height: 14 }}
                                                  />
                                                  <Typography
                                                    variant="caption"
                                                    sx={{
                                                      color: '#D4321C',
                                                      fontWeight: 600,
                                                      fontSize: '11px',
                                                    }}
                                                  >
                                                    {feedback.videosToUpdate.length}
                                                  </Typography>
                                                </Stack>
                                              )}
                                          </Stack>
                                        </Stack>
                                        <Box sx={{ height: '1px', bgcolor: '#e0e0e0' }} />
                                      </Box>
                                      <Stack spacing={2}>
                                        {deliverables.videos
                                          .filter((video) =>
                                            feedback.videosToUpdate.includes(video.id)
                                          )
                                          .map((video, index) => (
                                            <Box key={video.id}>
                                              {/* Admin feedback */}
                                              <Box
                                                sx={{
                                                  p: 2,
                                                  borderRadius: 1.5,
                                                  bgcolor: '#f8f9fa',
                                                  border: '1px solid #e9ecef',
                                                  mb: 1.5,
                                                }}
                                              >
                                                <Stack
                                                  direction="row"
                                                  alignItems="center"
                                                  spacing={1.5}
                                                >
                                                  <Avatar
                                                    src={feedback.admin?.photoURL}
                                                    sx={{ width: 42, height: 42, mb: 0.5 }}
                                                  >
                                                    {feedback.admin?.name
                                                      ?.charAt(0)
                                                      ?.toUpperCase() || 'A'}
                                                  </Avatar>
                                                  <Box sx={{ flexGrow: 1 }}>
                                                    <Stack
                                                      direction="row"
                                                      alignItems="center"
                                                      spacing={1}
                                                    >
                                                      <Typography
                                                        variant="caption"
                                                        sx={{
                                                          fontWeight: 600,
                                                          color: '#212529',
                                                          fontSize: '0.9rem',
                                                        }}
                                                      >
                                                        {feedback.admin?.name || 'Admin'}
                                                      </Typography>
                                                      <Chip
                                                        label={
                                                          feedback.admin?.role
                                                            ? feedback.admin.role
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                              feedback.admin.role.slice(1)
                                                            : 'Admin'
                                                        }
                                                        size="small"
                                                        sx={{
                                                          bgcolor: '#e3f2fd',
                                                          color: '#1976d2',
                                                          fontSize: '0.7rem',
                                                          height: '18px',
                                                          fontWeight: 600,
                                                          '&:hover': {
                                                            bgcolor: '#e3f2fd',
                                                            color: '#1976d2',
                                                          },
                                                        }}
                                                      />
                                                    </Stack>
                                                    <Typography
                                                      variant="caption"
                                                      sx={{
                                                        color: '#6c757d',
                                                        fontSize: '0.7rem',
                                                        mb: -1,
                                                      }}
                                                    >
                                                      {dayjs(feedback.createdAt).format(
                                                        'MMM D, YYYY h:mm A'
                                                      )}
                                                    </Typography>
                                                  </Box>
                                                  {feedback.type === 'REQUEST' && (
                                                    <Box
                                                      sx={{
                                                        bgcolor: '#FFFFFF',
                                                        color: '#D4321C',
                                                        border: '1.5px solid',
                                                        borderColor: '#D4321C',
                                                        borderBottom: 3,
                                                        borderBottomColor: '#D4321C',
                                                        borderRadius: 1,
                                                        py: 0.8,
                                                        px: 1.5,
                                                        fontWeight: 600,
                                                        fontSize: '0.8rem',
                                                        height: '32px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        textTransform: 'none',
                                                      }}
                                                    >
                                                      CHANGES REQUESTED
                                                    </Box>
                                                  )}
                                                </Stack>

                                                {/* Feedback Text */}
                                                {feedback.content && (
                                                  <Typography
                                                    variant="body2"
                                                    sx={{
                                                      color: '#495057',
                                                      mt: 1.5,
                                                      lineHeight: 1.5,
                                                      fontSize: '0.875rem',
                                                      mb: 2,
                                                    }}
                                                  >
                                                    {feedback.content}
                                                  </Typography>
                                                )}

                                                {/* Video and Reasons */}
                                                <Stack
                                                  direction="row"
                                                  spacing={2}
                                                  alignItems="flex-start"
                                                >
                                                  {/* Video */}
                                                  <Box
                                                    sx={{
                                                      border: '2px solid #D4321C',
                                                      borderRadius: 1.5,
                                                      overflow: 'hidden',
                                                      bgcolor: '#ffffff',
                                                      cursor: 'pointer',
                                                      flex: 1,
                                                      mb: 1,
                                                      '&:hover': {
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                      },
                                                    }}
                                                    onClick={() =>
                                                      handleVideoClick(
                                                        deliverables.videos.filter((v) =>
                                                          feedback.videosToUpdate.includes(v.id)
                                                        ),
                                                        index
                                                      )
                                                    }
                                                  >
                                                    <Box
                                                      sx={{
                                                        position: 'relative',
                                                        width: '100%',
                                                        paddingTop: '56.25%',
                                                        bgcolor: 'black',
                                                      }}
                                                    >
                                                      <Box
                                                        component="video"
                                                        src={video.url}
                                                        sx={{
                                                          position: 'absolute',
                                                          top: 0,
                                                          left: 0,
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
                                                            width: 48,
                                                            height: 48,
                                                            opacity: 0.9,
                                                          }}
                                                        />
                                                      </Box>
                                                    </Box>
                                                  </Box>

                                                  {/* Reasons */}
                                                  {feedback.reasons &&
                                                    feedback.reasons.length > 0 && (
                                                      <Box sx={{ width: '200px', flexShrink: 0 }}>
                                                        <Typography
                                                          sx={{
                                                            color: '#000000',
                                                            mt: 3,
                                                            mb: 1,
                                                            display: 'block',
                                                            fontWeight: 600,
                                                            fontSize: '0.875rem',
                                                          }}
                                                        >
                                                          Reasons:
                                                        </Typography>
                                                        <Stack spacing={0.5}>
                                                          {feedback.reasons.map(
                                                            (reason, reasonIndex) => (
                                                              <Chip
                                                                key={reasonIndex}
                                                                label={reason}
                                                                size="small"
                                                                sx={{
                                                                  borderRadius: 1,
                                                                  bgcolor: '#fff3cd',
                                                                  color: '#856404',
                                                                  fontSize: '0.8rem',
                                                                  height: '28px',
                                                                  fontWeight: 600,
                                                                  justifyContent: 'flex-start',
                                                                  border: '1px solid #e0c46b',
                                                                  '&:hover': {
                                                                    bgcolor: '#fff3cd',
                                                                    color: '#856404',
                                                                  },
                                                                }}
                                                              />
                                                            )
                                                          )}
                                                        </Stack>
                                                      </Box>
                                                    )}
                                                </Stack>
                                              </Box>
                                            </Box>
                                          ))}
                                      </Stack>
                                    </Box>
                                  )}

                                {/* Photos requiring changes */}
                                {feedback.photosToUpdate &&
                                  feedback.photosToUpdate.length > 0 &&
                                  deliverables?.photos && (
                                    <Box>
                                      <Box sx={{ mb: 2 }}>
                                        <Stack
                                          direction="row"
                                          alignItems="center"
                                          justifyContent="space-between"
                                          sx={{ mb: 1, ml: 1 }}
                                        >
                                          <Stack direction="row" alignItems="center" spacing={1}>
                                            <Iconify
                                              icon="eva:image-outline"
                                              sx={{ color: '#636366', width: 14, height: 14 }}
                                            />
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                color: '#636366',
                                                display: 'block',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                fontWeight: 600,
                                              }}
                                            >
                                              Photos
                                            </Typography>
                                          </Stack>
                                          <Stack direction="row" alignItems="center" spacing={1}>
                                            {feedback.photosToUpdate &&
                                              feedback.photosToUpdate.length > 0 && (
                                                <Stack
                                                  direction="row"
                                                  alignItems="center"
                                                  spacing={0.5}
                                                >
                                                  <Iconify
                                                    icon="eva:close-fill"
                                                    sx={{ color: '#D4321C', width: 14, height: 14 }}
                                                  />
                                                  <Typography
                                                    variant="caption"
                                                    sx={{
                                                      color: '#D4321C',
                                                      fontWeight: 600,
                                                      fontSize: '11px',
                                                    }}
                                                  >
                                                    {feedback.photosToUpdate.length}
                                                  </Typography>
                                                </Stack>
                                              )}
                                          </Stack>
                                        </Stack>
                                        <Box sx={{ height: '1px', bgcolor: '#e0e0e0' }} />
                                      </Box>
                                      <Stack spacing={2}>
                                        {deliverables.photos
                                          .filter((photo) =>
                                            feedback.photosToUpdate.includes(photo.id)
                                          )
                                          .map((photo, index) => (
                                            <Box key={photo.id}>
                                              {/* Admin feedback */}
                                              <Box
                                                sx={{
                                                  p: 2,
                                                  borderRadius: 1.5,
                                                  bgcolor: '#f8f9fa',
                                                }}
                                              >
                                                <Stack
                                                  direction="row"
                                                  alignItems="center"
                                                  spacing={1.5}
                                                >
                                                  <Avatar
                                                    src={feedback.admin?.photoURL}
                                                    sx={{ width: 32, height: 32 }}
                                                  >
                                                    {feedback.admin?.name
                                                      ?.charAt(0)
                                                      ?.toUpperCase() || 'A'}
                                                  </Avatar>
                                                  <Box sx={{ flexGrow: 1 }}>
                                                    <Stack
                                                      direction="row"
                                                      alignItems="center"
                                                      spacing={1}
                                                    >
                                                      <Typography
                                                        variant="caption"
                                                        sx={{
                                                          fontWeight: 600,
                                                          color: '#212529',
                                                          fontSize: '0.9rem',
                                                        }}
                                                      >
                                                        {feedback.admin?.name || 'Admin'}
                                                      </Typography>
                                                      <Chip
                                                        label={
                                                          feedback.admin?.role
                                                            ? feedback.admin.role
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                              feedback.admin.role.slice(1)
                                                            : 'Admin'
                                                        }
                                                        size="small"
                                                        sx={{
                                                          bgcolor: '#e3f2fd',
                                                          color: '#1976d2',
                                                          fontSize: '0.7rem',
                                                          height: '18px',
                                                          fontWeight: 600,
                                                          '&:hover': {
                                                            bgcolor: '#e3f2fd',
                                                            color: '#1976d2',
                                                          },
                                                        }}
                                                      />
                                                    </Stack>
                                                    <Typography
                                                      variant="caption"
                                                      sx={{
                                                        color: '#6c757d',
                                                        fontSize: '0.7rem',
                                                        mb: -1,
                                                      }}
                                                    >
                                                      {dayjs(feedback.createdAt).format(
                                                        'MMM D, YYYY h:mm A'
                                                      )}
                                                    </Typography>
                                                  </Box>
                                                  {feedback.type === 'REQUEST' && (
                                                    <Box
                                                      sx={{
                                                        bgcolor: '#FFFFFF',
                                                        color: '#D4321C',
                                                        border: '1.5px solid',
                                                        borderColor: '#D4321C',
                                                        borderBottom: 3,
                                                        borderBottomColor: '#D4321C',
                                                        borderRadius: 1,
                                                        py: 0.8,
                                                        px: 1.5,
                                                        fontWeight: 600,
                                                        fontSize: '0.8rem',
                                                        height: '32px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        textTransform: 'none',
                                                      }}
                                                    >
                                                      CHANGES REQUESTED
                                                    </Box>
                                                  )}
                                                </Stack>

                                                {/* Feedback Text */}
                                                {feedback.photoContent && (
                                                  <Typography
                                                    variant="body2"
                                                    sx={{
                                                      color: '#495057',
                                                      mt: 1.5,
                                                      lineHeight: 1.5,
                                                      fontSize: '0.875rem',
                                                      mb: 2,
                                                    }}
                                                  >
                                                    {feedback.photoContent}
                                                  </Typography>
                                                )}

                                                {/* Photo and Reasons side by side */}
                                                <Stack
                                                  direction="row"
                                                  spacing={2}
                                                  alignItems="flex-start"
                                                >
                                                  {/* Photo */}
                                                  <Box
                                                    sx={{
                                                      border: '2px solid #D4321C',
                                                      borderRadius: 1.5,
                                                      overflow: 'hidden',
                                                      bgcolor: '#ffffff',
                                                      cursor: 'pointer',
                                                      width: '300px',
                                                      flexShrink: 0,
                                                      mb: 1,
                                                      '&:hover': {
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                      },
                                                    }}
                                                    onClick={() =>
                                                      handlePhotoClick(
                                                        deliverables.photos.filter((p) =>
                                                          feedback.photosToUpdate.includes(p.id)
                                                        ),
                                                        index
                                                      )
                                                    }
                                                  >
                                                    <Box
                                                      component="img"
                                                      src={photo.url}
                                                      alt={`Photo ${index + 1}`}
                                                      sx={{
                                                        width: '100%',
                                                        height: 200,
                                                        objectFit: 'cover',
                                                      }}
                                                    />
                                                  </Box>
                                                </Stack>
                                              </Box>
                                            </Box>
                                          ))}
                                      </Stack>
                                    </Box>
                                  )}

                                {/* Raw Footage requiring changes */}
                                {feedback.rawFootageToUpdate &&
                                  feedback.rawFootageToUpdate.length > 0 &&
                                  deliverables?.rawFootages && (
                                    <Box>
                                      <Box sx={{ mb: 2 }}>
                                        <Stack
                                          direction="row"
                                          alignItems="center"
                                          justifyContent="space-between"
                                          sx={{ mb: 1, ml: 1 }}
                                        >
                                          <Stack direction="row" alignItems="center" spacing={1}>
                                            <Iconify
                                              icon="eva:film-outline"
                                              sx={{ color: '#636366', width: 14, height: 14 }}
                                            />
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                color: '#636366',
                                                display: 'block',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                fontWeight: 600,
                                              }}
                                            >
                                              Raw Footage
                                            </Typography>
                                          </Stack>
                                          <Stack direction="row" alignItems="center" spacing={1}>
                                            {feedback.rawFootageToUpdate &&
                                              feedback.rawFootageToUpdate.length > 0 && (
                                                <Stack
                                                  direction="row"
                                                  alignItems="center"
                                                  spacing={0.5}
                                                >
                                                  <Iconify
                                                    icon="eva:close-fill"
                                                    sx={{ color: '#D4321C', width: 14, height: 14 }}
                                                  />
                                                  <Typography
                                                    variant="caption"
                                                    sx={{
                                                      color: '#D4321C',
                                                      fontWeight: 600,
                                                      fontSize: '11px',
                                                    }}
                                                  >
                                                    {feedback.rawFootageToUpdate.length}
                                                  </Typography>
                                                </Stack>
                                              )}
                                          </Stack>
                                        </Stack>
                                        <Box sx={{ height: '1px', bgcolor: '#e0e0e0' }} />
                                      </Box>
                                      <Stack spacing={2}>
                                        {deliverables.rawFootages
                                          .filter((footage) =>
                                            feedback.rawFootageToUpdate.includes(footage.id)
                                          )
                                          .map((footage, index) => (
                                            <Box key={footage.id}>
                                              {/* Admin feedback */}
                                              <Box
                                                sx={{
                                                  p: 2,
                                                  borderRadius: 1.5,
                                                  bgcolor: '#f8f9fa',
                                                  mb: 1.5,
                                                }}
                                              >
                                                <Stack
                                                  direction="row"
                                                  alignItems="center"
                                                  spacing={1.5}
                                                >
                                                  <Avatar
                                                    src={feedback.admin?.photoURL}
                                                    sx={{ width: 32, height: 32 }}
                                                  >
                                                    {feedback.admin?.name
                                                      ?.charAt(0)
                                                      ?.toUpperCase() || 'A'}
                                                  </Avatar>
                                                  <Box sx={{ flexGrow: 1 }}>
                                                    <Stack
                                                      direction="row"
                                                      alignItems="center"
                                                      spacing={1}
                                                    >
                                                      <Typography
                                                        variant="caption"
                                                        sx={{
                                                          fontWeight: 600,
                                                          color: '#212529',
                                                          fontSize: '0.9rem',
                                                        }}
                                                      >
                                                        {feedback.admin?.name || 'Admin'}
                                                      </Typography>
                                                      <Chip
                                                        label={
                                                          feedback.admin?.role
                                                            ? feedback.admin.role
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                              feedback.admin.role.slice(1)
                                                            : 'Admin'
                                                        }
                                                        size="small"
                                                        sx={{
                                                          bgcolor: '#e3f2fd',
                                                          color: '#1976d2',
                                                          fontSize: '0.7rem',
                                                          height: '18px',
                                                          fontWeight: 600,
                                                          '&:hover': {
                                                            bgcolor: '#e3f2fd',
                                                            color: '#1976d2',
                                                          },
                                                        }}
                                                      />
                                                    </Stack>
                                                    <Typography
                                                      variant="caption"
                                                      sx={{
                                                        color: '#6c757d',
                                                        fontSize: '0.7rem',
                                                        mb: -1,
                                                      }}
                                                    >
                                                      {dayjs(feedback.createdAt).format(
                                                        'MMM D, YYYY h:mm A'
                                                      )}
                                                    </Typography>
                                                  </Box>
                                                  {feedback.type === 'REQUEST' && (
                                                    <Box
                                                      sx={{
                                                        bgcolor: '#FFFFFF',
                                                        color: '#D4321C',
                                                        border: '1.5px solid',
                                                        borderColor: '#D4321C',
                                                        borderBottom: 3,
                                                        borderBottomColor: '#D4321C',
                                                        borderRadius: 1,
                                                        py: 0.8,
                                                        px: 1.5,
                                                        fontWeight: 600,
                                                        fontSize: '0.8rem',
                                                        height: '32px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        textTransform: 'none',
                                                      }}
                                                    >
                                                      CHANGES REQUESTED
                                                    </Box>
                                                  )}
                                                </Stack>

                                                {/* Feedback Text */}
                                                {feedback.rawFootageContent && (
                                                  <Typography
                                                    variant="body2"
                                                    sx={{
                                                      color: '#495057',
                                                      mt: 1.5,
                                                      lineHeight: 1.5,
                                                      fontSize: '0.875rem',
                                                      mb: 2,
                                                    }}
                                                  >
                                                    {feedback.rawFootageContent}
                                                  </Typography>
                                                )}

                                                {/* Raw Footage and Reasons side by side */}
                                                <Stack
                                                  direction="row"
                                                  spacing={2}
                                                  alignItems="flex-start"
                                                >
                                                  {/* Raw Footage */}
                                                  <Box
                                                    sx={{
                                                      border: '2px solid #D4321C',
                                                      borderRadius: 1.5,
                                                      overflow: 'hidden',
                                                      bgcolor: '#ffffff',
                                                      cursor: 'pointer',
                                                      flex: 1,
                                                      mb: 1,
                                                      maxWidth: 'calc(100% - 220px)',
                                                      '&:hover': {
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                      },
                                                    }}
                                                    onClick={() =>
                                                      handleVideoClick(
                                                        deliverables.rawFootages.filter((f) =>
                                                          feedback.rawFootageToUpdate.includes(f.id)
                                                        ),
                                                        index
                                                      )
                                                    }
                                                  >
                                                    <Box
                                                      sx={{
                                                        position: 'relative',
                                                        width: '100%',
                                                        paddingTop: '56.25%',
                                                        bgcolor: 'black',
                                                      }}
                                                    >
                                                      <Box
                                                        component="video"
                                                        src={footage.url}
                                                        sx={{
                                                          position: 'absolute',
                                                          top: 0,
                                                          left: 0,
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
                                                            width: 48,
                                                            height: 48,
                                                            opacity: 0.9,
                                                          }}
                                                        />
                                                      </Box>
                                                    </Box>
                                                  </Box>
                                                </Stack>
                                              </Box>
                                            </Box>
                                          ))}
                                      </Stack>
                                    </Box>
                                  )}
                              </Stack>
                            </Box>
                          ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              </Stack>
            ) : (
              <Stack spacing={2}>
                {!uploadProgress.length && (
                  <>
                    <Typography variant="body1" sx={{ color: '#221f20', mb: 2, ml: -1 }}>
                      Please re-upload your content for this campaign.
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#221f20', mb: 4, ml: -1 }}>
                      Make sure to address all the feedback provided below.
                    </Typography>
                    <Box
                      sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        mb: 2,
                        mx: -1.5,
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        onClick={handleUploadClick}
                        startIcon={<Iconify icon="material-symbols:add" width={24} />}
                        sx={{
                          bgcolor: '#203ff5',
                          color: 'white',
                          borderBottom: 3.5,
                          borderBottomColor: '#112286',
                          borderRadius: 1.5,
                          px: 2.5,
                          py: 1.2,
                          '&:hover': {
                            bgcolor: '#203ff5',
                            opacity: 0.9,
                          },
                        }}
                      >
                        Re-Upload
                      </Button>
                    </Box>

                    <Box
                      component={Paper}
                      sx={{
                        p: { xs: 2, sm: 3 },
                        mb: 2,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label="REJECTED"
                          sx={{
                            color: '#ff3b30',
                            bgcolor: '#fff',
                            border: '1px solid #ff3b30',
                            borderBottom: '3px solid #ff3b30',
                            borderRadius: 0.6,
                            px: 1,
                            '& .MuiChip-label': {
                              px: 1,
                              fontWeight: 650,
                            },
                            '&:hover': {
                              bgcolor: '#fff',
                            },
                          }}
                        />
                      </Box>

                      <Typography
                        variant="body1"
                        sx={{
                          fontSize: '0.95rem',
                          color: '#48484A',
                          mb: 2,
                        }}
                      >
                        <strong>Caption:</strong> {submission?.caption}
                      </Typography>

                      <Box
                        sx={{
                          position: 'relative',
                          cursor: 'pointer',
                          width: { xs: '100%', sm: '300px' },
                          height: { xs: '200px', sm: '169px' },
                          borderRadius: 2,
                          overflow: 'hidden',
                          boxShadow: 3,
                        }}
                        onClick={display.onTrue}
                      >
                        <Box
                          component="video"
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 2,
                          }}
                        >
                          <source src={submission?.content} />
                        </Box>
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
                            bgcolor: 'rgba(0, 0, 0, 0.4)',
                            borderRadius: 2,
                          }}
                        >
                          {/* <VisibilityIcon sx={{ color: 'white', fontSize: 32 }} /> */}
                        </Box>
                      </Box>
                    </Box>
                  </>
                )}
                <Typography variant="subtitle2" color="text.secondary">
                  Feedback:
                </Typography>
                {submission?.feedback
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
                    >
                      <Avatar
                        src={feedback.admin?.photoURL || '/default-avatar.png'}
                        alt={feedback.admin?.name || 'User'}
                        sx={{ mr: 2 }}
                      />
                      <Box
                        flexGrow={1}
                        sx={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 'bold', marginBottom: '2px' }}
                        >
                          {feedback.admin?.name || 'Unknown User'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {feedback.admin?.role || 'No Role'}
                        </Typography>
                        <Box sx={{ textAlign: 'left', mt: 1 }}>
                          {feedback.content.split('\n').map((line, i) => (
                            <Typography key={i} variant="body2">
                              {line}
                            </Typography>
                          ))}
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
              </Stack>
            )}
          </>
        )}

        {submission?.status === 'APPROVED' && (
          <Stack justifyContent="center" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 100,
                height: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                bgcolor: '#34c759',
                fontSize: '50px',
                mb: -2,
              }}
            >
              ✅
            </Box>
            <Stack spacing={1} alignItems="center">
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Instrument Serif, serif',
                  fontSize: { xs: '1.5rem', sm: '2.5rem' },
                  fontWeight: 550,
                }}
              >
                Approved!
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#636366',
                  mt: -1,
                }}
              >
                Your Final Draft has been approved.
              </Typography>
            </Stack>

            <Button
              onClick={() => {
                display.onTrue();
              }}
              variant="contained"
              startIcon={<Iconify icon="solar:document-bold" width={24} />}
              sx={{
                bgcolor: '#203ff5',
                color: 'white',
                borderBottom: 3.5,
                borderBottomColor: '#112286',
                borderRadius: 1.5,
                px: 2.5,
                py: 1,
                '&:hover': {
                  bgcolor: '#203ff5',
                  opacity: 0.9,
                },
              }}
            >
              Preview Final Draft
            </Button>

            {/* Display Admin Feedback */}
            {/* {submission?.feedback && submission.feedback.length > 0 && (
              <Box sx={{ width: '100%', maxWidth: 600, mt: 2 }}>
                {submission.feedback
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((feedback, index) => (
                    <Box
                      key={index}
                      mb={2}
                      p={2}
                      border={1}
                      borderColor="grey.300"
                      borderRadius={2}
                      display="flex"
                      alignItems="flex-start"
                      sx={{ bgcolor: 'background.paper' }}
                    >
                      <Avatar
                        src={feedback.admin?.photoURL || '/default-avatar.png'}
                        alt={feedback.admin?.name || 'Admin'}
                        sx={{ mr: 2 }}
                      />

                      <Box
                        flexGrow={1}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          textAlign: 'left',
                        }}
                      >
                        <Stack direction={{ md: 'row' }} alignItems={{ md: 'end' }}>
                          <ListItemText
                            primary={feedback.admin?.name || 'Unknown User'}
                            secondary={feedback.admin?.role || 'No Role'}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(feedback.createdAd).format('LLL')}
                          </Typography>
                        </Stack>

                        <Box sx={{ mt: 1 }}>
                          {feedback.content && feedback.content.split('\n').map((line, i) => (
                            <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                              {line}
                            </Typography>
                          ))}

                          {feedback.reasons && feedback.reasons.length > 0 && (
                            <Box mt={1}>
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
                                      mb: 0.5,
                                      mr: 0.5,
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
              </Box>
            )} */}
          </Stack>
        )}

        <Dialog open={showSubmitDialog} maxWidth="xs" fullWidth>
          <DialogContent>
            <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
              {submitStatus === 'submitting' && (
                <>
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      bgcolor: '#f4b84a',
                      fontSize: '50px',
                      mb: -2,
                    }}
                  >
                    🛫
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      display: 'flex',
                      fontFamily: 'Instrument Serif, serif',
                      fontSize: { xs: '1.5rem', sm: '2.5rem' },
                      fontWeight: 550,
                    }}
                  >
                    Submitting Draft
                    <LoadingDots />
                  </Typography>
                </>
              )}
              {submitStatus === 'success' && (
                <>
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      bgcolor: '#835cf5',
                      fontSize: '50px',
                      mb: -2,
                    }}
                  >
                    🚀
                  </Box>
                  <Stack spacing={1} alignItems="center">
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: 'Instrument Serif, serif',
                        fontSize: { xs: '1.5rem', sm: '2.5rem' },
                        fontWeight: 550,
                      }}
                    >
                      Draft is sent for processing!
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#636366',
                        mt: -2,
                      }}
                    >
                      Your draft has been sent for processing.
                    </Typography>
                  </Stack>
                </>
              )}
              {submitStatus === 'error' && (
                <>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      bgcolor: 'error.lighter',
                      fontSize: '40px',
                      mb: 2,
                    }}
                  >
                    <Iconify icon="mdi:error" sx={{ width: 60, height: 60, color: 'error.main' }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: 'Instrument Serif, serif',
                      fontSize: { xs: '1.5rem', sm: '1.8rem' },
                      fontWeight: 550,
                    }}
                  >
                    Submission Failed
                  </Typography>
                </>
              )}
            </Stack>
          </DialogContent>
          {(submitStatus === 'success' || submitStatus === 'error') && (
            <DialogActions sx={{ pb: 3, px: 3 }}>
              <Button
                onClick={() => {
                  setShowSubmitDialog(false);
                  setSubmitStatus('');
                }}
                variant="contained"
                fullWidth
                sx={{
                  bgcolor: '#3a3a3c',
                  color: '#ffffff',
                  borderBottom: 3.5,
                  borderBottomColor: '#202021',
                  borderRadius: 1.5,
                  mt: -4,
                  px: 2.5,
                  py: 1.2,
                  '&:hover': {
                    bgcolor: '#3a3a3c',
                    opacity: 0.9,
                  },
                }}
              >
                Done
              </Button>
            </DialogActions>
          )}
        </Dialog>

        <Dialog
          open={display.value}
          onClose={display.onFalse}
          fullScreen
          PaperProps={{
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              overflow: 'hidden',
              position: 'relative',
            },
          }}
          sx={{
            zIndex: 9999,
            '& .MuiDialog-container': {
              alignItems: 'center',
              justifyContent: 'center',
            },
            '& .MuiDialog-paper': {
              m: 0,
              width: '100%',
              height: '100%',
            },
          }}
        >
          {/* Header Info - Top Left */}
          <Box
            sx={{
              position: 'fixed',
              top: { xs: 10, md: 20 },
              left: { xs: 10, md: 20 },
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, md: 1.5 },
              borderRadius: '8px',
              p: { xs: 1.5, md: 2 },
              height: { xs: '56px', md: '64px' },
              minWidth: { xs: '200px', md: '240px' },
            }}
          >
            <Box
              sx={{
                width: { xs: 36, md: 40 },
                height: { xs: 36, md: 40 },
                borderRadius: 1,
                bgcolor: '#1340ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify
                icon="solar:document-bold"
                sx={{
                  color: 'white',
                  width: { xs: 18, md: 20 },
                  height: { xs: 18, md: 20 },
                }}
              />
            </Box>
            <Stack spacing={0.5}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: '#e7e7e7',
                  fontSize: { xs: '13px', md: '14px' },
                  lineHeight: 1.3,
                }}
              >
                Preview Draft
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#85868E',
                  fontSize: { xs: '11px', md: '12px' },
                  lineHeight: 1.3,
                }}
              >
                {campaign?.name}
              </Typography>
            </Stack>
          </Box>

          {/* Content Type Navigation - Top Center */}
          <Stack
            direction="row"
            spacing={{ xs: 0.5, md: 1 }}
            sx={{
              position: 'fixed',
              top: { xs: 10, md: 20 },
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10000,
            }}
          >
            {/* Draft Videos Button */}
            <Tooltip
              title={`Draft Videos${
                (campaign?.campaignCredits && deliverables?.videos?.length > 0
                  ? deliverables.videos
                  : [{ url: submission?.content }]
                ).length > 1
                  ? ` (${selectedVideoIndex + 1}/${
                      (campaign?.campaignCredits && deliverables?.videos?.length > 0
                        ? deliverables.videos
                        : [{ url: submission?.content }]
                      ).length
                    })`
                  : ''
              }`}
              arrow
              placement="bottom"
              PopperProps={{
                sx: {
                  zIndex: 10001,
                },
              }}
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    fontSize: { xs: '11px', md: '12px' },
                    fontWeight: 500,
                  },
                },
                arrow: {
                  sx: {
                    color: 'rgba(0, 0, 0, 0.9)',
                  },
                },
              }}
            >
              <Button
                onClick={() => setTabIndex(0)}
                sx={{
                  minWidth: { xs: '40px', md: '44px' },
                  width: { xs: '40px', md: '44px' },
                  height: { xs: '40px', md: '44px' },
                  p: 0,
                  bgcolor: tabIndex === 0 ? '#1340ff' : 'transparent',
                  color: '#ffffff',
                  border: '1px solid #28292C',
                  borderRadius: '8px',
                  fontWeight: 650,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: { xs: '3px', md: '4px' },
                    left: { xs: '3px', md: '4px' },
                    right: { xs: '3px', md: '4px' },
                    bottom: { xs: '3px', md: '4px' },
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s ease',
                    zIndex: -1,
                  },
                  '&:hover::before': {
                    backgroundColor: tabIndex === 0 ? 'transparent' : '#5A5A5C',
                  },
                  '&:hover': {
                    bgcolor: tabIndex === 0 ? '#1340ff' : 'transparent',
                  },
                }}
              >
                <Iconify icon="eva:video-outline" width={{ xs: 16, md: 18 }} />
              </Button>
            </Tooltip>

            {/* Raw Footage Button */}
            {deliverables?.rawFootages?.length > 0 && (
              <Tooltip
                title={`Raw Footage${deliverables.rawFootages.length > 1 ? ` (${selectedRawFootageIndex + 1}/${deliverables.rawFootages.length})` : ''}`}
                arrow
                placement="bottom"
                PopperProps={{
                  sx: {
                    zIndex: 10001,
                  },
                }}
                slotProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'rgba(0, 0, 0, 0.9)',
                      color: 'white',
                      fontSize: { xs: '11px', md: '12px' },
                      fontWeight: 500,
                    },
                  },
                  arrow: {
                    sx: {
                      color: 'rgba(0, 0, 0, 0.9)',
                    },
                  },
                }}
              >
                <Button
                  onClick={() => setTabIndex(1)}
                  sx={{
                    minWidth: { xs: '40px', md: '44px' },
                    width: { xs: '40px', md: '44px' },
                    height: { xs: '40px', md: '44px' },
                    p: 0,
                    bgcolor: tabIndex === 1 ? '#1340ff' : 'transparent',
                    color: '#ffffff',
                    border: '1px solid #28292C',
                    borderRadius: '8px',
                    fontWeight: 650,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: { xs: '3px', md: '4px' },
                      left: { xs: '3px', md: '4px' },
                      right: { xs: '3px', md: '4px' },
                      bottom: { xs: '3px', md: '4px' },
                      borderRadius: '4px',
                      backgroundColor: 'transparent',
                      transition: 'background-color 0.2s ease',
                      zIndex: -1,
                    },
                    '&:hover::before': {
                      backgroundColor: tabIndex === 1 ? 'transparent' : '#5A5A5C',
                    },
                    '&:hover': {
                      bgcolor: tabIndex === 1 ? '#1340ff' : 'transparent',
                    },
                  }}
                >
                  <Iconify icon="eva:film-outline" width={{ xs: 16, md: 18 }} />
                </Button>
              </Tooltip>
            )}

            {/* Photos Button */}
            {submission?.photos?.length > 0 && (
              <Tooltip
                title={`Photos${submission.photos.length > 1 ? ` (${selectedPhotoIndex + 1}/${submission.photos.length})` : ''}`}
                arrow
                placement="bottom"
                PopperProps={{
                  sx: {
                    zIndex: 10001,
                  },
                }}
                slotProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'rgba(0, 0, 0, 0.9)',
                      color: 'white',
                      fontSize: { xs: '11px', md: '12px' },
                      fontWeight: 500,
                    },
                  },
                  arrow: {
                    sx: {
                      color: 'rgba(0, 0, 0, 0.9)',
                    },
                  },
                }}
              >
                <Button
                  onClick={() => setTabIndex(deliverables?.rawFootages?.length > 0 ? 2 : 1)}
                  sx={{
                    minWidth: { xs: '40px', md: '44px' },
                    width: { xs: '40px', md: '44px' },
                    height: { xs: '40px', md: '44px' },
                    p: 0,
                    bgcolor:
                      tabIndex === (deliverables?.rawFootages?.length > 0 ? 2 : 1)
                        ? '#1340ff'
                        : 'transparent',
                    color: '#ffffff',
                    border: '1px solid #28292C',
                    borderRadius: '8px',
                    fontWeight: 650,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: { xs: '3px', md: '4px' },
                      left: { xs: '3px', md: '4px' },
                      right: { xs: '3px', md: '4px' },
                      bottom: { xs: '3px', md: '4px' },
                      borderRadius: '4px',
                      backgroundColor: 'transparent',
                      transition: 'background-color 0.2s ease',
                      zIndex: -1,
                    },
                    '&:hover::before': {
                      backgroundColor:
                        tabIndex === (deliverables?.rawFootages?.length > 0 ? 2 : 1)
                          ? 'transparent'
                          : '#5A5A5C',
                    },
                    '&:hover': {
                      bgcolor:
                        tabIndex === (deliverables?.rawFootages?.length > 0 ? 2 : 1)
                          ? '#1340ff'
                          : 'transparent',
                    },
                  }}
                >
                  <Iconify icon="eva:image-outline" width={{ xs: 16, md: 18 }} />
                </Button>
              </Tooltip>
            )}
          </Stack>

          {/* Close Button - Top Right */}
          <Tooltip
            title="Close"
            arrow
            placement="bottom"
            PopperProps={{
              sx: {
                zIndex: 10001,
              },
            }}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  fontSize: { xs: '11px', md: '12px' },
                  fontWeight: 500,
                },
              },
              arrow: {
                sx: {
                  color: 'rgba(0, 0, 0, 0.9)',
                },
              },
            }}
          >
            <Button
              onClick={display.onFalse}
              sx={{
                position: 'fixed',
                top: { xs: 10, md: 20 },
                right: { xs: 10, md: 20 },
                zIndex: 10000,
                minWidth: { xs: '40px', md: '44px' },
                width: { xs: '40px', md: '44px' },
                height: { xs: '40px', md: '44px' },
                p: 0,
                color: '#ffffff',
                border: '1px solid #28292C',
                borderRadius: '8px',
                fontWeight: 650,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: { xs: '3px', md: '4px' },
                  left: { xs: '3px', md: '4px' },
                  right: { xs: '3px', md: '4px' },
                  bottom: { xs: '3px', md: '4px' },
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: '#5A5A5C',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              <Iconify icon="eva:close-fill" width={{ xs: 20, md: 22 }} />
            </Button>
          </Tooltip>

          {/* Main Content Area */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100vh',
              position: 'fixed',
              top: 0,
              left: 0,
              pt: { xs: '80px', md: '100px' },
              pb: { xs: 2, md: 3 },
              px: { xs: 2, md: 4 },
              gap: { xs: 2, md: 3 },
              overflow: 'hidden',
            }}
          >
            {/* Draft Videos Content */}
            {tabIndex === 0 && (
              <>
                {/* Video Container */}
                <Box
                  sx={{
                    position: 'relative',
                    width: {
                      xs: '100%',
                      md: submission?.caption ? '60%' : '90%',
                    },
                    height: {
                      xs: submission?.caption ? 'calc(60vh - 80px)' : 'calc(100vh - 120px)',
                      md: 'calc(100vh - 120px)',
                    },
                    maxWidth: {
                      xs: '100%',
                      md: submission?.caption ? '800px' : '1200px',
                    },
                    bgcolor: 'black',
                    borderRadius: 2,
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {(campaign?.campaignCredits && deliverables?.videos?.length > 0
                    ? deliverables.videos
                    : [{ url: submission?.content }]
                  ).map(
                    (videoItem, index) =>
                      index === selectedVideoIndex && (
                        <Box
                          key={`large-${videoItem.id || index}`}
                          component="video"
                          src={videoItem.url}
                          controls
                          autoPlay
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            maxWidth: '100%',
                            maxHeight: '100%',
                          }}
                        />
                      )
                  )}

                  {/* Navigation Arrows for Multiple Videos */}
                  {(campaign?.campaignCredits && deliverables?.videos?.length > 0
                    ? deliverables.videos
                    : [{ url: submission?.content }]
                  ).length > 1 && (
                    <>
                      {/* Previous Button */}
                      <Tooltip
                        title="Previous Video"
                        arrow
                        placement="left"
                        PopperProps={{
                          sx: {
                            zIndex: 10001,
                          },
                        }}
                        slotProps={{
                          tooltip: {
                            sx: {
                              bgcolor: 'rgba(0, 0, 0, 0.9)',
                              color: 'white',
                              fontSize: { xs: '11px', md: '12px' },
                              fontWeight: 500,
                            },
                          },
                          arrow: {
                            sx: {
                              color: 'rgba(0, 0, 0, 0.9)',
                            },
                          },
                        }}
                      >
                        <Button
                          onClick={() => {
                            const totalVideos = (
                              campaign?.campaignCredits && deliverables?.videos?.length > 0
                                ? deliverables.videos
                                : [{ url: submission?.content }]
                            ).length;
                            setSelectedVideoIndex((prev) => (prev - 1 + totalVideos) % totalVideos);
                          }}
                          sx={{
                            position: 'absolute',
                            left: { xs: 8, md: 16 },
                            top: '50%',
                            transform: 'translateY(-50%)',
                            minWidth: { xs: '40px', md: '44px' },
                            width: { xs: '40px', md: '44px' },
                            height: { xs: '40px', md: '44px' },
                            p: 0,
                            color: '#ffffff',
                            bgcolor: 'rgba(40, 41, 44, 0.8)',
                            border: '1px solid #28292C',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)',
                            '&:hover': {
                              bgcolor: 'rgba(40, 41, 44, 0.9)',
                            },
                          }}
                        >
                          <Iconify icon="eva:arrow-ios-back-fill" width={{ xs: 20, md: 22 }} />
                        </Button>
                      </Tooltip>

                      {/* Next Button */}
                      <Tooltip
                        title="Next Video"
                        arrow
                        placement="right"
                        PopperProps={{
                          sx: {
                            zIndex: 10001,
                          },
                        }}
                        slotProps={{
                          tooltip: {
                            sx: {
                              bgcolor: 'rgba(0, 0, 0, 0.9)',
                              color: 'white',
                              fontSize: { xs: '11px', md: '12px' },
                              fontWeight: 500,
                            },
                          },
                          arrow: {
                            sx: {
                              color: 'rgba(0, 0, 0, 0.9)',
                            },
                          },
                        }}
                      >
                        <Button
                          onClick={() => {
                            const totalVideos = (
                              campaign?.campaignCredits && deliverables?.videos?.length > 0
                                ? deliverables.videos
                                : [{ url: submission?.content }]
                            ).length;
                            setSelectedVideoIndex((prev) => (prev + 1) % totalVideos);
                          }}
                          sx={{
                            position: 'absolute',
                            right: { xs: 8, md: 16 },
                            top: '50%',
                            transform: 'translateY(-50%)',
                            minWidth: { xs: '40px', md: '44px' },
                            width: { xs: '40px', md: '44px' },
                            height: { xs: '40px', md: '44px' },
                            p: 0,
                            color: '#ffffff',
                            bgcolor: 'rgba(40, 41, 44, 0.8)',
                            border: '1px solid #28292C',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)',
                            '&:hover': {
                              bgcolor: 'rgba(40, 41, 44, 0.9)',
                            },
                          }}
                        >
                          <Iconify icon="eva:arrow-ios-forward-fill" width={{ xs: 20, md: 22 }} />
                        </Button>
                      </Tooltip>
                    </>
                  )}
                </Box>

                {/* Caption Panel - Right Side on Desktop, Bottom on Mobile */}
                {submission?.caption && (
                  <Box
                    sx={{
                      width: { xs: '100%', md: '35%' },
                      maxWidth: { xs: '100%', md: '400px' },
                      height: {
                        xs: 'calc(40vh - 80px)',
                        md: 'calc(100vh - 120px)',
                      },
                      minHeight: { xs: '150px', md: 'auto' },
                      bgcolor: 'transparent',
                      border: '1px solid #28292C',
                      borderRadius: '8px',
                      p: { xs: 2, md: 3 },
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: '#ffffff',
                        fontSize: { xs: '13px', md: '14px' },
                        mb: { xs: 1.5, md: 2 },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexShrink: 0,
                      }}
                    >
                      <Iconify
                        icon="solar:text-bold"
                        sx={{
                          width: { xs: 14, md: 16 },
                          height: { xs: 14, md: 16 },
                          color: '#ffffff',
                        }}
                      />
                      Video Caption
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        overflow: 'auto',
                        '&::-webkit-scrollbar': {
                          width: { xs: '4px', md: '6px' },
                        },
                        '&::-webkit-scrollbar-track': {
                          background: 'transparent',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#5A5A5C',
                          borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                          background: '#6A6A6C',
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#e7e7e7',
                          fontSize: { xs: '13px', md: '14px' },
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {submission?.caption}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </>
            )}

            {/* Raw Footage Content */}
            {tabIndex === 1 && deliverables?.rawFootages?.length > 0 && (
              <Box
                sx={{
                  position: 'relative',
                  width: '90%',
                  height: 'calc(100vh - 120px)',
                  maxWidth: '1200px',
                  bgcolor: 'black',
                  borderRadius: 2,
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {deliverables.rawFootages.map(
                  (footage, index) =>
                    index === selectedRawFootageIndex && (
                      <Box
                        key={`large-footage-${footage.id || index}`}
                        component="video"
                        src={footage.url}
                        controls
                        autoPlay
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          maxWidth: '100%',
                          maxHeight: '100%',
                        }}
                      />
                    )
                )}

                {/* Navigation Arrows for Multiple Raw Footage */}
                {deliverables.rawFootages.length > 1 && (
                  <>
                    {/* Previous Button */}
                    <Tooltip
                      title="Previous Raw Footage"
                      arrow
                      placement="left"
                      PopperProps={{
                        sx: {
                          zIndex: 10001,
                        },
                      }}
                      slotProps={{
                        tooltip: {
                          sx: {
                            bgcolor: 'rgba(0, 0, 0, 0.9)',
                            color: 'white',
                            fontSize: { xs: '11px', md: '12px' },
                            fontWeight: 500,
                          },
                        },
                        arrow: {
                          sx: {
                            color: 'rgba(0, 0, 0, 0.9)',
                          },
                        },
                      }}
                    >
                      <Button
                        onClick={() => {
                          setSelectedRawFootageIndex(
                            (prev) =>
                              (prev - 1 + deliverables.rawFootages.length) %
                              deliverables.rawFootages.length
                          );
                        }}
                        sx={{
                          position: 'absolute',
                          left: { xs: 8, md: 16 },
                          top: '50%',
                          transform: 'translateY(-50%)',
                          minWidth: { xs: '40px', md: '44px' },
                          width: { xs: '40px', md: '44px' },
                          height: { xs: '40px', md: '44px' },
                          p: 0,
                          color: '#ffffff',
                          bgcolor: 'rgba(40, 41, 44, 0.8)',
                          border: '1px solid #28292C',
                          borderRadius: '8px',
                          backdropFilter: 'blur(10px)',
                          '&:hover': {
                            bgcolor: 'rgba(40, 41, 44, 0.9)',
                          },
                        }}
                      >
                        <Iconify icon="eva:arrow-ios-back-fill" width={{ xs: 20, md: 22 }} />
                      </Button>
                    </Tooltip>

                    {/* Next Button */}
                    <Tooltip
                      title="Next Raw Footage"
                      arrow
                      placement="right"
                      PopperProps={{
                        sx: {
                          zIndex: 10001,
                        },
                      }}
                      slotProps={{
                        tooltip: {
                          sx: {
                            bgcolor: 'rgba(0, 0, 0, 0.9)',
                            color: 'white',
                            fontSize: { xs: '11px', md: '12px' },
                            fontWeight: 500,
                          },
                        },
                        arrow: {
                          sx: {
                            color: 'rgba(0, 0, 0, 0.9)',
                          },
                        },
                      }}
                    >
                      <Button
                        onClick={() => {
                          setSelectedRawFootageIndex(
                            (prev) => (prev + 1) % deliverables.rawFootages.length
                          );
                        }}
                        sx={{
                          position: 'absolute',
                          right: { xs: 8, md: 16 },
                          top: '50%',
                          transform: 'translateY(-50%)',
                          minWidth: { xs: '40px', md: '44px' },
                          width: { xs: '40px', md: '44px' },
                          height: { xs: '40px', md: '44px' },
                          p: 0,
                          color: '#ffffff',
                          bgcolor: 'rgba(40, 41, 44, 0.8)',
                          border: '1px solid #28292C',
                          borderRadius: '8px',
                          backdropFilter: 'blur(10px)',
                          '&:hover': {
                            bgcolor: 'rgba(40, 41, 44, 0.9)',
                          },
                        }}
                      >
                        <Iconify icon="eva:arrow-ios-forward-fill" width={{ xs: 20, md: 22 }} />
                      </Button>
                    </Tooltip>
                  </>
                )}
              </Box>
            )}

            {/* Photos Content */}
            {tabIndex === (deliverables?.rawFootages?.length > 0 ? 2 : 1) &&
              submission?.photos?.length > 0 && (
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '90%',
                    height: 'calc(100vh - 120px)',
                    maxWidth: '1200px',
                  }}
                >
                  {submission.photos.map(
                    (photo, index) =>
                      index === selectedPhotoIndex && (
                        <Box
                          key={`large-photo-${photo.id || index}`}
                          component="img"
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          sx={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            borderRadius: 2,
                          }}
                        />
                      )
                  )}

                  {/* Navigation Arrows for Multiple Photos */}
                  {submission.photos.length > 1 && (
                    <>
                      {/* Previous Button */}
                      <Tooltip
                        title="Previous Photo"
                        arrow
                        placement="left"
                        PopperProps={{
                          sx: {
                            zIndex: 10001,
                          },
                        }}
                        slotProps={{
                          tooltip: {
                            sx: {
                              bgcolor: 'rgba(0, 0, 0, 0.9)',
                              color: 'white',
                              fontSize: { xs: '11px', md: '12px' },
                              fontWeight: 500,
                            },
                          },
                          arrow: {
                            sx: {
                              color: 'rgba(0, 0, 0, 0.9)',
                            },
                          },
                        }}
                      >
                        <Button
                          onClick={() => {
                            setSelectedPhotoIndex(
                              (prev) =>
                                (prev - 1 + submission.photos.length) % submission.photos.length
                            );
                          }}
                          sx={{
                            position: 'absolute',
                            left: { xs: 8, md: 16 },
                            top: '50%',
                            transform: 'translateY(-50%)',
                            minWidth: { xs: '40px', md: '44px' },
                            width: { xs: '40px', md: '44px' },
                            height: { xs: '40px', md: '44px' },
                            p: 0,
                            color: '#ffffff',
                            bgcolor: 'rgba(40, 41, 44, 0.8)',
                            border: '1px solid #28292C',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)',
                            '&:hover': {
                              bgcolor: 'rgba(40, 41, 44, 0.9)',
                            },
                          }}
                        >
                          <Iconify icon="eva:arrow-ios-back-fill" width={{ xs: 20, md: 22 }} />
                        </Button>
                      </Tooltip>

                      {/* Next Button */}
                      <Tooltip
                        title="Next Photo"
                        arrow
                        placement="right"
                        PopperProps={{
                          sx: {
                            zIndex: 10001,
                          },
                        }}
                        slotProps={{
                          tooltip: {
                            sx: {
                              bgcolor: 'rgba(0, 0, 0, 0.9)',
                              color: 'white',
                              fontSize: { xs: '11px', md: '12px' },
                              fontWeight: 500,
                            },
                          },
                          arrow: {
                            sx: {
                              color: 'rgba(0, 0, 0, 0.9)',
                            },
                          },
                        }}
                      >
                        <Button
                          onClick={() => {
                            setSelectedPhotoIndex((prev) => (prev + 1) % submission.photos.length);
                          }}
                          sx={{
                            position: 'absolute',
                            right: { xs: 8, md: 16 },
                            top: '50%',
                            transform: 'translateY(-50%)',
                            minWidth: { xs: '40px', md: '44px' },
                            width: { xs: '40px', md: '44px' },
                            height: { xs: '40px', md: '44px' },
                            p: 0,
                            color: '#ffffff',
                            bgcolor: 'rgba(40, 41, 44, 0.8)',
                            border: '1px solid #28292C',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)',
                            '&:hover': {
                              bgcolor: 'rgba(40, 41, 44, 0.9)',
                            },
                          }}
                        >
                          <Iconify icon="eva:arrow-ios-forward-fill" width={{ xs: 20, md: 22 }} />
                        </Button>
                      </Tooltip>
                    </>
                  )}
                </Box>
              )}

            {/* Caption Content */}
            {tabIndex === getTabIndex('caption') && submission?.caption && (
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '90%',
                  height: 'calc(100vh - 120px)',
                  maxWidth: '800px',
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    maxHeight: '100%',
                    bgcolor: 'transparent',
                    border: '1px solid #28292C',
                    borderRadius: '8px',
                    p: { xs: 3, md: 4 },
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                      width: { xs: '4px', md: '6px' },
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#5A5A5C',
                      borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: '#6A6A6C',
                    },
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: '#ffffff',
                      fontSize: { xs: '16px', md: '18px' },
                      mb: { xs: 2, md: 3 },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Iconify
                      icon="solar:text-bold"
                      sx={{
                        width: { xs: 18, md: 20 },
                        height: { xs: 18, md: 20 },
                        color: '#ffffff',
                      }}
                    />
                    Video Caption
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#e7e7e7',
                      fontSize: { xs: '14px', md: '16px' },
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {submission?.caption}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Dialog>

        <FinalDraftFileTypeModal
          submission={submission}
          previousSubmission={previousSubmission}
          open={uploadTypeModalOpen}
          handleClose={() => setUploadTypeModalOpen(false)}
          onSelectType={handleUploadTypeSelect}
          campaign={campaign}
          deliverablesData={deliverablesData}
        />

        <UploadPhotoModal
          submissionId={submission?.id}
          campaignId={campaign?.id}
          open={photosModalOpen}
          onClose={() => setPhotosModalOpen(false)}
          previousSubmission={previousSubmission}
          submission={submission}
          deliverablesData={deliverablesData}
        />

        <UploadDraftVideoModal
          submissionId={submission?.id}
          campaign={campaign}
          open={draftVideoModalOpen}
          onClose={() => setDraftVideoModalOpen(false)}
          previousSubmission={previousSubmission}
          submission={submission}
          deliverablesData={deliverablesData}
        />

        <UploadRawFootageModal
          open={rawFootageModalOpen}
          onClose={() => setRawFootageModalOpen(false)}
          submissionId={submission?.id}
          campaign={campaign}
          previousSubmission={previousSubmission}
          submission={submission}
          deliverablesData={deliverablesData}
        />

        <Dialog
          open={imageDialogOpen}
          onClose={() => setImageDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogContent sx={{ p: 0, position: 'relative' }}>
            {selectedImageIndex !== null && submission?.photos?.[selectedImageIndex] && (
              <Box
                component="img"
                src={submission.photos[selectedImageIndex].url}
                alt={`Photo ${selectedImageIndex + 1}`}
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                }}
              />
            )}
            <IconButton
              onClick={() => setImageDialogOpen(false)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: 'common.white',
                bgcolor: 'rgba(0,0,0,0.5)',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.7)',
                },
              }}
            >
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </DialogContent>
        </Dialog>

        {/* Video Modal */}
        <VideoModal
          open={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
          videos={modalVideos}
          currentIndex={selectedVideoForModal}
          setCurrentIndex={setSelectedVideoForModal}
          creator={user}
          submission={submission}
          showCaption={false}
        />

        {/* Photo Modal */}
        <PhotoModal
          open={photoModalOpen}
          onClose={() => setPhotoModalOpen(false)}
          photos={modalPhotos}
          currentIndex={selectedPhotoForModal}
          setCurrentIndex={setSelectedPhotoForModal}
          creator={user}
        />
      </Box>
    )
  );
};

export default CampaignFinalDraft;

CampaignFinalDraft.propTypes = {
  campaign: PropTypes.object,
  timeline: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  submission: PropTypes.object,
  getDependency: PropTypes.func,
  fullSubmission: PropTypes.array,
  setCurrentTab: PropTypes.func,
  deliverablesData: PropTypes.object,
};
