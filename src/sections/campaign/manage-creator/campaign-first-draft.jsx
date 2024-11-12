/* eslint-disable jsx-a11y/media-has-caption */
import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import Chip from '@mui/material/Chip';
import { LoadingButton } from '@mui/lab';
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
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFUpload, RHFTextField } from 'src/components/hook-form';

// eslint-disable-next-line react/prop-types
const AvatarIcon = ({ icon, ...props }) => (
  <Avatar {...props}>
    <Iconify icon={icon} />
  </Avatar>
);

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

const generateThumbnail = (file) =>
  new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.addEventListener('loadeddata', () => {
      video.currentTime = 1; // Seek to 1 second
    });
    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL());
    });
  });

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
  const [loading, setLoading] = useState(false);
  const dependency = getDependency(submission?.id);
  const { socket } = useSocketContext();
  const [progress, setProgress] = useState(0);
  const [progressName, setProgressName] = useState('');
  const display = useBoolean();
  const { user } = useAuthContext();
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitStatus, setSubmitStatus] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const methods = useForm({
    defaultValues: {
      draft: '',
      caption: '',
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
  } = methods;

  const handleRemoveFile = () => {
    localStorage.removeItem('preview');
    setValue('draft', '');
    setPreview('');
  };

  const logistics = useMemo(
    () => campaign?.logistic?.filter((item) => item?.userId === user?.id),
    [campaign, user]
  );

  const handleDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      try {
        const thumbnail = await generateThumbnail(file);
        newFile.thumbnail = thumbnail;
      } catch (error) {
        console.error('Error generating thumbnail:', error);
      }

      setPreview(newFile.preview);
      localStorage.setItem('preview', newFile.preview);
      setUploadProgress(0);

      if (file) {
        setValue('draft', newFile, { shouldValidate: true });

        // Simulate upload progress
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
    [setValue]
  );

  const onSubmit = handleSubmit(async (value) => {
    setOpenUploadModal(false);
    setShowSubmitDialog(true);
    setSubmitStatus('submitting');

    const formData = new FormData();
    const newData = { caption: value.caption, submissionId: submission.id };
    formData.append('data', JSON.stringify(newData));
    formData.append('draftVideo', value.draft);

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
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
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
    if (socket) {
      socket?.on('progress', (data) => {
        if (submission?.id === data.submissionId) {
          setIsProcessing(true);
          setProgress(data.progress);
          setProgressName(data.name);

          if (data.progress === 100) {
            mutate(`${endpoints.submission.root}?creatorId=${user?.id}&campaignId=${campaign?.id}`);

            mutate(endpoints.kanban.root);
            setIsProcessing(false);
            reset();
            setProgressName('');
            setPreview('');
            localStorage.removeItem('preview');
          } else if (progress === 0) {
            setIsProcessing(false);
            reset();
            setPreview('');
            setProgressName('');
            localStorage.removeItem('preview');
          }
        }
      });
    }
    return () => {
      socket?.off('progress');
    };
  }, [socket, submission, reset, progress, campaign, user]);

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
                          onClick={() => setOpenUploadModal(true)}
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
                <Box textAlign="center">
                  <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                    <Box
                      component="video"
                      autoPlay
                      controls
                      sx={{
                        height: 1,
                        width: { xs: '70vw', sm: '100%' },
                        borderRadius: 2,
                        boxShadow: 3,
                      }}
                    >
                      <source src={submission?.content} />
                    </Box>

                    <Box component={Paper} p={1.5} width={1}>
                      <Typography variant="caption" color="text.secondary">
                        Caption
                      </Typography>
                      <Typography variant="subtitle1">{submission?.caption}</Typography>
                    </Box>
                  </Box>

                  {/* Changes Required Alert */}
                  {/* <Alert severity="warning">
                    <Box display="flex" gap={1.5} flexDirection="column">
                      <Typography variant="subtitle2" sx={{ textDecoration: 'underline' }}>
                        Changes Required
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                        {submission?.feedback[0]?.reasons?.length &&
                          submission?.feedback[0]?.reasons?.map((item, index) => (
                            <Label key={index}>{item}</Label>
                          ))}
                      </Stack>
                      <Typography
                        variant="subtitle1"
                        color="text.secondary"
                        sx={{ whiteSpace: 'pre-line' }}
                      >
                        {submission?.feedback[0]?.content}
                      </Typography>
                    </Box>
                  </Alert> */}

                  {/* Button to open Feedback History Modal */}
                  {/* <Button onClick={handleOpenFeedbackModal} variant="outlined" size="small" fullWidth>
                    View Feedback History
                  </Button> */}

                  {/* Feedback History Modal */}
                  <Box mt={2}>
                    {/* <Typography variant="h6">Feedback</Typography> */}
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
                            alt={feedback.user?.name || 'User'}
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
              fullWidth
              maxWidth="md"
              sx={{
                '& .MuiDialog-paper': {
                  p: 0,
                  maxWidth: '80vw', // Match the upload preview width
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
                    Preview Video
                  </Typography>

                  <IconButton
                    onClick={display.onFalse}
                    sx={{
                      ml: 'auto',
                      '& svg': {
                        width: 24,
                        height: 24,
                        color: '#636366',
                      },
                    }}
                  >
                    <Iconify icon="hugeicons:cancel-01" width={24} />
                  </IconButton>
                </Stack>
              </DialogTitle>

              <Box
                sx={{
                  width: '95%',
                  mx: 'auto',
                  borderBottom: '1px solid',
                  borderColor: '#e7e7e7',
                }}
              />

              <DialogContent sx={{ p: 3, position: 'relative' }}>
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  gap={2}
                  sx={{
                    width: '100%',
                    maxWidth: '100%',
                    margin: '0 auto',
                  }}
                >
                  <Box
                    component="video"
                    autoPlay
                    controls
                    sx={{
                      width: '100%',
                      maxHeight: '70vh',
                      borderRadius: 1.5,
                      boxShadow: 'none',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <source src={submission?.content} />
                  </Box>

                  <Box
                    component={Paper}
                    p={2}
                    width="100%"
                    sx={{
                      boxShadow: 'none',
                      border: '1px solid',
                      borderColor: '#e7e7e7',
                      borderRadius: 1.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 0.5, display: 'block' }}
                    >
                      Caption
                    </Typography>
                    <Typography variant="subtitle1">{submission?.caption}</Typography>
                  </Box>
                </Box>
              </DialogContent>
            </Dialog>

            {/* New Upload Modal */}
            <Dialog open={openUploadModal} fullWidth maxWidth="md">
              <DialogTitle
                sx={{
                  bgcolor: '#f4f4f4',
                }}
              >
                <Stack direction="row" alignItems="center" gap={2}>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: 'Instrument Serif, serif',
                        fontSize: { xs: '2rem', sm: '2.4rem' },
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
                        width: 24,
                        height: 24,
                        color: '#636366',
                      },
                    }}
                  >
                    <Iconify icon="hugeicons:cancel-01" width={24} />
                  </IconButton>
                </Stack>
              </DialogTitle>

              <DialogContent
                sx={{
                  bgcolor: '#f4f4f4',
                }}
              >
                <FormProvider methods={methods} onSubmit={onSubmit}>
                  <Stack gap={2}>
                    {localStorage.getItem('preview') ? (
                      <Box sx={{ mt: 0.5 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={2}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: '#e7e7e7',
                            borderRadius: 1.2,
                            bgcolor: '#ffffff',
                            position: 'relative',
                          }}
                        >
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 1.2,
                              overflow: 'hidden',
                              flexShrink: 0,
                              bgcolor: '#f5f5f5',
                              position: 'relative',
                            }}
                          >
                            {methods.watch('draft')?.thumbnail ? (
                              <Box
                                component="img"
                                src={methods.watch('draft').thumbnail}
                                alt="Video thumbnail"
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
                                  color: '#8e8e93',
                                }}
                              >
                                <Iconify icon="solar:video-library-bold" width={24} />
                              </Box>
                            )}
                          </Box>

                          <Box sx={{ flexGrow: 1 }}>
                            <Typography
                              variant="subtitle2"
                              noWrap
                              sx={{
                                color: 'text.primary',
                                fontWeight: 600,
                                fontSize: '1rem',
                                maxWidth: '300px',
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
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Button
                                onClick={() => {
                                  const video = document.createElement('video');
                                  video.src = localStorage.getItem('preview');
                                  video.controls = true;
                                  video.style.cssText = `
                                    max-width: 100%;
                                    border-radius: 8px;
                                  `;

                                  const header = document.createElement('div');
                                  header.style.cssText = `
                                    display: flex;
                                    align-items: center;
                                    gap: 8px;
                                    padding: 16px 24px;
                                  `;

                                  const title = document.createElement('h2');
                                  title.textContent = 'Preview Video';
                                  title.style.cssText = `
                                    font-family: 'Instrument Serif', serif;
                                    font-size: 2rem;
                                    font-weight: 550;
                                    margin: 0;
                                  `;

                                  const closeButton = document.createElement('button');
                                  closeButton.innerHTML = `
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M18 6L6 18M6 6L18 18" stroke="#636366" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                  `;
                                  closeButton.style.cssText = `
                                    margin-left: auto;
                                    background: none;
                                    border: none;
                                    cursor: pointer;
                                    padding: 8px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: #636366;
                                    border-radius: 50%;
                                    transition: background-color 0.2s ease;
                                  `;

                                  closeButton.addEventListener('mouseover', () => {
                                    closeButton.style.backgroundColor = '#f5f5f7';
                                  });

                                  closeButton.addEventListener('mouseout', () => {
                                    closeButton.style.backgroundColor = 'transparent';
                                  });

                                  const divider = document.createElement('div');
                                  divider.style.cssText = `
                                    width: 95%;
                                    margin: 0 auto;
                                    border-bottom: 1px solid #e7e7e7;
                                  `;

                                  const videoContainer = document.createElement('div');
                                  videoContainer.style.cssText = `
                                    padding: 24px;
                                    position: relative;
                                  `;

                                  const dialog = document.createElement('dialog');
                                  dialog.style.cssText = `
                                    padding: 0;
                                    background: white;
                                    border: none;
                                    border-radius: 12px;
                                    max-width: 80vw;
                                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                                  `;

                                  header.appendChild(title);
                                  header.appendChild(closeButton);
                                  videoContainer.appendChild(video);
                                  dialog.appendChild(header);
                                  dialog.appendChild(divider);
                                  dialog.appendChild(videoContainer);
                                  document.body.appendChild(dialog);
                                  dialog.showModal();

                                  const handleClose = () => {
                                    video.pause();
                                    video.currentTime = 0;
                                    video.src = '';
                                    dialog.close();
                                    dialog.remove();
                                  };

                                  closeButton.addEventListener('click', handleClose);

                                  dialog.addEventListener('click', (e) => {
                                    if (e.target === dialog) {
                                      handleClose();
                                    }
                                  });

                                  dialog.addEventListener('cancel', (e) => {
                                    e.preventDefault();
                                    handleClose();
                                  });
                                }}
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
                      </Box>
                    ) : (
                      <RHFUpload
                        name="draft"
                        type="video"
                        onDrop={handleDrop}
                        onRemove={handleRemoveFile}
                      />
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
                        rules={{
                          required: 'Caption is required',
                          validate: (value) => value.trim() !== '' || 'Caption cannot be empty',
                        }}
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
