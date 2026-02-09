import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Container, Typography } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import { useSettingsContext } from 'src/components/settings';
import InvoiceLists from '../invoices-list';

function CampaignPage() {
  const settings = useSettingsContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const dialog = useBoolean();

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
        dialog.onTrue();
      }
    }
  }, [user, dialog]);

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
    </Container>
  );
}

export default CampaignPage;
