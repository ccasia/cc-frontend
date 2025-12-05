import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';

import {
  Box,
  Dialog,
  Button,
  Divider,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack,
  IconButton,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import Iconify from 'src/components/iconify';
import { Button3D } from 'src/components/custom-button';
import FormProvider, { RHFTextField } from 'src/components/hook-form';
import axiosInstance from 'src/utils/axios';
import { useSnackbar } from 'src/components/snackbar';

export default function ConfirmDetailsDialog({ open, onClose, logistic, onUpdate }) {
  const { enqueueSnackbar } = useSnackbar();

  const ConfirmSchema = Yup.object().shape({
    address: Yup.string().required('Address is required'),
    phoneNumber: Yup.string().required('Contact number is required'),
    remarks: Yup.string(),
  });

  const defaultValues = {
    address: '',
    phoneNumber: '',
    remarks: '',
  };

  const methods = useForm({
    resolver: yupResolver(ConfirmSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (logistic && open) {
      setValue('address', logistic.deliveryDetails?.address || '');
      setValue('phoneNumber', logistic.creator?.phoneNumber || '');
      setValue('remarks', logistic.deliveryDetails?.dietaryRestrictions || '');
    }
  }, [logistic, open, setValue]);

  const onSubmit = async (data) => {
    try {
      await axiosInstance.patch(`/api/logistics/creator/${logistic.id}/details`, data);
      onUpdate();
      enqueueSnackbar('Details confirmed successfully!');
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to update details', { variant: 'error' });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { bgcolor: '#F4F4F4' },
      }}
    >
      <DialogTitle variant="h3" fontFamily="instrument serif" sx={{ fontWeight: 400 }}>
        Confirm Details
        <Typography variant="body2" sx={{ color: '#FF5630' }}>
          You will only be able to edit this once.
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Iconify icon="eva:close-outline" />
        </IconButton>
      </DialogTitle>

      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <Divider sx={{ mx: 3, mb: 2 }} />
        <DialogContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" sx={{ color: '#636366', display: 'block', mb: 0.5 }}>
                Delivery Address <span style={{ color: '#FF4842' }}>*</span>
              </Typography>
              <RHFTextField
                name="address"
                placeholder="Delivery Address *"
                multiline
                rows={2}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#FFFFFF',
                    borderRadius: 1,
                  },
                }}
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#636366', display: 'block', mb: 0.5 }}>
                Contact Number <span style={{ color: '#FF4842' }}>*</span>
              </Typography>
              <RHFTextField
                name="phoneNumber"
                placeholder="+012 345 6789"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#FFFFFF',
                    borderRadius: 1,
                  },
                }}
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#636366', display: 'block', mb: 0.5 }}>
                Remarks
              </Typography>
              <RHFTextField
                name="remarks"
                multiline
                rows={4}
                placeholder="Personalized requests, preferences, dietary restrictions, etc."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#FFFFFF',
                    borderRadius: 1,
                  },
                }}
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button3D variant="contained" onClick={onClose}>
            Cancel
          </Button3D>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            sx={{ bgcolor: '#1340FF' }}
          >
            Confirm
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

ConfirmDetailsDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  onUpdate: PropTypes.func,
};
