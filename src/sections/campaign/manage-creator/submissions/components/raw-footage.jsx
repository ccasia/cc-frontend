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

import { useBoolean } from 'src/hooks/use-boolean';
import { useGetSubmissions } from 'src/hooks/use-get-submission';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFUpload, RHFTextField } from 'src/components/hook-form';

const UploadRawFootageModal = ({
  open,
  onClose,
  submissionId,
  campaign,
  previewSubmission,
  deliverablesData,
}) => {
  const { user } = useAuthContext();
  const loading = useBoolean();

  const { deliverables, deliverableMutate } = deliverablesData;

  const methods = useForm({
    defaultValues: {
      rawFootage: [],
      rawFootagesDriveLink: '',
    },
  });

  const { mutate: submissionMutate } = useGetSubmissions(user?.id, campaign?.id);

  const { handleSubmit, setValue } = methods;

  // const rawFootageToUpdateCount = previewSubmission?.feedback?.reduce(
  //   (count, f) => count + (f.rawFootageToUpdate?.length || 0),
  //   0
  // );

  const rawFootageToUpdateCount = deliverables?.rawFootages?.filter(
    (x) => x.status === 'REVISION_REQUESTED'
  )?.length || 0;

  const validateFileCount = (files) => {
    if (previewSubmission?.status === 'CHANGES_REQUIRED') {
      if (files.length !== rawFootageToUpdateCount) {
        enqueueSnackbar(
          `Please upload exactly ${rawFootageToUpdateCount} raw footage file${rawFootageToUpdateCount > 1 ? 's' : ''}.`,
          { variant: 'error' }
        );
        return false;
      }
    }
    return true;
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!validateFileCount(data.rawFootage)) {
      return;
    }
    try {
      loading.onTrue();
      const formData = new FormData();
      const newData = {
        submissionId,
        rawFootagesDriveLink: data.rawFootagesDriveLink,
      };
      formData.append('data', JSON.stringify(newData));

      if (data.rawFootage && data.rawFootage.length > 0) {
        data.rawFootage.forEach((file) => {
          formData.append('rawFootage', file);
        });
      }

      // V3 submissions removed - using V2 endpoint only
      const endpoint = endpoints.submission.creator.draftSubmission;
      await axiosInstance.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      enqueueSnackbar('Raw footage uploaded successfully');
      onClose();
      submissionMutate();
      deliverableMutate();
      mutate(endpoints.kanban.root);
      mutate(endpoints.campaign.creator.getCampaign(campaign.id));
    } catch (error) {
      console.error('Raw footage upload error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload raw footage';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      loading.onFalse();
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
            Upload Raw Footage
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
        {previewSubmission?.status === 'CHANGES_REQUIRED' && (
          <Typography variant="body2" sx={{ color: 'warning.main', mb: 2 }}>
            Please upload exactly {rawFootageToUpdateCount} raw footage file
            {rawFootageToUpdateCount > 1 ? 's' : ''} as requested by the admin.
          </Typography>
        )}
        <FormProvider methods={methods}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#636366', mb: 1 }}>
                Upload Raw Footage{' '}
                <Box component="span" sx={{ color: 'error.main' }}>
                  *
                </Box>
              </Typography>
              <RHFUpload
                name="rawFootage"
                type="video"
                multiple
                maxFiles={rawFootageToUpdateCount}
                onUploadSuccess={(files) => {
                  setValue('rawFootage', files);
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
                name="rawFootagesDriveLink"
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
          loading={loading.value}
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
          Upload Raw Footage
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default UploadRawFootageModal;

UploadRawFootageModal.propTypes = {
  submissionId: PropTypes.string,
  campaign: PropTypes.object,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  previewSubmission: PropTypes.object,
  deliverablesData: PropTypes.object,
};
