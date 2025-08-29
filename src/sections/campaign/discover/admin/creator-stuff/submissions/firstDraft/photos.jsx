import useSWR, { mutate, mutate as globalMutate } from 'swr';
import dayjs from 'dayjs';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect, useMemo } from 'react';
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
  Tooltip,
  Typography,
  CardContent,
} from '@mui/material';
import { TextField } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

import { ConfirmationApproveModal, ConfirmationRequestModal } from './confirmation-modals';

const PhotoCard = ({ 
  photoItem, 
  index, 
  submission, 
  onImageClick, 
  handleApprove, 
  handleRequestChange,
  selectedPhotosForChange,
  handlePhotoSelection,
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
  // State management for tracking sent items
  setParentSentToCreatorItems,
}) => {
  const [cardType, setCardType] = useState('approve');
  const [isProcessing, setIsProcessing] = useState(false);
  const [localStatus, setLocalStatus] = useState(null);
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [localFeedbackUpdates, setLocalFeedbackUpdates] = useState({});
  const getFeedbackLocalKey = (fb) => (fb?.id ? fb.id : `${fb?.displayContent || fb?.content || ''}|${fb?.createdAt || ''}`);
  const getPhotoFeedbackLocalKey = (photo, fb) => `${photo?.id || 'no-photo-id'}|${getFeedbackLocalKey(fb)}`;
  const [lastEdited, setLastEdited] = useState(null); // { photoId, feedbackId, content, at }

  // Persist overrides across remounts
  const STORAGE_KEY = 'cc_photo_feedback_overrides_v1';
  const loadOverrides = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  };
  const saveOverrides = (overrides) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides)); } catch {}
  };
  useEffect(() => {
    const stored = loadOverrides();
    if (stored && Object.keys(stored).length) {
      setLocalFeedbackUpdates((prev) => ({ ...stored, ...prev }));
    }
  }, []);

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

  // Reset local status when photoItem status changes (server update)
  useEffect(() => {
    setLocalStatus(null);
  }, [photoItem.status]);

  // Use local status if available, otherwise use prop status
  const currentStatus = localStatus || photoItem.status;
  // For V3: Admin approval shows as SENT_TO_CLIENT, Client approval shows as APPROVED
  const isPhotoApprovedByAdmin = currentStatus === 'SENT_TO_CLIENT';
  const isPhotoApprovedByClient = currentStatus === 'APPROVED';
  const hasRevisionRequested = currentStatus === 'REVISION_REQUESTED' || currentStatus === 'CHANGES_REQUIRED' || currentStatus === 'CLIENT_FEEDBACK';
  const isClientFeedback = currentStatus === 'CLIENT_FEEDBACK';
  const isChangesRequired = currentStatus === 'CHANGES_REQUIRED' || currentStatus === 'REVISION_REQUESTED';
  
  // For client role, SENT_TO_CLIENT status should be treated as PENDING_REVIEW
  const isPendingReview = userRole === 'client' ? 
    // For clients: show approval buttons when media is SENT_TO_CLIENT or submission is PENDING_REVIEW
    (currentStatus === 'SENT_TO_CLIENT' || (submission?.status === 'PENDING_REVIEW' && !isPhotoApprovedByClient && !hasRevisionRequested)) :
    // For non-clients: show approval buttons when submission is PENDING_REVIEW and media not approved
    (submission?.status === 'PENDING_REVIEW' && !isPhotoApprovedByAdmin && !hasRevisionRequested);

  // Get feedback for this specific photo
  const getPhotoFeedback = () => {
    const combined = [];

    // Include any per-item feedback if present (often populated by deliverables API)
    if (Array.isArray(photoItem.individualFeedback)) {
      combined.push(...photoItem.individualFeedback);
    }
    
    // Merge feedback coming from submission-level collections
    const allFeedbacks = [
      ...(deliverables?.submissions?.flatMap((sub) => sub.feedback) || []),
      ...(submission?.feedback || []),
    ];

    // Only feedback that targets this photo id
    const photoSpecificFeedback = allFeedbacks.filter((fb) => fb?.photosToUpdate?.includes(photoItem.id));
    combined.push(...photoSpecificFeedback);

    // If we have a last edited feedback for this photo, update or inject it before normalization
    if (lastEdited && lastEdited.photoId === photoItem.id) {
      const idx = combined.findIndex((fb) => fb && fb.id === lastEdited.feedbackId);
      if (idx !== -1) {
        combined[idx] = { ...combined[idx], content: lastEdited.content };
      } else {
        combined.unshift({
          id: lastEdited.feedbackId,
          content: lastEdited.content,
          createdAt: new Date().toISOString(),
          admin: { name: 'Admin' },
          type: 'COMMENT',
          photosToUpdate: [photoItem.id],
          reasons: [],
        });
      }
    }

    // Normalize, drop empty, and dedupe
    const normalized = combined
      .map((fb) => {
        if (!fb) return null;
        // Prefer local override if present
        const compositeKey = getPhotoFeedbackLocalKey(photoItem, fb);
        const override = localFeedbackUpdates[fb.id] ?? localFeedbackUpdates[compositeKey];
        const hasText = typeof fb.content === 'string' && fb.content.trim().length > 0;
        const hasReasons = Array.isArray(fb.reasons) && fb.reasons.length > 0;
        const fallbackDisplay = hasText
          ? fb.content
          : hasReasons
          ? `Reasons: ${fb.reasons.join(', ')}`
          : '';
        return {
          ...fb,
          displayContent: override ?? fallbackDisplay,
          isOverridden: Boolean(override),
        };
      })
      // keep entries that have text or reasons
      .filter((fb) => fb && (fb.displayContent.trim().length > 0));

    // Dedupe by (id if exists) else by content+createdAt
    const seen = new Set();
    const deduped = [];
    for (const fb of normalized) {
      const key = fb.id ? `id:${fb.id}` : `c:${fb.displayContent}|t:${fb.createdAt}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(fb);
      }
    }

    // Sort newest first and return full history
    return deduped.sort((a, b) => dayjs(b?.createdAt).diff(dayjs(a?.createdAt)));
  };

  const photoFeedback = getPhotoFeedback();



  // Helper function to determine border color
  const getBorderColor = () => {
    // For client role, SENT_TO_CLIENT status should not show green outline
    if (isClientFeedback || hasRevisionRequested) return '#F6C000'; // yellow for CLIENT_FEEDBACK and REVISION_REQUESTED
    if (isChangesRequired) return '#D4321C'; // red
    if (userRole === 'client' && isPhotoApprovedByClient) return '#1ABF66';
    if (userRole !== 'client' && isPhotoApprovedByAdmin) return '#1ABF66';
    return 'divider';
  };

  // V2 Individual handlers
  const handleIndividualApproveClick = async () => {
    if (!onIndividualApprove) return;
    
    setIsProcessing(true);
    try {
      const values = formMethods.getValues();
      await onIndividualApprove(photoItem.id, values.feedback);
      // Optimistically update local status - for V3 show SENT_TO_CLIENT, for V2 show APPROVED
      setLocalStatus(isV3 ? 'SENT_TO_CLIENT' : 'APPROVED');
      
      // SWR revalidation for immediate UI update
      if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
      if (deliverables?.submissionMutate) await deliverables.submissionMutate();
    } catch (error) {
      console.error('Error approving photo:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIndividualRequestClick = async () => {
    if (!onIndividualRequestChange) return;
    
    setIsProcessing(true);
    try {
      const values = formMethods.getValues();
      await onIndividualRequestChange(photoItem.id, values.feedback);
      // Optimistically update local status
      setLocalStatus('CHANGES_REQUIRED');
      
      // SWR revalidation for immediate UI update
      if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
      if (deliverables?.submissionMutate) await deliverables.submissionMutate();
    } catch (error) {
      console.error('Error requesting photo changes:', error);
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
        await handleApprove(photoItem.id, values);
        // Optimistically update local status for fallback handler - for V3 show SENT_TO_CLIENT, for V2 show APPROVED
        setLocalStatus(isV3 ? 'SENT_TO_CLIENT' : 'APPROVED');
      } catch (error) {
        console.error('Error in fallback approve handler:', error);
      }
    }
  };

  const handleRequestClick = async () => {
    if (isV3 && userRole === 'client') {
      // Client requesting changes
      try {
        const values = formMethods.getValues();
        await handleClientReject(photoItem.id, values.feedback);
        // Optimistically update local status
        setLocalStatus('CLIENT_FEEDBACK');
        
        // SWR revalidation for immediate UI update
        if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
        if (deliverables?.submissionMutate) await deliverables.submissionMutate();
      } catch (error) {
        console.error('Error in client request handler:', error);
      }
    } else if (onIndividualRequestChange) {
      await handleIndividualRequestClick();
    } else {
      try {
        const values = formMethods.getValues();
        await handleRequestChange(photoItem.id, values);
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
      if (isPhotoApprovedByAdmin && userRole !== 'client') {
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
              {isV3 ? 'SENT TO CLIENT' : 'APPROVED'}
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
                      onClick={() => setCardType('request')}
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
                      onClick={() => handleClientApprove && handleClientApprove(photoItem.id)}
                      variant="contained"
                      size="small"
                      loading={isSubmitting || isProcessing}
                      disabled={isPhotoApprovedByClient}
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
                      {isPhotoApprovedByClient ? 'Approved' : 'Approve'}
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
              placeholder="Provide feedback for the photo."
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
        boxShadow: isChangesRequired ? '0 0 0 2px rgba(212,50,28,0.15)' : 'none',
      }}
    >
      {/* Photo Section */}
      <Box sx={{ p: 2, pb: 1 }}>
        {/* Submission Date */}
        {photoItem.createdAt && (
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
              {dayjs(photoItem.createdAt).format('MMM D, YYYY h:mm A')}
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
            component="img"
            src={photoItem.url}
            alt={`Photo ${index + 1}`}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />



          {isPhotoApprovedByAdmin && (
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
            onClick={() => onImageClick(index)}
          />
        </Box>
      </Box>

      {/* Form Section */}
      <CardContent sx={{ pt: 0 }}>
        {renderFormContent()}
      </CardContent>

      {/* Feedback History */}
      {photoFeedback.length > 0 && (
        <Box sx={{ px: 2, pb: 2 }}>
          {/* <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.primary' }}>
            Feedback History
          </Typography> */}
          <Stack spacing={1.5}>

            {photoFeedback.map((feedback, feedbackIndex) => (
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
                      color="warning"
                      variant="soft"
                      sx={{ ml: 'auto' }}
                    />
                  )}
                </Stack>
                {editingFeedbackId === feedback.id ? (
                  <Stack spacing={1} sx={{ mb: 1 }}>
                    <TextField
                      fullWidth
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      multiline
                      rows={3}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          const ok = await handleAdminEditFeedback(photoItem.id, feedback.id, editingContent);
                          if (ok) {
                            const compositeKey = getPhotoFeedbackLocalKey(photoItem, feedback);
                            const idKey = feedback?.id;
                            setLocalFeedbackUpdates((prev) => {
                              const next = {
                                ...prev,
                                ...(idKey ? { [idKey]: editingContent } : {}),
                                [compositeKey]: editingContent,
                              };
                              // persist
                              const stored = loadOverrides();
                              saveOverrides({ ...stored, ...next });
                              return next;
                            });
                            setLastEdited({ photoId: photoItem.id, feedbackId: feedback.id, content: editingContent, at: Date.now() });
                            console.log('✅ Optimistic override set for photo feedback:', {
                              photoId: photoItem.id,
                              feedbackId: feedback.id,
                              idKey,
                              compositeKey,
                              newValue: editingContent,
                            });
                            
                            // Defer SWR revalidation slightly to avoid UI jump
                            setTimeout(() => {
                              try { if (deliverables?.deliverableMutate) deliverables.deliverableMutate(); } catch {}
                              try { if (deliverables?.submissionMutate) deliverables.submissionMutate(); } catch {}
                            }, 500);
                          }
                          setEditingFeedbackId(null);
                          setEditingContent('');
                        }}
                        sx={{
                          fontSize: '0.75rem',
                          py: 0.8,
                          px: 1.5,
                          minWidth: 'auto',
                          bgcolor: '#ffffff',
                          border: '1.5px solid #1ABF66',
                          borderBottom: '3px solid #169c52',
                          color: '#1ABF66',
                          fontWeight: 600,
                          borderRadius: '8px',
                          textTransform: 'none',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: '#f0f9f0',
                            color: '#1ABF66',
                            borderColor: '#169c52',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 8px rgba(26, 191, 102, 0.2)',
                          },
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setEditingFeedbackId(null);
                          setEditingContent('');
                        }}
                        sx={{
                          fontSize: '0.75rem',
                          py: 0.8,
                          px: 1.5,
                          minWidth: 'auto',
                          bgcolor: '#ffffff',
                          border: '1.5px solid #e0e0e0',
                          borderBottom: '3px solid #e0e0e0',
                          color: '#666666',
                          fontWeight: 600,
                          borderRadius: '8px',
                          textTransform: 'none',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                            color: '#666666',
                            borderColor: '#d0d0d0',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                          },
                        }}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <>
                    {(() => {
                      const compositeKey = getPhotoFeedbackLocalKey(photoItem, feedback);
                      const isLastEdited = lastEdited && lastEdited.photoId === photoItem.id && lastEdited.feedbackId === feedback.id;
                      const chosenText = isLastEdited
                        ? lastEdited.content
                        : (localFeedbackUpdates[feedback.id]
                          ?? localFeedbackUpdates[compositeKey]
                          ?? (feedback.displayContent || feedback.content));
                      return (
                        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
                          {chosenText}
                        </Typography>
                      );
                    })()}
                  </>
                )}

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
                {isV3 && userRole === 'admin' && (feedback.admin?.admin?.role?.name === 'client' || feedback.admin?.admin?.role?.name === 'Client') && (feedback.type === 'REASON' || feedback.type === 'COMMENT') && (submission?.status === 'SENT_TO_ADMIN' || submission?.status === 'CLIENT_FEEDBACK') && (
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
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
                        console.log('🔍 DEBUG: Send to Creator button clicked for photo:', {
                          photoId: photoItem.id,
                          feedbackId: feedback.id,
                          photoStatus: photoItem.status,
                          feedbackType: feedback.type
                        });
                        if (handleAdminSendToCreator) {
                          await handleAdminSendToCreator(photoItem.id, feedback.id, setLocalStatus);
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
                          borderColor: '#169c52',
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

PhotoCard.propTypes = {
  photoItem: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    url: PropTypes.string.isRequired,
    status: PropTypes.string,
    createdAt: PropTypes.string,
    individualFeedback: PropTypes.array,
  }).isRequired,
  index: PropTypes.number.isRequired,
  submission: PropTypes.object,
  onImageClick: PropTypes.func.isRequired,
  handleApprove: PropTypes.func.isRequired,
  handleRequestChange: PropTypes.func.isRequired,
  selectedPhotosForChange: PropTypes.array.isRequired,
  handlePhotoSelection: PropTypes.func.isRequired,
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
  // V3 admin feedback handlers
  handleAdminEditFeedback: PropTypes.func,
  handleAdminSendToCreator: PropTypes.func,
  // State management for tracking sent items
  setParentSentToCreatorItems: PropTypes.func,
};

// Add SWR hook for submission
const fetchSubmission = async (url) => {
  const { data } = await axiosInstance.get(url);
  return data;
};

const Photos = ({ 
  campaign, 
  submission, 
  deliverables, 
  onImageClick, 
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
  // Shared function to check all client feedback across all media types
  checkAllClientFeedbackProcessed,
}) => {
  const { user } = useAuthContext();
  const userRole = user?.role || 'admin';

  // SWR for real-time data updates
  const { data: currentSubmission, mutate: mutateSubmission } = useSWR(
    submission?.id ? `/api/submission/v3/${submission.id}` : null,
    (url) => axiosInstance.get(url).then(res => res.data),
    { refreshInterval: 0 }
  );

  const [selectedPhotosForChange, setSelectedPhotosForChange] = useState([]);
  const [clientRequestModalOpen, setClientRequestModalOpen] = useState(false);
  const [clientRequestPhotoId, setClientRequestPhotoId] = useState(null);

  // Track which media items have been sent to creator
  const [sentToCreatorItems, setSentToCreatorItems] = useState(new Set());

  // Check if all client feedback has been sent to creator
  const allFeedbackSentToCreator = useMemo(() => {
    if (!deliverables?.photos) return true;
    
    const itemsWithClientFeedback = new Set();
    
    // Check photos
    deliverables.photos?.forEach(photo => {
      if (photo.status === 'CLIENT_FEEDBACK' || photo.status === 'SENT_TO_ADMIN') {
        itemsWithClientFeedback.add(`photo_${photo.id}`);
      }
    });
    
    // If no items have client feedback, consider it all sent
    if (itemsWithClientFeedback.size === 0) return true;
    
    // Check if all items with client feedback have been sent to creator
    return Array.from(itemsWithClientFeedback).every(itemKey => sentToCreatorItems.has(itemKey));
  }, [deliverables, sentToCreatorItems]);

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

  const approve = useBoolean();
  const request = useBoolean();

  const handlePhotoSelection = (id) => {
    setSelectedPhotosForChange((prev) => {
      if (prev.includes(id)) {
        return prev.filter((photoId) => photoId !== id);
      }
      return [...prev, id];
    });
  };

  const handleApprove = async (photoId, formValues) => {
    try {
      const payload = {
        submissionId: submission.id,
        mediaId: photoId,
        action: 'approve',
        feedback: formValues.feedback || '',
      };

      const response = await axiosInstance.patch('/api/submission/v3/media/approve', { mediaId: photoId, mediaType: 'photo', feedback: formValues.feedback || 'Approved by admin' });

      if (response.status === 200) {
        enqueueSnackbar('Photo approved successfully!', { variant: 'success' });
        // Refresh data - ensure proper SWR revalidation
        if (deliverables?.deliverableMutate) {
          await deliverables.deliverableMutate();
        }
        if (deliverables?.submissionMutate) {
          await deliverables.submissionMutate();
        }
        // Also refresh any SWR submission data if available
        if (deliverables?.submissionMutate) {
          await deliverables.submissionMutate();
        }
      }
    } catch (error) {
      console.error('Error approving photo:', error);
      enqueueSnackbar('Failed to approve photo', { variant: 'error' });
    }
  };

  const handleRequestChange = async (photoId, formValues) => {
    try {
      const payload = {
        submissionId: submission.id,
        mediaId: photoId,
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

  const handleClientApprove = async (mediaId, clientFeedback) => {
    try {
      console.log(`🔍 handleClientApprove called with mediaId: ${mediaId}, clientFeedback: "${clientFeedback}", type: ${typeof clientFeedback}`);
      
      // If clientFeedback is provided (including empty string), it means the client already made the API call
      // So we don't need to make another API call, just refresh the data
      if (clientFeedback !== undefined) {
        console.log(`🔍 Client already approved with feedback: "${clientFeedback}", just refreshing data - NO SECOND API CALL`);
        // Revalidate with server data
        await mutateSubmission();
        if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
        if (deliverables?.submissionMutate) await deliverables.submissionMutate();
        return;
      }

      // This is admin simulation (no client feedback provided)
      console.log(`🔍 Admin simulating client approval with hardcoded feedback: "Approved by client"`);
      
      // Optimistic update - immediately update the UI
      const optimisticData = deliverables?.photos?.map(photo => 
        photo.id === mediaId ? { ...photo, status: 'APPROVED' } : photo
      );
      
      if (deliverables?.deliverableMutate) {
        deliverables.deliverableMutate(
          { ...deliverables, photos: optimisticData },
          false // Don't revalidate immediately
        );
      }

      await axiosInstance.patch('/api/submission/v3/media/approve', {
        mediaId,
        mediaType: 'photo',
        feedback: 'Approved by client',
      });
      
      enqueueSnackbar('Client approved successfully!', { variant: 'success' });
      
      // Revalidate with server data
      await mutateSubmission();
      if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
      if (deliverables?.submissionMutate) await deliverables.submissionMutate();
    } catch (error) {
      console.error('Error approving photo:', error);
      enqueueSnackbar('Failed to client approve', { variant: 'error' });
      // Revert optimistic update on error
      if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
    }
  };


  const handleClientReject = async (mediaId, feedback = 'Changes requested by client', reasons = ['Client rejection']) => {
    try {
      await axiosInstance.patch('/api/submission/v3/media/request-changes/client', {
        mediaId,
        mediaType: 'photo',
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
      await axiosInstance.patch('/api/submission/v3/feedback/' + feedbackId, { content: adminFeedback });
      enqueueSnackbar('Feedback updated successfully!', { variant: 'success' });
      // Non-blocking SWR revalidation
      try { if (deliverables?.deliverableMutate) deliverables.deliverableMutate(); } catch {}
      try { if (deliverables?.submissionMutate) deliverables.submissionMutate(); } catch {}
      try { if (mutateSubmission) mutateSubmission(); } catch {}
      try {
        mutate(
          (key) => typeof key === 'string' && (
            key.includes('feedback') || 
            key.includes('submission') || 
            key.includes('deliverables')
          ),
          undefined,
          { revalidate: true }
        );
      } catch {}
      return true;
    } catch (error) {
      console.error('Error updating feedback:', error);
      enqueueSnackbar('Failed to update feedback', { variant: 'error' });
      return false;
    }
  };

  const handleAdminSendToCreator = async (mediaId, feedbackId, onStatusUpdate) => {
    console.log('🔍 DEBUG: handleAdminSendToCreator called with:', {
      mediaId,
      feedbackId,
      onStatusUpdate: !!onStatusUpdate
    });

    try {
      // Track this item as sent to creator
      const itemKey = `photo_${mediaId}`;
      setSentToCreatorItems(prev => new Set([...prev, itemKey]));

      const requestData = {
        submissionId: submission.id,
        adminFeedback: 'Feedback reviewed and forwarded to creator',
        mediaId,
        mediaType: 'photo',
        feedbackId, // Added feedbackId
      };

      console.log('📤 Sending request:', requestData);

      const response = await axiosInstance.patch('/api/submission/v3/draft/forward-feedback', requestData);

      if (response.status === 200) {
        console.log('✅ Successfully sent to creator');
        enqueueSnackbar('Feedback sent to creator successfully!', { variant: 'success' });
        
        // Check if all feedback has been sent (including the current item)
        const itemsWithClientFeedback = new Set();
        deliverables.photos?.forEach(photo => {
          if (photo.status === 'CLIENT_FEEDBACK' || photo.status === 'SENT_TO_ADMIN') {
            itemsWithClientFeedback.add(`photo_${photo.id}`);
          }
        });
        
        const allItemsSent = itemsWithClientFeedback.size === 0 || 
          Array.from(itemsWithClientFeedback).every(itemKey => 
            sentToCreatorItems.has(itemKey) || itemKey === `photo_${mediaId}`
          );
        
        // Use the shared function to check if all CLIENT_FEEDBACK items across all media types have been processed
        const allClientFeedbackProcessed = checkAllClientFeedbackProcessed();
        
        // Only update submission status to CHANGES_REQUIRED if all feedback has been sent AND all CLIENT_FEEDBACK items processed
        if (allItemsSent && allClientFeedbackProcessed) {
          console.log('✅ All feedback sent to creator and all CLIENT_FEEDBACK items processed - updating submission status to CHANGES_REQUIRED');
          if (onStatusUpdate) {
            onStatusUpdate('CHANGES_REQUIRED');
          }
        } else {
          console.log('⏳ Not all feedback sent or CLIENT_FEEDBACK items still exist - keeping current submission status');
        }

        // Refresh data
        if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
        if (deliverables?.submissionMutate) await deliverables.submissionMutate();
        
        // Additional SWR invalidation to ensure all related data is refreshed
        try {
          await mutate(
            (key) => typeof key === 'string' && (
              key.includes('feedback') || 
              key.includes('submission') || 
              key.includes('deliverables')
            ),
            undefined,
            { revalidate: true }
          );
        } catch (mutateError) {
          console.log('SWR mutate error (non-critical):', mutateError);
        }
        
        return true;
      }
    } catch (error) {
      console.error('❌ Error sending to creator:', error);
      enqueueSnackbar('Failed to send to creator', { variant: 'error' });
      return false;
    }
  };

  // Check if all photos are already approved
  const allPhotosApproved = deliverables?.photos?.length > 0 && 
    deliverables.photos.every(p => p.status === 'APPROVED');

  // Determine layout type
  const hasPhotos = deliverables?.photos?.length > 0;
  const shouldUseHorizontalScroll = hasPhotos && deliverables.photos.length > 1;
  const shouldUseGrid = hasPhotos && deliverables.photos.length === 1;

  const isV3 = campaign?.origin === 'CLIENT';
  // Remove duplicate declarations - these are already declared in the main Photos component
  // const { user } = useAuthContext();
  // const userRole = user?.role || 'admin'; // Use actual user role from auth context

  return (
    <>
      {/* Photos Horizontal Scroll */}
      {!hasPhotos && (
        <Typography>No photos uploaded yet.</Typography>
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
          {deliverables.photos.map((photo, index) => (
            <Box
              key={photo.id}
              sx={{
                width: { xs: '280px', sm: '300px', md: '300px' },
                minWidth: { xs: '280px', sm: '300px', md: '300px' },
                flexShrink: 0,
              }}
            >
              <PhotoCard 
                photoItem={photo} 
                index={index}
                submission={currentSubmission}
                onImageClick={onImageClick}
                handleApprove={handleApprove}
                handleRequestChange={handleRequestChange}
                selectedPhotosForChange={selectedPhotosForChange}
                handlePhotoSelection={handlePhotoSelection}
                // V2 individual handlers
                onIndividualApprove={onIndividualApprove}
                onIndividualRequestChange={onIndividualRequestChange}
                isV3={isV3}
                userRole={userRole}
                handleSendToClient={handleSendToClient}
                // V3 client handlers
                handleClientApprove={handleClientApprovePhoto}
                handleClientReject={handleClientRejectPhoto}
                // V3 deliverables for status checking
                deliverables={deliverables}
                // V3 admin feedback handlers
                handleAdminEditFeedback={handleAdminEditFeedback}
                handleAdminSendToCreator={handleAdminSendToCreator}
                // State management for tracking sent items
                setParentSentToCreatorItems={setSentToCreatorItems}
              />
            </Box>
          ))}
        </Box>
      )}

      {shouldUseGrid && (
        <Grid container spacing={2}>
          {deliverables.photos.map((photo, index) => (
            <Grid 
              item 
              xs={12} 
              md={7} 
              key={photo.id}
            >
              <PhotoCard 
                photoItem={photo} 
                index={index}
                submission={currentSubmission}
                onImageClick={onImageClick}
                handleApprove={handleApprove}
                handleRequestChange={handleRequestChange}
                selectedPhotosForChange={selectedPhotosForChange}
                handlePhotoSelection={handlePhotoSelection}
                // V2 individual handlers
                onIndividualApprove={onIndividualApprove}
                onIndividualRequestChange={onIndividualRequestChange}
                isV3={isV3}
                userRole={userRole}
                handleSendToClient={handleSendToClient}
                // V3 client handlers
                handleClientApprove={handleClientApprovePhoto}
                handleClientReject={handleClientRejectPhoto}
                // V3 deliverables for status checking
                deliverables={deliverables}
                // V3 admin feedback handlers
                handleAdminEditFeedback={handleAdminEditFeedback}
                handleAdminSendToCreator={handleAdminSendToCreator}
                // State management for tracking sent items
                setParentSentToCreatorItems={setSentToCreatorItems}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Photos Google Drive link */}
      {submission?.photosDriveLink && (
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
              Additional Photos
            </Typography>
          </Box>

          <Box sx={{ p: 2.5 }}>
            <Link
              href={submission.photosDriveLink}
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
              {submission.photosDriveLink}
            </Link>
          </Box>
        </Box>
      )}

      {/* All Photos Approved Message */}
      {allPhotosApproved && (
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
            All photos have been approved
          </Typography>
        </Box>
      )}

      {/* Confirmation Modals */}
      <ConfirmationApproveModal
        open={approve.value}
        onClose={approve.onFalse}
        sectionType="photos"
        onConfirm={() => {}}
        isSubmitting={false}
        isDisabled={isDisabled}
        watchData={{}}
      />

      <ConfirmationRequestModal
        open={request.value}
        onClose={request.onFalse}
        sectionType="photos"
        onConfirm={() => {}}
        watchData={{}}
        isDisabled={false}
        selectedItemsCount={1}
      />
    </>
  );
};

Photos.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  deliverables: PropTypes.object,
  onImageClick: PropTypes.func.isRequired,
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
  // Shared function to check all client feedback across all media types
  checkAllClientFeedbackProcessed: PropTypes.func,
};

export default Photos; 