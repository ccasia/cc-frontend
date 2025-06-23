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

import Iconify from 'src/components/iconify';
import { RHFTextField } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

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
}) => {
  const [cardType, setCardType] = useState('approve');
  const [isProcessing, setIsProcessing] = useState(false);
  // Add local state to track status optimistically
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

  // Reset local status when videoItem status changes (server update)
  useEffect(() => {
    setLocalStatus(null);
  }, [videoItem.status]);

  // Use local status if available, otherwise use prop status
  const currentStatus = localStatus || videoItem.status;
  const isVideoApproved = currentStatus === 'APPROVED';
  const hasRevisionRequested = currentStatus === 'REVISION_REQUESTED' || currentStatus === 'CHANGES_REQUIRED';
  const isPendingReview = submission?.status === 'PENDING_REVIEW' && !isVideoApproved && !hasRevisionRequested;

  // Get feedback for this specific raw footage
  const getRawFootageFeedback = () => {
    // Check for individual feedback first
    if (videoItem.individualFeedback && videoItem.individualFeedback.length > 0) {
      return videoItem.individualFeedback;
    }
    
    // Fallback to submission-level feedback
    const allFeedbacks = [
      ...(submission?.feedback || [])
    ];

    return allFeedbacks
      .filter(feedback => feedback.rawFootageToUpdate?.includes(videoItem.id))
      .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));
  };

  const rawFootageFeedback = getRawFootageFeedback();

  // Helper function to determine border color
  const getBorderColor = () => {
    if (isVideoApproved) return '#1ABF66';
    if (hasRevisionRequested) return '#D4321C';
    return 'divider';
  };

  // V2 Individual handlers
  const handleIndividualApproveClick = async () => {
    if (!onIndividualApprove) return;
    
    setIsProcessing(true);
    try {
      const values = formMethods.getValues();
      await onIndividualApprove(videoItem.id, values.feedback);
      // Optimistically update local status
      setLocalStatus('APPROVED');
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
      await onIndividualRequestChange(videoItem.id, values.feedback);
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
      if (isVideoApproved) {
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
                  onClick={handleRequestClick}
                  variant="contained"
                  size="small"
                  loading={isSubmitting || isProcessing}
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

          {isVideoApproved && (
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
                
                <Typography variant="body2" sx={{ color: '#000000' }}>
                  {feedback.content || feedback.rawFootageContent}
                </Typography>
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
      const payload = {
        type: 'approve',
        footageFeedback: formValues.feedback,
        selectedRawFootages: [videoId],
      };

      await onSubmit(payload);
    } catch (error) {
      console.error('Error submitting raw footage review:', error);
      enqueueSnackbar(error?.message || 'Error submitting review', {
        variant: 'error',
      });
    }
  };

  const handleRequestChange = async (videoId, formValues) => {
    try {
      const payload = {
        type: 'request',
        footageFeedback: formValues.feedback,
        selectedRawFootages: [videoId],
      };

      await onSubmit(payload);
    } catch (error) {
      console.error('Error submitting raw footage review:', error);
      enqueueSnackbar(error?.message || 'Error submitting review', {
        variant: 'error',
      });
    }
  };

  // Check if all raw footages are already approved
  const allRawFootagesApproved = deliverables?.rawFootages?.length > 0 && 
    deliverables.rawFootages.every(r => r.status === 'APPROVED');

  // Determine layout type
  const hasRawFootages = deliverables?.rawFootages?.length > 0;
  const shouldUseHorizontalScroll = hasRawFootages && deliverables.rawFootages.length > 1;
  const shouldUseGrid = hasRawFootages && deliverables.rawFootages.length === 1;

  return (
    <>
      {/* Raw Footages Horizontal Scroll */}
      {!hasRawFootages && (
        <Typography>No raw footages uploaded yet.</Typography>
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
          {deliverables.rawFootages.map((video, index) => (
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
              />
            </Box>
          ))}
        </Box>
      )}

      {shouldUseGrid && (
        <Grid container spacing={2}>
          {deliverables.rawFootages.map((video, index) => (
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
              />
            </Grid>
          ))}
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
                bgcolor: '#e8ecfc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify
                icon="logos:google-drive"
                sx={{
                  width: 16,
                  height: 16,
                  color: '#1340ff',
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
                display: 'flex',
                alignItems: 'center',
                color: '#1340ff',
                textDecoration: 'none',
                '&:hover': {
                  color: '#1340ff',
                  textDecoration: 'underline',
                  opacity: 0.8,
                },
                wordBreak: 'break-all',
              }}
            >
              <Iconify
                icon="eva:external-link-fill"
                sx={{
                  mr: 0.5,
                  width: 16,
                  height: 16,
                  color: '#1340ff',
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
            All raw footages have been approved
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
};

export default RawFootages; 