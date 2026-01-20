import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Button,
  Dialog,
  Switch,
  Divider,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

const creditTierSchema = Yup.object().shape({
  name: Yup.string().required('Tier name is required'),
  minFollowers: Yup.number()
    .required('Minimum followers is required')
    .min(0, 'Must be 0 or greater')
    .integer('Must be a whole number')
    .typeError('Must be a number'),
  maxFollowers: Yup.number()
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .min(Yup.ref('minFollowers'), 'Must be greater than min followers')
    .integer('Must be a whole number')
    .typeError('Must be a number'),
  creditsPerVideo: Yup.number()
    .required('Credits per video is required')
    .positive('Must be a positive number')
    .integer('Must be a whole number')
    .typeError('Must be a number'),
  isActive: Yup.boolean(),
});

const defaultValues = {
  name: '',
  minFollowers: '',
  maxFollowers: '',
  creditsPerVideo: '',
  isActive: true,
};

const CreditTierEdit = ({ open, onClose, item, mutate }) => {
  const methods = useForm({
    resolver: yupResolver(creditTierSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const isActive = watch('isActive');

  useEffect(() => {
    if (item) {
      reset({
        name: item.name || '',
        minFollowers: item.minFollowers || '',
        maxFollowers: item.maxFollowers || '',
        creditsPerVideo: item.creditsPerVideo || '',
        isActive: item.isActive ?? true,
      });
    }
  }, [item, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        name: data.name,
        minFollowers: parseInt(data.minFollowers, 10),
        maxFollowers: data.maxFollowers ? parseInt(data.maxFollowers, 10) : null,
        creditsPerVideo: parseInt(data.creditsPerVideo, 10),
        isActive: data.isActive,
      };

      const res = await axiosInstance.put(endpoints.creditTier.update(item.id), payload);

      enqueueSnackbar(res?.data?.message || 'Credit tier updated successfully');
      mutate();
      onClose();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || error?.message || 'Error updating credit tier', {
        variant: 'error',
      });
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#F4F4F4',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: 'Instrument Serif',
          fontSize: '40px !important',
          fontWeight: 400,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          lineHeight: 1.2,
        }}
      >
        Edit Credit Tier
        <IconButton onClick={handleClose} size="small">
          <Iconify icon="mdi:close" width={24} />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: '#EBEBEB', mx: 3 }} />

      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            {/* Tier Name */}
            <Box>
              <Typography sx={{ mb: 0.5, display: 'block', color: '#636366', fontSize: '14px !important', fontWeight: 600 }}>
                Tier Name *
              </Typography>
              <RHFTextField
                name="name"
                placeholder="e.g., Nano A, Micro B"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#fff',
                    minHeight: 48,
                    borderRadius: 1,
                  },
                }}
              />
            </Box>

            {/* Credits Per Video */}
            <Box>
              <Typography sx={{ mb: 0.5, display: 'block', color: '#636366', fontSize: '14px !important', fontWeight: 600 }}>
                Credits Per Video *
              </Typography>
              <RHFTextField
                name="creditsPerVideo"
                placeholder="e.g., 5"
                type="number"
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#fff',
                    minHeight: 48,
                    borderRadius: 1,
                  },
                }}
              />
            </Box>

            {/* Min/Max Followers Row */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box flex={1}>
                <Typography sx={{ mb: 0.5, display: 'block', color: '#636366', fontSize: '14px !important', fontWeight: 600 }}>
                  Minimum Followers *
                </Typography>
                <RHFTextField
                  name="minFollowers"
                  placeholder="e.g., 1000"
                  type="number"
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') {
                      e.preventDefault();
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#fff',
                      minHeight: 48,
                      borderRadius: 1,
                    },
                  }}
                />
              </Box>

              <Box flex={1}>
                <Typography sx={{ mb: 0.5, display: 'block', color: '#636366', fontSize: '14px !important', fontWeight: 600 }}>
                  Maximum Followers
                </Typography>
                <RHFTextField
                  name="maxFollowers"
                  placeholder="Leave empty for unlimited"
                  type="number"
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') {
                      e.preventDefault();
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#fff',
                      minHeight: 48,
                      borderRadius: 1,
                    },
                  }}
                />
              </Box>
            </Stack>

            {/* Status Toggle */}
            <Box
              sx={{
                bgcolor: '#fff',
                borderRadius: 1,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography sx={{ color: '#636366', fontSize: '14px !important', fontWeight: 600 }}>
                Status
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => setValue('isActive', e.target.checked)}
                    color="primary"
                  />
                }
                label={isActive ? 'Active' : 'Inactive'}
                labelPlacement="start"
                sx={{ mr: 0 }}
              />
            </Box>

            <Typography variant="caption" sx={{ color: '#636366' }}>
              * Leave &quot;Maximum Followers&quot; empty for unlimited (e.g., for the highest tier)
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleClose}
            sx={{
              bgcolor: '#FFFFFF',
              border: '1.5px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1.15,
              color: '#1340FF',
              height: 44,
              px: 2.5,
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgba(19, 64, 255, 0.08)',
                border: '1.5px solid #1340FF',
                borderBottom: '3px solid #1340FF',
                color: '#1340FF',
              },
            }}
          >
            Cancel
          </Button>

          <LoadingButton
            type="submit"
            loading={isSubmitting}
            sx={{
              bgcolor: '#203ff5',
              border: '1px solid #203ff5',
              borderBottom: '3px solid #1933cc',
              height: 44,
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              px: 3,
              textTransform: 'none',
              '&:hover': { bgcolor: '#1933cc', opacity: 0.9 },
              '&:disabled': {
                bgcolor: '#e7e7e7',
                color: '#999999',
                border: '1px solid #e7e7e7',
                borderBottom: '3px solid #d1d1d1',
              },
            }}
          >
            Save Changes
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default CreditTierEdit;

CreditTierEdit.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  item: PropTypes.object,
  mutate: PropTypes.func,
};
