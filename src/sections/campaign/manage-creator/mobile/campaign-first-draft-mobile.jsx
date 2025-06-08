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
  alpha,
  Button,
  Dialog,
  Avatar,
  Divider,
  Tooltip,
  Container,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

import UploadPhotoModal from '../submissions/components/photo';
import UploadDraftVideoModal from '../submissions/components/draft-video';
import UploadRawFootageModal from '../submissions/components/raw-footage';
import { FirstDraftFileTypeModal } from '../submissions/components/filetype-modal';
import { VideoModal, PhotoModal } from '../../discover/admin/creator-stuff/submissions/firstDraft/media-modals';

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
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <span>{dots}</span>;
};

const CampaignFirstDraftMobile = ({
  campaign,
  timeline,
  submission,
  getDependency,
  fullSubmission,
  openLogisticTab,
  setCurrentTab,
  deliverablesData,
}) => {
  const [preview, setPreview] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const dependency = getDependency(submission?.id);
  const { socket } = useSocketContext();
  const [progress, setProgress] = useState(0);

  const display = useBoolean();
  const { user, dispatch } = useAuthContext();
  const router = useRouter();

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

  // Add state variables for fullscreen modal navigation
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
    if (!socket) return undefined;

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
    setUploadTypeModalOpen(false);
    
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
    setCurrentImageIndex((prev) => {
      const photosLength = submission?.photos?.length || 0;
      return prev === 0 ? photosLength - 1 : prev - 1;
    });
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => {
      const photosLength = submission?.photos?.length || 0;
      return prev === photosLength - 1 ? 0 : prev + 1;
    });
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

  return (
    <Container maxWidth="sm" sx={{ py: 2, px: 3 }}>
      {/* Header */}
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Button
          color="inherit"
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
          onClick={() => router.back()}
          sx={{
            alignSelf: 'flex-start',
            color: '#636366',
            fontSize: '0.9rem',
            fontWeight: 600,
            ml: -1,
          }}
        >
          Overview
        </Button>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            fontSize: '1.5rem',
            color: '#221f20',
          }}
        >
          Draft Submission 📝
        </Typography>

        <Typography variant="subtitle2" color="text.secondary">
          Due: {dayjs(submission?.dueDate).format('MMM DD, YYYY')}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {previousSubmission?.status === 'APPROVED' && (
        <>
          {logistics?.every((logistic) => logistic?.status === 'Product_has_been_received') ? (
            <>
              {submission?.status === 'PENDING_REVIEW' && (
                <Stack justifyContent="center" alignItems="center" spacing={2} sx={{ py: 8 }}>
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
                    }}
                  >
                    ⏳
                  </Box>
                  <Stack spacing={1} alignItems="center">
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: 'Instrument Serif, serif',
                        fontWeight: 550,
                      }}
                    >
                      In Review
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#636366', textAlign: 'center' }}>
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

              {submission?.status === 'APPROVED' && (
                <Stack justifyContent="center" alignItems="center" spacing={3} sx={{ py: 8 }}>
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      bgcolor: '#5abc6f',
                      fontSize: '50px',
                    }}
                  >
                    ✅
                  </Box>
                  <Stack spacing={1} alignItems="center">
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: 'Instrument Serif, serif',
                        fontWeight: 550,
                        fontSize: '2rem',
                      }}
                    >
                      Draft Approved!
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#636366', textAlign: 'center' }}>
                      Your first draft has been approved.
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
                <Stack gap={3}>
                  <Box>
                    <Typography variant="body1" sx={{ color: '#221f20', mb: 2 }}>
                      It&apos;s time to submit your first draft for this campaign!
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#221f20', mb: 3 }}>
                      Do ensure to read through the brief, and the do&apos;s and dont&apos;s for
                      the creatives over at the{' '}
                      <Box
                        component="span"
                        onClick={() => setCurrentTab('info')}
                        sx={{
                          color: '#203ff5',
                          cursor: 'pointer',
                          fontWeight: 650,
                          textDecoration: 'underline',
                          '&:hover': {
                            opacity: 0.8,
                          },
                        }}
                      >
                        Campaign Details
                      </Box>{' '}
                      page.
                    </Typography>

                    {/* Upload Progress */}
                    {uploadProgress.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                          Upload Progress
                        </Typography>
                        <Stack spacing={2}>
                          {uploadProgress.map((item, index) => (
                            <Box
                              key={index}
                              sx={{
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                bgcolor: 'background.neutral',
                              }}
                            >
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar
                                  sx={{
                                    bgcolor: item.progress === 100 ? '#5abc6f' : '#f4b84a',
                                    width: 40,
                                    height: 40,
                                  }}
                                >
                                  <Iconify 
                                    icon={
                                      item.progress === 100 
                                        ? "mingcute:check-circle-fill" 
                                        : "mdi:clock"
                                    } 
                                    width={20} 
                                  />
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="subtitle2" noWrap>
                                    {truncateText(item.fileName, 30)}
                                  </Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={item.progress}
                                    sx={{
                                      mt: 1,
                                      height: 6,
                                      borderRadius: 3,
                                      bgcolor: alpha('#000', 0.1),
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: item.progress === 100 ? '#5abc6f' : '#f4b84a',
                                        borderRadius: 3,
                                      },
                                    }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {item.progress}% • {formatFileSize(item.fileSize || 0)}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* Deliverables incomplete message */}
                    {(!submission?.video?.length || 
                      (campaign.rawFootage && !submission?.rawFootages?.length) || 
                      (campaign.photos && !submission?.photos?.length)) && (
                      <Box sx={{ mt: 2, mb: 3 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            color: '#231F20', 
                            fontWeight: 600,
                            mb: 0.5,
                            fontSize: '0.9rem'
                          }}
                        >
                          Deliverables Incomplete
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#636366', fontSize: '0.8rem' }}>
                          Please complete all deliverables to ensure your submission goes through.
                        </Typography>
                      </Box>
                    )}

                    {/* Upload Buttons */}
                    <Stack spacing={1.5}>
                      {/* Draft Video Button */}
                      <Box
                        onClick={() => {
                          if (!submission?.video?.length && submission?.status !== 'PENDING_REVIEW') {
                            setDraftVideoModalOpen(true);
                          }
                        }}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: submission?.video?.length > 0 ? '#5abc6f' : '#e7e7e7',
                          borderBottom: submission?.video?.length > 0 ? '3px solid #5abc6f' : '3px solid #e7e7e7',
                          borderRadius: 1.5,
                          bgcolor: submission?.video?.length > 0 ? alpha('#5abc6f', 0.08) : 'background.paper',
                          cursor: submission?.video?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 'not-allowed' : 'pointer',
                          opacity: submission?.video?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          minHeight: '72px',
                          '&:hover': {
                            transform: submission?.video?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 'none' : 'translateY(-1px)',
                            borderColor: submission?.video?.length > 0 ? '#5abc6f' : '#d0d0d0',
                            boxShadow: submission?.video?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                          },
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar
                            sx={{
                              bgcolor: submission?.video?.length > 0 ? '#5abc6f' : '#203ff5',
                              width: 40,
                              height: 40,
                            }}
                          >
                            <Iconify icon="eva:video-outline" width={20} />
                          </Avatar>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 600, 
                                mb: 0.25,
                                fontSize: '0.95rem',
                                lineHeight: 1.3,
                              }}
                            >
                              Draft Video
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{
                                fontSize: '0.75rem',
                                lineHeight: 1.2,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {getButtonSecondaryText(
                                submission?.status,
                                submission?.video?.length > 0,
                                'Upload your main draft video for the campaign'
                              )}
                            </Typography>
                          </Box>
                          {submission?.video?.length > 0 && (
                            <Iconify icon="mingcute:check-circle-fill" sx={{ color: '#5abc6f', width: 20, height: 20, flexShrink: 0 }} />
                          )}
                        </Stack>
                      </Box>

                      {/* Raw Footage Button */}
                      {campaign.rawFootage && (
                        <Box
                          onClick={() => {
                            if (!submission?.rawFootages?.length && submission?.status !== 'PENDING_REVIEW') {
                              setRawFootageModalOpen(true);
                            }
                          }}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: submission?.rawFootages?.length > 0 ? '#5abc6f' : '#e7e7e7',
                            borderBottom: submission?.rawFootages?.length > 0 ? '3px solid #5abc6f' : '3px solid #e7e7e7',
                            borderRadius: 1.5,
                            bgcolor: submission?.rawFootages?.length > 0 ? alpha('#5abc6f', 0.08) : 'background.paper',
                            cursor: submission?.rawFootages?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 'not-allowed' : 'pointer',
                            opacity: submission?.rawFootages?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 0.7 : 1,
                            transition: 'all 0.2s ease',
                            minHeight: '72px',
                            '&:hover': {
                              transform: submission?.rawFootages?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 'none' : 'translateY(-1px)',
                              borderColor: submission?.rawFootages?.length > 0 ? '#5abc6f' : '#d0d0d0',
                              boxShadow: submission?.rawFootages?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                            },
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar
                              sx={{
                                bgcolor: submission?.rawFootages?.length > 0 ? '#5abc6f' : '#203ff5',
                                width: 40,
                                height: 40,
                              }}
                            >
                              <Iconify icon="eva:film-outline" width={20} />
                            </Avatar>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                  fontWeight: 600, 
                                  mb: 0.25,
                                  fontSize: '0.95rem',
                                  lineHeight: 1.3,
                                }}
                              >
                                Raw Footage
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{
                                  fontSize: '0.75rem',
                                  lineHeight: 1.2,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                                              {getButtonSecondaryText(
                                submission?.status,
                                submission?.rawFootages?.length > 0,
                                'Upload raw, unedited footage from your shoot'
                              )}
                              </Typography>
                            </Box>
                            {submission?.rawFootages?.length > 0 && (
                              <Iconify icon="mingcute:check-circle-fill" sx={{ color: '#5abc6f', width: 20, height: 20, flexShrink: 0 }} />
                            )}
                          </Stack>
                        </Box>
                      )}

                      {/* Photos Button */}
                      {campaign.photos && (
                        <Box
                          onClick={() => {
                            if (!submission?.photos?.length && submission?.status !== 'PENDING_REVIEW') {
                              setPhotosModalOpen(true);
                            }
                          }}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: submission?.photos?.length > 0 ? '#5abc6f' : '#e7e7e7',
                            borderBottom: submission?.photos?.length > 0 ? '3px solid #5abc6f' : '3px solid #e7e7e7',
                            borderRadius: 1.5,
                            bgcolor: submission?.photos?.length > 0 ? alpha('#5abc6f', 0.08) : 'background.paper',
                            cursor: submission?.photos?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 'not-allowed' : 'pointer',
                            opacity: submission?.photos?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 0.7 : 1,
                            transition: 'all 0.2s ease',
                            minHeight: '72px',
                            '&:hover': {
                              transform: submission?.photos?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 'none' : 'translateY(-1px)',
                              borderColor: submission?.photos?.length > 0 ? '#5abc6f' : '#d0d0d0',
                              boxShadow: submission?.photos?.length > 0 || submission?.status === 'PENDING_REVIEW' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                            },
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar
                              sx={{
                                bgcolor: submission?.photos?.length > 0 ? '#5abc6f' : '#203ff5',
                                width: 40,
                                height: 40,
                              }}
                            >
                              <Iconify icon="eva:image-outline" width={20} />
                            </Avatar>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                  fontWeight: 600, 
                                  mb: 0.25,
                                  fontSize: '0.95rem',
                                  lineHeight: 1.3,
                                }}
                              >
                                Photos
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{
                                  fontSize: '0.75rem',
                                  lineHeight: 1.2,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                                              {getButtonSecondaryText(
                                submission?.status,
                                submission?.photos?.length > 0,
                                'Upload photos from your campaign shoot'
                              )}
                              </Typography>
                            </Box>
                            {submission?.photos?.length > 0 && (
                              <Iconify icon="mingcute:check-circle-fill" sx={{ color: '#5abc6f', width: 20, height: 20, flexShrink: 0 }} />
                            )}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              )}

              {submission?.status === 'CHANGES_REQUIRED' && (
                <Stack gap={3}>
                  <Stack justifyContent="center" alignItems="center" spacing={2} sx={{ mb: -3 }}>
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
                      }}
                    >
                      ✏️
                    </Box>

                    <Stack spacing={1} alignItems="center">
                      <Typography
                        variant="h5"
                        sx={{
                          fontFamily: 'Instrument Serif, serif',
                          fontWeight: 550,
                          fontSize: { xs: '2rem', sm: '2.5rem', md: '2.5rem' },
                        }}
                      >
                        Needs Revision
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#636366', textAlign: 'center' }}>
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
                      <Stack spacing={2}>
                        {submission.feedback
                          .filter(feedback => 
                            feedback.type === 'REQUEST' && (
                              feedback.videosToUpdate?.length > 0 || 
                              feedback.photosToUpdate?.length > 0 || 
                              feedback.rawFootageToUpdate?.length > 0
                            )
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
                                {/* Videos */}
                                {feedback.videosToUpdate && feedback.videosToUpdate.length > 0 && deliverables?.videos && (
                                  <Box>
                                    <Box sx={{ mb: 2 }}>
                                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                          <Iconify icon="eva:video-outline" sx={{ color: '#636366', width: 14, height: 14 }} />
                                          <Typography 
                                            variant="caption" 
                                            sx={{ 
                                              color: '#636366', 
                                              display: 'block', 
                                              textTransform: 'uppercase', 
                                              letterSpacing: '0.5px', 
                                              fontWeight: 600 
                                            }}
                                          >
                                            Draft Videos
                                          </Typography>
                                        </Stack>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                          {deliverables?.videos?.filter(video => video.status === 'APPROVED').length > 0 && (
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                              <Iconify icon="eva:checkmark-fill" sx={{ color: '#1DBF66', width: 14, height: 14 }} />
                                              <Typography variant="caption" sx={{ color: '#1DBF66', fontWeight: 600, fontSize: '11px' }}>
                                                {deliverables.videos.filter(video => video.status === 'APPROVED').length}
                                              </Typography>
                                            </Stack>
                                          )}
                                          {feedback.videosToUpdate && feedback.videosToUpdate.length > 0 && (
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                              <Iconify icon="eva:close-fill" sx={{ color: '#D4321C', width: 14, height: 14 }} />
                                              <Typography variant="caption" sx={{ color: '#D4321C', fontWeight: 600, fontSize: '11px' }}>
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
                                        .filter(video => feedback.videosToUpdate.includes(video.id))
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
                                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                                <Avatar
                                                  src={feedback.admin?.photoURL}
                                                  sx={{ width: 32, height: 32 }}
                                                >
                                                  {feedback.admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                                                </Avatar>
                                                <Box sx={{ flexGrow: 1 }}>
                                                  <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#212529', fontSize: '0.8rem'  }}>
                                                      {feedback.admin?.name || 'Admin'}
                                                    </Typography>
                                                    <Chip
                                                      label={feedback.admin?.role ? feedback.admin.role.charAt(0).toUpperCase() + feedback.admin.role.slice(1) : 'Admin'}
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
                                                  <Typography variant="caption" sx={{ color: '#6c757d', fontSize: '0.7rem', mb: -1 }}>
                                                    {dayjs(feedback.createdAt).format('MMM D, YYYY h:mm A')}
                                                  </Typography>
                                                </Box>
                                                {feedback.type === 'REQUEST' && (
                                                  <Box
                                                    sx={{
                                                      bgcolor: '#FFFFFF',
                                                      color: '#D4321C',
                                                      border: '1.5px solid',
                                                      borderColor: '#D4321C',
                                                      borderBottom: 2.5,
                                                      borderBottomColor: '#D4321C',
                                                      borderRadius: 0.8,
                                                      py: 0.5,
                                                      px: 1,
                                                      fontWeight: 600,
                                                      fontSize: '0.65rem',
                                                      height: '24px',
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
                                                <Typography variant="body2" sx={{ color: '#495057', mt: 1.5, lineHeight: 1.5, fontSize: '0.875rem', mb: 2 }}>
                                                  {feedback.content}
                                                </Typography>
                                              )}

                                              {/* Video and Reasons side by side */}
                                              <Stack direction="row" spacing={2} alignItems="flex-start">
                                                {/* Video */}
                                                <Box
                                                  sx={{
                                                    border: '2px solid #D4321C',
                                                    borderRadius: 1.5,
                                                    overflow: 'hidden',
                                                    bgcolor: '#ffffff',
                                                    cursor: 'pointer',
                                                    width: '150px',
                                                    flexShrink: 0,
                                                    '&:hover': {
                                                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                    },
                                                  }}
                                                  onClick={() => handleVideoClick(deliverables.videos.filter(v => feedback.videosToUpdate.includes(v.id)), index)}
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
                                                </Box>

                                                {/* Reasons */}
                                                {feedback.reasons && feedback.reasons.length > 0 && (
                                                  <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" sx={{ color: '#000000', mb: 1, display: 'block', fontWeight: 600, fontSize: '0.75rem' }}>
                                                      Reasons:
                                                    </Typography>
                                                    <Stack spacing={0.5}>
                                                      {feedback.reasons.map((reason, reasonIndex) => (
                                                        <Chip
                                                          key={reasonIndex}
                                                          label={reason}
                                                          size="small"
                                                          sx={{
                                                            borderRadius: 1,
                                                            bgcolor: '#fff3cd',
                                                            color: '#856404',
                                                            fontSize: '0.7rem',
                                                            height: '24px',
                                                            fontWeight: 600,
                                                            justifyContent: 'flex-start',
                                                            border: '1px solid #e0c46b',
                                                            '&:hover': {
                                                              bgcolor: '#fff3cd',
                                                              color: '#856404',
                                                            },
                                                          }}
                                                        />
                                                      ))}
                                                    </Stack>
                                                  </Box>
                                                )}
                                              </Stack>
                                            </Box>
                                          </Box>
                                        ))}
                                    </Stack>

                                    {/* Approved Draft Videos */}
                                    {deliverables?.videos?.filter(video => video.status === 'APPROVED').length > 0 && (
                                      <Box sx={{ mt: 3 }}>
                                        <Box sx={{ height: '1px', bgcolor: '#e0e0e0', mt: -1, mb: 2 }} />
                                        {(() => {
                                          const approvedVideos = deliverables.videos.filter(video => video.status === 'APPROVED');
                                          
                                          // Get all unique feedback for approved videos
                                          const approvalFeedbacks = submission?.feedback?.filter(fb => 
                                            (fb.type === 'APPROVAL' || fb.type === 'COMMENT') && 
                                            fb.videosToUpdate?.some(videoId => approvedVideos.some(v => v.id === videoId))
                                          ) || [];
                                          
                                          // Use the most recent feedback or create a default one
                                          const mainFeedback = approvalFeedbacks.length > 0 
                                            ? approvalFeedbacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
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
                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                  <Avatar
                                                    src={mainFeedback?.admin?.photoURL}
                                                    sx={{ width: 32, height: 32 }}
                                                  >
                                                    {mainFeedback?.admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                                                  </Avatar>
                                                  <Box sx={{ flexGrow: 1 }}>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#212529', fontSize: '0.8rem'  }}>
                                                        {mainFeedback?.admin?.name || 'Admin'}
                                                      </Typography>
                                                      <Chip
                                                        label={mainFeedback?.admin?.role ? mainFeedback.admin.role.charAt(0).toUpperCase() + mainFeedback.admin.role.slice(1) : 'Admin'}
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
                                                    <Typography variant="caption" sx={{ color: '#6c757d', fontSize: '0.7rem', mb: -1 }}>
                                                      {mainFeedback?.createdAt ? dayjs(mainFeedback.createdAt).format('MMM D, YYYY h:mm A') : 'Recently approved'}
                                                    </Typography>
                                                  </Box>
                                                  <Box
                                                    sx={{
                                                      bgcolor: '#FFFFFF',
                                                      color: '#1DBF66',
                                                      border: '1.5px solid',
                                                      borderColor: '#1DBF66',
                                                      borderBottom: 2.5,
                                                      borderBottomColor: '#1DBF66',
                                                      borderRadius: 0.8,
                                                      py: 0.5,
                                                      px: 1,
                                                      fontWeight: 600,
                                                      fontSize: '0.65rem',
                                                      height: '24px',
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
                                                    const videoFeedback = approvalFeedbacks.find(fb => 
                                                      fb.videosToUpdate?.includes(video.id)
                                                    );
                                                    
                                                    return videoFeedback?.content ? (
                                                      <Typography 
                                                        key={video.id}
                                                        variant="body2" 
                                                        sx={{ 
                                                          color: '#495057', 
                                                          lineHeight: 1.5, 
                                                          fontSize: '0.875rem',
                                                          mb: index < approvedVideos.length - 1 ? 1 : 0
                                                        }}
                                                      >
                                                        {approvedVideos.length > 1 && (
                                                          <Box component="span" sx={{ fontWeight: 600, color: '#1DBF66' }}>
                                                            {index + 1}.{' '}
                                                          </Box>
                                                        )}
                                                        {videoFeedback.content}
                                                      </Typography>
                                                    ) : null;
                                                  })}
                                                  {!approvalFeedbacks.some(fb => fb.content) && (
                                                    <Typography variant="body2" sx={{ color: '#495057', lineHeight: 1.5, fontSize: '0.875rem' }}>
                                                      All videos have been approved.
                                                    </Typography>
                                                  )}
                                                </Box>

                                                {/* Videos Grid */}
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
                                                        width: approvedVideos.length === 1 ? '150px' : '120px',
                                                        flexShrink: 0,
                                                        '&:hover': {
                                                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                        },
                                                      }}
                                                      onClick={() => handleVideoClick(approvedVideos, index)}
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
                                                              width: 24,
                                                              height: 24,
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
                                                            top: 6,
                                                            left: 6,
                                                            bgcolor: '#1DBF66',
                                                            color: 'white',
                                                            borderRadius: '50%',
                                                            width: 18,
                                                            height: 18,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.7rem',
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

                                {/* Photos */}
                                {feedback.photosToUpdate && feedback.photosToUpdate.length > 0 && deliverables?.photos && (
                                  <Box>
                                    <Box sx={{ mb: 2 }}>
                                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                          <Iconify icon="eva:image-outline" sx={{ color: '#636366', width: 14, height: 14 }} />
                                          <Typography 
                                            variant="caption" 
                                            sx={{ 
                                              color: '#636366', 
                                              display: 'block', 
                                              textTransform: 'uppercase', 
                                              letterSpacing: '0.5px', 
                                              fontWeight: 600 
                                            }}
                                          >
                                            Photos
                                          </Typography>
                                        </Stack>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                          {deliverables?.photos?.filter(photo => photo.status === 'APPROVED').length > 0 && (
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                              <Iconify icon="eva:checkmark-fill" sx={{ color: '#1DBF66', width: 14, height: 14 }} />
                                              <Typography variant="caption" sx={{ color: '#1DBF66', fontWeight: 600, fontSize: '11px' }}>
                                                {deliverables.photos.filter(photo => photo.status === 'APPROVED').length}
                                              </Typography>
                                            </Stack>
                                          )}
                                          {feedback.photosToUpdate && feedback.photosToUpdate.length > 0 && (
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                              <Iconify icon="eva:close-fill" sx={{ color: '#D4321C', width: 14, height: 14 }} />
                                              <Typography variant="caption" sx={{ color: '#D4321C', fontWeight: 600, fontSize: '11px' }}>
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
                                        .filter(photo => feedback.photosToUpdate.includes(photo.id))
                                        .map((photo, index) => (
                                          <Box key={photo.id}>
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
                                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                                <Avatar
                                                  src={feedback.admin?.photoURL}
                                                  sx={{ width: 32, height: 32 }}
                                                >
                                                  {feedback.admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                                                </Avatar>
                                                <Box sx={{ flexGrow: 1 }}>
                                                  <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#212529', fontSize: '0.8rem'  }}>
                                                      {feedback.admin?.name || 'Admin'}
                                                    </Typography>
                                                    <Chip
                                                      label={feedback.admin?.role ? feedback.admin.role.charAt(0).toUpperCase() + feedback.admin.role.slice(1) : 'Admin'}
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
                                                  <Typography variant="caption" sx={{ color: '#6c757d', fontSize: '0.7rem', mb: -1 }}>
                                                    {dayjs(feedback.createdAt).format('MMM D, YYYY h:mm A')}
                                                  </Typography>
                                                </Box>
                                                {feedback.type === 'REQUEST' && (
                                                  <Box
                                                    sx={{
                                                      bgcolor: '#FFFFFF',
                                                      color: '#D4321C',
                                                      border: '1.5px solid',
                                                      borderColor: '#D4321C',
                                                      borderBottom: 2.5,
                                                      borderBottomColor: '#D4321C',
                                                      borderRadius: 0.8,
                                                      py: 0.5,
                                                      px: 1,
                                                      fontWeight: 600,
                                                      fontSize: '0.65rem',
                                                      height: '24px',
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
                                                <Typography variant="body2" sx={{ color: '#495057', mt: 1.5, lineHeight: 1.5, fontSize: '0.875rem', mb: 2 }}>
                                                  {feedback.photoContent}
                                                </Typography>
                                              )}

                                              {/* Photo */}
                                              <Box
                                                sx={{
                                                  border: '2px solid #D4321C',
                                                  borderRadius: 1.5,
                                                  overflow: 'hidden',
                                                  bgcolor: '#ffffff',
                                                  cursor: 'pointer',
                                                  width: '150px',
                                                  flexShrink: 0,
                                                  '&:hover': {
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                  },
                                                }}
                                                onClick={() => handlePhotoClick(deliverables.photos.filter(p => feedback.photosToUpdate.includes(p.id)), index)}
                                              >
                                                <Box
                                                  component="img"
                                                  src={photo.url}
                                                  alt={`Photo ${index + 1}`}
                                                  sx={{
                                                    width: '100%',
                                                    height: 120,
                                                    objectFit: 'cover',
                                                  }}
                                                />
                                              </Box>
                                            </Box>
                                          </Box>
                                        ))}
                                    </Stack>

                                    {/* Approved Photos */}
                                    {deliverables?.photos?.filter(photo => photo.status === 'APPROVED').length > 0 && (
                                      <Box sx={{ mt: 3 }}>
                                        <Box sx={{ height: '1px', bgcolor: '#e0e0e0', mb: 2 }} />
                                        {(() => {
                                          const approvedPhotos = deliverables.photos.filter(photo => photo.status === 'APPROVED');
                                          
                                          // Get all unique feedback for approved photos
                                          const approvalFeedbacks = submission?.feedback?.filter(fb => 
                                            (fb.type === 'APPROVAL' || fb.type === 'COMMENT') && 
                                            fb.photosToUpdate?.some(photoId => approvedPhotos.some(p => p.id === photoId))
                                          ) || [];
                                          
                                          // Use the most recent feedback or create a default one
                                          const mainFeedback = approvalFeedbacks.length > 0 
                                            ? approvalFeedbacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
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
                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                  <Avatar
                                                    src={mainFeedback?.admin?.photoURL}
                                                    sx={{ width: 32, height: 32 }}
                                                  >
                                                    {mainFeedback?.admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                                                  </Avatar>
                                                  <Box sx={{ flexGrow: 1 }}>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#212529', fontSize: '0.8rem'  }}>
                                                        {mainFeedback?.admin?.name || 'Admin'}
                                                      </Typography>
                                                      <Chip
                                                        label={mainFeedback?.admin?.role ? mainFeedback.admin.role.charAt(0).toUpperCase() + mainFeedback.admin.role.slice(1) : 'Admin'}
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
                                                    <Typography variant="caption" sx={{ color: '#6c757d', fontSize: '0.7rem', mb: -1 }}>
                                                      {mainFeedback?.createdAt ? dayjs(mainFeedback.createdAt).format('MMM D, YYYY h:mm A') : 'Recently approved'}
                                                    </Typography>
                                                  </Box>
                                                  <Box
                                                    sx={{
                                                      bgcolor: '#FFFFFF',
                                                      color: '#1DBF66',
                                                      border: '1.5px solid',
                                                      borderColor: '#1DBF66',
                                                      borderBottom: 2.5,
                                                      borderBottomColor: '#1DBF66',
                                                      borderRadius: 0.8,
                                                      py: 0.5,
                                                      px: 1,
                                                      fontWeight: 600,
                                                      fontSize: '0.65rem',
                                                      height: '24px',
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
                                                    const photoFeedback = approvalFeedbacks.find(fb => 
                                                      fb.photosToUpdate?.includes(photo.id)
                                                    );
                                                    
                                                    return photoFeedback?.photoContent ? (
                                                      <Typography 
                                                        key={photo.id}
                                                        variant="body2" 
                                                        sx={{ 
                                                          color: '#495057', 
                                                          lineHeight: 1.5, 
                                                          fontSize: '0.875rem',
                                                          mb: index < approvedPhotos.length - 1 ? 1 : 0
                                                        }}
                                                      >
                                                        {approvedPhotos.length > 1 && (
                                                          <Box component="span" sx={{ fontWeight: 600, color: '#1DBF66' }}>
                                                            {index + 1}.{' '}
                                                          </Box>
                                                        )}
                                                        {photoFeedback.photoContent}
                                                      </Typography>
                                                    ) : null;
                                                  })}
                                                  {!approvalFeedbacks.some(fb => fb.photoContent) && (
                                                    <Typography variant="body2" sx={{ color: '#495057', lineHeight: 1.5, fontSize: '0.875rem' }}>
                                                      All photos have been approved.
                                                    </Typography>
                                                  )}
                                                </Box>

                                                {/* Photos Grid */}
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
                                                        width: approvedPhotos.length === 1 ? '150px' : '120px',
                                                        flexShrink: 0,
                                                        '&:hover': {
                                                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                        },
                                                      }}
                                                      onClick={() => handlePhotoClick(approvedPhotos, index)}
                                                    >
                                                      <Box
                                                        component="img"
                                                        src={photo.url}
                                                        alt={`Approved Photo ${index + 1}`}
                                                        sx={{
                                                          width: '100%',
                                                          height: approvedPhotos.length === 1 ? 120 : 100,
                                                          objectFit: 'cover',
                                                        }}
                                                      />
                                                      {/* Photo Number Badge */}
                                                      {approvedPhotos.length > 1 && (
                                                        <Box
                                                          sx={{
                                                            position: 'absolute',
                                                            top: 6,
                                                            left: 6,
                                                            bgcolor: '#1DBF66',
                                                            color: 'white',
                                                            borderRadius: '50%',
                                                            width: 18,
                                                            height: 18,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.7rem',
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

                                {/* Raw Footage */}
                                {feedback.rawFootageToUpdate && feedback.rawFootageToUpdate.length > 0 && deliverables?.rawFootages && (
                                  <Box>
                                    <Box sx={{ mb: 2 }}>
                                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                          <Iconify icon="eva:film-outline" sx={{ color: '#636366', width: 14, height: 14 }} />
                                          <Typography 
                                            variant="caption" 
                                            sx={{ 
                                              color: '#636366', 
                                              display: 'block', 
                                              textTransform: 'uppercase', 
                                              letterSpacing: '0.5px', 
                                              fontWeight: 600 
                                            }}
                                          >
                                            Raw Footage
                                          </Typography>
                                        </Stack>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                          {deliverables?.rawFootages?.filter(footage => footage.status === 'APPROVED').length > 0 && (
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                              <Iconify icon="eva:checkmark-fill" sx={{ color: '#1DBF66', width: 14, height: 14 }} />
                                              <Typography variant="caption" sx={{ color: '#1DBF66', fontWeight: 600, fontSize: '11px' }}>
                                                {deliverables.rawFootages.filter(footage => footage.status === 'APPROVED').length}
                                              </Typography>
                                            </Stack>
                                          )}
                                          {feedback.rawFootageToUpdate && feedback.rawFootageToUpdate.length > 0 && (
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                              <Iconify icon="eva:close-fill" sx={{ color: '#D4321C', width: 14, height: 14 }} />
                                              <Typography variant="caption" sx={{ color: '#D4321C', fontWeight: 600, fontSize: '11px' }}>
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
                                        .filter(footage => feedback.rawFootageToUpdate.includes(footage.id))
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
                                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                                <Avatar
                                                  src={feedback.admin?.photoURL}
                                                  sx={{ width: 32, height: 32 }}
                                                >
                                                  {feedback.admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                                                </Avatar>
                                                <Box sx={{ flexGrow: 1 }}>
                                                  <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#212529', fontSize: '0.8rem'  }}>
                                                      {feedback.admin?.name || 'Admin'}
                                                    </Typography>
                                                    <Chip
                                                      label={feedback.admin?.role ? feedback.admin.role.charAt(0).toUpperCase() + feedback.admin.role.slice(1) : 'Admin'}
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
                                                  <Typography variant="caption" sx={{ color: '#6c757d', fontSize: '0.7rem', mb: -1 }}>
                                                    {dayjs(feedback.createdAt).format('MMM D, YYYY h:mm A')}
                                                  </Typography>
                                                </Box>
                                                {feedback.type === 'REQUEST' && (
                                                  <Box
                                                    sx={{
                                                      bgcolor: '#FFFFFF',
                                                      color: '#D4321C',
                                                      border: '1.5px solid',
                                                      borderColor: '#D4321C',
                                                      borderBottom: 2.5,
                                                      borderBottomColor: '#D4321C',
                                                      borderRadius: 0.8,
                                                      py: 0.5,
                                                      px: 1,
                                                      fontWeight: 600,
                                                      fontSize: '0.65rem',
                                                      height: '24px',
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
                                                <Typography variant="body2" sx={{ color: '#495057', mt: 1.5, lineHeight: 1.5, fontSize: '0.875rem', mb: 2 }}>
                                                  {feedback.rawFootageContent}
                                                </Typography>
                                              )}

                                              {/* Raw Footage */}
                                              <Box
                                                sx={{
                                                  border: '2px solid #D4321C',
                                                  borderRadius: 1.5,
                                                  overflow: 'hidden',
                                                  bgcolor: '#ffffff',
                                                  cursor: 'pointer',
                                                  width: '150px',
                                                  flexShrink: 0,
                                                  '&:hover': {
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                  },
                                                }}
                                                onClick={() => handleVideoClick(deliverables.rawFootages.filter(f => feedback.rawFootageToUpdate.includes(f.id)), index)}
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
                                              </Box>
                                            </Box>
                                          </Box>
                                        ))}
                                    </Stack>

                                    {/* Approved Raw Footage */}
                                    {deliverables?.rawFootages?.filter(footage => footage.status === 'APPROVED').length > 0 && (
                                      <Box sx={{ mt: 3 }}>
                                        <Box sx={{ height: '1px', bgcolor: '#e0e0e0', mb: 2 }} />
                                        {(() => {
                                          const approvedRawFootages = deliverables.rawFootages.filter(footage => footage.status === 'APPROVED');
                                          
                                          // Get all unique feedback for approved raw footages
                                          const approvalFeedbacks = submission?.feedback?.filter(fb => 
                                            (fb.type === 'APPROVAL' || fb.type === 'COMMENT') && 
                                            fb.rawFootageToUpdate?.some(footageId => approvedRawFootages.some(f => f.id === footageId))
                                          ) || [];
                                          
                                          // Use the most recent feedback or create a default one
                                          const mainFeedback = approvalFeedbacks.length > 0 
                                            ? approvalFeedbacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
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
                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                  <Avatar
                                                    src={mainFeedback?.admin?.photoURL}
                                                    sx={{ width: 32, height: 32 }}
                                                  >
                                                    {mainFeedback?.admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                                                  </Avatar>
                                                  <Box sx={{ flexGrow: 1 }}>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#212529', fontSize: '0.8rem'  }}>
                                                        {mainFeedback?.admin?.name || 'Admin'}
                                                      </Typography>
                                                      <Chip
                                                        label={mainFeedback?.admin?.role ? mainFeedback.admin.role.charAt(0).toUpperCase() + mainFeedback.admin.role.slice(1) : 'Admin'}
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
                                                    <Typography variant="caption" sx={{ color: '#6c757d', fontSize: '0.7rem', mb: -1 }}>
                                                      {mainFeedback?.createdAt ? dayjs(mainFeedback.createdAt).format('MMM D, YYYY h:mm A') : 'Recently approved'}
                                                    </Typography>
                                                  </Box>
                                                  <Box
                                                    sx={{
                                                      bgcolor: '#FFFFFF',
                                                      color: '#1DBF66',
                                                      border: '1.5px solid',
                                                      borderColor: '#1DBF66',
                                                      borderBottom: 2.5,
                                                      borderBottomColor: '#1DBF66',
                                                      borderRadius: 0.8,
                                                      py: 0.5,
                                                      px: 1,
                                                      fontWeight: 600,
                                                      fontSize: '0.65rem',
                                                      height: '24px',
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
                                                    const footageFeedback = approvalFeedbacks.find(fb => 
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
                                                          mb: index < approvedRawFootages.length - 1 ? 1 : 0
                                                        }}
                                                      >
                                                        {approvedRawFootages.length > 1 && (
                                                          <Box component="span" sx={{ fontWeight: 600, color: '#1DBF66' }}>
                                                            {index + 1}.{' '}
                                                          </Box>
                                                        )}
                                                        {footageFeedback.rawFootageContent}
                                                      </Typography>
                                                    ) : null;
                                                  })}
                                                  {!approvalFeedbacks.some(fb => fb.rawFootageContent) && (
                                                    <Typography variant="body2" sx={{ color: '#495057', lineHeight: 1.5, fontSize: '0.875rem' }}>
                                                      All raw footage has been approved.
                                                    </Typography>
                                                  )}
                                                </Box>

                                                {/* Raw Footages Grid */}
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
                                                        width: approvedRawFootages.length === 1 ? '150px' : '120px',
                                                        flexShrink: 0,
                                                        '&:hover': {
                                                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                        },
                                                      }}
                                                      onClick={() => handleVideoClick(approvedRawFootages, index)}
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
                                                              width: 24,
                                                              height: 24,
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
                                                            top: 6,
                                                            left: 6,
                                                            bgcolor: '#1DBF66',
                                                            color: 'white',
                                                            borderRadius: '50%',
                                                            width: 18,
                                                            height: 18,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.7rem',
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
                </Stack>
              )}
            </>
          ) : (
            <Stack justifyContent="center" alignItems="center" spacing={3} sx={{ py: 8 }}>
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
                }}
              >
                📦
              </Box>
              <Stack spacing={1} alignItems="center">
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: 'Instrument Serif, serif',
                    fontWeight: 550,
                  }}
                >
                  Waiting for Products
                </Typography>
                <Typography variant="body1" sx={{ color: '#636366', textAlign: 'center' }}>
                  Please wait for all products to be received before starting your draft.
                </Typography>
              </Stack>
              <Button
                variant="contained"
                onClick={openLogisticTab}
                sx={{
                  bgcolor: '#203ff5',
                  color: 'white',
                  borderBottom: 3.5,
                  borderBottomColor: '#112286',
                  borderRadius: 1.5,
                  px: 3,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: '#203ff5',
                    opacity: 0.9,
                  },
                }}
              >
                Check Logistics
              </Button>
            </Stack>
          )}
        </>
      )}

      {/* Fullscreen Preview Modal */}
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
            top: { xs: 80, md: 90 },
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
                  bgcolor: tabIndex === (submission?.rawFootages?.length > 0 ? 2 : 1) ? '#1340ff' : 'transparent',
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
                    backgroundColor: tabIndex === (submission?.rawFootages?.length > 0 ? 2 : 1) ? 'transparent' : '#5A5A5C',
                  },
                  '&:hover': {
                    bgcolor: tabIndex === (submission?.rawFootages?.length > 0 ? 2 : 1) ? '#1340ff' : 'transparent',
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
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            pt: { xs: '140px', md: '150px' },
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
                  width: '100%',
                  height: submission?.caption ? 'calc(50vh - 80px)' : 'calc(100vh - 180px)',
                  maxWidth: '100%',
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
                ).map((videoItem, index) => (
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
                ))}

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
                          const totalVideos = (campaign?.campaignCredits && deliverables?.videos?.length > 0
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
                          const totalVideos = (campaign?.campaignCredits && deliverables?.videos?.length > 0
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

              {/* Caption Panel - Bottom on Mobile */}
              {submission?.caption && (
                <Box
                  sx={{
                    width: '100%',
                    height: 'calc(50vh - 80px)',
                    minHeight: '150px',
                    bgcolor: 'transparent',
                    border: '1px solid #28292C',
                    borderRadius: '8px',
                    p: 2,
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
                      fontSize: '13px',
                      mb: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flexShrink: 0,
                    }}
                  >
                    <Iconify
                      icon="solar:text-bold"
                      sx={{
                        width: 14,
                        height: 14,
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
                        width: '4px',
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
                        fontSize: '13px',
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
                width: '100%',
                height: 'calc(100vh - 180px)',
                maxWidth: '100%',
                bgcolor: 'black',
                borderRadius: 2,
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {submission.rawFootages.map((footage, index) => (
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
              ))}

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
                          fontSize: '11px',
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
                        setSelectedRawFootageIndex((prev) => (prev - 1 + submission.rawFootages.length) % submission.rawFootages.length);
                      }}
                      sx={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        minWidth: '40px',
                        width: '40px',
                        height: '40px',
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
                      <Iconify icon="eva:arrow-ios-back-fill" width={20} />
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
                          fontSize: '11px',
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
                        setSelectedRawFootageIndex((prev) => (prev + 1) % submission.rawFootages.length);
                      }}
                      sx={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        minWidth: '40px',
                        width: '40px',
                        height: '40px',
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
                      <Iconify icon="eva:arrow-ios-forward-fill" width={20} />
                    </Button>
                  </Tooltip>
                </>
              )}
            </Box>
          )}

          {/* Photos Content */}
          {tabIndex === (submission?.rawFootages?.length > 0 ? 2 : 1) && submission?.photos?.length > 0 && (
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: 'calc(100vh - 180px)',
                maxWidth: '100%',
              }}
            >
              {submission.photos.map((photo, index) => (
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
              ))}

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
                          fontSize: '11px',
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
                        setSelectedPhotoIndex((prev) => (prev - 1 + submission.photos.length) % submission.photos.length);
                      }}
                      sx={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        minWidth: '40px',
                        width: '40px',
                        height: '40px',
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
                      <Iconify icon="eva:arrow-ios-back-fill" width={20} />
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
                          fontSize: '11px',
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
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        minWidth: '40px',
                        width: '40px',
                        height: '40px',
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
                      <Iconify icon="eva:arrow-ios-forward-fill" width={20} />
                    </Button>
                  </Tooltip>
                </>
              )}
            </Box>
          )}
        </Box>
      </Dialog>

      {/* Full Image Modal */}
      <Dialog
        open={fullImageOpen}
        onClose={handleFullImageClose}
        fullScreen
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: 'black',
          },
        }}
      >
        <DialogTitle sx={{ bgcolor: 'black', color: 'white', py: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              Photo {currentImageIndex + 1} of {submission?.photos?.length}
            </Typography>
            <IconButton
              onClick={handleFullImageClose}
              sx={{ color: 'white' }}
            >
              <Iconify icon="hugeicons:cancel-01" width={24} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ bgcolor: 'black', p: 0, position: 'relative' }}>
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Image
              src={submission?.photos?.[currentImageIndex]?.url}
              alt={`Photo ${currentImageIndex + 1}`}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />

            {/* Navigation Buttons */}
            {submission?.photos?.length > 1 && (
              <>
                <IconButton
                  onClick={handlePrevImage}
                  sx={{
                    position: 'absolute',
                    left: 16,
                    color: 'white',
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.7)',
                    },
                  }}
                >
                  <Iconify icon="eva:arrow-ios-back-fill" width={24} />
                </IconButton>
                <IconButton
                  onClick={handleNextImage}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    color: 'white',
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.7)',
                    },
                  }}
                >
                  <Iconify icon="eva:arrow-ios-forward-fill" width={24} />
                </IconButton>
              </>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Submit Dialog */}
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

      {/* Upload Modals */}
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
    </Container>
  );
};

export default CampaignFirstDraftMobile;

CampaignFirstDraftMobile.propTypes = {
  campaign: PropTypes.object,
  timeline: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  submission: PropTypes.object,
  getDependency: PropTypes.func,
  fullSubmission: PropTypes.array,
  openLogisticTab: PropTypes.func,
  setCurrentTab: PropTypes.func,
  deliverablesData: PropTypes.object,
}; 