import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { QRCodeCanvas } from 'qrcode.react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRef, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Stack,
  Dialog,
  Button,
  Divider,
  Tooltip,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

// Validation schema
const InviteClientSchema = Yup.object().shape({
  email: Yup.string().email('Please enter a valid email address').required('Email is required'),
});

const COPY_SUCCESS_TIMEOUT_MS = 3000;

export default function InviteClientDialog({ open, onClose, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoClientName, setDemoClientName] = useState('');
  const [demoLinkOpen, setDemoLinkOpen] = useState(false);
  const [demoLinkData, setDemoLinkData] = useState(null);
  const [isDemoLinkCopied, setIsDemoLinkCopied] = useState(false);
  const demoQrWrapRef = useRef(null);
  const demoCopyResetTimeoutRef = useRef(null);

  const resetDemoCopyConfirmation = useCallback(() => {
    if (demoCopyResetTimeoutRef.current) {
      clearTimeout(demoCopyResetTimeoutRef.current);
      demoCopyResetTimeoutRef.current = null;
    }
    setIsDemoLinkCopied(false);
  }, []);

  const showDemoCopyConfirmation = useCallback(() => {
    if (demoCopyResetTimeoutRef.current) {
      clearTimeout(demoCopyResetTimeoutRef.current);
    }

    setIsDemoLinkCopied(true);
    demoCopyResetTimeoutRef.current = setTimeout(() => {
      setIsDemoLinkCopied(false);
      demoCopyResetTimeoutRef.current = null;
    }, COPY_SUCCESS_TIMEOUT_MS);
  }, []);

  useEffect(() => resetDemoCopyConfirmation, [resetDemoCopyConfirmation]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(InviteClientSchema),
    mode: 'onChange',
  });

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);

      // Create a default company name based on email domain
      const domain = values.email.split('@')[1];
      const companyName = domain
        ? domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
        : 'New Company';

      // First, create a company
      const companyResponse = await axiosInstance.post(endpoints.company.createOneCompany, {
        name: companyName,
        email: values.email,
        phone: '',
        website: '',
      });

      const { company } = companyResponse.data;

      // Then, invite the client using the company ID
      const response = await axiosInstance.post(endpoints.auth.inviteClient, {
        email: values.email,
        companyId: company.id,
      });

      const result = response.data;

      enqueueSnackbar(
        `Invitation sent successfully to ${values.email}! The client will receive an email with setup instructions.`,
        {
          variant: 'success',
          autoHideDuration: 6000,
        }
      );

      // Reset form
      reset();

      // Close dialog
      onClose();

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Error inviting client:', error);

      // Handle specific error cases
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes('already exists')) {
          enqueueSnackbar('A client with this email already exists.', { variant: 'error' });
        } else if (errorMessage.includes('Company already exists')) {
          enqueueSnackbar('A company with this name already exists.', { variant: 'error' });
        } else {
          enqueueSnackbar(errorMessage, { variant: 'error' });
        }
      } else {
        enqueueSnackbar('Failed to send invitation. Please try again.', { variant: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setDemoOpen(false);
      setDemoClientName('');
      onClose();
    }
  };

  const handleClientDemo = () => {
    setDemoOpen(true);
  };

  const handleDemoClose = () => {
    if (isDemoSubmitting) return;
    setDemoOpen(false);
    setDemoClientName('');
  };

  const handleDemoGenerate = async () => {
    const name = demoClientName.trim();
    if (!name) return;

    try {
      setIsDemoSubmitting(true);
      const response = await axiosInstance.post(endpoints.clientDemo.create, { name });
      setDemoLinkData(response.data);
      setDemoOpen(false);
      setDemoClientName('');
      reset();
      onClose();
      setDemoLinkOpen(true);
      enqueueSnackbar('Client demo link generated', { variant: 'success' });
      onSuccess?.(response.data);
    } catch (error) {
      console.error('Error creating client demo:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Failed to create client demo', { variant: 'error' });
    } finally {
      setIsDemoSubmitting(false);
    }
  };

  const handleDemoLinkClose = () => {
    setDemoLinkOpen(false);
    resetDemoCopyConfirmation();
  };

  const handleDemoLinkCopy = async () => {
    if (!demoLinkData?.url) return;
    try {
      await navigator.clipboard.writeText(demoLinkData.url);
      showDemoCopyConfirmation();
      enqueueSnackbar('Demo link copied', { variant: 'success' });
    } catch {
      enqueueSnackbar('Could not copy link', { variant: 'warning' });
    }
  };

  const handleDemoQrDownload = () => {
    const qrCanvas = demoQrWrapRef.current?.querySelector('canvas');
    if (!qrCanvas) {
      enqueueSnackbar('Could not export QR', { variant: 'error' });
      return;
    }

    try {
      const link = document.createElement('a');
      link.download = 'client-demo-link-qr.png';
      link.href = qrCanvas.toDataURL('image/png');
      link.click();
      enqueueSnackbar('QR image saved', { variant: 'success' });
    } catch {
      enqueueSnackbar('Download failed', { variant: 'error' });
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            width: 596,
            minHeight: 284,
            maxWidth: 'calc(100% - 32px)',
            m: 2,
            bgcolor: '#F4F4F4',
            borderRadius: '20px',
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.15)',
            overflow: 'visible',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogTitle sx={{ px: 3, pt: 3, pb: 0 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Typography
              component="span"
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontFamily: 'Instrument Serif',
                fontWeight: 400,
                fontSize: { xs: 32, sm: 36 },
                lineHeight: '40px',
                color: '#231F20',
              }}
            >
              Invite New Client
            </Typography>

            <Button
              type="button"
              onClick={handleClientDemo}
              startIcon={<Iconify icon="solar:link-minimalistic-2-linear" width={16} />}
              sx={{
                width: 127,
                height: 38,
                flexShrink: 0,
                px: 1.5,
                pt: '8px',
                pb: '11px',
                gap: 0.5,
                bgcolor: '#1340FF',
                borderRadius: '8px',
                boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
                color: '#FFFFFF',
                fontFamily: 'InterDisplay',
                fontWeight: 600,
                fontSize: 14,
                lineHeight: '18px',
                textTransform: 'none',
                transition: 'transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease-out',
                '& .MuiButton-startIcon': {
                  mr: 0,
                  ml: 0,
                },
                '& svg': {
                  color: '#FFFFFF',
                },
                '&:hover': {
                  bgcolor: '#0F35CC',
                  boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
              }}
            >
              Client Demo
            </Button>
          </Stack>
        </DialogTitle>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
          <DialogContent sx={{ px: 3, pt: 0, pb: 0, overflow: 'visible', flex: 1 }}>
            <Divider sx={{ my: 3, borderColor: '#EBEBEB' }} />

            <Stack spacing={3}>
              {/* <Alert severity="info" icon={<Iconify icon="eva:info-fill" />}>
              <Typography variant="body2">
                An invitation email will be sent to the client with a secure link. They will need to verify their email and set up their password to access the platform.
              </Typography>
            </Alert> */}

              <Box>
                <Typography
                  component="label"
                  htmlFor="invite-client-email"
                  sx={{
                    display: 'block',
                    mb: 0.5,
                    fontFamily: 'InterDisplay',
                    fontWeight: 500,
                    fontSize: 12,
                    lineHeight: '16px',
                    color: '#636366',
                  }}
                >
                  Client Email
                </Typography>

                <TextField
                  id="invite-client-email"
                  fullWidth
                  placeholder="Enter client's email"
                  type="email"
                  {...register('email')}
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                  disabled={isSubmitting}
                  inputProps={{
                    'aria-label': 'Client Email',
                  }}
                  InputProps={{
                    sx: {
                      height: 48,
                      bgcolor: '#FFFFFF',
                      borderRadius: '8px',
                      fontFamily: 'InterDisplay',
                      fontSize: 14,
                      lineHeight: '18px',
                      color: '#231F20',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EBEBEB',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#D7D7D7',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1340FF',
                      },
                      '& input::placeholder': {
                        color: '#B0B0B0',
                        opacity: 1,
                      },
                    },
                  }}
                  FormHelperTextProps={{
                    sx: {
                      mt: 1,
                      mx: 0,
                      fontFamily: 'InterDisplay',
                    },
                  }}
                />
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              pt: 0,
              pb: 3,
              gap: 1,
              justifyContent: 'flex-end',
              mt: 'auto',
              '& > :not(:first-of-type)': {
                ml: 0,
              },
            }}
          >
            <Button
              onClick={handleClose}
              disabled={isSubmitting}
              sx={{
                width: 87,
                height: 44,
                px: 2,
                pt: '10px',
                pb: '13px',
                bgcolor: '#FFFFFF',
                border: '1px solid #E8E8E8',
                borderRadius: '8px',
                boxShadow: 'inset 0px -3px 0px #E7E7E7',
                color: '#231F20',
                fontFamily: 'InterDisplay',
                fontWeight: 600,
                fontSize: 16,
                lineHeight: '20px',
                textTransform: 'none',
                transition: 'transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease-out',
                '&:hover': {
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E8E8E8',
                  boxShadow: 'inset 0px -3px 0px #E7E7E7',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
                '&.Mui-disabled': {
                  bgcolor: '#FFFFFF',
                  color: '#8E8E93',
                  boxShadow: 'inset 0px -3px 0px #E7E7E7',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || !isValid}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              sx={{
                minWidth: 145,
                height: 44,
                px: 2,
                pt: '10px',
                pb: '13px',
                bgcolor: '#3A3A3C',
                borderRadius: '8px',
                boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
                color: '#FFFFFF',
                fontFamily: 'InterDisplay',
                fontWeight: 600,
                fontSize: 16,
                lineHeight: '20px',
                textTransform: 'none',
                transition: 'transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease-out',
                '&:hover': {
                  bgcolor: '#2F2F31',
                  boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
                '&.Mui-disabled': {
                  background:
                    'linear-gradient(0deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.55)), #3A3A3C',
                  color: '#FFFFFF',
                  boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.12)',
                },
                '& .MuiButton-startIcon': {
                  ml: 0,
                },
              }}
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={demoOpen}
        onClose={handleDemoClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            width: 596,
            minHeight: 284,
            maxWidth: 'calc(100% - 32px)',
            m: 2,
            bgcolor: '#F4F4F4',
            borderRadius: '20px',
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.15)',
            overflow: 'visible',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogTitle sx={{ px: 3, pt: 3, pb: 0 }}>
          <Typography
            component="span"
            sx={{
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: { xs: 32, sm: 36 },
              lineHeight: '40px',
              color: '#231F20',
            }}
          >
            Confirm Client Name for Demo
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pt: 0, pb: 0, overflow: 'visible', flex: 1 }}>
          <Divider sx={{ my: 3, borderColor: '#EBEBEB' }} />

          <Box>
            <Typography
              component="label"
              htmlFor="demo-client-name"
              sx={{
                display: 'block',
                mb: 0.5,
                fontFamily: 'InterDisplay',
                fontWeight: 500,
                fontSize: 12,
                lineHeight: '16px',
                color: '#636366',
              }}
            >
              Demo Client Name
            </Typography>

            <TextField
              id="demo-client-name"
              fullWidth
              placeholder="Demo Client Name"
              value={demoClientName}
              onChange={(event) => setDemoClientName(event.target.value)}
              inputProps={{
                'aria-label': 'Demo Client Name',
              }}
              InputProps={{
                sx: {
                  height: 48,
                  bgcolor: '#FFFFFF',
                  borderRadius: '8px',
                  fontFamily: 'InterDisplay',
                  fontSize: 14,
                  lineHeight: '18px',
                  color: '#231F20',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#EBEBEB',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D7D7D7',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1340FF',
                  },
                  '& input::placeholder': {
                    color: '#B0B0B0',
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pt: 0,
            pb: 3,
            gap: 1,
            justifyContent: 'flex-end',
            mt: 'auto',
            '& > :not(:first-of-type)': {
              ml: 0,
            },
          }}
        >
          <Button
            onClick={handleDemoClose}
            disabled={isDemoSubmitting}
            sx={{
              width: 87,
              height: 44,
              px: 2,
              pt: '10px',
              pb: '13px',
              bgcolor: '#FFFFFF',
              border: '1px solid #E8E8E8',
              borderRadius: '8px',
              boxShadow: 'inset 0px -3px 0px #E7E7E7',
              color: '#231F20',
              fontFamily: 'InterDisplay',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: '20px',
              textTransform: 'none',
              transition: 'transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease-out',
              '&:hover': {
                bgcolor: '#FFFFFF',
                border: '1px solid #E8E8E8',
                boxShadow: 'inset 0px -3px 0px #E7E7E7',
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={isDemoSubmitting || !demoClientName.trim()}
            onClick={handleDemoGenerate}
            sx={{
              width: 95,
              height: 44,
              px: 2,
              pt: '10px',
              pb: '13px',
              bgcolor: '#1340FF',
              borderRadius: '8px',
              boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
              color: '#FFFFFF',
              fontFamily: 'InterDisplay',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: '20px',
              textTransform: 'none',
              transition: 'transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease-out',
              '&:hover': {
                bgcolor: '#0F35CC',
                boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.45)',
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
              '&.Mui-disabled': {
                background:
                  'linear-gradient(0deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.55)), #1340FF',
                color: '#FFFFFF',
                boxShadow: 'inset 0px -3px 0px rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            {isDemoSubmitting ? <CircularProgress size={20} sx={{ color: '#FFFFFF' }} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={demoLinkOpen}
        onClose={handleDemoLinkClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <DialogContent sx={{ p: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
            <Typography variant="h5" sx={{ fontFamily: 'Instrument Serif', fontWeight: 400 }}>
              Client Demo Link
            </Typography>
            <IconButton onClick={handleDemoLinkClose} size="small">
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Send this URL or QR code to open the demo dashboard. This link stays active until the demo account is deleted.
          </Typography>

          {demoLinkData?.url && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
              <Box
                ref={demoQrWrapRef}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #EBEBEB',
                  lineHeight: 0,
                  flexShrink: 0,
                  boxShadow: '0 8px 24px -10px rgba(19, 64, 255, 0.25)',
                }}
              >
                <QRCodeCanvas value={demoLinkData.url} size={160} />
              </Box>

              <Box sx={{ minWidth: 0, width: '100%' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 1.5,
                    border: '1px solid #EBEBEB',
                    bgcolor: '#F4F6F8',
                    pl: 1.5,
                    pr: 0.5,
                    py: 0.5,
                    mb: 2,
                    gap: 1,
                  }}
                >
                  <Iconify icon="solar:link-round-angle-bold" width={18} sx={{ color: 'text.disabled', flexShrink: 0 }} />
                  <Typography
                    component="span"
                    title={demoLinkData.url}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      fontFamily: 'monospace',
                      fontSize: 13,
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {demoLinkData.url}
                  </Typography>
                  <Tooltip title="Copy link">
                    <IconButton size="small" onClick={handleDemoLinkCopy} sx={{ color: '#1340FF' }}>
                      <Iconify
                        icon={isDemoLinkCopied ? 'solar:check-circle-bold' : 'solar:copy-bold'}
                        width={18}
                      />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="contained"
                    startIcon={<Iconify icon="solar:copy-bold" width={18} />}
                    onClick={handleDemoLinkCopy}
                    sx={{
                      bgcolor: '#1340FF',
                      color: '#FFFFFF',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#0F35CC', boxShadow: 'none' },
                    }}
                  >
                    Copy link
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Iconify icon="solar:download-minimalistic-bold" width={18} />}
                    onClick={handleDemoQrDownload}
                    sx={{
                      borderColor: '#EBEBEB',
                      color: 'text.primary',
                      '&:hover': { borderColor: '#231F20', bgcolor: 'transparent' },
                    }}
                  >
                    Download QR
                  </Button>
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

InviteClientDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};
