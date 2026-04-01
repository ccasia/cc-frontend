import { toast } from 'sonner';
import { object, string, boolean } from 'yup';
import { AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Alert,
  Paper,
  Stack,
  Switch,
  colors,
  Divider,
  Skeleton,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material';

import axiosInstance from 'src/utils/axios';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import BoxMotion from '../components/BoxMotion';
import useSettingStore from '../hooks/use-setting-store';
// eslint-disable-next-line import/no-unresolved
import useGetWhatsappSetting from '../hooks/use-get-whatsapp-setting';

const whatsappSettingSchema = object({
  isFeatureEnabled: boolean().required(),
  phoneNumberId: string().required(),
  accessToken: string().required(),
  templateName: string().optional(),
  businessAccountId: string().optional(),
});

const Setting = () => {
  const { data, isLoading, mutate } = useGetWhatsappSetting();

  const settingState = useSettingStore((state) => state.data);
  const toggle = useSettingStore((state) => state.toggleFeature);
  const setData = useSettingStore((state) => state.setData);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const sanitizedData = await whatsappSettingSchema.validate(settingState);
      const res = await axiosInstance.post('/api/system-settings/whatsapp', sanitizedData);
      toast.success(res.data.message);
    } catch (error) {
      console.log(error);
      toast.error('Error updating...');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onToggleChange = async () => {
    const newValue = !settingState.isFeatureEnabled;
    toggle();
    try {
      await axiosInstance.post('/api/system-settings/whatsapp', {
        ...settingState,
        isFeatureEnabled: newValue,
      });
      mutate();
    } catch (error) {
      if (typeof error === 'string' && error.includes('Too Many Request')) {
        toast.error(error);
      } else {
        toast.error('Error updating setting...');
      }
      toggle();
    }
  };

  useEffect(() => {
    if (!data) return;

    setData('isFeatureEnabled', data.isFeatureEnabled);
    setData('phoneNumberId', data.phoneNumberId ?? '');
    setData('accessToken', data.accessToken ?? '');
    setData('templateName', data.templateName ?? '');
    setData('businessAccountId', data.businessAccountId);
  }, [data, setData]);

  if (isLoading) {
    return <Skeleton sx={{ borderRadius: 0.6, height: 500 }} />;
  }

  return (
    <BoxMotion
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 1 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      sx={{ mt: 2 }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: 1.5,
          border: `1px solid ${colors.grey[200]}`,
        }}
      >
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                bgcolor: '#25D36615',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Iconify icon="ic:baseline-whatsapp" width={24} sx={{ color: '#25D366' }} />
            </Box>
            <Box>
              <Stack direction="row" alignItems="center" gap={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                  WhatsApp OTP Verification
                </Typography>
                <Label color={settingState.isFeatureEnabled ? 'success' : 'default'} variant="soft">
                  {settingState.isFeatureEnabled ? 'Active' : 'Inactive'}
                </Label>
              </Stack>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Send one-time verification codes to users via WhatsApp
              </Typography>
            </Box>
          </Stack>

          <Switch
            checked={settingState.isFeatureEnabled}
            onClick={async () => {
              // toggle();
              await onToggleChange();
            }}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: '#25D366' },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#25D366' },
            }}
          />
        </Stack>

        {/* Expandable API setup section */}
        <AnimatePresence mode="wait">
          {settingState.isFeatureEnabled && (
            <BoxMotion
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ ease: 'easeInOut', duration: 0.2 }}
            >
              <Divider sx={{ my: 3 }} />

              <Stack gap={2.5}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    WhatsApp API Setup
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Configure your Meta Business credentials to enable message delivery.
                  </Typography>
                </Box>

                <Alert
                  severity="info"
                  icon={<Iconify icon="solar:info-circle-linear" width={20} />}
                  sx={{ borderRadius: 1, fontSize: '0.8rem' }}
                >
                  You can find your credentials in the{' '}
                  <strong>Meta Business Suite &rarr; WhatsApp &rarr; API Setup</strong> section.
                </Alert>

                <Stack gap={1.5}>
                  <TextField
                    fullWidth
                    name="phoneNumberId"
                    label="Phone Number ID"
                    placeholder="e.g. 1234567890"
                    value={settingState.phoneNumberId}
                    onChange={(e) => setData('phoneNumberId', e.target.value)}
                    InputProps={{
                      sx: { borderRadius: 1 },
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify
                            icon="mdi-light:phone"
                            width={18}
                            sx={{ color: 'text.disabled' }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    name="businessAccountId"
                    label="Business Account ID"
                    placeholder="e.g. 991289312333"
                    value={settingState.businessAccountId}
                    onChange={(e) => setData('businessAccountId', e.target.value)}
                    InputProps={{
                      sx: { borderRadius: 1 },
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify
                            icon="solar:buildings-2-linear"
                            width={18}
                            sx={{ color: 'text.disabled' }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    rows={3}
                    name="accessToken"
                    multiline
                    fullWidth
                    label="Access Token"
                    value={settingState.accessToken}
                    onChange={(e) => setData('accessToken', e.target.value)}
                    placeholder="Paste your permanent access token here"
                    InputProps={{
                      sx: { borderRadius: 1 },
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mt: '-46px' }}>
                          <Iconify
                            icon="solar:key-minimalistic-square-2-linear"
                            width={18}
                            sx={{ color: 'text.disabled' }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Template Name"
                    placeholder="e.g. otp_verification"
                    name="templateName"
                    value={settingState.templateName}
                    onChange={(e) => setData('templateName', e.target.value)}
                    InputProps={{
                      sx: { borderRadius: 1 },
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify
                            icon="solar:document-text-linear"
                            width={18}
                            sx={{ color: 'text.disabled' }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>

                <Stack direction="row" justifyContent="flex-end">
                  <LoadingButton
                    variant="outlined"
                    loading={isSubmitting}
                    onClick={handleSave}
                    startIcon={!isSubmitting && <Iconify icon="solar:diskette-linear" width={18} />}
                    sx={{
                      borderRadius: 1,
                      px: 3,
                    }}
                  >
                    Save Settings
                  </LoadingButton>
                </Stack>
              </Stack>
            </BoxMotion>
          )}
        </AnimatePresence>
      </Paper>
    </BoxMotion>
  );
};

export default Setting;
