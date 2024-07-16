import * as Yup from 'yup';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import 'react-quill/dist/quill.snow.css';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import { Box, Stack, Button, Dialog, Typography, DialogTitle, DialogActions } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { RHFUpload } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const CampaignPitchVideoModal = ({ open, handleClose, campaign }) => {
  const smUp = useResponsive('sm', 'down');
  const [source, setSource] = useState(undefined);
  const [loading, setLoading] = useState(false);

  const schema = Yup.object().shape({
    // pitchVideo: required('Pitch Script is required'),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      pitchVideo: '',
    },
  });

  const { handleSubmit, setValue } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();
    formData.append('campaignId', campaign?.id);
    formData.append('pitchVideo', data.pitchVideo);

    try {
      setLoading(true);
      // const res = await axiosInstance.patch(endpoints.campaign.pitch.root, {
      //   campaignId: campaign?.id,
      //   ...data,
      // });
      const res = await axiosInstance.patch(endpoints.campaign.pitch.root, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      enqueueSnackbar(res?.data?.message);
      handleClose();
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  });

  const handleDropSingleFile = (e) => {
    setValue('pitchVideo', e[0]);
    const url = URL.createObjectURL(e[0]);
    setSource(url);
  };

  const handleRemove = () => {
    setSource(undefined);
    setValue('pitchVideo', null);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" fullScreen={smUp}>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        {/* <DialogTitle>Coming Soon</DialogTitle> */}
        <DialogTitle>Upload Your Pitching Video !</DialogTitle>
        <Box p={2}>
          <RHFUpload
            name="pitchVideo"
            type="video"
            onDrop={handleDropSingleFile}
            // onDelete={() => setValue('singleUpload', null, { shouldValidate: true })}
          />
        </Box>
        {source && (
          <Stack p={2} gap={2}>
            <Stack direction="row" justifyContent="space-between" px={4} alignItems="center">
              <Typography variant="h5">Preview</Typography>
              <Button
                startIcon={<Iconify icon="pajamas:remove" />}
                color="error"
                onClick={handleRemove}
              >
                Remove
              </Button>
            </Stack>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video autoPlay style={{ width: '90%', borderRadius: 10, margin: 'auto' }} controls>
              <source src={source} />
            </video>
          </Stack>
        )}
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <LoadingButton
            autoFocus
            variant="contained"
            startIcon={<Iconify icon="ph:paper-plane-tilt-bold" width={20} />}
            type="submit"
            loading={loading}
          >
            Pitch
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default CampaignPitchVideoModal;

CampaignPitchVideoModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  campaign: PropTypes.object,
};
