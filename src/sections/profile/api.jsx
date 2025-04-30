import React from 'react';
import { enqueueSnackbar } from 'notistack';

import { LoadingButton } from '@mui/lab';
import { Box, Card, Stack, Button, Typography } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetTokenExpiry from 'src/hooks/use-get-token-expiry';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

const API = () => {
  const { data, isLoading, mutate } = useGetTokenExpiry();

  const isDisconnecting = useBoolean();

  const handleActivateXero = async () => {
    try {
      const response = await axiosInstance.get(endpoints.invoice.xero, { withCredentials: true });
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error connecting to Xero:', error);
    }
  };

  const handleDisconnectXero = async () => {
    try {
      isDisconnecting.onTrue();
      const res = await axiosInstance.patch(endpoints.admin.disconnectXero);
      enqueueSnackbar(res?.data?.message);
      mutate();
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      isDisconnecting.onFalse();
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
                Connect to Xero
              </Button>
            ) : (
              <LoadingButton
                variant="outlined"
                color="error"
                onClick={handleDisconnectXero}
                loading={isDisconnecting.value}
              >
                Disconnect
              </LoadingButton>
            ))}
        </Stack>
      </Card>
    </Box>
  );
};

export default API;
