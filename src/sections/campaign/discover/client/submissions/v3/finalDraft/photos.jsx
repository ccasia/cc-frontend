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

const PhotoCard = ({ 
  photoItem, 
  index, 
  submission, 
  onImageClick, 
  handleApprove, 
  handleRequestChange,
  selectedPhotosForChange,
  handlePhotoSelection,
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

  // Reset local status when photoItem status changes (server update)
  useEffect(() => {
    setLocalStatus(null);
  }, [photoItem.status]);

  // Use local status if available, otherwise use prop status
  const currentStatus = localStatus || photoItem.status;
  const isPhotoApprovedByAdmin = currentStatus === 'SENT_TO_CLIENT';
  const isPhotoApprovedByClient = currentStatus === 'APPROVED';
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
    (submissionClientPending && !isPhotoApprovedByClient && !hasRevisionRequested) :
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

    // Normalize, drop empty, and dedupe
    const normalized = combined
      .map((fb) => {
        if (!fb) return null;
        const hasText = typeof fb.content === 'string' && fb.content.trim().length > 0;
        const hasReasons = Array.isArray(fb.reasons) && fb.reasons.length > 0;
        // Build a displayContent so UI never shows an empty card
        const displayContent = hasText
          ? fb.content
          : hasReasons
          ? `Reasons: ${fb.reasons.join(', ')}`
          : '';
        return {
          ...fb,
          displayContent,
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

  const feedback = getPhotoFeedback();

  console.log('🔍 PhotoCard feedback variable:', {
    feedback,
    feedbackLength: feedback?.length,
    photoItemId: photoItem.id,
    willRenderFeedback: feedback && feedback.length > 0
  });

  // Helper function to get the correct feedback content
  const getFeedbackContent = (feedbackItem) => {
    // Use displayContent if available (from normalized feedback)
    if (feedbackItem.displayContent && feedbackItem.displayContent !== null) {
      return feedbackItem.displayContent;
    }
    
    // Try different possible field names for content
    if (feedbackItem.photoContent && feedbackItem.photoContent !== null) {
      return feedbackItem.photoContent;
    }
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
      console.log('🔍 PhotoCard handleApproveClick:', { 
        isClient, 
        userRole, 
        data, 
        photoId: photoItem.id,
        handleApprove: !!handleApprove 
      });
      
      if (isClient) {
        // Call client-specific backend endpoint
        console.log('🔍 Client approving photo via backend endpoint');
        const response = await axiosInstance.patch('/api/submission/v3/media/approve/client', {
          mediaId: photoItem.id,
          mediaType: 'photo',
          feedback: data.feedback || 'Approved by client'
        });
        
        if (response.status === 200) {
          enqueueSnackbar('Photo approved successfully!', { variant: 'success' });
          
          // SWR revalidation for immediate UI update
          if (deliverableMutate) await deliverableMutate();
          if (submissionMutate) await submissionMutate();
        }
      } else {
        console.log('🔍 Admin approving photo via handleApprove function');
        await handleApprove(photoItem.id, data.feedback);
      }
      setLocalStatus('APPROVED');
    } catch (error) {
      console.error('❌ Error approving photo:', error);
      enqueueSnackbar('Failed to approve photo', { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestChangeClick = async (data) => {
    setIsProcessing(true);
    try {
      console.log('🔍 PhotoCard handleRequestChangeClick:', { 
        isClient, 
        userRole, 
        data, 
        photoId: photoItem.id,
        handleRequestChange: !!handleRequestChange 
      });
      
      if (isClient) {
        // Call client-specific backend endpoint
        console.log('🔍 Client requesting photo changes via backend endpoint');
        const response = await axiosInstance.patch('/api/submission/v3/media/request-changes/client', {
          mediaId: photoItem.id,
          mediaType: 'photo',
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
        console.log('🔍 Admin requesting photo changes via handleRequestChange function');
        await handleRequestChange(photoItem.id, data.feedback, data.reasons);
      }
      setLocalStatus('REVISION_REQUESTED');
    } catch (error) {
      console.error('❌ Error requesting photo changes:', error);
      enqueueSnackbar('Failed to request changes', { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = () => {
    if (isPhotoApprovedByClient) return 'success';
    if (hasRevisionRequested) return 'error';
    if (isPhotoApprovedByAdmin) return 'warning';
    return 'default';
  };

  const getStatusText = () => {
    if (isPhotoApprovedByClient) return 'Approved';
    if (hasRevisionRequested) return 'Changes Requested';
    if (isPhotoApprovedByAdmin) return 'Sent to Client';
    return 'Pending Review';
  };

  const getBorderColor = () => {
    if (isPhotoApprovedByClient) return '#1ABF66';
    if (hasRevisionRequested) return '#D4321C';
    if (isPhotoApprovedByAdmin) return '#FFC702';
    return '#e0e0e0';
  };

  const renderFormContent = () => {
    if (!isPendingReview) {
      if (isPhotoApprovedByClient) {
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

          {isPhotoApprovedByClient && (
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
      {feedback.length > 0 && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Stack spacing={1.5}>
            {feedback.map((fb, feedbackIndex) => {
              // Debug: Log all available fields for the first feedback item
              if (feedbackIndex === 0) {
                console.log('🔍 First feedback item - All available fields:', {
                  feedbackId: fb.id,
                  type: fb.type,
                  allKeys: Object.keys(fb),
                  content: fb.content,
                  message: fb.message,
                  text: fb.text,
                  feedback: fb.feedback,
                  comment: fb.comment,
                  note: fb.note,
                  description: fb.description,
                  fullObject: fb
                });
                
                // Log all field values to see what's actually there
                console.log('🔍 First feedback item - All field values:', Object.fromEntries(
                  Object.entries(fb).map(([key, value]) => [key, value])
                ));
                
                // Check for nested fields in admin object
                if (fb.admin) {
                  console.log('🔍 Admin object fields:', {
                    adminKeys: Object.keys(fb.admin),
                    adminValues: Object.fromEntries(
                      Object.entries(fb.admin).map(([key, value]) => [key, value])
                    )
                  });
                }
                
                // Check if there are any other objects that might contain content
                Object.entries(fb).forEach(([key, value]) => {
                  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    console.log(`🔍 Object field "${key}":`, {
                      keys: Object.keys(value),
                      values: Object.fromEntries(
                        Object.entries(value).map(([k, v]) => [k, v])
                      )
                    });
                  }
                });
              }
              
              console.log('🔍 Rendering feedback item:', { 
                fb, 
                feedbackIndex,
                feedbackId: fb.id,
                feedbackContent: fb.content,
                feedbackType: fb.type,
                feedbackCreatedAt: fb.createdAt,
                feedbackAdmin: fb.admin,
                feedbackPhotosToUpdate: fb.photosToUpdate,
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
                        onClick={() => handleAdminSendToCreator(photoItem.id, 'photo', fb.id)}
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

PhotoCard.propTypes = {
  photoItem: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  submission: PropTypes.object.isRequired,
  onImageClick: PropTypes.func.isRequired,
  handleApprove: PropTypes.func.isRequired,
  handleRequestChange: PropTypes.func.isRequired,
  selectedPhotosForChange: PropTypes.array,
  handlePhotoSelection: PropTypes.func,
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

export default PhotoCard; 