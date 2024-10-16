import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import 'react-quill/dist/quill.snow.css';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import { Box, Button, Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { RHFEditor } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const CampaignPitchTextModal = ({ open, handleClose, campaign }) => {
  const smUp = useResponsive('sm', 'down');
  const modal = useBoolean();
  const dialog = useBoolean();
  const { user } = useAuthContext();

  const pitch = useMemo(
    () => campaign?.pitch?.find((elem) => elem.userId === user?.id),
    [campaign, user]
  );

  const schema = Yup.object().shape({
    content: Yup.string().required('Pitch Script is required'),
  });

  const methods = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues: {
      content: pitch?.content || '',
    },
  });

  const { handleSubmit, reset, watch } = methods;
  const value = watch('content');

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.campaign.pitch.root, {
        campaignId: campaign?.id,
        ...data,
      });
      enqueueSnackbar(res?.data?.message);
      mutate(endpoints.campaign.getMatchedCampaign);
      handleClose();
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  });

  const saveAsDraft = async () => {
    try {
      const res = await axiosInstance.post(endpoints.campaign.pitch.draft, {
        content: value,
        userId: user?.id,
        campaignId: campaign?.id,
      });
      enqueueSnackbar(res?.data?.message);
      mutate(endpoints.campaign.getMatchedCampaign);
      dialog.onFalse();
      handleClose();
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    }
  };

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

  const modalClosePitch = (
    <Dialog open={dialog.value} fullWidth maxWidth="xs" onClose={dialog.onFalse}>
      <DialogTitle>Unsaved Changes</DialogTitle>
      <DialogContent>
        You have unsaved changes. Would you like to save your draft before closing, or discard it?
      </DialogContent>
      <DialogActions>
        <Button
          autoFocus
          variant="outlined"
          size="small"
          onClick={() => {
            dialog.onFalse();
            handleClose();
            reset();
          }}
        >
          Discard Draft
        </Button>
        <Button variant="contained" size="small" onClick={saveAsDraft}>
          Save Draft
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (value && value !== pitch?.content) {
          dialog.onTrue();
        } else {
          handleClose();
        }
      }}
      fullWidth
      maxWidth="md"
      fullScreen={smUp}
    >
      <FormProvider methods={methods}>
        <DialogTitle>Start Pitching Your Text !</DialogTitle>
        <Box p={2}>
          <RHFEditor simple name="content" />
        </Box>
        <DialogActions>
          <Button
            onClick={() => {
              if (value && value !== pitch?.content) {
                dialog.onTrue();
              } else {
                handleClose();
              }
            }}
            size="small"
          >
            Close
          </Button>

          {value && value !== pitch?.content && (
            <Button variant="outlined" size="small" onClick={saveAsDraft}>
              Save as draft
            </Button>
          )}

          <Button
            autoFocus
            variant="contained"
            startIcon={<Iconify icon="ph:paper-plane-tilt-bold" />}
            onClick={modal.onTrue}
            size="small"
            disabled={!value || value === pitch?.content}
          >
            Pitch
          </Button>
        </DialogActions>
        {modalConfirmation}
        {modalClosePitch}
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
