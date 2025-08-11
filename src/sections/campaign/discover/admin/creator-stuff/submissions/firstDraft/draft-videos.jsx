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

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFDatePicker, RHFMultiSelect } from 'src/components/hook-form';

import { options_changes } from './constants';
import { ConfirmationApproveModal, ConfirmationRequestModal } from './confirmation-modals';

const VideoCard = ({ 
  videoItem, 
  index, 
  submission, 
  onVideoClick, 
  handleApprove, 
  handleRequestChange,
  selectedVideosForChange,
  handleVideoSelection,
  // V2 individual handlers
  onIndividualApprove,
  onIndividualRequestChange,
  isV3,
  userRole,
  handleSendToClient,
  // V3 client handlers
  handleClientApprove,
  handleClientReject,
  // V3 deliverables for status checking
  deliverables,
  // V3 admin feedback handlers
  handleAdminEditFeedback,
  handleAdminSendToCreator,
}) => {
  const [cardType, setCardType] = useState('approve');
  const [isProcessing, setIsProcessing] = useState(false);
  // Add local state to track status optimistically
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
      reasons: [],
      dueDate: null,
    },
  });

  const { formState: { isSubmitting }, setValue, reset } = formMethods;

  // Reset form when cardType changes
  useEffect(() => {
    reset({
      feedback: cardType === 'approve' ? 'Thank you for submitting!' : '',
      reasons: [],
      dueDate: null,
    });
  }, [cardType, reset]);

  // Reset local status when videoItem status changes (server update)
  useEffect(() => {
    setLocalStatus(null);
  }, [videoItem.status]);

  // Use local status if available, otherwise use prop status
  const currentStatus = localStatus || videoItem.status;
  const isVideoApprovedByAdmin = currentStatus === 'SENT_TO_CLIENT';
  const isVideoApprovedByClient = currentStatus === 'APPROVED';
  const hasRevisionRequested = currentStatus === 'REVISION_REQUESTED' || currentStatus === 'CHANGES_REQUIRED' || currentStatus === 'CLIENT_FEEDBACK';
  
  // For client role, SENT_TO_CLIENT status should be treated as PENDING_REVIEW
  const isPendingReview = userRole === 'client' ? 
    // For clients: show approval buttons when media is SENT_TO_CLIENT or submission is PENDING_REVIEW
    (currentStatus === 'SENT_TO_CLIENT' || (submission?.status === 'PENDING_REVIEW' && !isVideoApprovedByClient && !hasRevisionRequested)) :
    // For non-clients: show approval buttons when submission is PENDING_REVIEW and media not approved
    (submission?.status === 'PENDING_REVIEW' && !isVideoApprovedByAdmin && !hasRevisionRequested);

  // Helper function to get the caption from various possible locations
  const getVideoCaption = () => {
    // First try individual video caption
    if (videoItem?.caption) {
      return videoItem.caption;
    }
    
    // Fallback to submission-level caption if no individual caption
    return submission?.caption || 
           submission?.firstDraft?.caption || 
           null;
  };

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

    const allFeedback = [...videoSpecificFeedback, ...clientFeedback];
    // Return only the latest feedback
    return allFeedback.length > 0 ? [allFeedback[0]] : [];
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

  // V2 Individual handlers
  const handleIndividualApproveClick = async () => {
    if (!onIndividualApprove) return;
    
    setIsProcessing(true);
    try {
      const values = formMethods.getValues();
      await onIndividualApprove(videoItem.id, values.feedback, values.dueDate);
      // Optimistically update local status
      setLocalStatus('APPROVED');
    } catch (error) {
      console.error('Error approving video:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIndividualRequestClick = async () => {
    if (!onIndividualRequestChange) return;
    
    setIsProcessing(true);
    try {
      // Validate the form first
      const isValid = await formMethods.trigger();
      if (!isValid) {
        setIsProcessing(false);
        return;
      }
      
      const values = formMethods.getValues();
      // Clean the reasons array to remove any null/undefined values
      const cleanReasons = Array.isArray(values.reasons) 
        ? values.reasons.filter(reason => reason !== null && reason !== undefined && reason !== '')
        : [];
      
      await onIndividualRequestChange(videoItem.id, values.feedback, cleanReasons);
      // Optimistically update local status
      setLocalStatus('CHANGES_REQUIRED');
    } catch (error) {
      console.error('Error requesting video changes:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fallback to original handlers if v2 handlers not provided
  const handleApproveClick = async () => {
    if (onIndividualApprove) {
      await handleIndividualApproveClick();
    } else {
      try {
        const values = formMethods.getValues();
        await handleApprove(videoItem.id, values);
        // Optimistically update local status for fallback handler
        setLocalStatus('APPROVED');
      } catch (error) {
        console.error('Error in fallback approve handler:', error);
      }
    }
  };

  const handleRequestClick = async () => {
    if (onIndividualRequestChange) {
      await handleIndividualRequestClick();
    } else {
      try {
        const values = formMethods.getValues();
        await handleRequestChange(videoItem.id, values);
        // Optimistically update local status for fallback handler
        setLocalStatus('CHANGES_REQUIRED');
      } catch (error) {
        console.error('Error in fallback request handler:', error);
      }
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
                {/* Hide this button for clients to prevent duplicates */}
                {userRole !== 'client' && (
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
                )}

                {isV3 && userRole === 'admin' && submission?.status === 'PENDING_REVIEW' ? (
                  <>
                    {/* Check if all media items are approved */}
                    {(() => {
                      const allVideosApproved = deliverables?.videos?.length > 0 &&
                        deliverables.videos.every(v => v.status === 'SENT_TO_CLIENT');
                      const allPhotosApproved = deliverables?.photos?.length > 0 &&
                        deliverables.photos.every(p => p.status === 'SENT_TO_CLIENT');
                      const allRawFootagesApproved = deliverables?.rawFootages?.length > 0 &&
                        deliverables.rawFootages.every(r => r.status === 'SENT_TO_CLIENT');
                      
                      const allApproved = allVideosApproved && allPhotosApproved && allRawFootagesApproved;
                      
                      return allApproved ? (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            console.log('[Send to Client Button Click] submission:', submission);
                            if (!submission || !submission.id) {
                              console.error('[Send to Client Button] submission or submission.id is missing!', submission);
                              enqueueSnackbar('Submission ID is missing!', { variant: 'error' });
                              return;
                            }
                            handleSendToClient(submission.id);
                          }}
                          disabled={isSubmitting || isProcessing}
                          sx={{ bgcolor: '#203ff5', color: 'white', borderRadius: 1.5, px: 2.5, py: 1.2 }}
                        >
                          Send to Client
                        </Button>
                      ) : (
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
                      );
                    })()}
                  </>
                ) : isV3 && userRole === 'client' && (submission?.status === 'PENDING_REVIEW' || currentStatus === 'SENT_TO_CLIENT') ? (
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      onClick={() => handleClientReject && handleClientReject(videoItem.id)}
                      size="small"
                      variant="contained"
                      disabled={isSubmitting || isProcessing}
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
                        height: '40px',
                        flex: 1,
                      }}
                    >
                      Request a change
                    </Button>
                    <LoadingButton
                      onClick={() => handleClientApprove && handleClientApprove(videoItem.id)}
                      variant="contained"
                      size="small"
                      loading={isSubmitting || isProcessing}
                      disabled={isVideoApprovedByClient}
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
                      {isVideoApprovedByClient ? 'Approved' : 'Approve'}
                    </LoadingButton>
                  </Stack>
                ) : (
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
                )}
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
              options={options_changes.map((item) => ({
                value: item,
                label: item,
              }))}
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
      </CardContent>

      {/* Feedback History */}
      {videoFeedback.length > 0 && (
        <Box sx={{ px: 2, pb: 2 }}>
          {/* <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.primary' }}>
            Feedback History
          </Typography> */}
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
                {isV3 && userRole === 'admin' && (feedback.admin?.admin?.role?.name === 'client' || feedback.admin?.admin?.role?.name === 'Client') && (
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        const adminFeedback = prompt('Edit client feedback (optional):');
                        if (adminFeedback !== null) {
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
                      onClick={() => handleAdminSendToCreator(videoItem.id, feedback.id)}
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

VideoCard.propTypes = {
  videoItem: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    url: PropTypes.string.isRequired,
    status: PropTypes.string,
    createdAt: PropTypes.string,
    caption: PropTypes.string,
    individualFeedback: PropTypes.array,
  }).isRequired,
  index: PropTypes.number.isRequired,
  submission: PropTypes.object,
  onVideoClick: PropTypes.func.isRequired,
  handleApprove: PropTypes.func.isRequired,
  handleRequestChange: PropTypes.func.isRequired,
  selectedVideosForChange: PropTypes.array.isRequired,
  handleVideoSelection: PropTypes.func.isRequired,
  // V2 props
  onIndividualApprove: PropTypes.func,
  onIndividualRequestChange: PropTypes.func,
  isV3: PropTypes.bool,
  userRole: PropTypes.string,
  handleSendToClient: PropTypes.func,
  // V3 client handlers
  handleClientApprove: PropTypes.func,
  handleClientReject: PropTypes.func,
  // V3 deliverables for status checking
  deliverables: PropTypes.object,
};

// Add SWR hook for submission
const fetchSubmission = async (url) => {
  const { data } = await axiosInstance.get(url);
  return data;
};

const DraftVideos = ({
  campaign,
  submission,
  deliverables,
  onVideoClick,
  onSubmit,
  isDisabled,
  // V2 individual handlers
  onIndividualApprove,
  onIndividualRequestChange,
  // Individual client approval handlers
  handleClientApproveVideo,
  handleClientApprovePhoto,
  handleClientApproveRawFootage,
  handleClientRejectVideo,
  handleClientRejectPhoto,
  handleClientRejectRawFootage,
}) => {
  const [selectedVideosForChange, setSelectedVideosForChange] = useState([]);
  const [sentSubmissions, setSentSubmissions] = useState(new Set());
  const [isSending, setIsSending] = useState(false);
  const approve = useBoolean();
  const request = useBoolean();

  // SWR for submission status
  const { data: swrSubmission, mutate: mutateSubmission, isLoading: isSubmissionLoading, error: submissionError } = useSWR(
    submission?.id ? `/api/submission/v3/${submission.id}` : null,
    fetchSubmission,
    { refreshInterval: 0 }
  );

  // Use SWR submission as the source of truth
  const currentSubmission = swrSubmission || submission;

  const handleVideoSelection = (id) => {
    setSelectedVideosForChange((prev) => {
      if (prev.includes(id)) {
        return prev.filter((videoId) => videoId !== id);
      }
      return [...prev, id];
    });
  };

  const handleApprove = async (videoId, formValues) => {
    try {
      const payload = {
        submissionId: submission.id,
        mediaId: videoId,
        action: 'approve',
        feedback: formValues.feedback || '',
      };

      const response = await axiosInstance.post('/api/submission/v3/draft/approve', payload);

      if (response.status === 200) {
        enqueueSnackbar('Video approved successfully!', { variant: 'success' });
        // Refresh data
        if (deliverables?.deliverableMutate) {
          await deliverables.deliverableMutate();
        }
        if (deliverables?.submissionMutate) {
          await deliverables.submissionMutate();
        }
      }
    } catch (error) {
      console.error('Error approving video:', error);
      enqueueSnackbar('Failed to approve video', { variant: 'error' });
    }
  };

  const handleRequestChange = async (videoId, formValues) => {
    try {
      const payload = {
        submissionId: submission.id,
        mediaId: videoId,
        action: 'request_change',
        feedback: formValues.feedback || '',
      };

      const response = await axiosInstance.post('/api/submission/v3/draft/request-changes', payload);

      if (response.status === 200) {
        enqueueSnackbar('Changes requested successfully!', { variant: 'success' });
        // Refresh data
        if (deliverables?.deliverableMutate) {
          await deliverables.deliverableMutate();
        }
        if (deliverables?.submissionMutate) {
          await deliverables.submissionMutate();
        }
      }
    } catch (error) {
      console.error('Error requesting changes:', error);
      enqueueSnackbar('Failed to request changes', { variant: 'error' });
    }
  };

  const handleSendToClient = async (submissionId) => {
    try {
      const response = await axiosInstance.post('/api/submission/v3/draft/send-to-client', {
        submissionId,
      });

      if (response.status === 200) {
        enqueueSnackbar('Draft sent to client successfully!', { variant: 'success' });
        // Refresh data
        if (deliverables?.deliverableMutate) {
          await deliverables.deliverableMutate();
        }
        if (deliverables?.submissionMutate) {
          await deliverables.submissionMutate();
        }
      }
    } catch (error) {
      console.error('Error sending to client:', error);
      enqueueSnackbar('Failed to send to client', { variant: 'error' });
    }
  };

  const handleClientApprove = async (mediaId) => {
    try {
      // Optimistic update - immediately update the UI
      const optimisticData = deliverables?.videos?.map(video => 
        video.id === mediaId ? { ...video, status: 'APPROVED' } : video
      );
      
      if (deliverables?.deliverableMutate) {
        deliverables.deliverableMutate(
          { ...deliverables, videos: optimisticData },
          false // Don't revalidate immediately
        );
      }

      await axiosInstance.patch('/api/submission/v3/media/approve/client', {
        mediaId,
        mediaType: 'video',
        feedback: 'Approved by client',
      });
      
      enqueueSnackbar('Client approved successfully!', { variant: 'success' });
      
      // Revalidate with server data
      await mutateSubmission();
      if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
      if (deliverables?.submissionMutate) await deliverables.submissionMutate();
    } catch (error) {
      console.error('Error approving video:', error);
      enqueueSnackbar('Failed to client approve', { variant: 'error' });
      // Revert optimistic update on error
      if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
    }
  };

  const handleClientReject = async (mediaId, feedback = 'Changes requested by client', reasons = ['Client rejection']) => {
    try {
      await axiosInstance.patch('/api/submission/v3/media/request-changes/client', {
        mediaId,
        mediaType: 'video',
        feedback,
        reasons,
      });
      enqueueSnackbar('Client rejected successfully!', { variant: 'warning' });
      await mutateSubmission(); // SWR revalidate
      if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
      if (deliverables?.submissionMutate) await deliverables.submissionMutate();
    } catch (error) {
      enqueueSnackbar('Failed to client reject', { variant: 'error' });
    }
  };

  const handleAdminEditFeedback = async (mediaId, feedbackId, adminFeedback) => {
    try {
      // For now, just store the edited feedback locally
      console.log('Admin editing feedback:', { mediaId, feedbackId, adminFeedback });
      enqueueSnackbar('Feedback updated successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error updating feedback:', error);
      enqueueSnackbar('Failed to update feedback', { variant: 'error' });
    }
  };

  const handleAdminSendToCreator = async (mediaId, feedbackId) => {
    // Check if this submission has already been sent
    if (sentSubmissions.has(mediaId)) {
      enqueueSnackbar('This submission has already been sent to creator', { variant: 'warning' });
      return;
    }

    // Check if we're currently sending
    if (isSending) {
      enqueueSnackbar('Please wait, sending in progress...', { variant: 'info' });
      return;
    }

    setIsSending(true);
    
    try {
      // Mark this submission as sent immediately to prevent double-clicks
      setSentSubmissions(prev => new Set([...prev, mediaId]));

      // Call the API to review and forward client feedback
      const response = await axiosInstance.patch('/api/submission/v3/draft/review-feedback', {
        submissionId: submission.id,
        adminFeedback: 'Feedback reviewed and forwarded to creator'
      });

      if (response.status === 200) {
        enqueueSnackbar(`Feedback for video sent to creator successfully!`, { variant: 'success' });
        
        // Check if all videos have been sent
        const allVideos = deliverables.videos || [];
        const allVideosSent = allVideos.every(video => sentSubmissions.has(video.id));
        
        if (allVideosSent) {
          enqueueSnackbar('All videos have been sent to creator!', { variant: 'success' });
          
          // Refresh data after all are sent
          if (deliverables?.deliverableMutate) {
            await deliverables.deliverableMutate();
          }
          if (deliverables?.submissionMutate) {
            await deliverables.submissionMutate();
          }
        }
      }
    } catch (error) {
      console.error('Error sending feedback to creator:', error);
      
      // Remove from sent submissions if it failed
      setSentSubmissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(mediaId);
        return newSet;
      });
      
      enqueueSnackbar('Failed to send feedback to creator', { variant: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  // Check if all videos are already approved
  const allVideosApproved = deliverables?.videos?.length > 0 && 
    deliverables.videos.every(v => v.status === 'APPROVED');

  // Determine layout type
  const hasVideos = deliverables?.videos?.length > 0;
  const shouldUseHorizontalScroll = hasVideos && deliverables.videos.length > 1;
  const shouldUseGrid = hasVideos && deliverables.videos.length === 1;

  // In DraftVideos (parent), define isV3 and userRole
  const isV3 = campaign?.origin === 'CLIENT';
  const { user } = useAuthContext();
  const userRole = user?.role || 'admin'; // Use actual user role from auth context

  const handleIndividualVideoApprove = async (videoId, feedback) => {
    let response;
    try {
      if (isV3) {
        response = await axiosInstance.patch('/api/submission/v3/media/approve', {
          mediaId: videoId,
          mediaType: 'video',
          feedback: feedback || 'Approved by admin'
        });
        
        // Check if all media items are now approved
        if (response.data.allApproved) {
          enqueueSnackbar('All media approved! Submission sent to client.', { variant: 'success' });
        } else {
          enqueueSnackbar('Video approved successfully!', { variant: 'success' });
        }
      } else {
        response = await onIndividualApprove(videoId, feedback);
        enqueueSnackbar('Video approved successfully!', { variant: 'success' });
      }
      
      if (onSubmit) onSubmit();
    } catch (error) {
      console.error('Error approving video:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error approving video', { variant: 'error' });
    }
  };

  const handleIndividualVideoRequestChange = async (videoId, feedback, reasons) => {
    let response;
    try {
      if (isV3) {
        response = await axiosInstance.patch('/api/submission/v3/media/request-changes', {
          mediaId: videoId,
          mediaType: 'video',
          feedback: feedback || 'Changes requested by admin',
          reasons: reasons || ['Admin feedback']
        });
      } else {
        response = await onIndividualRequestChange(videoId, feedback);
      }
      enqueueSnackbar('Changes requested successfully!', { variant: 'warning' });
      if (onSubmit) onSubmit();
    } catch (error) {
      console.error('Error requesting changes for video:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error requesting changes', { variant: 'error' });
    }
  };



  return (
    <>
      {/* Draft Videos Horizontal Scroll */}
      {!hasVideos && (
        <Typography>No draft videos uploaded yet.</Typography>
      )}

      {shouldUseHorizontalScroll && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            overflowY: 'hidden',
            pb: 1,
            maxWidth: '100%',
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#c1c1c1',
              borderRadius: 4,
              '&:hover': {
                backgroundColor: '#a8a8a8',
              },
            },
          }}
        >
          {deliverables.videos.map((video, index) => (
            <Box
              key={video.id || index}
              sx={{
                width: { xs: '280px', sm: '300px', md: '300px' },
                minWidth: { xs: '280px', sm: '300px', md: '300px' },
                flexShrink: 0,
              }}
            >
              <VideoCard 
                videoItem={video} 
                index={index}
                submission={currentSubmission}
                onVideoClick={onVideoClick}
                handleApprove={handleApprove}
                handleRequestChange={handleRequestChange}
                selectedVideosForChange={selectedVideosForChange}
                handleVideoSelection={handleVideoSelection}
                // V2 individual handlers
                onIndividualApprove={onIndividualApprove}
                onIndividualRequestChange={onIndividualRequestChange}
                isV3={isV3}
                userRole={userRole}
                handleSendToClient={handleSendToClient}
                // V3 client handlers
                handleClientApprove={handleClientApprove}
                handleClientReject={handleClientReject}
                // V3 deliverables for status checking
                deliverables={deliverables}
                // V3 admin feedback handlers
                handleAdminEditFeedback={handleAdminEditFeedback}
                handleAdminSendToCreator={handleAdminSendToCreator}
              />
            </Box>
          ))}
        </Box>
      )}

      {shouldUseGrid && (
        <Grid container spacing={2}>
          {deliverables.videos.map((video, index) => (
            <Grid 
              item 
              xs={12} 
              md={7} 
              key={video.id || index}
            >
              <VideoCard 
                videoItem={video} 
                index={index}
                submission={currentSubmission}
                onVideoClick={onVideoClick}
                handleApprove={handleApprove}
                handleRequestChange={handleRequestChange}
                selectedVideosForChange={selectedVideosForChange}
                handleVideoSelection={handleVideoSelection}
                // V2 individual handlers
                onIndividualApprove={onIndividualApprove}
                onIndividualRequestChange={onIndividualRequestChange}
                isV3={isV3}
                userRole={userRole}
                handleSendToClient={handleSendToClient}
                // V3 client handlers
                handleClientApprove={handleClientApprove}
                handleClientReject={handleClientReject}
                // V3 deliverables for status checking
                deliverables={deliverables}
                // V3 admin feedback handlers
                handleAdminEditFeedback={handleAdminEditFeedback}
                handleAdminSendToCreator={handleAdminSendToCreator}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Caption Section */}
      {hasVideos && deliverables.videos.some(video => 
        video?.caption || submission?.caption || submission?.firstDraft?.caption
      ) && (
        <Box sx={{ mt: 3, mb: -2 }}>
          {(() => {
            // Get the first available caption from any source
            const caption = deliverables.videos.find(video => video?.caption)?.caption || 
                           submission?.caption || 
                           submission?.firstDraft?.caption;
            
            if (!caption) return null;
            
            return (
              <Box
                sx={{
                  p: 2,
                  borderRadius: '8px',
                  bgcolor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: '#666',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'block',
                    mb: 1,
                  }}
                >
                  Caption
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#333',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {caption}
                </Typography>
              </Box>
            );
          })()}
        </Box>
      )}

      {/* All Videos Approved Message */}
      {allVideosApproved && (
        <Box
          sx={{
            p: 2,
            borderRadius: '8px',
            bgcolor: '#E6F7EF',
            border: '1px solid #1ABF66',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mt: 3,
          }}
        >
          <Iconify icon="solar:check-circle-bold" width={16} color="#1ABF66" />
          <Typography
            sx={{
              color: '#1ABF66',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            All draft videos have been approved
          </Typography>
        </Box>
      )}

      {/* Confirmation Modals */}
      <ConfirmationApproveModal
        open={approve.value}
        onClose={approve.onFalse}
        sectionType="video"
        onConfirm={() => {}}
        isSubmitting={false}
        isDisabled={isDisabled}
        watchData={{}}
      />

      <ConfirmationRequestModal
        open={request.value}
        onClose={request.onFalse}
        sectionType="video"
        onConfirm={() => {}}
        watchData={{}}
        isDisabled={false}
        selectedItemsCount={1}
      />
    </>
  );
};

DraftVideos.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  deliverables: PropTypes.object,
  onVideoClick: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool,
  // V2 props
  onIndividualApprove: PropTypes.func,
  onIndividualRequestChange: PropTypes.func,
  // Individual client approval handlers
  handleClientApproveVideo: PropTypes.func,
  handleClientApprovePhoto: PropTypes.func,
  handleClientApproveRawFootage: PropTypes.func,
  handleClientRejectVideo: PropTypes.func,
  handleClientRejectPhoto: PropTypes.func,
  handleClientRejectRawFootage: PropTypes.func,
};

export default DraftVideos; 