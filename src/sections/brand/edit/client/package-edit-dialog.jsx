import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import {
  Box,
  Button,
  Dialog,
  TextField,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';
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

  useEffect(() => {
    if (packageData) {
      setFormData({
        packagePrice: packageData.packagePrice || 0,
        creditsUsed: packageData.creditsUsed || 0,
        totalCredits: packageData.totalCredits || 0,
        expiredAt: packageData.expiredAt ? new Date(packageData.expiredAt).toISOString().split('T')[0] : '',
      });
    }
  }, [packageData]);

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
      <DialogTitle>Edit Package</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            type="number"
            name="packagePrice"
            label="Package Value"
            value={formData.packagePrice}
            onChange={handleChange}
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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          Save Changes
        </Button>
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