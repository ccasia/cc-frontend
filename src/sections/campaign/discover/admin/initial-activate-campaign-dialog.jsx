import axios from 'axios';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import {
  Box,
  Stack,
  Dialog,
  Button,
  Select,
  MenuItem,
  IconButton,
  Typography,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  OutlinedInput,
  FormHelperText,
  CircularProgress,
} from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export default function InitialActivateCampaignDialog({ open, onClose, campaignId }) {
  console.log('InitialActivateCampaignDialog rendered:', { open, campaignId });
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [adminManagers, setAdminManagers] = useState([]);
  const [adminOptions, setAdminOptions] = useState([]);
  const [campaignDetails, setCampaignDetails] = useState(null);
  
  // Form validation
  const [errors, setErrors] = useState({
    adminManagers: '',
  });

  // Add debugging for admin data structure
  useEffect(() => {
    if (adminOptions.length > 0) {
      console.log('Admin structure example:', adminOptions[0]);
      console.log('Admin IDs being used:', adminOptions.map(admin => ({
        id: admin.id,
        userId: admin.userId,
        userName: admin.user?.name
      })));
    }
  }, [adminOptions]);

  // Add debugging for selected admins
  useEffect(() => {
    if (adminManagers.length > 0) {
      console.log('Selected admin IDs:', adminManagers);
      const selectedAdmins = adminOptions.filter(admin => 
        adminManagers.includes(admin.userId)
      );
      console.log('Selected admin details:', selectedAdmins.map(admin => ({
        id: admin.id,
        userId: admin.userId,
        userName: admin.user?.name
      })));
    }
  }, [adminManagers, adminOptions]);

  // Fetch campaign details and admin users
  useEffect(() => {
    if (open && campaignId) {
      setLoading(true);
      
      // Fetch campaign details
      axios.get(`/api/campaign/getCampaignById/${campaignId}`)
        .then((response) => {
          if (response.data) {
            setCampaignDetails(response.data);
          }
        })
        .catch((error) => {
          console.error('Error fetching campaign details:', error);
          enqueueSnackbar('Failed to fetch campaign details', { variant: 'error' });
        });
      
      // Fetch admin users with CSM role
      axios.get('/api/admin/getAllAdmins')
        .then((response) => {
          if (response.data) {
            // Filter for admins with CSM role - check for various possible role names
            const csmAdmins = response.data.filter(admin => 
              admin.role?.name === 'CSM' || 
              admin.role?.name === 'Customer Success Manager' ||
              admin.role?.name?.toLowerCase().includes('csm') ||
              admin.role?.name?.toLowerCase().includes('customer success')
            );
            
            if (csmAdmins.length === 0) {
              console.warn('No CSM admins found in the system');
            }
            
            // Log the admin data for debugging
            console.log('CSM Admins found:', csmAdmins);
            
            setAdminOptions(csmAdmins);
          }
        })
        .catch((error) => {
          console.error('Error fetching admin users:', error);
          enqueueSnackbar('Failed to fetch admin users', { variant: 'error' });
          // Set empty array to prevent undefined errors
          setAdminOptions([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, campaignId, enqueueSnackbar]);

  const handleAdminManagerChange = (event) => {
    const {
      target: { value },
    } = event;
    setAdminManagers(typeof value === 'string' ? value.split(',') : value);
    setErrors((prev) => ({ ...prev, adminManagers: '' }));
  };

  const validateForm = () => {
    const newErrors = {
      adminManagers: adminOptions.length === 0 
        ? 'No CSM admins available in the system. Please create a CSM role admin first.'
        : adminManagers.length === 0 
          ? 'At least one admin manager is required' 
          : '',
    };
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some((error) => error);
  };

  const handleInitialActivate = async () => {
    if (!validateForm()) {
      enqueueSnackbar('Please fill in all required fields', { variant: 'error' });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Log what we're sending to help debug
      console.log('Sending initial activation data:', {
        adminManager: adminManagers,
      });
      
      const formData = new FormData();
      formData.append('data', JSON.stringify({
        adminManager: adminManagers, // These are the admin user IDs
      }));
      
      const response = await axios.post(`/api/campaign/initialActivateCampaign/${campaignId}`, formData);
      console.log('Initial activation response:', response.data);
      
      // Get assigned admin names for success message
      const assignedAdminNames = adminOptions
        .filter(admin => adminManagers.includes(admin.userId))
        .map(admin => admin.name)
        .join(', ');
      
      const campaignName = campaignDetails?.name ? `"${campaignDetails.name}"` : 'Campaign';
      
      const successMessage = assignedAdminNames 
        ? `✅ ${campaignName} successfully assigned to ${assignedAdminNames}! They will complete the campaign setup and activation.`
        : `✅ ${campaignName} assigned to admin successfully! Admin will complete the setup and activation.`;
      
      enqueueSnackbar(successMessage, { variant: 'success' });
      onClose();
      
      // Refresh the page to show updated campaign status
      window.location.reload();
    } catch (error) {
      console.error('Error in initial campaign activation:', error);
      console.error('Error details:', error.response?.data);
      enqueueSnackbar(error.response?.data?.message || 'Failed to assign campaign to admin', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      // Reset form state
      setAdminManagers([]);
      setErrors({
        adminManagers: '',
      });
      
      onClose();
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={2}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              fontWeight: 550,
              m: 0,
            }}
          >
            Activate Campaign
          </Typography>

          <IconButton
            onClick={handleClose}
            sx={{
              ml: 'auto',
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Iconify icon="hugeicons:cancel-01" width={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2, mb: 4 }}>
          <FormControl fullWidth error={!!errors.adminManagers}>
            <InputLabel id="admin-managers-label">Assign to Admin/CSM *</InputLabel>
            <Select
              labelId="admin-managers-label"
              multiple
              value={adminManagers}
              onChange={handleAdminManagerChange}
              input={<OutlinedInput label="Assign to Admin/CSM *" />}
              renderValue={(selected) => {
                const selectedAdmins = adminOptions.filter(admin => 
                  selected.includes(admin.userId)
                );
                return selectedAdmins.map(admin => admin.user?.name).join(', ');
              }}
            >
              {adminOptions.map((admin) => (
                <MenuItem key={admin.userId} value={admin.userId}>
                  {admin.user?.name} ({admin.role?.name || 'No Role'})
                </MenuItem>
              ))}
            </Select>
            {errors.adminManagers && (
              <FormHelperText>{errors.adminManagers}</FormHelperText>
            )}
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={submitting}
          variant="contained"
          sx={{
            bgcolor: 'white',
            color: '#3A3A3C',
            border: '1px solid #E7E7E7',
            '&:hover': {
              bgcolor: '#F8F8F8',
              border: '1px solid #D1D1D1',
            },
            fontWeight: 600,
            px: 3,
            py: 1,
            boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleInitialActivate}
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
          sx={{
            bgcolor: '#1340FF',
            color: 'white',
            '&:hover': {
              bgcolor: '#0030e0',
            },
            fontWeight: 600,
            px: 3,
            py: 1,
            boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
          }}
        >
          {submitting ? 'Activating...' : 'Activate Campaign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

InitialActivateCampaignDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  campaignId: PropTypes.string,
}; 