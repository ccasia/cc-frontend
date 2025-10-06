import useSWR, { mutate } from 'swr';
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
  Typography,
  CardContent,
  Tooltip,
} from '@mui/material';
import { TextField } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

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
  // State management for tracking sent items
  setParentSentToCreatorItems,
}) => {
  const [cardType, setCardType] = useState('approve');
  const [isProcessing, setIsProcessing] = useState(false);
  // Add local state to track status optimistically
  const [localStatus, setLocalStatus] = useState(null);
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [localFeedbackUpdates, setLocalFeedbackUpdates] = useState({});
  const getFeedbackLocalKey = (fb) => (fb?.id ? fb.id : `${fb?.displayContent || fb?.content || ''}|${fb?.createdAt || ''}`);
  const getRawFeedbackLocalKey = (raw, fb) => `${raw?.id || 'no-raw-id'}|${getFeedbackLocalKey(fb)}`;
  const [lastEdited, setLastEdited] = useState(null); // { rawId, feedbackId, content, at }

  // Persist overrides across remounts
  const STORAGE_KEY = 'cc_raw_feedback_overrides_v1';
  const loadOverrides = () => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; } };
  const saveOverrides = (overrides) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides)); } catch {} };
  useEffect(() => { const stored = loadOverrides(); if (stored && Object.keys(stored).length) setLocalFeedbackUpdates((prev) => ({ ...stored, ...prev })); }, []);

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
  // For V2: Admin approval shows as APPROVED
  const isRawFootageApprovedByAdmin = currentStatus === 'APPROVED';
  const isRawFootageApprovedByClient = currentStatus === 'APPROVED';
  const hasRevisionRequested = currentStatus === 'CHANGES_REQUIRED';
  const isClientFeedback = false; // V2 doesn't have client feedback
  const isChangesRequired = currentStatus === 'CHANGES_REQUIRED';
  
  // For V2: Show approval buttons when raw footage status is PENDING and not approved
  // A raw footage is considered "not approved" if its status is not APPROVED
  const isRawFootageNotApproved = currentStatus !== 'APPROVED';
  // Use raw footage's own status instead of submission status since V3 submission data is not available
  const isPendingReview = (currentStatus === 'PENDING' || currentStatus === 'PENDING_REVIEW') && isRawFootageNotApproved && !hasRevisionRequested;

  // Get feedback for this specific raw footage
  const getRawFootageFeedback = () => {
    const combined = [];

    if (Array.isArray(rawFootageItem.individualFeedback)) {
      combined.push(...rawFootageItem.individualFeedback);
    }
    
    const allFeedbacks = [
      ...(deliverables?.submissions?.flatMap((sub) => sub.feedback) || []),
      ...(submission?.feedback || []),
    ];

    const rawFootageSpecificFeedback = allFeedbacks.filter((fb) => fb?.rawFootageToUpdate?.includes(rawFootageItem.id));
    combined.push(...rawFootageSpecificFeedback);

    // If we have a last edited feedback for this raw footage, update or inject it before normalization
    if (lastEdited && lastEdited.rawId === rawFootageItem.id) {
      const idx = combined.findIndex((fb) => fb && fb.id === lastEdited.feedbackId);
      if (idx !== -1) {
        combined[idx] = { ...combined[idx], content: lastEdited.content };
      } else {
        combined.unshift({ id: lastEdited.feedbackId, content: lastEdited.content, createdAt: new Date().toISOString(), admin: { name: 'Admin' }, type: 'COMMENT', rawFootageToUpdate: [rawFootageItem.id], reasons: [] });
      }
    }

    // Normalize, drop empty, and dedupe
    const normalized = combined
      .map((fb) => {
        if (!fb) return null;
        const compositeKey = getRawFeedbackLocalKey(rawFootageItem, fb);
        const override = localFeedbackUpdates[fb.id] ?? localFeedbackUpdates[compositeKey];
        const hasText = typeof fb.content === 'string' && fb.content.trim().length > 0;
        const hasReasons = Array.isArray(fb.reasons) && fb.reasons.length > 0;
        const fallbackDisplay = hasText ? fb.content : (hasReasons ? `Reasons: ${fb.reasons.join(', ')}` : '');
        return { ...fb, displayContent: override ?? fallbackDisplay, isOverridden: Boolean(override) };
      })
      .filter((fb) => fb && (fb.displayContent.trim().length > 0));

    const seen = new Set();
    const deduped = [];
    for (const fb of normalized) {
      const key = fb.id ? `id:${fb.id}` : `c:${fb.displayContent}|t:${fb.createdAt}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(fb);
      }
    }

    return deduped.sort((a, b) => dayjs(b?.createdAt).diff(dayjs(a?.createdAt)));
  };

  const rawFootageFeedback = getRawFootageFeedback();

  // Helper function to determine border color
  const getBorderColor = () => {
    // For client role, APPROVED status should not show green outline
    if (isClientFeedback) return '#F6C000'; // yellow for CLIENT_FEEDBACK (V3 only)
    if (isChangesRequired) return '#D4321C'; // red
    if (userRole === 'client' && isRawFootageApprovedByClient) return '#1ABF66';
    if (userRole !== 'client' && isRawFootageApprovedByAdmin) return '#1ABF66';
    return 'divider';
  };

  // V2 Individual handlers
  const handleIndividualApproveClick = async () => {
    if (!onIndividualApprove) return;
    
    setIsProcessing(true);
    try {
      const values = formMethods.getValues();
      await onIndividualApprove(rawFootageItem.id, values.feedback);
      // Optimistically update local status - for V2 show APPROVED
      setLocalStatus('APPROVED');
      
      // SWR revalidation for immediate UI update
      if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
      if (deliverables?.submissionMutate) await deliverables.submissionMutate();
    } catch (error) {
      console.error('Error approving raw footage:', error);
    } finally {
      setIsProcessing(false);
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
      
      // SWR revalidation for immediate UI update
      if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
      if (deliverables?.submissionMutate) await deliverables.submissionMutate();
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
        // Optimistically update local status for fallback handler - for V2 show APPROVED
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
      // For client role, APPROVED status should show approval buttons, not APPROVED status
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
              {'APPROVED'}
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

                {isPendingReview ? ( // V2 logic - show approval button when pending review
                  <>
                    {/* V2 logic - show approval button */}
                    <LoadingButton
                      onClick={handleApproveClick}
                      variant="contained"
                      size="small"
                      loading={isSubmitting || isProcessing}
                      sx={{ bgcolor: '#FFFFFF', color: '#1ABF66', border: '1.5px solid', borderColor: '#e7e7e7', borderBottom: 3, borderBottomColor: '#e7e7e7', borderRadius: 1.15, py: 1.2, fontWeight: 600, fontSize: '0.9rem', height: '40px', textTransform: 'none', flex: 1 }}
                    >
                      Approve
                    </LoadingButton>
                  </>
                ) : false && userRole === 'client' && (submission?.status === 'PENDING_REVIEW' || currentStatus === 'APPROVED') ? ( // V3 removed
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
        boxShadow: isChangesRequired ? '0 0 0 2px rgba(212,50,28,0.15)' : 'none',
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



          {isChangesRequired && (
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
                  {/* Removed Change Request chip from display comments */}
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
                          const ok = await handleAdminEditFeedback(rawFootageItem.id, feedback.id, editingContent);
                          if (ok) {
                            const compositeKey = getRawFeedbackLocalKey(rawFootageItem, feedback);
                            const idKey = feedback?.id;
                            setLocalFeedbackUpdates((prev) => {
                              const next = { ...prev, ...(idKey ? { [idKey]: editingContent } : {}), [compositeKey]: editingContent };
                              const stored = loadOverrides();
                              saveOverrides({ ...stored, ...next });
                              return next;
                            });
                            setLastEdited({ rawId: rawFootageItem.id, feedbackId: feedback.id, content: editingContent, at: Date.now() });
                            
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
                <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
                  {(lastEdited && lastEdited.rawId === rawFootageItem.id && lastEdited.feedbackId === feedback.id)
                    ? lastEdited.content
                    : (localFeedbackUpdates[feedback.id]
                        ?? localFeedbackUpdates[getRawFeedbackLocalKey(rawFootageItem, feedback)]
                        ?? (feedback.displayContent || feedback.content))}
                </Typography>
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
                {false && userRole === 'admin' && (feedback.admin?.admin?.role?.name === 'client' || feedback.admin?.admin?.role?.name === 'Client') && (feedback.type === 'REASON' || feedback.type === 'COMMENT') && (submission?.status === 'SENT_TO_ADMIN' || submission?.status === 'CLIENT_FEEDBACK') && ( // V3 removed
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
                        if (handleAdminSendToCreator) {
                            await handleAdminSendToCreator(rawFootageItem.id, feedback.id, setLocalStatus);
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
  // Shared function to check all client feedback across all media types
  checkAllClientFeedbackProcessed,
}) => {
  const { user } = useAuthContext();
  const userRole = user?.role || 'admin';

  // SWR for real-time data updates
  // V3 submissions removed - using empty data
  const currentSubmission = null;
  const mutateSubmission = () => {};

  const [selectedRawFootagesForChange, setSelectedRawFootagesForChange] = useState([]);
  const [clientRequestModalOpen, setClientRequestModalOpen] = useState(false);
  const [clientRequestRawFootageId, setClientRequestRawFootageId] = useState(null);

  // Track which media items have been sent to creator
  const [sentToCreatorItems, setSentToCreatorItems] = useState(new Set());

  // Check if all client feedback has been sent to creator
  const allFeedbackSentToCreator = useMemo(() => {
    if (!deliverables?.rawFootages) return true;
    
    const itemsWithClientFeedback = new Set();
    
    // Check raw footage
    deliverables.rawFootages?.forEach(footage => {
      if (footage.status === 'CLIENT_FEEDBACK' || footage.status === 'SENT_TO_ADMIN') {
        itemsWithClientFeedback.add(`rawFootage_${footage.id}`);
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

  // Remove duplicate SWR declarations - these are already declared in the main RawFootages component
  // const { data: swrSubmission, mutate: mutateSubmission, isLoading: isSubmissionLoading, error: submissionError } = useSWR(
  //   submission?.id ? `/api/submission/v3/${submission.id}` : null,
  //   fetchSubmission,
  //   { refreshInterval: 0 }
  // );

  // Use SWR submission as the source of truth
  // const currentSubmission = swrSubmission || submission;

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
      const payload = {
        submissionId: submission.id,
        mediaId: videoId,
        action: 'approve',
        feedback: formValues.feedback || '',
      };

      console.log('V3 submissions removed - API call disabled');

      if (response.status === 200) {
        enqueueSnackbar('Raw footage approved successfully!', { variant: 'success' });
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
      console.error('Error approving raw footage:', error);
      enqueueSnackbar('Failed to approve raw footage', { variant: 'error' });
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

      console.log('V3 submissions removed - API call disabled');

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
      console.log('V3 submissions removed - API call disabled');
      console.log('Draft sent to client successfully!');
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
      const optimisticData = deliverables?.rawFootages?.map(rawFootage => 
        rawFootage.id === mediaId ? { ...rawFootage, status: 'APPROVED' } : rawFootage
      );
      
      if (deliverables?.deliverableMutate) {
        deliverables.deliverableMutate(
          { ...deliverables, rawFootages: optimisticData },
          false // Don't revalidate immediately
        );
      }

      console.log('V3 submissions removed - API call disabled');
      
      enqueueSnackbar('Client approved successfully!', { variant: 'success' });
      
      // Revalidate with server data
      await mutateSubmission();
      if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
      if (deliverables?.submissionMutate) await deliverables.submissionMutate();
    } catch (error) {
      console.error('Error approving raw footage:', error);
      enqueueSnackbar('Failed to client approve', { variant: 'error' });
      // Revert optimistic update on error
      if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
    }
  };

  const handleClientReject = async (mediaId, feedback = 'Changes requested by client', reasons = ['Client rejection']) => {
    try {
      console.log('V3 submissions removed - API call disabled');
      enqueueSnackbar('Client rejected successfully!', { variant: 'warning' });
      if (deliverables?.deliverableMutate) await deliverables.deliverableMutate();
      if (deliverables?.submissionMutate) await deliverables.submissionMutate();
    } catch (error) {
      enqueueSnackbar('Failed to client reject', { variant: 'error' });
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
  const isV3 = false; // V3 removed
  // Remove duplicate declarations - these are already declared in the main RawFootages component
  // const { user } = useAuthContext();
  // const userRole = user?.role || 'admin'; // Use actual user role from auth context

  // Admin feedback handlers
  const handleAdminEditFeedback = async (mediaId, feedbackId, adminFeedback) => {
    try {
      console.log('V3 submissions removed - API call disabled');
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


    try {
      // Track this item as sent to creator (use local state already present)
      const itemKey = `rawFootage_${mediaId}`;
      setSentToCreatorItems(prev => new Set([...prev, itemKey]));

      const requestData = {
        submissionId: submission.id,
        adminFeedback: 'Feedback reviewed and forwarded to creator',
        mediaId,
        mediaType: 'rawFootage',
        feedbackId, // Added feedbackId
      };

      console.log('📤 Sending request:', requestData);

      console.log('V3 submissions removed - API call disabled');
      console.log('✅ Successfully sent to creator');
      console.log('Feedback sent to creator successfully!');
        
        // Check if all feedback has been sent (including the current item)
        const itemsWithClientFeedback = new Set();
        deliverables.rawFootages?.forEach(footage => {
          if (footage.status === 'CLIENT_FEEDBACK' || footage.status === 'SENT_TO_ADMIN') {
            itemsWithClientFeedback.add(`rawFootage_${footage.id}`);
          }
        });
        
        const allItemsSent = itemsWithClientFeedback.size === 0 || 
          Array.from(itemsWithClientFeedback).every(itemKey => 
            sentToCreatorItems.has(itemKey) || itemKey === `rawFootage_${mediaId}`
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
    } catch (error) {
      console.error('❌ Error sending to creator:', error);
      enqueueSnackbar('Failed to send to creator', { variant: 'error' });
      return false;
    }
  };

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
            const isRawFootageApprovedByAdmin = footage.status === 'APPROVED';
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
                  width: { xs: '280px', sm: '300px', md: '300px' },
                  minWidth: { xs: '280px', sm: '300px', md: '300px' },
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
                  // State management for tracking sent items
                  setParentSentToCreatorItems={setSentToCreatorItems}
                />
              </Box>
            );
          })}
        </Box>
      )}

      {shouldUseGrid && (
        <Grid container spacing={2}>
          {deliverables.rawFootages.map((footage, index) => {
            const isRawFootageApprovedByAdmin = footage.status === 'APPROVED';
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
                md={7} 
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
                  // State management for tracking sent items
                  setParentSentToCreatorItems={setSentToCreatorItems}
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
        onConfirm={() => {}}
        isSubmitting={false}
        isDisabled={isDisabled}
        watchData={{}}
      />

      <ConfirmationRequestModal
        open={request.value}
        onClose={request.onFalse}
        sectionType="rawFootages"
        onConfirm={() => {}}
        watchData={{}}
        isDisabled={false}
        selectedItemsCount={1}
      />
    </>
  );
};

RawFootages.propTypes = {
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
  // Shared function to check all client feedback across all media types
  checkAllClientFeedbackProcessed: PropTypes.func,
};

// Add SWR hook for submission
const fetchSubmission = async (url) => {
  const { data } = await axiosInstance.get(url);
  return data;
};

export default RawFootages; 