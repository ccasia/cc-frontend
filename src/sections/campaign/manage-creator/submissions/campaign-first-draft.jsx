/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable jsx-a11y/media-has-caption */
import dayjs from 'dayjs';
import { mutate } from 'swr';
import { create } from 'zustand';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useForm, useFieldArray } from 'react-hook-form';
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
  Tooltip,
  Typography,
  IconButton,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import uuidv4 from 'src/utils/uuidv4';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFUpload, RHFTextField } from 'src/components/hook-form';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

const useDraftProgressData = create((set) => ({
  // draftProgress: { id: '', progress: null },
  draftProgress: [],
  setDraftProgress: (data) => {
    set((state) => ({
      draftProgress: state.draftProgress.some((elem) => elem.id === data.id)
        ? state.draftProgress.map((item) => (item.id === data.id ? { ...item, ...data } : item))
        : [...state.draftProgress, data],
    }));
  },
}));

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
  submissionMutate,
}) => {
  // eslint-disable-next-line no-unused-vars
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoProgress, setVideoProgress] = useState([]);
  const draftProgress = useDraftProgressData((state) => state.draftProgress);
  const setDraftProgress = useDraftProgressData((state) => state.setDraftProgress);

  const dependency = getDependency(submission?.id);
  const { socket } = useSocketContext();
  const [progress, setProgress] = useState(0);
  const [progressName, setProgressName] = useState('');

  const display = useBoolean();
  const { user, dispatch } = useAuthContext();
  const [openUploadModal, setOpenUploadModal] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitStatus, setSubmitStatus] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const inQueue = useBoolean();
  const savedCaption = localStorage.getItem('caption');

  const methods = useForm({
    defaultValues: {
      draft: '',
      drafts: [],
      caption: savedCaption || '',
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
    control,
    reset,
    formState: { isSubmitting, isDirty },
    watch,
  } = methods;

  const { append, remove, fields } = useFieldArray({
    control,
    name: 'drafts',
  });

  const caption = watch('caption');
  const drafts = watch('drafts');

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

        // When video metadata is loaded, set the time to capture thumbnail
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
            // Return the Base64 image URL
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
      acceptedFiles.forEach(async (file) => {
        const newFile = Object.assign(file, {
          preview: URL.createObjectURL(file),
        });

        const metaData = {
          id: uuidv4(),
          name: file.name,
          size: file.size,
        };

        try {
          const thumbnail = await generateThumbnail(newFile);
          newFile.thumbnail = thumbnail;
        } catch (error) {
          console.error('Error generating thumbnail:', error);
        }

        append({ file, data: { ...metaData, ...newFile } });

        // localStorage.setItem('videoInProgress');

        // const formData = new FormData();
        // formData.append('data', JSON.stringify({ submissionId: submission.id }));
        // formData.append('draftVideo', newFile);

        // await axiosInstance.post('/api/uploadDraft', formData, {
        //   headers: {
        //     'Content-Type': 'multipart/form-data',
        //   },
        //   onUploadProgress: (p) => {
        //     console.log(p);
        //   },
        // });

        // setPreview(newFile.preview);
        // localStorage.setItem('preview', newFile.preview);
        // setUploadProgress(0);
      });

      // const file = acceptedFiles[0];

      // const newFile = Object.assign(file, {
      //   preview: URL.createObjectURL(file),
      // });

      // try {
      //   const thumbnail = await generateThumbnail(newFile);
      //   newFile.thumbnail = thumbnail;
      // } catch (error) {
      //   console.error('Error generating thumbnail:', error);
      // }

      // setPreview(newFile.preview);
      // localStorage.setItem('preview', newFile.preview);
      // setUploadProgress(0);

      // if (file) {
      //   setValue('draft', newFile, { shouldValidate: true });

      //   // Simulate upload progress
      //   const interval = setInterval(() => {
      //     setUploadProgress((prev) => {
      //       if (prev >= 100) {
      //         clearInterval(interval);
      //         enqueueSnackbar('Upload complete!', { variant: 'success' });
      //         return 100;
      //       }
      //       return prev + 10;
      //     });
      //   }, 200);
      // }
    },
    [generateThumbnail, append]
  );

  const onSubmit = handleSubmit(async (value) => {
    // setOpenUploadModal(false);
    // setShowSubmitDialog(true);
    // setSubmitStatus('submitting');

    const formData = new FormData();
    const newData = { caption: value.caption, submissionId: submission.id };
    formData.append('data', JSON.stringify(newData));

    value.drafts.forEach((draft) => {
      formData.append('draftVideo', draft.file);
      formData.append('draftData', JSON.stringify({ name: draft.file.path, id: draft.data.id }));
    });

    // formData.append('draftVideo', value.drafts);

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

  const handleCancel = (fileName, index) => {
    if (isProcessing) {
      socket?.emit('cancel-processing', { fileName });
      setVideoProgress((prevData) => prevData.filter((item) => item.fileName !== fileName));
      remove(index);
      setIsProcessing(false);
      setProgress(0);
      localStorage.removeItem('preview');
    } else {
      socket?.emit('cancel-processing', { fileName });
      remove(index);
    }
  };

  const handleCloseSubmitDialog = () => {
    setShowSubmitDialog(false);
    setSubmitStatus('');
  };

  useEffect(() => {
    if (!socket) return; // Early return if socket is not available

    const handleProgress = (data) => {
      const { type, percentage, fileName, submissionId, fileSize } = data;

      console.log(data);

      // if (submission?.id !== data.submissionId) return; // Check if submissionId matches

      // if (data.progress === 100) {
      //   setVideoProgress((prev) => prev.filter((item) => item.fileName !== data.fileName));
      // }

      // setVideoProgress((prevUploads) => {
      //   const existingUpload = prevUploads.find((upload) => upload.fileName === data.fileName);
      //   if (existingUpload) {
      //     return prevUploads.map((upload) =>
      //       upload.fileName === data.fileName ? { ...data } : upload
      //     );
      //   }
      //   return [...prevUploads, data];
      // });

      // setProgress(data.progress);

      // if (data.progress === 100 || data.progress === 0) {
      //   setIsProcessing(false);
      //   // reset();
      //   setPreview('');
      //   setProgressName('');
      //   localStorage.removeItem('preview');

      //   if (data.progress === 100) {
      //     mutate(`${endpoints.submission.root}?creatorId=${user?.id}&campaignId=${campaign?.id}`);
      //   }
      // } else {
      //   setIsProcessing(true);
      // }
    };

    socket.on('processing', handleProgress);
    socket.on('statusQueue', (data) => {
      if (data?.status === 'queue') {
        inQueue.onTrue();
      }
    });

    socket.emit('checkQueue', { submissionId: submission?.id });

    // Cleanup on component unmount
    // eslint-disable-next-line consistent-return
    return () => {
      socket.off('processing', handleProgress);
      socket.off('statusQueue');
      socket.off('checkQueue');
    };
  }, [socket, submission?.id, reset, campaign?.id, user?.id, inQueue]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (videoProgress.length > 0) {
        event.preventDefault();
        event.returnValue = ''; // Required for modern browsers to show the confirmation dialog

        videoProgress.forEach((video) => {
          socket?.emit('cancel-processing', { fileName: video.fileName });
        });
      }
    };

    // Attach the beforeunload event listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [videoProgress, socket]);

  useEffect(() => {
    socket.on('draft-processing', (msg) => {
      setDraftProgress(msg);
    });

    socket.on('draft-uploaded', (msg) => {
      if (msg?.status === 'uploaded') {
        submissionMutate();
        setDraftProgress([]);
        setOpenUploadModal(false);
      }
    });

    return () => {
      socket.off('draft-processing');
      socket.off('draft-uploaded');
    };
  }, [socket, setDraftProgress, submissionMutate]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (draftProgress.length) {
        const confirmationMessage =
          'Are you sure you want to leave? Your changes may not be saved.';
        e.preventDefault();
        e.returnValue = confirmationMessage; // For modern browsers
        return confirmationMessage; // For older browsers
      }
      return null;
    };

    // Attach the event listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [draftProgress]);

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
                {draftProgress.length ? (
                  <>
                    {fields.map((item, index) => {
                      const data = draftProgress.find((elem) => elem.id === item.data.id);

                      return (
                        <Box
                          key={item.id}
                          sx={{
                            bgcolor: '#EBEBEB',
                            borderRadius: 2,
                            p: 2,
                            position: 'relative',
                            boxShadow: 1,
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            <Image
                              src={item.data.thumbnail}
                              width={80}
                              height={80}
                              sx={{ borderRadius: 1 }}
                            />

                            <Stack flexGrow={1} spacing={1}>
                              <ListItemText
                                primary={item.data.name || 'N/A'}
                                secondary={formatFileSize(item.data.size) || 'N/A'}
                                primaryTypographyProps={{ variant: 'subtitle1' }}
                                secondaryTypographyProps={{ variant: 'subtitle2' }}
                              />
                              {!!data && (
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography variant="caption" color="text.secondary">
                                    {data?.status}
                                  </Typography>
                                  {data?.status === 'Done' ? (
                                    <Iconify
                                      icon="material-symbols:done-rounded"
                                      width={24}
                                      color="green"
                                    />
                                  ) : (
                                    <CircularProgress
                                      thickness={5}
                                      size={15}
                                      sx={{
                                        color: (theme) => theme.palette.grey[600],
                                        strokeLinecap: 'round',
                                      }}
                                    />
                                  )}
                                </Stack>
                              )}
                              {/* {draftProgress.some((data) => data.id === item.data.id) &&
              (draftProgress.find((elem) => elem.id === item.data.id)?.status !==
              'Done' ? (
                <Stack direction="row" alignItems="center" spacing={2}>
                  <LinearProgress
                    variant="determinate"
                    value={
                      draftProgress.find((elem) => elem.id === item.data.id)
                        .progress || 0
                    }
                    color="primary"
                    sx={{
                      height: 8,
                      width: 1,
                    }}
                  />
                  <Typography variant="subtitle2" color="text.secondary">
                    {Math.round(
                      draftProgress.find((elem) => elem.id === item.data.id).progress
                    )}
                    %
                  </Typography>
                </Stack>
              ) : (
                <Iconify
                  icon="material-symbols:done-rounded"
                  width={24}
                  color="green"
                />
              ))} */}
                              {/* {videoProgress.find((val) => val.fileName === item.data.name) && (
              <Stack direction="row" alignItems="center" spacing={2}>
                <LinearProgress
                  variant="determinate"
                  value={
                    videoProgress.find((val) => val.fileName === item.data.name)
                      ?.progress || 0
                  }
                  color="primary"
                  sx={{
                    height: 8,
                    width: 1,
                  }}
                />
                <Typography variant="subtitle2" color="text.secondary">
                  {Math.round(
                    videoProgress.find((val) => val.fileName === item.data.name)
                      ?.progress
                  )}
                  %
                </Typography>
              </Stack>
            )} */}
                            </Stack>

                            <Button
                              onClick={() => {
                                setPreview(item.file.preview);
                                display.onTrue();
                              }}
                              variant="contained"
                              color="primary"
                              sx={{
                                mr: 5,
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
                          </Stack>
                          <Tooltip title="Remove">
                            <IconButton
                              sx={{ position: 'absolute', top: 10, right: 10 }}
                              onClick={() => {
                                handleCancel(item.data.name, index);
                              }}
                            >
                              <Iconify icon="iconoir:cancel" width={20} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      );
                    })}
                  </>
                ) : (
                  // <Stack spacing={1}>
                  //   {fields.map((item, index) => (
                  //     <Box
                  //       key={item.id}
                  //       sx={{
                  //         bgcolor: '#EBEBEB',
                  //         borderRadius: 2,
                  //         p: 2,
                  //         position: 'relative',
                  //         boxShadow: 1,
                  //       }}
                  //     >
                  //       <Stack direction="row" spacing={2} alignItems="center">
                  //         <Image
                  //           src={item.data.thumbnail}
                  //           width={80}
                  //           height={80}
                  //           sx={{ borderRadius: 1 }}
                  //         />

                  //         <Stack flexGrow={1} spacing={1}>
                  //           <ListItemText
                  //             primary={item.data.name || 'N/A'}
                  //             secondary={formatFileSize(item.data.size) || 'N/A'}
                  //             primaryTypographyProps={{ variant: 'subtitle1' }}
                  //             secondaryTypographyProps={{ variant: 'subtitle2' }}
                  //           />
                  //           {videoProgress.find((val) => val.fileName === item.data.name) && (
                  //             <Stack direction="row" alignItems="center" spacing={2}>
                  //               <LinearProgress
                  //                 variant="determinate"
                  //                 value={
                  //                   videoProgress.find((val) => val.fileName === item.data.name)
                  //                     ?.progress || 0
                  //                 }
                  //                 color="primary"
                  //                 sx={{
                  //                   height: 8,
                  //                   width: 1,
                  //                 }}
                  //               />
                  //               <Typography variant="subtitle2" color="text.secondary">
                  //                 {Math.round(
                  //                   videoProgress.find((val) => val.fileName === item.data.name)
                  //                     ?.progress
                  //                 )}
                  //                 %
                  //               </Typography>
                  //             </Stack>
                  //           )}
                  //         </Stack>
                  //       </Stack>
                  //       <IconButton
                  //         sx={{ position: 'absolute', top: 10, right: 10 }}
                  //         onClick={() => {
                  //           handleCancel(item.data.name, index);
                  //         }}
                  //       >
                  //         <Iconify icon="iconoir:cancel" width={20} />
                  //       </IconButton>
                  //     </Box>
                  //   ))}
                  // </Stack>
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
                        {isProcessing ? (
                          <Typography>Proceessin...</Typography>
                        ) : (
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
                        )}
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

            {submission?.status === 'ON_HOLD' && (
              <Stack spacing={1}>
                {fields.map((item, index) => {
                  const data = draftProgress.find((elem) => elem.id === item.data.id);
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        bgcolor: '#EBEBEB',
                        borderRadius: 2,
                        p: 2,
                        position: 'relative',
                        boxShadow: 1,
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                        <Image
                          src={item.data.thumbnail}
                          width={80}
                          height={80}
                          sx={{ borderRadius: 1 }}
                        />

                        <Stack flexGrow={1} spacing={1}>
                          <ListItemText
                            primary={item.data.name || 'N/A'}
                            secondary={formatFileSize(item.data.size) || 'N/A'}
                            primaryTypographyProps={{ variant: 'subtitle1' }}
                            secondaryTypographyProps={{ variant: 'subtitle2' }}
                          />
                          {!!data && (
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="caption" color="text.secondary">
                                {data?.status}
                              </Typography>
                              {data?.status === 'Done' ? (
                                <Iconify
                                  icon="material-symbols:done-rounded"
                                  width={24}
                                  color="green"
                                />
                              ) : (
                                <CircularProgress
                                  thickness={5}
                                  size={15}
                                  sx={{
                                    color: (theme) => theme.palette.grey[600],
                                    strokeLinecap: 'round',
                                  }}
                                />
                              )}
                            </Stack>
                          )}
                          {/* {draftProgress.some((data) => data.id === item.data.id) &&
              (draftProgress.find((elem) => elem.id === item.data.id)?.status !==
              'Done' ? (
                <Stack direction="row" alignItems="center" spacing={2}>
                  <LinearProgress
                    variant="determinate"
                    value={
                      draftProgress.find((elem) => elem.id === item.data.id)
                        .progress || 0
                    }
                    color="primary"
                    sx={{
                      height: 8,
                      width: 1,
                    }}
                  />
                  <Typography variant="subtitle2" color="text.secondary">
                    {Math.round(
                      draftProgress.find((elem) => elem.id === item.data.id).progress
                    )}
                    %
                  </Typography>
                </Stack>
              ) : (
                <Iconify
                  icon="material-symbols:done-rounded"
                  width={24}
                  color="green"
                />
              ))} */}
                          {/* {videoProgress.find((val) => val.fileName === item.data.name) && (
              <Stack direction="row" alignItems="center" spacing={2}>
                <LinearProgress
                  variant="determinate"
                  value={
                    videoProgress.find((val) => val.fileName === item.data.name)
                      ?.progress || 0
                  }
                  color="primary"
                  sx={{
                    height: 8,
                    width: 1,
                  }}
                />
                <Typography variant="subtitle2" color="text.secondary">
                  {Math.round(
                    videoProgress.find((val) => val.fileName === item.data.name)
                      ?.progress
                  )}
                  %
                </Typography>
              </Stack>
            )} */}
                        </Stack>

                        <Button
                          onClick={() => {
                            setPreview(item.file.preview);
                            display.onTrue();
                          }}
                          variant="contained"
                          color="primary"
                          sx={{
                            mr: 5,
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
                      </Stack>
                      <Tooltip title="Remove">
                        <IconButton
                          sx={{ position: 'absolute', top: 10, right: 10 }}
                          onClick={() => {
                            handleCancel(item.data.name, index);
                          }}
                        >
                          <Iconify icon="iconoir:cancel" width={20} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  );
                })}
              </Stack>
            )}
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
            }}
          />

          <DialogContent sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Box
                component="video"
                autoPlay
                controls
                sx={{
                  width: '100%',
                  maxHeight: '60vh',
                  borderRadius: 1,
                  bgcolor: 'background.neutral',
                }}
              >
                <source src={preview || ''} />
              </Box>

              {/* {submission?.caption && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: 'background.neutral',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    Caption
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.primary',
                      lineHeight: 1.6,
                    }}
                  >
                    {submission?.caption}
                  </Typography>
                </Box>
              )} */}
            </Stack>
          </DialogContent>
        </Dialog>

        {/* New Upload Modal */}
        <Dialog open={openUploadModal} fullWidth maxWidth="md">
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
                disabled={draftProgress.length}
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
                            src={methods.getValues('draft')?.thumbnail}
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
                              {methods.watch('draft')?.name}
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
                  ) : (
                  )} */}
                  <RHFUpload
                    preview={false}
                    multiple
                    name="drafts"
                    type="video"
                    onDrop={handleDrop}
                    onRemove={handleRemoveFile}
                  />
                </Box>

                {/* To display all uploaded draft videos */}
                <Stack spacing={1}>
                  {fields.map((item, index) => {
                    const data = draftProgress.find((elem) => elem.id === item.data.id);

                    return (
                      <Box
                        key={item.id}
                        sx={{
                          bgcolor: '#EBEBEB',
                          borderRadius: 2,
                          p: 2,
                          position: 'relative',
                          boxShadow: 1,
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                          <Image
                            src={item.data.thumbnail}
                            width={80}
                            height={80}
                            sx={{ borderRadius: 1 }}
                          />

                          <Stack flexGrow={1} spacing={1}>
                            <ListItemText
                              primary={item.data.name || 'N/A'}
                              secondary={formatFileSize(item.data.size) || 'N/A'}
                              primaryTypographyProps={{ variant: 'subtitle1' }}
                              secondaryTypographyProps={{ variant: 'subtitle2' }}
                            />
                            {!!data && (
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="caption" color="text.secondary">
                                  {data?.status}
                                </Typography>
                                {data?.status === 'Done' ? (
                                  <Iconify
                                    icon="material-symbols:done-rounded"
                                    width={24}
                                    color="green"
                                  />
                                ) : (
                                  <CircularProgress
                                    thickness={5}
                                    size={15}
                                    sx={{
                                      color: (theme) => theme.palette.grey[600],
                                      strokeLinecap: 'round',
                                    }}
                                  />
                                )}
                              </Stack>
                            )}
                            {/* {draftProgress.some((data) => data.id === item.data.id) &&
              (draftProgress.find((elem) => elem.id === item.data.id)?.status !==
              'Done' ? (
                <Stack direction="row" alignItems="center" spacing={2}>
                  <LinearProgress
                    variant="determinate"
                    value={
                      draftProgress.find((elem) => elem.id === item.data.id)
                        .progress || 0
                    }
                    color="primary"
                    sx={{
                      height: 8,
                      width: 1,
                    }}
                  />
                  <Typography variant="subtitle2" color="text.secondary">
                    {Math.round(
                      draftProgress.find((elem) => elem.id === item.data.id).progress
                    )}
                    %
                  </Typography>
                </Stack>
              ) : (
                <Iconify
                  icon="material-symbols:done-rounded"
                  width={24}
                  color="green"
                />
              ))} */}
                            {/* {videoProgress.find((val) => val.fileName === item.data.name) && (
              <Stack direction="row" alignItems="center" spacing={2}>
                <LinearProgress
                  variant="determinate"
                  value={
                    videoProgress.find((val) => val.fileName === item.data.name)
                      ?.progress || 0
                  }
                  color="primary"
                  sx={{
                    height: 8,
                    width: 1,
                  }}
                />
                <Typography variant="subtitle2" color="text.secondary">
                  {Math.round(
                    videoProgress.find((val) => val.fileName === item.data.name)
                      ?.progress
                  )}
                  %
                </Typography>
              </Stack>
            )} */}
                          </Stack>

                          <Button
                            onClick={() => {
                              setPreview(item.file.preview);
                              display.onTrue();
                            }}
                            variant="contained"
                            color="primary"
                            sx={{
                              mr: 5,
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
                        </Stack>
                        <Tooltip title="Remove">
                          <IconButton
                            sx={{ position: 'absolute', top: 10, right: 10 }}
                            onClick={() => {
                              handleCancel(item.data.name, index);
                            }}
                          >
                            <Iconify icon="iconoir:cancel" width={20} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    );
                  })}
                </Stack>

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
              loading={isSubmitting || isProcessing}
              variant="contained"
              onClick={onSubmit}
              disabled={!isDirty || draftProgress.length}
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
  submissionMutate: PropTypes.func,
};
