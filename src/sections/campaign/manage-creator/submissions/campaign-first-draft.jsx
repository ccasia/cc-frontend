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
  Grid,
  Stack,
  Button,
  Dialog,
  Typography,
  IconButton,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
  LinearProgress,
  Avatar,
  Tabs,
  Tab,
  alpha,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
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

  const { deliverables } = deliverablesData;

  const [tabIndex, setTabIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [selectedRawFootageIndex, setSelectedRawFootageIndex] = useState(0);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

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
    const options = [
      { value: 0, label: 'Draft Videos', icon: 'solar:video-library-bold' }
    ];
    
    if (submission?.rawFootages?.length > 0) {
      options.push({ value: 1, label: 'Raw Footage', icon: 'solar:camera-bold' });
    }
    
    if (submission?.photos?.length > 0) {
      options.push({ 
        value: submission?.rawFootages?.length > 0 ? 2 : 1, 
        label: 'Photos', 
        icon: 'solar:gallery-wide-bold' 
      });
    }
    
    if (submission?.caption) {
      options.push({ 
        value: getTabIndex('caption'), 
        label: 'Caption', 
        icon: 'solar:document-text-bold' 
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
                              mb: 0.5
                            }}
                          >
                            Deliverables Incomplete
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#636366' }}>
                            1. Please complete all deliverables to ensure your submission goes through.
                            {totalUGCVideos && (
                              <>
                                <br />
                                2. You are required to upload <span style={{ color: '#231F20', fontWeight: 600 }}>{totalUGCVideos} UGC {totalUGCVideos === 1 ? 'Video' : 'Videos'}</span>.
                              </>
                            )}
                          </Typography>
                        </Box>
                      )}


                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
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
                            opacity: submission?.video?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 0.5 : 1,
                            cursor: submission?.video?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 'not-allowed' : 'pointer',
                            '&:hover': {
                              borderColor: submission?.video?.length > 0 || submission?.status === 'PENDING_REVIEW' ? grey[700] : grey[700],
                              transform: submission?.video?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 'none' : 'scale(1.02)',
                            },
                          }}
                          onClick={() => {
                            if (!submission?.video?.length && submission?.status !== 'PENDING_REVIEW') {
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
                              <Iconify icon="eva:checkmark-fill" sx={{ color: 'white', width: 20 }} />
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
                              <Iconify icon="solar:video-library-bold" />
                            </Avatar>

                            <ListItemText
                              sx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                              primary="Draft Video"
                              secondary={
                                getButtonSecondaryText(submission?.status, submission?.video?.length > 0, 'Upload your main draft video for the campaign')
                              }
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
                              borderColor: submission?.rawFootages?.length > 0 ? '#5abc6f' : grey[100],
                              transition: 'all .2s ease',
                              width: { xs: '100%', sm: '32%' },
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              opacity: submission?.rawFootages?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 0.5 : 1,
                              cursor: submission?.rawFootages?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 'not-allowed' : 'pointer',
                              '&:hover': {
                                borderColor: submission?.rawFootages?.length > 0 || submission?.status === 'PENDING_REVIEW' ? grey[700] : grey[700],
                                transform: submission?.rawFootages?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 'none' : 'scale(1.02)',
                              },
                            }}
                            onClick={() => {
                              if (!submission?.rawFootages?.length && submission?.status !== 'PENDING_REVIEW') {
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
                                <Iconify icon="eva:checkmark-fill" sx={{ color: 'white', width: 20 }} />
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
                                  bgcolor: submission?.rawFootages?.length > 0 ? '#5abc6f' : '#203ff5',
                                  mb: 2,
                                }}
                              >
                                <Iconify icon="solar:camera-bold" />
                              </Avatar>

                              <ListItemText
                                sx={{
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                                primary="Raw Footage"
                                secondary={
                                  getButtonSecondaryText(submission?.status, submission?.rawFootages?.length > 0, 'Upload raw, unedited footage from your shoot')
                                }
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
                              opacity: submission?.photos?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 0.5 : 1,
                              cursor: submission?.photos?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 'not-allowed' : 'pointer',
                              '&:hover': {
                                borderColor: submission?.photos?.length > 0 || submission?.status === 'PENDING_REVIEW' ? grey[700] : grey[700],
                                transform: submission?.photos?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 'none' : 'scale(1.02)',
                              },
                            }}
                            onClick={() => {
                              if (!submission?.photos?.length && submission?.status !== 'PENDING_REVIEW') {
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
                                <Iconify icon="eva:checkmark-fill" sx={{ color: 'white', width: 20 }} />
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
                                <Iconify icon="solar:gallery-wide-bold" />
                              </Avatar>

                              <ListItemText
                                sx={{
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                                primary="Photos"
                                secondary={
                                  getButtonSecondaryText(submission?.status, submission?.photos?.length > 0, 'Upload photos from your campaign shoot')
                                }
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
                  Preview First Draft
                </Button>
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
                  <FormControl fullWidth variant="outlined" size="small" sx={{mt: 1}}>
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
                <Box sx={{ 
                  display: 'flex', 
                  height: { xs: 'auto', sm: '100%' },
                  flexDirection: { xs: 'column', sm: 'row' } 
                }}>
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
                      
                      {submission?.rawFootages?.length > 0 && (
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
                            color: tabIndex === (submission?.rawFootages?.length > 0 ? 2 : 1) ? '#1340FF' : 'text.secondary',
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
                  <Box sx={{ 
                    flexGrow: 1, 
                    pl: { xs: 0, sm: 3 }, 
                    overflow: 'auto',
                    width: '100%'
                  }}>
                    {/* Draft Videos Content */}
                    {tabIndex === 0 && (
                      <Box sx={{ width: '100%' }}>
                        {/* Large preview area */}
                        <Box sx={{ mb: 3 }}>
                          {(campaign?.campaignCredits && deliverables?.videos?.length > 0
                            ? deliverables.videos
                            : [{ url: submission?.content }]
                          ).map((videoItem, index) => (
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
                          ))}
                        </Box>

                        {/* Thumbnails */}
                        {(campaign?.campaignCredits && deliverables?.videos?.length > 0
                          ? deliverables.videos
                          : [{ url: submission?.content }]
                        ).length > 1 && (
                          <Box sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: 1.5,
                            justifyContent: { xs: 'center', sm: 'flex-start' }
                          }}>
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
                    {tabIndex === 1 && submission?.rawFootages?.length > 0 && (
                      <Box sx={{ width: '100%' }}>
                        {/* Large preview area */}
                        <Box sx={{ mb: 3 }}>
                          {submission.rawFootages.map((footage, index) => (
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
                          ))}
                        </Box>

                        {/* Thumbnails */}
                        {submission.rawFootages.length > 1 && (
                          <Box sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: 1.5,
                            justifyContent: { xs: 'center', sm: 'flex-start' }
                          }}>
                            {submission.rawFootages.map((footage, index) => (
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
                    {tabIndex === (submission?.rawFootages?.length > 0 ? 2 : 1) && submission?.photos?.length > 0 && (
                      <Box sx={{ width: '100%' }}>
                        {/* Large preview area */}
                        <Box sx={{ mb: 3 }}>
                          {submission.photos.map((photo, index) => (
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
                          ))}
                        </Box>

                        {/* Thumbnails */}
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 1.5,
                          justifyContent: { xs: 'center', sm: 'flex-start' }
                        }}>
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
                        <Typography
                          variant="body1"
                          sx={{ color: 'text.primary', lineHeight: 1.8 }}
                        >
                          {submission?.caption}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </DialogContent>
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
