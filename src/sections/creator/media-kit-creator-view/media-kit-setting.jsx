import React from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';

import { Box, Chip, Modal, Stack, Button, Typography } from '@mui/material';

import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import { intersList } from '../form/creatorForm';

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

  const defaultValues = {
    name: user?.name || '',
    about: '',
    interests: user?.interests || [],
  };

  const methods = useForm({
    defaultValues,
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
          {/* {JSON.stringify(user)} */}
        </Typography>
        <FormProvider methods={methods} onSubmit={(data) => alert(JSON.stringify(data))}>
          <Stack direction="row" gap={4} flexWrap="wrap">
            <RHFTextField name="name" label="Full Name" />
            <RHFTextField name="name" label="Preferred pronouns" />
            <RHFAutocomplete
              name="interests"
              multiple
              fullWidth
              freeSolo={false}
              disableCloseOnSelect
              options={intersList.map((option) => option)}
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
            <RHFTextField name="about" label="About" />
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
