import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import {
  Box,
  Grid,
  Stack,
  Button,
  Dialog,
  Avatar,
  Popover,
  Divider,
  TextField,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { DatePicker } from '@mui/x-date-pickers';

import Iconify from 'src/components/iconify';
import { fetcher } from 'src/utils/axios';
import axiosInstance from 'src/utils/axios';
import { useSnackbar } from 'src/components/snackbar';

export default function AdminEditLogisticDialog({ open, onClose, logistic, campaignId, onUpdate }) {
  const { enqueueSnackbar } = useSnackbar();

  const { data: products } = useSWR(
    open && campaignId ? `/api/logistics/products/campaign/${campaignId}` : null,
    fetcher
  );
  const [quantities, setQuantities] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);

  const Schema = Yup.object().shape({
    trackingLink: Yup.string().nullable(),
    expectedDeliveryDate: Yup.date().nullable(),
    address: Yup.string().required('Address is required'),
    dietaryRestrictions: Yup.string(),
    phoneNumber: Yup.string(),
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm({
    resolver: yupResolver(Schema),
    defaultValues: {
      trackingLink: '',
      expectedDeliveryDate: null,
      address: '',
      dietaryRestrictions: '',
      phoneNumber: '',
    },
  });

  useEffect(() => {
    if (open && logistic) {
      const initialMap = {};
      logistic.deliveryDetails?.items?.forEach((item) => {
        initialMap[item.productId] = item.quantity;
      });
      setQuantities(initialMap);

      setValue('trackingLink', logistic.deliveryDetails?.trackingLink || '');
      setValue(
        'expectedDeliveryDate',
        logistic.deliveryDetails?.expectedDeliveryDate
          ? new Date(logistic.deliveryDetails.expectedDeliveryDate)
          : null
      );
      setValue('address', logistic.deliveryDetails?.address || '');
      setValue('dietaryRestrictions', logistic.deliveryDetails?.dietaryRestrictions || '');
      setValue('phoneNumber', logistic.creator?.phoneNumber || '');
    }
  }, [open, logistic, setValue]);

  const handleOpenDropdown = (event) => setAnchorEl(event.currentTarget);
  const handleCloseDropdown = () => setAnchorEl(null);

  const handleUpdateQuantity = (productId, delta) => {
    setQuantities((prev) => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      const newState = { ...prev, [productId]: newQty };
      if (newQty === 0) delete newState[productId];
      return newState;
    });
  };

  const handleRemoveItem = (productId, e) => {
    e.stopPropagation();
    setQuantities((prev) => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  const onSubmit = async (data) => {
    try {
      const itemsPayload = Object.entries(quantities).map(([productId, quantity]) => ({
        productId,
        quantity,
      }));

      const payload = { ...data, items: itemsPayload };

      await axiosInstance.put(`/api/logistics/admin/${logistic.id}/details`, payload);
      enqueueSnackbar('Details updated successfully');
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to update', { variant: 'error' });
    }
  };

  const selectedProductIds = Object.keys(quantities);
  const hasSelection = selectedProductIds.length > 0;
  const getProduct = (id) => products?.find((p) => p.id === id);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        sx: { borderRadius: 2, bgcolor: '#F4F4F4', p: 3, width: '100%', maxWidth: 580 },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
        <Box>
          <Typography
            variant="h2"
            sx={{ fontWeight: 400, fontFamily: 'instrument serif', color: '#231F20' }}
          >
            Edit Details
          </Typography>
          <Typography variant="body2" sx={{ color: '#636366', mt: 0.5 }}>
            We'll notify the creator and update your logistics dashboard.
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Iconify icon="eva:close-fill" width={32} />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={4}>
          {/* LEFT COLUMN: Details */}
          <Grid item xs={12} md={12}>
            <Typography variant="caption" sx={{ color: '#636366', mb: 1, display: 'block' }}>
              Receipient{' '}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Avatar src={logistic?.creator?.photoURL} sx={{ width: 56, height: 56 }} />
              <Box>
                <Typography variant="body" sx={{ fontWeight: 600, fontSize: '20px' }}>
                  {logistic?.creator?.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#636366' }}>
                  {logistic?.creator?.creator?.instagramUser?.username
                    ? `@${logistic.creator.creator.instagramUser.username}`
                    : '-'}
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={2}>
              {/* Tracking & Date */}
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: '#636366', mb: 1, display: 'block' }}>
                  Tracking Link
                </Typography>
                <Controller
                  name="trackingLink"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="URL..."
                      sx={{
                        borderRadius: 1.5,
                        bgcolor: '#fff',
                        '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: '#636366', mb: 1, display: 'block' }}>
                  Expected Delivery
                </Typography>
                <Controller
                  name="expectedDeliveryDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          sx: {
                            borderRadius: 1.5,
                            bgcolor: '#fff',
                            '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Address */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: '#636366', mb: 1, display: 'block' }}>
                  Delivery Address
                </Typography>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={1}
                      sx={{
                        borderRadius: 1.5,
                        bgcolor: '#fff',
                        '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Remarks */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: '#636366', mb: 1, display: 'block' }}>
                  Dietary Restrictions / Allergies
                </Typography>
                <Controller
                  name="dietaryRestrictions"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      sx={{
                        borderRadius: 1.5,
                        bgcolor: '#fff',
                        '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <LoadingButton
            type="submit"
            variant="contained"
            size="large"
            loading={isSubmitting}
            sx={{
              bgcolor: '#3A3A3C',
              color: '#fff',
              px: 6,
              py: 1.5,
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 700,
              boxShadow: '0px -4px 0px 0px #00000073 inset',
              bgcolor: '#3A3A3C',
              '&:hover': { bgcolor: '#3a3a3cd1', boxShadow: '0px -4px 0px 0px #000000 inset' },
              '&:active': {
                boxShadow: '0px 0px 0px 0px #000000 inset',
                transform: 'translateY(1px)',
              },
            }}
          >
            Update
          </LoadingButton>
        </Box>
      </form>
    </Dialog>
  );
}

AdminEditLogisticDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  logistic: PropTypes.object,
  campaignId: PropTypes.string,
  onUpdate: PropTypes.func,
};
