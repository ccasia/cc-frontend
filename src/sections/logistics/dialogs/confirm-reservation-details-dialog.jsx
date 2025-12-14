import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useMemo } from 'react';

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
  Avatar,
  MenuItem,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField, RHFSelect } from 'src/components/hook-form';
import axiosInstance from 'src/utils/axios';
import { useSnackbar } from 'src/components/snackbar';

export default function ConfirmReservationDetailsDialog({
  open,
  onClose,
  logistic,
  onUpdate,
  campaignId,
}) {
  const { enqueueSnackbar } = useSnackbar();

  const outlets = useMemo(() => {
    const current = logistic?.reservationDetails?.outlet;

    return current ? [current] : ['Plan B TRX', 'Delete this shop'];
  }, [logistic]);

  const details = logistic?.reservationDetails;
  const creator = logistic?.creator;

  const ConfirmationSchema = Yup.object().shape({
    outlet: Yup.string().required('Outlet is required'),
    clientRemarks: Yup.string(),
    picName: Yup.string(),
    picContact: Yup.string(),
    promoCode: Yup.string(),
    budget: Yup.string(),
  });

  const defaultValues = {
    outlet: '',
    clientRemarks: '',
    picName: '',
    picContact: '',
    promoCode: '',
    budget: '',
  };

  const methods = useForm({
    resolver: yupResolver(ConfirmationSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open && details) {
      setValue('outlet', details.outlet || '');
      setValue('clientRemarks', details.clientRemarks || '');
      setValue('picName', details.picName || '');
      setValue('picContact', details.picContact || '');
      setValue('promoCode', details.promoCode || '');
      setValue('budget', details.budget || '');
    }
  }, [open, details, setValue]);

  const onSubmit = async (data) => {
    try {
      // NOTE: Ensure you have a route that handles JUST the details update
      // without requiring a slotId yet.
      await axiosInstance.patch(`/api/logistics/reservation/${logistic.id}/details`, {
        ...data,
        isConfirmed: true,
      });

      onUpdate();
      enqueueSnackbar('Reservation details confirmed successfully!');
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
        sx: { bgcolor: '#F4F4F4', borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              variant="h3"
              fontFamily="instrument serif"
              sx={{ fontWeight: 400, color: '#231F20' }}
            >
              Confirm Details
            </Typography>
            <Typography variant="body2" sx={{ color: '#636366', mt: 0.5 }}>
              Please confirm the creator's selection and add any notes.
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:close-outline" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider sx={{ mb: 2 }} />

      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ overflowY: 'auto', maxHeight: '70vh' }}>
          <Stack spacing={3}>
            <Stack direction="row">
              {/* Participant Info (Read Only) */}
              <Stack direction="column" alignItems="start" sx={{ width: '50%' }}>
                <Typography variant="subtitle2" sx={{ color: '#636366', mb: 0.5 }}>
                  Participant{' '}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Avatar src={creator?.photoURL} sx={{ width: 48, height: 48 }} />
                  <Box>
                    <Typography variant="subtitle1">{creator?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {creator?.phoneNumber}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>

              {/* Creator Remarks (Read Only) */}
              <Box sx={{ width: '50%' }}>
                <Typography variant="subtitle2" sx={{ color: '#636366', mb: 0.5 }}>
                  Creator Remarks
                </Typography>
                <Typography variant="body2">
                  {details?.creatorRemarks || 'No remarks provided.'}
                </Typography>
              </Box>
            </Stack>
            {/* Outlet Selection */}
            <Box>
              <Typography variant="caption" sx={{ color: '#636366', display: 'block', mb: 0.5 }}>
                Confirm Outlet <span style={{ color: '#FF4842' }}>*</span>
              </Typography>
              <RHFSelect
                name="outlet"
                placeholder="Select Outlet"
                sx={{ bgcolor: '#FFFFFF', borderRadius: 1 }}
              >
                {outlets.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </RHFSelect>
            </Box>

            {/* Admin/Client Remarks */}
            <Box>
              <Typography variant="caption" sx={{ color: '#636366', display: 'block', mb: 0.5 }}>
                Add Remarks
              </Typography>
              <RHFTextField
                name="clientRemarks"
                placeholder="Enter any extra remarks..."
                sx={{ bgcolor: '#FFFFFF', borderRadius: 1 }}
              />
            </Box>

            {/* Two Column Section for Optional Fields */}
            <Stack direction="row" spacing={2}>
              <Box sx={{ width: '50%' }}>
                <Typography variant="caption" sx={{ color: '#636366', mb: 0.5, display: 'block' }}>
                  PIC (Optional)
                </Typography>
                <RHFTextField
                  name="picName"
                  placeholder="Person In Charge"
                  sx={{ bgcolor: '#FFFFFF', borderRadius: 1 }}
                />
              </Box>
              <Box sx={{ width: '50%' }}>
                <Typography variant="caption" sx={{ color: '#636366', mb: 0.5, display: 'block' }}>
                  Contact Number (Optional)
                </Typography>
                <RHFTextField
                  name="picContact"
                  placeholder="PIC Contact Number"
                  sx={{ bgcolor: '#FFFFFF', borderRadius: 1 }}
                />
              </Box>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Box sx={{ width: '50%' }}>
                <Typography variant="caption" sx={{ color: '#636366', mb: 0.5, display: 'block' }}>
                  Promo (Optional)
                </Typography>
                <RHFTextField
                  name="promoCode"
                  placeholder="Enter Promo or Menu"
                  sx={{ bgcolor: '#FFFFFF', borderRadius: 1 }}
                />
              </Box>
              <Box sx={{ width: '50%' }}>
                <Typography variant="caption" sx={{ color: '#636366', mb: 0.5, display: 'block' }}>
                  Budget (Optional)
                </Typography>
                <RHFTextField
                  name="budget"
                  placeholder="Enter Spend Limit"
                  sx={{ bgcolor: '#FFFFFF', borderRadius: 1 }}
                />
              </Box>
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
          <LoadingButton
            type="submit"
            variant="contained"
            size="large"
            loading={isSubmitting}
            sx={{
              bgcolor: '#3A3A3C',
              color: '#FFFFFF',
              px: 6,
              py: 1.2,
              borderRadius: 1,
              fontSize: '1rem',
              '&:hover': { bgcolor: '#000000' },
            }}
          >
            Confirm
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

ConfirmReservationDetailsDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  onUpdate: PropTypes.func,
  campaignId: PropTypes.string,
};
