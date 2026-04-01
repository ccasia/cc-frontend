import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Alert,
  Paper,
  Stack,
  Switch,
  colors,
  Divider,
  TextField,
  Typography,
  InputAdornment,
  Skeleton,
} from '@mui/material';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import BoxMotion from '../components/BoxMotion';
import useGetWhatsappSetting from '../hooks/use-get-whatsapp-setting';
import useSettingStore from '../hooks/use-setting-store';

const Setting = () => {
  const { data, isLoading } = useGetWhatsappSetting();
  const settingState = useSettingStore((state) => state.data);
  const toggle = useSettingStore((state) => state.toggleFeature);

  const [isActive, setIsActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
                <Label color={isActive ? 'success' : 'default'} variant="soft">
                  {isActive ? 'Active' : 'Inactive'}
                </Label>
              </Stack>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Send one-time verification codes to users via WhatsApp
              </Typography>
            </Box>
          </Stack>

          <Switch
            checked={isActive}
            onChange={(_, val) => setIsActive(val)}
            onClick={toggle}
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
                    label="Phone Number ID"
                    placeholder="e.g. 1234567890"
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
                    multiline
                    fullWidth
                    label="Access Token"
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
                    onClick={() => setIsSubmitting(true)}
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
