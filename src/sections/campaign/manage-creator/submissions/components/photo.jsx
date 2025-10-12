import React from 'react';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Dialog,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useGetSubmissions } from 'src/hooks/use-get-submission';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFUpload, RHFTextField } from 'src/components/hook-form';

const UploadPhotoModal = ({
  submissionId,
  campaignId,
  open,
  onClose,
  previousSubmission,
  deliverablesData,
}) => {
  const { user } = useAuthContext();
  const methods = useForm({
    defaultValues: {
      photos: [],
      photosDriveLink: '',
    },
  });

  const { deliverables, deliverableMutate } = deliverablesData;

  const { mutate: submissionMutate } = useGetSubmissions(user?.id, campaignId);

  const {
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  // const photosToUpdateCount = previousSubmission?.feedback?.reduce(
  //   (count, f) => count + (f.photosToUpdate?.length || 0),
  //   0
  // );

  const photosToUpdateCount = deliverables?.photos.filter(
    (a) => a.status === 'REVISION_REQUESTED'
  )?.length;

  const validateFileCount = (files) => {
    if (previousSubmission?.status === 'CHANGES_REQUIRED') {
      if (files.length !== photosToUpdateCount) {
        enqueueSnackbar(
          `Please upload exactly ${photosToUpdateCount} photo${photosToUpdateCount > 1 ? 's' : ''}.`,
          { variant: 'error' }
        );
        return false;
      }
    }
    return true;
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!validateFileCount(data.photos)) {
      return;
    }
    try {
      const formData = new FormData();

      const newData = {
        submissionId,
        photosDriveLink: data.photosDriveLink,
      };

      formData.append('data', JSON.stringify(newData));

      if (data.photos && data.photos.length > 0) {
        data.photos.forEach((file) => {
          formData.append('photos', file);
        });
      }

      // V3 submissions removed - using V2 endpoint only
      const endpoint = endpoints.submission.creator.draftSubmission;
      await axiosInstance.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      enqueueSnackbar('Photos uploaded successfully!');
      onClose();
      submissionMutate();
      deliverableMutate();
      mutate(endpoints.kanban.root);
      mutate(endpoints.campaign.creator.getCampaign(campaignId));
    } catch (error) {
      console.error('Photo upload error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload photos';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ bgcolor: '#f4f4f4' }}>
        <Stack direction="row" alignItems="center" gap={2}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: { xs: '1.8rem', sm: '2.4rem' },
              fontWeight: 550,
            }}
          >
            Upload Photos
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              ml: 'auto',
              color: '#636366',
            }}
          >
            <Iconify icon="hugeicons:cancel-01" width={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: '#f4f4f4', pt: 3 }}>
        {previousSubmission?.status === 'CHANGES_REQUIRED' && (
          <Typography variant="body2" sx={{ color: 'warning.main', mb: 2 }}>
            Please upload exactly {photosToUpdateCount} photo{photosToUpdateCount > 1 ? 's' : ''} as
            requested by the admin.
          </Typography>
        )}
        <FormProvider methods={methods}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#636366', mb: 1 }}>
                Upload Photos{' '}
                <Box component="span" sx={{ color: 'error.main' }}>
                  *
                </Box>
              </Typography>
              <RHFUpload
                name="photos"
                type="file"
                multiple
                maxFiles={photosToUpdateCount}
                onUploadSuccess={(files) => {
                  setValue('photos', files);
                }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ color: '#636366', mb: 1 }}>
                <Iconify
                  icon="logos:google-drive"
                  width={16}
                  sx={{ mr: 0.5, verticalAlign: 'text-bottom' }}
                />
                Google Drive Link (Optional)
              </Typography>
              <RHFTextField
                name="photosDriveLink"
                placeholder="Paste your Google Drive link here"
                sx={{ bgcolor: 'white', borderRadius: 1 }}
              />
            </Box>
          </Stack>
        </FormProvider>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, bgcolor: '#f4f4f4' }}>
        <LoadingButton
          fullWidth
          variant="contained"
          onClick={onSubmit}
          loading={isSubmitting}
          sx={{
            bgcolor: '#203ff5',
            color: 'white',
            borderBottom: 3.5,
            borderBottomColor: '#112286',
            borderRadius: 1.5,
            px: 2.5,
            py: 1.2,
            '&:hover': {
              bgcolor: '#203ff5',
              opacity: 0.9,
            },
          }}
        >
          Upload Photos
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default UploadPhotoModal;

UploadPhotoModal.propTypes = {
  submissionId: PropTypes.string,
  campaignId: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  previousSubmission: PropTypes.object,
  deliverablesData: PropTypes.object,
};
