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
  handleVideoSelection 
}) => {
  const [cardType, setCardType] = useState('approve');

  const requestSchema = Yup.object().shape({
    feedback: Yup.string().required('This field is required'),
    reasons: Yup.array(),
  });

  const approveSchema = Yup.object().shape({
    feedback: Yup.string().required('Comment is required.'),
    dueDate: Yup.string().required('Due Date is required.'),
  });

  const formMethods = useForm({
    resolver: cardType === 'request' ? yupResolver(requestSchema) : yupResolver(approveSchema),
    defaultValues: {
      feedback: cardType === 'approve' ? 'Thank you for submitting!' : '',
      reasons: [],
      dueDate: null,
    },
  });

  const { formState: { isSubmitting }, setValue, reset } = formMethods;

  // Reset form when cardType changes
  useEffect(() => {
    reset({
      feedback: cardType === 'approve' ? 'Thank you for submitting!' : '',
      reasons: [],
      dueDate: null,
    });
  }, [cardType, reset]);

  const isVideoApproved = videoItem.status === 'APPROVED';
  const hasRevisionRequested = videoItem.status === 'REVISION_REQUESTED';
  const isPendingReview = submission?.status === 'PENDING_REVIEW' && !isVideoApproved;

  const handleApproveClick = async () => {
    const values = formMethods.getValues();
    await handleApprove(videoItem.id, values);
  };

  const handleRequestClick = async () => {
    const values = formMethods.getValues();
    await handleRequestChange(videoItem.id, values);
  };

  const renderFormContent = () => {
    if (!isPendingReview) {
      if (isVideoApproved) {
        return (
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
            }}
          >
            <Iconify icon="solar:check-circle-bold" color="success.main" />
            <Typography color="success.darker" variant="body2">
              Video approved
            </Typography>
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
                  loading={isSubmitting}
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
                  sx={{
                    bgcolor: 'white',
                    border: 1.5,
                    borderRadius: 1.15,
                    borderColor: '#e7e7e7',
                    borderBottom: 3,
                    borderBottomColor: '#e7e7e7',
                    color: 'text.primary',
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                      borderColor: '#231F20',
                    },
                    textTransform: 'none',
                    py: 1.2,
                    fontSize: '0.9rem',
                    height: '40px',
                    flex: 1,
                  }}
                >
                  Back
                </Button>

                <LoadingButton
                  variant="contained"
                  size="small"
                  onClick={handleRequestClick}
                  loading={isSubmitting}
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
                  Submit
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
        borderColor: 'divider',
      }}
    >
      {/* Video Section */}
      <Box sx={{ p: 2, pb: 1 }}>
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
                <Iconify
                  icon="si:warning-fill"
                  width={20}
                  color="warning.main"
                />
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
                <Iconify
                  icon="lets-icons:check-fill"
                  width={20}
                  color="success.main"
                />
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
    </Card>
  );
};

VideoCard.propTypes = {
  videoItem: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  submission: PropTypes.object.isRequired,
  onVideoClick: PropTypes.func.isRequired,
  handleApprove: PropTypes.func.isRequired,
  handleRequestChange: PropTypes.func.isRequired,
  selectedVideosForChange: PropTypes.array,
  handleVideoSelection: PropTypes.func,
};

const DraftVideos = ({
  campaign,
  submission,
  deliverables,
  onVideoClick,
  onSubmit,
  isDisabled,
}) => {
  const [selectedVideosForChange, setSelectedVideosForChange] = useState([]);
  const approve = useBoolean();
  const request = useBoolean();
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);

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
      setCurrentVideoId(videoId);
      setCurrentAction('approve');

      const payload = {
        type: 'approve',
        feedback: formValues.feedback,
        reasons: formValues.reasons || [],
        dueDate: formValues.dueDate,
        selectedVideos: [videoId],
      };

      await onSubmit(payload);
      approve.onFalse();
      setCurrentVideoId(null);
      setCurrentAction(null);
    } catch (error) {
      console.error('Error submitting draft video review:', error);
      enqueueSnackbar(error?.message || 'Error submitting review', {
        variant: 'error',
      });
    }
  };

  const handleRequestChange = async (videoId, formValues) => {
    try {
      setCurrentVideoId(videoId);
      setCurrentAction('request');

      const payload = {
        type: 'request',
        feedback: formValues.feedback,
        reasons: formValues.reasons || [],
        dueDate: null,
        selectedVideos: [videoId],
      };

      await onSubmit(payload);
      request.onFalse();
      setCurrentVideoId(null);
      setCurrentAction(null);
    } catch (error) {
      console.error('Error submitting draft video review:', error);
      enqueueSnackbar(error?.message || 'Error submitting review', {
        variant: 'error',
      });
    }
  };

  // Check if all videos are already approved
  const allVideosApproved = (deliverables?.videos?.length > 0 && 
    deliverables.videos.every(v => v.status === 'APPROVED')) ||
   (submission?.content && submission?.status === 'APPROVED');

  return (
    <>
      {/* Video Grid */}
      {campaign?.campaignCredits && !!deliverables?.videos?.length && (
        <Grid container spacing={2}>
          {deliverables.videos.map((videoItem, index) => (
            <Grid 
              item 
              xs={12} 
              md={deliverables.videos.length === 1 ? 7 : 6} 
              key={videoItem.id || index}
            >
              <VideoCard 
                videoItem={videoItem} 
                index={index}
                submission={submission}
                onVideoClick={onVideoClick}
                handleApprove={handleApprove}
                handleRequestChange={handleRequestChange}
                selectedVideosForChange={selectedVideosForChange}
                handleVideoSelection={handleVideoSelection}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Single video content - Legacy support */}
      {!!submission?.content && (
        <Box
          sx={{
            position: 'relative',
            borderRadius: 1,
            overflow: 'hidden',
            aspectRatio: '16/9',
            cursor: 'pointer',
            mb: 3,
          }}
          onClick={() => onVideoClick()}
        >
          <Box
            component="video"
            src={submission?.content}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>
      )}

      {/* Caption Section for legacy support */}
      {submission?.caption && !submission?.videos?.length && (
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
                bgcolor: 'primary.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify
                icon="solar:text-bold"
                sx={{
                  width: 16,
                  height: 16,
                  color: 'primary.main',
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
              Video Caption
            </Typography>
          </Box>

          <Box sx={{ p: 2.5 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.primary',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {submission.caption}
            </Typography>
          </Box>
        </Box>
      )}

      {/* All Videos Approved Message */}
      {allVideosApproved && (
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
            All draft videos have been approved
          </Typography>
        </Box>
      )}

      {/* Confirmation Modals */}
      <ConfirmationApproveModal
        open={approve.value}
        onClose={approve.onFalse}
        sectionType="video"
        onConfirm={() => {}}
        isSubmitting={false}
        isDisabled={isDisabled}
        watchData={{}}
      />

      <ConfirmationRequestModal
        open={request.value}
        onClose={request.onFalse}
        sectionType="video"
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
  onVideoClick: PropTypes.func,
  onSubmit: PropTypes.func,
  isDisabled: PropTypes.bool,
};

export default DraftVideos; 