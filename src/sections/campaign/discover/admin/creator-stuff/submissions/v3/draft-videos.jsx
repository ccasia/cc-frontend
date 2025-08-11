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

import { useBoolean } from 'src/hooks/use-boolean';
import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFDatePicker, RHFMultiSelect } from 'src/components/hook-form';

import { options_changes } from '../firstDraft/constants';
import { ConfirmationApproveModal, ConfirmationRequestModal } from '../finalDraft/confirmation-modals';
import axiosInstance from 'src/utils/axios';
import useSWR from 'swr';

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
}) => {
  const [cardType, setCardType] = useState('approve');
  const [isProcessing, setIsProcessing] = useState(false);
  const [localStatus, setLocalStatus] = useState(null);

  const requestSchema = Yup.object().shape({
    feedback: Yup.string().required('This field is required'),
    reasons: Yup.array(),
  });

  const approveSchema = Yup.object().shape({
    feedback: Yup.string().required('Comment is required.'),
    dueDate: Yup.string().required('Due Date is required.'),
  });

  const formMethods = useForm({
    resolver: cardType === 'request' ? yupResolver(requestSchema) : yupResolver(approveSchema),
    defaultValues: {
      feedback: cardType === 'approve' ? 'Thank you for submitting!' : '',
      dueDate: null,
      reasons: [],
    },
    mode: 'onChange',
  });

  const { formState: { isSubmitting }, reset } = formMethods;

  // Reset form when cardType changes
  useEffect(() => {
    const defaultValues = {
      feedback: cardType === 'approve' ? 'Thank you for submitting!' : '',
      dueDate: null,
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
  
  // For client role, SENT_TO_CLIENT status should be treated as PENDING_REVIEW
  const isPendingReview = userRole === 'client' ? 
    // For clients: show approval buttons when media is SENT_TO_CLIENT or submission is PENDING_REVIEW
    (currentStatus === 'SENT_TO_CLIENT' || (submission?.status === 'PENDING_REVIEW' && !isVideoApprovedByClient && !hasRevisionRequested)) :
    // For non-clients: show approval buttons when submission is PENDING_REVIEW and media not approved
    (submission?.status === 'PENDING_REVIEW' && !isVideoApprovedByAdmin && !hasRevisionRequested);

  const getVideoFeedback = () => {
    // Check for individual feedback first (from deliverables API)
    if (videoItem.individualFeedback && videoItem.individualFeedback.length > 0) {
      return videoItem.individualFeedback;
    }
    
    // Get all feedback from submission (from deliverables API)
    const allFeedbacks = [
      ...(deliverables?.submissions?.flatMap(sub => sub.feedback) || []),
      ...(submission?.feedback || [])
    ];

    // Filter feedback for this specific video
    const videoSpecificFeedback = allFeedbacks
      .filter(feedback => feedback.videosToUpdate?.includes(videoItem.id))
      .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));

    // Also include client feedback for this submission (when video status is CLIENT_FEEDBACK)
    const clientFeedback = allFeedbacks
      .filter(feedback => {
        const isClient = feedback.admin?.admin?.role?.name === 'client' || feedback.admin?.admin?.role?.name === 'Client';
        const isFeedback = feedback.type === 'REASON' || feedback.type === 'COMMENT';
        const isClientFeedbackStatus = videoItem.status === 'CLIENT_FEEDBACK';
        
        return isClient && isFeedback && isClientFeedbackStatus;
      })
      .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));

    return [...videoSpecificFeedback, ...clientFeedback];
  };

  const videoFeedback = getVideoFeedback();

  // Helper function to determine border color
  const getBorderColor = () => {
    // For client role, SENT_TO_CLIENT status should not show green outline
    if (userRole === 'client' && isVideoApprovedByClient) return '#1ABF66';
    if (userRole !== 'client' && isVideoApprovedByAdmin) return '#1ABF66';
    if (hasRevisionRequested) return '#D4321C';
    return 'divider';
  };

  const handleApproveClick = async () => {
    try {
      const values = formMethods.getValues();
      if (userRole === 'client') {
        // Use client approval handler
        await handleClientApprove(videoItem.id);
      } else {
        // Use admin approval handler
        await handleApprove(videoItem.id, values);
      }
      // Optimistically update local status for V3 flow - admin sends to client, client approves
      setLocalStatus(userRole === 'client' ? 'APPROVED' : 'SENT_TO_CLIENT');
    } catch (error) {
      console.error('Error in V3 approve handler:', error);
    }
  };

  const handleRequestClick = async () => {
    try {
      const values = formMethods.getValues();
      if (userRole === 'client') {
        // Use client rejection handler
        await handleClientReject(videoItem.id, values.feedback, values.reasons);
      } else {
        // Use admin request changes handler
        await handleRequestChange(videoItem.id, values);
      }
      // Optimistically update local status for V3 flow
      setLocalStatus('REVISION_REQUESTED');
    } catch (error) {
      console.error('Error in V3 request handler:', error);
    }
  };

  const renderFormContent = () => {
    if (!isPendingReview) {
      // For client role, SENT_TO_CLIENT status should show approval buttons, not APPROVED status
      if (isVideoApprovedByAdmin && userRole !== 'client') {
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
              Due Date
            </Typography>
            <RHFDatePicker
              name="dueDate"
              label="Due Date"
              minDate={dayjs()}
              size="small"
            />

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
                  onClick={handleApproveClick}
                  loading={isSubmitting || isProcessing}
                  disabled={isSubmitting || isProcessing}
                  size="small"
                  variant="contained"
                  sx={{
                    bgcolor: '#FFFFFF',
                    color: '#1ABF66',
                    border: '1.5px solid',
                    borderColor: '#e7e7e7',
                    borderBottom: 3,
                    borderBottomColor: '#e7e7e7',
                    borderRadius: 1.15,
                    py: 1.2,
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                      borderColor: '#1ABF66',
                    },
                    fontSize: '0.9rem',
                    height: '40px',
                    textTransform: 'none',
                    flex: 1,
                  }}
                >
                  {userRole === 'client' ? 'Approve' : 'Approve'}
                </LoadingButton>
              </Stack>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="#000000">
              Request Changes
            </Typography>

            <RHFMultiSelect
              name="reasons"
              checkbox
              chip
              options={options_changes ? options_changes.map((item) => ({
                value: item,
                label: item,
              })) : []}
              label="Reasons"
              size="small"
            />

            <RHFTextField
              name="feedback"
              multiline
              minRows={5}
              placeholder="Provide feedback for the video."
              size="small"
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
                    color: '#231F20',
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                      borderColor: '#231F20',
                    },
                    textTransform: 'none',
                    py: 1.2,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    height: '40px',
                    flex: 1,
                  }}
                >
                  Back
                </Button>

                <LoadingButton
                  onClick={handleRequestClick}
                  variant="contained"
                  size="small"
                  loading={isSubmitting || isProcessing}
                  sx={{
                    bgcolor: '#FFFFFF',
                    color: '#1ABF66',
                    border: '1.5px solid',
                    borderColor: '#e7e7e7',
                    borderBottom: 3,
                    borderBottomColor: '#e7e7e7',
                    borderRadius: 1.15,
                    py: 1.2,
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                      borderColor: '#1ABF66',
                    },
                    fontSize: '0.9rem',
                    height: '40px',
                    textTransform: 'none',
                    flex: 2,
                  }}
                >
                  Submit Feedback
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

          {isVideoApprovedByAdmin && (
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
      </Box>

      {/* Form Section */}
      <CardContent sx={{ pt: 0 }}>
        {renderFormContent()}
        
        {/* Individual Media Action Buttons for Admin */}
        {userRole === 'admin' && submission?.status === 'PENDING_REVIEW' && (
          <Box sx={{ mt: 2 }}>
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
                  flex: 1,
                }}
              >
                Request a Change
              </Button>
              
              <LoadingButton
                onClick={handleApproveClick}
                variant="contained"
                size="small"
                loading={isSubmitting || isProcessing}
                sx={{
                  bgcolor: '#FFFFFF',
                  color: '#1ABF66',
                  border: '1.5px solid',
                  borderColor: '#e7e7e7',
                  borderBottom: 3,
                  borderBottomColor: '#e7e7e7',
                  borderRadius: 1.15,
                  py: 1.2,
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                    borderColor: '#1ABF66',
                  },
                  fontSize: '0.9rem',
                  height: '40px',
                  textTransform: 'none',
                  flex: 1,
                }}
              >
                Approve
              </LoadingButton>
            </Stack>
          </Box>
        )}
      </CardContent>

      {/* Feedback History */}
      {videoFeedback.length > 0 && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Stack spacing={1.5}>
            {videoFeedback.map((feedback, feedbackIndex) => (
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
                    src={feedback.admin?.photoURL}
                    sx={{ width: 20, height: 20 }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {feedback.admin?.name || 'Admin'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {dayjs(feedback.createdAt).format('MMM D, YYYY h:mm A')}
                  </Typography>
                  {feedback.type === 'REQUEST' && (
                    <Chip
                      label="Change Request"
                      size="small"
                      sx={{
                        bgcolor: 'warning.lighter',
                        color: 'warning.darker',
                        fontSize: '0.7rem',
                        height: '20px',
                      }}
                    />
                  )}
                </Stack>
                
                <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
                  {feedback.content}
                </Typography>

                {feedback.reasons && feedback.reasons.length > 0 && (
                  <Box>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {feedback.reasons.map((reason, reasonIndex) => (
                        <Box
                          key={reasonIndex}
                          sx={{
                            bgcolor: '#FFFFFF',
                            color: '#666666',
                            border: '1.5px solid',
                            borderColor: '#e0e0e0',
                            borderBottom: 3,
                            borderBottomColor: '#e0e0e0',
                            borderRadius: 1,
                            py: 0.4,
                            px: 1,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textTransform: 'none',
                          }}
                        >
                          {reason}
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Admin buttons for client feedback */}
                {userRole === 'admin' && (feedback.admin?.admin?.role?.name === 'client' || feedback.admin?.admin?.role?.name === 'Client') && (
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        const adminFeedback = prompt('Edit client feedback (optional):');
                        if (adminFeedback !== null && handleAdminEditFeedback) {
                          handleAdminEditFeedback(videoItem.id, feedback.id, adminFeedback);
                        }
                      }}
                      sx={{
                        fontSize: '0.75rem',
                        py: 0.8,
                        px: 1.5,
                        minWidth: 'auto',
                        border: '1.5px solid #e0e0e0',
                        borderBottom: '3px solid #e0e0e0',
                        color: '#000000',
                        fontWeight: 600,
                        borderRadius: '8px',
                        textTransform: 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: '#f5f5f5',
                          color: '#000000',
                          borderColor: '#d0d0d0',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        },
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        if (handleAdminSendToCreator) {
                          handleAdminSendToCreator(videoItem.id, feedback.id);
                        }
                      }}
                      sx={{
                        fontSize: '0.75rem',
                        py: 0.8,
                        px: 1.5,
                        minWidth: 'auto',
                        bgcolor: '#ffffff',
                        border: '1.5px solid #e0e0e0',
                        borderBottom: '3px solid #e0e0e0',
                        color: '#1ABF66',
                        fontWeight: 600,
                        borderRadius: '8px',
                        textTransform: 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: '#f0f9f0',
                          color: '#1ABF66',
                          borderColor: '#d0d0d0',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 8px rgba(26, 191, 102, 0.2)',
                        },
                      }}
                    >
                      Send to Creator
                    </Button>
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Card>
  );
};

const DraftVideosV3 = ({
  campaign,
  submission,
  deliverables,
  onVideoClick,
  onSubmit,
  isDisabled,
  // SWR mutation functions
  deliverableMutate,
  submissionMutate,
  // Individual admin approval handlers
  onIndividualApprove,
  onIndividualRequestChange,
  // Individual client approval handlers
  handleClientApproveVideo,
  handleClientApprovePhoto,
  handleClientApproveRawFootage,
  handleClientRejectVideo,
  handleClientRejectPhoto,
  handleClientRejectRawFootage,
  // Admin feedback handlers
  handleAdminEditFeedback,
  handleAdminSendToCreator,
}) => {
  const { user } = useAuthContext();
  const userRole = user?.role;

  // SWR for real-time data updates
  const { data: currentSubmission, mutate: mutateSubmission } = useSWR(
    submission?.id ? `/api/submission/v3/${submission.id}` : null,
    (url) => axiosInstance.get(url).then(res => res.data),
    { refreshInterval: 0 }
  );

  const [selectedVideosForChange, setSelectedVideosForChange] = useState([]);
  const [clientRequestModalOpen, setClientRequestModalOpen] = useState(false);
  const [clientRequestVideoId, setClientRequestVideoId] = useState(null);

  const clientRequestForm = useForm({
    resolver: yupResolver(
      Yup.object().shape({
        feedback: Yup.string().required('Feedback is required'),
        reasons: Yup.array().min(1, 'At least one reason is required'),
      })
    ),
    defaultValues: {
      feedback: '',
      reasons: [],
    },
  });

  const handleVideoSelection = (id) => {
    setSelectedVideosForChange(prev => 
      prev.includes(id) 
        ? prev.filter(videoId => videoId !== id)
        : [...prev, id]
    );
  };

  const handleApprove = async (videoId, formValues) => {
    try {
      // Use the passed handler if available, otherwise use internal implementation
      if (onIndividualApprove) {
        await onIndividualApprove(videoId, formValues.feedback, formValues.dueDate);
      } else {
        const response = await axiosInstance.patch('/api/submission/v3/media/approve', {
          mediaId: videoId,
          mediaType: 'video',
          feedback: formValues.feedback || ''
        });

        enqueueSnackbar('Video approved successfully!', { variant: 'success' });
        
        // Revalidate data using passed SWR functions
        if (deliverableMutate) await deliverableMutate();
        if (submissionMutate) await submissionMutate();
      }
    } catch (error) {
      console.error('Error approving video:', error);
      enqueueSnackbar('Failed to approve video', { variant: 'error' });
    }
  };

  const handleRequestChange = async (videoId, formValues) => {
    try {
      // Use the passed handler if available, otherwise use internal implementation
      if (onIndividualRequestChange) {
        await onIndividualRequestChange(videoId, formValues.feedback, formValues.reasons);
      } else {
        const response = await axiosInstance.patch('/api/submission/v3/media/request-changes', {
          mediaId: videoId,
          mediaType: 'video',
          feedback: formValues.feedback || '',
          reasons: formValues.reasons || []
        });

        enqueueSnackbar('Changes requested successfully!', { variant: 'warning' });
        
        // Revalidate data using passed SWR functions
        if (deliverableMutate) await deliverableMutate();
        if (submissionMutate) await submissionMutate();
      }
    } catch (error) {
      console.error('Error requesting changes:', error);
      enqueueSnackbar('Failed to request changes', { variant: 'error' });
    }
  };

  // Use the prop function instead of local implementation
  const handleClientApprove = handleClientApproveVideo;

  // Use the prop function instead of local implementation
  const handleClientReject = handleClientRejectVideo;

  const handleOpenClientRequestModal = (videoId) => {
    setClientRequestVideoId(videoId);
    setClientRequestModalOpen(true);
  };

  const handleCloseClientRequestModal = () => {
    setClientRequestModalOpen(false);
    setClientRequestVideoId(null);
    clientRequestForm.reset();
  };

  const handleClientRequestSubmit = async (data) => {
    try {
      await handleClientReject(clientRequestVideoId, data.feedback, data.reasons);
      handleCloseClientRequestModal();
    } catch (error) {
      console.error('Error submitting client request:', error);
    }
  };

  if (!deliverables?.videos || deliverables.videos.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No videos uploaded yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {deliverables.videos.map((videoItem, index) => (
          <Grid item xs={12} sm={6} md={6} key={videoItem.id}>
            <VideoCard
              videoItem={videoItem}
              index={index}
              submission={currentSubmission || submission}
              onVideoClick={onVideoClick}
              handleApprove={handleApprove}
              handleRequestChange={handleRequestChange}
              selectedVideosForChange={selectedVideosForChange}
              handleVideoSelection={handleVideoSelection}
              userRole={userRole}
              deliverables={deliverables}
              handleClientApprove={handleClientApprove}
              handleClientReject={handleClientReject}
            />
          </Grid>
        ))}
      </Grid>

      {/* Client Request Changes Modal */}
      <ConfirmationRequestModal
        open={clientRequestModalOpen}
        onClose={handleCloseClientRequestModal}
        onSubmit={handleClientRequestSubmit}
        form={clientRequestForm}
        title="Request Changes"
        content="Please provide feedback and select reasons for the requested changes."
      />
    </Box>
  );
};

DraftVideosV3.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  deliverables: PropTypes.object,
  onVideoClick: PropTypes.func,
  onSubmit: PropTypes.func,
  isDisabled: PropTypes.bool,
  // Individual client approval handlers
  handleClientApproveVideo: PropTypes.func,
  handleClientApprovePhoto: PropTypes.func,
  handleClientApproveRawFootage: PropTypes.func,
  handleClientRejectVideo: PropTypes.func,
  handleClientRejectPhoto: PropTypes.func,
  handleClientRejectRawFootage: PropTypes.func,
};

export default DraftVideosV3; 