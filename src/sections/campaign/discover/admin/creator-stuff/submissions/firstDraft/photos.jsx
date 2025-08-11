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
  Tooltip,
  Typography,
  CardContent,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

import { ConfirmationApproveModal, ConfirmationRequestModal } from './confirmation-modals';
import axiosInstance from 'src/utils/axios';
import useSWR from 'swr';

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
}) => {
  const [cardType, setCardType] = useState('approve');
  const [isProcessing, setIsProcessing] = useState(false);
  const [localStatus, setLocalStatus] = useState(null);

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
  const isPhotoApprovedByAdmin = currentStatus === 'SENT_TO_CLIENT';
  const isPhotoApprovedByClient = currentStatus === 'APPROVED';
  const hasRevisionRequested = currentStatus === 'REVISION_REQUESTED' || currentStatus === 'CHANGES_REQUIRED' || currentStatus === 'CLIENT_FEEDBACK';
  
  // For client role, SENT_TO_CLIENT status should be treated as PENDING_REVIEW
  const isPendingReview = userRole === 'client' ? 
    // For clients: show approval buttons when media is SENT_TO_CLIENT or submission is PENDING_REVIEW
    (currentStatus === 'SENT_TO_CLIENT' || (submission?.status === 'PENDING_REVIEW' && !isPhotoApprovedByClient && !hasRevisionRequested)) :
    // For non-clients: show approval buttons when submission is PENDING_REVIEW and media not approved
    (submission?.status === 'PENDING_REVIEW' && !isPhotoApprovedByAdmin && !hasRevisionRequested);

  // Get feedback for this specific photo
  const getPhotoFeedback = () => {
    // Check for individual feedback first (from deliverables API)
    if (photoItem.individualFeedback && photoItem.individualFeedback.length > 0) {
      return photoItem.individualFeedback;
    }
    
    // Get all feedback from submission (from deliverables API)
    const allFeedbacks = [
      ...(deliverables?.submissions?.flatMap(sub => sub.feedback) || []),
      ...(submission?.feedback || [])
    ];

    // Filter feedback for this specific photo
    const photoSpecificFeedback = allFeedbacks
      .filter(feedback => feedback.photosToUpdate?.includes(photoItem.id))
      .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));

    // Also include client feedback for this submission (when photo status is CLIENT_FEEDBACK)
    const clientFeedback = allFeedbacks
      .filter(feedback => {
        const isClient = feedback.admin?.admin?.role?.name === 'client' || feedback.admin?.admin?.role?.name === 'Client';
        const isFeedback = feedback.type === 'REASON' || feedback.type === 'COMMENT';
        const isClientFeedbackStatus = photoItem.status === 'CLIENT_FEEDBACK';
        
        return isClient && isFeedback && isClientFeedbackStatus;
      })
      .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));

    const allFeedback = [...photoSpecificFeedback, ...clientFeedback];
    // Return only the latest feedback
    return allFeedback.length > 0 ? [allFeedback[0]] : [];
  };

  const photoFeedback = getPhotoFeedback();



  // Helper function to determine border color
  const getBorderColor = () => {
    // For client role, SENT_TO_CLIENT status should not show green outline
    if (userRole === 'client' && isPhotoApprovedByClient) return '#1ABF66';
    if (userRole !== 'client' && isPhotoApprovedByAdmin) return '#1ABF66';
    if (hasRevisionRequested) return '#D4321C';
    return 'divider';
  };

  // V2 Individual handlers
  const handleIndividualApproveClick = async () => {
    if (!onIndividualApprove) return;
    
    setIsProcessing(true);
    try {
      const values = formMethods.getValues();
      await onIndividualApprove(photoItem.id, values.feedback);
      // Optimistically update local status
      setLocalStatus('APPROVED');
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
        // Optimistically update local status for fallback handler
        setLocalStatus('APPROVED');
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
                        if (handleAdminEditFeedback) {
                          handleAdminEditFeedback(photoItem.id, feedback.id, feedback.content);
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
                          handleAdminSendToCreator(photoItem.id, feedback.id);
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
}) => {
  const [selectedPhotosForChange, setSelectedPhotosForChange] = useState([]);
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

      const response = await axiosInstance.post('/api/submission/v3/draft/approve', payload);

      if (response.status === 200) {
        enqueueSnackbar('Photo approved successfully!', { variant: 'success' });
        // Refresh data
        if (deliverables?.deliverableMutate) {
          await deliverables.deliverableMutate();
        }
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
        submissionId: submissionId,
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
      const optimisticData = deliverables?.photos?.map(photo => 
        photo.id === mediaId ? { ...photo, status: 'APPROVED' } : photo
      );
      
      if (deliverables?.deliverableMutate) {
        deliverables.deliverableMutate(
          { ...deliverables, photos: optimisticData },
          false // Don't revalidate immediately
        );
      }

      await axiosInstance.patch('/api/submission/v3/media/approve/client', {
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
        enqueueSnackbar(`Feedback for photo sent to creator successfully!`, { variant: 'success' });
        
        // Check if all photos have been sent
        const allPhotos = deliverables.photos || [];
        const allPhotosSent = allPhotos.every(photo => sentSubmissions.has(photo.id));
        
        if (allPhotosSent) {
          enqueueSnackbar('All photos have been sent to creator!', { variant: 'success' });
          
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

  // Check if all photos are already approved
  const allPhotosApproved = deliverables?.photos?.length > 0 && 
    deliverables.photos.every(p => p.status === 'APPROVED');

  // Determine layout type
  const hasPhotos = deliverables?.photos?.length > 0;
  const shouldUseHorizontalScroll = hasPhotos && deliverables.photos.length > 1;
  const shouldUseGrid = hasPhotos && deliverables.photos.length === 1;

  const isV3 = campaign?.origin === 'CLIENT';
  const { user } = useAuthContext();
  const userRole = user?.role || 'admin'; // Use actual user role from auth context

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
              key={photo.id || index}
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
          {deliverables.photos.map((photo, index) => (
            <Grid 
              item 
              xs={12} 
              md={7} 
              key={photo.id || index}
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
};

export default Photos; 