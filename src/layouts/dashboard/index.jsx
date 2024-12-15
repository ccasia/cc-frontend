import * as yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useCallback } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import { LoadingButton } from '@mui/lab';
import {
  Stack,
  Button,
  Dialog,
  MenuItem,
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
import FormProvider, { RHFSelect, RHFUpload, RHFTextField } from 'src/components/hook-form';

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

  const bugFormDialog = useBoolean();

  const schema = yup.object().shape({
    title: yup.string().required('Bug title is required'),
    description: yup.string().optional(),
    priority: yup.string().optional(),
    stepsToReproduce: yup.string().required('Steps to reproduce is required'),
    attachment: yup.mixed().nullable(),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'low',
      stepsToReproduce: '',
      attachment: null,
    },
  });

  const {
    handleSubmit,
    reset,
    setValue,
    formState: { isDirty, isSubmitting },
  } = methods;

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

  const feedbackButton = (
    <Box
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
            <FormField label="Title">
              <RHFTextField name="title" placeholder="Bug Title" />
            </FormField>

            <FormField label="Description" required={false}>
              <RHFTextField name="description" placeholder="Bug Description" />
            </FormField>

            <FormField label="Priority">
              <RHFSelect name="priority">
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </RHFSelect>
            </FormField>

            <FormField label="Steps to Reproduce">
              <RHFTextField
                name="stepsToReproduce"
                placeholder="Steps to Reproduce"
                multiline
                rows={4}
              />
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
            position: 'relative',
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
          {feedbackForm}
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
        {feedbackForm}
      </Box>
    </Box>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node,
};
