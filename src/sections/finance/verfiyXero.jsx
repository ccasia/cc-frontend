import toast from 'react-hot-toast';
import React, { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Box, CircularProgress } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

function VerfiyXero() {
  const navigate = useNavigate();

  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);

  const code = searchParams.get('code');

  const session = searchParams.get('session_state');

  const xeroCode = useCallback(async () => {
    try {
      // Call the backend to exchange the authorization code for the access token
      await axiosInstance.get(endpoints.invoice.xeroCallback, {
        withCredentials: true,
        params: {
          code,
          session,
        },
      });

      // Navigate to another page or update the state after getting the token
      // navigate('/dashboard/user/profile'); // Example navigation after success
    } catch (error) {
      toast.error('Failed to connect to Xero');
      console.error('DASDSA', error);
    } finally {
      navigate('/dashboard/user/profile');
    }
  }, [code, session, navigate]);

  useEffect(() => {
    xeroCode();
  }, [xeroCode]);

  // Change the UI
  return (
    <Box
      sx={{
        position: 'relative',
        top: 200,
        textAlign: 'center',
      }}
    >
      <CircularProgress
        thickness={7}
        size={25}
        sx={{
          color: (theme) => theme.palette.common.black,
          strokeLinecap: 'round',
        }}
      />
    </Box>
  );
}

export default VerfiyXero;
