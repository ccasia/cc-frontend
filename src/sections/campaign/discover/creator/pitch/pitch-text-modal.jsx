import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import 'react-quill/dist/quill.snow.css';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Button,
  Dialog,
  IconButton,
  DialogTitle,
  ListItemText,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { RHFEditor } from 'src/components/hook-form';
import AvatarIcon from 'src/components/avatar-icon/avatar-icon';
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

  const draftPitch = useMemo(
    () => campaign?.draftPitch?.find((elem) => elem.userId === user?.id),
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
      content: draftPitch?.content || pitch?.content || '',
    },
  });

  const {
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = methods;

  const value = watch('content');

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.campaign.pitch.root, {
        campaignId: campaign?.id,
        ...data,
        status: 'undecided',
      });
      console.log('Submitting text pitch with status:', 'undecided');
      enqueueSnackbar(res?.data?.message);
      mutate(endpoints.auth.me);
      mutate(endpoints.campaign.getMatchedCampaign);
      modal.onFalse()
      handleClose();
    } catch (error) {
      console.error('Error submitting pitch:', error);
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
    <Dialog
      open={modal.value}
      onClose={modal.onFalse}
      PaperProps={{
        sx: {
          width: '400px',
          maxHeight: '200px',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1.2, fontSize: '1.25rem' }}>Confirm Submission 🫣</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            fontWeight: 500,
            color: 'text.secondary',
            fontSize: '0.95rem',
            pb: 1,
          }}
        >
          Are you sure you want to submit your pitch?
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={() => {
            modal.onFalse();
            handleClose();
            reset();
          }}
          sx={{
            flex: 1,
            mr: 1,
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            padding: { xs: '6px 12px', sm: '8px 16px' },
            height: { xs: '32px', sm: '36px' },
          }}
        >
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          onClick={onSubmit}
          loading={isSubmitting}
          sx={{
            flex: 1,
            ml: 1,
            background: 'linear-gradient(to bottom, #7d54fe, #5131ff)',
            color: 'white',
            border: '1px solid #3300c3',
            '&:hover': {
              background: 'linear-gradient(to bottom, #6a46e5, #4628e6)',
            },
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            padding: { xs: '6px 12px', sm: '8px 16px' },
            height: { xs: '32px', sm: '36px' },
          }}
        >
          Yes, confirm!
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );

  const modalClosePitch = (
    <Dialog open={dialog.value} fullWidth maxWidth="xs" onClose={dialog.onFalse}>
      <DialogTitle sx={{ pb: 1.2 }}>Unsaved Changes! 😱</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            fontWeight: 500,
            color: 'text.secondary',
            fontSize: '0.9rem',
            pb: 1,
          }}
        >
          You have unsaved changes. Would you like to save your draft before closing, or discard it?
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          autoFocus
          variant="outlined"
          onClick={() => {
            dialog.onFalse();
            handleClose();
            reset();
          }}
          sx={{
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            padding: { xs: '6px 12px', sm: '8px 16px' },
            height: { xs: '32px', sm: '36px' },
          }}
        >
          Discard Draft
        </Button>
        <Button
          variant="contained"
          onClick={saveAsDraft}
          sx={{
            background: 'linear-gradient(to bottom, #7d54fe, #5131ff)',
            color: 'white',
            border: '1px solid #3300c3',
            '&:hover': {
              background: 'linear-gradient(to bottom, #6a46e5, #4628e6)',
            },
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            padding: { xs: '6px 12px', sm: '8px 16px' },
            height: { xs: '32px', sm: '36px' },
          }}
        >
          Save Draft
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth={false}
      PaperProps={{ sx: { width: '750px' } }}
      fullScreen={smUp}
    >
      <FormProvider methods={methods}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={2}>
            <AvatarIcon icon="solar:document-bold" />

            <ListItemText
              primary="Letter Pitch"
              secondary="Start pitching your idea!"
              primaryTypographyProps={{
                variant: 'h5',
                fontWeight: 'bold',
              }}
              secondaryTypographyProps={{
                variant: 'body1',
                color: 'text.secondary',
                lineHeight: 1.2,
              }}
            />

            <IconButton
              onClick={() => {
                if (value && value !== pitch?.content) {
                  dialog.onTrue();
                } else {
                  handleClose();
                }
              }}
            >
              <Iconify icon="hugeicons:cancel-01" width={20} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <RHFEditor simple name="content" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'flex-end' }}>
          {value && value !== pitch?.content && (
            <Button
              variant="outlined"
              size="small"
              onClick={saveAsDraft}
              sx={{
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                padding: { xs: '6px 12px', sm: '8px 16px' },
                height: { xs: '32px', sm: '36px' },
              }}
            >
              Save As Draft
            </Button>
          )}

          <Button
            variant="outlined"
            onClick={() => {
              if (value && value !== pitch?.content) {
                dialog.onTrue();
              } else {
                handleClose();
                reset();
              }
            }}
            sx={{
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              padding: { xs: '6px 12px', sm: '8px 16px' },
              height: { xs: '32px', sm: '36px' },
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={modal.onTrue}
            disabled={!value || value === pitch?.content}
            sx={{
              background: 'linear-gradient(to bottom, #7d54fe, #5131ff)',
              color: 'white',
              border: '1px solid #3300c3',
              '&:hover': {
                background: 'linear-gradient(to bottom, #6a46e5, #4628e6)',
              },
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              padding: { xs: '6px 12px', sm: '8px 16px' },
              height: { xs: '32px', sm: '36px' },
            }}
          >
            Send Pitch
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
