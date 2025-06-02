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

const PhotoCard = ({ 
  photoItem, 
  index, 
  submission, 
  onImageClick, 
  handleApprove, 
  handleRequestChange,
  selectedPhotosForChange,
  handlePhotoSelection 
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

  const isPhotoApproved = photoItem.status === 'APPROVED';
  const hasRevisionRequested = photoItem.status === 'REVISION_REQUESTED';
  const isPendingReview = submission?.status === 'PENDING_REVIEW' && !isPhotoApproved;

  const handleApproveClick = async () => {
    const values = formMethods.getValues();
    await handleApprove(photoItem.id, values);
  };

  const handleRequestClick = async () => {
    const values = formMethods.getValues();
    await handleRequestChange(photoItem.id, values);
  };

  const renderFormContent = () => {
    if (!isPendingReview) {
      if (isPhotoApproved) {
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
              Photo approved
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
      {/* Photo Section */}
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

          {isPhotoApproved && (
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
    </Card>
  );
};

PhotoCard.propTypes = {
  photoItem: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    url: PropTypes.string.isRequired,
    status: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  submission: PropTypes.object,
  onImageClick: PropTypes.func.isRequired,
  handleApprove: PropTypes.func.isRequired,
  handleRequestChange: PropTypes.func.isRequired,
  selectedPhotosForChange: PropTypes.array.isRequired,
  handlePhotoSelection: PropTypes.func.isRequired,
};

const Photos = ({
  campaign,
  submission,
  deliverables,
  onImageClick,
  onSubmit,
  isDisabled,
}) => {
  const [selectedPhotosForChange, setSelectedPhotosForChange] = useState([]);
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
        type: 'approve',
        photoFeedback: formValues.feedback,
        selectedPhotos: [photoId],
      };

      await onSubmit(payload);
    } catch (error) {
      console.error('Error submitting photo review:', error);
      enqueueSnackbar(error?.message || 'Error submitting review', {
        variant: 'error',
      });
    }
  };

  const handleRequestChange = async (photoId, formValues) => {
    try {
      const payload = {
        type: 'request',
        photoFeedback: formValues.feedback,
        selectedPhotos: [photoId],
      };

      await onSubmit(payload);
    } catch (error) {
      console.error('Error submitting photo review:', error);
      enqueueSnackbar(error?.message || 'Error submitting review', {
        variant: 'error',
      });
    }
  };

  // Check if all photos are already approved
  const allPhotosApproved = deliverables?.photos?.length > 0 && 
    deliverables.photos.every(p => p.status === 'APPROVED');

  return (
    <>
      {/* Photos Grid */}
      {deliverables?.photos?.length ? (
        <Grid container spacing={2}>
          {deliverables.photos.map((photo, index) => (
            <Grid 
              item 
              xs={12} 
              md={deliverables.photos.length === 1 ? 7 : 6} 
              key={photo.id || index}
            >
              <PhotoCard 
                photoItem={photo} 
                index={index}
                submission={submission}
                onImageClick={onImageClick}
                handleApprove={handleApprove}
                handleRequestChange={handleRequestChange}
                selectedPhotosForChange={selectedPhotosForChange}
                handlePhotoSelection={handlePhotoSelection}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography>No photos uploaded yet.</Typography>
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
};

export default Photos; 