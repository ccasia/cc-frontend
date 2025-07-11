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

import { useBoolean } from 'src/hooks/use-boolean';

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
}) => {
  const [cardType, setCardType] = useState('approve');
  const [isProcessing, setIsProcessing] = useState(false);
  // Add local state to track status optimistically
  const [localStatus, setLocalStatus] = useState(null);

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
  const isVideoApproved = currentStatus === 'APPROVED';
  const hasRevisionRequested = currentStatus === 'REVISION_REQUESTED' || currentStatus === 'CHANGES_REQUIRED';
  const isPendingReview = submission?.status === 'PENDING_REVIEW' && !isVideoApproved && !hasRevisionRequested;

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
      await onIndividualApprove(videoItem.id, values.feedback, values.dueDate);
      // Optimistically update local status
      setLocalStatus('APPROVED');
    } catch (error) {
      console.error('Error approving video:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIndividualRequestClick = async () => {
    if (!onIndividualRequestChange) return;
    
    setIsProcessing(true);
    try {
      // Validate the form first
      const isValid = await formMethods.trigger();
      if (!isValid) {
        setIsProcessing(false);
        return;
      }
      
      const values = formMethods.getValues();
      // Clean the reasons array to remove any null/undefined values
      const cleanReasons = Array.isArray(values.reasons) 
        ? values.reasons.filter(reason => reason !== null && reason !== undefined && reason !== '')
        : [];
      
      await onIndividualRequestChange(videoItem.id, values.feedback, cleanReasons);
      // Optimistically update local status
      setLocalStatus('CHANGES_REQUIRED');
    } catch (error) {
      console.error('Error requesting video changes:', error);
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
  // V2 props
  onIndividualApprove: PropTypes.func,
  onIndividualRequestChange: PropTypes.func,
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
        feedback: formValues.feedback,
        dueDate: dayjs(formValues.dueDate).format('YYYY-MM-DD'),
        selectedVideos: [videoId],
      };

      await onSubmit(payload);
    } catch (error) {
      console.error('Error submitting video review:', error);
      enqueueSnackbar(error?.message || 'Error submitting review', {
        variant: 'error',
      });
    }
  };

  const handleRequestChange = async (videoId, formValues) => {
    try {
      const payload = {
        type: 'request',
        feedback: formValues.feedback,
        reasons: formValues.reasons,
        selectedVideos: [videoId],
      };

      await onSubmit(payload);
    } catch (error) {
      console.error('Error submitting video review:', error);
      enqueueSnackbar(error?.message || 'Error submitting review', {
        variant: 'error',
      });
    }
  };

  // Check if all videos are already approved
  const allVideosApproved = deliverables?.videos?.length > 0 && 
    deliverables.videos.every(v => v.status === 'APPROVED');

  // Determine layout type
  const hasVideos = deliverables?.videos?.length > 0;
  const shouldUseHorizontalScroll = hasVideos && deliverables.videos.length > 1;
  const shouldUseGrid = hasVideos && deliverables.videos.length === 1;

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
};

export default DraftVideos; 