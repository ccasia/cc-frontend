import * as yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useCallback, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

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

import Main from './main';
import Header from './header';
import NavMini from './nav-mini';
import NavVertical from './nav-vertical';

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

  const bugFormDialog = useBoolean();
  const kwspFormDialog = useBoolean();

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

  const isMini = settings.themeLayout === 'mini';

  const renderNavMini = <NavMini />;

  const renderNavVertical = <NavVertical openNav={nav.value} onCloseNav={nav.onFalse} />;

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

  const feedbackButton = (
    <Box
      component="div"
      sx={{
        ...(lgUp
          ? {
              position: 'absolute',
              top: 200,
              right: -37,
              transform: 'rotate(-90deg)',
            }
          : {
              position: 'fixed',
              transform: 'rotate(-90deg)',
              top: 200,
              right: -50,
            }),
      }}
    >
      <Button
        variant="contained"
        color="info"
        startIcon={<Iconify icon="solar:bug-line-duotone" width={20} />}
        onClick={bugFormDialog.onTrue}
        sx={{
          border: 1,
          borderBottomRightRadius: 0,
          borderBottomLeftRadius: 0,
          opacity: 0.5,
          transition: 'all linear .2s',
          '&:hover': {
            opacity: 1,
          },
        }}
      >
        Report a bug
      </Button>
    </Box>
  );

  const kwspButton = !hasSubmittedKWSP && (
    <Box
      component="div"
      sx={{
        position: { xs: 'fixed', lg: 'absolute' },
        top: { xs: 370, md: 390 },
        right: { xs: -84, sm: -84, md: -108, lg: -98, xl: -120 },
        transform: 'rotate(-90deg)',
        zIndex: 1200,
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
          padding: { xs: '6px 12px', md: '8px 24px' },
          whiteSpace: 'nowrap',
          fontSize: { xs: '12px', md: '14px' },
          minWidth: { xs: 120, md: 220 },
          '&:hover': {
            backgroundColor: '#1340FF',
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
        },
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" px={1}>
          <DialogTitle>
            <Typography
              sx={{
                fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                fontSize: 30,
                fontWeight: 300,
              }}
            >
              🐞 Bug Report Form
            </Typography>
          </DialogTitle>
          <IconButton onClick={bugFormDialog.onFalse}>
            <Iconify icon="charm:cross" width={20} />
          </IconButton>
        </Stack>
        <DialogContent>
          <Stack spacing={2}>
            <FormField label="Please describe the issue you are facing in detail.">
              <RHFTextField
                name="stepsToReproduce"
                placeholder="Describe the issue."
                multiline
                rows={4}
              />
            </FormField>

            <FormField label="Campaign name">
              <RHFTextField name="campaignName" placeholder="Campaign name" />
            </FormField>

            <FormField label="Attachment" required={false}>
              <RHFUpload
                name="attachment"
                type="file"
                onDrop={onDrop}
                onDelete={() => setValue('attachment', null, { shouldValidate: true })}
              />
            </FormField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <LoadingButton
            variant="contained"
            type="submit"
            loading={isSubmitting}
            sx={{
              background: '#1340FF',
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
              ...(!isDirty && {
                background:
                  'linear-gradient(0deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.60) 100%), #1340FF',
                pointerEvents: 'none',
              }),
            }}
          >
            Submit
          </LoadingButton>
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
          '@media (max-width: 600px)': {
            margin: '16px',
            maxHeight: 'calc(100% - 32px)',
          },
        },
      }}
    >
      <FormProvider methods={kwspMethods} onSubmit={onKwspSubmit}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" px={1}>
          <DialogTitle sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              sx={{
                fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                fontSize: { xs: 24, sm: 30 },
                fontWeight: 300,
              }}
            >
              💰 Opt in for KWSP i-Saraan
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: 12, sm: 14 },
                color: 'text.secondary',
                mt: 1,
              }}
            >
              No registration needed. Just drop your details below!
            </Typography>
          </DialogTitle>
          <IconButton 
            onClick={kwspFormDialog.onFalse}
            sx={{ 
              '@media (max-width: 600px)': {
                mt: 2,
                mr: 0,
                ml: -3
              }
            }}
          >
            <Iconify icon="charm:cross" width={20} />
          </IconButton>
        </Stack>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 2 } }}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            <FormField label="Full Name">
              <RHFTextField 
                name="fullName" 
                placeholder="Enter your full name"
                size="small"
              />
            </FormField>

            <FormField label="NRIC/Passport Number">
              <RHFTextField 
                name="nricPassport" 
                placeholder="Enter your NRIC/Passport No."
                size="small"
              />
            </FormField>

            <Typography
              sx={{
                fontSize: { xs: 12, sm: 14 },
                color: 'text.secondary',
                mt: 2,
              }}
            >
              By submitting, you will receive RM100 in your EPF account from the KWSP i-Saraan initiative. You will be notified via email once the funds have been transferred!
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 2 } }}>
          <LoadingButton
            variant="contained"
            type="submit"
            loading={isKwspSubmitting}
            sx={{
              background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.60) 100%), #1340FF',
              boxShadow: '0px -3px 0px 0px rgba(68, 68, 77, 0.45) inset',
              '&:hover': {
                background: '#1340FF',
              },
              '&.Mui-disabled': {
                background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.60) 100%), #1340FF',
                color: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          >
            Submit Details
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );

  if (isMini) {
    return (
      <Box
        sx={{
          minHeight: 1,
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          pr: lgUp && 2,
        }}
      >
        {lgUp ? renderNavMini : renderNavVertical}

        <Box
          sx={{
            // position: 'relative',
            ...(lgUp && {
              width: 1,
              height: '95vh',
              borderRadius: 2,
              my: 'auto',
              overflow: 'hidden',
              position: 'relative',
              bgcolor: (theme) => theme.palette.background.paper,
            }),
          }}
        >
          <Header onOpenNav={nav.onTrue} isOnline={isOnline} />

          <Main>{children}</Main>
          {feedbackButton}
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
        pr: lgUp && 2,
      }}
    >
      {renderNavVertical}

      <Box
        sx={{
          // ...(lgUp && {
          //   width: lgUp ? 1 : '90vw',
          //   height: '95vh',
          //   borderRadius: 2,
          //   my: 'auto',
          //   overflow: 'hidden',
          //   position: 'relative',
          //   bgcolor: (theme) => theme.palette.background.paper,
          // }),
          width: lgUp ? 1 : '97vw',
          mx: 'auto',
          height: '97vh',
          borderRadius: 2,
          my: 'auto',
          overflow: 'hidden',
          position: 'relative',
          bgcolor: (theme) => theme.palette.background.paper,
        }}
      >
        <Header onOpenNav={nav.onTrue} isOnline={isOnline} />

        <Main>{children}</Main>

        {feedbackButton}
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
