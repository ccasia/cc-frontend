import React from 'react';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import 'react-quill/dist/quill.snow.css';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import { Box, Button, Dialog, DialogTitle, DialogActions } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { RHFEditor } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const CampaignPitchTextModal = ({ open, handleClose, campaign }) => {
  const smUp = useResponsive('sm', 'down');

  const schema = Yup.object().shape({
    content: Yup.string().required('Pitch Script is required'),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      content: '',
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.campaign.pitch.root, {
        campaignId: campaign?.id,
        ...data,
      });
      enqueueSnackbar(res?.data?.message);
      handleClose();
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  });

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" fullScreen={smUp}>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Start Pitching Your Text !</DialogTitle>
        <Box p={2}>
          <RHFEditor simple name="content" />
        </Box>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button
            autoFocus
            variant="contained"
            startIcon={<Iconify icon="ph:paper-plane-tilt-bold" width={20} />}
            type="submit"
          >
            Pitch
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default CampaignPitchTextModal;

CampaignPitchTextModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  campaign: PropTypes.object,
};
