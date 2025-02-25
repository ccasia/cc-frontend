/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable jsx-a11y/media-has-caption */
import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import Chip from '@mui/material/Chip';
import Accordion from '@mui/material/Accordion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
// import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
  Grid,
  Stack,
  Paper,
  Button,
  Dialog,
  Avatar,
  Typography,
  IconButton,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

import UploadPhotoModal from './components/photo';
import UploadDraftVideoModal from './components/draft-video';
import UploadRawFootageModal from './components/raw-footage';
import UploadFileTypeModal from './components/filetype-modal';

// eslint-disable-next-line react/prop-types
// const AvatarIcon = ({ icon, ...props }) => (
//   <Avatar {...props}>
//     <Iconify icon={icon} />
//   </Avatar>
// );

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

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

const CampaignFirstDraft = ({
  campaign,
  timeline,
  submission,
  getDependency,
  fullSubmission,
  openLogisticTab,
  setCurrentTab,
}) => {
  // eslint-disable-next-line no-unused-vars
  const [preview, setPreview] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  // const [loading, setLoading] = useState(false);
  const dependency = getDependency(submission?.id);
  const { socket } = useSocketContext();
  const [progress, setProgress] = useState(0);
  const [progressName, setProgressName] = useState('');
  const display = useBoolean();
  const { user, dispatch } = useAuthContext();
  const [openUploadModal, setOpenUploadModal] = useState(false);
  // const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitStatus, setSubmitStatus] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  // const [thumbnailUrl, setThumbnail] = useState(null);
  const inQueue = useBoolean();
  const savedCaption = localStorage.getItem('caption');
  const [uploadTypeModalOpen, setUploadTypeModalOpen] = useState(false);
  const [fullImageOpen, setFullImageOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [draftVideoModalOpen, setDraftVideoModalOpen] = useState(false);
  const [rawFootageModalOpen, setRawFootageModalOpen] = useState(false);
  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

  const methods = useForm({
    defaultValues: {
      // draft: '',
      caption: savedCaption || '',
      draftVideo: [],
      rawFootage: [],
      photos: [],
    },
    resolver: (values) => {
      const errors = {};

      if (!values.caption || values.caption.trim() === '') {
        errors.caption = {
          type: 'required',
          message: 'Caption is required',
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
    formState: { isSubmitting, isDirty },
    watch,
  } = methods;

  const caption = watch('caption');

  const handleRemoveFile = () => {
    localStorage.removeItem('preview');
    setValue('draft', '');
    setPreview('');
  };

  const logistics = useMemo(
    () => campaign?.logistic?.filter((item) => item?.userId === user?.id),
    [campaign, user]
  );

  const generateThumbnail = useCallback(
    (file) =>
      new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);

        video.load();

        // video.play();

        video.addEventListener('loadeddata', () => {
          video.currentTime = 1; // Capture thumbnail at 1 second
        });

        // After seeking to 1 second, capture the frame
        video.addEventListener('seeked', () => {
          if (video.readyState >= 2) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Revoke object URL to free up memory
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

  // Handle dropping the draft video
  const handleDraftVideoDrop = useCallback(
    (acceptedFiles) => {
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      // Show upload progress for each file
      newFiles.forEach((file) => {
        setCurrentFile(file);
        setUploadProgress(0);

        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 200);
      });

      // Append new files to the existing draftVideo array
      setValue('draftVideo', [...methods.getValues('draftVideo'), ...newFiles], {
        shouldValidate: true,
      });
    },
    [setValue, methods]
  );

  // Handle removing the draft video
  const handleRemoveDraftVideo = (fileToRemove) => {
    const updatedFiles = methods.getValues('draftVideo').filter((file) => file !== fileToRemove);

    setValue('draftVideo', updatedFiles, { shouldValidate: true });
  };

  const handleDropPhoto = useCallback(
    (acceptedFiles) => {
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      // Show upload progress for each file
      newFiles.forEach((file) => {
        setCurrentFile(file);
        setUploadProgress(0);

        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 200);
      });

      // Append new files to the existing photos array
      setValue('photos', [...methods.getValues('photos'), ...newFiles], {
        shouldValidate: true,
      });
    },
    [setValue, methods]
  );

  const handleRemovePhoto = (fileToRemove) => {
    const updatedFiles = methods.getValues('photos').filter((file) => file !== fileToRemove);

    setValue('photos', updatedFiles, { shouldValidate: true });
  };

  // handler for rawFootage
  const handleRawFootageDrop = useCallback(
    (acceptedFiles) => {
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      // Show upload progress for each file
      newFiles.forEach((file) => {
        setCurrentFile(file);
        setUploadProgress(0);

        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 200);
      });

      // Append new files to the existing rawFootage array
      setValue('rawFootage', [...methods.getValues('rawFootage'), ...newFiles], {
        shouldValidate: true,
      });
    },
    [setValue, methods]
  );

  const handleRemoveRawFootage = (fileToRemove) => {
    const updatedFiles = methods.getValues('rawFootage').filter((file) => file !== fileToRemove);

    setValue('rawFootage', updatedFiles, { shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (value) => {
    setOpenUploadModal(false);
    setShowSubmitDialog(true);
    setSubmitStatus('submitting');

    const formData = new FormData();
    const newData = { caption: value.caption, submissionId: submission.id };
    formData.append('data', JSON.stringify(newData));
    //  formData.append('draftVideo', value.draft);

    if (value.draftVideo && value.draftVideo.length > 0) {
      value.draftVideo.forEach((file) => {
        formData.append('draftVideo', file);
      });
    }
    // Append each raw footage file to the form data
    if (value.rawFootage && value.rawFootage.length > 0) {
      value.rawFootage.forEach((file, index) => {
        formData.append(`rawFootage`, file);
      });
    }

    // Append each photo file to the form data
    if (value.photos && value.photos.length > 0) {
      value.photos.forEach((file) => {
        formData.append('photos', file);
      });
    }

    console.log('FormData:', {
      caption: value.caption,
      submissionId: submission.id,
      draftVideo: value.draftVideo ? value.draftVideo.map((file) => file.name) : 'No draft video',
      rawFootage: value.rawFootage ? value.rawFootage.map((file) => file.name) : 'No raw footage',
      photos: value.photos ? value.photos.map((file) => file.name) : 'No photos',
    });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res = await axiosInstance.post(endpoints.submission.creator.draftSubmission, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      enqueueSnackbar(res.data.message);
      mutate(endpoints.kanban.root);
      mutate(endpoints.campaign.creator.getCampaign(campaign.id));
      setSubmitStatus('success');
      if (savedCaption) localStorage.removeItem('caption');
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (error?.message === 'Forbidden') {
        if (caption) {
          localStorage.setItem('caption', caption);
        }
        dispatch({
          type: 'LOGOUT',
        });
        enqueueSnackbar('Your session is expired. Please re-login', {
          variant: 'error',
        });
        return;
      }
      enqueueSnackbar('Failed to submit draft', {
        variant: 'error',
      });
      setSubmitStatus('error');
    }
  });

  const previousSubmission = useMemo(
    () => fullSubmission?.find((item) => item?.id === dependency?.dependentSubmissionId),
    [fullSubmission, dependency]
  );

  useEffect(() => {
    if (!socket) return; // Early return if socket is not available

    const handleProgress = (data) => {
      if (submission?.id !== data.submissionId) return; // Check if submissionId matches
      inQueue.onFalse();
      setProgress(Math.ceil(data.progress));

      if (data.progress === 100 || data.progress === 0) {
        setIsProcessing(false);
        reset();
        setPreview('');
        setProgressName('');
        localStorage.removeItem('preview');

        if (data.progress === 100) {
          mutate(`${endpoints.submission.root}?creatorId=${user?.id}&campaignId=${campaign?.id}`);
        }
      } else {
        setIsProcessing(true);
      }
    };

    const handleStatusQueue = (data) => {
      if (data?.status === 'queue') {
        inQueue.onTrue();
      }
    };

    socket.on('progress', handleProgress);
    socket.on('statusQueue', handleStatusQueue);

    socket.emit('checkQueue', { submissionId: submission?.id });

    // Cleanup on component unmount
    // eslint-disable-next-line consistent-return
    return () => {
      socket.off('progress', handleProgress);
      socket.off('statusQueue', handleStatusQueue);
      // socket.off('checkQueue');
    };
  }, [socket, submission?.id, reset, campaign?.id, user?.id, inQueue]);

  const checkProgress = useCallback(() => {
    if (progress === 100) {
      setShowUploadSuccess(true);

      const timer = setTimeout(() => {
        setShowUploadSuccess(false);
        setIsProcessing(false);
        reset(); // Ensure reset is stable (use useCallback if necessary)
        setPreview('');
        setProgressName('');
        localStorage.removeItem('preview');

        if (socket) {
          mutate(`${endpoints.submission.root}?creatorId=${user?.id}&campaignId=${campaign?.id}`);
        }
      }, 2000);

      return () => {
        clearTimeout(timer);
      };
    }
    return null;
  }, [progress, reset, campaign?.id, user?.id, socket]);

  useEffect(() => {
    checkProgress();
  }, [checkProgress]);

  // useEffect(() => {
  //   if (progress === 100) {
  //     setShowUploadSuccess(true);

  //     const timer = setTimeout(() => {
  //       setShowUploadSuccess(false);
  //       setIsProcessing(false);
  //       reset(); // Ensure reset is stable (use useCallback if necessary)
  //       setPreview('');
  //       setProgressName('');
  //       localStorage.removeItem('preview');

  //       if (socket) {
  //         mutate(`${endpoints.submission.root}?creatorId=${user?.id}&campaignId=${campaign?.id}`);
  //       }
  //     }, 2000);

  //     return () => {
  //       clearTimeout(timer);
  //     };
  //   }
  // }, [progress, reset, campaign?.id, user?.id, socket]);

  // const handleCancel = () => {
  //   if (isProcessing) {
  //     socket?.emit('cancel-processing', { submissionId: submission.id });
  //     setIsProcessing(false);
  //     setProgress(0);
  //     localStorage.removeItem('preview');
  //   }
  // };

  const handleCloseSubmitDialog = () => {
    setShowSubmitDialog(false);
    setSubmitStatus('');
  };

  const handleUploadTypeSelect = (type) => {
    // Check if submission is under review
    if (submission?.status === 'PENDING_REVIEW') {
      enqueueSnackbar('Cannot upload while submission is under review', { variant: 'warning' });
      return;
    }

    // Check if this type is already uploaded
    if (
      (type === 'video' && submission?.video?.length > 0) ||
      (type === 'rawFootage' && submission?.rawFootages?.length > 0) ||
      (type === 'photos' && submission?.photos?.length > 0)
    ) {
      enqueueSnackbar(`${type} has already been uploaded`, { variant: 'warning' });
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
    setCurrentImageIndex(index);
    setFullImageOpen(true);
  };

  const handleFullImageClose = () => {
    setFullImageOpen(false);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(
      (prevIndex) => (prevIndex - 1 + submission.photos.length) % submission.photos.length
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % submission.photos.length);
  };

  return (
    previousSubmission?.status === 'APPROVED' && (
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
            Draft Submission 📝
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

        {logistics?.every((logistic) => logistic?.status === 'Product_has_been_received') ? (
          <Box>
            {submission?.status === 'PENDING_REVIEW' && (
              <Stack justifyContent="center" alignItems="center" spacing={2}>
                <Image src="/assets/pending.svg" sx={{ width: 250 }} />
                <Typography variant="subtitle2">Your First Draft is in review.</Typography>
                <Button
                  onClick={display.onTrue}
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
                {isProcessing || showUploadSuccess ? (
                  <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
                    {(progress > 0 || showUploadSuccess) && (
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
                                boxShadow: (theme) => theme.customShadows.z8,
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
                              {currentFile?.name || 'Uploading file...'}
                            </Typography>
                            <Stack spacing={1}>
                              <LinearProgress
                                variant="determinate"
                                value={progress}
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
                                  {progress === 100 ? (
                                    <Box
                                      component="span"
                                      sx={{ color: 'success.main', fontWeight: 600 }}
                                    >
                                      Upload Complete
                                    </Box>
                                  ) : (
                                    `${progressName || 'Uploading'}... ${progress}%`
                                  )}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {formatFileSize(currentFile?.size || 0)}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Stack>
                        </Stack>
                      </Stack>
                    )}
                  </Box>
                ) : (
                  <Stack gap={2}>
                    <Box>
                      <Typography variant="body1" sx={{ color: '#221f20', mb: 2, ml: -1 }}>
                        It&apos;s time to submit your first draft for this campaign!
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#221f20', mb: 44, ml: -1 }}>
                        Do ensure to read through the brief, and the do&apos;s and dont&apos;s for
                        the creatives over at the{' '}
                        <Box
                          component="span"
                          onClick={() => setCurrentTab('info')}
                          sx={{
                            color: '#203ff5',
                            cursor: 'pointer',
                            fontWeight: 650,
                            '&:hover': {
                              opacity: 0.8,
                            },
                          }}
                        >
                          Campaign Details
                        </Box>{' '}
                        page.
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
                    </Box>
                  </Stack>
                )}
              </>
            )}
            {submission?.status === 'CHANGES_REQUIRED' && (
              <Stack spacing={2}>
                <Box>
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

                              {/* Videos that need changes */}
                              {feedback.videosToUpdate && feedback.videosToUpdate.length > 0 && (
                                <Box mt={2}>
                                  <Typography
                                    variant="subtitle2"
                                    color="warning.darker"
                                    sx={{ mb: 1 }}
                                  >
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
                                                <Typography
                                                  variant="subtitle2"
                                                  color="warning.darker"
                                                >
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

                                              {/* Original Chip Design */}
                                              {feedback.reasons && feedback.reasons.length > 0 && (
                                                <Stack
                                                  direction="row"
                                                  spacing={0.5}
                                                  flexWrap="wrap"
                                                >
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
                  </Box>
                </Box>
              </Stack>
            )}
            {submission?.status === 'APPROVED' && (
              <Stack justifyContent="center" alignItems="center" spacing={2}>
                <Image src="/assets/approve.svg" sx={{ width: 250 }} />
                <Typography variant="subtitle2">Your First Draft has been approved.</Typography>
                <Button
                  onClick={display.onTrue}
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
                        backgroundColor: (theme) => theme.palette.background.neutral,
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
                          backgroundColor: (theme) => theme.palette.background.neutral,
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
                          backgroundColor: (theme) => theme.palette.background.neutral,
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

            {/* New Upload Modal */}
            <UploadFileTypeModal
              submission={submission}
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
            />

            <UploadDraftVideoModal
              submissionId={submission?.id}
              campaign={campaign}
              open={draftVideoModalOpen}
              onClose={() => setDraftVideoModalOpen(false)}
            />

            <UploadRawFootageModal
              open={rawFootageModalOpen}
              onClose={() => setRawFootageModalOpen(false)}
              submissionId={submission?.id}
              campaign={campaign}
            />

            {/* <UploadDraftVideoModal
              open={draftVideoModalOpen}
              onClose={() => setDraftVideoModalOpen(false)}
              campaign={campaign}
            />

            <UploadRawFootageModal
              open={rawFootageModalOpen}
              onClose={() => setRawFootageModalOpen(false)}
            />

            <UploadPhotosModal open={photosModalOpen} onClose={() => setPhotosModalOpen(false)} /> */}

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
                        <Iconify
                          icon="mdi:error"
                          sx={{ width: 60, height: 60, color: 'error.main' }}
                        />
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
                    onClick={handleCloseSubmitDialog}
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
          </Box>
        ) : (
          <Stack justifyContent="center" alignItems="center" spacing={1.5}>
            <Image src="/assets/pending_delivery.svg" sx={{ width: 250 }} />

            <ListItemText
              primary="Your item has been shipped."
              secondary="You can start submit your first draft after you receive the item."
              primaryTypographyProps={{
                variant: 'subtitle2',
              }}
              secondaryTypographyProps={{
                variant: 'caption',
                color: 'text.secondary',
              }}
            />

            <Button size="small" variant="outlined" onClick={openLogisticTab}>
              Check Logistic
            </Button>

            {/* <Typography variant="subtitle2">
              Your item has been shipped and pending delivery confirmation.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              You can start submit your first draft submission after you receive the item.
            </Typography> */}
          </Stack>
        )}
      </Box>
    )
  );
};

export default CampaignFirstDraft;

CampaignFirstDraft.propTypes = {
  campaign: PropTypes.object,
  timeline: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  submission: PropTypes.object,
  getDependency: PropTypes.func,
  fullSubmission: PropTypes.array,
  openLogisticTab: PropTypes.func,
  setCurrentTab: PropTypes.func,
  // onSelectType: PropTypes.func,
};
