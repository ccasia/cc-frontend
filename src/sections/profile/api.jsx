import React from 'react';
import { enqueueSnackbar } from 'notistack';

import { LoadingButton } from '@mui/lab';
import { Box, Card, Stack, Button, Typography } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetTokenExpiry from 'src/hooks/use-get-token-expiry';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

const API = () => {
  const { data, isLoading, mutate } = useGetTokenExpiry();
  const { user } = useAuthContext();

  const xeroInformation = user?.xeroinformation;

  const isDisconnecting = useBoolean();

  const handleActivateXero = async () => {
    try {
      const response = await axiosInstance.get(endpoints.invoice.xero, { withCredentials: true });
      const a = document.createElement('a');
      a.href = response.data.url;
      a.target = '_blank';
      a.click();
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
      <Card sx={{ p: 1, px: 3, borderRadius: 1 / 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify width={40} icon="logos:xero" />
              <Typography variant="subtitle1">Xero</Typography>
            </Stack>
            <Stack>
              {xeroInformation?.map((item, index) => (
                <Stack direction="row" alignItems="center" spacing={1 / 2}>
                  <Iconify icon="mdi:tick-circle" color="success.main" />
                  <Typography variant="caption" color="text.secondary">
                    {item?.tenantName
                      ?.toLowerCase()
                      .split(' ')
                      .map((i) => `${i[0]?.toUpperCase()}${i.slice(1)}`)
                      .join(' ')}
                  </Typography>

                  <Label color={index === 0 ? 'success' : 'secondary'}>
                    {item?.orgData?.baseCurrency || ''}
                  </Label>
                </Stack>
              ))}
            </Stack>
          </Stack>
          {!isLoading &&
            (!data?.token ? (
              <Button
                variant="contained"
                onClick={handleActivateXero}
                size="small"
                sx={{ borderRadius: 1 / 2 }}
              >
                Connect to Xero
              </Button>
            ) : (
              <LoadingButton
                variant="contained"
                size="small"
                color="error"
                onClick={handleDisconnectXero}
                loading={isDisconnecting.value}
                sx={{ borderRadius: 1 / 2 }}
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
