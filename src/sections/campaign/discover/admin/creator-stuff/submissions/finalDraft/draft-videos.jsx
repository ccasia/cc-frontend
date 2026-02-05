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
  Stack,
  Button,
  Avatar,
  Tooltip,
  TextField,
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
  // View-only mode
  isDisabled = false,
}) => {
  const [cardType, setCardType] = useState('approve');
  const [isProcessing, setIsProcessing] = useState(false);
  // Add local state to track status optimistically
  const [localStatus, setLocalStatus] = useState(null);
  // Add state for editing feedback
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  const requestSchema = Yup.object().shape({
    feedback: Yup.string().required('This field is required'),
    reasons: Yup.array(),
  });

  const approveSchema = Yup.object().shape({
    feedback: Yup.string().required('Comment is required.'),
    dueDate: Yup.string().required('Due date is required'),
  });

  const formMethods = useForm({
    resolver: cardType === 'request' ? yupResolver(requestSchema) : yupResolver(approveSchema),
    defaultValues: {
      feedback: cardType === 'approve' ? 'Thank you for submitting!' : '',
      dueDate: null,
      reasons: [],
    },
  });

  const { formState: { isSubmitting }, reset } = formMethods;

  // Reset form when cardType changes
  useEffect(() => {
    reset({
      feedback: cardType === 'approve' ? 'Thank you for submitting!' : '',
      dueDate: null,
      reasons: [],
    });
  }, [cardType, reset]);

  // Reset local status when videoItem status changes (server update)
  useEffect(() => {
    setLocalStatus(null);
  }, [videoItem.status]);

  // Use local status if available, otherwise use prop status
  const currentStatus = localStatus || videoItem.status;
  // For V2: Both admin and client approval show as APPROVED
  const isVideoApprovedByAdmin = currentStatus === 'APPROVED';
  const isVideoApprovedByClient = currentStatus === 'APPROVED';
  const hasRevisionRequested = currentStatus === 'CHANGES_REQUIRED';
  const isClientFeedback = false; // V2 doesn't have client feedback
  const isChangesRequired = currentStatus === 'CHANGES_REQUIRED';
  
  // For V2: Show approval buttons only when video status is PENDING and not approved
  // If video was approved in first draft (status = 'APPROVED'), it should remain approved in final draft
  const isVideoNotApproved = currentStatus !== 'APPROVED';
  const isPendingReview = (currentStatus === 'PENDING' || currentStatus === 'PENDING_REVIEW') && isVideoNotApproved && !hasRevisionRequested;

  const getVideoFeedback = () => {
    // Check for individual feedback first
    if (videoItem.individualFeedback && videoItem.individualFeedback.length > 0) {
      return videoItem.individualFeedback;
    }
    
    // Fallback to submission-level feedback
    const allFeedbacks = [
      ...(submission?.feedback || [])
    ];

    return allFeedbacks
      .filter(feedback => feedback.videosToUpdate?.includes(videoItem.id))
      .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));
  };

  const videoFeedback = getVideoFeedback();

  // Helper function to determine border color
  const getBorderColor = () => {
    // For client role, APPROVED status should not show green outline
    if (isClientFeedback) return '#F6C000'; // yellow for CLIENT_FEEDBACK (V3 only)
    if (isChangesRequired) return '#D4321C'; // red
    if (isVideoApprovedByClient) return '#1ABF66'; // green for approved (by client)
    if (userRole !== 'client' && isVideoApprovedByAdmin) return '#1ABF66'; // green for admin approved
    return 'divider';
  };

  // V2 Individual handlers
  const handleIndividualApproveClick = async () => {
    if (isV3) {
      await handleApprove(videoItem.id, formMethods.getValues());
    } else if (onIndividualApprove) {
      await onIndividualApprove(videoItem.id, formMethods.getValues().feedback, formMethods.getValues().dueDate);
    }
  };

  const handleIndividualRequestClick = async () => {
    if (isV3) {
      await handleRequestChange(videoItem.id, formMethods.getValues());
    } else if (onIndividualRequestChange) {
      const values = formMethods.getValues();
      const cleanReasons = Array.isArray(values.reasons) 
        ? values.reasons.filter(reason => reason !== null && reason !== undefined && reason !== '')
        : [];
      await onIndividualRequestChange(videoItem.id, values.feedback, cleanReasons);
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
        // Optimistically update local status for fallback handler - admin sends to client, client approves
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
      // For client role, APPROVED status should show approval buttons, not APPROVED status
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
      // Removed hasRevisionRequested condition - it was showing yellow "CLIENT FEEDBACK" instead of red "CHANGES REQUIRED"

      if (isChangesRequired) {
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
                  disabled={isProcessing || isDisabled}
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
                    '&.Mui-disabled': {
                      cursor: 'not-allowed',
                      pointerEvents: 'auto',
                    },
                  }}
                >
                  Request a Change
                </Button>
                )}

{(() => {
                  // V3 Admin - Pending Review
                  if (isV3 && userRole === 'admin' && submission?.status === 'PENDING_REVIEW') {
                    return (
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleApproveClick}
                          disabled={isSubmitting || isProcessing}
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
                          }}
                        >
                          Approve
                        </Button>
                      </Stack>
                    );
                  }
                  
                  // V3 Admin - Sent to Admin
                  if (isV3 && userRole === 'admin' && submission?.status === 'SENT_TO_ADMIN') {
                    return (
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
                    );
                  }
                  
                  // Default - Approve Button
                  return (
                    <LoadingButton
                      onClick={handleApproveClick}
                      variant="contained"
                      size="small"
                      loading={isSubmitting || isProcessing}
                      disabled={isDisabled}
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
                        '&.Mui-disabled': {
                          cursor: 'not-allowed',
                          pointerEvents: 'auto',
                        },
                      }}
                    >
                      Approve
                    </LoadingButton>
                  );
                })()}
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
              placeholder="Provide feedback for the draft video."
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
                  disabled={isProcessing || isDisabled}
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
                    '&.Mui-disabled': {
                      cursor: 'not-allowed',
                      pointerEvents: 'auto',
                    },
                  }}
                >
                  Back
                </Button>

                <LoadingButton
                  onClick={handleRequestClick}
                  variant="contained"
                  size="small"
                  loading={isSubmitting || isProcessing}
                  disabled={isDisabled}
                  sx={{
                    bgcolor: '#FFFFFF',
                    color: '#D4321C',
                    border: '1.5px solid',
                    borderColor: '#e7e7e7',
                    borderBottom: 3,
                    borderBottomColor: '#e7e7e7',
                    borderRadius: 1.15,
                    py: 1.2,
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                      borderColor: '#D4321C',
                    },
                    fontSize: '0.9rem',
                    height: '40px',
                    textTransform: 'none',
                    flex: 2,
                    '&.Mui-disabled': {
                      cursor: 'not-allowed',
                      pointerEvents: 'auto',
                    },
                  }}
                >
                  Request Changes
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
                  {/* Removed Change Request chip from display comments */}
                </Stack>
                
                <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
                  {editingFeedbackId === feedback.id ? (
                    <Box>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={async () => {
                            try {
                              await handleAdminEditFeedback(videoItem.id, feedback.id, editingContent);
                              setEditingFeedbackId(null);
                              setEditingContent('');
                            } catch (error) {
                              console.error('Error updating feedback:', error);
                            }
                          }}
                          sx={{
                            fontSize: '0.75rem',
                            py: 0.8,
                            px: 1.5,
                            minWidth: 'auto',
                            border: '1.5px solid #e0e0e0',
                            borderBottom: '3px solid #e0e0e0',
                            color: '#1ABF66',
                            fontWeight: 600,
                            borderRadius: '8px',
                            textTransform: 'none',
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setEditingFeedbackId(null);
                            setEditingContent('');
                          }}
                          sx={{
                            fontSize: '0.75rem',
                            py: 0.8,
                            px: 1.5,
                            minWidth: 'auto',
                            border: '1.5px solid #e0e0e0',
                            borderBottom: '3px solid #e0e0e0',
                            color: '#666666',
                            fontWeight: 600,
                            borderRadius: '8px',
                            textTransform: 'none',
                          }}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    feedback.content
                  )}
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
                {userRole === 'admin' && (feedback.admin?.admin?.role?.name === 'client' || feedback.admin?.admin?.role?.name === 'Client') && (feedback.type === 'REASON' || feedback.type === 'COMMENT') && (submission?.status === 'SENT_TO_ADMIN' || submission?.status === 'CLIENT_FEEDBACK') && (
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        if (!isV3) {
                          enqueueSnackbar('Edit functionality is only available for V3 campaigns', { variant: 'info' });
                          return;
                        }
                        setEditingFeedbackId(feedback.id);
                        setEditingContent(feedback.content || '');
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
                      onClick={async () => {
                        if (!isV3) {
                          enqueueSnackbar('Send to Creator functionality is only available for V3 campaigns', { variant: 'info' });
                          return;
                        }
                        await handleAdminSendToCreator(videoItem.id, feedback.id, setLocalStatus, 'video');
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
  // V2 individual handlers
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
  // V3 admin feedback handlers
  handleAdminEditFeedback: PropTypes.func,
  handleAdminSendToCreator: PropTypes.func,
  // View-only mode
  isDisabled: PropTypes.bool,
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
  // SWR mutation functions
  deliverableMutate,
  submissionMutate,
  // V3 admin feedback handlers
  handleAdminEditFeedback,
  handleAdminSendToCreator,
}) => {
  const [selectedVideosForChange, setSelectedVideosForChange] = useState([]);
  const approve = useBoolean();
  const request = useBoolean();

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
      if (isV3) {
        // V3 flow: Admin approves individual media and sends to client
        const response = await axiosInstance.patch('/api/submission/v3/media/approve', {
          mediaId: videoId,
          mediaType: 'video',
          feedback: formValues?.feedback || 'Video approved by admin'
        });
        
        if (response.status === 200) {
          enqueueSnackbar('Video approved and sent to client!', { variant: 'success' });
          // Refresh data using SWR mutations
          if (deliverableMutate) {
            await deliverableMutate();
          }
          if (submissionMutate) {
            await submissionMutate();
          }
        }
      } else {
        // V2 flow: Direct approval
      const payload = {
        type: 'approve',
          feedback: formValues?.feedback || 'Video approved',
          dueDate: formValues?.dueDate ? dayjs(formValues.dueDate).format('YYYY-MM-DD') : null,
        selectedVideos: [videoId],
      };

      await onSubmit(payload);
      }
    } catch (error) {
      console.error('Error submitting video review:', error);
      enqueueSnackbar(error?.message || 'Error submitting review', {
        variant: 'error',
      });
    }
  };

  const handleRequestChange = async (videoId, formValues) => {
    try {
      if (isV3) {
        // V3 flow: Admin requests changes for individual media
        const response = await axiosInstance.patch('/api/submission/v3/media/request-changes', {
          mediaId: videoId,
          mediaType: 'video',
          feedback: formValues?.feedback || 'Changes requested for video',
          reasons: formValues?.reasons || []
        });
        
        if (response.status === 200) {
          enqueueSnackbar('Changes requested successfully!', { variant: 'success' });
          // Refresh data using SWR mutations
          if (deliverableMutate) {
            await deliverableMutate();
          }
          if (submissionMutate) {
            await submissionMutate();
          }
        }
      } else {
        // V2 flow: Direct request changes
      const payload = {
        type: 'request',
          feedback: formValues?.feedback || 'Changes requested for video',
          reasons: formValues?.reasons || [],
        selectedVideos: [videoId],
      };

      await onSubmit(payload);
      }
    } catch (error) {
      console.error('Error submitting video review:', error);
      enqueueSnackbar(error?.message || 'Error submitting review', {
        variant: 'error',
      });
    }
  };

  const handleSendToClient = async (submissionId) => {
    if (!submissionId) {
      console.error('[handleSendToClient] No submissionId provided!');
      enqueueSnackbar('Submission ID is missing!', { variant: 'error' });
      return;
    }
    try {
      console.log(`[handleSendToClient] PATCH /api/submission/v3/${  submissionId  }/approve/admin`);
      const response = await axiosInstance.patch(
        `/api/submission/v3/${submissionId}/approve/admin`,
        { submissionId, feedback: 'All sections approved by admin' }
      );
      console.log('[handleSendToClient] Success:', response);
      enqueueSnackbar('Sent to client!', { variant: 'success' });
      // Refresh data using SWR mutations
      if (deliverableMutate) {
        await deliverableMutate();
      }
      if (submissionMutate) {
        await submissionMutate();
      }
    } catch (error) {
      console.error('[handleSendToClient] Error:', error, error?.response);
      enqueueSnackbar(error?.response?.data?.message || 'Error sending to client', { variant: 'error' });
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

  // Client approval handler for individual media - use parent's handler with SWR
  // Use the prop function instead of local implementation
  const handleClientApprove = handleClientApproveVideo;

  // Use the prop function instead of local implementation
  const handleClientReject = handleClientRejectVideo;

  // Add state for client request modal
  const [clientRequestModalOpen, setClientRequestModalOpen] = useState(false);
  const [clientRequestVideoId, setClientRequestVideoId] = useState(null);

  // Add form for client request modal
  const clientRequestForm = useForm({
    defaultValues: { feedback: '', reasons: [] },
  });

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
    if (!clientRequestVideoId) return;
    try {
      await axiosInstance.patch(`/api/submission/v3/${submission.id}/request-changes/client`, {
        feedback: data.feedback,
        reasons: data.reasons,
        mediaId: clientRequestVideoId,
        mediaType: 'video',
      });
      enqueueSnackbar('Change request submitted!', { variant: 'warning' });
      handleCloseClientRequestModal();
      if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
      if (deliverables?.submissionMutate) await deliverables.submissionMutate();
    } catch (error) {
      enqueueSnackbar('Failed to request changes', { variant: 'error' });
    }
  };

  return (
    <>
      {/* Videos Horizontal Scroll */}
      {!hasVideos && (
        <Typography>No videos uploaded yet.</Typography>
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
                submission={submission}
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
                handleClientApprove={handleClientApproveVideo}
                handleClientReject={handleClientRejectVideo}
                // V3 deliverables for status checking
                deliverables={deliverables}
                // V3 admin feedback handlers
                handleAdminEditFeedback={handleAdminEditFeedback}
                handleAdminSendToCreator={handleAdminSendToCreator}
                // View-only mode
                isDisabled={isDisabled}
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
                submission={submission}
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
                handleClientApprove={handleClientApproveVideo}
                handleClientReject={handleClientRejectVideo}
                // V3 deliverables for status checking
                deliverables={deliverables}
                // V3 admin feedback handlers
                handleAdminEditFeedback={handleAdminEditFeedback}
                handleAdminSendToCreator={handleAdminSendToCreator}
                // View-only mode
                isDisabled={isDisabled}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Caption Section */}
      {hasVideos && deliverables.videos.some(video => 
        video?.caption || submission?.caption || submission?.finalDraft?.caption
      ) && (
        <Box sx={{ mt: 3, mb: -2 }}>
          {(() => {
            // Get the first available caption from any source
            const caption = deliverables.videos.find(video => video?.caption)?.caption || 
                           submission?.caption || 
                           submission?.finalDraft?.caption;
            
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
            All videos have been approved
          </Typography>
        </Box>
      )}

      {/* Confirmation Modals */}
      <ConfirmationApproveModal
        open={approve.value}
        onClose={approve.onFalse}
        sectionType="videos"
        onConfirm={() => {}}
        isSubmitting={false}
        isDisabled={isDisabled}
        watchData={{}}
      />

      <ConfirmationRequestModal
        open={request.value}
        onClose={request.onFalse}
        sectionType="videos"
        onConfirm={() => {}}
        watchData={{}}
        isDisabled={false}
        selectedItemsCount={1}
      />

      {clientRequestModalOpen && (
        <FormProvider methods={clientRequestForm}>
          <ConfirmationRequestModal
            open={clientRequestModalOpen}
            onClose={handleCloseClientRequestModal}
            sectionType="video"
            onConfirm={clientRequestForm.handleSubmit(handleClientRequestSubmit)}
            isDisabled={false}
            selectedItemsCount={1}
          >
            <RHFMultiSelect
              name="reasons"
              checkbox
              chip
              options={options_changes.map((item) => ({ value: item, label: item }))}
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
          </ConfirmationRequestModal>
        </FormProvider>
      )}
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
  // SWR mutation functions
  deliverableMutate: PropTypes.func,
  submissionMutate: PropTypes.func,
  // V3 admin feedback handlers
  handleAdminEditFeedback: PropTypes.func,
  handleAdminSendToCreator: PropTypes.func,
};

export default DraftVideos;
