import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import 'react-quill/dist/quill.snow.css';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Stack,
  Button,
  Dialog,
  Divider,
  Typography,
  DialogTitle,
  ListItemText,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { RHFEditor } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const CampaignPitchTextModal = ({ open, handleClose, campaign, onBack }) => {
  const smUp = useResponsive('sm', 'down');
  const modal = useBoolean();
  const dialog = useBoolean();
  const { user } = useAuthContext();
  const [submitStatus, setSubmitStatus] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const router = useRouter();

  const pitch = useMemo(
    () => campaign?.pitch?.find((elem) => elem.userId === user?.id),
    [campaign, user]
  );

  const draftPitch = useMemo(
    () => campaign?.draftPitch?.find((elem) => elem.userId === user?.id),
    [campaign, user]
  );

  const schema = Yup.object().shape({
    content: Yup.string().required('Pitch is required.'),
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

  const LoadingDots = () => {
    const [dots, setDots] = useState('');

    useEffect(() => {
      const interval = setInterval(() => {
        setDots((prev) => {
          if (prev === '...') return '';
          return `${prev}.`;
        });
      }, 500);

      return () => clearInterval(interval);
    }, []);

    return <span>{dots}</span>;
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      modal.onFalse();
      setShowSubmitDialog(true);
      setSubmitStatus('submitting');

      const res = await axiosInstance.patch(endpoints.campaign.pitch.root, {
        campaignId: campaign?.id,
        ...data,
        status: 'undecided',
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log('Submitting text pitch with status:', 'undecided');
      enqueueSnackbar(res?.data?.message);
      mutate(endpoints.auth.me);
      mutate(endpoints.campaign.getMatchedCampaign);
      setSubmitStatus('success');
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.error('Error submitting pitch:', error);
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
      setSubmitStatus('error');
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
          width: { xs: '100%', sm: '400px' },
          minHeight: { xs: '300px', sm: '350px' },
          maxWidth: '400px',
          maxHeight: { xs: '500px', sm: '600px' },
          m: { xs: 2, sm: 'auto' },
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 3, sm: 4 },
        }}
      >
        <Stack alignItems="center" spacing={3} width="100%">
          <Box
            sx={{
              width: { xs: 100, sm: 120 },
              height: { xs: 100, sm: 120 },
              borderRadius: '50%',
              backgroundColor: '#D8FF01',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: { xs: '3rem', sm: '3rem' },
              mb: -1,
            }}
          >
            🫣
          </Box>
          <Box
            sx={{
              fontFamily: 'Instrument Serif',
              fontSize: { xs: '2.2rem', sm: '2.2rem' },
              textAlign: 'center',
              fontWeight: 400,
              px: 2,
              mb: -3,
            }}
          >
            Confirm submission
          </Box>
          <Box
            sx={{
              fontWeight: 400,
              color: 'text.secondary',
              fontSize: { xs: '1.05rem', sm: '1.05rem' },
              textAlign: 'center',
              px: -1,
              mb: -2,
            }}
          >
            Are you sure you want to submit your pitch?
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2} width="100%">
          <Button
            fullWidth
            variant="contained"
            onClick={onSubmit}
            sx={{
              mb: -1,
              backgroundColor: '#3a3a3c',
              color: 'white',
              borderBottom: '3px solid',
              borderBottomColor: isSubmitting ? 'rgba(0, 0, 0, 0.12)' : '#202021',
              '&:hover': {
                backgroundColor: '#202021',
              },
              fontSize: '1rem',
              padding: '12px 24px',
              height: '48px',
            }}
          >
            Yes sir!
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              modal.onFalse();
              handleClose();
              reset();
            }}
            sx={{
              fontSize: '1rem',
              padding: '12px 24px',
              height: '48px',
              border: '1px solid #e7e7e7',
              borderBottom: '4px solid',
              borderBottomColor: '#e7e7e7',
              backgroundColor: '#FFFFFF',
            }}
          >
            Cancel
          </Button>
        </Stack>
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

  const submitDialog = (
    <Dialog open={showSubmitDialog} maxWidth="xs" fullWidth>
      <DialogContent>
        <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
          {submitStatus === 'submitting' && (
            <>
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: '#f4b84a',
                  fontSize: '50px',
                  mb: -2,
                }}
              >
                🛫
              </Box>
              <Typography
                variant="h6"
                sx={{
                  display: 'flex',
                  fontFamily: 'Instrument Serif, serif',
                  fontSize: { xs: '1.5rem', sm: '2.5rem' },
                  fontWeight: 550,
                }}
              >
                Sending Pitch
                <LoadingDots />
              </Typography>
            </>
          )}
          {submitStatus === 'success' && (
            <>
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: '#835cf5',
                  fontSize: '50px',
                  mb: -2,
                }}
              >
                🚀
              </Box>
              <Stack spacing={1} alignItems="center">
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'Instrument Serif, serif',
                    fontSize: { xs: '2.25rem', sm: '3rem' },
                    fontWeight: 500,
                    textAlign: 'center',
                  }}
                >
                  Your pitch has took off!
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#636366',
                    mt: -1,
                    mb: -4,
                    textAlign: 'center',
                  }}
                >
                  You can find your pending pitches in the &apos;My Campaigns&apos; tab!
                </Typography>
              </Stack>
            </>
          )}
          {submitStatus === 'error' && (
            <>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: 'error.lighter',
                  fontSize: '40px',
                  mb: 2,
                }}
              >
                <Iconify icon="mdi:error" sx={{ width: 60, height: 60, color: 'error.main' }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Instrument Serif, serif',
                  fontSize: { xs: '1.5rem', sm: '1.8rem' },
                  fontWeight: 550,
                }}
              >
                Submission Failed
              </Typography>
            </>
          )}
        </Stack>
      </DialogContent>
      {(submitStatus === 'error' || submitStatus === 'success') && (
        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Stack spacing={2} width="100%">
            {submitStatus === 'success' && (
              <>
                <Button
                  onClick={() => {
                    setShowSubmitDialog(false);
                    router.push(paths.dashboard.campaign.creator.manage);
                  }}
                  variant="contained"
                  fullWidth
                  sx={{
                    bgcolor: '#3a3a3c',
                    color: '#ffffff',
                    borderBottom: 3.5,
                    mb: -1,
                    borderBottomColor: '#202021',
                    fontSize: '0.95rem',
                    borderRadius: 1,
                    px: 2.5,
                    py: 1.2,
                    '&:hover': {
                      bgcolor: '#3a3a3c',
                      opacity: 0.9,
                    },
                  }}
                >
                  Go to My Campaigns
                </Button>
                <Button
                  onClick={() => {
                    setShowSubmitDialog(false);
                    handleClose();
                  }}
                  variant="outlined"
                  fullWidth
                  sx={{
                    fontSize: '1rem',
                    padding: '12px 24px',
                    height: '48px',
                    border: '1px solid #e7e7e7',
                    borderBottom: '4px solid',
                    borderBottomColor: '#e7e7e7',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  Close
                </Button>
              </>
            )}
            {submitStatus === 'error' && (
              <Button
                onClick={() => setShowSubmitDialog(false)}
                variant="contained"
                fullWidth
                sx={{
                  bgcolor: '#3a3a3c',
                  color: '#ffffff',
                  borderBottom: 3.5,
                  borderBottomColor: '#202021',
                  borderRadius: 1.5,
                  mt: -4,
                  px: 2.5,
                  py: 1.2,
                  '&:hover': {
                    bgcolor: '#3a3a3c',
                    opacity: 0.9,
                  },
                }}
              >
                Done
              </Button>
            )}
          </Stack>
        </DialogActions>
      )}
    </Dialog>
  );

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '750px',
          bgcolor: '#F4F4F4',
        },
      }}
      fullScreen={smUp}
    >
      <FormProvider methods={methods}>
        <DialogTitle>
          <Stack direction="column" spacing={2}>
            <Button
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              onClick={() => {
                if (value && value !== pitch?.content) {
                  dialog.onTrue();
                } else {
                  handleClose();
                  if (onBack) onBack();
                }
              }}
              sx={{
                color: '#636366',
                alignSelf: 'flex-start',
                fontWeight: 500,
                fontSize: '0.9rem',
                mb: -1,
                ml: -1,
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: 'text.primary',
                },
              }}
            >
              Back
            </Button>
            <Divider sx={{ bgcolor: '#D3D3D3' }} />
            <Stack direction="row" alignItems="center" gap={2}>
              <ListItemText
                primary="Letter Pitch"
                secondary="Start pitching your idea!"
                primaryTypographyProps={{
                  variant: 'h5',
                  fontFamily: 'Instrument Serif',
                  fontSize: '2rem',
                  fontWeight: 550,
                }}
                secondaryTypographyProps={{
                  variant: 'body1',
                  color: 'text.secondary',
                  lineHeight: 1.2,
                  mb: 1,
                }}
              />
            </Stack>
            <Divider sx={{ bgcolor: '#D3D3D3' }} />
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <RHFEditor
            simple
            name="content"
            sx={{
              '& .ql-container, & .ql-editor': {
                bgcolor: '#FFFFFF',
                backgroundColor: '#FFFFFF',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Stack spacing={2} width="100%">
            <Button
              fullWidth
              variant="contained"
              onClick={modal.onTrue}
              disabled={!value || value === pitch?.content}
              sx={{
                mb: -1,
                backgroundColor: '#3a3a3c',
                color: 'white',
                borderBottom: '3px solid',
                borderBottomColor:
                  !value || value === pitch?.content ? 'rgba(0, 0, 0, 0.12)' : '#202021',
                '&:hover': {
                  backgroundColor: '#202021',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#b0b0b1',
                  color: '#FFFFFF',
                  borderBottom: '4px solid',
                  borderBottomColor: '#9e9e9f',
                },
                fontSize: '1rem',
                padding: '12px 24px',
                height: '48px',
              }}
            >
              Send Pitch
            </Button>

            {value && value !== pitch?.content && (
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={saveAsDraft}
                sx={{
                  mb: -1,
                  fontSize: '1rem',
                  padding: '12px 24px',
                  height: '48px',
                  border: '1px solid #e7e7e7',
                  borderBottom: '4px solid',
                  borderBottomColor: '#e7e7e7',
                  backgroundColor: '#FFFFFF',
                }}
              >
                Save As Draft
              </Button>
            )}

            <Button
              fullWidth
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
                fontSize: '1rem',
                padding: '12px 24px',
                height: '48px',
                border: '1px solid #e7e7e7',
                borderBottom: '4px solid',
                borderBottomColor: '#e7e7e7',
                backgroundColor: '#FFFFFF',
              }}
            >
              Cancel
            </Button>
          </Stack>
        </DialogActions>
        {modalConfirmation}
        {modalClosePitch}
        {submitDialog}
      </FormProvider>
    </Dialog>
  );
};

export default CampaignPitchTextModal;

CampaignPitchTextModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  campaign: PropTypes.object,
  onBack: PropTypes.func,
};
