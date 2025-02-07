/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable jsx-a11y/media-has-caption */
import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import Chip from '@mui/material/Chip';
import { LoadingButton } from '@mui/lab';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
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
  CircularProgress,
  Grid,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFUpload, RHFTextField } from 'src/components/hook-form';

import { useResponsive } from 'src/hooks/use-responsive';
import { grey } from '@mui/material/colors';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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

// const generateThumbnail = (file) =>
//   new Promise((resolve, reject) => {
//     const video = document.createElement('video');
//     video.src = URL.createObjectURL(file);
//     video.muted = true; // Mute the video to prevent playback issues
//     video.playsInline = true; // Improve mobile performance
//     video.crossOrigin = 'anonymous'; // Ensure proper cross-origin handling if needed

//     const cleanUp = () => {
//       URL.revokeObjectURL(video.src);
//       video.remove(); // Remove video element to free up memory
//     };

//     video.addEventListener('loadeddata', () => {
//       video.currentTime = 1; // Seek to 1 second
//     });

//     video.addEventListener('seeked', () => {
//       const canvas = document.createElement('canvas');
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;

//       const ctx = canvas.getContext('2d');
//       ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

//       resolve(canvas.toDataURL());
//       cleanUp(); // Clean up resources
//     });

//     video.addEventListener('error', (e) => {
//       // eslint-disable-next-line prefer-promise-reject-errors
//       reject(`Error loading video: ${e.message}`);
//       cleanUp(); // Clean up resources in case of error
//     });
//   });

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

  // Previous drop 
  // const handleDrop = useCallback(
  //   async (acceptedFiles) => {
  //     const file = acceptedFiles[0];

  //     const newFile = Object.assign(file, {
  //       preview: URL.createObjectURL(file),
  //     });

  //     try {
  //       const thumbnail = await generateThumbnail(newFile);
  //       newFile.thumbnail = thumbnail;
  //     } catch (error) {
  //       console.error('Error generating thumbnail:', error);
  //     }

  //     setPreview(newFile.preview);
  //     localStorage.setItem('preview', newFile.preview);
  //     setUploadProgress(0);

  //     if (file) {
  //       setValue('draft', newFile, { shouldValidate: true });

  //       // Simulate upload progress
  //       const interval = setInterval(() => {
  //         setUploadProgress((prev) => {
  //           if (prev >= 100) {
  //             clearInterval(interval);
  //             enqueueSnackbar('Upload complete!', { variant: 'success' });
  //             return 100;
  //           }
  //           return prev + 10;
  //         });
  //       }, 200);
  //     }
  //   },
  //   [setValue, generateThumbnail]
  // );  

  // handler for photos   
 
  
 // Handle dropping the draft video
const handleDraftVideoDrop = useCallback((acceptedFiles) => {
  const newFiles = acceptedFiles.map((file) =>
    Object.assign(file, {
      preview: URL.createObjectURL(file),
    })
  );

  // Append new files to the existing draftVideo array
  setValue('draftVideo', [...methods.getValues('draftVideo'), ...newFiles], {
    shouldValidate: true,
  });
}, [setValue, methods]);

// Handle removing the draft video
const handleRemoveDraftVideo = (fileToRemove) => {
  const updatedFiles = methods
    .getValues('draftVideo')
    .filter((file) => file !== fileToRemove);

  setValue('draftVideo', updatedFiles, { shouldValidate: true });
};

  const handleDropPhoto = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );
  
    // Append new files to the existing photos array
    setValue('photos', [...methods.getValues('photos'), ...newFiles], {
      shouldValidate: true,
    });
  }, [setValue, methods]);

  const handleRemovePhoto = (fileToRemove) => {
    const updatedFiles = methods
      .getValues('photos')
      .filter((file) => file !== fileToRemove);
  
    setValue('photos', updatedFiles, { shouldValidate: true });
  };

  // handler for rawFootage 
  const handleRawFootageDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );
  
    // Append new files to the existing rawFootage array
    setValue('rawFootage', [...methods.getValues('rawFootage'), ...newFiles], {
      shouldValidate: true,
    });
  }, [setValue, methods]);

  const handleRemoveRawFootage = (fileToRemove) => {
    const updatedFiles = methods
      .getValues('rawFootage')
      .filter((file) => file !== fileToRemove);
  
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
    draftVideo: value.draftVideo
    ? value.draftVideo.map((file) => file.name)
    : 'No draft video',
    rawFootage: value.rawFootage
      ? value.rawFootage.map((file) => file.name)
      : 'No raw footage',
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
      setProgress(data.progress);

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

    socket.on('progress', handleProgress);
    socket.on('statusQueue', (data) => {
      if (data?.status === 'queue') {
        inQueue.onTrue();
      }
    });

    socket.emit('checkQueue', { submissionId: submission?.id });

    // Cleanup on component unmount
    // eslint-disable-next-line consistent-return
    return () => {
      socket.off('progress', handleProgress);
      socket.off('statusQueue');
      socket.off('checkQueue');
    };
  }, [socket, submission?.id, reset, campaign?.id, user?.id, inQueue]);

  const handleCancel = () => {
    if (isProcessing) {
      socket?.emit('cancel-processing', { submissionId: submission.id });
      setIsProcessing(false);
      setProgress(0);
      localStorage.removeItem('preview');
    }
  };

  const handleCloseSubmitDialog = () => {
    setShowSubmitDialog(false);
    setSubmitStatus('');
  };

  const handleUploadTypeSelect = (type) => {
    setOpenUploadModal(true);
    setUploadTypeModalOpen(false);
  };

  const handleUploadClick = () => {
    setUploadTypeModalOpen(true);
  };

  const UploadFileTypeModal = ({ open, handleClose, onSelectType }) => {
    const smUp = useResponsive('up', 'sm');

    const fileTypes = [
      {
        type: 'video',
        icon: 'solar:video-library-bold',
        title: 'Draft Video',
        description: 'Upload your main draft video for the campaign',
      },
      {
        type: 'rawFootage',
        icon: 'solar:camera-bold',
        title: 'Raw Footage',
        description: 'Upload raw, unedited footage from your shoot',
      },
      {
        type: 'photos',
        icon: 'solar:gallery-wide-bold',
        title: 'Photos',
        description: 'Upload photos from your campaign shoot',
      },
    ];

    return (
      <Dialog open={open} fullScreen={!smUp} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">What would you like to upload? 📤</Typography>
            <IconButton onClick={handleClose}>
              <Iconify icon="hugeicons:cancel-01" width={20} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            gap={2}
            pb={4}
            mt={1}
          >
            {fileTypes.map((type) => (
              <Box
                key={type.type}
                sx={{
                  border: 1,
                  p: 2,
                  borderRadius: 2,
                  borderColor: grey[100],
                  transition: 'all .2s ease',
                  width: { xs: '100%', sm: 'auto' },
                  '&:hover': {
                    borderColor: grey[700],
                    cursor: 'pointer',
                    transform: 'scale(1.05)',
                  },
                }}
                onClick={() => {
                  handleClose();
                  onSelectType(type.type);
                }}
              >
                <Avatar sx={{ bgcolor: '#203ff5' }}>
                  <Iconify icon={type.icon} />
                </Avatar>
                <ListItemText
                  sx={{ mt: 2 }}
                  primary={type.title}
                  secondary={type.description}
                  primaryTypographyProps={{
                    variant: 'body1',
                    fontWeight: 'bold',
                    gutterBottom: 1,
                  }}
                  secondaryTypographyProps={{
                    color: 'text.secondary',
                    lineHeight: 1.2,
                  }}
                />
              </Box>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>
    );
  };

  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
    setFullImageOpen(true);
  };

  const handleFullImageClose = () => {
    setFullImageOpen(false);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + submission.photos.length) % submission.photos.length);
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
                {inQueue.value && <Typography>In queue</Typography>}
                {isProcessing ? (
                  <Stack justifyContent="center" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'inline-flex',
                      }}
                    >
                      <CircularProgress
                        variant="determinate"
                        thickness={5}
                        value={progress}
                        size={200}
                        sx={{
                          ' .MuiCircularProgress-circle': {
                            stroke: (theme) =>
                              theme.palette.mode === 'dark'
                                ? theme.palette.common.white
                                : theme.palette.common.black,
                            strokeLinecap: 'round',
                          },
                        }}
                      />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="h3" sx={{ fontWeight: 'bolder', fontSize: 11 }}>
                          {`${Math.round(progress)}%`}
                        </Typography>
                      </Box>
                    </Box>
                    <Stack gap={1}>
                      <Typography variant="caption">{progressName && progressName}</Typography>
                      {/* <LinearProgress variant="determinate" value={progress} /> */}

                      <Button variant="contained" size="small" onClick={() => handleCancel()}>
                        Cancel
                      </Button>
                    </Stack>
                  </Stack>
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
                        <VisibilityIcon sx={{ color: 'white', fontSize: 32 }} />
                      </Box>
                    </Box>
                  </Box>

                  <Box mt={2}>
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
              maxWidth="md"
              sx={{
                '& .MuiDialog-paper': {
                  p: 0,
                  maxWidth: { xs: '95vw', sm: '85vw', md: '75vw' },
                  margin: { xs: '16px', sm: '32px' },
                  height: '90vh',
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
                <Stack spacing={3}>
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
                      <Stack spacing={2}>
                        {submission?.video?.length > 0 ? (
                          submission.video.map((videoItem, index) => (
                            <Box key={videoItem.id || index}>
                              <Box
                                component="video"
                                autoPlay={false}
                                controls
                                sx={{
                                  width: '100%',
                                  height: '400px',
                                  objectFit: 'contain',
                                  bgcolor: 'black',
                                  borderRadius: 1,
                                }}
                              >
                                <source src={videoItem.url} />
                              </Box>
                            </Box>
                          ))
                        ) : (
                          <Box
                            component="video"
                            autoPlay={false}
                            controls
                            sx={{
                              width: '100%',
                              height: '400px',
                              objectFit: 'contain',
                              bgcolor: 'black',
                              borderRadius: 1,
                            }}
                          >
                            <source src={submission?.content} />
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
                        <Stack spacing={2}>
                          {submission.rawFootages.map((footage, index) => (
                            <Box key={footage.id || index}>
                              <Box
                                component="video"
                                autoPlay={false}
                                controls
                                sx={{
                                  width: '100%',
                                  height: '400px',
                                  objectFit: 'contain',
                                  bgcolor: 'black',
                                  borderRadius: 1,
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
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5, fontWeight: 600 }}>
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
              open={uploadTypeModalOpen}
              handleClose={() => setUploadTypeModalOpen(false)}
              onSelectType={handleUploadTypeSelect}
            />

            <Dialog
              open={openUploadModal}
              fullWidth
              maxWidth="md"
              sx={{
                '& .MuiDialog-paper': {
                  width: { xs: 'calc(100% - 32px)', sm: '100%' },
                  m: { xs: 2, sm: 32 },
                },
              }}
            >
              <DialogTitle sx={{ bgcolor: '#f4f4f4' }}>
                <Stack direction="row" alignItems="center" gap={2}>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: 'Instrument Serif, serif',
                        fontSize: { xs: '1.8rem', sm: '2.4rem' },
                        fontWeight: 550,
                      }}
                    >
                      Upload Draft
                    </Typography>
                  </Box>

                  <IconButton
                    onClick={() => setOpenUploadModal(false)}
                    sx={{
                      ml: 'auto',
                      '& svg': {
                        width: { xs: 20, sm: 24 },
                        height: { xs: 20, sm: 24 },
                        color: '#636366',
                      },
                    }}
                  >
                    <Iconify icon="hugeicons:cancel-01" />
                  </IconButton>
                </Stack>
              </DialogTitle>

              <DialogContent sx={{ bgcolor: '#f4f4f4' }}>
                <FormProvider methods={methods} onSubmit={onSubmit}>
                  <Stack spacing={3} sx={{ pt: 1 }}>
                    <Box>
                    <Typography variant="subtitle2" sx={{ color: '#636366' }}>
                      Upload Draft{' '}
                      <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                    </Typography>

                    <RHFUpload
                      name="draftVideo"
                      type="video"
                      onDrop={handleDraftVideoDrop}
                      onRemove={handleRemoveDraftVideo}
                      multiple
                    />

  {/* Display uploaded draft video files - Already Exists */}
  {/* {methods.watch('draftVideo')?.map((file, index) => (
    <Box
      key={index}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mt: 2,
        p: 2,
        border: '1px solid',
        borderColor: '#e7e7e7',
        borderRadius: 1.2,
        bgcolor: '#ffffff',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          component="img"
          src={file.preview}
          sx={{
            width: 64,
            height: 64,
            borderRadius: 1,
            objectFit: 'cover',
          }}
        />
        <Typography variant="body2">{file.name}</Typography>
      </Box>
      <IconButton onClick={() => handleRemoveDraftVideo(file)}>
        X
      </IconButton>
    </Box>
  ))} */}
                      {/* {localStorage.getItem('preview') || preview ? (
                        <Box sx={{ position: 'relative' }}>
                          <Stack
                            spacing={2}
                            sx={{
                              p: 2,
                              border: '1px solid',
                              borderColor: '#e7e7e7',
                              borderRadius: 1.2,
                              bgcolor: '#ffffff',
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={2}
                              sx={{
                                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                              }}
                            >
                              <Box
                                component="img"
                                src={methods.getValues('draft').thumbnail}
                                sx={{
                                  width: 64,
                                  height: 64,
                                  flexShrink: 0,
                                  borderRadius: 1,
                                  objectFit: 'cover',
                                }}
                              />

                              <Box
                                sx={{
                                  flexGrow: 1,
                                  minWidth: { xs: '100%', sm: 'auto' },
                                  mt: { xs: 1, sm: 0 },
                                }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  noWrap
                                  sx={{
                                    color: 'text.primary',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    maxWidth: { xs: '100%', sm: '300px' },
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {methods.watch('draft').name}
                                </Typography>

                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'text.secondary',
                                    display: 'block',
                                    mt: 0.5,
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  {uploadProgress < 100
                                    ? `Uploading ${uploadProgress}%`
                                    : formatFileSize(methods.watch('draft').size)}
                                </Typography>
                              </Box>

                              <Stack
                                direction="row"
                                spacing={2}
                                alignItems="center"
                                sx={{
                                  width: { xs: '100%', sm: 'auto' },
                                  justifyContent: { xs: 'flex-end', sm: 'flex-start' },
                                  mt: { xs: 2, sm: 0 },
                                }}
                              >
                                {uploadProgress < 100 ? (
                                  <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                      <CircularProgress
                                        variant="determinate"
                                        value={100}
                                        size={30}
                                        thickness={6}
                                        sx={{ color: 'grey.300' }}
                                      />
                                      <CircularProgress
                                        variant="determinate"
                                        value={uploadProgress}
                                        size={30}
                                        thickness={6}
                                        sx={{
                                          color: '#5abc6f',
                                          position: 'absolute',
                                          left: 0,
                                          strokeLinecap: 'round',
                                        }}
                                      />
                                    </Box>
                                    <Button
                                      onClick={handleRemoveFile}
                                      variant="contained"
                                      sx={{
                                        bgcolor: 'white',
                                        border: 1,
                                        borderColor: '#e7e7e7',
                                        borderBottom: 3,
                                        borderBottomColor: '#e7e7e7',
                                        color: '#221f20',
                                        '&:hover': {
                                          bgcolor: 'white',
                                          borderColor: '#e7e7e7',
                                        },
                                        textTransform: 'none',
                                        px: 2,
                                        py: 1.5,
                                        fontSize: '0.875rem',
                                        minWidth: '80px',
                                        height: '45px',
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </Stack>
                                ) : (
                                  <Stack direction="row" spacing={1}>
                                    <Button
                                      onClick={display.onTrue}
                                      variant="contained"
                                      sx={{
                                        bgcolor: 'white',
                                        border: 1,
                                        borderColor: '#e7e7e7',
                                        borderBottom: 3,
                                        borderBottomColor: '#e7e7e7',
                                        color: '#221f20',
                                        '&:hover': {
                                          bgcolor: 'white',
                                          borderColor: '#e7e7e7',
                                        },
                                        textTransform: 'none',
                                        px: 2,
                                        py: 1.5,
                                        fontSize: '0.875rem',
                                        minWidth: '80px',
                                        height: '45px',
                                      }}
                                    >
                                      Preview
                                    </Button>
                                    <Button
                                      onClick={handleRemoveFile}
                                      variant="contained"
                                      sx={{
                                        bgcolor: 'white',
                                        border: 1,
                                        borderColor: '#e7e7e7',
                                        borderBottom: 3,
                                        borderBottomColor: '#e7e7e7',
                                        color: '#221f20',
                                        '&:hover': {
                                          bgcolor: 'white',
                                          borderColor: '#e7e7e7',
                                        },
                                        textTransform: 'none',
                                        px: 2,
                                        py: 1.5,
                                        fontSize: '0.875rem',
                                        minWidth: '80px',
                                        height: '45px',
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  </Stack>
                                )}
                              </Stack>
                            </Stack>
                          </Stack>
                        </Box>
                      ) : ( */}
                        {/* <RHFUpload
                          name="draft"
                          type='video'
                          multiple
                          onDrop={handleDraftVideoDrop}
                          onRemove={handleRemoveDraftVideo}
                        /> */}
                      {/* )} */}
                    </Box>

                  {/* rawFootages */}
                  {campaign.rawFootage && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: '#636366' }}>
                        Upload Raw Footages{' '}
                        <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                      </Typography>
                      <RHFUpload
                        name="rawFootage"
                        type='video'
                        onDrop={handleRawFootageDrop}
                        onRemove={handleRemoveRawFootage}
                        multiple 
                      />

                      {/* Display uploaded raw footage files */}
                      {/* {methods.watch('rawFootage')?.map((file, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mt: 2,
                            p: 2,
                            border: '1px solid',
                            borderColor: '#e7e7e7',
                            borderRadius: 1.2,
                            bgcolor: '#ffffff',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              component="img"
                              src={file.preview}
                              sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 1,
                                objectFit: 'cover',
                              }}
                            />
                            <Typography variant="body2">{file.name}</Typography>
                          </Box>
                          <IconButton onClick={() => handleRemoveRawFootage(file)}>
                            X
                          </IconButton>
                        </Box>
                      ))} */}
                    </Box>
                  )}


{campaign.photos && (
  <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle2" sx={{ color: '#636366' }}>
      Upload Photos{' '}
      <Box component="span" sx={{ color: 'error.main' }}>*</Box>
    </Typography>

 {/* Upload Section */} 
 <RHFUpload
      name="photos"
      type="file"
      multiple
      onDrop={handleDropPhoto}
      onRemove={handleRemovePhoto} 
    />
        {/* Display uploaded photos */}
        {/* {methods.watch('photos')?.map((photo, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 2,
            p: 2,
            border: '1px solid',
            borderColor: '#e7e7e7',
            borderRadius: 1.2,
            bgcolor: '#ffffff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src={photo.preview}
              sx={{
                width: 64,
                height: 64,
                borderRadius: 1,
                objectFit: 'cover',
              }}
            />
            <Typography variant="body2">{photo.name}</Typography>
          </Box>
          <IconButton onClick={() => handleRemovePhoto(photo)}>
            <CloseIcon />
          </IconButton>
        </Box>
      ))} */}
    

   
  </Box>
)} 

                    <Box>
                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#636366' }}>
                        Post Caption{' '}
                        <Box component="span" sx={{ color: 'error.main' }}>
                          *
                        </Box>
                      </Typography>
                      <RHFTextField
                        name="caption"
                        placeholder="Type your caption here..."
                        multiline
                        rows={4}
                        required
                        sx={{
                          bgcolor: '#ffffff !important',
                          border: '0px solid #e7e7e7',
                          borderRadius: 1.2,
                        }}
                      />
                    </Box>
                  </Stack>
                </FormProvider>
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 3, bgcolor: '#f4f4f4' }}>
                <LoadingButton
                  loading={isSubmitting}
                  variant="contained"
                  onClick={onSubmit}
                  disabled={!isDirty}
                  sx={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    bgcolor: isDirty ? '#203ff5' : '#b0b0b1 !important',
                    color: '#ffffff !important',
                    borderBottom: 3.5,
                    borderBottomColor: isDirty ? '#112286' : '#9e9e9f',
                    borderRadius: 1.5,
                    px: 2.5,
                    py: 1.2,
                    '&:hover': {
                      bgcolor: isDirty ? '#203ff5' : '#b0b0b1',
                      opacity: 0.9,
                    },
                  }}
                >
                  Submit
                </LoadingButton>
              </DialogActions>
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
                      Draft Submitted!
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#636366',
                        mt: -2,
                      }}
                    >
                      Your draft has been sent.
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
};

