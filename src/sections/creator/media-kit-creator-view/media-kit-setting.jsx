import React from 'react';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import { Box, Chip, Modal, Stack, Button, Typography } from '@mui/material';

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
    width: 700,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 3,
    borderRadius: 2,
  };

  const schema = Yup.object().shape({
    name: Yup.string(),
    about: Yup.string().max(150, 'You have reach the maximum length'),
    interests: Yup.array().min(3, 'Minimum of 3 interest are required'),
  });

  const defaultValues = {
    name: user?.creator?.mediaKit?.name || user?.name || '',
    about: user?.creator?.mediaKit?.about || user?.about || '',
    interests:
      user?.creator?.mediaKit?.interests.map((elem) => elem) ||
      user?.creator?.interests.map((elem) => elem.name) ||
      [],
  };

  const methods = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues,
  });

  const { watch, handleSubmit } = methods;

  const watchedInput = watch('about', '');

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.creators.updateMediaKit, {
        ...data,
        creatorId: user?.creator?.id,
      });

      enqueueSnackbar(res?.data?.message, {
        variant: 'success',
      });
      handleClose();
    } catch (error) {
      enqueueSnackbar('error', {
        variant: 'error',
      });
    }
  });

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Typography
          variant="h4"
          sx={{
            mb: 3,
          }}
        >
          Settings
        </Typography>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Stack direction="row" gap={4} flexWrap="wrap">
            <RHFTextField name="name" label="Full Name" />
            <RHFAutocomplete
              name="interests"
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
            />
          </Stack>
          <Stack direction="row" gap={2} justifyContent="end">
            <Button
              variant="contained"
              color="success"
              sx={{
                mt: 2,
              }}
              type="submit"
            >
              Save
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              sx={{
                mt: 2,
              }}
              onClick={handleClose}
            >
              Cancel
            </Button>
          </Stack>
        </FormProvider>
      </Box>
    </Modal>
  );
};

MediaKitSetting.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  user: PropTypes.object,
};

export default MediaKitSetting;
