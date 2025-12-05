import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import {
  Dialog,
  Button,
  Divider,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';
import axiosInstance from 'src/utils/axios';
import { useSnackbar } from 'src/components/snackbar';

export default function ReportIssueDialog({ open, onClose, logistic, onUpdate }) {
  const { enqueueSnackbar } = useSnackbar();

  const IssueSchema = Yup.object().shape({
    reason: Yup.string().required('Please describe the issue'),
  });

  const methods = useForm({
    resolver: yupResolver(IssueSchema),
    defaultValues: { reason: '' },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = async (data) => {
    try {
      await axiosInstance.post(`/api/logistics/creator/${logistic.id}/issue`, data);
      onUpdate();
      enqueueSnackbar('Issue reported successfully');
      reset();
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to report issue', { variant: 'error' });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { bgcolor: '#F4F4F4' } }}
    >
      <DialogTitle variant="h3" fontFamily="instrument serif" sx={{ fontWeight: 400 }}>
        Report Issue
        <Typography variant="body2" sx={{ color: '#636366' }}>
          Let us know what went wrong.
        </Typography>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <Iconify icon="eva:close-outline" />
        </IconButton>
      </DialogTitle>

      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <Divider sx={{ mx: 3, mb: 2 }} />
        <DialogContent>
          <Typography variant="caption" sx={{ color: '#636366', display: 'block', mb: 1 }}>
            Issue <span style={{ color: '#FF4842' }}>*</span>
          </Typography>
          <RHFTextField
            name="reason"
            placeholder="Please provide as much detail as possible about what went wrong."
            multiline
            rows={2}
            sx={{ bgcolor: '#FFFFFF', borderRadius: 1 }}
          />
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            sx={{ bgcolor: '#212B36', color: '#fff', '&:hover': { bgcolor: '#454F5B' } }}
          >
            Submit
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

ReportIssueDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  onUpdate: PropTypes.func,
};
