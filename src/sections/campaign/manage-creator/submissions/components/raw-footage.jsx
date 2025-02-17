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
import FormProvider, { RHFUpload } from 'src/components/hook-form';

const UploadRawFootageModal = ({ open, onClose, submissionId, campaign }) => {
  const { user } = useAuthContext();
  const methods = useForm({
    defaultValues: {
      rawFootage: [],
    },
  });

  const { mutate: submissionMutate } = useGetSubmissions(user?.id, campaign?.id);

  const { handleSubmit, setValue } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const formData = new FormData();
      const newData = { submissionId }; // No caption needed
      formData.append('data', JSON.stringify(newData));

      if (data.rawFootage && data.rawFootage.length > 0) {
        data.rawFootage.forEach((file) => {
          formData.append('rawFootage', file);
        });
      }

      await axiosInstance.post(endpoints.submission.creator.draftSubmission, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      enqueueSnackbar('Raw footage uploaded successfully');
      onClose();
      submissionMutate();
      mutate(endpoints.kanban.root);
      mutate(endpoints.campaign.creator.getCampaign(campaign.id));
    } catch (error) {
      enqueueSnackbar('Failed to upload raw footage', { variant: 'error' });
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
        <FormProvider methods={methods}>
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
              onUploadSuccess={(files) => {
                setValue('rawFootage', files);
              }}
            />
          </Box>
        </FormProvider>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, bgcolor: '#f4f4f4' }}>
        <LoadingButton
          fullWidth
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
};
