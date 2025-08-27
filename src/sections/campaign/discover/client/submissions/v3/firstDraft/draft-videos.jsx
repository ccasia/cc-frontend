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
import { RHFTextField, RHFDatePicker, RHFMultiSelect } from 'src/components/hook-form';


import { options_changes } from './constants';
import { ConfirmationRequestModal } from './confirmation-modals';

const FirstDraftVideoCard = ({ 
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
    // Get feedback from deliverables API only (single source of truth)
    const allFeedbacks = deliverables?.submissions?.flatMap(sub => sub.feedback) || [];
    
    // Filter feedback for this specific video
    const videoSpecificFeedback = allFeedbacks
      .filter(feedback => feedback.videosToUpdate?.includes(videoItem.id))
      .filter(feedback => feedback.content && feedback.content.trim().length > 0); // Only show feedback with content

    // Sort newest first and return
    return videoSpecificFeedback.sort((a, b) => dayjs(b?.createdAt).diff(dayjs(a?.createdAt)));
  };

  const feedback = getVideoFeedback();

  const handleApproveClick = async (data) => {
    setIsProcessing(true);
    try {
      if (isClient) {
        console.log(`🔍 Client sending feedback: "${data?.feedback || ''}" for video ${videoItem.id}`);
        
        // Optimistic update: immediately add the new feedback to the local data
        const newFeedback = {
          id: `temp-${Date.now()}`, // Temporary ID
          content: data?.feedback || '',
          displayContent: data?.feedback || '',
          type: 'COMMENT',
          adminId: { id: 'current-user', name: 'You' }, // Mock admin data
          createdAt: new Date().toISOString(),
          videosToUpdate: [videoItem.id]
        };
        
        // Update local feedback immediately
        const updatedDeliverables = {
          ...deliverables,
          submissions: deliverables?.submissions?.map(sub => ({
            ...sub,
            feedback: [...(sub.feedback || []), newFeedback]
          }))
        };
        
        // Update the deliverables data optimistically
        if (deliverableMutate) {
          deliverableMutate(updatedDeliverables, false); // false = don't revalidate immediately
        }
        
        await axiosInstance.patch('/api/submission/v3/media/approve/client', {
          mediaId: videoItem.id,
          mediaType: 'video',
          feedback: data?.feedback || ''
        });
        
        // Don't call handleClientApprove for client approvals - it causes duplicate API calls
        // The admin component's handleClientApprove is only for admin simulation
        console.log(`🔍 Client approval completed - NOT calling handleClientApprove to avoid duplicate API calls`);
        
        // Now revalidate to get the real data from server
        if (deliverableMutate) {
          await deliverableMutate();
        }
        if (submissionMutate) {
          await submissionMutate();
        }
      } else {
        await handleApprove(videoItem.id, data?.feedback);
      }
      setLocalStatus('APPROVED');
      enqueueSnackbar('Video approved successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error approving video:', error);
      enqueueSnackbar('Failed to approve video', { variant: 'error' });
      
      // Revert optimistic update on error
      if (deliverableMutate) {
        await deliverableMutate();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestChangeClick = async (data) => {
    setIsProcessing(true);
    try {
      if (isClient) {
        console.log(`🔍 Client requesting changes for video ${videoItem.id} with feedback: "${data?.feedback || ''}"`);
        
        await axiosInstance.patch('/api/submission/v3/media/request-changes/client', {
          mediaId: videoItem.id,
          mediaType: 'video',
          feedback: data?.feedback || '',
          reasons: data?.reasons || []
        });
        

        
        // Revalidate to get the updated data from server
        if (deliverableMutate) {
          await deliverableMutate();
        }
      } else {
        await handleRequestChange(videoItem.id, data?.feedback, []);
      }
      setLocalStatus('REVISION_REQUESTED');
      enqueueSnackbar('Changes requested successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error requesting changes:', error);
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
              checkbox
              chip
              options={options_changes.map((item) => ({
                value: item,
                label: item,
              }))}
              label="Reasons"
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
                  onClick={formMethods.handleSubmit(handleRequestChangeClick)}
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
            {feedback.map((fb, feedbackIndex) => (
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
                <Typography variant="body2">{fb.content}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Card>
  );
};

FirstDraftVideoCard.propTypes = {
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
};

export default FirstDraftVideoCard; 