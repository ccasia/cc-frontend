import React from 'react';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import 'react-quill/dist/quill.snow.css';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import { Box, Button, Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { RHFEditor } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const CampaignPitchTextModal = ({ open, handleClose, campaign }) => {
  const smUp = useResponsive('sm', 'down');
  const modal = useBoolean();

  const schema = Yup.object().shape({
    content: Yup.string().required('Pitch Script is required'),
  });

  const methods = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues: {
      content: '',
    },
  });

  const { handleSubmit, reset } = methods;

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

  const modalConfirmation = (
    <Dialog open={modal.value} onClose={modal.onFalse}>
      <DialogTitle>Confirm Submission</DialogTitle>
      <DialogContent>Are you sure you want to submit your pitch?</DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          color="error"
          onClick={() => {
            modal.onFalse();
            handleClose();
            reset();
          }}
          size="small"
        >
          Cancel
        </Button>
        <Button variant="contained" color="primary" size="small" onClick={onSubmit}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" fullScreen={smUp}>
      <FormProvider methods={methods}>
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
            onClick={modal.onTrue}
          >
            Pitch
          </Button>
        </DialogActions>
        {modalConfirmation}
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
