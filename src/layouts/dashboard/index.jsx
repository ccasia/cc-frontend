import * as yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import { LoadingButton } from '@mui/lab';
import {
  Stack,
  Button,
  Dialog,
  FormLabel,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import FormProvider, { RHFUpload, RHFTextField } from 'src/components/hook-form';
import CampaignTabsNavigation from 'src/components/campaign/CampaignTabsNavigation';

import Main from './main';
import Header from './header';
import NavVertical from './nav-vertical';
import { NAV } from '../config-layout';

// ----------------------------------------------------------------------

// eslint-disable-next-line react/prop-types
const FormField = ({ label, children, ...others }) => (
  <Stack spacing={0.5} alignItems="start" width={1}>
    <FormLabel required sx={{ fontWeight: 500, color: '#636366', fontSize: '12px' }} {...others}>
      {label}
    </FormLabel>
    {children}
  </Stack>
);

export default function DashboardLayout({ children }) {
  const settings = useSettingsContext();

  const { user } = useAuthContext();
  const { socket, isOnline } = useSocketContext();
  const [hasSubmittedKWSP, setHasSubmittedKWSP] = useState(false);
  const [hasCampaignTabs, setHasCampaignTabs] = useState(false);

  const bugFormDialog = useBoolean();
  const kwspFormDialog = useBoolean();

  // Check for campaign tabs
  useEffect(() => {
    const checkCampaignTabs = () => {
      const tabs = window.campaignTabs || [];
      setHasCampaignTabs(tabs.length > 0);
    };

    // Initial check
    checkCampaignTabs();

    // Set up an interval to check for campaign tabs updates
    const intervalId = setInterval(checkCampaignTabs, 500);

    return () => clearInterval(intervalId);
  }, []);

  // Auto-collapse main navigation when campaign tabs exist (but allow manual override)
  // useEffect(() => {
  //   if (hasCampaignTabs && settings.themeLayout !== 'mini') {
  //     // Only auto-collapse if not already collapsed and user hasn't manually expanded
  //     // We'll let the campaign tabs navigation handle its own collapse state
  //     settings.onUpdate('themeLayout', 'mini');
  //   }
  // }, [hasCampaignTabs, settings]);

  const schema = yup.object().shape({
    stepsToReproduce: yup.string().required('Steps to reproduce is required'),
    attachment: yup.mixed().required('Please provide attachment of the bugs'),
    campaignName: yup.string(),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      stepsToReproduce: '',
      attachment: null,
      campaignName: '',
    },
  });

  const {
    handleSubmit,
    reset,
    setValue,
    formState: { isDirty, isSubmitting },
  } = methods;

  const kwspSchema = yup.object().shape({
    fullName: yup.string().required('Full name is required'),
    nricPassport: yup.string().required('NRIC/Passport number is required'),
  });

  const kwspMethods = useForm({
    resolver: yupResolver(kwspSchema),
    defaultValues: {
      fullName: '',
      nricPassport: '',
    },
  });

  const {
    handleSubmit: handleKwspSubmit,
    reset: resetKwsp,
    formState: { isSubmitting: isKwspSubmitting },
  } = kwspMethods;

  // Check KWSP submission status
  useEffect(() => {
    if (user?.hasSubmittedKWSP) {
      setHasSubmittedKWSP(true);
    }
  }, [user]);

  // Listen for bug report navigation
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#bug-report') {
        bugFormDialog.onTrue();
        // Clear the hash to prevent browser back button issues
        window.history.replaceState(null, null, window.location.pathname + window.location.search);
      }
    };

    // Check on mount in case we're already on the hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [bugFormDialog]);

  // eslint-disable-next-line react-hooks/exhaustive-deps

  useEffect(() => {
    socket?.on('notification', (data) =>
      mutate(endpoints.notification.root, (currentData) => ({
        ...currentData,
        data,
      }))
    );

    return () => {
      socket?.off('notification');
    };
  }, [user, socket]);

  const lgUp = useResponsive('up', 'lg');

  const nav = useBoolean();

  const isCollapsed = settings.themeLayout === 'mini';

  const renderNavVertical = (
    <NavVertical openNav={nav.value} onCloseNav={nav.onFalse} />
  );

  const renderCampaignTabsNavigation = (
    <CampaignTabsNavigation filter="active" />
  );

  const onDrop = useCallback(
    (e) => {
      const preview = URL.createObjectURL(e[0]);
      setValue('attachment', { file: e[0], preview });
    },
    [setValue]
  );

  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();

    if (data.attachment) {
      formData.append('attachment', data.attachment.file);

      // remove attachment
      delete data.attachment;
    }

    formData.append('data', JSON.stringify(data));

    try {
      const res = await axiosInstance.post(endpoints.bug.create, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      reset();
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  });

  const onKwspSubmit = handleKwspSubmit(async (data) => {
    try {
      const response = await axiosInstance.post('/api/kwsp/submit', {
        fullName: data.fullName,
        nricPassport: data.nricPassport,
      });

      // Update local state immediately
      setHasSubmittedKWSP(true);

      resetKwsp();
      enqueueSnackbar('Your details have been submitted successfully!', { variant: 'success' });
      kwspFormDialog.onFalse();
    } catch (error) {
      console.error('Error submitting form:', error);
      enqueueSnackbar('Failed to submit form. Please try again.', {
        variant: 'error',
      });
    }
  });

  // const feedbackButton = (
  //   <Box
  //     component="div"
  //     sx={{
  //       position: 'fixed',
  //       transform: 'rotate(-90deg)',
  //       transformOrigin: 'bottom right',
  //       top: { xs: 140, sm: 150, md: 160 },
  //       right: { xs: 8, sm: 12, md: 15 },
  //       zIndex: 9999,
  //     }}
  //   >
  //     <Button
  //       variant="contained"
  //       color="info"
  //       startIcon={<Iconify icon="solar:bug-line-duotone" width={20} />}
  //       onClick={bugFormDialog.onTrue}
  //       sx={{
  //         border: 1,
  //         borderBottomRightRadius: 0,
  //         borderBottomLeftRadius: 0,
  //         opacity: 0.5,
  //         transition: 'all linear .2s',
  //         py: { xs: 0.5, sm: 0.75, md: 1 },
  //         px: { xs: 1, sm: 1.5, md: 2 },
  //         fontSize: { xs: '11px', sm: '12px', md: '14px' },
  //         '&:hover': {
  //           opacity: 1,
  //         },
  //       }}
  //     >
  //       Report a bug
  //     </Button>
  //   </Box>
  // );

  const kwspButton = !hasSubmittedKWSP && (
    <Box
      component="div"
      sx={{
        position: 'absolute',
        transform: 'rotate(-90deg)',
        transformOrigin: 'bottom right',
        top: { xs: 200, sm: 180, md: 120 },
        right: { xs: 4, sm: 4, md: 2 },
        // zIndex: 9999,
      }}
    >
      <Button
        variant="contained"
        onClick={kwspFormDialog.onTrue}
        sx={{
          border: 1,
          borderBottomRightRadius: 0,
          borderBottomLeftRadius: 0,
          backgroundColor: '#1340FF',
          whiteSpace: 'nowrap',
          fontSize: { xs: '10px', sm: '11px', md: '14px' },
          py: { xs: 0.5, sm: 0.75, md: 1 },
          px: { xs: 1, sm: 1.5, md: 2 },
          minWidth: { xs: 100, sm: 160, md: 220 },
          '&:hover': {
            backgroundColor: '#4D73FF',
          },
        }}
      >
        Earn RM100 with KWSP i-Saraan!
      </Button>
    </Box>
  );

  const feedbackForm = (
    <Dialog
      open={bugFormDialog.value}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          scrollbarWidth: 'none',
          borderRadius: 2,
          '@media (max-width: 600px)': {
            margin: '16px',
            maxHeight: 'calc(100% - 32px)',
          },
        },
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        {/* Header with Close Button */}
        <Box
          sx={{
            position: 'relative',
            p: { xs: 2, sm: 3 },
            pb: { xs: 1, sm: 2 },
          }}
        >
          {/* Close Button - Top Right */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 16, sm: 18 },
              right: { xs: 16, sm: 18 },
              zIndex: 1,
            }}
          >
            <Button
              onClick={bugFormDialog.onFalse}
              sx={{
                minWidth: { xs: '32px', md: '36px' },
                width: { xs: '32px', md: '36px' },
                height: { xs: '32px', md: '36px' },
                p: 0,
                color: '#636366',
                border: 'none',
                borderRadius: '6px',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  right: '2px',
                  bottom: '2px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: '#F5F5F5',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  color: '#333',
                },
              }}
            >
              <Iconify icon="eva:close-fill" width={{ xs: 18, md: 20 }} />
            </Button>
          </Box>

          {/* Title and Subtitle */}
          <Box sx={{ pr: { xs: 5, sm: 6 } }}>
            <Typography
              sx={{
                fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                fontSize: { xs: 24, sm: 30 },
                fontWeight: 300,
                color: '#000',
                mb: 1,
              }}
            >
              🐞 Bug Report Form
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: 12, sm: 14 },
                color: '#636366',
                lineHeight: 1.4,
              }}
            >
              Help us improve by reporting any issues you encounter
            </Typography>
          </Box>
        </Box>

        {/* Form Content */}
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 0 }}>
          <Stack spacing={{ xs: 2.5, sm: 3 }}>
            <FormField label="Please describe the issue you are facing in detail.">
              <RHFTextField
                name="stepsToReproduce"
                placeholder="Describe the issue, steps to reproduce, and expected behavior..."
                multiline
                rows={4}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                    '& fieldset': {
                      borderColor: '#E7E7E7',
                    },
                    '&:hover fieldset': {
                      borderColor: '#D1D5DB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1340FF',
                      borderWidth: '1px',
                    },
                  },
                }}
              />
            </FormField>

            <FormField label="Campaign name (optional)">
              <RHFTextField 
                name="campaignName" 
                placeholder="Enter campaign name if issue is related to a specific campaign"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                    '& fieldset': {
                      borderColor: '#E7E7E7',
                    },
                    '&:hover fieldset': {
                      borderColor: '#D1D5DB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1340FF',
                      borderWidth: '1px',
                    },
                  },
                }}
              />
            </FormField>

            <FormField label="Attachment (optional)">
              <RHFUpload
                name="attachment"
                type="file"
                onDrop={onDrop}
                onDelete={() => setValue('attachment', null, { shouldValidate: true })}
                sx={{
                  '& .MuiBox-root': {
                    borderRadius: '6px',
                    borderColor: '#E7E7E7',
                  },
                }}
              />
            </FormField>

            <Box
              sx={{
                p: { xs: 2, sm: 2.5 },
                bgcolor: '#F8F9FA',
                borderRadius: '6px',
                border: '1px solid #E7E7E7',
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: 12, sm: 13 },
                  color: '#636366',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    fontSize: { xs: 14, sm: 16 },
                    lineHeight: 1,
                    mt: 0.2,
                  }}
                >
                  💡
                </Box>
                <Box>
                  <strong>Tip:</strong> Include screenshots or screen recordings to help us understand the issue better
                </Box>
              </Typography>
            </Box>
          </Stack>
        </DialogContent>

        {/* Action Buttons */}
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, pt: { xs: 2.5, sm: 3 } }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end" width="100%">
            <Button
              variant="outlined"
              onClick={bugFormDialog.onFalse}
              sx={{
                minWidth: 100,
                height: 40,
                borderColor: '#E7E7E7',
                color: '#636366',
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '14px',
                textTransform: 'none',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  right: '2px',
                  bottom: '2px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover': {
                  borderColor: '#D1D5DB',
                  bgcolor: 'transparent',
                },
                '&:hover::before': {
                  backgroundColor: '#F9FAFB',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={!isDirty || isSubmitting}
              sx={{
                minWidth: 120,
                height: 40,
                background: isDirty && !isSubmitting ? '#1340FF' : '#E7E7E7',
                color: isDirty && !isSubmitting ? '#FFFFFF' : '#9CA3AF',
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '14px',
                textTransform: 'none',
                boxShadow: 'none',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  right: '2px',
                  bottom: '2px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover': {
                  background: isDirty && !isSubmitting ? '#0F35E6' : '#E7E7E7',
                  boxShadow: 'none',
                },
                '&:hover::before': {
                  backgroundColor: isDirty && !isSubmitting ? 'rgba(255,255,255,0.1)' : 'transparent',
                },
                '&.Mui-disabled': {
                  background: '#E7E7E7',
                  color: '#9CA3AF',
                },
                ...(isSubmitting && {
                  '& .MuiCircularProgress-root': {
                    color: '#9CA3AF',
                  },
                }),
              }}
            >
              {isSubmitting ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      border: '2px solid #9CA3AF',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                  <span>Submitting...</span>
                </Stack>
              ) : (
                'Submit Report'
              )}
            </Button>
          </Stack>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );

  const kwspForm = (
    <Dialog
      open={kwspFormDialog.value}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          scrollbarWidth: 'none',
          borderRadius: 2,
          '@media (max-width: 600px)': {
            margin: '16px',
            maxHeight: 'calc(100% - 32px)',
          },
        },
      }}
    >
      <FormProvider methods={kwspMethods} onSubmit={onKwspSubmit}>
        {/* Header with Close Button */}
        <Box
          sx={{
            position: 'relative',
            p: { xs: 2, sm: 3 },
            pb: { xs: 1, sm: 2 },
          }}
        >
          {/* Close Button - Top Right */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 16, sm: 18 },
              right: { xs: 16, sm: 18 },
              zIndex: 1,
            }}
          >
            <Button
              onClick={kwspFormDialog.onFalse}
              sx={{
                minWidth: { xs: '32px', md: '36px' },
                width: { xs: '32px', md: '36px' },
                height: { xs: '32px', md: '36px' },
                p: 0,
                color: '#636366',
                border: 'none',
                borderRadius: '6px',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  right: '2px',
                  bottom: '2px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: '#F5F5F5',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  color: '#333',
                },
              }}
            >
              <Iconify icon="eva:close-fill" width={{ xs: 18, md: 20 }} />
            </Button>
          </Box>

          {/* Title and Subtitle */}
          <Box sx={{ pr: { xs: 5, sm: 6 } }}>
            <Typography
              sx={{
                fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                fontSize: { xs: 24, sm: 30 },
                fontWeight: 300,
                color: '#000',
                mb: 1,
              }}
            >
              💰 Opt in for KWSP i-Saraan
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: 12, sm: 14 },
                color: '#636366',
                lineHeight: 1.4,
              }}
            >
              No registration needed. Just drop your details below!
            </Typography>
          </Box>
        </Box>

        {/* Form Content */}
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 0 }}>
          <Stack spacing={{ xs: 2.5, sm: 3 }}>
            <FormField label="Full Name">
              <RHFTextField 
                name="fullName" 
                placeholder="Enter your full name"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                    '& fieldset': {
                      borderColor: '#E7E7E7',
                    },
                    '&:hover fieldset': {
                      borderColor: '#D1D5DB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1340FF',
                      borderWidth: '1px',
                    },
                  },
                }}
              />
            </FormField>

            <FormField label="NRIC/Passport Number">
              <RHFTextField 
                name="nricPassport" 
                placeholder="Enter your NRIC/Passport No."
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                    '& fieldset': {
                      borderColor: '#E7E7E7',
                    },
                    '&:hover fieldset': {
                      borderColor: '#D1D5DB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1340FF',
                      borderWidth: '1px',
                    },
                  },
                }}
              />
            </FormField>

            <Box
              sx={{
                p: { xs: 2, sm: 2.5 },
                bgcolor: '#F0F8FF',
                borderRadius: '6px',
                border: '1px solid #E7E7E7',
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: 12, sm: 13 },
                  color: '#636366',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    fontSize: { xs: 14, sm: 16 },
                    lineHeight: 1,
                    mt: 0.2,
                  }}
                >
                  💰
                </Box>
                <Box>
                  <strong>Benefit:</strong> By submitting, you will receive RM100 in your EPF account from the KWSP i-Saraan initiative. You will be notified via email once the funds have been transferred!
                </Box>
              </Typography>
            </Box>
          </Stack>
        </DialogContent>

        {/* Action Buttons */}
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, pt: { xs: 2.5, sm: 3 } }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end" width="100%">
            <Button
              variant="outlined"
              onClick={kwspFormDialog.onFalse}
              sx={{
                minWidth: 100,
                height: 40,
                borderColor: '#E7E7E7',
                color: '#636366',
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '14px',
                textTransform: 'none',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  right: '2px',
                  bottom: '2px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover': {
                  borderColor: '#D1D5DB',
                  bgcolor: 'transparent',
                },
                '&:hover::before': {
                  backgroundColor: '#F9FAFB',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={isKwspSubmitting}
              sx={{
                minWidth: 120,
                height: 40,
                background: !isKwspSubmitting ? '#1340FF' : '#E7E7E7',
                color: !isKwspSubmitting ? '#FFFFFF' : '#9CA3AF',
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '14px',
                textTransform: 'none',
                boxShadow: 'none',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  right: '2px',
                  bottom: '2px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover': {
                  background: !isKwspSubmitting ? '#0F35E6' : '#E7E7E7',
                  boxShadow: 'none',
                },
                '&:hover::before': {
                  backgroundColor: !isKwspSubmitting ? 'rgba(255,255,255,0.1)' : 'transparent',
                },
                '&.Mui-disabled': {
                  background: '#E7E7E7',
                  color: '#9CA3AF',
                },
                ...(isKwspSubmitting && {
                  '& .MuiCircularProgress-root': {
                    color: '#9CA3AF',
                  },
                }),
              }}
            >
              {isKwspSubmitting ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      border: '2px solid #9CA3AF',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                  <span>Submitting...</span>
                </Stack>
              ) : (
                'Submit Details'
              )}
            </Button>
          </Stack>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );

  if (isCollapsed) {
    return (
      <Box
        sx={{
          minHeight: 1,
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          backgroundColor: '#F4F4F4',
          pr: lgUp && 1.5,
        }}
      >
        {/* Always show collapsed main nav */}
        {renderNavVertical}
        
        {/* Show campaign tabs navigation beside the collapsed nav if tabs exist */}
        {hasCampaignTabs && renderCampaignTabsNavigation}

        <Box
          sx={{
            width: 1,
            height: '97vh',
            borderRadius: 2,
            my: 1.5,
            mr: 1.5,
            overflow: 'hidden',
            position: 'relative',
            bgcolor: (theme) => theme.palette.background.paper,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: (theme) => theme.shadows[1],
            transition: (theme) => theme.transitions.create(['margin-left'], {
              duration: theme.transitions.duration.standard,
              easing: theme.transitions.easing.easeInOut,
            }),
          }}
        >
          <Header onOpenNav={nav.onTrue} isOnline={isOnline} />

          <Main>{children}</Main>
          {/* {feedbackButton} */}
          {kwspButton}
          {feedbackForm}
          {kwspForm}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: 1,
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        backgroundColor: '#F4F4F4',
        pr: lgUp && 1.5,
      }}
    >
      {/* Show main nav (will auto-collapse when campaign tabs exist) */}
      {renderNavVertical}
      
      {/* Show campaign tabs navigation beside the main nav if tabs exist */}
      {hasCampaignTabs && renderCampaignTabsNavigation}

      <Box
        sx={{
          width: 1,
          height: '97vh',
          borderRadius: 2,
          my: 1.5,
          mr: 1.5,
          overflow: 'hidden',
          position: 'relative',
          bgcolor: (theme) => theme.palette.background.paper,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          boxShadow: (theme) => theme.shadows[1],
          transition: (theme) => theme.transitions.create(['margin-left'], {
            duration: theme.transitions.duration.standard,
            easing: theme.transitions.easing.easeInOut,
          }),
        }}
      >
        <Header onOpenNav={nav.onTrue} isOnline={isOnline} />

        <Main>{children}</Main>

      {/* {feedbackButton}   */}
        {kwspButton}
        {feedbackForm}
        {kwspForm}
      </Box>
    </Box>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node,
};
