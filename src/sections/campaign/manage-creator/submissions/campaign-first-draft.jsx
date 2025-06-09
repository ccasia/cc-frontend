/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable jsx-a11y/media-has-caption */
import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

// import Accordion from '@mui/material/Accordion';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import AccordionSummary from '@mui/material/AccordionSummary';
// import AccordionDetails from '@mui/material/AccordionDetails';
import { grey } from '@mui/material/colors';
// import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
  Chip,
  Stack,
  alpha,
  Button,
  Dialog,
  Avatar,
  Tooltip,
  Typography,
  IconButton,
  ListItemText,
  DialogContent,
  DialogActions,
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
import { FirstDraftFileTypeModal } from './components/filetype-modal';
import {
  VideoModal,
  PhotoModal,
} from '../../discover/admin/creator-stuff/submissions/firstDraft/media-modals';

const truncateText = (text, maxLength) =>
  text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

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
    }, []);

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
  deliverablesData,
}) => {
  // eslint-disable-next-line no-unused-vars
  const [preview, setPreview] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  // const [loading, setLoading] = useState(false);
  const dependency = getDependency(submission?.id);
  const { socket } = useSocketContext();
  const [progress, setProgress] = useState(0);

  const display = useBoolean();
  const { user, dispatch } = useAuthContext();

  const [submitStatus, setSubmitStatus] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const inQueue = useBoolean();
  const savedCaption = localStorage.getItem('caption');
  const [uploadTypeModalOpen, setUploadTypeModalOpen] = useState(false);
  const [fullImageOpen, setFullImageOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [draftVideoModalOpen, setDraftVideoModalOpen] = useState(false);
  const [rawFootageModalOpen, setRawFootageModalOpen] = useState(false);
  const [photosModalOpen, setPhotosModalOpen] = useState(false);

  const [uploadProgress, setUploadProgress] = useState([]);

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

  const { deliverables } = deliverablesData;

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

  const logistics = useMemo(
    () => campaign?.logistic?.filter((item) => item?.userId === user?.id),
    [campaign, user]
  );

  const previousSubmission = useMemo(
    () => fullSubmission?.find((item) => item?.id === dependency?.dependentSubmissionId),
    [fullSubmission, dependency]
  );

  const totalUGCVideos = useMemo(
    () => campaign.shortlisted?.find((x) => x.userId === submission.userId)?.ugcVideos || null,
    [campaign, submission]
  );

  useEffect(() => {
    if (!socket) return; // Early return if socket is not available

    const handleProgress = (data) => {
      if (submission?.id !== data.submissionId) return; // Check if submissionId matches
      // inQueue.onFalse();
      // setProgress(Math.ceil(data.progress));

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
        setPreview('');
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

  const getButtonSecondaryText = (status, isUploaded, defaultText) => {
    if (status === 'PENDING_REVIEW') {
      return 'Submission under review';
    }
    if (isUploaded) {
      return 'Already uploaded';
    }
    return defaultText;
  };

  // Helper function to get the index for the caption tab
  const getTabIndex = (tab) => {
    let index = 0;
    if (tab === 'caption') {
      index = 0; // Start with base index
      if (true) index += 1; // For draft videos (always present)
      if (submission?.rawFootages?.length > 0) index += 1;
      if (submission?.photos?.length > 0) index += 1;
    }
    return index;
  };

  // Helper function to get tab options for dropdown
  const getTabOptions = () => {
    const options = [{ value: 0, label: 'Draft Videos', icon: 'eva:video-outline' }];

    if (submission?.rawFootages?.length > 0) {
      options.push({ value: 1, label: 'Raw Footage', icon: 'eva:film-outline' });
    }

    if (submission?.photos?.length > 0) {
      options.push({
        value: submission?.rawFootages?.length > 0 ? 2 : 1,
        label: 'Photos',
        icon: 'eva:image-outline',
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
                    Your first draft is being reviewed.
                  </Typography>
                </Stack>
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
                {uploadProgress.length ? (
                  <Stack spacing={1}>
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
                ) : (
                  <Stack gap={2}>
                    <Box>
                      <Typography variant="body1" sx={{ color: '#221f20', mb: 2, ml: -1 }}>
                        It&apos;s time to submit your first draft for this campaign!
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#221f20', mb: 2, ml: -1 }}>
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

                      {/* {totalUGCVideos && (
                        <ListItemText
                          primary="Notes:"
                          secondary={`1. 🎥 Upload ${totalUGCVideos} UGC Videos`}
                          sx={{ color: '#221f20', mb: 2, ml: -1 }}
                          primaryTypographyProps={{
                            variant: 'subtitle1',
                          }}
                          secondaryTypographyProps={{
                            variant: 'subtitle2',
                          }}
                        />
                      )} */}

                      {/* Deliverables incomplete message */}
                      {(!submission?.video?.length ||
                        (campaign.rawFootage && !submission?.rawFootages?.length) ||
                        (campaign.photos && !submission?.photos?.length)) && (
                        <Box sx={{ mt: 4, mb: 3, ml: -1 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              color: '#231F20',
                              fontWeight: 600,
                              mb: 0.5,
                            }}
                          >
                            Deliverables Incomplete
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#636366' }}>
                            Please complete all deliverables to ensure your submission goes through.
                          </Typography>
                        </Box>
                      )}

                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        // justifyContent="space-between"
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        gap={2}
                        pb={3}
                        mt={1}
                      >
                        {/* Draft Video Button */}
                        <Box
                          sx={{
                            position: 'relative',

                            border: 1,
                            p: 2,
                            borderRadius: 2,
                            borderColor: submission?.video?.length > 0 ? '#5abc6f' : grey[100],
                            transition: 'all .2s ease',
                            width: { xs: '100%', sm: '32%' },
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            opacity:
                              submission?.video?.length > 0 ||
                              submission?.status === 'PENDING_REVIEW'
                                ? 0.5
                                : 1,
                            cursor:
                              submission?.video?.length > 0 ||
                              submission?.status === 'PENDING_REVIEW'
                                ? 'not-allowed'
                                : 'pointer',
                            '&:hover': {
                              borderColor:
                                submission?.video?.length > 0 ||
                                submission?.status === 'PENDING_REVIEW'
                                  ? grey[700]
                                  : grey[700],
                              transform:
                                submission?.video?.length > 0 ||
                                submission?.status === 'PENDING_REVIEW'
                                  ? 'none'
                                  : 'scale(1.02)',
                            },
                          }}
                          onClick={() => {
                            if (
                              !submission?.video?.length &&
                              submission?.status !== 'PENDING_REVIEW'
                            ) {
                              setDraftVideoModalOpen(true);
                            }
                          }}
                        >
                          {submission?.video?.length > 0 && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: -10,
                                right: -10,
                                bgcolor: '#5abc6f',
                                borderRadius: '50%',
                                width: 28,
                                height: 28,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                zIndex: 1,
                              }}
                            >
                              <Iconify
                                icon="eva:checkmark-fill"
                                sx={{ color: 'white', width: 20 }}
                              />
                            </Box>
                          )}

                          {submission?.status === 'PENDING_REVIEW' && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: -10,
                                right: -10,
                                bgcolor: grey[500],
                                borderRadius: '50%',
                                width: 28,
                                height: 28,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                zIndex: 1,
                              }}
                            >
                              <Iconify icon="eva:lock-fill" sx={{ color: 'white', width: 20 }} />
                            </Box>
                          )}

                          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Avatar
                              sx={{
                                bgcolor: submission?.video?.length > 0 ? '#5abc6f' : '#203ff5',
                                mb: 2,
                              }}
                            >
                              <Iconify icon="eva:video-outline" />
                            </Avatar>

                            <ListItemText
                              sx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                              primary="Draft Video"
                              secondary={getButtonSecondaryText(
                                submission?.status,
                                submission?.video?.length > 0,
                                'Upload your main draft video for the campaign'
                              )}
                              primaryTypographyProps={{
                                variant: 'body1',
                                fontWeight: 'bold',
                                gutterBottom: true,
                                sx: { mb: 1 },
                              }}
                              secondaryTypographyProps={{
                                color: 'text.secondary',
                                lineHeight: 1.2,
                                sx: {
                                  minHeight: '2.4em',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                },
                              }}
                            />
                          </Box>
                        </Box>

                        {/* Raw Footage Button */}
                        {campaign.rawFootage && (
                          <Box
                            sx={{
                              position: 'relative',
                              border: 1,
                              p: 2,
                              borderRadius: 2,
                              borderColor:
                                submission?.rawFootages?.length > 0 ? '#5abc6f' : grey[100],
                              transition: 'all .2s ease',
                              width: { xs: '100%', sm: '32%' },
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              opacity:
                                submission?.rawFootages?.length > 0 ||
                                submission?.status === 'PENDING_REVIEW'
                                  ? 0.5
                                  : 1,
                              cursor:
                                submission?.rawFootages?.length > 0 ||
                                submission?.status === 'PENDING_REVIEW'
                                  ? 'not-allowed'
                                  : 'pointer',
                              '&:hover': {
                                borderColor:
                                  submission?.rawFootages?.length > 0 ||
                                  submission?.status === 'PENDING_REVIEW'
                                    ? grey[700]
                                    : grey[700],
                                transform:
                                  submission?.rawFootages?.length > 0 ||
                                  submission?.status === 'PENDING_REVIEW'
                                    ? 'none'
                                    : 'scale(1.02)',
                              },
                            }}
                            onClick={() => {
                              if (
                                !submission?.rawFootages?.length &&
                                submission?.status !== 'PENDING_REVIEW'
                              ) {
                                setRawFootageModalOpen(true);
                              }
                            }}
                          >
                            {submission?.rawFootages?.length > 0 && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: -10,
                                  right: -10,
                                  bgcolor: '#5abc6f',
                                  borderRadius: '50%',
                                  width: 28,
                                  height: 28,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  zIndex: 1,
                                }}
                              >
                                <Iconify
                                  icon="eva:checkmark-fill"
                                  sx={{ color: 'white', width: 20 }}
                                />
                              </Box>
                            )}

                            {submission?.status === 'PENDING_REVIEW' && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: -10,
                                  right: -10,
                                  bgcolor: grey[500],
                                  borderRadius: '50%',
                                  width: 28,
                                  height: 28,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  zIndex: 1,
                                }}
                              >
                                <Iconify icon="eva:lock-fill" sx={{ color: 'white', width: 20 }} />
                              </Box>
                            )}

                            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                              <Avatar
                                sx={{
                                  bgcolor:
                                    submission?.rawFootages?.length > 0 ? '#5abc6f' : '#203ff5',
                                  mb: 2,
                                }}
                              >
                                <Iconify icon="eva:film-outline" />
                              </Avatar>

                              <ListItemText
                                sx={{
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                                primary="Raw Footage"
                                secondary={getButtonSecondaryText(
                                  submission?.status,
                                  submission?.rawFootages?.length > 0,
                                  'Upload raw, unedited footage from your shoot'
                                )}
                                primaryTypographyProps={{
                                  variant: 'body1',
                                  fontWeight: 'bold',
                                  gutterBottom: true,
                                  sx: { mb: 1 },
                                }}
                                secondaryTypographyProps={{
                                  color: 'text.secondary',
                                  lineHeight: 1.2,
                                  sx: {
                                    minHeight: '2.4em',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  },
                                }}
                              />
                            </Box>
                          </Box>
                        )}

                        {/* Photos Button */}
                        {campaign.photos && (
                          <Box
                            sx={{
                              position: 'relative',
                              border: 1,
                              p: 2,
                              borderRadius: 2,
                              borderColor: submission?.photos?.length > 0 ? '#5abc6f' : grey[100],
                              transition: 'all .2s ease',
                              width: { xs: '100%', sm: '32%' },
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              opacity:
                                submission?.photos?.length > 0 ||
                                submission?.status === 'PENDING_REVIEW'
                                  ? 0.5
                                  : 1,
                              cursor:
                                submission?.photos?.length > 0 ||
                                submission?.status === 'PENDING_REVIEW'
                                  ? 'not-allowed'
                                  : 'pointer',
                              '&:hover': {
                                borderColor:
                                  submission?.photos?.length > 0 ||
                                  submission?.status === 'PENDING_REVIEW'
                                    ? grey[700]
                                    : grey[700],
                                transform:
                                  submission?.photos?.length > 0 ||
                                  submission?.status === 'PENDING_REVIEW'
                                    ? 'none'
                                    : 'scale(1.02)',
                              },
                            }}
                            onClick={() => {
                              if (
                                !submission?.photos?.length &&
                                submission?.status !== 'PENDING_REVIEW'
                              ) {
                                setPhotosModalOpen(true);
                              }
                            }}
                          >
                            {submission?.photos?.length > 0 && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: -10,
                                  right: -10,
                                  bgcolor: '#5abc6f',
                                  borderRadius: '50%',
                                  width: 28,
                                  height: 28,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  zIndex: 1,
                                }}
                              >
                                <Iconify
                                  icon="eva:checkmark-fill"
                                  sx={{ color: 'white', width: 20 }}
                                />
                              </Box>
                            )}

                            {submission?.status === 'PENDING_REVIEW' && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: -10,
                                  right: -10,
                                  bgcolor: grey[500],
                                  borderRadius: '50%',
                                  width: 28,
                                  height: 28,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  zIndex: 1,
                                }}
                              >
                                <Iconify icon="eva:lock-fill" sx={{ color: 'white', width: 20 }} />
                              </Box>
                            )}

                            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                              <Avatar
                                sx={{
                                  bgcolor: submission?.photos?.length > 0 ? '#5abc6f' : '#203ff5',
                                  mb: 2,
                                }}
                              >
                                <Iconify icon="eva:image-outline" />
                              </Avatar>

                              <ListItemText
                                sx={{
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                                primary="Photos"
                                secondary={getButtonSecondaryText(
                                  submission?.status,
                                  submission?.photos?.length > 0,
                                  'Upload photos from your campaign shoot'
                                )}
                                primaryTypographyProps={{
                                  variant: 'body1',
                                  fontWeight: 'bold',
                                  gutterBottom: true,
                                  sx: { mb: 1 },
                                }}
                                secondaryTypographyProps={{
                                  color: 'text.secondary',
                                  lineHeight: 1.2,
                                  sx: {
                                    minHeight: '2.4em',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  },
                                }}
                              />
                            </Box>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                )}
              </>
            )}

            {submission?.status === 'CHANGES_REQUIRED' && (
              <Box sx={{ mt: 3 }}>
                {/* Header */}
                <Stack justifyContent="center" alignItems="center" spacing={2} sx={{ mb: 3 }}>
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
                    ✏️
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
                      Needs Revision
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#636366',
                        mt: -1,
                      }}
                    >
                      Your first draft needs some changes.
                    </Typography>
                  </Stack>
                  {/* <Button
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
                    Preview First Draft
                  </Button> */}
                </Stack>

                {/* Detailed Feedback Display */}
                {submission?.feedback && submission.feedback.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Stack spacing={1.5}>
                      {submission.feedback
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
                                          {deliverables?.videos?.filter(
                                            (video) => video.status === 'APPROVED'
                                          ).length > 0 && (
                                            <Stack
                                              direction="row"
                                              alignItems="center"
                                              spacing={0.5}
                                            >
                                              <Iconify
                                                icon="eva:checkmark-fill"
                                                sx={{ color: '#1DBF66', width: 14, height: 14 }}
                                              />
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  color: '#1DBF66',
                                                  fontWeight: 600,
                                                  fontSize: '11px',
                                                }}
                                              >
                                                {
                                                  deliverables.videos.filter(
                                                    (video) => video.status === 'APPROVED'
                                                  ).length
                                                }
                                              </Typography>
                                            </Stack>
                                          )}
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
                                                  {feedback.admin?.name?.charAt(0)?.toUpperCase() ||
                                                    'A'}
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

                                    {/* Approved Draft Videos */}
                                    {deliverables?.videos?.filter(
                                      (video) => video.status === 'APPROVED'
                                    ).length > 0 && (
                                      <Box sx={{ mt: 3 }}>
                                        <Box
                                          sx={{
                                            height: '1px',
                                            bgcolor: '#e0e0e0',
                                            mt: -1,
                                            mb: 2,
                                            mx: 1,
                                          }}
                                        />{' '}
                                        {/* Draft Video Divider */}
                                        {(() => {
                                          const approvedVideos = deliverables.videos.filter(
                                            (video) => video.status === 'APPROVED'
                                          );

                                          // Get all unique feedback for approved videos
                                          const approvalFeedbacks =
                                            submission?.feedback?.filter(
                                              (fb) =>
                                                (fb.type === 'APPROVAL' || fb.type === 'COMMENT') &&
                                                fb.videosToUpdate?.some((videoId) =>
                                                  approvedVideos.some((v) => v.id === videoId)
                                                )
                                            ) || [];

                                          // Use the most recent feedback or create a default one
                                          const mainFeedback =
                                            approvalFeedbacks.length > 0
                                              ? approvalFeedbacks.sort(
                                                  (a, b) =>
                                                    new Date(b.createdAt) - new Date(a.createdAt)
                                                )[0]
                                              : { admin: { name: 'Admin', role: 'admin' } };

                                          return (
                                            <Box>
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
                                                    src={mainFeedback?.admin?.photoURL}
                                                    sx={{ width: 42, height: 42, mb: 0.5 }}
                                                  >
                                                    {mainFeedback?.admin?.name
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
                                                        {mainFeedback?.admin?.name || 'Admin'}
                                                      </Typography>
                                                      <Chip
                                                        label={
                                                          mainFeedback?.admin?.role
                                                            ? mainFeedback.admin.role
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                              mainFeedback.admin.role.slice(1)
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
                                                      {mainFeedback?.createdAt
                                                        ? dayjs(mainFeedback.createdAt).format(
                                                            'MMM D, YYYY h:mm A'
                                                          )
                                                        : 'Recently approved'}
                                                    </Typography>
                                                  </Box>
                                                  <Box
                                                    sx={{
                                                      bgcolor: '#FFFFFF',
                                                      color: '#1DBF66',
                                                      border: '1.5px solid',
                                                      borderColor: '#1DBF66',
                                                      borderBottom: 3,
                                                      borderBottomColor: '#1DBF66',
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
                                                    APPROVED
                                                  </Box>
                                                </Stack>

                                                {/* Combined Feedback Text */}
                                                <Box sx={{ mt: 1.5, mb: 2 }}>
                                                  {approvedVideos.map((video, index) => {
                                                    const videoFeedback = approvalFeedbacks.find(
                                                      (fb) => fb.videosToUpdate?.includes(video.id)
                                                    );

                                                    return videoFeedback?.content ? (
                                                      <Typography
                                                        key={video.id}
                                                        variant="body2"
                                                        sx={{
                                                          color: '#495057',
                                                          lineHeight: 1.5,
                                                          fontSize: '0.875rem',
                                                          mb:
                                                            index < approvedVideos.length - 1
                                                              ? 1
                                                              : 0,
                                                        }}
                                                      >
                                                        {approvedVideos.length > 1 && (
                                                          <Box
                                                            component="span"
                                                            sx={{
                                                              fontWeight: 600,
                                                              color: '#1DBF66',
                                                            }}
                                                          >
                                                            {index + 1}.{' '}
                                                          </Box>
                                                        )}
                                                        {videoFeedback.content}
                                                      </Typography>
                                                    ) : null;
                                                  })}
                                                  {!approvalFeedbacks.some((fb) => fb.content) && (
                                                    <Typography
                                                      variant="body2"
                                                      sx={{
                                                        color: '#495057',
                                                        lineHeight: 1.5,
                                                        fontSize: '0.875rem',
                                                      }}
                                                    >
                                                      All videos have been approved.
                                                    </Typography>
                                                  )}
                                                </Box>

                                                {/* Videos Grid */}
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 1.5,
                                                  }}
                                                >
                                                  {approvedVideos.map((video, index) => (
                                                    <Box
                                                      key={video.id}
                                                      sx={{
                                                        position: 'relative',
                                                        border: '2px solid #1DBF66',
                                                        borderRadius: 1.5,
                                                        overflow: 'hidden',
                                                        bgcolor: '#ffffff',
                                                        cursor: 'pointer',
                                                        width: '200px',
                                                        flexShrink: 0,
                                                        mb: 1,
                                                        '&:hover': {
                                                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                        },
                                                      }}
                                                      onClick={() =>
                                                        handleVideoClick(approvedVideos, index)
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
                                                              width: 32,
                                                              height: 32,
                                                              opacity: 0.9,
                                                            }}
                                                          />
                                                        </Box>
                                                      </Box>
                                                      {/* Video Number Badge */}
                                                      {approvedVideos.length > 1 && (
                                                        <Box
                                                          sx={{
                                                            position: 'absolute',
                                                            top: 8,
                                                            left: 8,
                                                            bgcolor: '#1DBF66',
                                                            color: 'white',
                                                            borderRadius: '50%',
                                                            width: 24,
                                                            height: 24,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                          }}
                                                        >
                                                          {index + 1}
                                                        </Box>
                                                      )}
                                                    </Box>
                                                  ))}
                                                </Box>
                                              </Box>
                                            </Box>
                                          );
                                        })()}
                                      </Box>
                                    )}
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
                                          {deliverables?.photos?.filter(
                                            (photo) => photo.status === 'APPROVED'
                                          ).length > 0 && (
                                            <Stack
                                              direction="row"
                                              alignItems="center"
                                              spacing={0.5}
                                            >
                                              <Iconify
                                                icon="eva:checkmark-fill"
                                                sx={{ color: '#1DBF66', width: 14, height: 14 }}
                                              />
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  color: '#1DBF66',
                                                  fontWeight: 600,
                                                  fontSize: '11px',
                                                }}
                                              >
                                                {
                                                  deliverables.photos.filter(
                                                    (photo) => photo.status === 'APPROVED'
                                                  ).length
                                                }
                                              </Typography>
                                            </Stack>
                                          )}
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
                                                // border: '1px solid #D4321C',
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
                                                  {feedback.admin?.name?.charAt(0)?.toUpperCase() ||
                                                    'A'}
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

                                            {/* Photo Reasons (future implementation?) */}
                                            {/* {feedback.reasons && feedback.reasons.length > 0 && (
                                              <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" sx={{ color: '#6c757d', mb: 1, display: 'block', fontWeight: 600 }}>
                                                  Reasons
                                                </Typography>
                                                <Stack spacing={0.5}>
                                                  {feedback.reasons.map((reason, reasonIndex) => (
                                                    <Chip
                                                      key={reasonIndex}
                                                      label={reason}
                                                      size="small"
                                                      sx={{
                                                        bgcolor: '#fff3cd',
                                                        color: '#856404',
                                                        fontSize: '0.7rem',
                                                        height: '24px',
                                                        fontWeight: 600,
                                                        justifyContent: 'flex-start',
                                                      }}
                                                    />
                                                  ))}
                                                </Stack>
                                              </Box>
                                            )} */}
                                          </Box>
                                        ))}
                                    </Stack>

                                    {/* Approved Photos */}
                                    {deliverables?.photos?.filter(
                                      (photo) => photo.status === 'APPROVED'
                                    ).length > 0 && (
                                      <Box sx={{ mt: 3 }}>
                                        <Box
                                          sx={{ height: '1px', bgcolor: '#e0e0e0', mb: 2, mx: 1 }}
                                        />
                                        {(() => {
                                          const approvedPhotos = deliverables.photos.filter(
                                            (photo) => photo.status === 'APPROVED'
                                          );

                                          // Get all unique feedback for approved photos
                                          const approvalFeedbacks =
                                            submission?.feedback?.filter(
                                              (fb) =>
                                                (fb.type === 'APPROVAL' || fb.type === 'COMMENT') &&
                                                fb.photosToUpdate?.some((photoId) =>
                                                  approvedPhotos.some((p) => p.id === photoId)
                                                )
                                            ) || [];

                                          // Use the most recent feedback or create a default one
                                          const mainFeedback =
                                            approvalFeedbacks.length > 0
                                              ? approvalFeedbacks.sort(
                                                  (a, b) =>
                                                    new Date(b.createdAt) - new Date(a.createdAt)
                                                )[0]
                                              : { admin: { name: 'Admin', role: 'admin' } };

                                          return (
                                            <Box>
                                              {/* Admin feedback */}
                                              <Box
                                                sx={{
                                                  p: 2,
                                                  borderRadius: 1.5,
                                                  bgcolor: '#f8f9fa',
                                                  border: '1px solid #e9ecef',
                                                }}
                                              >
                                                <Stack
                                                  direction="row"
                                                  alignItems="center"
                                                  spacing={1.5}
                                                >
                                                  <Avatar
                                                    src={mainFeedback?.admin?.photoURL}
                                                    sx={{ width: 32, height: 32 }}
                                                  >
                                                    {mainFeedback?.admin?.name
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
                                                        {mainFeedback?.admin?.name || 'Admin'}
                                                      </Typography>
                                                      <Chip
                                                        label={
                                                          mainFeedback?.admin?.role
                                                            ? mainFeedback.admin.role
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                              mainFeedback.admin.role.slice(1)
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
                                                      {mainFeedback?.createdAt
                                                        ? dayjs(mainFeedback.createdAt).format(
                                                            'MMM D, YYYY h:mm A'
                                                          )
                                                        : 'Recently approved'}
                                                    </Typography>
                                                  </Box>
                                                  <Box
                                                    sx={{
                                                      bgcolor: '#FFFFFF',
                                                      color: '#1DBF66',
                                                      border: '1.5px solid',
                                                      borderColor: '#1DBF66',
                                                      borderBottom: 3,
                                                      borderBottomColor: '#1DBF66',
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
                                                    APPROVED
                                                  </Box>
                                                </Stack>

                                                {/* Combined Feedback Text */}
                                                <Box sx={{ mt: 1.5, mb: 2 }}>
                                                  {approvedPhotos.map((photo, index) => {
                                                    const photoFeedback = approvalFeedbacks.find(
                                                      (fb) => fb.photosToUpdate?.includes(photo.id)
                                                    );

                                                    return photoFeedback?.photoContent ? (
                                                      <Typography
                                                        key={photo.id}
                                                        variant="body2"
                                                        sx={{
                                                          color: '#495057',
                                                          lineHeight: 1.5,
                                                          fontSize: '0.875rem',
                                                          mb:
                                                            index < approvedPhotos.length - 1
                                                              ? 1
                                                              : 0,
                                                        }}
                                                      >
                                                        {approvedPhotos.length > 1 && (
                                                          <Box
                                                            component="span"
                                                            sx={{
                                                              fontWeight: 600,
                                                              color: '#1DBF66',
                                                            }}
                                                          >
                                                            {index + 1}.{' '}
                                                          </Box>
                                                        )}
                                                        {photoFeedback.photoContent}
                                                      </Typography>
                                                    ) : null;
                                                  })}
                                                  {!approvalFeedbacks.some(
                                                    (fb) => fb.photoContent
                                                  ) && (
                                                    <Typography
                                                      variant="body2"
                                                      sx={{
                                                        color: '#495057',
                                                        lineHeight: 1.5,
                                                        fontSize: '0.875rem',
                                                      }}
                                                    >
                                                      All photos have been approved.
                                                    </Typography>
                                                  )}
                                                </Box>

                                                {/* Photos Grid */}
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 1.5,
                                                  }}
                                                >
                                                  {approvedPhotos.map((photo, index) => (
                                                    <Box
                                                      key={photo.id}
                                                      sx={{
                                                        position: 'relative',
                                                        border: '2px solid #1DBF66',
                                                        borderRadius: 1.5,
                                                        overflow: 'hidden',
                                                        bgcolor: '#ffffff',
                                                        cursor: 'pointer',
                                                        width:
                                                          approvedPhotos.length === 1
                                                            ? '300px'
                                                            : '150px',
                                                        flexShrink: 0,
                                                        mb: 1,
                                                        '&:hover': {
                                                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                        },
                                                      }}
                                                      onClick={() =>
                                                        handlePhotoClick(approvedPhotos, index)
                                                      }
                                                    >
                                                      <Box
                                                        component="img"
                                                        src={photo.url}
                                                        alt={`Approved Photo ${index + 1}`}
                                                        sx={{
                                                          width: '100%',
                                                          height:
                                                            approvedPhotos.length === 1 ? 200 : 120,
                                                          objectFit: 'cover',
                                                        }}
                                                      />
                                                      {/* Photo Number Badge */}
                                                      {approvedPhotos.length > 1 && (
                                                        <Box
                                                          sx={{
                                                            position: 'absolute',
                                                            top: 8,
                                                            left: 8,
                                                            bgcolor: '#1DBF66',
                                                            color: 'white',
                                                            borderRadius: '50%',
                                                            width: 24,
                                                            height: 24,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                          }}
                                                        >
                                                          {index + 1}
                                                        </Box>
                                                      )}
                                                    </Box>
                                                  ))}
                                                </Box>
                                              </Box>
                                            </Box>
                                          );
                                        })()}
                                      </Box>
                                    )}
                                  </Box>
                                )}

                              {/* Raw footage requiring changes */}
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
                                          {deliverables?.rawFootages?.filter(
                                            (footage) => footage.status === 'APPROVED'
                                          ).length > 0 && (
                                            <Stack
                                              direction="row"
                                              alignItems="center"
                                              spacing={0.5}
                                            >
                                              <Iconify
                                                icon="eva:checkmark-fill"
                                                sx={{ color: '#1DBF66', width: 14, height: 14 }}
                                              />
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  color: '#1DBF66',
                                                  fontWeight: 600,
                                                  fontSize: '11px',
                                                }}
                                              >
                                                {
                                                  deliverables.rawFootages.filter(
                                                    (footage) => footage.status === 'APPROVED'
                                                  ).length
                                                }
                                              </Typography>
                                            </Stack>
                                          )}
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
                                                  sx={{ width: 32, height: 32 }}
                                                >
                                                  {feedback.admin?.name?.charAt(0)?.toUpperCase() ||
                                                    'A'}
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

                                            {/* Raw Footage Reasons (future implementation?) */}
                                            {/* {feedback.reasons && feedback.reasons.length > 0 && (
                                              <Box sx={{ width: '200px', flexShrink: 0 }}>
                                                <Typography variant="caption" sx={{ color: '#6c757d', mb: 1, display: 'block', fontWeight: 600 }}>
                                                  Reasons
                                                </Typography>
                                                <Stack spacing={0.5}>
                                                  {feedback.reasons.map((reason, reasonIndex) => (
                                                    <Chip
                                                      key={reasonIndex}
                                                      label={reason}
                                                      size="small"
                                                      sx={{
                                                        bgcolor: '#fff3cd',
                                                        color: '#856404',
                                                        fontSize: '0.7rem',
                                                        height: '24px',
                                                        fontWeight: 600,
                                                        justifyContent: 'flex-start',
                                                      }}
                                                    />
                                                  ))}
                                                </Stack>
                                              </Box>
                                            )} */}
                                          </Box>
                                        ))}
                                    </Stack>

                                    {/* Approved Raw Footage */}
                                    {deliverables?.rawFootages?.filter(
                                      (footage) => footage.status === 'APPROVED'
                                    ).length > 0 && (
                                      <Box sx={{ mt: 3 }}>
                                        <Box
                                          sx={{
                                            height: '1px',
                                            bgcolor: '#e0e0e0',
                                            mt: -1,
                                            mb: 2,
                                            mx: 1,
                                          }}
                                        />{' '}
                                        {/* Raw Footage Divider */}
                                        {(() => {
                                          const approvedRawFootages =
                                            deliverables.rawFootages.filter(
                                              (footage) => footage.status === 'APPROVED'
                                            );

                                          // Get all unique feedback for approved raw footages
                                          const approvalFeedbacks =
                                            submission?.feedback?.filter(
                                              (fb) =>
                                                (fb.type === 'APPROVAL' || fb.type === 'COMMENT') &&
                                                fb.rawFootageToUpdate?.some((footageId) =>
                                                  approvedRawFootages.some(
                                                    (f) => f.id === footageId
                                                  )
                                                )
                                            ) || [];

                                          // Use the most recent feedback or create a default one
                                          const mainFeedback =
                                            approvalFeedbacks.length > 0
                                              ? approvalFeedbacks.sort(
                                                  (a, b) =>
                                                    new Date(b.createdAt) - new Date(a.createdAt)
                                                )[0]
                                              : { admin: { name: 'Admin', role: 'admin' } };

                                          return (
                                            <Box>
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
                                                    src={mainFeedback?.admin?.photoURL}
                                                    sx={{ width: 32, height: 32 }}
                                                  >
                                                    {mainFeedback?.admin?.name
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
                                                        {mainFeedback?.admin?.name || 'Admin'}
                                                      </Typography>
                                                      <Chip
                                                        label={
                                                          mainFeedback?.admin?.role
                                                            ? mainFeedback.admin.role
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                              mainFeedback.admin.role.slice(1)
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
                                                      {mainFeedback?.createdAt
                                                        ? dayjs(mainFeedback.createdAt).format(
                                                            'MMM D, YYYY h:mm A'
                                                          )
                                                        : 'Recently approved'}
                                                    </Typography>
                                                  </Box>
                                                  <Box
                                                    sx={{
                                                      bgcolor: '#FFFFFF',
                                                      color: '#1DBF66',
                                                      border: '1.5px solid',
                                                      borderColor: '#1DBF66',
                                                      borderBottom: 3,
                                                      borderBottomColor: '#1DBF66',
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
                                                    APPROVED
                                                  </Box>
                                                </Stack>

                                                {/* Combined Feedback Text */}
                                                <Box sx={{ mt: 1.5, mb: 2 }}>
                                                  {approvedRawFootages.map((footage, index) => {
                                                    const footageFeedback = approvalFeedbacks.find(
                                                      (fb) =>
                                                        fb.rawFootageToUpdate?.includes(footage.id)
                                                    );

                                                    return footageFeedback?.rawFootageContent ? (
                                                      <Typography
                                                        key={footage.id}
                                                        variant="body2"
                                                        sx={{
                                                          color: '#495057',
                                                          lineHeight: 1.5,
                                                          fontSize: '0.875rem',
                                                          mb:
                                                            index < approvedRawFootages.length - 1
                                                              ? 1
                                                              : 0,
                                                        }}
                                                      >
                                                        {approvedRawFootages.length > 1 && (
                                                          <Box
                                                            component="span"
                                                            sx={{
                                                              fontWeight: 600,
                                                              color: '#1DBF66',
                                                            }}
                                                          >
                                                            {index + 1}.{' '}
                                                          </Box>
                                                        )}
                                                        {footageFeedback.rawFootageContent}
                                                      </Typography>
                                                    ) : null;
                                                  })}
                                                  {!approvalFeedbacks.some(
                                                    (fb) => fb.rawFootageContent
                                                  ) && (
                                                    <Typography
                                                      variant="body2"
                                                      sx={{
                                                        color: '#495057',
                                                        lineHeight: 1.5,
                                                        fontSize: '0.875rem',
                                                      }}
                                                    >
                                                      All raw footage has been approved.
                                                    </Typography>
                                                  )}
                                                </Box>

                                                {/* Raw Footages Grid */}
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 1.5,
                                                  }}
                                                >
                                                  {approvedRawFootages.map((footage, index) => (
                                                    <Box
                                                      key={footage.id}
                                                      sx={{
                                                        position: 'relative',
                                                        border: '2px solid #1DBF66',
                                                        borderRadius: 1.5,
                                                        overflow: 'hidden',
                                                        bgcolor: '#ffffff',
                                                        cursor: 'pointer',
                                                        width: '200px',
                                                        flexShrink: 0,
                                                        mb: 1,
                                                        '&:hover': {
                                                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                        },
                                                      }}
                                                      onClick={() =>
                                                        handleVideoClick(approvedRawFootages, index)
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
                                                              width: 32,
                                                              height: 32,
                                                              opacity: 0.9,
                                                            }}
                                                          />
                                                        </Box>
                                                      </Box>
                                                      {/* Raw Footage Number Badge */}
                                                      {approvedRawFootages.length > 1 && (
                                                        <Box
                                                          sx={{
                                                            position: 'absolute',
                                                            top: 8,
                                                            left: 8,
                                                            bgcolor: '#1DBF66',
                                                            color: 'white',
                                                            borderRadius: '50%',
                                                            width: 24,
                                                            height: 24,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                          }}
                                                        >
                                                          {index + 1}
                                                        </Box>
                                                      )}
                                                    </Box>
                                                  ))}
                                                </Box>
                                              </Box>
                                            </Box>
                                          );
                                        })()}
                                      </Box>
                                    )}
                                  </Box>
                                )}
                            </Stack>
                          </Box>
                        ))}
                    </Stack>
                  </Box>
                )}
              </Box>
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
                    Your First Draft has been approved.
                  </Typography>
                </Stack>

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

                {/* Display Admin Feedback */}
                {submission?.feedback && submission.feedback.length > 0 && (
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
                              {feedback.content &&
                                feedback.content.split('\n').map((line, i) => (
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
                )}
              </Stack>
            )}

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
                    Preview First Draft
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
                  title={`Draft Videos${(campaign?.campaignCredits && deliverables?.videos?.length > 0 ? deliverables.videos : [{ url: submission?.content }]).length > 1 ? ` (${selectedVideoIndex + 1}/${(campaign?.campaignCredits && deliverables?.videos?.length > 0 ? deliverables.videos : [{ url: submission?.content }]).length})` : ''}`}
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
                {submission?.rawFootages?.length > 0 && (
                  <Tooltip
                    title={`Raw Footage${submission.rawFootages.length > 1 ? ` (${selectedRawFootageIndex + 1}/${submission.rawFootages.length})` : ''}`}
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
                      onClick={() => setTabIndex(submission?.rawFootages?.length > 0 ? 2 : 1)}
                      sx={{
                        minWidth: { xs: '40px', md: '44px' },
                        width: { xs: '40px', md: '44px' },
                        height: { xs: '40px', md: '44px' },
                        p: 0,
                        bgcolor:
                          tabIndex === (submission?.rawFootages?.length > 0 ? 2 : 1)
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
                            tabIndex === (submission?.rawFootages?.length > 0 ? 2 : 1)
                              ? 'transparent'
                              : '#5A5A5C',
                        },
                        '&:hover': {
                          bgcolor:
                            tabIndex === (submission?.rawFootages?.length > 0 ? 2 : 1)
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
                                setSelectedVideoIndex(
                                  (prev) => (prev - 1 + totalVideos) % totalVideos
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
                              <Iconify
                                icon="eva:arrow-ios-forward-fill"
                                width={{ xs: 20, md: 22 }}
                              />
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
                {tabIndex === 1 && submission?.rawFootages?.length > 0 && (
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
                    {submission.rawFootages.map(
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
                    {submission.rawFootages.length > 1 && (
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
                                  (prev - 1 + submission.rawFootages.length) %
                                  submission.rawFootages.length
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
                                (prev) => (prev + 1) % submission.rawFootages.length
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
                {tabIndex === (submission?.rawFootages?.length > 0 ? 2 : 1) &&
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
                                setSelectedPhotoIndex(
                                  (prev) => (prev + 1) % submission.photos.length
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
                              <Iconify
                                icon="eva:arrow-ios-forward-fill"
                                width={{ xs: 20, md: 22 }}
                              />
                            </Button>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  )}
              </Box>
            </Dialog>

            <FirstDraftFileTypeModal
              submission={submission}
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
              deliverablesData={deliverablesData}
            />

            <UploadDraftVideoModal
              submissionId={submission?.id}
              campaign={campaign}
              open={draftVideoModalOpen}
              onClose={() => setDraftVideoModalOpen(false)}
              totalUGCVideos={totalUGCVideos}
              deliverablesData={deliverablesData}
            />

            <UploadRawFootageModal
              open={rawFootageModalOpen}
              onClose={() => setRawFootageModalOpen(false)}
              submissionId={submission?.id}
              campaign={campaign}
              deliverablesData={deliverablesData}
            />

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

            {/* Media Modals */}
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

            <PhotoModal
              open={photoModalOpen}
              onClose={() => setPhotoModalOpen(false)}
              photos={modalPhotos}
              currentIndex={selectedPhotoForModal}
              setCurrentIndex={setSelectedPhotoForModal}
              creator={user}
            />
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
  deliverablesData: PropTypes.object,
};
