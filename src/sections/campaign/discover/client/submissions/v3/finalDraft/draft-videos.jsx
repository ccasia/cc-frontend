import useSWR from 'swr';
import dayjs from 'dayjs';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Grid,
  Card,
  Chip,
  Stack,
  Button,
  Avatar,
  Tooltip,
  Typography,
  CardContent,
} from '@mui/material';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFMultiSelect } from 'src/components/hook-form';

import { options_changes } from './constants';
import { ConfirmationRequestModal } from './confirmation-modals';

const VideoCard = ({ 
  videoItem, 
  index, 
  submission, 
  onVideoClick, 
  handleApprove, 
  handleRequestChange,
  selectedVideosForChange,
  handleVideoSelection,
  userRole,
  deliverables,
  handleClientApprove,
  handleClientReject,
  deliverableMutate,
  submissionMutate,
  // Admin feedback handlers
  handleAdminEditFeedback,
  handleAdminSendToCreator,
}) => {
  console.log('🔍 VideoCard rendering for:', {
    videoItemId: videoItem.id,
    videoItemStatus: videoItem.status,
    userRole,
    submissionStatus: submission?.status
  });
  const [cardType, setCardType] = useState('approve');
  const [isProcessing, setIsProcessing] = useState(false);
  const [localStatus, setLocalStatus] = useState(null);

  const requestSchema = Yup.object().shape({
    feedback: Yup.string().required('This field is required'),
    reasons: Yup.array(),
  });

  const approveSchema = Yup.object().shape({
    feedback: Yup.string().required('Comment is required.'),
  });

  const formMethods = useForm({
    resolver: cardType === 'request' ? yupResolver(requestSchema) : yupResolver(approveSchema),
    defaultValues: {
      feedback: '',
      reasons: [],
    },
    mode: 'onChange',
  });

  const { formState: { isSubmitting }, reset } = formMethods;

  // Reset form when cardType changes
  useEffect(() => {
    const defaultValues = {
      feedback: '',
      reasons: [],
    };
    reset(defaultValues);
  }, [cardType, reset]);

  // Reset local status when videoItem status changes (server update)
  useEffect(() => {
    setLocalStatus(null);
  }, [videoItem.status]);

  // Use local status if available, otherwise use prop status
  const currentStatus = localStatus || videoItem.status;
  const isVideoApprovedByAdmin = currentStatus === 'SENT_TO_CLIENT';
  const isVideoApprovedByClient = currentStatus === 'APPROVED';
  const hasRevisionRequested = currentStatus === 'REVISION_REQUESTED';
  const isClientFeedback = currentStatus === 'CLIENT_FEEDBACK';
  const isChangesRequired = currentStatus === 'CHANGES_REQUIRED' || currentStatus === 'REVISION_REQUESTED';
  
  // For client role, SENT_TO_CLIENT status should be treated as PENDING_REVIEW
  const { user } = useAuthContext();
  const normalizedRole = ((userRole || user?.admin?.role?.name || user?.role?.name || user?.role) ?? '').toString().toLowerCase();
  const isClient = normalizedRole === 'client';
  const submissionClientPending = (submission?.status === 'SENT_TO_CLIENT' || submission?.status === 'PENDING_REVIEW' || submission?.displayStatus === 'PENDING_REVIEW');
  
  const isPendingReview = isClient ? 
    // For clients: show approval buttons when submission is awaiting client review and media is not already approved/changes requested
    (submissionClientPending && !isVideoApprovedByClient && !hasRevisionRequested) :
    // For non-clients: show approval buttons when submission is PENDING_REVIEW and media not approved
    (submission?.status === 'PENDING_REVIEW' && !isVideoApprovedByAdmin && !hasRevisionRequested);

  const getVideoFeedback = () => {
    console.log('🔍 getVideoFeedback - Debug info:', {
      videoItem,
      videoItemId: videoItem.id,
      individualFeedback: videoItem.individualFeedback,
      deliverables,
      submission,
      submissionFeedback: submission?.feedback
    });

    // Check for individual feedback first (from deliverables API)
    if (videoItem.individualFeedback && videoItem.individualFeedback.length > 0) {
      console.log('🔍 Found individual feedback:', videoItem.individualFeedback);
      return videoItem.individualFeedback;
    }
    
    // Get all feedback from submission (from deliverables API)
    const allFeedbacks = [
      ...(deliverables?.submissions?.flatMap(sub => sub.feedback) || []),
      ...(submission?.feedback || [])
    ];

    console.log('🔍 All feedbacks collected:', {
      deliverablesSubmissions: deliverables?.submissions,
      deliverablesSubmissionsFeedback: deliverables?.submissions?.flatMap(sub => sub.feedback),
      submissionFeedback: submission?.feedback,
      allFeedbacks
    });

    // Filter feedback for this specific video
    const videoSpecificFeedback = allFeedbacks
      .filter(feedback => {
        const hasVideoId = feedback.videosToUpdate?.includes(videoItem.id);
        console.log('🔍 Checking feedback:', {
          feedbackId: feedback.id,
          feedbackContent: feedback.content,
          videosToUpdate: feedback.videosToUpdate,
          videoItemId: videoItem.id,
          hasVideoId
        });
        return hasVideoId;
      })
      .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));

    console.log('🔍 Final video-specific feedback:', videoSpecificFeedback);
    return videoSpecificFeedback;
  };

  const feedback = getVideoFeedback();

  console.log('🔍 VideoCard feedback variable:', {
    feedback,
    feedbackLength: feedback?.length,
    videoItemId: videoItem.id,
    willRenderFeedback: feedback && feedback.length > 0
  });

  // Helper function to get the correct feedback content
  const getFeedbackContent = (feedbackItem) => {
    // Try different possible field names for content
    if (feedbackItem.content && feedbackItem.content !== null) {
      return feedbackItem.content;
    }
    if (feedbackItem.message && feedbackItem.message !== null) {
      return feedbackItem.message;
    }
    if (feedbackItem.text && feedbackItem.text !== null) {
      return feedbackItem.text;
    }
    if (feedbackItem.feedback && feedbackItem.feedback !== null) {
      return feedbackItem.feedback;
    }
    if (feedbackItem.comment && feedbackItem.comment !== null) {
      return feedbackItem.comment;
    }
    if (feedbackItem.note && feedbackItem.note !== null) {
      return feedbackItem.note;
    }
    if (feedbackItem.description && feedbackItem.description !== null) {
      return feedbackItem.description;
    }
    
    // If no content found, return null
    return null;
  };

  const handleApproveClick = async (data) => {
    setIsProcessing(true);
    try {
      console.log('🔍 VideoCard handleApproveClick:', { 
        isClient, 
        userRole, 
        data, 
        videoId: videoItem.id,
        handleApprove: !!handleApprove 
      });
      
      if (isClient) {
        // Call client-specific backend endpoint
        console.log('🔍 Client approving video via backend endpoint');
        const response = await axiosInstance.patch('/api/submission/v3/media/approve/client', {
          mediaId: videoItem.id,
          mediaType: 'video',
          feedback: data.feedback || 'Approved by client'
        });
        
        if (response.status === 200) {
          enqueueSnackbar('Video approved successfully!', { variant: 'success' });
          
          // SWR revalidation for immediate UI update
          if (deliverableMutate) await deliverableMutate();
          if (submissionMutate) await submissionMutate();
        }
      } else {
        console.log('🔍 Admin approving video via handleApprove function');
        await handleApprove(videoItem.id, data.feedback);
      }
      setLocalStatus('APPROVED');
    } catch (error) {
      console.error('❌ Error approving video:', error);
      enqueueSnackbar('Failed to approve video', { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestChangeClick = async (data) => {
    setIsProcessing(true);
    try {
      console.log('🔍 VideoCard handleRequestChangeClick:', { 
        isClient, 
        userRole, 
        data, 
        videoId: videoItem.id,
        handleRequestChange: !!handleRequestChange 
      });
      
      if (isClient) {
        // Call client-specific backend endpoint
        console.log('🔍 Client requesting video changes via backend endpoint');
        const response = await axiosInstance.patch('/api/submission/v3/media/request-changes/client', {
          mediaId: videoItem.id,
          mediaType: 'video',
          feedback: data.feedback || 'Changes requested by client',
          reasons: data?.reasons || []
        });
        
        if (response.status === 200) {
          enqueueSnackbar('Changes requested successfully!', { variant: 'success' });
          
          // SWR revalidation for immediate UI update
          if (deliverableMutate) await deliverableMutate();
          if (submissionMutate) await submissionMutate();
        }
      } else {
        console.log('🔍 Admin requesting video changes via handleRequestChange function');
        await handleRequestChange(videoItem.id, data.feedback, data.reasons);
      }
      setLocalStatus('REVISION_REQUESTED');
    } catch (error) {
      console.error('❌ Error requesting video changes:', error);
      enqueueSnackbar('Failed to request changes', { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = () => {
    if (isVideoApprovedByClient) return 'success';
    if (hasRevisionRequested) return 'error';
    if (isVideoApprovedByAdmin) return 'warning';
    return 'default';
  };

  const getStatusText = () => {
    if (isVideoApprovedByClient) return 'Approved';
    if (hasRevisionRequested) return 'Changes Requested';
    if (isVideoApprovedByAdmin) return 'Sent to Client';
    return 'Pending Review';
  };

  const getBorderColor = () => {
    if (isVideoApprovedByClient) return '#1ABF66';
    if (hasRevisionRequested) return '#D4321C';
    if (isVideoApprovedByAdmin) return '#FFC702';
    return '#e0e0e0';
  };

  const renderFormContent = () => {
    if (!isPendingReview) {
      if (isVideoApprovedByClient) {
        return (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: 2,
            }}
          >
            <Box
              sx={{
                bgcolor: '#FFFFFF',
                color: '#1ABF66',
                border: '1.5px solid',
                borderColor: '#1ABF66',
                borderBottom: 3,
                borderBottomColor: '#1ABF66',
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
          </Box>
        );
      }
      if (hasRevisionRequested) {
        return (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: 2,
            }}
          >
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
          </Box>
        );
      }
      return (
        <Typography color="text.secondary" variant="body2">
          Waiting for review
        </Typography>
      );
    }

    return (
      <FormProvider methods={formMethods}>
        {cardType === 'approve' ? (
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="#000000">
              Comments For Creator
            </Typography>
            <RHFTextField
              name="feedback"
              multiline
              minRows={3}
              placeholder="Provide feedback for the creator."
              size="small"
            />

            <Stack spacing={1.5} sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1.5}>
                <Button
                  onClick={() => {
                    setCardType('request');
                  }}
                  size="small"
                  variant="contained"
                  disabled={isProcessing}
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
                    py: 1.2,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    height: '40px',
                    flex: 2,
                  }}
                >
                  Request a Change
                </Button>

                <LoadingButton
                  onClick={formMethods.handleSubmit(handleApproveClick)}
                  variant="contained"
                  size="small"
                  loading={isSubmitting || isProcessing}
                  sx={{ bgcolor: '#FFFFFF', color: '#1ABF66', border: '1.5px solid', borderColor: '#e7e7e7', borderBottom: 3, borderBottomColor: '#e7e7e7', borderRadius: 1.15, py: 1.2, fontWeight: 600, fontSize: '0.9rem', height: '40px', textTransform: 'none', flex: 1 }}
                >
                  Approve
                </LoadingButton>
              </Stack>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="#000000">
              Request Changes
            </Typography>
            <RHFTextField
              name="feedback"
              multiline
              minRows={3}
              placeholder="Provide feedback for the creator."
              size="small"
            />

            <RHFMultiSelect
              name="reasons"
              label="Reasons for Changes"
              options={options_changes}
            />

            <Stack spacing={1.5} sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1.5}>
                <Button
                  onClick={() => {
                    setCardType('approve');
                  }}
                  size="small"
                  variant="contained"
                  disabled={isProcessing}
                  sx={{
                    bgcolor: '#FFFFFF',
                    border: 1.5,
                    borderRadius: 1.15,
                    borderColor: '#e7e7e7',
                    borderBottom: 3,
                    borderBottomColor: '#e7e7e7',
                    color: '#1ABF66',
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                      borderColor: '#1ABF66',
                    },
                    textTransform: 'none',
                    py: 1.2,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    height: '40px',
                    flex: 1,
                  }}
                >
                  Approve
                </Button>

                <LoadingButton
                  onClick={formMethods.handleSubmit(handleRequestChangeClick)}
                  variant="contained"
                  size="small"
                  loading={isSubmitting || isProcessing}
                  sx={{ bgcolor: '#FFFFFF', color: '#D4321C', border: '1.5px solid', borderColor: '#e7e7e7', borderBottom: 3, borderBottomColor: '#e7e7e7', borderRadius: 1.15, py: 1.2, fontWeight: 600, fontSize: '0.9rem', height: '40px', textTransform: 'none', flex: 2 }}
                >
                  Request a Change
                </LoadingButton>
              </Stack>
            </Stack>
          </Stack>
        )}
      </FormProvider>
    );
  };

  return (
    <Card
      sx={{
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        border: '1px solid',
        borderColor: getBorderColor(),
        maxWidth: 300,
        width: '100%',
        // mx: 'auto',
      }}
    >
      {/* Video Section */}
      <Box sx={{ p: 2, pb: 1 }}>
        {/* Submission Date */}
        {videoItem.createdAt && (
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Iconify
                icon="eva:calendar-outline"
                sx={{
                  width: 12,
                  height: 12,
                  color: 'text.secondary',
                }}
              />
              {dayjs(videoItem.createdAt).format('MMM D, YYYY h:mm A')}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            position: 'relative',
            borderRadius: 1.5,
            overflow: 'hidden',
            aspectRatio: '16/9',
            cursor: 'pointer',
            mb: 2,
          }}
        >
          <Box
            component="video"
            src={videoItem.url}
            controls
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Status indicators */}
          {hasRevisionRequested && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 1,
              }}
            >
              <Tooltip title="Changes required">
                <Iconify icon="si:warning-fill" width={20} color="warning.main" />
              </Tooltip>
            </Box>
          )}

          {isVideoApprovedByClient && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 1,
              }}
            >
              <Tooltip title="Approved">
                <Iconify icon="lets-icons:check-fill" width={20} color="success.main" />
              </Tooltip>
            </Box>
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
            onClick={() => onVideoClick(index)}
          />
        </Box>
      </Box>

      {/* Form Section */}
      <CardContent sx={{ pt: 0 }}>
        {renderFormContent()}
      </CardContent>

      {/* Feedback History */}
      {feedback.length > 0 && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Stack spacing={1.5}>
            {feedback.map((fb, feedbackIndex) => {
              console.log('🔍 Rendering feedback item:', { 
                fb, 
                feedbackIndex,
                feedbackId: fb.id,
                feedbackContent: fb.content,
                feedbackType: fb.type,
                feedbackCreatedAt: fb.createdAt,
                feedbackAdmin: fb.admin,
                feedbackVideosToUpdate: fb.videosToUpdate,
                fullFeedbackObject: JSON.stringify(fb, null, 2)
              });
              return (
                <Box
                  key={feedbackIndex}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: '#FFFFFF',
                    border: '1px solid',
                    borderColor: '#e0e0e0',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Avatar
                      src={fb.admin?.photoURL}
                      sx={{ width: 20, height: 20 }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {fb.admin?.name || 'Admin'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {dayjs(fb.createdAt).format('MMM D, YYYY h:mm A')}
                    </Typography>
                  </Stack>
                  {getFeedbackContent(fb) && (
                    <Typography variant="body2">{getFeedbackContent(fb)}</Typography>
                  )}
                  
                  {/* Admin actions for feedback */}
                  {!isClient && fb.type === 'REASON' && submission?.status === 'SENT_TO_ADMIN' && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleAdminEditFeedback(fb.id, fb.content)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleAdminSendToCreator(videoItem.id, 'video', fb.id)}
                      >
                        Send to Creator
                      </Button>
                    </Stack>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Box>
      )}
    </Card>
  );
};

VideoCard.propTypes = {
  videoItem: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  submission: PropTypes.object.isRequired,
  onVideoClick: PropTypes.func.isRequired,
  handleApprove: PropTypes.func.isRequired,
  handleRequestChange: PropTypes.func.isRequired,
  selectedVideosForChange: PropTypes.array,
  handleVideoSelection: PropTypes.func,
  userRole: PropTypes.string.isRequired,
  deliverables: PropTypes.object,
  handleClientApprove: PropTypes.func,
  handleClientReject: PropTypes.func,
  deliverableMutate: PropTypes.func,
  submissionMutate: PropTypes.func,
  // Admin feedback handlers
  handleAdminEditFeedback: PropTypes.func,
  handleAdminSendToCreator: PropTypes.func,
};

export default VideoCard; 