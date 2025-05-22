/* eslint-disable no-nested-ternary */
/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/media-has-caption */
import dayjs from 'dayjs';
import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
/* eslint-disable no-undef */
import React, { useMemo, useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Grid,
  Chip,
  Link,
  Paper,
  Stack,
  Button,
  Dialog,
  Avatar,
  Tooltip,
  Checkbox,
  Typography,
  IconButton,
  DialogTitle,
  ListItemText,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import EmptyContent from 'src/components/empty-content/empty-content';
import { RHFTextField, RHFDatePicker, RHFMultiSelect } from 'src/components/hook-form';
import Label from 'src/components/label';

const options_changes = [
  'Missing caption requirements',
  'Inverted logo',
  'Inverted brand name',
  'Audio not audible',
  'Video too dark',
  'Video too bright',
  'Mismatch of audio and video',
  'Frozen video',
  'Background too loud',
  'Voiceover not clear',
  'Audio not a good fit',
  'Audio too loud',
  'Speling in subtitles',
];

const PreviewModal = ({ open, onClose, selectedMedia, mediaType }) => (
  <Dialog
    open={open}
    onClose={onClose}
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
          onClick={onClose}
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

    <DialogContent sx={{ p: 2.5 }}>
      {mediaType === 'video' ? (
        <Box
          component="video"
          autoPlay
          controls
          src={selectedMedia}
          sx={{
            width: '100%',
            maxHeight: '60vh',
            borderRadius: 1,
            bgcolor: 'background.neutral',
          }}
        />
      ) : (
        <Box
          component="img"
          src={selectedMedia}
          alt="Preview"
          sx={{
            width: '100%',
            maxHeight: '60vh',
            objectFit: 'contain',
            borderRadius: 1,
            bgcolor: 'background.neutral',
          }}
        />
      )}
    </DialogContent>
  </Dialog>
);

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round(bytes / k ** i)} ${sizes[i]}`;
};

const getVideoSize = async (videoUrl) => {
  try {
    const response = await fetch(videoUrl);
    const blob = await response.blob();
    return formatFileSize(blob.size);
  } catch (error) {
    console.error('Error getting video size:', error);
    return 'Unknown';
  }
};

const FirstDraft = ({ campaign, submission, creator, deliverablesData }) => {
  // Draft Video States
  const [type, setType] = useState('approve');
  const approve = useBoolean();
  const request = useBoolean();
  const [selectedVideosForChange, setSelectedVideosForChange] = useState([]);
  const { deliverables, deliverableMutate } = deliverablesData;

  // Raw Footage States
  const [rawFootageType, setRawFootageType] = useState('approve');
  const rawFootageApprove = useBoolean();
  const rawFootageRequest = useBoolean();
  const [selectedRawFootagesForChange, setSelectedRawFootagesForChange] = useState([]);

  // Photos States
  const [photosType, setPhotosType] = useState('approve');
  const photosApprove = useBoolean();
  const photosRequest = useBoolean();
  const [selectedPhotosForChange, setSelectedPhotosForChange] = useState([]);

  // Add a state to track if status sync is in progress to prevent multiple runs
  const [isSyncingStatus, setIsSyncingStatus] = useState(false);

  // Add this function before any effects
  const checkAndFixFinalDraftStatus = async () => {
    try {
      // Only run this check for final drafts
      const isFinalDraft = submission?.submissionType?.type === 'FINAL_DRAFT';
      if (!isFinalDraft) return;

      // If the status is not APPROVED, but all sections are approved, fix it
      if (submission?.status !== 'APPROVED') {
        console.log('Final draft has incorrect status - checking if it should be APPROVED');

        // Check if all sections are approved
        const allSectionsApproved =
          (!deliverables?.videos?.length ||
            deliverables.videos.every((v) => v.status === 'APPROVED')) &&
          (!deliverables?.rawFootages?.length ||
            deliverables.rawFootages.every((f) => f.status === 'APPROVED')) &&
          (!deliverables?.photos?.length ||
            deliverables.photos.every((p) => p.status === 'APPROVED'));

        if (allSectionsApproved) {
          console.log(
            'Detected approved final draft with incorrect status - restoring APPROVED status'
          );

          try {
            const restorePayload = {
              submissionId: submission.id,
              status: 'APPROVED',
              preserveFinalStatus: true,
              forceStatusChange: true,
              skipAutoSync: true,
            };

            await axiosInstance.patch(`/api/submission/status`, restorePayload);
            console.log('Successfully restored APPROVED status for final draft');
          } catch (error) {
            console.error('Error restoring final draft status:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error checking final draft status:', error);
    }
  };

  // Only check status once when component mounts
  useEffect(() => {
    if (submission?.submissionType?.type === 'FINAL_DRAFT') {
      console.log('Final draft detected, checking status once on load');
      checkAndFixFinalDraftStatus().catch((error) => {
        console.error('Error checking final draft status on mount:', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update useEffect to handle automatic status checking
  useEffect(() => {
    // This will run when deliverables data is updated
    if (deliverables && !isSyncingStatus) {
      console.log('Deliverables updated, but skipping automatic status check');

      // Instead of automatically checking, we'll just update the UI
      // Status updates will now happen only after explicit user actions

      // We'll still check if a final draft needs fixing, but only once
      if (submission?.submissionType?.type === 'FINAL_DRAFT' && submission?.status !== 'APPROVED') {
        console.log('Final draft with non-APPROVED status detected, checking if it needs fixing');
        checkAndFixFinalDraftStatus();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliverables, submission?.status]);

  // Add a new effect to handle manual refresh for final drafts
  // eslint-disable-next-line consistent-return
  useEffect(() => {
    // For final drafts, we'll only refresh when the user explicitly requests it
    // or when there's a specific action that requires a refresh
    if (submission?.submissionType?.type === 'FINAL_DRAFT') {
      const manualRefreshInterval = setInterval(() => {
        // Only refresh if user is actively viewing the page (not in another tab)
        if (document.visibilityState === 'visible') {
          console.log('Checking final draft status...');
          // Instead of full refresh, just check if status needs fixing
          checkAndFixFinalDraftStatus().catch((error) => {
            console.error('Error checking final draft status:', error);
          });
        }
      }, 15000); // 15 seconds for final drafts

      // Clean up interval on unmount
      return () => {
        clearInterval(manualRefreshInterval);
      };
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission?.submissionType?.type]);

  // New function to automatically check if submission is ready for status update

  // Reset handlers for each section
  const resetDraftVideoForm = () => {
    setType('approve');
    draftVideoMethods.reset({
      feedback: 'Thank you for submitting!',
      type: '',
      reasons: [],
      dueDate: null,
    });
    setSelectedVideosForChange([]);
  };

  const resetRawFootageForm = () => {
    setRawFootageType('approve');
    rawFootageMethods.reset({
      footageFeedback: '',
      type: '',
      reasons: [],
    });
    setSelectedRawFootagesForChange([]);
  };

  const resetPhotosForm = () => {
    setPhotosType('approve');
    photoMethods.reset({
      feedback: '',
      type: '',
      reasons: [],
    });
    setSelectedPhotosForChange([]);
  };

  // Update the button click handlers to use the correct state setters
  const handleDraftVideoRequestClick = () => {
    setType('request');
    draftVideoMethods.setValue('type', 'request');
    draftVideoMethods.setValue('feedback', '');
  };

  // Raw footage request handler
  const handleRawFootageRequestClick = () => {
    setRawFootageType('request');
    rawFootageMethods.setValue('type', 'request');
    rawFootageMethods.setValue('footageFeedback', '');
  };

  // Photos request handler
  const handlePhotosRequestClick = () => {
    setPhotosType('request');
    photoMethods.setValue('type', 'request');
    photoMethods.setValue('photoFeedback', '');
  };

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const { user } = useAuthContext();
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [mediaType, setMediaType] = useState(null);
  const [selectedTab, setSelectedTab] = useState('video');
  const [fullImageOpen, setFullImageOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoDetails, setVideoDetails] = useState({
    size: 0,
    resolution: '',
    duration: 0,
  });
  const [draftVideoModalOpen, setDraftVideoModalOpen] = useState(false);
  const [currentDraftVideoIndex, setCurrentDraftVideoIndex] = useState(0);
  const [draftVideoDetails, setDraftVideoDetails] = useState({
    size: '0 Bytes',
    resolution: '',
    duration: 0,
  });

  const requestSchema = Yup.object().shape({
    feedback: Yup.string().required('This field is required'),
    type: Yup.string(),
  });

  const normalSchema = Yup.object().shape({
    feedback: Yup.string().required('Comment is required.'),
    dueDate: Yup.string().required('Due Date is required.'),
  });

  const draftVideoMethods = useForm({
    resolver: type === 'request' ? yupResolver(requestSchema) : yupResolver(normalSchema),
    defaultValues: {
      feedback: 'Thank you for submitting!',
      type: '',
      reasons: [],
      dueDate: null,
    },
  });

  // raw footage
  const rawFootageRequestSchema = Yup.object().shape({
    footageFeedback: Yup.string().required('Feedback is required'),
  });

  // rawFootageMethods form initialization
  const rawFootageMethods = useForm({
    resolver: yupResolver(rawFootageRequestSchema),
    defaultValues: {
      footageFeedback: '',
    },
  });

  // photo form schema
  const photoRequestSchema = Yup.object().shape({
    photoFeedback: Yup.string().required('Feedback is required'),
  });

  // photoMethods form initialization
  const photoMethods = useForm({
    resolver: yupResolver(photoRequestSchema),
    defaultValues: {
      photoFeedback: '',
    },
  });

  const {
    watch,
    formState: { isSubmitting },
  } = draftVideoMethods;

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  // Function to run after any section update

  // Function to refresh all data at once
  const refreshAllData = async () => {
    try {
      // Only refresh first draft data
      await deliverableMutate();
      await mutate(
        `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}&type=FIRST_DRAFT`
      );
      console.log('First draft data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing first draft data:', error);
    }
  };

  // Update the onSubmitDraftVideo function to ensure refresh happens after action
  const onSubmitDraftVideo = async () => {
    try {
      console.log('Submitting draft video review with data:', draftVideoMethods.getValues());
      console.log('Selected videos for change:', selectedVideosForChange);

      const values = draftVideoMethods.getValues();
      // const type = values.type || 'approve';
      if (values.type !== 'request' && values.type !== 'approve') {
        throw new Error('Invalid submission type. Please try again.');
      }

      if (
        values.type === 'request' &&
        campaign?.campaignCredits &&
        selectedVideosForChange.length === 0
      ) {
        throw new Error('Please select at least one video that needs changes');
      }

      // If there's a full campaign content to approve and no individual videos
      if (submission?.content && deliverables?.videos?.length === 0) {
        const payload = {
          submissionId: submission.id,
          content: submission.content,
          type: values.type,
          feedback: values.feedback,
          reasons: values.reasons,
          dueDate: values.type === 'approve' ? values.dueDate : null,
          sectionOnly: true, // This ensures we only update the video section
        };
        const res = await axiosInstance.patch(endpoints.submission.admin.draft, payload);
        console.log('Manual approval result:', res.data);
        if (values.type === 'approve') {
          console.log('Video draft approved');
          enqueueSnackbar('Draft videos approved successfully!', {
            variant: 'success',
          });
        } else {
          console.log('Video draft rejected, requesting changes');
          enqueueSnackbar('Changes requested for draft videos.', {
            variant: 'warning',
          });
        }
        // Refresh data and directly try to sync status
        await refreshAllData();
        // Directly attempt to sync submission status without conditions
        await syncSubmissionStatus();
        // After successful submission, trigger immediate status sync
        await triggerImmediateStatusSync();
        // For final drafts, we need to be extra careful about status
        if (submission?.submissionType?.type === 'FINAL_DRAFT') {
          // Add a delayed check to ensure status is correct
          setTimeout(async () => {
            await checkAndFixFinalDraftStatus();
          }, 1000);
        }
        return true;
      }

      // Get the selected videos (or all if approving all)
      const selectedVideoIds =
        type === 'request'
          ? selectedVideosForChange
          : deliverables?.videos?.map((video) => video.id) || [];

      if (!selectedVideoIds.length && type === 'approve') {
        throw new Error('No videos found to approve');
      }

      const payload = {
        submissionId: submission.id,
        videos: selectedVideoIds,
        type,
        feedback: values.feedback || '',
        reasons: values.reasons || [],
        dueDate: type === 'approve' ? values.dueDate : null,
        sectionOnly: true, // CRITICAL: Must be true to prevent affecting overall status
      };

      // Show a loading notification
      // const loadingKey = enqueueSnackbar('Processing video review...', {
      //   variant: 'info',
      //   autoHideDuration: 2000
      // });

      // Use the correct endpoint path
      const res = await axiosInstance.patch('/api/submission/manageVideos', payload);
      console.log('Submit result:', res.data);
      if (type === 'approve') {
        enqueueSnackbar('Draft videos approved successfully!', {
          variant: 'success',
        });
      } else {
        enqueueSnackbar('Changes requested for draft videos.', {
          variant: 'warning',
        });
        setSelectedVideosForChange([]);
      }
      // Reset form
      resetDraftVideoForm();
      // Refresh data and directly try to sync status
      await refreshAllData();
      // Directly attempt to sync submission status without conditions
      await syncSubmissionStatus();
      // Add a second refresh after a delay to ensure UI is updated
      setTimeout(async () => {
        await refreshAllData();
        // Check for final draft status issues
        if (submission?.submissionType?.type === 'FINAL_DRAFT') {
          await checkAndFixFinalDraftStatus();
        }
      }, 1000);
      return true;
    } catch (error) {
      console.error('Error submitting draft video review:', error);
      enqueueSnackbar(error?.message || 'Error submitting review', {
        variant: 'error',
      });
      return false;
    }
  };

  // Update onSubmitRawFootage with similar refresh logic
  const onSubmitRawFootage = async () => {
    try {
      const values = rawFootageMethods.getValues();
      // const type = values.type || 'approve';

      if (type !== 'request' && type !== 'approve') {
        throw new Error('Invalid submission type. Please try again.');
      }

      if (
        type === 'request' &&
        selectedRawFootagesForChange.length === 0 &&
        campaign?.campaignCredits
      ) {
        throw new Error('Please select at least one raw footage that needs changes');
      }

      // Get the selected footage ids (or all if approving all)
      const selectedFootageIds =
        type === 'request'
          ? selectedRawFootagesForChange
          : deliverables?.rawFootages?.map((footage) => footage.id) || [];

      if (type === 'approve' && !selectedFootageIds.length) {
        throw new Error('No raw footage found to approve');
      }

      const payload = {
        submissionId: submission.id,
        rawFootages: selectedFootageIds,
        type,
        rawFootageContent: values.footageFeedback || '',
        sectionOnly: true, // This ensures we're only updating this section
        status: type === 'request' ? 'CHANGES_REQUIRED' : 'APPROVED',
        dueDate: type === 'request' ? dayjs().add(7, 'day').format('YYYY-MM-DD') : null,
      };

      // Use the correct endpoint path
      const res = await axiosInstance.patch('/api/submission/manageRawFootages', payload);

      console.log('Submit raw footage result:', res.data);

      if (type === 'approve') {
        enqueueSnackbar('Raw footage approved successfully!', {
          variant: 'success',
        });
      } else {
        enqueueSnackbar('Changes requested for raw footage.', {
          variant: 'warning',
        });
        setSelectedRawFootagesForChange([]);
      }

      // Reset form
      resetRawFootageForm();

      // Refresh data using mutate
      await deliverableMutate();

      return true;
    } catch (error) {
      console.error('Error submitting raw footage review:', error);
      enqueueSnackbar(error?.message || 'Error submitting review', {
        variant: 'error',
      });
      return false;
    }
  };

  // Update onSubmitPhotos with the same refresh pattern
  const onSubmitPhotos = async () => {
    try {
      const values = photoMethods.getValues();
      // const type = values.type || 'approve';

      if (type !== 'request' && type !== 'approve') {
        throw new Error('Invalid submission type. Please try again.');
      }

      if (type === 'request' && selectedPhotosForChange.length === 0 && campaign?.campaignCredits) {
        throw new Error('Please select at least one photo that needs changes');
      }

      // Get the selected photo ids (or all if approving all)
      const selectedPhotoIds =
        type === 'request'
          ? selectedPhotosForChange
          : deliverables?.photos?.map((photo) => photo.id) || [];

      if (type === 'approve' && !selectedPhotoIds.length) {
        throw new Error('No photos found to approve');
      }

      const payload = {
        submissionId: submission.id,
        photos: selectedPhotoIds,
        type,
        photoFeedback: values.photoFeedback || '',
        sectionOnly: true, // This ensures we're only updating this section
      };

      // Show a loading notification
      // const loadingKey = enqueueSnackbar('Processing photo review...', {
      //   variant: 'info',
      //   autoHideDuration: 2000
      // });

      // Use the correct endpoint path
      const res = await axiosInstance.patch('/api/submission/managePhotos', payload);

      console.log('Submit photo result:', res.data);

      if (type === 'approve') {
        enqueueSnackbar('Photos approved successfully!', {
          variant: 'success',
        });
      } else {
        enqueueSnackbar('Changes requested for photos.', {
          variant: 'warning',
        });
        setSelectedPhotosForChange([]);
      }

      // Reset form
      resetPhotosForm();

      // Refresh data and directly try to sync status
      await refreshAllData();
      // Directly attempt to sync submission status without conditions
      await syncSubmissionStatus();

      // Add a second refresh after a delay to ensure UI is updated
      setTimeout(async () => {
        await refreshAllData();
        // Check for final draft status issues
        if (submission?.submissionType?.type === 'FINAL_DRAFT') {
          await checkAndFixFinalDraftStatus();
        }
      }, 1000);

      // After successful submission, trigger immediate status sync
      await triggerImmediateStatusSync();

      // For final drafts, we need to be extra careful about status
      if (submission?.submissionType?.type === 'FINAL_DRAFT') {
        // Add a delayed check to ensure status is correct
        setTimeout(async () => {
          await checkAndFixFinalDraftStatus();
        }, 1000);
      }

      return true;
    } catch (error) {
      console.error('Error submitting photo review:', error);
      enqueueSnackbar(error?.message || 'Error submitting review', {
        variant: 'error',
      });
      return false;
    }
  };

  // Add a helper function to trigger immediate status update
  const triggerImmediateStatusSync = async () => {
    try {
      console.log('Triggering immediate status sync after action');

      // Check if this is a final draft that was just approved
      const isFinalDraft = submission?.submissionType?.type === 'FINAL_DRAFT';
      const wasJustApproved = submission?.status === 'APPROVED';

      // If this is an approved final draft, skip sync entirely to avoid status bounce
      if (isFinalDraft && wasJustApproved) {
        console.log(
          'Final draft is approved - skipping status sync entirely to preserve APPROVED status'
        );
        return;
      }

      // First refresh deliverables
      await refreshAllData();

      // Force multiple refreshes to ensure we catch any backend changes
      // But be careful with final draft approvals to avoid IN_PROGRESS notifications
      if (!(isFinalDraft && wasJustApproved)) {
        // Add a second refresh after a delay to ensure UI is updated
        setTimeout(async () => {
          console.log('Performing delayed refresh after status sync');
          await refreshAllData();

          // Check for final draft status issues
          if (isFinalDraft) {
            await checkAndFixFinalDraftStatus();
          }
        }, 1000);
      } else {
        console.log(
          'Final draft was just approved - skipping aggressive refresh to avoid status bounce'
        );
      }
    } catch (error) {
      console.error('Error in triggerImmediateStatusSync:', error);
    }
  };

  const confirmationApproveModal = (open, onclose, sectionType = 'video') => (
    <Dialog
      open={open}
      onClose={onclose}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: '500px',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
        }}
      >
        Approve{' '}
        {sectionType === 'video'
          ? 'Draft Videos'
          : sectionType === 'rawFootages'
            ? 'Raw Footages'
            : 'Photos'}
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={2}>
          <DialogContentText>
            Are you sure you want to approve{' '}
            {sectionType === 'video'
              ? 'these draft videos'
              : sectionType === 'rawFootages'
                ? 'these raw footages'
                : 'these photos'}
            ?
          </DialogContentText>

          {/* Show due date if set and if approving videos */}
          {sectionType === 'video' && watch('dueDate') && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Due Date:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  bgcolor: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                }}
              >
                {dayjs(watch('dueDate')).format('MMM D, YYYY')}
              </Typography>
            </Box>
          )}

          {/* Show feedback comment based on section type */}
          {sectionType === 'video' && watch('feedback') && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Feedback:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  bgcolor: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                  maxHeight: '100px',
                  overflowY: 'auto',
                }}
              >
                {watch('feedback')}
              </Typography>
            </Box>
          )}

          {sectionType === 'rawFootages' && rawFootageMethods.watch('footageFeedback') && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Feedback:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  bgcolor: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                  maxHeight: '100px',
                  overflowY: 'auto',
                }}
              >
                {rawFootageMethods.watch('footageFeedback')}
              </Typography>
            </Box>
          )}

          {sectionType === 'photos' && photoMethods.watch('photoFeedback') && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Feedback:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  bgcolor: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                  maxHeight: '100px',
                  overflowY: 'auto',
                }}
              >
                {photoMethods.watch('photoFeedback')}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 2 }}>
        <Button
          onClick={onclose}
          size="small"
          sx={{
            bgcolor: 'white',
            border: 1.5,
            borderRadius: 1.15,
            borderColor: '#e7e7e7',
            borderBottom: 3,
            borderBottomColor: '#e7e7e7',
            color: 'text.primary',
            '&:hover': {
              bgcolor: '#f5f5f5',
              borderColor: '#231F20',
            },
            textTransform: 'none',
            px: 2.5,
            py: 1.2,
            fontSize: '0.9rem',
            minWidth: '80px',
            height: '45px',
          }}
        >
          Cancel
        </Button>
        <LoadingButton
          onClick={async () => {
            try {
              if (sectionType === 'video') {
                draftVideoMethods.setValue('type', 'approve');
                const success = await onSubmitDraftVideo();
                if (success) {
                  await mutate(
                    `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
                  );
                  await deliverableMutate();
                  onclose();
                }
              } else if (sectionType === 'rawFootages') {
                rawFootageMethods.setValue('type', 'approve');
                const success = await onSubmitRawFootage();
                if (success) {
                  await mutate(
                    `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
                  );
                  await deliverableMutate();
                  onclose();
                }
              } else if (sectionType === 'photos') {
                photoMethods.setValue('type', 'approve');
                const success = await onSubmitPhotos();
                if (success) {
                  await mutate(
                    `${endpoints.submission.root}?creatorId=${creator?.user?.id}&campaignId=${campaign?.id}`
                  );
                  await deliverableMutate();
                  onclose();
                }
              }
            } catch (error) {
              console.error('Error during approval:', error);
              enqueueSnackbar('Error during approval', { variant: 'error' });
            }
          }}
          disabled={isDisabled}
          variant="contained"
          size="small"
          loading={isSubmitting}
          sx={{
            bgcolor: '#FFFFFF',
            color: '#1ABF66',
            border: '1.5px solid',
            borderColor: '#e7e7e7',
            borderBottom: 3,
            borderBottomColor: '#e7e7e7',
            borderRadius: 1.15,
            px: 2.5,
            py: 1.2,
            fontWeight: 600,
            '&:hover': {
              bgcolor: '#f5f5f5',
              borderColor: '#1ABF66',
            },
            fontSize: '0.9rem',
            minWidth: '80px',
            height: '45px',
            textTransform: 'none',
          }}
        >
          Approve
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );

  // Update the confirmation modal for raw footage
  const confirmationRequestModal = (open, onclose, sectionType = 'video') => (
    <Dialog
      open={open}
      onClose={onclose}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: '500px',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
        }}
      >
        Confirm Change Request for{' '}
        {sectionType === 'video'
          ? 'Draft Videos'
          : sectionType === 'rawFootages'
            ? 'Raw Footages'
            : 'Photos'}
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={2}>
          <DialogContentText>
            Are you sure you want to submit this change request?
          </DialogContentText>

          {/* Show feedback and reasons based on section type */}
          {sectionType === 'video' && (
            <>
              {draftVideoMethods.watch('reasons')?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Reasons for changes:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {draftVideoMethods.watch('reasons').map((reason, idx) => (
                      <Label
                        key={idx}
                        // label={reason}
                        // size="small"
                        color="primary"
                        // variant="outlined"
                      >
                        {reason}
                      </Label>
                    ))}
                  </Box>
                </Box>
              )}
              {draftVideoMethods.watch('feedback') && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Feedback:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      bgcolor: 'grey.100',
                      p: 1.5,
                      borderRadius: 1,
                      maxHeight: '100px',
                      overflowY: 'auto',
                    }}
                  >
                    {draftVideoMethods.watch('feedback')}
                  </Typography>
                </Box>
              )}
            </>
          )}

          {/* Show feedback for raw footage */}
          {sectionType === 'rawFootages' && rawFootageMethods.watch('footageFeedback') && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Feedback:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  bgcolor: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                  maxHeight: '100px',
                  overflowY: 'auto',
                }}
              >
                {rawFootageMethods.watch('footageFeedback')}
              </Typography>
            </Box>
          )}

          {/* Show feedback for photos */}
          {sectionType === 'photos' && photoMethods.watch('photoFeedback') && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Feedback:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  bgcolor: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                  maxHeight: '100px',
                  overflowY: 'auto',
                }}
              >
                {photoMethods.watch('photoFeedback')}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 2 }}>
        <Button
          onClick={onclose}
          size="small"
          sx={{
            bgcolor: 'white',
            border: 1.5,
            borderRadius: 1.15,
            borderColor: '#e7e7e7',
            borderBottom: 3,
            borderBottomColor: '#e7e7e7',
            color: 'text.primary',
            '&:hover': {
              bgcolor: '#f5f5f5',
              borderColor: '#231F20',
            },
            textTransform: 'none',
            px: 2.5,
            py: 1.2,
            fontSize: '0.9rem',
            minWidth: '80px',
            height: '45px',
          }}
        >
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          size="small"
          onClick={async () => {
            try {
              // Set the appropriate form field values and submit
              if (sectionType === 'video') {
                draftVideoMethods.setValue('type', 'request');
                const success = await onSubmitDraftVideo();
                if (success) {
                  onclose();
                  triggerImmediateStatusSync();
                }
              } else if (sectionType === 'rawFootages') {
                rawFootageMethods.setValue('type', 'request');
                const success = await onSubmitRawFootage();
                if (success) {
                  onclose();
                  triggerImmediateStatusSync();
                }
              } else if (sectionType === 'photos') {
                photoMethods.setValue('type', 'request');
                const success = await onSubmitPhotos();
                if (success) {
                  onclose();
                  triggerImmediateStatusSync();
                }
              }
            } catch (error) {
              console.error('Error submitting request for changes:', error);
              enqueueSnackbar('Error submitting request', { variant: 'error' });
            }
          }}
          disabled={
            (sectionType === 'video' &&
              campaign?.campaignCredits &&
              selectedVideosForChange.length === 0) ||
            (sectionType === 'rawFootages' && selectedRawFootagesForChange.length === 0) ||
            (sectionType === 'photos' && selectedPhotosForChange.length === 0)
          }
          sx={{
            bgcolor: '#FFFFFF',
            color: '#1ABF66',
            border: '1.5px solid',
            borderColor: '#e7e7e7',
            borderBottom: 3,
            borderBottomColor: '#e7e7e7',
            borderRadius: 1.15,
            px: 2.5,
            py: 1.2,
            fontWeight: 600,
            '&:hover': {
              bgcolor: '#f5f5f5',
              borderColor: '#1ABF66',
            },
            fontSize: '0.9rem',
            minWidth: '80px',
            height: '45px',
            textTransform: 'none',
          }}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );

  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
    setFullImageOpen(true);
  };

  const handleFullImageClose = () => {
    setFullImageOpen(false);
  };

  const handlePrevImage = (event) => {
    event.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : submission.photos.length - 1
    );
  };

  const handleNextImage = (event) => {
    event.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex < submission.photos.length - 1 ? prevIndex + 1 : 0
    );
  };

  const handleVideoClick = (index) => {
    setCurrentVideoIndex(index);
    setVideoModalOpen(true);
  };

  const handleVideoMetadata = async (event) => {
    const video = event.target;
    const videoUrl = submission?.rawFootages?.[currentVideoIndex]?.url;

    if (videoUrl) {
      const size = await getVideoSize(videoUrl);
      const resolution = `${video.videoWidth} x ${video.videoHeight}`;
      const duration = Math.round(video.duration);

      setVideoDetails({ size, resolution, duration });
    }
  };

  // download helper
  const handleDownload = async (videoUrl) => {
    try {
      const response = await fetch(videoUrl);
      const contentType = response.headers.get('content-type');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      let filename = videoUrl.split('/').pop() || 'video';

      const extensionMap = {
        'video/mp4': '.mp4',
        'video/quicktime': '.mov',
        'video/x-msvideo': '.avi',
        'video/webm': '.webm',
      };

      const extension = extensionMap[contentType] || `.${videoUrl.split('.').pop()}` || '.mp4';
      filename = filename.replace(/\.[^/.]+$/, '') + extension;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      enqueueSnackbar('Failed to download video', { variant: 'error' });
    }
  };

  const handleDraftVideoClick = (index) => {
    if (index) {
      setCurrentDraftVideoIndex(index);
    }
    setDraftVideoModalOpen(true);
  };

  const handleDraftVideoMetadata = async (event) => {
    const video = event.target;
    const videoUrl = submission?.video?.[currentDraftVideoIndex]?.url;

    if (videoUrl) {
      const size = await getVideoSize(videoUrl);
      const resolution = `${video.videoWidth} x ${video.videoHeight}`;
      const duration = Math.round(video.duration);

      setDraftVideoDetails({ size, resolution, duration });
    }
  };

  const handleVideoSelection = (id) => {
    setSelectedVideosForChange((prev) => {
      if (prev.includes(id)) {
        return prev.filter((videoId) => videoId !== id);
      }
      return [...prev, id];
    });
  };

  // handlers for raw footage and photo selection
  const handleRawFootageSelection = (event, id) => {
    event.stopPropagation();
    setSelectedRawFootagesForChange((prev) => {
      if (prev.includes(id)) {
        return prev.filter((footageId) => footageId !== id);
      }
      return [...prev, id];
    });
  };

  const handlePhotoSelection = (event, id) => {
    event.stopPropagation();
    setSelectedPhotosForChange((prev) => {
      if (prev.includes(id)) {
        return prev.filter((photoId) => photoId !== id);
      }
      return [...prev, id];
    });
  };

  const renderStatusBanner = () => {
    if (submission?.status === 'CHANGES_REQUIRED') {
      return (
        <Box
          sx={{
            mb: 3,
            p: 1.5,
            px: 3,
            bgcolor: 'warning.lighter',
            border: '1px solid',
            borderColor: 'warning.light',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 2px 8px rgba(255, 171, 0, 0.12)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: 4,
              height: '100%',
              bgcolor: 'warning.main',
            },
          }}
        >
          <Box
            sx={{
              minWidth: 40,
              height: 40,
              borderRadius: 1.2,
              bgcolor: 'warning.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify
              icon="solar:danger-triangle-bold"
              width={24}
              sx={{
                color: 'warning.contrastText',
              }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: 'warning.darker',
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              Changes Required
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'warning.dark',
                opacity: 0.8,
              }}
            >
              Changes have been requested for this submission.
            </Typography>
          </Box>
        </Box>
      );
    }

    if (submission?.status === 'APPROVED') {
      return (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: 'success.lighter',
            border: '1px solid',
            borderColor: 'success.light',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Iconify icon="solar:check-circle-bold" color="success.main" />
          <Typography color="success.darker" sx={{ flex: 1 }}>
            This submission has been approved
          </Typography>
        </Box>
      );
    }

    if (submission?.status === 'PENDING_REVIEW') {
      return (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: 'info.lighter',
            border: '1px solid',
            borderColor: 'info.light',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Iconify icon="material-symbols:hourglass-outline" color="info.main" />
          <Typography color="info.darker" sx={{ flex: 1 }}>
            This submission is pending review
          </Typography>
        </Box>
      );
    }

    return null;
  };

  useEffect(() => {
    let initialTab = 'video';

    if (!submission?.video?.length) {
      if (submission?.rawFootages?.length) initialTab = 'rawFootages';
      else if (submission?.photos?.length) initialTab = 'photos';
    }

    setSelectedTab(initialTab);
  }, [submission]);

  // helper to check if all raw footages are marked for changes
  const areAllRawFootagesMarkedForChanges = () => {
    if (!submission?.rawFootages?.length || !submission?.status === 'CHANGES_REQUIRED')
      return false;
    return submission.rawFootages.every((footage) =>
      submission.feedback?.some((feedback) => feedback.rawFootageToUpdate?.includes(footage.id))
    );
  };

  // helper to check if all photos are marked for changes

  const renderSectionStatusBanner = (sectionType) => {
    // Get the appropriate items array based on section type
    let items = [];
    let sectionName = '';

    if (sectionType === 'video') {
      items = deliverables?.videos || [];
      sectionName = 'Draft Videos';
    } else if (sectionType === 'rawFootages') {
      items = deliverables?.rawFootages || [];
      sectionName = 'Raw Footage';
    } else if (sectionType === 'photos') {
      items = deliverables?.photos || [];
      sectionName = 'Photos';
    }

    // No items, no banner
    if (!items.length) {
      return null;
    }

    // Check if any items need changes
    const hasChangesRequired = items.some((item) => item.status === 'REVISION_REQUESTED');

    // Check if all items are approved
    const allApproved = items.every((item) => item.status === 'APPROVED');

    // Return a simple chip with the status instead of a full box
    return (
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        {hasChangesRequired ? (
          <Chip
            size="small"
            color="warning"
            label="Changes Required"
            icon={<Iconify icon="solar:danger-triangle-bold" />}
          />
        ) : allApproved ? (
          <Chip
            size="small"
            color="success"
            label="Approved"
            icon={<Iconify icon="solar:check-circle-bold" />}
          />
        ) : (
          <Chip
            size="small"
            color="info"
            label="Pending Review"
            icon={<Iconify icon="material-symbols:hourglass-outline" />}
          />
        )}
      </Box>
    );
  };

  const photos = (
    <>
      {deliverables?.photos?.length ? (
        <Grid container spacing={2}>
          {deliverables.photos.map((photo, index) => (
            <Grid item xs={12} sm={6} md={4} key={photo.id || index}>
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 1,
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

                {photo.status === 'REVISION_REQUESTED' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      color: 'warning.contrastText',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      zIndex: 1,
                    }}
                  >
                    <Tooltip title="Changes required">
                      <Iconify icon="si:warning-fill" width={20} color="warning.main" />
                    </Tooltip>
                  </Box>
                )}

                {(photo.status === 'PENDING' || photo.status === 'APPROVED') && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      color: 'warning.contrastText',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      zIndex: 1,
                    }}
                  >
                    <Tooltip title="Approved">
                      <Iconify icon="lets-icons:check-fill" width={20} color="success.main" />
                    </Tooltip>
                  </Box>
                )}

                {photosType === 'request' &&
                  photo.status !== 'REVISION_REQUESTED' &&
                  !(
                    submission?.status === 'CHANGES_REQUIRED' &&
                    submission?.feedback?.some((feedback) =>
                      feedback.photosToUpdate?.includes(photo.id)
                    )
                  ) && (
                    <Checkbox
                      checked={selectedPhotosForChange.includes(photo.id)}
                      onChange={(event) => handlePhotoSelection(event, photo.id)}
                      onClick={(event) => event.stopPropagation()}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'white',
                        '&.Mui-checked': {
                          color: 'primary.main',
                        },
                        bgcolor: 'rgba(0,0,0,0.3)',
                        borderRadius: 1,
                        zIndex: 1,
                      }}
                    />
                  )}

                <Box
                  onClick={() => handleImageClick(index)}
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
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography>No photos uploaded yet.</Typography>
      )}

      {/* Photos Google Drive link */}
      {submission?.photosDriveLink && (
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.neutral',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: 64,
              minHeight: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#e8ecfc',
              borderRight: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Iconify
              icon="logos:google-drive"
              sx={{
                width: 28,
                height: 28,
                color: '#1340ff',
              }}
            />
          </Box>

          <Box sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Additional Photos
            </Typography>
            <Link
              href={submission.photosDriveLink}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: '#1340ff',
                textDecoration: 'none',
                '&:hover': {
                  color: '#1340ff',
                  textDecoration: 'underline',
                  opacity: 0.8,
                },
                wordBreak: 'break-all',
              }}
            >
              <Iconify
                icon="eva:external-link-fill"
                sx={{
                  mr: 0.5,
                  width: 16,
                  height: 16,
                  color: '#1340ff',
                }}
              />
              {submission.photosDriveLink}
            </Link>
          </Box>
        </Box>
      )}

      {/* Photos Review Section */}
      {deliverables?.photos?.length > 0 && submission?.status === 'PENDING_REVIEW' && (
        <Box
          component={Paper}
          sx={{
            p: { xs: 2, sm: 3 },
            mt: 3,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" mb={2}>
            Photos Review
          </Typography>

          {/* Check if all photos are already approved */}
          {deliverables?.photos?.length > 0 &&
          deliverables.photos.every((p) => p.status === 'APPROVED') ? (
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: 'success.lighter',
                border: '1px solid',
                borderColor: 'success.light',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Iconify icon="solar:check-circle-bold" color="success.main" />
              <Typography color="success.darker">All photos have been approved</Typography>
            </Box>
          ) : (
            <>
              {photosType === 'approve' && (
                <FormProvider methods={photoMethods} onSubmit={onSubmitPhotos}>
                  <Stack gap={2}>
                    {/* Add feedback field for approve flow */}
                    <Typography variant="subtitle1" mb={1} mx={1}>
                      Comments For Creator
                    </Typography>
                    <RHFTextField
                      name="photoFeedback"
                      multiline
                      minRows={5}
                      placeholder="Provide feedback for the photos."
                      sx={{ mb: 2 }}
                    />

                    <Stack
                      alignItems={{ xs: 'stretch', sm: 'center' }}
                      direction={{ xs: 'column', sm: 'row' }}
                      gap={1.5}
                      justifyContent="end"
                    >
                      <Button
                        onClick={handlePhotosRequestClick}
                        disabled={isDisabled}
                        size="small"
                        variant="contained"
                        sx={{
                          bgcolor: '#FFFFFF',
                          border: 1.5,
                          borderRadius: 1.15,
                          borderColor: '#e7e7e7',
                          borderBottom: 3,
                          borderBottomColor: '#e7e7e7',
                          color: '#D4321C',
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                            borderColor: '#D4321C',
                          },
                          textTransform: 'none',
                          px: 2.5,
                          py: 1.2,
                          fontSize: '1rem',
                          fontWeight: 600,
                          minWidth: '80px',
                          height: '45px',
                        }}
                      >
                        Request a Change
                      </Button>

                      <LoadingButton
                        onClick={() => photosApprove.onTrue()}
                        variant="contained"
                        size="small"
                        sx={{
                          bgcolor: '#FFFFFF',
                          color: '#1ABF66',
                          border: '1.5px solid',
                          borderColor: '#e7e7e7',
                          borderBottom: 3,
                          borderBottomColor: '#e7e7e7',
                          borderRadius: 1.15,
                          px: 2.5,
                          py: 1.2,
                          fontWeight: 600,
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                            borderColor: '#1ABF66',
                          },
                          fontSize: '1rem',
                          minWidth: '80px',
                          height: '45px',
                          textTransform: 'none',
                        }}
                      >
                        Approve
                      </LoadingButton>
                    </Stack>

                    {confirmationApproveModal(photosApprove.value, photosApprove.onFalse, 'photos')}
                  </Stack>
                </FormProvider>
              )}

              {photosType === 'request' && (
                <>
                  <Typography variant="h6" mb={1} mx={1}>
                    Request Changes for Photos
                  </Typography>
                  <FormProvider
                    methods={photoMethods}
                    onSubmit={onSubmitPhotos}
                    disabled={isDisabled}
                  >
                    <Stack gap={2}>
                      <RHFTextField
                        name="photoFeedback"
                        multiline
                        minRows={5}
                        placeholder="Provide feedback for selected photos."
                      />

                      {photosType === 'request' && selectedPhotosForChange.length === 0 && (
                        <Typography
                          color="warning.main"
                          sx={{
                            mt: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Iconify icon="solar:danger-triangle-bold" />
                          Please select at least one photo that needs changes.
                        </Typography>
                      )}

                      <Stack
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        direction={{ xs: 'column', sm: 'row' }}
                        gap={1.5}
                        alignSelf="end"
                      >
                        <Button
                          onClick={() => {
                            setPhotosType('approve');
                            photoMethods.setValue('type', 'approve');
                            photoMethods.setValue('photoFeedback', '');
                          }}
                          size="small"
                          sx={{
                            bgcolor: 'white',
                            border: 1.5,
                            borderRadius: 1.15,
                            borderColor: '#e7e7e7',
                            borderBottom: 3,
                            borderBottomColor: '#e7e7e7',
                            color: 'text.primary',
                            '&:hover': {
                              bgcolor: '#f5f5f5',
                              borderColor: '#231F20',
                            },
                            textTransform: 'none',
                            px: 2.5,
                            py: 1.2,
                            fontSize: '1rem',
                            minWidth: '80px',
                            height: '45px',
                          }}
                        >
                          Back
                        </Button>
                        <LoadingButton
                          variant="contained"
                          size="small"
                          onClick={() => {
                            // Ensure photo feedback is set
                            if (!photoMethods.getValues('photoFeedback')) {
                              enqueueSnackbar('Please provide feedback for the photos', {
                                variant: 'error',
                              });
                              return;
                            }

                            // If no photos selected and selection is required, show error
                            if (selectedPhotosForChange.length === 0) {
                              enqueueSnackbar(
                                'Please select at least one photo that needs changes',
                                { variant: 'error' }
                              );
                              return;
                            }

                            // Show confirmation dialog
                            photosRequest.onTrue();
                          }}
                          disabled={
                            photosType === 'request' && selectedPhotosForChange.length === 0
                          }
                          sx={{
                            bgcolor: '#FFFFFF',
                            color: '#1ABF66',
                            border: '1.5px solid',
                            borderColor: '#e7e7e7',
                            borderBottom: 3,
                            borderBottomColor: '#e7e7e7',
                            borderRadius: 1.15,
                            px: 2.5,
                            py: 1.2,
                            fontWeight: 600,
                            '&:hover': {
                              bgcolor: '#f5f5f5',
                              borderColor: '#1ABF66',
                            },
                            fontSize: '1rem',
                            minWidth: '80px',
                            height: '45px',
                            textTransform: 'none',
                          }}
                        >
                          Submit
                        </LoadingButton>
                      </Stack>
                    </Stack>

                    {confirmationRequestModal(photosRequest.value, photosRequest.onFalse, 'photos')}
                  </FormProvider>
                </>
              )}
            </>
          )}
        </Box>
      )}
    </>
  );

  // Effect to refresh sections when deliverables change
  useEffect(() => {
    // This will re-render the component when deliverables data is updated
    // including when a section is approved or changes are requested
    console.log('Deliverables updated, refreshing UI');

    // Check if we should show or hide the review sections based on updated statuses
    if (deliverables) {
      const allVideosApproved =
        deliverables.videos?.length > 0
          ? deliverables.videos.every((v) => v.status === 'APPROVED')
          : submission?.status === 'APPROVED';

      const allRawFootagesApproved =
        deliverables.rawFootages?.length > 0
          ? deliverables.rawFootages.every((f) => f.status === 'APPROVED')
          : true;

      const allPhotosApproved =
        deliverables.photos?.length > 0
          ? deliverables.photos.every((p) => p.status === 'APPROVED')
          : true;

      console.log('Section approval status:', {
        videos: allVideosApproved,
        rawFootages: allRawFootagesApproved,
        photos: allPhotosApproved,
      });
    }
  }, [deliverables, submission?.status]);

  // Function to directly sync the submission status with section statuses
  const syncSubmissionStatus = async () => {
    try {
      console.log('Starting syncSubmissionStatus, checking all section statuses...');

      if (!submission || !deliverables) {
        console.log('Submission or deliverables not loaded yet, skipping status check');
        return false;
      }

      // Store original status to check for specific transitions
      const originalStatus = submission.status;

      // IMPORTANT: For final drafts, we need to be extra careful
      const isFinalDraft = submission?.submissionType?.type === 'FINAL_DRAFT';

      // If this is a final draft and all sections are approved, force APPROVED status
      if (isFinalDraft) {
        const allSectionsApproved =
          (!deliverables?.videos?.length ||
            deliverables.videos.every((v) => v.status === 'APPROVED')) &&
          (!deliverables?.rawFootages?.length ||
            deliverables.rawFootages.every((f) => f.status === 'APPROVED')) &&
          (!deliverables?.photos?.length ||
            deliverables.photos.every((p) => p.status === 'APPROVED'));

        if (allSectionsApproved) {
          console.log('Final draft with all sections approved - forcing APPROVED status');

          // Force APPROVED status for final draft
          try {
            const restorePayload = {
              submissionId: submission.id,
              status: 'APPROVED',
              preserveFinalStatus: true,
              forceStatusChange: true,
              skipAutoSync: true, // Add flag to skip auto-sync on backend
            };

            await axiosInstance.patch(`/api/submission/status`, restorePayload);
            console.log('Forced APPROVED status for final draft');
            return true;
          } catch (error) {
            console.error('Error forcing APPROVED status:', error);
          }
        }
      }

      // Skip if submission is in a state that should not be synced
      if (
        !['PENDING_REVIEW', 'CHANGES_REQUIRED', 'APPROVED', 'IN_PROGRESS'].includes(originalStatus)
      ) {
        console.log(`Submission status is ${originalStatus}, which is not eligible for auto-sync`);
        return false;
      }

      // Get the due date from the draft video form if available
      const dueDate =
        draftVideoMethods.getValues('dueDate') || dayjs().add(7, 'day').format('YYYY-MM-DD');

      const updatePayload = {
        submissionId: submission.id,
        status: 'AUTO_SYNC',
        dueDate,
        preserveFinalDraftApproval: true,
        forcePreserveApproved: isFinalDraft,
        skipAutoSync: isFinalDraft, // Skip auto-sync for final drafts
      };

      console.log('Sending status sync with payload:', updatePayload);

      try {
        const res = await axiosInstance.patch(`/api/submission/status`, updatePayload);
        console.log('Auto submission status update response:', res.data);

        // For final drafts, we need to verify the status didn't change incorrectly
        if (isFinalDraft && res.data.submission) {
          const newStatus = res.data.submission.status;
          if (newStatus !== 'APPROVED') {
            console.log('Final draft status changed incorrectly - restoring APPROVED status');

            // Force restore APPROVED status
            const restorePayload = {
              submissionId: submission.id,
              status: 'APPROVED',
              preserveFinalStatus: true,
              forceStatusChange: true,
              skipAutoSync: true,
            };

            await axiosInstance.patch(`/api/submission/status`, restorePayload);
            console.log('Restored APPROVED status for final draft');
          }
        }

        await refreshAllData();
        return true;
      } catch (error) {
        console.error('Error during status update:', error);
        return false;
      }
    } catch (error) {
      console.error('Error in syncSubmissionStatus:', error);
      return false;
    }
  };

  // Add a new function to render submission summary status
  const renderSubmissionSummary = () => {
    if (submission?.status !== 'PENDING_REVIEW' && submission?.status !== 'CHANGES_REQUIRED') {
      return null; // Only show for submissions under review or with changes required
    }

    // Get status for each section
    const hasVideos = deliverables?.videos?.length > 0 || submission?.content;
    const hasRawFootages = campaign?.rawFootage ? deliverables?.rawFootages?.length > 0 : false;
    const hasPhotos = campaign?.photos ? deliverables?.photos?.length > 0 : false;

    // Check section approval status
    const videosApproved = hasVideos
      ? deliverables?.videos?.length > 0
        ? deliverables.videos.every((v) => v.status === 'APPROVED')
        : submission?.status === 'APPROVED' || submission?.content?.status === 'APPROVED'
      : false;

    const rawFootagesApproved = hasRawFootages
      ? deliverables.rawFootages.every((f) => f.status === 'APPROVED')
      : false;

    const photosApproved = hasPhotos
      ? deliverables.photos.every((p) => p.status === 'APPROVED')
      : false;

    // Check if any section has changes required

    // Count required and approved sections
    const requiredSectionCount = [hasVideos, hasRawFootages, hasPhotos].filter(Boolean).length;

    if (requiredSectionCount === 0) return null;

    // return (
    //   <Box
    //     sx={{
    //       mb: 3,
    //       p: 2.5,
    //       borderRadius: 2,
    //       bgcolor: 'background.neutral',
    //       border: '1px solid',
    //       borderColor: 'divider',
    //     }}
    //   >
    //     <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
    //       <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
    //         Approval Status
    //       </Typography>

    //       {/* Add the sync status button */}
    //       <StatusSyncButton />
    //     </Stack>

    //     <Stack spacing={1.5}>
    //       {hasVideos && (
    //         <Stack direction="row" alignItems="center" justifyContent="space-between">
    //           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    //             <Iconify icon="solar:video-library-bold" width={20} />
    //             <Typography variant="body2">Draft Videos</Typography>
    //           </Box>

    //           <Box>
    //             {videosApproved ? (
    //               <Chip
    //                 size="small"
    //                 color="success"
    //                 label="Approved"
    //                 icon={<Iconify icon="solar:check-circle-bold" />}
    //               />
    //             ) : videosNeedChanges ? (
    //               <Chip
    //                 size="small"
    //                 color="warning"
    //                 label="Changes Required"
    //                 icon={<Iconify icon="solar:danger-triangle-bold" />}
    //               />
    //             ) : (
    //               <Chip
    //                 size="small"
    //                 color="default"
    //                 label="Pending Review"
    //                 icon={<Iconify icon="solar:clock-circle-bold" />}
    //               />
    //             )}
    //           </Box>
    //         </Stack>
    //       )}

    //       {hasRawFootages && (
    //         <Stack direction="row" alignItems="center" justifyContent="space-between">
    //           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    //             <Iconify icon="solar:camera-bold" width={20} />
    //             <Typography variant="body2">Raw Footages</Typography>
    //           </Box>

    //           <Box>
    //             {rawFootagesApproved ? (
    //               <Chip
    //                 size="small"
    //                 color="success"
    //                 label="Approved"
    //                 icon={<Iconify icon="solar:check-circle-bold" />}
    //               />
    //             ) : rawFootagesNeedChanges ? (
    //               <Chip
    //                 size="small"
    //                 color="warning"
    //                 label="Changes Required"
    //                 icon={<Iconify icon="solar:danger-triangle-bold" />}
    //               />
    //             ) : (
    //               <Chip
    //                 size="small"
    //                 color="default"
    //                 label="Pending Review"
    //                 icon={<Iconify icon="solar:clock-circle-bold" />}
    //               />
    //             )}
    //           </Box>
    //         </Stack>
    //       )}

    //       {hasPhotos && (
    //         <Stack direction="row" alignItems="center" justifyContent="space-between">
    //           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    //             <Iconify icon="solar:gallery-wide-bold" width={20} />
    //             <Typography variant="body2">Photos</Typography>
    //           </Box>

    //           <Box>
    //             {photosApproved ? (
    //               <Chip
    //                 size="small"
    //                 color="success"
    //                 label="Approved"
    //                 icon={<Iconify icon="solar:check-circle-bold" />}
    //               />
    //             ) : photosNeedChanges ? (
    //               <Chip
    //                 size="small"
    //                 color="warning"
    //                 label="Changes Required"
    //                 icon={<Iconify icon="solar:danger-triangle-bold" />}
    //               />
    //             ) : (
    //               <Chip
    //                 size="small"
    //                 color="default"
    //                 label="Pending Review"
    //                 icon={<Iconify icon="solar:clock-circle-bold" />}
    //               />
    //             )}
    //           </Box>
    //         </Stack>
    //       )}
    //     </Stack>

    //     <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
    //       <Stack direction="row" alignItems="center" justifyContent="space-between">
    //         <Typography variant="subtitle2">Overall Status</Typography>

    //         <Box>
    //           {approvedSectionCount === requiredSectionCount ? (
    //             <Chip
    //               color="success"
    //               label="Ready to Approve"
    //               icon={<Iconify icon="solar:check-circle-bold" />}
    //             />
    //           ) : (approvedSectionCount > 0) ? (
    //             <Chip
    //               color="info"
    //               label={`${approvedSectionCount}/${requiredSectionCount} Approved`}
    //               icon={<Iconify icon="solar:hourglass-bold" />}
    //             />
    //           ) : (
    //             <Chip
    //               color="default"
    //               label="Pending Review"
    //               icon={<Iconify icon="solar:clock-circle-bold" />}
    //             />
    //           )}
    //         </Box>
    //       </Stack>
    //     </Box>
    //   </Box>
    // );
  };

  // Add an effect to watch for deliverable status changes and trigger sync
  useEffect(() => {
    if (!deliverables || !submission) return;

    // Check if this is a final draft that's already approved - skip sync to preserve status
    const isFinalDraft = submission?.submissionType?.type === 'FINAL_DRAFT';
    const isApproved = submission?.status === 'APPROVED';

    if (isFinalDraft && isApproved) {
      console.log(
        'Final draft is approved - skipping automatic status sync to preserve APPROVED status'
      );
      return;
    }

    // Extract current statuses into a string for comparison
    const getStatusString = () => {
      const videoStatuses = deliverables.videos?.map((v) => `${v.id}:${v.status}`).join(',') || '';
      const rawFootageStatuses =
        deliverables.rawFootages?.map((r) => `${r.id}:${r.status}`).join(',') || '';
      const photoStatuses = deliverables.photos?.map((p) => `${p.id}:${p.status}`).join(',') || '';
      return `${videoStatuses}|${rawFootageStatuses}|${photoStatuses}`;
    };

    // Store current status string in ref for comparison

    // If any deliverable statuses have changed, trigger sync
    console.log('Deliverables updated, checking for status changes...');

    // Check if we have a mix of approved and changed-requested items
    const hasVideos = deliverables?.videos?.length > 0 || !!submission?.content;
    const hasRawFootages = deliverables?.rawFootages?.length > 0;
    const hasPhotos = deliverables?.photos?.length > 0;

    const videoDecided =
      hasVideos &&
      (!deliverables?.videos?.length ||
        deliverables.videos.every((v) => ['APPROVED', 'REVISION_REQUESTED'].includes(v.status)));

    const rawFootageDecided =
      hasRawFootages &&
      deliverables.rawFootages.every((f) => ['APPROVED', 'REVISION_REQUESTED'].includes(f.status));

    const photosDecided =
      hasPhotos &&
      deliverables.photos.every((p) => ['APPROVED', 'REVISION_REQUESTED'].includes(p.status));

    // If all sections have decisions and this is not an already approved final draft, immediately sync
    if (
      videoDecided &&
      rawFootageDecided &&
      photosDecided &&
      (hasVideos || hasRawFootages || hasPhotos) &&
      !(isFinalDraft && isApproved)
    ) {
      // Skip auto-sync for approved final drafts
      console.log('All sections have decisions - triggering immediate sync');

      // Add an extra check for all items being approved in final draft
      const allApproved =
        (!hasVideos ||
          !deliverables?.videos?.length ||
          deliverables.videos.every((v) => v.status === 'APPROVED')) &&
        (!hasRawFootages || deliverables.rawFootages.every((f) => f.status === 'APPROVED')) &&
        (!hasPhotos || deliverables.photos.every((p) => p.status === 'APPROVED'));

      // If this is a final draft and everything is approved, be extra careful with auto-sync
      if (isFinalDraft && allApproved) {
        console.log(
          'All items in final draft are approved - refreshing once but skipping aggressive sync'
        );
        refreshAllData(); // Just refresh data once without triggering sync
      } else {
        // Schedule a sync with a slight delay to allow other operations to complete
        const syncTimer = setTimeout(() => {
          triggerImmediateStatusSync();
        }, 500);

        // eslint-disable-next-line consistent-return
        return () => clearTimeout(syncTimer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliverables]);

  // Add a function to check and fix any inappropriate status changes for final drafts
  // const checkAndFixFinalDraftStatus = async () => {
  //   try {
  //     // Only run this check for final drafts
  //     const isFinalDraft = submission?.submissionType?.type === 'FINAL_DRAFT';
  //     if (!isFinalDraft) return;

  //     // If the status is not APPROVED, but all sections are approved, fix it
  //     if (submission?.status !== 'APPROVED') {
  //       console.log('Final draft has incorrect status - checking if it should be APPROVED');

  //       // Check if all sections are approved
  //       const allSectionsApproved =
  //         (!deliverables?.videos?.length || deliverables.videos.every(v => v.status === 'APPROVED')) &&
  //         (!deliverables?.rawFootages?.length || deliverables.rawFootages.every(f => f.status === 'APPROVED')) &&
  //         (!deliverables?.photos?.length || deliverables.photos.every(p => p.status === 'APPROVED'));

  //       if (allSectionsApproved) {
  //         console.log('Detected approved final draft with incorrect status - restoring APPROVED status');

  //         try {
  //           const restorePayload = {
  //             submissionId: submission.id,
  //             status: 'APPROVED',
  //             preserveFinalStatus: true,
  //             forceStatusChange: true,
  //             skipAutoSync: true // Add flag to skip auto-sync on backend
  //           };

  //           await axiosInstance.patch(`/api/submission/status`, restorePayload);
  //           console.log('Successfully restored APPROVED status for final draft');

  //           // Refresh data to show updated status
  //           await refreshAllData();
  //         } catch (error) {
  //           console.error('Error restoring final draft status:', error);
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error checking final draft status:', error);
  //   }
  // };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box component={Paper} p={{ xs: 1, sm: 1.5 }}>
            <Stack direction="column" spacing={2} sx={{ mb: 3 }}>
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#8e8e93', fontSize: '0.875rem', fontWeight: 550 }}
                  >
                    Date Submitted:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#221f20', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    {submission?.submissionDate
                      ? dayjs(submission?.submissionDate).format('ddd, D MMM YYYY')
                      : '-'}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{ color: '#8e8e93', fontSize: '0.875rem', fontWeight: 550 }}
                  >
                    Reviewed On:
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#221f20', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    {submission?.isReview
                      ? dayjs(submission?.updatedAt).format('ddd, D MMM YYYY')
                      : '-'}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
            {submission?.status === 'NOT_STARTED' && <EmptyContent title="No Submission" />}
            {submission?.status === 'IN_PROGRESS' &&
              !submission?.video?.length &&
              !submission?.photos?.length &&
              !submission?.rawFootages?.length && (
                <EmptyContent title="Creator has not uploaded any deliverables yet." />
              )}

            {(submission?.status === 'PENDING_REVIEW' ||
              submission?.status === 'APPROVED' ||
              submission?.status === 'CHANGES_REQUIRED') &&
              (deliverables?.videos?.length ||
                deliverables?.photos?.length ||
                deliverables?.rawFootages?.length ||
                submission?.content) && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    {/* Status Banner */}
                    {/* {renderStatusBanner()} */}

                    {/* Submission Summary - Show sections approval status */}
                    {renderSubmissionSummary()}
                    {/* Media Selection Navigation */}
                    <Box sx={{ mb: 3 }}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          boxShadow: '0 0 12px rgba(0,0,0,0.05)',
                        }}
                      >
                        <Button
                          onClick={() => setSelectedTab('video')}
                          startIcon={<Iconify icon="solar:video-frame-bold" />}
                          fullWidth
                          sx={{
                            p: 1.5,
                            color: selectedTab === 'video' ? '#1844fc' : 'text.secondary',
                            bgcolor: selectedTab === 'video' ? '#e6ebff' : 'transparent',
                            borderRadius: 1,
                            '&:hover': {
                              bgcolor: selectedTab === 'video' ? '#e6ebff' : 'action.hover',
                            },
                          }}
                        >
                          <Stack alignItems="center">
                            <Typography variant="subtitle2">Draft Videos</Typography>
                            <Typography variant="caption">
                              {submission?.content
                                ? '1 video'
                                : deliverables?.videos?.length
                                  ? `${deliverables.videos.length} videos`
                                  : '0 video'}
                            </Typography>
                          </Stack>
                        </Button>

                        {campaign?.rawFootage && (
                          <Button
                            onClick={() => setSelectedTab('rawFootages')}
                            startIcon={<Iconify icon="solar:gallery-wide-bold" />}
                            fullWidth
                            sx={{
                              p: 1.5,
                              color: selectedTab === 'rawFootages' ? '#1844fc' : 'text.secondary',
                              bgcolor: selectedTab === 'rawFootages' ? '#e6ebff' : 'transparent',
                              borderRadius: 1,
                              '&:hover': {
                                bgcolor: selectedTab === 'rawFootages' ? '#e6ebff' : 'action.hover',
                              },
                            }}
                          >
                            <Stack alignItems="center">
                              <Typography variant="subtitle2">Raw Footages</Typography>
                              <Typography variant="caption">
                                {deliverables?.rawFootages?.length || 0} files
                              </Typography>
                            </Stack>
                          </Button>
                        )}

                        {campaign?.photos && (
                          <Button
                            onClick={() => setSelectedTab('photos')}
                            startIcon={<Iconify icon="solar:camera-bold" />}
                            fullWidth
                            sx={{
                              p: 1.5,
                              color: selectedTab === 'photos' ? '#1844fc' : 'text.secondary',
                              bgcolor: selectedTab === 'photos' ? '#e6ebff' : 'transparent',
                              borderRadius: 1,
                              '&:hover': {
                                bgcolor: selectedTab === 'photos' ? '#e6ebff' : 'action.hover',
                              },
                            }}
                          >
                            <Stack alignItems="center">
                              <Typography variant="subtitle2">Photos</Typography>
                              <Typography variant="caption">
                                {deliverables?.photos?.length || 0} images
                              </Typography>
                            </Stack>
                          </Button>
                        )}
                      </Stack>
                    </Box>
                    {/* Content Display Box */}
                    <Box
                      component={Paper}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        boxShadow: '0 0 12px rgba(0,0,0,0.05)',
                        mb: 3,
                      }}
                    >
                      {selectedTab === 'video' && (
                        <>
                          {/* Status banner for videos */}
                          {/* {renderSectionStatusBanner('video')} */}

                          {campaign?.campaignCredits && !!deliverables?.videos?.length && (
                            <Grid container spacing={{ xs: 1, sm: 2 }}>
                              {deliverables.videos.map((videoItem, index) => (
                                <Grid item xs={12} sm={6} md={4} key={videoItem.id || index}>
                                  <Box
                                    sx={{
                                      position: 'relative',
                                      borderRadius: 1,
                                      overflow: 'hidden',
                                      boxShadow: 2,
                                      aspectRatio: '16/9',
                                      cursor: 'pointer',
                                      mb: 3,
                                    }}
                                  >
                                    <Box
                                      component="video"
                                      src={videoItem.url}
                                      sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                      }}
                                    />

                                    {/* Changes Requested indicator */}
                                    {videoItem.status === 'REVISION_REQUESTED' && (
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          top: 8,
                                          left: 8,
                                          color: 'warning.contrastText',
                                          borderRadius: 1,
                                          display: 'flex',
                                          alignItems: 'center',
                                          zIndex: 1,
                                        }}
                                      >
                                        <Tooltip title="Changes required">
                                          <Iconify
                                            icon="si:warning-fill"
                                            width={20}
                                            color="warning.main"
                                          />
                                        </Tooltip>
                                      </Box>
                                    )}

                                    {videoItem.status === 'APPROVED' && (
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          top: 8,
                                          left: 8,
                                          color: 'warning.contrastText',
                                          borderRadius: 1,
                                          display: 'flex',
                                          alignItems: 'center',
                                          zIndex: 1,
                                        }}
                                      >
                                        <Tooltip title="Approved">
                                          <Iconify
                                            icon="lets-icons:check-fill"
                                            width={20}
                                            color="success.main"
                                          />
                                        </Tooltip>
                                      </Box>
                                    )}

                                    {/* Existing checkbox for video selection */}
                                    {type === 'request' &&
                                      !submission?.feedback?.some((feedback) =>
                                        feedback.videosToUpdate?.includes(videoItem.id)
                                      ) && (
                                        <Checkbox
                                          checked={selectedVideosForChange.includes(videoItem.id)}
                                          onChange={() => handleVideoSelection(videoItem.id)}
                                          sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            color: 'white',
                                            '&.Mui-checked': {
                                              color: 'primary.main',
                                            },
                                            bgcolor: 'rgba(0,0,0,0.3)',
                                            borderRadius: 1,
                                          }}
                                        />
                                      )}

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
                                      onClick={() => handleDraftVideoClick(index)}
                                    >
                                      <Iconify
                                        icon="mdi:play"
                                        sx={{
                                          color: 'white',
                                          width: 40,
                                          height: 40,
                                          opacity: 0.9,
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          )}

                          {!!submission?.content && (
                            <Box
                              sx={{
                                position: 'relative',
                                borderRadius: 1,
                                overflow: 'hidden',
                                boxShadow: 2,
                                aspectRatio: '16/9',
                                cursor: 'pointer',
                                mb: 3,
                              }}
                              onClick={() => handleDraftVideoClick()}
                            >
                              <Box
                                component="video"
                                src={submission?.content}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            </Box>
                          )}
                          {/* Caption Section for legacy support */}
                          {submission?.caption && !submission?.videos?.length && (
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 1,
                                bgcolor: 'background.neutral',
                                mb: 4,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'text.secondary',
                                  display: 'block',
                                  mb: 0.5,
                                  fontWeight: 650,
                                }}
                              >
                                Caption
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.primary',
                                  lineHeight: 1.6,
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {submission.caption}
                              </Typography>
                            </Box>
                          )}
                          {/* To display public feedbacks */}
                          <>
                            {!!submission?.publicFeedback?.length &&
                              submission.publicFeedback
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
                                    flexDirection="column"
                                  >
                                    {/* Title for Client Feedback */}
                                    <Typography
                                      variant="h6"
                                      sx={{ fontWeight: 'bold', marginBottom: 2 }}
                                    >
                                      Client Feedback
                                    </Typography>
                                    {/* Use company logo or fallback avatar */}
                                    <Avatar
                                      src={campaign?.company?.logoURL || '/default-avatar.png'}
                                      alt={campaign?.company?.name || 'Company'}
                                      sx={{ mr: 2, mb: 2 }}
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
                                        {campaign?.company?.name || 'Unknown Company'}
                                      </Typography>

                                      {/* Feedback Content */}
                                      <Box sx={{ textAlign: 'left', mt: 1 }}>
                                        {feedback.content &&
                                          feedback.content.split('\n').map((line, i) => (
                                            <Typography key={i} variant="body2">
                                              {line}
                                            </Typography>
                                          ))}

                                        {/* Display reasons if available */}
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
                          </>
                          {/* Display admin feedbacks */}
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

                                  <Box sx={{ textAlign: 'left', mt: 1 }}>
                                    {feedback.content &&
                                      feedback.content.split('\n').map((line, i) => (
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
                          {/* Schedule Post and Request Changes Section for VIDEOS */}
                          {submission?.status === 'PENDING_REVIEW' && (
                            <Box
                              component={Paper}
                              sx={{
                                p: { xs: 2, sm: 3 },
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                mt: 3,
                              }}
                            >
                              <Typography variant="h6" mb={2}>
                                Draft Videos Review
                              </Typography>

                              {/* Check if all videos are already approved */}
                              {(deliverables?.videos?.length > 0 &&
                                deliverables.videos.every((v) => v.status === 'APPROVED')) ||
                              (submission?.content && submission?.status === 'APPROVED') ? (
                                <Box
                                  sx={{
                                    p: 2,
                                    borderRadius: 1,
                                    bgcolor: 'success.lighter',
                                    border: '1px solid',
                                    borderColor: 'success.light',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                  }}
                                >
                                  <Iconify icon="solar:check-circle-bold" color="success.main" />
                                  <Typography color="success.darker">
                                    All draft videos have been approved
                                  </Typography>
                                </Box>
                              ) : (
                                <>
                                  {type === 'approve' && (
                                    <FormProvider
                                      methods={draftVideoMethods}
                                      onSubmit={onSubmitDraftVideo}
                                    >
                                      <Stack gap={1} mb={2}>
                                        <Typography variant="subtitle1" mb={1} mx={1}>
                                          Due Date
                                        </Typography>
                                        <RHFDatePicker
                                          name="dueDate"
                                          label="Due Date"
                                          minDate={dayjs()}
                                        />
                                      </Stack>

                                      <Stack gap={2}>
                                        <Typography variant="subtitle1" mb={1} mx={1}>
                                          Comments For Creator
                                        </Typography>
                                        <RHFTextField
                                          name="feedback"
                                          multiline
                                          minRows={5}
                                          placeholder="Provide feedback for the creator."
                                          sx={{ mb: 2 }}
                                        />
                                      </Stack>

                                      <Stack
                                        alignItems={{ xs: 'stretch', sm: 'center' }}
                                        direction={{ xs: 'column', sm: 'row' }}
                                        gap={1.5}
                                        justifyContent="end"
                                      >
                                        <Button
                                          onClick={handleDraftVideoRequestClick}
                                          size="small"
                                          variant="contained"
                                          sx={{
                                            bgcolor: '#FFFFFF',
                                            border: 1.5,
                                            borderRadius: 1.15,
                                            borderColor: '#e7e7e7',
                                            borderBottom: 3,
                                            borderBottomColor: '#e7e7e7',
                                            color: '#D4321C',
                                            '&:hover': {
                                              bgcolor: '#f5f5f5',
                                              borderColor: '#D4321C',
                                              scale: 1.02,
                                              transition: 'all linear .2s',
                                            },
                                            textTransform: 'none',
                                            px: 2.5,
                                            py: 1.2,
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            minWidth: '80px',
                                            height: '45px',
                                          }}
                                        >
                                          Request a Change
                                        </Button>

                                        <LoadingButton
                                          onClick={() => approve.onTrue()}
                                          variant="contained"
                                          size="small"
                                          loading={isSubmitting}
                                          sx={{
                                            bgcolor: '#FFFFFF',
                                            color: '#1ABF66',
                                            border: '1.5px solid',
                                            borderColor: '#e7e7e7',
                                            borderBottom: 3,
                                            borderBottomColor: '#e7e7e7',
                                            borderRadius: 1.15,
                                            px: 2.5,
                                            py: 1.2,
                                            fontWeight: 600,
                                            '&:hover': {
                                              bgcolor: '#f5f5f5',
                                              borderColor: '#1ABF66',
                                              scale: 1.02,
                                              transition: 'all linear .2s',
                                            },
                                            fontSize: '1rem',
                                            minWidth: '80px',
                                            height: '45px',
                                            textTransform: 'none',
                                          }}
                                        >
                                          Approve
                                        </LoadingButton>
                                      </Stack>
                                      {confirmationApproveModal(
                                        approve.value,
                                        approve.onFalse,
                                        'video'
                                      )}
                                    </FormProvider>
                                  )}

                                  {type === 'request' && (
                                    <FormProvider
                                      methods={draftVideoMethods}
                                      onSubmit={onSubmitDraftVideo}
                                    >
                                      <Typography variant="h6" mb={1} mx={1}>
                                        Request Changes for Draft Videos
                                      </Typography>

                                      <Stack gap={2}>
                                        <RHFMultiSelect
                                          name="reasons"
                                          checkbox
                                          chip
                                          options={options_changes.map((item) => ({
                                            value: item,
                                            label: item,
                                          }))}
                                          label="Reasons"
                                        />
                                        <RHFTextField
                                          name="feedback"
                                          multiline
                                          minRows={5}
                                          placeholder="Provide feedback for the draft video."
                                        />

                                        {campaign?.campaignCredits &&
                                          selectedVideosForChange.length === 0 && (
                                            <Label
                                              startIcon={
                                                <Iconify icon="solar:danger-triangle-bold" />
                                              }
                                              color="warning"
                                              // sx={{
                                              //   mt: 1,
                                              //   display: 'flex',
                                              //   alignItems: 'center',
                                              //   gap: 1,
                                              // }}
                                            >
                                              Please select at least one video that needs changes.
                                            </Label>
                                          )}

                                        <Stack
                                          alignItems={{ xs: 'stretch', sm: 'center' }}
                                          direction={{ xs: 'column', sm: 'row' }}
                                          gap={1.5}
                                          alignSelf="end"
                                        >
                                          <Button
                                            onClick={() => {
                                              setType('approve');
                                              draftVideoMethods.setValue('type', 'approve');
                                              draftVideoMethods.setValue('feedback', '');
                                              draftVideoMethods.setValue('reasons', []);
                                            }}
                                            size="small"
                                            sx={{
                                              bgcolor: 'white',
                                              border: 1.5,
                                              borderRadius: 1.15,
                                              borderColor: '#e7e7e7',
                                              borderBottom: 3,
                                              borderBottomColor: '#e7e7e7',
                                              color: 'text.primary',
                                              '&:hover': {
                                                bgcolor: '#f5f5f5',
                                                borderColor: '#231F20',
                                              },
                                              textTransform: 'none',
                                              px: 2.5,
                                              py: 1.2,
                                              fontSize: '1rem',
                                              minWidth: '80px',
                                              height: '45px',
                                            }}
                                          >
                                            Back
                                          </Button>
                                          <LoadingButton
                                            variant="contained"
                                            size="small"
                                            onClick={() => request.onTrue()}
                                            disabled={
                                              campaign?.campaignCredits &&
                                              selectedVideosForChange.length === 0
                                            }
                                            sx={{
                                              bgcolor: '#FFFFFF',
                                              color: '#1ABF66',
                                              border: '1.5px solid',
                                              borderColor: '#e7e7e7',
                                              borderBottom: 3,
                                              borderBottomColor: '#e7e7e7',
                                              borderRadius: 1.15,
                                              px: 2.5,
                                              py: 1.2,
                                              fontWeight: 600,
                                              '&:hover': {
                                                bgcolor: '#f5f5f5',
                                                borderColor: '#1ABF66',
                                              },
                                              fontSize: '1rem',
                                              minWidth: '80px',
                                              height: '45px',
                                              textTransform: 'none',
                                            }}
                                          >
                                            Submit
                                          </LoadingButton>
                                        </Stack>
                                      </Stack>

                                      {confirmationRequestModal(
                                        request.value,
                                        request.onFalse,
                                        'video'
                                      )}
                                    </FormProvider>
                                  )}
                                </>
                              )}
                            </Box>
                          )}
                        </>
                      )}

                      {selectedTab === 'rawFootages' && (
                        <>
                          {/* Status banner for raw footages */}
                          {renderSectionStatusBanner('rawFootages')}

                          {deliverables?.rawFootages?.length > 0 ? (
                            <Grid container spacing={{ xs: 1, sm: 2 }}>
                              {deliverables.rawFootages.map((footage, index) => (
                                <Grid item xs={12} sm={6} md={4} key={footage.id || index}>
                                  <Box
                                    sx={{
                                      position: 'relative',
                                      borderRadius: 1,
                                      overflow: 'hidden',
                                      boxShadow: 2,
                                      aspectRatio: '16/9',
                                      cursor: 'pointer',
                                    }}
                                    onClick={() => handleVideoClick(index)}
                                  >
                                    <Box
                                      component="video"
                                      src={footage.url}
                                      sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                      }}
                                    />

                                    {/* Checkbox for raw footage selection */}
                                    {rawFootageType === 'request' &&
                                      !(
                                        submission?.status === 'CHANGES_REQUIRED' &&
                                        submission?.feedback?.some((feedback) =>
                                          feedback.rawFootageToUpdate?.includes(footage.id)
                                        )
                                      ) && (
                                        <Checkbox
                                          checked={selectedRawFootagesForChange.includes(
                                            footage.id
                                          )}
                                          onChange={(event) =>
                                            handleRawFootageSelection(event, footage.id)
                                          }
                                          onClick={(event) => event.stopPropagation()}
                                          sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            color: 'white',
                                            '&.Mui-checked': {
                                              color: 'primary.main',
                                            },
                                            bgcolor: 'rgba(0,0,0,0.3)',
                                            borderRadius: 1,
                                            zIndex: 1,
                                          }}
                                        />
                                      )}
                                    <Box
                                      onClick={() => handleVideoClick(index)}
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
                                          width: 40,
                                          height: 40,
                                          color: 'white',
                                          opacity: 0.9,
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          ) : (
                            <Typography>No raw footage uploaded yet.</Typography>
                          )}

                          {/* Raw Footage Google Drive link */}
                          {submission?.rawFootagesDriveLink && (
                            <Box
                              sx={{
                                mt: 2,
                                display: 'flex',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                bgcolor: 'background.neutral',
                                overflow: 'hidden',
                              }}
                            >
                              <Box
                                sx={{
                                  width: 64,
                                  minHeight: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: '#e8ecfc',
                                  borderRight: '1px solid',
                                  borderColor: 'divider',
                                }}
                              >
                                <Iconify
                                  icon="logos:google-drive"
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    color: '#1340ff',
                                  }}
                                />
                              </Box>

                              <Box sx={{ p: 2, flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                  Additional Raw Footage
                                </Typography>
                                <Link
                                  href={submission.rawFootagesDriveLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: '#1340ff',
                                    textDecoration: 'none',
                                    '&:hover': {
                                      color: '#1340ff',
                                      textDecoration: 'underline',
                                      opacity: 0.8,
                                    },
                                    wordBreak: 'break-all',
                                  }}
                                >
                                  <Iconify
                                    icon="eva:external-link-fill"
                                    sx={{
                                      mr: 0.5,
                                      width: 16,
                                      height: 16,
                                      color: '#1340ff',
                                    }}
                                  />
                                  {submission.rawFootagesDriveLink}
                                </Link>
                              </Box>
                            </Box>
                          )}

                          {/* Raw Footage Request Section */}
                          {submission?.status === 'PENDING_REVIEW' &&
                            !areAllRawFootagesMarkedForChanges() && (
                              <Box
                                component={Paper}
                                sx={{
                                  p: { xs: 2, sm: 3 },
                                  mt: 3,
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                }}
                              >
                                <Typography variant="h6" mb={2}>
                                  Raw Footage Review
                                </Typography>

                                {/* Check if all raw footages are already approved */}
                                {deliverables?.rawFootages?.length > 0 &&
                                deliverables.rawFootages.every((f) => f.status === 'APPROVED') ? (
                                  <Box
                                    sx={{
                                      p: 2,
                                      borderRadius: 1,
                                      bgcolor: 'success.lighter',
                                      border: '1px solid',
                                      borderColor: 'success.light',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                    }}
                                  >
                                    <Iconify icon="solar:check-circle-bold" color="success.main" />
                                    <Typography color="success.darker">
                                      All raw footage has been approved
                                    </Typography>
                                  </Box>
                                ) : (
                                  <>
                                    {rawFootageType === 'approve' && (
                                      <FormProvider
                                        methods={rawFootageMethods}
                                        onSubmit={onSubmitRawFootage}
                                      >
                                        <Stack gap={2}>
                                          {/* Add feedback field for approve flow */}
                                          <Typography variant="subtitle1" mb={1} mx={1}>
                                            Comments For Creator
                                          </Typography>
                                          <RHFTextField
                                            name="footageFeedback"
                                            multiline
                                            minRows={5}
                                            placeholder="Provide feedback for the raw footage."
                                            sx={{ mb: 2 }}
                                          />

                                          <Stack
                                            alignItems={{ xs: 'stretch', sm: 'center' }}
                                            direction={{ xs: 'column', sm: 'row' }}
                                            gap={1.5}
                                            justifyContent="end"
                                          >
                                            <Button
                                              onClick={handleRawFootageRequestClick}
                                              disabled={isDisabled}
                                              size="small"
                                              variant="contained"
                                              sx={{
                                                bgcolor: '#FFFFFF',
                                                border: 1.5,
                                                borderRadius: 1.15,
                                                borderColor: '#e7e7e7',
                                                borderBottom: 3,
                                                borderBottomColor: '#e7e7e7',
                                                color: '#D4321C',
                                                '&:hover': {
                                                  bgcolor: '#f5f5f5',
                                                  borderColor: '#D4321C',
                                                },
                                                textTransform: 'none',
                                                px: 2.5,
                                                py: 1.2,
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                minWidth: '80px',
                                                height: '45px',
                                              }}
                                            >
                                              Request a Change
                                            </Button>

                                            <LoadingButton
                                              onClick={() => rawFootageApprove.onTrue()}
                                              variant="contained"
                                              size="small"
                                              sx={{
                                                bgcolor: '#FFFFFF',
                                                color: '#1ABF66',
                                                border: '1.5px solid',
                                                borderColor: '#e7e7e7',
                                                borderBottom: 3,
                                                borderBottomColor: '#e7e7e7',
                                                borderRadius: 1.15,
                                                px: 2.5,
                                                py: 1.2,
                                                fontWeight: 600,
                                                '&:hover': {
                                                  bgcolor: '#f5f5f5',
                                                  borderColor: '#1ABF66',
                                                },
                                                fontSize: '1rem',
                                                minWidth: '80px',
                                                height: '45px',
                                                textTransform: 'none',
                                              }}
                                            >
                                              Approve
                                            </LoadingButton>
                                          </Stack>

                                          {confirmationApproveModal(
                                            rawFootageApprove.value,
                                            rawFootageApprove.onFalse,
                                            'rawFootages'
                                          )}
                                        </Stack>
                                      </FormProvider>
                                    )}

                                    {rawFootageType === 'request' && (
                                      <>
                                        <Typography variant="h6" mb={1} mx={1}>
                                          Request Changes for Raw Footage
                                        </Typography>
                                        <FormProvider
                                          methods={rawFootageMethods}
                                          onSubmit={onSubmitRawFootage}
                                          disabled={isDisabled}
                                        >
                                          <Stack gap={2}>
                                            <RHFTextField
                                              name="footageFeedback"
                                              multiline
                                              minRows={5}
                                              placeholder="Provide feedback for selected raw footage."
                                            />

                                            {rawFootageType === 'request' &&
                                              selectedRawFootagesForChange.length === 0 && (
                                                <Typography
                                                  color="warning.main"
                                                  sx={{
                                                    mt: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                  }}
                                                >
                                                  <Iconify icon="solar:danger-triangle-bold" />
                                                  Please select at least one raw footage that needs
                                                  changes.
                                                </Typography>
                                              )}

                                            <Stack
                                              alignItems={{ xs: 'stretch', sm: 'center' }}
                                              direction={{ xs: 'column', sm: 'row' }}
                                              gap={1.5}
                                              alignSelf="end"
                                            >
                                              <Button
                                                onClick={() => {
                                                  setRawFootageType('approve');
                                                  rawFootageMethods.setValue('type', 'approve');
                                                  rawFootageMethods.setValue('footageFeedback', '');
                                                }}
                                                size="small"
                                                sx={{
                                                  bgcolor: 'white',
                                                  border: 1.5,
                                                  borderRadius: 1.15,
                                                  borderColor: '#e7e7e7',
                                                  borderBottom: 3,
                                                  borderBottomColor: '#e7e7e7',
                                                  color: 'text.primary',
                                                  '&:hover': {
                                                    bgcolor: '#f5f5f5',
                                                    borderColor: '#231F20',
                                                  },
                                                  textTransform: 'none',
                                                  px: 2.5,
                                                  py: 1.2,
                                                  fontSize: '1rem',
                                                  minWidth: '80px',
                                                  height: '45px',
                                                }}
                                              >
                                                Back
                                              </Button>
                                              <LoadingButton
                                                variant="contained"
                                                size="small"
                                                onClick={() => rawFootageRequest.onTrue()}
                                                disabled={
                                                  rawFootageType === 'request' &&
                                                  selectedRawFootagesForChange.length === 0
                                                }
                                                sx={{
                                                  bgcolor: '#FFFFFF',
                                                  color: '#1ABF66',
                                                  border: '1.5px solid',
                                                  borderColor: '#e7e7e7',
                                                  borderBottom: 3,
                                                  borderBottomColor: '#e7e7e7',
                                                  borderRadius: 1.15,
                                                  px: 2.5,
                                                  py: 1.2,
                                                  fontWeight: 600,
                                                  '&:hover': {
                                                    bgcolor: '#f5f5f5',
                                                    borderColor: '#1ABF66',
                                                  },
                                                  fontSize: '1rem',
                                                  minWidth: '80px',
                                                  height: '45px',
                                                  textTransform: 'none',
                                                }}
                                              >
                                                Submit
                                              </LoadingButton>
                                            </Stack>
                                          </Stack>

                                          {confirmationRequestModal(
                                            rawFootageRequest.value,
                                            rawFootageRequest.onFalse,
                                            'rawFootages'
                                          )}
                                        </FormProvider>
                                      </>
                                    )}
                                  </>
                                )}
                              </Box>
                            )}
                        </>
                      )}

                      {selectedTab === 'photos' && (
                        <>
                          {/* Status banner for photos */}
                          {renderSectionStatusBanner('photos')}

                          {photos}
                        </>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              )}
          </Box>
        </Grid>
      </Grid>

      {/* Video/Photo Modal */}
      <PreviewModal
        open={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setSelectedMedia(null);
          setMediaType(null);
        }}
        selectedMedia={selectedMedia}
        mediaType={mediaType}
      />

      {/* Video Modal */}
      <Dialog
        open={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        maxWidth="xl"
        PaperProps={{
          sx: {
            width: '90vw',
            maxWidth: '1400px',
            height: 'auto',
            maxHeight: '90vh',
            m: 'auto',
            borderRadius: 2,
            bgcolor: 'background.paper',
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 3,
            pb: 1,
            mb: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: { xs: '2rem', sm: '2.4rem' },
                fontWeight: 550,
                m: 0,
              }}
            >
              Preview Raw Footage
            </Typography>
            <IconButton
              onClick={() => setVideoModalOpen(false)}
              sx={{
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Video Section */}
            <Grid item xs={12} md={8}>
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16/9',
                    bgcolor: 'black',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component="video"
                    src={submission?.rawFootages?.[currentVideoIndex]?.url}
                    controls
                    autoPlay
                    onLoadedMetadata={handleVideoMetadata}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>

                {/* Navigation Arrows */}
                {submission?.rawFootages?.length > 1 && (
                  <>
                    <IconButton
                      onClick={() =>
                        setCurrentVideoIndex((prev) =>
                          prev > 0 ? prev - 1 : submission.rawFootages.length - 1
                        )
                      }
                      sx={{
                        position: 'absolute',
                        left: -20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'background.paper',
                        boxShadow: 2,
                        '&:hover': { bgcolor: 'background.paper', opacity: 0.9 },
                      }}
                    >
                      <Iconify icon="eva:arrow-ios-back-fill" />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        setCurrentVideoIndex((prev) =>
                          prev < submission.rawFootages.length - 1 ? prev + 1 : 0
                        )
                      }
                      sx={{
                        position: 'absolute',
                        right: -20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'background.paper',
                        boxShadow: 2,
                        '&:hover': { bgcolor: 'background.paper', opacity: 0.9 },
                      }}
                    >
                      <Iconify icon="eva:arrow-ios-forward-fill" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Grid>

            {/* Metadata Section */}
            <Grid
              item
              xs={12}
              md={4}
              sx={{
                pl: { md: 4 },
                pt: { xs: 3, md: 0 },
              }}
            >
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    File Name
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      wordBreak: 'break-all',
                      bgcolor: 'grey.100',
                      p: 1.5,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                    }}
                  >
                    {submission?.rawFootages?.[currentVideoIndex]?.url?.split('/').pop() ||
                      'Untitled Video'}
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    p: 2,
                    bgcolor: 'background.neutral',
                    borderRadius: 1,
                  }}
                >
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      File Size
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {videoDetails.size}
                    </Typography>
                  </Box>

                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      File Type
                    </Typography>
                    <Chip
                      label={
                        submission?.rawFootages?.[currentVideoIndex]?.url
                          ?.split('.')
                          ?.pop()
                          ?.toUpperCase()
                          ?.match(/(MP4|MOV|AVI|WMV|FLV|WEBM|MKV)/)?.[0] || 'Unknown'
                      }
                      size="small"
                      sx={{
                        bgcolor: 'primary.lighter',
                        color: 'primary.main',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Stack>

                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    p: 2,
                    bgcolor: 'background.neutral',
                    borderRadius: 1,
                  }}
                >
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Resolution
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {videoDetails.resolution}
                    </Typography>
                  </Box>

                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Duration
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {Math.floor(videoDetails.duration / 60)}m {videoDetails.duration % 60}s
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Iconify icon="eva:download-fill" />}
                  onClick={() => handleDownload(submission?.rawFootages?.[currentVideoIndex]?.url)}
                  sx={{
                    mt: 1,
                    bgcolor: '#2e6c56',
                    color: 'white',
                    borderBottom: 3,
                    borderBottomColor: '#1a3b2f',
                    borderRadius: 0.8,
                    '&:hover': {
                      bgcolor: '#2e6c56',
                      opacity: 0.9,
                    },
                  }}
                >
                  Download
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
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
            borderRadius: 0,
            overflow: 'hidden',
            bgcolor: 'transparent',
            boxShadow: 'none',
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

      {/* Draft Video Modal */}
      <Dialog
        open={draftVideoModalOpen}
        onClose={() => setDraftVideoModalOpen(false)}
        maxWidth="xl"
        PaperProps={{
          sx: {
            width: '90vw',
            maxWidth: '1400px',
            height: 'auto',
            maxHeight: '90vh',
            m: 'auto',
            borderRadius: 2,
            bgcolor: 'background.paper',
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 3,
            pb: 2,
            mb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: { xs: '2rem', sm: '2.4rem' },
                fontWeight: 550,
                m: 0,
              }}
            >
              Preview Draft Video
            </Typography>
            <IconButton
              onClick={() => setDraftVideoModalOpen(false)}
              sx={{
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Iconify icon="hugeicons:cancel-01" width={20} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Video Section */}
            <Grid item xs={12} md={8}>
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    bgcolor: 'black',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component="video"
                    src={submission?.content || deliverables?.videos?.[currentDraftVideoIndex]?.url}
                    controls
                    autoPlay
                    onLoadedMetadata={handleDraftVideoMetadata}
                    sx={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '70vh',
                      objectFit: 'contain',
                    }}
                  />
                </Box>

                {/* Navigation Arrows */}
                {!!deliverables?.videos?.length && (
                  <>
                    <IconButton
                      onClick={() =>
                        setCurrentDraftVideoIndex((prev) =>
                          prev > 0 ? prev - 1 : deliverables.videos.length - 1
                        )
                      }
                      sx={{
                        position: 'absolute',
                        left: -20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'background.paper',
                        boxShadow: 2,
                        '&:hover': { bgcolor: 'background.paper', opacity: 0.9 },
                      }}
                    >
                      <Iconify icon="eva:arrow-ios-back-fill" />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        setCurrentDraftVideoIndex((prev) =>
                          prev < deliverables.videos.length - 1 ? prev + 1 : 0
                        )
                      }
                      sx={{
                        position: 'absolute',
                        right: -20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'background.paper',
                        boxShadow: 2,
                        '&:hover': { bgcolor: 'background.paper', opacity: 0.9 },
                      }}
                    >
                      <Iconify icon="eva:arrow-ios-forward-fill" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Grid>

            {/* Metadata Section */}
            <Grid
              item
              xs={12}
              md={4}
              sx={{
                pl: { md: 4 },
                pt: { xs: 3, md: 0 },
              }}
            >
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    File Name
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      wordBreak: 'break-all',
                      bgcolor: 'grey.100',
                      p: 1.5,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                    }}
                  >
                    {submission?.content?.split('/').pop() ||
                      submission?.video?.[currentDraftVideoIndex]?.url?.split('/').pop() ||
                      'Untitled Video'}
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    p: 2,
                    bgcolor: 'background.neutral',
                    borderRadius: 1,
                  }}
                >
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      File Size
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {draftVideoDetails.size}
                    </Typography>
                  </Box>

                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      File Type
                    </Typography>
                    <Chip
                      label={
                        (submission?.content || deliverables?.videos?.[currentDraftVideoIndex]?.url)
                          ?.split('.')
                          ?.pop()
                          ?.toUpperCase()
                          ?.match(/(MP4|MOV|AVI|WEBM)/)?.[0] || 'Unknown'
                      }
                      size="small"
                      sx={{
                        bgcolor: 'primary.lighter',
                        color: 'primary.main',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Stack>

                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    p: 2,
                    bgcolor: 'background.neutral',
                    borderRadius: 1,
                  }}
                >
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Resolution
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {draftVideoDetails.resolution}
                    </Typography>
                  </Box>

                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Duration
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {Math.floor(draftVideoDetails.duration / 60)}m{' '}
                      {draftVideoDetails.duration % 60}s
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Iconify icon="eva:download-fill" />}
                  onClick={() =>
                    handleDownload(
                      submission?.content || deliverables?.videos?.[currentDraftVideoIndex]?.url
                    )
                  }
                  sx={{
                    mt: 1,
                    bgcolor: '#2e6c56',
                    color: 'white',
                    borderBottom: 3,
                    borderBottomColor: '#1a3b2f',
                    borderRadius: 0.8,
                    '&:hover': {
                      bgcolor: '#2e6c56',
                      opacity: 0.9,
                    },
                  }}
                >
                  Download
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default FirstDraft;

FirstDraft.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  creator: PropTypes.object,
};
