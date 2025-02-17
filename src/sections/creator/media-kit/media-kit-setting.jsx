import * as Yup from 'yup';
import { mutate } from 'swr';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useCallback } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Chip,
  Stack,
  Button,
  Dialog,
  Avatar,
  Divider,
  FormLabel,
  Typography,
  IconButton,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import { fData } from 'src/utils/format-number';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { interestsLists } from 'src/contants/interestLists';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFAutocomplete, RHFUploadAvatar } from 'src/components/hook-form';

// eslint-disable-next-line react/prop-types
const FormField = ({ label, children }) => (
  <Stack spacing={0.5} alignItems="start" width={1}>
    <FormLabel required sx={{ fontWeight: 500, color: '#636366', fontSize: '12px' }}>
      {label}
    </FormLabel>
    {children}
  </Stack>
);

const MediaKitSetting = ({ open, handleClose, user }) => {
  const success = useBoolean();
  const smDown = useResponsive('down', 'sm');

  const schema = Yup.object().shape({
    profilePhoto: Yup.mixed().required(),
    about: Yup.string().max(150, 'You have reach the maximum length'),
    interests: Yup.array().min(3, 'Minimum of 3 interest are required'),
    displayName: Yup.string().required('Display name is required'),
  });

  const defaultValues = {
    displayName: user?.creator?.mediaKit?.displayName || '',
    profilePhoto: user?.photoURL || '',
    about: user?.creator?.mediaKit?.about || user?.about || '',
    interests: user?.creator?.interests?.map((elem) => elem.name) || [],
  };

  const methods = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues,
  });

  const {
    watch,
    handleSubmit,
    setValue,
    reset,
    formState: { isDirty, isSubmitting },
  } = methods;

  const watchedInput = watch('about', '');
  const interests = watch('interests');
  const image = watch('profilePhoto');

  const onSubmit = handleSubmit(async (data) => {
    try {
      const formData = new FormData();
      formData.append('profilePhoto', data.profilePhoto);
      formData.append('data', JSON.stringify({ ...data, creatorId: user?.creator?.id }));

      await axiosInstance.patch(endpoints.creators.updateMediaKit, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      mutate(endpoints.auth.me);
      reset();
      handleClose();
      success.onTrue();
    } catch (error) {
      enqueueSnackbar('error', {
        variant: 'error',
      });
    }
  });

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      if (file) {
        setValue('profilePhoto', newFile, { shouldValidate: true });
      }
    },
    [setValue]
  );

  const onClose = () => {
    reset();
    handleClose();
  };

  const areStringArraysEqual = useMemo(() => {
    const array1 = interests;
    const array2 = user?.creator?.interests?.map((item) => item.name);

    if (array1.length !== array2.length) {
      return false;
    }

    const sortedArray1 = [...array1].sort();
    const sortedArray2 = [...array2].sort();

    return sortedArray1.every((value, index) => value === sortedArray2[index]);
  }, [interests, user]);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <Box
          sx={{
            p: 2,
            px: 3,
            // bgcolor: (theme) => theme.palette.background.paper,
            bgcolor: '#F4F4F4',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography
              sx={{
                fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                fontSize: 35,
              }}
            >
              Edit Profile
            </Typography>

            <IconButton onClick={onClose}>
              <Iconify icon="charm:cross" width={18} />
            </IconButton>
          </Stack>

          <Divider
            sx={{
              my: 2,
            }}
          />

          <FormProvider methods={methods} onSubmit={onSubmit}>
            <Stack direction="row" gap={2} flexWrap="wrap" justifyContent="center">
              <RHFUploadAvatar
                name="profilePhoto"
                maxSize={1e7}
                onDrop={handleDrop}
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 3,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    Allowed *.jpeg, *.jpg, *.png, *.gif
                    <br /> max size of {fData(1e7)}
                  </Typography>
                }
              />

              <FormField label="Display Name">
                <RHFTextField
                  name="displayName"
                  placeholder="Your name"
                  sx={{ bgcolor: 'white', borderRadius: 1 }}
                />
              </FormField>

              <FormField label="Interests">
                <RHFAutocomplete
                  name="interests"
                  placeholder="Interests"
                  multiple
                  fullWidth
                  freeSolo={false}
                  disableCloseOnSelect
                  options={interestsLists.map((option) => option)}
                  getOptionLabel={(option) => option}
                  renderOption={(props, option) => (
                    <li {...props} key={option}>
                      {option}
                    </li>
                  )}
                  renderTags={(selected, getTagProps) =>
                    selected.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option}
                        label={option}
                        variant="soft"
                        sx={{
                          bgcolor: '#FFF',
                          border: 1,
                          py: 2,
                          borderColor: '#EBEBEB',
                          boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                        }}
                      />
                    ))
                  }
                  sx={{ bgcolor: 'white', borderRadius: 1 }}
                />
              </FormField>

              <Stack spacing={1} width={1}>
                <FormField label="Bio">
                  <RHFTextField
                    name="about"
                    placeholder="Tell us more about you"
                    multiline
                    minRows={3}
                    sx={{
                      borderRadius: 1,
                      '&.MuiTextField-root': {
                        bgcolor: 'white',
                      },
                    }}
                  />
                </FormField>
                <Typography
                  gutterBottom
                  variant="caption"
                  color="text.secondary"
                  ml={1}
                >{`${watchedInput.length}/150`}</Typography>
              </Stack>
            </Stack>
            <Stack direction="row" gap={2} justifyContent="end">
              {/* <Button
                variant="outlined"
                color="inherit"
                sx={{
                  mt: 2,
                }}
                onClick={handleClose}
                size="small"
              >
                Cancel
              </Button> */}
              <LoadingButton
                variant="contained"
                fullWidth={smDown}
                sx={{
                  mt: 2,
                  bgcolor: '#1340FF',
                  boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                  ...(!isDirty &&
                    areStringArraysEqual &&
                    // user?.creator?.interests?.every((item) => interests.includes(item.name)) &&
                    // interests.every((item) =>
                    //   user?.creator?.interests?.map((elem) => elem.name).includes(item)
                    // )
                    typeof image === 'string' && {
                      pointerEvents: 'none',
                      background:
                        'linear-gradient(0deg, rgba(255, 255, 255, 0.60) 0%, rgba(255, 255, 255, 0.60) 100%), #1340FF',
                      boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.10) inset',
                    }),
                }}
                type="submit"
                loading={isSubmitting}
              >
                Update
              </LoadingButton>
            </Stack>
          </FormProvider>
        </Box>
      </Dialog>

      {/* Success dialog */}
      <Dialog open={success.value}>
        <Box
          component={m.div}
          sx={{
            bgcolor: '#F4F4F4',
            p: 2,
          }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Stack alignItems="center">
            <Avatar sx={{ width: 80, height: 80, bgcolor: '#8A5AFE', fontSize: 40, mb: 2 }}>
              🥳
            </Avatar>
            <Typography
              variant="h3"
              sx={{
                fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              }}
            >
              Profile updated
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Your profile has been successfully updated!
            </Typography>
            <Button
              fullWidth
              sx={{
                boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                bgcolor: '#3A3A3C',
                color: '#F4F4F4',
                mt: 2,
                '&:hover': {
                  bgcolor: '#535357',
                },
              }}
              onClick={success.onFalse}
            >
              Done
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </>
  );
};

MediaKitSetting.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  user: PropTypes.object,
};

export default MediaKitSetting;
