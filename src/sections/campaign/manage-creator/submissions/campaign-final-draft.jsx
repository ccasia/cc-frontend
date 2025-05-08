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
  Tab,
  Chip,
  Tabs,
  Stack,
  Paper,
  alpha,
  Button,
  Dialog,
  Avatar,
  Select,
  Divider,
  useTheme,
  Collapse,
  MenuItem,
  Typography,
  IconButton,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  useMediaQuery,
  LinearProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

import UploadPhotoModal from './components/photo';
import UploadDraftVideoModal from './components/draft-video';
import UploadRawFootageModal from './components/raw-footage';
import { FinalDraftFileTypeModal } from './components/filetype-modal';

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
  const [collapseOpen, setCollapseOpen] = useState({});
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [selectedRawFootageIndex, setSelectedRawFootageIndex] = useState(0);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

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

  const previousSubmission = useMemo(
    () => fullSubmission?.find((item) => item?.id === dependency?.dependentSubmissionId),
    [fullSubmission, dependency]
  );

  const feedbacksTesting = useMemo(() => {
    const currentFeedbacks =
      (submission.feedback.length && submission.feedback) ||
      (previousSubmission.feedback.length && previousSubmission.feedback);

    return currentFeedbacks
      .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)))
      .map((item) => {
        const photoFeedbacks = item?.photosToUpdate?.length || null;
        const videoFeedbacks = item?.videosToUpdate?.length || null;
        const rawFootageFeedbacks = item?.rawFootageToUpdate?.length || null;

        const changes = [];

        if (photoFeedbacks) {
          changes.push({ content: item.photoContent, changes: item.photosToUpdate, type: 'photo' });
        }

        if (videoFeedbacks) {
          changes.push({
            content: item.content,
            changes: item.videosToUpdate,
            type: 'video',
            reasons: item?.reasons,
          });
        }

        if (rawFootageFeedbacks) {
          changes.push({
            content: item.rawFootageContent,
            changes: item.rawFootageToUpdate,
            type: 'rawFootage',
          });
        }

        return {
          adminName: item?.admin?.name,
          role: item?.admin?.role,
          changes: changes || null,
          reasons: item?.reasons?.length ? item?.reasons : null,
          createdAt: item?.createdAt,
        };
      })[0];
  }, [submission, previousSubmission]);

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
    const options = [{ value: 0, label: 'Draft Videos', icon: 'solar:video-library-bold' }];

    if (deliverables?.rawFootages?.length > 0) {
      options.push({ value: 1, label: 'Raw Footage', icon: 'solar:camera-bold' });
    }

    if (submission?.photos?.length > 0) {
      options.push({
        value: deliverables?.rawFootages?.length > 0 ? 2 : 1,
        label: 'Photos',
        icon: 'solar:gallery-wide-bold',
      });
    }

    if (submission?.caption) {
      options.push({
        value: getTabIndex('caption'),
        label: 'Caption',
        icon: 'solar:document-text-bold',
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
                    ? !!feedbacksTesting && (
                        <Box
                          component="div"
                          mb={2}
                          p={2}
                          border={1}
                          borderColor="grey.300"
                          borderRadius={1}
                          display="flex"
                          alignItems="flex-start"
                          sx={{
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setCollapseOpen((prev) => !prev);
                          }}
                          position="relative"
                        >
                          {/* Handle icon */}
                          <Box sx={{ position: 'absolute', top: 5, right: 10 }}>
                            {collapseOpen ? (
                              <Iconify
                                icon="iconamoon:arrow-up-2-bold"
                                width={20}
                                color="text.secondary"
                              />
                            ) : (
                              <Iconify
                                icon="iconamoon:arrow-down-2-bold"
                                width={20}
                                color="text.secondary"
                              />
                            )}
                          </Box>
                          <Avatar
                            src="/default-avatar.png"
                            alt={feedbacksTesting?.adminName || 'User'}
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
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Box>
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 'bold', marginBottom: '2px' }}
                                >
                                  {feedbacksTesting.adminName || 'Unknown User'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {feedbacksTesting.role || 'No Role'}
                                </Typography>
                              </Box>
                              <Chip
                                label="REVISION REQUESTED"
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
                            <Collapse in={collapseOpen} timeout="auto" unmountOnExit>
                              <Box sx={{ textAlign: 'left', mt: 1 }}>
                                {!!feedbacksTesting.changes.length &&
                                  feedbacksTesting.changes.map((item) => (
                                    <>
                                      {item?.type === 'video' && !!item.changes?.length && (
                                        <Box mt={2}>
                                          {item?.content?.split('\n').map((line, i) => (
                                            <Typography
                                              key={i}
                                              variant="subtitle2"
                                              color="text.secondary"
                                            >
                                              Comment: {line}
                                            </Typography>
                                          ))}
                                          <Typography
                                            variant="subtitle2"
                                            color="warning.darker"
                                            sx={{ mb: 1 }}
                                          >
                                            Videos that need changes:
                                          </Typography>
                                          <Box
                                            sx={{
                                              display: 'grid',
                                              gridTemplateColumns: {
                                                xs: 'repeat(1,1fr)',
                                                sm: 'repeat(2,1fr)',
                                              },
                                              gap: 2,
                                            }}
                                          >
                                            {deliverables.videos
                                              .filter((video) => item.changes.includes(video.id))
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

                                                      {!!item.reasons.length && (
                                                        <Stack
                                                          direction="row"
                                                          spacing={0.5}
                                                          flexWrap="wrap"
                                                        >
                                                          {item.reasons.map((reason, idx) => (
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
                                          </Box>
                                        </Box>
                                      )}

                                      {item?.type === 'photo' && !!item.changes?.length && (
                                        <Box mt={2}>
                                          {item?.content?.split('\n').map((line, i) => (
                                            <Typography
                                              key={i}
                                              variant="subtitle2"
                                              color="text.secondary"
                                            >
                                              Comment: {line}
                                            </Typography>
                                          ))}
                                          <Typography
                                            variant="subtitle2"
                                            color="warning.darker"
                                            sx={{ mb: 1 }}
                                          >
                                            Photos that need changes:
                                          </Typography>
                                          <Box
                                            sx={{
                                              display: 'grid',
                                              gridTemplateColumns: {
                                                xs: 'repeat(1,1fr)',
                                                sm: 'repeat(2,1fr)',
                                              },
                                              gap: 2,
                                            }}
                                          >
                                            {deliverables.photos
                                              .filter((photo) => item.changes.includes(photo.id))
                                              .map((photo, photoIndex) => (
                                                <Box
                                                  key={photo.id}
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
                                                          Photo {photoIndex + 1}
                                                        </Typography>
                                                        <Typography
                                                          variant="caption"
                                                          color="warning.darker"
                                                          sx={{ opacity: 0.8 }}
                                                        >
                                                          Requires changes
                                                        </Typography>
                                                      </Box>
                                                    </Stack>
                                                    <Image
                                                      src={photo.url}
                                                      sx={{
                                                        height: 200,
                                                        borderRadius: 1.5,
                                                      }}
                                                    />
                                                  </Stack>
                                                </Box>
                                              ))}
                                          </Box>
                                        </Box>
                                      )}

                                      {item?.type === 'rawFootage' && !!item.changes?.length && (
                                        <Box mt={2}>
                                          {item?.content?.split('\n').map((line, i) => (
                                            <Typography
                                              key={i}
                                              variant="subtitle2"
                                              color="text.secondary"
                                            >
                                              Comment: {line}
                                            </Typography>
                                          ))}
                                          <Typography
                                            variant="subtitle2"
                                            color="warning.darker"
                                            sx={{ mb: 1 }}
                                          >
                                            Videos that need changes:
                                          </Typography>
                                          <Box
                                            sx={{
                                              display: 'grid',
                                              gridTemplateColumns: {
                                                xs: 'repeat(1,1fr)',
                                                sm: 'repeat(2,1fr)',
                                              },
                                              gap: 2,
                                            }}
                                          >
                                            {deliverables.rawFootages
                                              .filter((video) => item.changes.includes(video.id))
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

                                                      {!!item.reasons?.length && (
                                                        <Stack
                                                          direction="row"
                                                          spacing={0.5}
                                                          flexWrap="wrap"
                                                        >
                                                          {item.reasons.map((reason, idx) => (
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
                                          </Box>
                                        </Box>
                                      )}

                                      <Divider sx={{ my: 2 }} />
                                    </>
                                  ))}
                              </Box>
                            </Collapse>
                          </Box>
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
                  {!!feedbacksTesting && (
                    <Box
                      component="div"
                      mb={2}
                      p={2}
                      border={1}
                      borderColor="grey.300"
                      borderRadius={1}
                      display="flex"
                      alignItems="flex-start"
                      sx={{
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setCollapseOpen((prev) => !prev);
                      }}
                      position="relative"
                    >
                      {/* Handle icon */}
                      <Box sx={{ position: 'absolute', top: 5, right: 10 }}>
                        {collapseOpen ? (
                          <Iconify
                            icon="iconamoon:arrow-up-2-bold"
                            width={20}
                            color="text.secondary"
                          />
                        ) : (
                          <Iconify
                            icon="iconamoon:arrow-down-2-bold"
                            width={20}
                            color="text.secondary"
                          />
                        )}
                      </Box>
                      <Avatar
                        src="/default-avatar.png"
                        alt={feedbacksTesting?.adminName || 'User'}
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
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 'bold', marginBottom: '2px' }}
                            >
                              {feedbacksTesting.adminName || 'Unknown User'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {feedbacksTesting.role || 'No Role'}
                            </Typography>
                          </Box>
                          <Chip
                            label="REVISION REQUESTED"
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
                        <Collapse in={collapseOpen} timeout="auto" unmountOnExit>
                          <Box sx={{ textAlign: 'left', mt: 1 }}>
                            {!!feedbacksTesting.changes.length &&
                              feedbacksTesting.changes.map((item) => (
                                <>
                                  {item?.type === 'video' && !!item.changes?.length && (
                                    <Box mt={2}>
                                      {item?.content?.split('\n').map((line, i) => (
                                        <Typography
                                          key={i}
                                          variant="subtitle2"
                                          color="text.secondary"
                                        >
                                          Comment: {line}
                                        </Typography>
                                      ))}
                                      <Typography
                                        variant="subtitle2"
                                        color="warning.darker"
                                        sx={{ mb: 1 }}
                                      >
                                        Videos that need changes:
                                      </Typography>
                                      <Box
                                        sx={{
                                          display: 'grid',
                                          gridTemplateColumns: {
                                            xs: 'repeat(1,1fr)',
                                            sm: 'repeat(2,1fr)',
                                          },
                                          gap: 2,
                                        }}
                                      >
                                        {deliverables.videos
                                          .filter((video) => item.changes.includes(video.id))
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

                                                  {!!item.reasons.length && (
                                                    <Stack
                                                      direction="row"
                                                      spacing={0.5}
                                                      flexWrap="wrap"
                                                    >
                                                      {item.reasons.map((reason, idx) => (
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
                                      </Box>
                                    </Box>
                                  )}

                                  {item?.type === 'photo' && !!item.changes?.length && (
                                    <Box mt={2}>
                                      {item?.content?.split('\n').map((line, i) => (
                                        <Typography
                                          key={i}
                                          variant="subtitle2"
                                          color="text.secondary"
                                        >
                                          Comment: {line}
                                        </Typography>
                                      ))}
                                      <Typography
                                        variant="subtitle2"
                                        color="warning.darker"
                                        sx={{ mb: 1 }}
                                      >
                                        Photos that need changes:
                                      </Typography>
                                      <Box
                                        sx={{
                                          display: 'grid',
                                          gridTemplateColumns: {
                                            xs: 'repeat(1,1fr)',
                                            sm: 'repeat(2,1fr)',
                                          },
                                          gap: 2,
                                        }}
                                      >
                                        {deliverables.photos
                                          .filter((photo) => item.changes.includes(photo.id))
                                          .map((photo, photoIndex) => (
                                            <Box
                                              key={photo.id}
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
                                                      Photo {photoIndex + 1}
                                                    </Typography>
                                                    <Typography
                                                      variant="caption"
                                                      color="warning.darker"
                                                      sx={{ opacity: 0.8 }}
                                                    >
                                                      Requires changes
                                                    </Typography>
                                                  </Box>
                                                </Stack>
                                                <Image
                                                  src={photo.url}
                                                  sx={{
                                                    height: 200,
                                                    borderRadius: 1.5,
                                                  }}
                                                />
                                              </Stack>
                                            </Box>
                                          ))}
                                      </Box>
                                    </Box>
                                  )}

                                  {item?.type === 'rawFootage' && !!item.changes?.length && (
                                    <Box mt={2}>
                                      {item?.content?.split('\n').map((line, i) => (
                                        <Typography
                                          key={i}
                                          variant="subtitle2"
                                          color="text.secondary"
                                        >
                                          Comment: {line}
                                        </Typography>
                                      ))}
                                      <Typography
                                        variant="subtitle2"
                                        color="warning.darker"
                                        sx={{ mb: 1 }}
                                      >
                                        Videos that need changes:
                                      </Typography>
                                      <Box
                                        sx={{
                                          display: 'grid',
                                          gridTemplateColumns: {
                                            xs: 'repeat(1,1fr)',
                                            sm: 'repeat(2,1fr)',
                                          },
                                          gap: 2,
                                        }}
                                      >
                                        {deliverables.rawFootages
                                          .filter((video) => item.changes.includes(video.id))
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

                                                  {!!item.reasons?.length && (
                                                    <Stack
                                                      direction="row"
                                                      spacing={0.5}
                                                      flexWrap="wrap"
                                                    >
                                                      {item.reasons.map((reason, idx) => (
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
                                      </Box>
                                    </Box>
                                  )}

                                  <Divider sx={{ my: 2 }} />
                                </>
                              ))}
                          </Box>
                        </Collapse>
                      </Box>
                    </Box>
                  )}

                  <Box
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      mb: 2,
                      mx: -1.5,
                    }}
                  />

                  {!uploadProgress.length && (
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
                  )}
                </Box>
              </Stack>
            ) : (
              <Stack spacing={2}>
                {!uploadProgress.length && (
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
                          {/* <VisibilityIcon sx={{ color: 'white', fontSize: 32 }} /> */}
                        </Box>
                      </Box>
                    </Box>

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
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.4rem' },
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
              p: { xs: 1.5, sm: 2.5 },
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
            {/* Mobile Dropdown */}
            <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>
              <FormControl fullWidth variant="outlined" size="small" sx={{ mt: 1 }}>
                <InputLabel id="mobile-tab-select-label">Select Content</InputLabel>
                <Select
                  labelId="mobile-tab-select-label"
                  id="mobile-tab-select"
                  value={tabIndex}
                  onChange={(e) => setTabIndex(e.target.value)}
                  label="Select Content"
                  sx={{
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    },
                  }}
                >
                  {getTabOptions().map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Iconify icon={option.icon} width={20} />
                        <Typography>{option.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Desktop Layout */}
            <Box
              sx={{
                display: 'flex',
                height: { xs: 'auto', sm: '100%' },
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              {/* Left Side Tabs */}
              <Box
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  width: '200px',
                  minWidth: '200px',
                  borderRight: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Tabs
                  orientation="vertical"
                  value={tabIndex}
                  onChange={(_, newValue) => setTabIndex(newValue)}
                  sx={{
                    '& .MuiTabs-indicator': {
                      left: 0,
                      right: 'auto',
                      width: 3,
                      borderRadius: 0,
                      backgroundColor: '#1340FF',
                    },
                    '& .MuiTab-root': {
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      py: 2,
                      px: 2,
                      minHeight: 'auto',
                      fontWeight: 600,
                      transition: 'all 0.2s ease-in-out',
                      borderTopLeftRadius: 1,
                      borderBottomLeftRadius: 1,
                      width: '100%',
                      '&.Mui-selected': {
                        backgroundColor: alpha('#1340FF', 0.08),
                        color: '#1340FF',
                      },
                    },
                  }}
                >
                  <Tab
                    label="Draft Videos"
                    icon={<Iconify icon="solar:video-library-bold" width={20} />}
                    iconPosition="start"
                    sx={{
                      opacity: 1,
                      color: tabIndex === 0 ? '#1340FF' : 'text.secondary',
                      '&.Mui-selected': { color: '#1340FF' },
                    }}
                  />

                  {deliverables?.rawFootages?.length > 0 && (
                    <Tab
                      label="Raw Footage"
                      icon={<Iconify icon="solar:camera-bold" width={20} />}
                      iconPosition="start"
                      sx={{
                        opacity: 1,
                        color: tabIndex === 1 ? '#1340FF' : 'text.secondary',
                        '&.Mui-selected': { color: '#1340FF' },
                      }}
                    />
                  )}

                  {submission?.photos?.length > 0 && (
                    <Tab
                      label="Photos"
                      icon={<Iconify icon="solar:gallery-wide-bold" width={20} />}
                      iconPosition="start"
                      sx={{
                        opacity: 1,
                        color:
                          tabIndex === (deliverables?.rawFootages?.length > 0 ? 2 : 1)
                            ? '#1340FF'
                            : 'text.secondary',
                        '&.Mui-selected': { color: '#1340FF' },
                      }}
                    />
                  )}

                  {submission?.caption && (
                    <Tab
                      label="Caption"
                      icon={<Iconify icon="solar:document-text-bold" width={20} />}
                      iconPosition="start"
                      sx={{
                        opacity: 1,
                        color: tabIndex === getTabIndex('caption') ? '#1340FF' : 'text.secondary',
                        '&.Mui-selected': { color: '#1340FF' },
                      }}
                    />
                  )}
                </Tabs>
              </Box>

              {/* Right Side Content */}
              <Box
                sx={{
                  flexGrow: 1,
                  pl: { xs: 0, sm: 3 },
                  overflow: 'auto',
                  width: '100%',
                }}
              >
                {/* Draft Videos Content */}
                {tabIndex === 0 && (
                  <Box sx={{ width: '100%' }}>
                    {/* Large preview area */}
                    <Box sx={{ mb: 3 }}>
                      {(campaign?.campaignCredits && deliverables?.videos?.length > 0
                        ? deliverables.videos
                        : [{ url: submission?.content }]
                      ).map(
                        (videoItem, index) =>
                          index === selectedVideoIndex && (
                            <Box
                              key={`large-${videoItem.id || index}`}
                              sx={{
                                position: 'relative',
                                width: '100%',
                                height: 0,
                                paddingTop: { xs: '75%', sm: 'min(450px, 56.25%)' },
                                bgcolor: 'black',
                                borderRadius: 2,
                                mb: 2,
                                overflow: 'hidden',
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
                          )
                      )}
                    </Box>

                    {/* Thumbnails */}
                    {(campaign?.campaignCredits && deliverables?.videos?.length > 0
                      ? deliverables.videos
                      : [{ url: submission?.content }]
                    ).length > 1 && (
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 1.5,
                          justifyContent: { xs: 'center', sm: 'flex-start' },
                        }}
                      >
                        {(campaign?.campaignCredits && deliverables?.videos?.length > 0
                          ? deliverables.videos
                          : [{ url: submission?.content }]
                        ).map((videoItem, index) => (
                          <Box
                            key={`thumb-${videoItem.id || index}`}
                            onClick={() => setSelectedVideoIndex(index)}
                            sx={{
                              position: 'relative',
                              width: { xs: '100px', sm: '120px' },
                              height: { xs: '56px', sm: '68px' },
                              bgcolor: 'black',
                              borderRadius: 1,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: selectedVideoIndex === index ? '2px solid' : 'none',
                              borderColor: 'primary.main',
                            }}
                          >
                            <Box
                              component="video"
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            >
                              <source src={videoItem.url} />
                            </Box>
                            <Box
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: 'white',
                                opacity: 0.8,
                              }}
                            >
                              <Iconify icon="material-symbols:play-circle" width={28} />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                {/* Raw Footage Content */}
                {tabIndex === 1 && deliverables?.rawFootages?.length > 0 && (
                  <Box sx={{ width: '100%' }}>
                    {/* Large preview area */}
                    <Box sx={{ mb: 3 }}>
                      {deliverables?.rawFootages.map(
                        (footage, index) =>
                          index === selectedRawFootageIndex && (
                            <Box
                              key={`large-footage-${footage.id || index}`}
                              sx={{
                                position: 'relative',
                                width: '100%',
                                height: 0,
                                paddingTop: { xs: '75%', sm: 'min(450px, 56.25%)' },
                                bgcolor: 'black',
                                borderRadius: 2,
                                mb: 2,
                                overflow: 'hidden',
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
                          )
                      )}
                    </Box>

                    {/* Thumbnails */}
                    {deliverables?.rawFootages.length > 1 && (
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 1.5,
                          justifyContent: { xs: 'center', sm: 'flex-start' },
                        }}
                      >
                        {deliverables?.rawFootages.map((footage, index) => (
                          <Box
                            key={`thumb-footage-${footage.id || index}`}
                            onClick={() => setSelectedRawFootageIndex(index)}
                            sx={{
                              position: 'relative',
                              width: { xs: '100px', sm: '120px' },
                              height: { xs: '56px', sm: '68px' },
                              bgcolor: 'black',
                              borderRadius: 1,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: selectedRawFootageIndex === index ? '2px solid' : 'none',
                              borderColor: 'primary.main',
                            }}
                          >
                            <Box
                              component="video"
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            >
                              <source src={footage.url} />
                            </Box>
                            <Box
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: 'white',
                                opacity: 0.8,
                              }}
                            >
                              <Iconify icon="material-symbols:play-circle" width={28} />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                {/* Photos Content */}
                {tabIndex === (deliverables?.rawFootages?.length > 0 ? 2 : 1) &&
                  submission?.photos?.length > 0 && (
                    <Box sx={{ width: '100%' }}>
                      {/* Large preview area */}
                      <Box sx={{ mb: 3 }}>
                        {submission.photos.map(
                          (photo, index) =>
                            index === selectedPhotoIndex && (
                              <Box
                                key={`large-photo-${photo.id || index}`}
                                sx={{
                                  width: '100%',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  mb: 2,
                                }}
                              >
                                <Box
                                  component="img"
                                  src={photo.url}
                                  alt={`Photo ${index + 1}`}
                                  sx={{
                                    maxWidth: '100%',
                                    maxHeight: { xs: '300px', sm: '450px' },
                                    borderRadius: 2,
                                    objectFit: 'contain',
                                  }}
                                />
                              </Box>
                            )
                        )}
                      </Box>

                      {/* Thumbnails */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 1.5,
                          justifyContent: { xs: 'center', sm: 'flex-start' },
                        }}
                      >
                        {submission.photos.map((photo, index) => (
                          <Box
                            key={`thumb-photo-${photo.id || index}`}
                            onClick={() => setSelectedPhotoIndex(index)}
                            sx={{
                              width: { xs: '80px', sm: '100px' },
                              height: { xs: '80px', sm: '100px' },
                              borderRadius: 1.5,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: selectedPhotoIndex === index ? '2px solid' : 'none',
                              borderColor: 'primary.main',
                            }}
                          >
                            <Box
                              component="img"
                              src={photo.url}
                              alt={`Thumbnail ${index + 1}`}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                {/* Caption Content */}
                {tabIndex === getTabIndex('caption') && submission?.caption && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'background.neutral',
                      width: '100%',
                    }}
                  >
                    <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.8 }}>
                      {submission?.caption}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
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
