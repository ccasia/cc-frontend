import React from 'react';
import * as Yup from 'yup';
import { mutate } from 'swr';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Chip,
  Modal,
  Stack,
  Button,
  Dialog,
  Avatar,
  Divider,
  Typography,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import { interestsList } from '../form/creatorForm';

const MediaKitSetting = ({ open, handleClose, user }) => {
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    // width: 700,
    minWidth: 300,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 2,
    borderRadius: 2,
  };

  const success = useBoolean();

  const schema = Yup.object().shape({
    name: Yup.string(),
    about: Yup.string().max(150, 'You have reach the maximum length'),
    interests: Yup.array().min(3, 'Minimum of 3 interest are required'),
  });

  const defaultValues = {
    name: user?.creator?.mediaKit?.name || user?.name || '',
    about: user?.creator?.mediaKit?.about || user?.about || '',
    interests:
      user?.creator?.mediaKit?.interests?.map((elem) => elem) ||
      user?.creator?.interests?.map((elem) => elem.name) ||
      [],
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
    formState: { isDirty, isSubmitting },
  } = methods;

  const watchedInput = watch('about', '');
  const interests = watch('interests');

  const onSubmit = handleSubmit(async (data) => {
    try {
      await axiosInstance.patch(endpoints.creators.updateMediaKit, {
        ...data,
        creatorId: user?.creator?.id,
      });

      mutate(endpoints.auth.me);

      // enqueueSnackbar(res?.data?.message, {
      //   variant: 'success',
      // });
      handleClose();

      success.onTrue();
    } catch (error) {
      enqueueSnackbar('error', {
        variant: 'error',
      });
    }
  });

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography
            // variant="h4"
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontSize: 35,
            }}
          >
            Edit Profile
          </Typography>

          <Divider
            sx={{
              my: 3,
            }}
          />

          <FormProvider methods={methods} onSubmit={onSubmit}>
            <Stack direction="row" gap={4} flexWrap="wrap">
              <RHFTextField name="name" label="Full Name" />
              <RHFAutocomplete
                name="interests"
                label="Interests"
                multiple
                fullWidth
                freeSolo={false}
                disableCloseOnSelect
                options={interestsList.map((option) => option)}
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
                      size="small"
                      color="info"
                      variant="soft"
                    />
                  ))
                }
              />

              <RHFTextField
                name="about"
                label="Tell us more about you"
                helperText={`${watchedInput.length}/150`}
                multiline
                minRows={3}
              />
            </Stack>
            <Stack direction="row" gap={2} justifyContent="end">
              <Button
                variant="outlined"
                color="inherit"
                sx={{
                  mt: 2,
                }}
                onClick={handleClose}
                size="small"
              >
                Cancel
              </Button>
              <LoadingButton
                variant="contained"
                sx={{
                  mt: 2,
                }}
                type="submit"
                size="small"
                disabled={
                  !isDirty &&
                  interests.every(
                    (item) =>
                      user?.creator?.mediaKit?.interests?.includes(item) ||
                      user?.creator?.interests?.map((elem) => elem.name).includes(item)
                  )
                }
                loading={isSubmitting}
              >
                Save
              </LoadingButton>
            </Stack>
          </FormProvider>
        </Box>
      </Modal>

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
