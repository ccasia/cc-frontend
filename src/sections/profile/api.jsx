import React from 'react';

import { Box, Card, Stack, Button, Typography } from '@mui/material';

import useGetTokenExpiry from 'src/hooks/use-get-token-expiry';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

const API = () => {
  const { data, isLoading } = useGetTokenExpiry();

  const handleActivateXero = async () => {
    try {
      const response = await axiosInstance.get(endpoints.invoice.xero, { withCredentials: true });
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error connecting to Xero:', error);
    }
  };

  return (
    <Box>
      <Card sx={{ p: 1, px: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify width={40} icon="logos:xero" />
            <Typography variant="subtitle1">Xero API</Typography>
          </Stack>
          {!isLoading &&
            (!data?.token ? (
              <Button variant="outlined" onClick={handleActivateXero}>
                Activate
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="success"
                sx={{
                  pointerEvents: 'none',
                }}
              >
                Connected
              </Button>
            ))}
        </Stack>
      </Card>
    </Box>
  );
};

export default API;
