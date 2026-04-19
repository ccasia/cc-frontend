import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  Box,
  Stack,
  Dialog,
  Button,
  Container,
  Typography,
  IconButton,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import InvoiceLists from '../invoices-list';

function CampaignPage() {
  const settings = useSettingsContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, xero_reauth_required } = useAuthContext();
  const xeroDialog = useBoolean(xero_reauth_required);

  useEffect(() => {
    const fetchToken = async () => {
      const searchParams = new URLSearchParams(location.search);

      const code = searchParams.get('code'); // Get the authorization code

      if (code) {
        try {
          // Call the backend to exchange the authorization code for the access token
          const { data } = await axiosInstance.get(endpoints.invoice.xeroCallback(code), {
            withCredentials: true,
          });

          navigate('/dashboard');
        } catch (error) {
          console.error('Error fetching access token:', error);
        }
      }
    };

    fetchToken();
  }, [navigate, location]);

  useEffect(() => {
    if (user && user?.role === 'superadmin') {
      if (!user?.admin?.xeroTokenSet) {
        xeroDialog.onTrue();
      }
    }
  }, [user, xeroDialog]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Typography
        variant="h2"
        fontFamily="fontSecondaryFamily"
        fontWeight="normal"
        gutterBottom
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        Invoice
      </Typography>

      <InvoiceLists />
      <XeroDialog open={xeroDialog.value} onClose={xeroDialog.onFalse} />
    </Container>
  );
}

export default CampaignPage;

function XeroDialog({ open, onClose }) {
  const handleActivateXero = async () => {
    try {
      const response = await axiosInstance.get(`${endpoints.invoice.xero}`, {
        withCredentials: true,
      });
      const a = document.createElement('a');
      a.href = response.data.url;
      a.target = '_blank';
      a.click();
    } catch (error) {
      console.error('Error connecting to Xero:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: 0.8, width: 400, overflow: 'hidden' } }}
    >
      <DialogContent sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              bgcolor: '#E8F3FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="logos:xero" width={26} />
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <Iconify icon="material-symbols:close-rounded" width={18} />
          </IconButton>
        </Stack>

        {/* Title & description */}
        <Typography variant="subtitle1" fontWeight={500} gutterBottom>
          Reconnect your Xero account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          Your Xero session has expired. Reconnect to continue updating invoices.
        </Typography>

        {/* Warning banner */}
        <Stack
          direction="row"
          alignItems="center"
          gap={1.25}
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: 'background.neutral',
            borderRadius: 1.5,
            border: '0.5px solid',
            borderColor: 'divider',
          }}
        >
          <Iconify
            icon="eva:alert-circle-outline"
            width={16}
            sx={{ color: 'warning.main', flexShrink: 0 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            Session expired. Your data is safe — reconnecting restores full access.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1 }}>
        <Button onClick={onClose} color="inherit" size="small">
          Later
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleActivateXero}
          startIcon={<Iconify icon="eva:refresh-outline" width={16} />}
          sx={{ borderRadius: 1.5, bgcolor: '#1AB4D7', '&:hover': { bgcolor: '#1599B7' } }}
        >
          Reconnect Xero
        </Button>
      </DialogActions>
    </Dialog>
  );
}

XeroDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
