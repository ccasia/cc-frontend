import dayjs from 'dayjs';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
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
  Typography,
  CardContent,
} from '@mui/material';

import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField , RHFMultiSelect } from 'src/components/hook-form';

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
  options_changes,
  isV3 = false,
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
  const hasRevisionRequested = currentStatus === 'REVISION_REQUESTED';
  
  // For client role, SENT_TO_CLIENT status should be treated as PENDING_REVIEW
  const isPendingReview = userRole === 'client' ? 
    // For clients: show approval buttons when media is SENT_TO_CLIENT or submission is PENDING_REVIEW
    (currentStatus === 'SENT_TO_CLIENT' || (submission?.status === 'PENDING_REVIEW' && !isPhotoApprovedByClient && !hasRevisionRequested)) :
    // For non-clients: show approval buttons when submission is PENDING_REVIEW and media not approved
    (submission?.status === 'PENDING_REVIEW' && !isPhotoApprovedByAdmin && !hasRevisionRequested);

  // Get feedback for this specific photo
  const getPhotoFeedback = () => {
    // Check for individual feedback first
    if (photoItem.individualFeedback && photoItem.individualFeedback.length > 0) {
      return photoItem.individualFeedback;
    }
    
    // Fallback to submission-level feedback
    const allFeedbacks = [
      ...(submission?.feedback || [])
    ];

    return allFeedbacks
      .filter(feedback => feedback.photosToUpdate?.includes(photoItem.id))
      .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));
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

  const handleApproveClick = async () => {
    try {
      const values = formMethods.getValues();
      await handleApprove(photoItem.id, values);
      // Optimistically update local status
      setLocalStatus(userRole === 'client' ? 'APPROVED' : (isV3 ? 'SENT_TO_CLIENT' : 'APPROVED'));
    } catch (error) {
      console.error('Error in approve handler:', error);
    }
  };

  const handleRequestClick = async () => {
    try {
      const values = formMethods.getValues();
      await handleRequestChange(photoItem.id, values);
      // Optimistically update local status
      setLocalStatus('REVISION_REQUESTED');
    } catch (error) {
      console.error('Error in request handler:', error);
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
                    }}
                  >
                    Request Changes
                  </Button>
                )}

                <LoadingButton
                  onClick={handleApproveClick}
                  loading={isSubmitting || isProcessing}
                  disabled={isSubmitting || isProcessing}
                  size="small"
                  variant="contained"
                  sx={{
                    bgcolor: '#1ABF66',
                    borderRadius: 1.15,
                    borderBottom: 3,
                    borderBottomColor: '#0F8A4A',
                    '&:hover': {
                      bgcolor: '#0F8A4A',
                    },
                    textTransform: 'none',
                    py: 1.2,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {userRole === 'client' ? 'Approve' : (isV3 ? 'Send to Client' : 'Approve')}
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
              placeholder="Select reasons for changes"
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
                    color: '#666666',
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                      borderColor: '#666666',
                    },
                    textTransform: 'none',
                    py: 1.2,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  Back
                </Button>

                <LoadingButton
                  onClick={handleRequestClick}
                  loading={isSubmitting || isProcessing}
                  disabled={isSubmitting || isProcessing}
                  size="small"
                  variant="contained"
                  sx={{
                    bgcolor: '#D4321C',
                    borderRadius: 1.15,
                    borderBottom: 3,
                    borderBottomColor: '#A6251A',
                    '&:hover': {
                      bgcolor: '#A6251A',
                    },
                    textTransform: 'none',
                    py: 1.2,
                    fontSize: '0.9rem',
                    fontWeight: 600,
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
    <Grid item xs={12} sm={6} md={4}>
      <Card
        sx={{
          border: 2,
          borderColor: getBorderColor(),
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
          '&:hover': {
            boxShadow: (theme) => theme.customShadows.z24,
          },
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <img
            src={photoItem.url}
            alt={`Photo ${index + 1}`}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              cursor: 'pointer',
            }}
            onClick={() => onImageClick(photoItem)}
          />
          
          {/* Status badge */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1,
            }}
          >
            <Chip
              label={currentStatus}
              size="small"
              sx={{
                bgcolor: currentStatus === 'SENT_TO_CLIENT' ? '#1ABF66' : 
                         currentStatus === 'APPROVED' ? '#1ABF66' :
                         currentStatus === 'REVISION_REQUESTED' ? '#D4321C' : '#666666',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
          </Box>

          {/* Selection checkbox for bulk actions */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 1,
            }}
          >
            <input
              type="checkbox"
              checked={selectedPhotosForChange.includes(photoItem.id)}
              onChange={() => handlePhotoSelection(photoItem.id)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
              }}
            />
          </Box>
        </Box>

        <CardContent sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* Photo info */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar
                src={photoItem.user?.photoURL}
                sx={{ width: 24, height: 24 }}
              />
              <Typography variant="caption" color="text.secondary">
                {photoItem.user?.name || 'Creator'}
              </Typography>
            </Stack>

            {/* Feedback display */}
            {photoFeedback.length > 0 && (
              <Box
                sx={{
                  bgcolor: '#F5F5F5',
                  p: 1.5,
                  borderRadius: 1,
                  maxHeight: '100px',
                  overflow: 'auto',
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Feedback:
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {photoFeedback[0]?.content || 'No feedback available'}
                </Typography>
              </Box>
            )}

            {/* Action form */}
            {renderFormContent()}
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
};

PhotoCard.propTypes = {
  photoItem: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  submission: PropTypes.object,
  onImageClick: PropTypes.func,
  handleApprove: PropTypes.func.isRequired,
  handleRequestChange: PropTypes.func.isRequired,
  selectedPhotosForChange: PropTypes.array,
  handlePhotoSelection: PropTypes.func,
  userRole: PropTypes.string,
  deliverables: PropTypes.object,
  options_changes: PropTypes.array,
  isV3: PropTypes.bool,
};

export default PhotoCard; 