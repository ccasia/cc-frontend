import PropTypes from 'prop-types';
import React, { useMemo, useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Button,
  Dialog,
  Divider,
  TextField,
  Typography,
  DialogActions,
  DialogContent,
  InputAdornment,
} from '@mui/material';

import axiosInstance from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

const PackageEditDialog = ({ open, onClose, packageData, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    packagePrice: 0,
    creditsUsed: 0,
    totalCredits: 0,
    expiredAt: '',
  });
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (packageData) {
      const newFormData = {
        packagePrice: packageData.packagePrice || 0,
        creditsUsed: packageData.creditsUsed || 0,
        totalCredits: packageData.totalCredits || 0,
        expiredAt: packageData.expiredAt ? new Date(packageData.expiredAt).toISOString().split('T')[0] : '',
      };
      setFormData(newFormData);
      setInitialData(newFormData);
    }
  }, [packageData]);

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (!initialData) return false;
    return (
      formData.packagePrice !== initialData.packagePrice ||
      formData.creditsUsed !== initialData.creditsUsed ||
      formData.totalCredits !== initialData.totalCredits ||
      formData.expiredAt !== initialData.expiredAt
    );
  }, [formData, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'expiredAt' ? value : Number(value),
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Update subscription data
      await axiosInstance.patch(`/api/subscription/${packageData.id}`, {
        packagePrice: formData.packagePrice,
        creditsUsed: formData.creditsUsed,
        totalCredits: formData.totalCredits,
        expiredAt: formData.expiredAt,
      });

      // Show success message
      enqueueSnackbar('Package updated successfully!', { variant: 'success' });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating package:', error);
      enqueueSnackbar('Failed to update package. Please try again.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ p: 3, pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: '#F0F4FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="eva:edit-2-fill" width={22} sx={{ color: '#1340FF' }} />
          </Box>
          <Box>
            <Typography fontSize={28} fontFamily="Instrument Serif">
              Edit Package
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update package details
            </Typography>
          </Box>
        </Stack>
      </Box>
      <Divider sx={{ mx: 2 }} />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2.5}>
          <TextField
            fullWidth
            type="number"
            name="packagePrice"
            label="Package Value"
            value={formData.packagePrice}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {packageData?.currency === 'MYR' ? 'RM' : '$'}
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            type="number"
            name="creditsUsed"
            label="Credits Utilized"
            value={formData.creditsUsed}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            type="number"
            name="totalCredits"
            label="Total Credits"
            value={formData.totalCredits}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            type="date"
            name="expiredAt"
            label="Validity Period"
            value={formData.expiredAt}
            onChange={handleChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            border: '1px solid #E7E7E7',
            borderRadius: '8px',
            boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
            px: 3,
          }}
        >
          Cancel
        </Button>
        <LoadingButton
          onClick={handleSubmit}
          variant="contained"
          loading={loading}
          disabled={!hasChanges}
          sx={{
            bgcolor: '#1340FF',
            borderRadius: '8px',
            border: '1px solid #1a32c4',
            borderBottom: '3px solid #102387',
            px: 3,
            '&:hover': { bgcolor: '#1a32c4' },
            '&.Mui-disabled': {
              bgcolor: '#E7E7E7',
              color: '#8E8E93',
              border: '1px solid #E7E7E7',
              borderBottom: '3px solid #C4CDD5',
            },
          }}
        >
          Save Changes
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

PackageEditDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  packageData: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default PackageEditDialog; 