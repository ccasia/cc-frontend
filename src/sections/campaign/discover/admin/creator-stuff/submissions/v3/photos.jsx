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
import { RHFTextField , RHFMultiSelect } from 'src/components/hook-form';

import { options_changes } from '../firstDraft/constants';
import { ConfirmationRequestModal } from '../finalDraft/confirmation-modals';

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
      if (userRole === 'client') {
        // Use client approval handler
        await handleClientApprove(photoItem.id);
      } else {
        // Use admin approval handler
        await handleApprove(photoItem.id, values);
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
        await handleClientReject(photoItem.id, values.feedback, values.reasons);
      } else {
        // Use admin request changes handler
        await handleRequestChange(photoItem.id, values);
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
            aspectRatio: '1/1',
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
            onClick={() => onImageClick(photoItem)}
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
              opacity: 0,
              transition: 'opacity 0.2s',
              '&:hover': {
                opacity: 1,
              },
            }}
            onClick={() => onImageClick(photoItem)}
          >
            <Iconify
              icon="mdi:image"
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
      {photoFeedback.length > 0 && (
        <Box sx={{ px: 2, pb: 2 }}>
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
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Card>
  );
};

const PhotosV3 = ({
  campaign,
  submission,
  deliverables,
  onImageClick,
  onSubmit,
  isDisabled,
  // Individual client approval handlers
  handleClientApproveVideo,
  handleClientApprovePhoto,
  handleClientApproveRawFootage,
  handleClientRejectVideo,
  handleClientRejectPhoto,
  handleClientRejectRawFootage,
}) => {
  const { user } = useAuthContext();
  const userRole = user?.role;

  // SWR for real-time data updates
  const { data: currentSubmission, mutate: mutateSubmission } = useSWR(
    submission?.id ? `/api/submission/v3/${submission.id}` : null,
    (url) => axiosInstance.get(url).then(res => res.data),
    { refreshInterval: 0 }
  );

  const [selectedPhotosForChange, setSelectedPhotosForChange] = useState([]);
  const [clientRequestModalOpen, setClientRequestModalOpen] = useState(false);
  const [clientRequestPhotoId, setClientRequestPhotoId] = useState(null);

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

  const handlePhotoSelection = (id) => {
    setSelectedPhotosForChange(prev => 
      prev.includes(id) 
        ? prev.filter(photoId => photoId !== id)
        : [...prev, id]
    );
  };

  const handleApprove = async (photoId, formValues) => {
    try {
      const response = await axiosInstance.patch('/api/submission/v3/media/approve', {
        mediaId: photoId,
        mediaType: 'photo',
        feedback: formValues.feedback || ''
      });

      enqueueSnackbar('Photo approved successfully!', { variant: 'success' });
      
      // Revalidate data
      await mutateSubmission();
      if (deliverables?.mutate) {
        await deliverables.mutate();
      }
      if (submission?.mutate) {
        await submission.mutate();
      }
    } catch (error) {
      console.error('Error approving photo:', error);
      enqueueSnackbar('Failed to approve photo', { variant: 'error' });
    }
  };

  const handleRequestChange = async (photoId, formValues) => {
    try {
      const response = await axiosInstance.patch('/api/submission/v3/media/request-changes', {
        mediaId: photoId,
        mediaType: 'photo',
        feedback: formValues.feedback || '',
        reasons: formValues.reasons || []
      });

      enqueueSnackbar('Changes requested successfully!', { variant: 'warning' });
      
      // Revalidate data
      await mutateSubmission();
      if (deliverables?.mutate) {
        await deliverables.mutate();
      }
      if (submission?.mutate) {
        await submission.mutate();
      }
    } catch (error) {
      console.error('Error requesting changes:', error);
      enqueueSnackbar('Failed to request changes', { variant: 'error' });
    }
  };

  // Use the prop function instead of local implementation
  const handleClientApprove = handleClientApprovePhoto;

  // Use the prop function instead of local implementation
  const handleClientReject = handleClientRejectPhoto;

  const handleOpenClientRequestModal = (photoId) => {
    setClientRequestPhotoId(photoId);
    setClientRequestModalOpen(true);
  };

  const handleCloseClientRequestModal = () => {
    setClientRequestModalOpen(false);
    setClientRequestPhotoId(null);
    clientRequestForm.reset();
  };

  const handleClientRequestSubmit = async (data) => {
    try {
      await handleClientReject(clientRequestPhotoId, data.feedback, data.reasons);
      handleCloseClientRequestModal();
    } catch (error) {
      console.error('Error submitting client request:', error);
    }
  };

  if (!deliverables?.photos || deliverables.photos.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No photos uploaded yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {deliverables.photos.map((photoItem, index) => (
          <Grid item xs={12} sm={6} md={6} key={photoItem.id}>
            <PhotoCard
              photoItem={photoItem}
              index={index}
              submission={currentSubmission || submission}
              onImageClick={onImageClick}
              handleApprove={handleApprove}
              handleRequestChange={handleRequestChange}
              selectedPhotosForChange={selectedPhotosForChange}
              handlePhotoSelection={handlePhotoSelection}
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

PhotosV3.propTypes = {
  campaign: PropTypes.object,
  submission: PropTypes.object,
  deliverables: PropTypes.object,
  onImageClick: PropTypes.func,
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

export default PhotosV3; 