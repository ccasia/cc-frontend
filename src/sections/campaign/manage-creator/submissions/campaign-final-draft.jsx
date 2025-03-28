/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable jsx-a11y/media-has-caption */
import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Box,
  Chip,
  Stack,
  Button,
  Dialog,
  Avatar,
  useTheme,
  Accordion,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  CircularProgress,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Tabs,
  Tab,
  Grid,
  LinearProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
// import FormProvider from 'src/components/hook-form/form-provider';
// import { RHFUpload, RHFTextField } from 'src/components/hook-form';

import UploadPhotoModal from './components/photo';
import UploadDraftVideoModal from './components/draft-video';
import UploadRawFootageModal from './components/raw-footage';
import { FinalDraftFileTypeModal } from './components/filetype-modal';

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

const truncateText = (text, maxLength) =>
  text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

const CampaignFinalDraft = ({
  campaign,
  timeline,
  submission,
  getDependency,
  fullSubmission,
  setCurrentTab,
}) => {
  const [preview, setPreview] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressName, setProgressName] = useState('');
  const [loading, setLoading] = useState(false);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [submitStatus, setSubmitStatus] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const dependency = getDependency(submission?.id);
  const { socket } = useSocketContext();
  const [progress, setProgress] = useState(0);
  const display = useBoolean();
  const inQueue = useBoolean();
  const savedCaption = localStorage.getItem('caption');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackTab, setFeedbackTab] = useState('videos');
  const [uploadTypeModalOpen, setUploadTypeModalOpen] = useState(false);
  const [draftVideoModalOpen, setDraftVideoModalOpen] = useState(false);
  const [rawFootageModalOpen, setRawFootageModalOpen] = useState(false);
  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

  const { user, dispatch } = useAuthContext();

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

  const {
    handleSubmit,
    setValue,
    reset,
    formState: { isDirty },
    watch,
  } = methods;

  const caption = watch('caption');

  const handleRemoveFile = () => {
    localStorage.removeItem('preview');
    setValue('draft', '');
    setPreview('');
  };

  const handleDraftVideoDrop = useCallback(
    (acceptedFiles) => {
      const currentFiles = Array.isArray(watch('draftVideo')) ? watch('draftVideo') : [];
      setValue('draftVideo', [...currentFiles, ...acceptedFiles], { shouldValidate: true });
    },
    [watch, setValue]
  );

  const handleRemoveDraftVideo = useCallback(
    (fileToRemove) => {
      const updatedFiles = watch('draftVideo').filter((file) => file !== fileToRemove);
      setValue('draftVideo', updatedFiles, { shouldValidate: true });
    },
    [watch, setValue]
  );

  const generateThumbnail = useCallback(
    (file) =>
      new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);

        video.load();

        video.addEventListener('loadeddata', () => {
          video.currentTime = 1;
        });

        video.addEventListener('seeked', () => {
          if (video.readyState >= 2) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            URL.revokeObjectURL(video.src);
            resolve(canvas.toDataURL());
          } else {
            reject(new Error('Failed to capture thumbnail: video not ready'));
          }
        });

        video.addEventListener('error', () => {
          reject(new Error('Failed to load video'));
        });
      }),
    []
  );

  const handleDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      try {
        const thumbnail = await generateThumbnail(newFile);
        newFile.thumbnail = thumbnail;
      } catch (error) {
        console.error('Error generating thumbnail:', error);
      }

      setPreview(newFile.preview);
      localStorage.setItem('preview', newFile.preview);
      setUploadProgress(0);

      if (file) {
        setValue('draft', newFile, { shouldValidate: true });

        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              enqueueSnackbar('Upload complete!', { variant: 'success' });
              return 100;
            }
            return prev + 10;
          });
        }, 200);
      }
    },
    [setValue, generateThumbnail]
  );

  const onSubmit = handleSubmit(async (value) => {
    console.log('Form values on submit:', value);

    setOpenUploadModal(false);
    setShowSubmitDialog(true);
    setSubmitStatus('submitting');

    const formData = new FormData();
    const newData = {
      caption: value.caption,
      submissionId: submission.id,
    };

    formData.append('data', JSON.stringify(newData));

    if (value.draftVideo && value.draftVideo.length > 0) {
      value.draftVideo.forEach((file) => {
        console.log('Appending file:', file);
        formData.append('draftVideo', file);
      });
    } else {
      console.warn('No draft video found in value.draftVideo');
    }

    console.log('New Data:', newData);
    console.log('FormData Content:', {
      caption: value.caption,
      submissionId: submission.id,
      draftVideo: value.draftVideo,
    });

    try {
      const res = await axiosInstance.post(endpoints.submission.creator.draftSubmission, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      enqueueSnackbar(res.data.message || 'Final draft videos uploaded successfully');
      mutate(endpoints.kanban.root);
      mutate(endpoints.campaign.creator.getCampaign(submission.id));
      setSubmitStatus('success');
      inQueue.onTrue();

      if (savedCaption) localStorage.removeItem('caption');
    } catch (error) {
      if (error?.message === 'Forbidden') {
        if (value.caption) {
          localStorage.setItem('caption', value.caption);
        }
        dispatch({ type: 'LOGOUT' });
        enqueueSnackbar('Your session has expired. Please re-login', { variant: 'error' });
        return;
      }

      enqueueSnackbar('Failed to submit draft', { variant: 'error' });
      console.error('Upload error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleCancel = () => {
    if (isProcessing) {
      socket?.emit('cancel-processing', { submissionId: submission.id });
      setIsProcessing(false);
      setProgress(0);
      localStorage.removeItem('preview');
    }
  };

  const previewSubmission = useMemo(
    () => fullSubmission?.find((item) => item?.id === dependency?.dependentSubmissionId),
    [fullSubmission, dependency]
  );

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleProgress = (data) => {
      if (submission?.id !== data.submissionId) return;

      setUploadProgress((prev) => {
        const exists = prev.some((item) => item.fileName === data.fileName);

        if (exists) {
          return prev.map((item) =>
            item.fileName === data.fileName ? { ...item, ...data } : item
          );
        }
        return [...prev, data];
      });
    };

    socket.on('progress', handleProgress);

    return () => {
      socket.off('progress', handleProgress);
      // socket.off('statusQueue', handleStatusQueue);
      // socket.off('checkQueue');
    };
  }, [socket, submission?.id, reset, campaign?.id, user?.id, inQueue]);


  const checkProgress = useCallback(() => {
    if (uploadProgress?.length && uploadProgress?.every((x) => x.progress === 100)) {
      setShowUploadSuccess(true);

      const timer = setTimeout(() => {
        setShowUploadSuccess(false);
        setIsProcessing(false);
        reset();
        setPreview('');
        setProgressName('');
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

  return (
    previewSubmission?.status === 'CHANGES_REQUIRED' && (
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
                setPreview(submission?.content);
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
          <>
            {/* {inQueue.value && <Typography>In Queue</Typography>} */}
            {uploadProgress.length ? (
              <Stack spacing={1}>
                {uploadProgress.length &&
                  uploadProgress.map((progressFile) => (
                    <Box
                      sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}
                      key={progressFile.fileName}
                    >
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          {progressFile?.type?.startsWith('video') ? (
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
                              {progressFile.preview ? (
                                <Box
                                  component="img"
                                  src={progressFile.preview}
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
                                    icon="solar:video-library-bold"
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
                              {truncateText(progressFile?.fileName, 50) || 'Uploading file...'}
                            </Typography>
                            <Stack spacing={1}>
                              <LinearProgress
                                variant="determinate"
                                value={progressFile?.progress || 0}
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
                                  {progressFile?.progress === 100 ? (
                                    <Box
                                      component="span"
                                      sx={{ color: 'success.main', fontWeight: 600 }}
                                    >
                                      Upload Complete
                                    </Box>
                                  ) : (
                                    `${progressFile?.name || 'Uploading'}... ${progressFile?.progress || 0}%`
                                  )}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {formatFileSize(progressFile?.fileSize || 0)}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Stack>
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
              </Stack>
            ) : (
              <Stack gap={2}>
                <Box>
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

                  {previewSubmission?.status === 'CHANGES_REQUIRED' && (
                    <Box sx={{ mt: 3 }}>
                      <Box
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 2,
                        }}
                      >
                        <Box
                          sx={{
                            p: 3,
                            display: 'flex',
                            alignItems: 'flex-start',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Avatar
                            src={previewSubmission.feedback[0]?.admin?.photoURL || '/default-avatar.png'}
                            alt={previewSubmission.feedback[0]?.admin?.name || 'User'}
                            sx={{ mr: 2 }}
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                  {previewSubmission.feedback[0]?.admin?.name || 'Unknown User'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {previewSubmission.feedback[0]?.admin?.role || 'No Role'}
                                </Typography>
                              </Box>
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
                                }}
                              />
                            </Box>

                            {feedbackTab === 'videos' && previewSubmission.feedback[0]?.reasons?.length > 0 && (
                              <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 2 }}>
                                {previewSubmission.feedback[0].reasons.map((reason, idx) => (
                                  <Box
                                    key={idx}
                                    sx={{
                                      border: '1.5px solid #e7e7e7',
                                      borderBottom: '4px solid #e7e7e7',
                                      bgcolor: 'white',
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
                            )}
                          </Box>
                        </Box>

                        <Box sx={{ p: 3 }}>
                          <Stack
                            direction="row"
                            spacing={2}
                            sx={{
                              mb: 3,
                              p: 2,
                              bgcolor: 'background.neutral',
                              borderRadius: 2,
                            }}
                          >
                            {previewSubmission.feedback.some(f => f.videosToUpdate?.length > 0) && (
                              <Button
                                onClick={() => setFeedbackTab('videos')}
                                startIcon={<Iconify icon="solar:video-frame-bold" />}
                                sx={{
                                  flex: 1,
                                  py: 2,
                                  color: feedbackTab === 'videos' ? '#1844fc' : 'text.secondary',
                                  bgcolor: feedbackTab === 'videos' ? '#e6ebff' : 'background.paper',
                                  '&:hover': { bgcolor: feedbackTab === 'videos' ? '#e6ebff' : 'action.hover' },
                                }}
                              >
                                <Stack alignItems="center">
                                  <Typography variant="subtitle2">Draft Videos</Typography>
                                  <Typography variant="caption">
                                    {previewSubmission.feedback.reduce((count, f) => count + (f.videosToUpdate?.length || 0), 0)} videos
                                  </Typography>
                                </Stack>
                              </Button>
                            )}

                            {previewSubmission.feedback.some(f => f.rawFootageToUpdate?.length > 0) && (
                              <Button
                                onClick={() => setFeedbackTab('rawFootage')}
                                startIcon={<Iconify icon="solar:gallery-wide-bold" />}
                                sx={{
                                  flex: 1,
                                  py: 2,
                                  color: feedbackTab === 'rawFootage' ? '#1844fc' : 'text.secondary',
                                  bgcolor: feedbackTab === 'rawFootage' ? '#e6ebff' : 'background.paper',
                                  '&:hover': { bgcolor: feedbackTab === 'rawFootage' ? '#e6ebff' : 'action.hover' },
                                }}
                              >
                                <Stack alignItems="center">
                                  <Typography variant="subtitle2">Raw Footage</Typography>
                                  <Typography variant="caption">
                                    {previewSubmission.feedback.reduce((count, f) => count + (f.rawFootageToUpdate?.length || 0), 0)} files
                                  </Typography>
                                </Stack>
                              </Button>
                            )}

                            {previewSubmission.feedback.some(f => f.photosToUpdate?.length > 0) && (
                              <Button
                                onClick={() => setFeedbackTab('photos')}
                                startIcon={<Iconify icon="solar:camera-bold" />}
                                sx={{
                                  flex: 1,
                                  py: 2,
                                  color: feedbackTab === 'photos' ? '#1844fc' : 'text.secondary',
                                  bgcolor: feedbackTab === 'photos' ? '#e6ebff' : 'background.paper',
                                  '&:hover': { bgcolor: feedbackTab === 'photos' ? '#e6ebff' : 'action.hover' },
                                }}
                              >
                                <Stack alignItems="center">
                                  <Typography variant="subtitle2">Photos</Typography>
                                  <Typography variant="caption">
                                    {previewSubmission.feedback.reduce((count, f) => count + (f.photosToUpdate?.length || 0), 0)} images
                                  </Typography>
                                </Stack>
                              </Button>
                            )}
                          </Stack>

                          <Box>
                            {previewSubmission.feedback.map((feedback, index) => {
                              const relevantContent = 
                                (feedbackTab === 'videos' && feedback.content) ||
                                (feedbackTab === 'rawFootage' && feedback.rawFootageContent) ||
                                (feedbackTab === 'photos' && feedback.photoContent);

                              if (!relevantContent) return null;

                              return (
                                <Box
                                  key={index}
                                  sx={{
                                    p: 2,
                                    mb: 3,
                                    borderRadius: 1,
                                    bgcolor: 'warning.lighter',
                                    border: '1px solid',
                                    borderColor: 'warning.light',
                                  }}
                                >
                                  <Typography variant="subtitle2" color="warning.darker" sx={{ mb: 1 }}>
                                    Feedback:
                                  </Typography>
                                  <Typography variant="body2" color="warning.darker" sx={{ opacity: 0.9 }}>
                                    {feedbackTab === 'videos' && feedback.content}
                                    {feedbackTab === 'rawFootage' && feedback.rawFootageContent}
                                    {feedbackTab === 'photos' && feedback.photoContent}
                                  </Typography>
                                </Box>
                              );
                            })}

                            <Stack spacing={3}>
                              {feedbackTab === 'videos' && (
                                previewSubmission.video
                                  .filter(video => 
                                    previewSubmission.feedback.some(f => 
                                      f.videosToUpdate?.includes(video.id)
                                    )
                                  )
                                  .map((video, index) => (
                                    <Paper
                                      key={video.id}
                                      elevation={0}
                                      sx={{
                                        p: 3,
                                        borderRadius: 2,
                                        bgcolor: 'background.neutral',
                                        border: '1px solid',
                                        borderColor: 'divider'
                                      }}
                                    >
                                      <Stack spacing={2}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                          <Iconify icon="solar:video-frame-bold" sx={{ color: 'text.secondary' }} />
                                          <Typography variant="subtitle2">
                                            Draft Video {index + 1}
                                          </Typography>
                                        </Stack>
                                        
                                        <Box
                                          sx={{
                                            position: 'relative',
                                            width: '100%',
                                            paddingTop: '56.25%',
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            bgcolor: 'black',
                                            border: '1px solid',
                                            borderColor: 'divider'
                                          }}
                                        >
                                          <Box
                                            component="video"
                                            controls
                                            sx={{
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '100%',
                                              objectFit: 'contain'
                                            }}
                                          >
                                            <source src={video.url} type="video/mp4" />
                                          </Box>
                                        </Box>
                                      </Stack>
                                    </Paper>
                                  ))
                              )}

                              {feedbackTab === 'rawFootage' && (
                                previewSubmission.rawFootages
                                  .filter(footage => 
                                    previewSubmission.feedback.some(f => 
                                      f.rawFootageToUpdate?.includes(footage.id)
                                    )
                                  )
                                  .map((footage, index) => (
                                    <Paper
                                      key={footage.id}
                                      elevation={0}
                                      sx={{
                                        p: 3,
                                        borderRadius: 2,
                                        bgcolor: 'background.neutral',
                                        border: '1px solid',
                                        borderColor: 'divider'
                                      }}
                                    >
                                      <Stack spacing={2}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                          <Iconify icon="solar:gallery-wide-bold" sx={{ color: 'text.secondary' }} />
                                          <Typography variant="subtitle2">
                                            Raw Footage {index + 1}
                                          </Typography>
                                        </Stack>
                                        
                                        <Box
                                          sx={{
                                            position: 'relative',
                                            width: '100%',
                                            paddingTop: '56.25%',
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            bgcolor: 'black',
                                            border: '1px solid',
                                            borderColor: 'divider'
                                          }}
                                        >
                                          <Box
                                            component="video"
                                            controls
                                            sx={{
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '100%',
                                              objectFit: 'contain'
                                            }}
                                          >
                                            <source src={footage.url} type="video/mp4" />
                                          </Box>
                                        </Box>
                                      </Stack>
                                    </Paper>
                                  ))
                              )}

                              {feedbackTab === 'photos' && (
                                <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                                  {previewSubmission.photos
                                    .filter(photo => 
                                      previewSubmission.feedback.some(f => 
                                        f.photosToUpdate?.includes(photo.id)
                                      )
                                    )
                                    .map((photo, index) => (
                                      <Paper
                                        key={photo.id}
                                        elevation={0}
                                        sx={{
                                          p: 3,
                                          borderRadius: 2,
                                          bgcolor: 'background.neutral',
                                          border: '1px solid',
                                          borderColor: 'divider'
                                        }}
                                      >
                                        <Stack spacing={2}>
                                          <Stack direction="row" alignItems="center" spacing={1}>
                                            <Iconify icon="solar:camera-bold" sx={{ color: 'text.secondary' }} />
                                            <Typography variant="subtitle2">
                                              Photo {index + 1}
                                            </Typography>
                                          </Stack>
                                          
                                          <Box
                                            sx={{
                                              position: 'relative',
                                              paddingTop: '100%', 
                                              borderRadius: 2,
                                              overflow: 'hidden',
                                              bgcolor: 'background.paper',
                                              border: '1px solid',
                                              borderColor: 'divider'
                                            }}
                                          >
                                            <Box
                                              component="img"
                                              src={photo.url}
                                              alt={`Photo ${index + 1}`}
                                              sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                              }}
                                            />
                                          </Box>
                                        </Stack>
                                      </Paper>
                                    ))}
                                </Box>
                              )}
                            </Stack>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Stack>
            )}
          </>
        )}

        {submission?.status === 'CHANGES_REQUIRED' && (
          <Stack spacing={2}>
            <Box>
              {submission.feedback
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
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 'bold', marginBottom: '2px' }}
                          >
                            {feedback.admin?.name || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {feedback.admin?.role || 'No Role'}
                          </Typography>
                        </Box>
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
                      <Box sx={{ textAlign: 'left', mt: 1 }}>
                        {feedback.content.split('\n').map((line, i) => (
                          <Typography key={i} variant="body2">
                            {line}
                          </Typography>
                        ))}

                        {feedback.videosToUpdate && feedback.videosToUpdate.length > 0 && (
                          <Box mt={2}>
                            <Typography variant="subtitle2" color="warning.darker" sx={{ mb: 1 }}>
                              Videos that need changes:
                            </Typography>
                            <Stack spacing={2}>
                              {submission.video
                                .filter((video) => feedback.videosToUpdate.includes(video.id))
                                .map((video, videoIndex) => (
                                  <Box
                                    key={video.id}
                                    sx={{
                                      p: 2,
                                      borderRadius: 1,
                                      bgcolor: 'warning.lighter',
                                      border: '1px solid',
                                      borderColor: 'warning.main',
                                    }}
                                  >
                                    <Stack direction="column" spacing={2}>
                                      <Stack direction="column" spacing={1}>
                                        <Box>
                                          <Typography variant="subtitle2" color="warning.darker">
                                            Video {videoIndex + 1}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            color="warning.darker"
                                            sx={{ opacity: 0.8 }}
                                          >
                                            Requires changes
                                          </Typography>
                                        </Box>

                                        {feedback.reasons && feedback.reasons.length > 0 && (
                                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                            {feedback.reasons.map((reason, idx) => (
                                              <Box
                                                key={idx}
                                                sx={{
                                                  border: '1.5px solid #e7e7e7',
                                                  borderBottom: '4px solid #e7e7e7',
                                                  bgcolor: 'white',
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
                                        )}
                                      </Stack>

                                      <Box
                                        sx={{
                                          position: 'relative',
                                          width: '100%',
                                          paddingTop: '56.25%',
                                          borderRadius: 1,
                                          overflow: 'hidden',
                                          bgcolor: 'black',
                                        }}
                                      >
                                        <Box
                                          component="video"
                                          src={video.url}
                                          controls
                                          sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                          }}
                                        />
                                      </Box>
                                    </Stack>
                                  </Box>
                                ))}
                            </Stack>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}

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
            </Box>
          </Stack>
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
                setPreview(submission?.content);
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
                      Draft Processing!
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
          maxWidth={false}
          sx={{
            '& .MuiDialog-paper': {
              width: { xs: '95vw', sm: '85vw', md: '900px' },
              height: { xs: '95vh', sm: '90vh' },
              maxHeight: '90vh',
              margin: { xs: '16px', sm: '32px' },
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          <DialogTitle sx={{ p: 3, flexShrink: 0 }}>
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
                onClick={display.onFalse}
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

          <Box
            sx={{
              width: '95%',
              mx: 'auto',
              borderBottom: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          />

          <DialogContent
            sx={{
              p: 2.5,
              flexGrow: 1,
              height: 0,
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '4px',
              },
            }}
          >
            <Stack spacing={3} sx={{ maxWidth: '100%' }}>
              {/* Draft Videos Section */}
              <Accordion
                defaultExpanded
                sx={{
                  boxShadow: 'none',
                  '&:before': { display: 'none' },
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '8px !important',
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    backgroundColor: theme.palette.background.neutral,
                    '&.Mui-expanded': {
                      minHeight: 48,
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon="solar:video-library-bold" width={24} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Draft Videos
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <Stack spacing={2} sx={{ maxWidth: 'md', mx: 'auto' }}>
                    {submission?.video?.length > 0 ? (
                      submission.video.map((videoItem, index) => (
                        <Box
                          key={videoItem.id || index}
                          sx={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '640px',
                            height: 0,
                            paddingTop: 'min(360px, 56.25%)',
                            bgcolor: 'black',
                            borderRadius: 1,
                            mx: 'auto',
                          }}
                        >
                          <Box
                            component="video"
                            autoPlay={false}
                            controls
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                            }}
                          >
                            <source src={videoItem.url} />
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          maxWidth: '640px',
                          height: 0,
                          paddingTop: 'min(360px, 56.25%)',
                          bgcolor: 'black',
                          borderRadius: 1,
                          mx: 'auto',
                        }}
                      >
                        <Box
                          component="video"
                          autoPlay={false}
                          controls
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        >
                          <source src={submission?.content} />
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Raw Footages Section */}
              {submission?.rawFootages?.length > 0 && (
                <Accordion
                  sx={{
                    boxShadow: 'none',
                    '&:before': { display: 'none' },
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '8px !important',
                    overflow: 'hidden',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor: theme.palette.background.neutral,
                      '&.Mui-expanded': {
                        minHeight: 48,
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="solar:camera-bold" width={24} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Raw Footages
                      </Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Stack spacing={2} sx={{ maxWidth: 'md', mx: 'auto' }}>
                      {submission.rawFootages.map((footage, index) => (
                        <Box
                          key={footage.id || index}
                          sx={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '640px',
                            height: 0,
                            paddingTop: 'min(360px, 56.25%)',
                            bgcolor: 'black',
                            borderRadius: 1,
                            mx: 'auto',
                          }}
                        >
                          <Box
                            component="video"
                            autoPlay={false}
                            controls
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                            }}
                          >
                            <source src={footage.url} />
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Photos Section */}
              {submission?.photos?.length > 0 && (
                <Accordion
                  sx={{
                    boxShadow: 'none',
                    '&:before': { display: 'none' },
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '8px !important',
                    overflow: 'hidden',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor: theme.palette.background.neutral,
                      '&.Mui-expanded': {
                        minHeight: 48,
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="solar:gallery-wide-bold" width={24} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Photos
                      </Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Grid container spacing={2} sx={{ maxWidth: '100%' }}>
                      {submission.photos.map((photo, index) => (
                        <Grid item xs={12} sm={6} md={4} key={photo.id || index}>
                          <Box
                            sx={{
                              position: 'relative',
                              paddingTop: '56.25%',
                              borderRadius: 2,
                              overflow: 'hidden',
                              boxShadow: 2,
                              cursor: 'pointer',
                            }}
                            onClick={() => handleImageClick(index)}
                          >
                            <Box
                              component="img"
                              src={photo.url}
                              alt={`Photo ${index + 1}`}
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Caption Section */}
              {submission?.caption && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: 'background.neutral',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', display: 'block', mb: 0.5, fontWeight: 600 }}
                  >
                    Caption
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
                    {submission?.caption}
                  </Typography>
                </Box>
              )}
            </Stack>
          </DialogContent>
        </Dialog>

        <FinalDraftFileTypeModal
          submission={submission}
          previewSubmission={previewSubmission}
          open={uploadTypeModalOpen}
          handleClose={() => setUploadTypeModalOpen(false)}
          onSelectType={handleUploadTypeSelect}
          campaign={campaign}
        />

        <UploadPhotoModal
          submissionId={submission?.id}
          campaignId={campaign?.id}
          open={photosModalOpen}
          onClose={() => setPhotosModalOpen(false)}
          previewSubmission={previewSubmission}
        />

        <UploadDraftVideoModal
          submissionId={submission?.id}
          campaign={campaign}
          open={draftVideoModalOpen}
          onClose={() => setDraftVideoModalOpen(false)}
          previewSubmission={previewSubmission}
        />

        <UploadRawFootageModal
          open={rawFootageModalOpen}
          onClose={() => setRawFootageModalOpen(false)}
          submissionId={submission?.id}
          campaign={campaign}
          previewSubmission={previewSubmission}
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
};
