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
  Link,
  Card,
  Chip,
  Stack,
  Button,
  Avatar,
  Typography,
  CardContent,
  TextField,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFMultiSelect } from 'src/components/hook-form';

import { options_changes } from '../firstDraft/constants';
import { ConfirmationApproveModal, ConfirmationRequestModal } from './confirmation-modals';

const RawFootageCard = ({
  rawFootageItem,
  index,
  submission,
  onRawFootageClick,
  handleApprove,
  handleRequestChange,
  selectedRawFootagesForChange,
  handleRawFootageSelection,
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
  // Add state for editing feedback
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  const requestSchema = Yup.object().shape({
    feedback: Yup.string().required('This field is required'),
  });

  const approveSchema = Yup.object().shape({
    feedback: Yup.string().required('Comment is required.'),
  });

  const formMethods = useForm({
    resolver: cardType === 'request' ? yupResolver(requestSchema) : yupResolver(approveSchema),
    defaultValues: {
      feedback: cardType === 'approve' ? 'Thank you for submitting!' : '',
    },
  });

  const { formState: { isSubmitting }, reset } = formMethods;

  // Reset form when cardType changes
  useEffect(() => {
    reset({
      feedback: cardType === 'approve' ? 'Thank you for submitting!' : '',
    });
  }, [cardType, reset]);

  // Reset local status when videoItem status changes (server update)
  useEffect(() => {
    setLocalStatus(null);
  }, [rawFootageItem.status]);

  // Use local status if available, otherwise use prop status
  const currentStatus = localStatus || rawFootageItem.status;
  const isRawFootageApprovedByAdmin = currentStatus === 'SENT_TO_CLIENT';
  const isRawFootageApprovedByClient = currentStatus === 'APPROVED';
  const hasRevisionRequested = currentStatus === 'REVISION_REQUESTED' || currentStatus === 'CHANGES_REQUIRED' || currentStatus === 'CLIENT_FEEDBACK';
  const isClientFeedback = currentStatus === 'CLIENT_FEEDBACK';
  const isChangesRequired = currentStatus === 'CHANGES_REQUIRED' || currentStatus === 'REVISION_REQUESTED';

  // For client role, SENT_TO_CLIENT status should be treated as PENDING_REVIEW
  const isPendingReview = userRole === 'client' ?
    // For clients: show approval buttons when media is SENT_TO_CLIENT or submission is PENDING_REVIEW
    (currentStatus === 'SENT_TO_CLIENT' || (submission?.status === 'PENDING_REVIEW' && !isRawFootageApprovedByClient && !hasRevisionRequested)) :
    // For non-clients: show approval buttons when submission is PENDING_REVIEW and media not approved
    (submission?.status === 'PENDING_REVIEW' && !isRawFootageApprovedByAdmin && !hasRevisionRequested);

  // Get feedback for this specific raw footage
  const getRawFootageFeedback = () => {
    // Check for individual feedback first (from deliverables API)
    if (rawFootageItem.individualFeedback && rawFootageItem.individualFeedback.length > 0) {
      return rawFootageItem.individualFeedback;
    }

    // Get all feedback from submission (from deliverables API)
    const allFeedbacks = [
      ...(deliverables?.submissions?.flatMap(sub => sub.feedback) || []),
      ...(submission?.feedback || [])
    ];

    // Filter feedback for this specific raw footage
    const rawFootageSpecificFeedback = allFeedbacks
      .filter(feedback => feedback.rawFootageToUpdate?.includes(rawFootageItem.id))
      .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));

    // Also include client feedback for this submission (when raw footage status is CLIENT_FEEDBACK)
    const clientFeedback = allFeedbacks
      .filter(feedback => {
        const isClient = feedback.admin?.admin?.role?.name === 'client' || feedback.admin?.admin?.role?.name === 'Client';
        const isFeedback = feedback.type === 'REASON' || feedback.type === 'COMMENT';
        const isClientFeedbackStatus = rawFootageItem.status === 'CLIENT_FEEDBACK';

        return isClient && isFeedback && isClientFeedbackStatus;
      })
      .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));

    return [...rawFootageSpecificFeedback, ...clientFeedback];
  };

  const rawFootageFeedback = getRawFootageFeedback();

  // Helper function to determine border color
  const getBorderColor = () => {
    // For client role, SENT_TO_CLIENT status should not show green outline
    if (isClientFeedback || hasRevisionRequested) return '#F6C000'; // yellow for CLIENT_FEEDBACK and REVISION_REQUESTED
    if (isChangesRequired) return '#D4321C'; // red
    if (isRawFootageApprovedByClient) return '#1ABF66'; // green for approved (by client)
    if (userRole !== 'client' && isRawFootageApprovedByAdmin) return '#1ABF66'; // green for admin approved
    return 'divider';
  };

  // V2 Individual handlers
  const handleIndividualApproveClick = async () => {
    if (isV3) {
      await handleApprove(rawFootageItem.id, formMethods.getValues());
    } else if (onIndividualApprove) {
      await onIndividualApprove(rawFootageItem.id, formMethods.getValues().feedback);
    }
  };

  const handleIndividualRequestClick = async () => {
    if (!onIndividualRequestChange) return;

    setIsProcessing(true);
    try {
      const values = formMethods.getValues();
      await onIndividualRequestChange(rawFootageItem.id, values.feedback);
      // Optimistically update local status
      setLocalStatus('CHANGES_REQUIRED');
    } catch (error) {
      console.error('Error requesting raw footage changes:', error);
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
        await handleApprove(rawFootageItem.id, values);
        // Optimistically update local status for fallback handler - admin sends to client, client approves
        setLocalStatus(userRole === 'client' ? 'APPROVED' : 'SENT_TO_CLIENT');
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
        await handleRequestChange(rawFootageItem.id, values);
        // Optimistically update local status for fallback handler
        setLocalStatus('CHANGES_REQUIRED');
      } catch (error) {
        console.error('Error in fallback request handler:', error);
      }
    }
  };

  const renderFormContent = () => {
    if (!isPendingReview) {
      // Show approved status when client has approved
      if (isRawFootageApprovedByClient) {
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
      // For client role, SENT_TO_CLIENT status should show approval buttons, not APPROVED status
      if (isRawFootageApprovedByAdmin && userRole !== 'client') {
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
              SENT TO CLIENT
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
                color: '#F6C000',
                border: '1.5px solid',
                borderColor: '#F6C000',
                borderBottom: 3,
                borderBottomColor: '#F6C000',
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
              CLIENT FEEDBACK
            </Box>
          </Box>
        );
      }

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
                          sx={{ bgcolor: '#FFFFFF', color: '#1ABF66', border: '1.5px solid', borderColor: '#e7e7e7', borderBottom: 3, borderBottomColor: '#e7e7e7', borderRadius: 1.15, py: 1.2, fontWeight: 600, fontSize: '0.9rem', height: '40px', textTransform: 'none', flex: 1 }}
                        >
                          Approve
                        </LoadingButton>
                      );
                    })()}
                  </>
                ) : isV3 && userRole === 'client' && (submission?.status === 'PENDING_REVIEW' || currentStatus === 'SENT_TO_CLIENT') ? (
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      onClick={() => handleClientReject && handleClientReject(rawFootageItem.id)}
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
                      onClick={() => handleClientApprove && handleClientApprove(rawFootageItem.id)}
                      variant="contained"
                      size="small"
                      loading={isSubmitting || isProcessing}
                      disabled={isRawFootageApprovedByClient}
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
                      {isRawFootageApprovedByClient ? 'Approved' : 'Approve'}
                    </LoadingButton>
                  </Stack>
                ) : (
                  <LoadingButton
                    onClick={handleApproveClick}
                    variant="contained"
                    size="small"
                    loading={isSubmitting || isProcessing}
                    sx={{ bgcolor: '#FFFFFF', color: '#1ABF66', border: '1.5px solid', borderColor: '#e7e7e7', borderBottom: 3, borderBottomColor: '#e7e7e7', borderRadius: 1.15, py: 1.2, fontWeight: 600, fontSize: '0.9rem', height: '40px', textTransform: 'none', flex: 1 }}
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

            <RHFTextField
              name="feedback"
              multiline
              minRows={5}
              placeholder="Provide feedback for the raw footage."
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
        {rawFootageItem.createdAt && (
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
              {dayjs(rawFootageItem.createdAt).format('MMM D, YYYY h:mm A')}
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
            src={rawFootageItem.url}
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
              <Iconify
                icon="si:warning-fill"
                width={20}
                color="warning.main"
              />
            </Box>
          )}

          {isRawFootageApprovedByAdmin && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 1,
              }}
            >
              <Iconify
                icon="lets-icons:check-fill"
                width={20}
                color="success.main"
              />
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
            onClick={() => onRawFootageClick(index)}
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
      {rawFootageFeedback.length > 0 && (
        <Box sx={{ px: 2, pb: 2 }}>
          {/* <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.primary' }}>
            Feedback History
          </Typography> */}
          <Stack spacing={1.5}>
            {rawFootageFeedback.map((feedback, feedbackIndex) => (
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
                              await handleAdminEditFeedback(rawFootageItem.id, feedback.id, editingContent);
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
                        await handleAdminSendToCreator(rawFootageItem.id, feedback.id, setLocalStatus, 'rawFootage');
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

RawFootageCard.propTypes = {
  rawFootageItem: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    url: PropTypes.string.isRequired,
    status: PropTypes.string,
    createdAt: PropTypes.string,
    individualFeedback: PropTypes.array,
  }).isRequired,
  index: PropTypes.number.isRequired,
  submission: PropTypes.object,
  onRawFootageClick: PropTypes.func.isRequired,
  handleApprove: PropTypes.func.isRequired,
  handleRequestChange: PropTypes.func.isRequired,
  selectedRawFootagesForChange: PropTypes.array.isRequired,
  handleRawFootageSelection: PropTypes.func.isRequired,
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
};

const RawFootages = ({
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
  const [selectedRawFootagesForChange, setSelectedRawFootagesForChange] = useState([]);
  const [sentSubmissions, setSentSubmissions] = useState(new Set());
  const [isSending, setIsSending] = useState(false);
  const approve = useBoolean();
  const request = useBoolean();

  // Add state for client request modal
  const [clientRequestModalOpen, setClientRequestModalOpen] = useState(false);
  const [clientRequestRawFootageId, setClientRequestRawFootageId] = useState(null);

  // Add form for client request modal
  const clientRequestForm = useForm({
    defaultValues: { feedback: '', reasons: [] },
  });

  const handleRawFootageSelection = (id) => {
    setSelectedRawFootagesForChange((prev) => {
      if (prev.includes(id)) {
        return prev.filter((videoId) => videoId !== id);
      }
      return [...prev, id];
    });
  };

  const handleApprove = async (videoId, formValues) => {
    try {
      console.log('[RAW FOOTAGE] handleApprove called with:', { videoId, formValues });
      console.log('[RAW FOOTAGE] Campaign origin:', campaign?.origin);
      console.log('[RAW FOOTAGE] Is V3 campaign:', campaign?.origin === 'CLIENT');

      const payload = {
        mediaId: videoId,
        mediaType: 'rawFootage',
        feedback: formValues.feedback || ''
      };

      console.log('[RAW FOOTAGE] Sending API request to /api/submission/v3/media/approve with payload:', payload);

      const response = await axiosInstance.patch('/api/submission/v3/media/approve', payload);

      console.log('[RAW FOOTAGE] API response:', response);
      console.log('[RAW FOOTAGE] Response status:', response.status);
      console.log('[RAW FOOTAGE] Response data:', response.data);

      if (response.status === 200) {
        enqueueSnackbar('Raw footage approved successfully!', { variant: 'success' });
        // Refresh data using SWR mutations
        if (deliverableMutate) {
          console.log('[RAW FOOTAGE] Refreshing deliverables data...');
          await deliverableMutate();
        }
        if (submissionMutate) {
          console.log('[RAW FOOTAGE] Refreshing submission data...');
          await submissionMutate();
        }
      }
    } catch (error) {
      console.error('[RAW FOOTAGE] Error approving raw footage:', error);
      console.error('[RAW FOOTAGE] Error response:', error?.response);
      console.error('[RAW FOOTAGE] Error message:', error?.message);
      enqueueSnackbar('Failed to approve raw footage', { variant: 'error' });
    }
  };

  const handleRequestChange = async (videoId, formValues) => {
    try {
      const response = await axiosInstance.patch('/api/submission/v3/media/request-changes', {
        mediaId: videoId,
        mediaType: 'rawFootage',
        feedback: formValues.feedback || '',
        reasons: formValues.reasons || []
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
        // Refresh data using SWR mutations
        if (deliverableMutate) {
          await deliverableMutate();
        }
        if (submissionMutate) {
          await submissionMutate();
        }
      }
    } catch (error) {
      console.error('Error sending to client:', error);
      enqueueSnackbar('Failed to send to client', { variant: 'error' });
    }
  };

  // Use the prop function instead of local implementation
  const handleClientApprove = handleClientApproveRawFootage;

  // Use the prop function instead of local implementation
  const handleClientReject = handleClientRejectRawFootage;

  const handleOpenClientRequestModal = (rawFootageId) => {
    setClientRequestRawFootageId(rawFootageId);
    setClientRequestModalOpen(true);
  };
  const handleCloseClientRequestModal = () => {
    setClientRequestModalOpen(false);
    setClientRequestRawFootageId(null);
    clientRequestForm.reset();
  };

  const handleClientRequestSubmit = async (data) => {
    if (!clientRequestRawFootageId) return;
    try {
      await axiosInstance.patch(`/api/submission/v3/${submission.id}/request-changes/client`, {
        feedback: data.feedback,
        reasons: data.reasons,
        mediaId: clientRequestRawFootageId,
        mediaType: 'rawFootage',
      });
      enqueueSnackbar('Change request submitted!', { variant: 'warning' });
      handleCloseClientRequestModal();
      if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
      if (deliverables?.submissionMutate) await deliverables.submissionMutate();
    } catch (error) {
      enqueueSnackbar('Failed to request changes', { variant: 'error' });
    }
  };

  // Check if all raw footages are already approved
  const allRawFootagesApproved = deliverables?.rawFootages?.length > 0 &&
    deliverables.rawFootages.every(f => f.status === 'APPROVED');

  // Determine layout type
  const hasRawFootages = deliverables?.rawFootages?.length > 0;
  const shouldUseHorizontalScroll = hasRawFootages && deliverables.rawFootages.length > 1;
  const shouldUseGrid = hasRawFootages && deliverables.rawFootages.length === 1;

  // In RawFootages (parent), define isV3 and userRole
  const isV3 = campaign?.origin === 'CLIENT';
  const { user } = useAuthContext();
  const userRole = user?.role || 'admin'; // Use actual user role from auth context

  return (
    <>
      {/* Raw Footage Horizontal Scroll */}
      {!hasRawFootages && (
        <Typography>No raw footage uploaded yet.</Typography>
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
          {deliverables.rawFootages.map((footage, index) => {
            const isRawFootageApprovedByAdmin = footage.status === 'SENT_TO_CLIENT';
            const isRawFootageApprovedByClient = footage.status === 'APPROVED';
            const hasRevisionRequested = footage.status === 'REVISION_REQUESTED';
            const isPendingReview = submission?.status === 'PENDING_REVIEW' &&
              (userRole === 'client' ?
                (!isRawFootageApprovedByClient && !hasRevisionRequested) :
                (!isRawFootageApprovedByAdmin && !hasRevisionRequested)
              );

            // Get feedback for this specific raw footage
            const getRawFootageFeedback = () => {
              // Check for individual feedback first
              if (footage.individualFeedback && footage.individualFeedback.length > 0) {
                return footage.individualFeedback;
              }

              // Fallback to submission-level feedback
              const allFeedbacks = [
                ...(submission?.feedback || [])
              ];

              return allFeedbacks
                .filter(feedback => feedback.rawFootageToUpdate?.includes(footage.id))
                .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));
            };

            const rawFootageFeedback = getRawFootageFeedback();

            return (
              <Box
                key={footage.id || index}
                sx={{
                  width: { xs: '240px', sm: '260px', md: '280px' },
                  minWidth: { xs: '240px', sm: '260px', md: '280px' },
                  flexShrink: 0,
                }}
              >
                <RawFootageCard
                  rawFootageItem={footage}
                  index={index}
                  submission={submission}
                  onRawFootageClick={onVideoClick}
                  handleApprove={handleApprove}
                  handleRequestChange={handleRequestChange}
                  selectedRawFootagesForChange={selectedRawFootagesForChange}
                  handleRawFootageSelection={handleRawFootageSelection}
                  // V2 individual handlers
                  onIndividualApprove={onIndividualApprove}
                  onIndividualRequestChange={onIndividualRequestChange}
                  isV3={isV3}
                  userRole={userRole}
                  handleSendToClient={handleSendToClient}
                  handleClientApprove={handleClientApproveRawFootage}
                  handleClientReject={handleClientRejectRawFootage}
                  deliverables={deliverables}
                  // V3 admin feedback handlers
                  handleAdminEditFeedback={handleAdminEditFeedback}
                  handleAdminSendToCreator={handleAdminSendToCreator}
                />
              </Box>
            );
          })}
        </Box>
      )}

      {shouldUseGrid && (
        <Grid container spacing={2}>
          {deliverables.rawFootages.map((footage, index) => {
            const isRawFootageApprovedByAdmin = footage.status === 'SENT_TO_CLIENT';
            const isRawFootageApprovedByClient = footage.status === 'APPROVED';
            const hasRevisionRequested = footage.status === 'REVISION_REQUESTED';
            const isPendingReview = submission?.status === 'PENDING_REVIEW' &&
              (userRole === 'client' ?
                (!isRawFootageApprovedByClient && !hasRevisionRequested) :
                (!isRawFootageApprovedByAdmin && !hasRevisionRequested)
              );

            // Get feedback for this specific raw footage
            const getRawFootageFeedback = () => {
              // Check for individual feedback first
              if (footage.individualFeedback && footage.individualFeedback.length > 0) {
                return footage.individualFeedback;
              }

              // Fallback to submission-level feedback
              const allFeedbacks = [
                ...(submission?.feedback || [])
              ];

              return allFeedbacks
                .filter(feedback => feedback.rawFootageToUpdate?.includes(footage.id))
                .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));
            };

            const rawFootageFeedback = getRawFootageFeedback();

            return (
              <Grid
                item
                xs={12}
                md={8}
                key={footage.id || index}
              >
                <RawFootageCard
                  rawFootageItem={footage}
                  index={index}
                  submission={submission}
                  onRawFootageClick={onVideoClick}
                  handleApprove={handleApprove}
                  handleRequestChange={handleRequestChange}
                  selectedRawFootagesForChange={selectedRawFootagesForChange}
                  handleRawFootageSelection={handleRawFootageSelection}
                  // V2 individual handlers
                  onIndividualApprove={onIndividualApprove}
                  onIndividualRequestChange={onIndividualRequestChange}
                  isV3={isV3}
                  userRole={userRole}
                  handleSendToClient={handleSendToClient}
                  handleClientApprove={handleClientApproveRawFootage}
                  handleClientReject={handleClientRejectRawFootage}
                  deliverables={deliverables}
                  // V3 admin feedback handlers
                  handleAdminEditFeedback={handleAdminEditFeedback}
                  handleAdminSendToCreator={handleAdminSendToCreator}
                />
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Raw Footage Google Drive link */}
      {submission?.rawFootagesDriveLink && (
        <Box
          sx={{
            mt: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              bgcolor: 'grey.50',
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: '#e8f4fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify
                icon="logos:google-drive"
                sx={{
                  width: 20,
                  height: 20,
                }}
              />
            </Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: 'text.primary',
                fontWeight: 600,
              }}
            >
              Additional Raw Footage
            </Typography>
          </Box>

          <Box sx={{ p: 2.5 }}>
            <Link
              href={submission.rawFootagesDriveLink}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                color: '#1844fc',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.2s ease-in-out',
                '&:hover': {
                  color: 'primary.dark',
                  textDecoration: 'underline',
                },
                wordBreak: 'break-all',
              }}
            >
              <Iconify
                icon="eva:external-link-fill"
                sx={{
                  width: 16,
                  height: 16,
                  flexShrink: 0,
                }}
              />
              {submission.rawFootagesDriveLink}
            </Link>
          </Box>
        </Box>
      )}

      {/* All Raw Footages Approved Message */}
      {allRawFootagesApproved && (
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
            mt: 3,
          }}
        >
          <Iconify icon="solar:check-circle-bold" color="success.main" />
          <Typography color="success.darker">
            All raw footage has been approved
          </Typography>
        </Box>
      )}

      {/* Confirmation Modals */}
      <ConfirmationApproveModal
        open={approve.value}
        onClose={approve.onFalse}
        sectionType="rawFootages"
        onConfirm={() => { }}
        isSubmitting={false}
        isDisabled={isDisabled}
        watchData={{}}
      />

      <ConfirmationRequestModal
        open={request.value}
        onClose={request.onFalse}
        sectionType="rawFootages"
        onConfirm={() => { }}
        watchData={{}}
        isDisabled={false}
        selectedItemsCount={1}
      />

      {clientRequestModalOpen && (
        <FormProvider methods={clientRequestForm}>
          <ConfirmationRequestModal
            open={clientRequestModalOpen}
            onClose={handleCloseClientRequestModal}
            sectionType="rawFootage"
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
              placeholder="Provide feedback for the raw footage."
              size="small"
            />
          </ConfirmationRequestModal>
        </FormProvider>
      )}
    </>
  );
};

RawFootages.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  deliverables: PropTypes.object,
  onVideoClick: PropTypes.func,
  onSubmit: PropTypes.func,
  isDisabled: PropTypes.bool,
  // V2 individual handlers
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

export default RawFootages; 