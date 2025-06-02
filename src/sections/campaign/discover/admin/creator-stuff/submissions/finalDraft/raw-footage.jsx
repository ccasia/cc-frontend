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
  Stack,
  Button,
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
  handleVideoSelection 
}) => {
  const [cardType, setCardType] = useState('approve');

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
              Raw footage approved
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

const RawFootages = ({
  campaign,
  submission,
  deliverables,
  onVideoClick,
  onSubmit,
  isDisabled,
}) => {
  const [selectedRawFootagesForChange, setSelectedRawFootagesForChange] = useState([]);
  const approve = useBoolean();
  const request = useBoolean();
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);

  const handleVideoSelection = (id) => {
    setSelectedRawFootagesForChange((prev) => {
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
        selectedRawFootages: [videoId],
      };

      await onSubmit(payload);
      approve.onFalse();
      setCurrentVideoId(null);
      setCurrentAction(null);
    } catch (error) {
      console.error('Error submitting raw footage review:', error);
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
        selectedRawFootages: [videoId],
      };

      await onSubmit(payload);
      request.onFalse();
      setCurrentVideoId(null);
      setCurrentAction(null);
    } catch (error) {
      console.error('Error submitting raw footage review:', error);
      enqueueSnackbar(error?.message || 'Error submitting review', {
        variant: 'error',
      });
    }
  };

  // Check if all raw footages are already approved
  const allRawFootagesApproved = deliverables?.rawFootages?.length > 0 && 
    deliverables.rawFootages.every(f => f.status === 'APPROVED');

  return (
    <>
      {/* Raw Footage Grid */}
      {deliverables?.rawFootages?.length ? (
        <Grid container spacing={2}>
          {deliverables.rawFootages.map((videoItem, index) => (
            <Grid 
              item 
              xs={12} 
              md={deliverables.rawFootages.length === 1 ? 7 : 6} 
              key={videoItem.id || index}
            >
              <VideoCard 
                videoItem={videoItem} 
                index={index}
                submission={submission}
                onVideoClick={onVideoClick}
                handleApprove={handleApprove}
                handleRequestChange={handleRequestChange}
                selectedVideosForChange={selectedRawFootagesForChange}
                handleVideoSelection={handleVideoSelection}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography>No raw footage uploaded yet.</Typography>
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
  onVideoClick: PropTypes.func,
  onSubmit: PropTypes.func,
  isDisabled: PropTypes.bool,
};

export default RawFootages; 