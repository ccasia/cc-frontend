import { mutate } from 'swr';
import { useState } from 'react';
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
  DialogActions,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFUpload, RHFTextField } from 'src/components/hook-form';

const UploadDraftVideoModal = ({
  submissionId,
  campaign,
  open,
  onClose,
  previousSubmission,
  totalUGCVideos,
  submission,
  deliverablesData,
}) => {
  const methods = useForm({
    defaultValues: {
      draftVideo: [],
      caption: previousSubmission?.caption || '',
    },
  });

  const { deliverableMutate } = deliverablesData;

  const { handleSubmit } = methods;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const videosToUpdateCount =
    totalUGCVideos ||
    submission?.video.filter((x) => x.status === 'REVISION_REQUESTED')?.length ||
    previousSubmission?.video.filter((x) => x.status === 'REVISION_REQUESTED')?.length ||
    1;

  const validateFileCount = (files) => {
    if (previousSubmission?.status === 'CHANGES_REQUIRED') {
      if (files.length !== videosToUpdateCount) {
        enqueueSnackbar(
          `Please upload exactly ${videosToUpdateCount} video${videosToUpdateCount > 1 ? 's' : ''}.`,
          { variant: 'error' }
        );
        return false;
      }
    }
    return true;
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!data?.draftVideo?.length) {
      enqueueSnackbar(`Upload a video in order to proceed`, {
        variant: 'error',
      });
      return;
    }

    if (!validateFileCount(data.draftVideo)) {
      return;
    }

    if (totalUGCVideos && data.draftVideo.length !== totalUGCVideos) {
      enqueueSnackbar(`You need to upload ${totalUGCVideos} UGC Videos`, {
        variant: 'error',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      const newData = { caption: data.caption, submissionId };
      formData.append('data', JSON.stringify(newData));

      // Handle multiple files
      if (data.draftVideo && data.draftVideo.length > 0) {
        data.draftVideo.forEach((file) => {
          formData.append('draftVideo', file);
        });
      }

      await axiosInstance.post(endpoints.submission.creator.draftSubmission, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      enqueueSnackbar('Draft videos are processing');
      onClose();
      mutate(endpoints.kanban.root);
      deliverableMutate();
      mutate(endpoints.campaign.creator.getCampaign(campaign?.id));
    } catch (error) {
      console.error('Upload error:', error);
      enqueueSnackbar('Failed to upload draft videos', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
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
            Upload Draft Videos
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
        {campaign?.ads && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'warning.main',
                bgcolor: 'warning.lighter',
                p: 1.5,
                borderRadius: 1,
                fontWeight: 500,
              }}
            >
              <Iconify
                icon="solar:bell-bing-bold-duotone"
                width={16}
                sx={{ mr: 0.5, verticalAlign: 'text-bottom' }}
              />
              UGC Draft Videos may also be used as Ads.
            </Typography>
          </Box>
        )}

        {previousSubmission?.status === 'CHANGES_REQUIRED' && (
          <Typography variant="body2" sx={{ color: 'warning.main', mb: 2 }}>
            Please upload exactly {videosToUpdateCount} video{videosToUpdateCount > 1 ? 's' : ''} as
            requested by the admin.
          </Typography>
        )}

        <FormProvider methods={methods}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#636366', mb: 1 }}>
                Upload Videos{' '}
                <Box component="span" sx={{ color: 'error.main' }}>
                  *
                </Box>
              </Typography>
              <RHFUpload
                name="draftVideo"
                type="video"
                multiple
                accept={{ 'video/*': [] }}
                maxFiles={videosToUpdateCount}
              />
            </Box>
            <RHFTextField
              name="caption"
              label="Caption"
              multiline
              rows={3}
              sx={{ bgcolor: 'white', borderRadius: 1 }}
            />
          </Stack>
        </FormProvider>
      </DialogContent>
      <DialogActions sx={{ bgcolor: '#f4f4f4' }}>
        <LoadingButton
          fullWidth
          loading={isSubmitting}
          loadingPosition="center"
          loadingIndicator={<CircularProgress color="inherit" size={24} />}
          variant="contained"
          onClick={onSubmit}
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
          Upload Videos
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDraftVideoModal;

UploadDraftVideoModal.propTypes = {
  submissionId: PropTypes.string,
  campaign: PropTypes.object,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  previousSubmission: PropTypes.object,
  totalUGCVideos: PropTypes.number,
  submission: PropTypes.object,
  deliverablesData: PropTypes.object,
};
