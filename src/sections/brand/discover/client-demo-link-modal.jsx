import PropTypes from 'prop-types';
import { QRCodeCanvas } from 'qrcode.react';
import { useRef, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Stack,
  Dialog,
  Button,
  Divider,
  Tooltip,
  IconButton,
  Typography,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import ConfirmDialogV2 from 'src/components/custom-dialog/confirm-dialog-v2';

// ----------------------------------------------------------------------
// "Client Link for Demo" modal — permanent demo link with QR code, copy,
// QR download, and (visual) regenerate affordance.

const COPY_SUCCESS_TIMEOUT_MS = 3000;

export default function ClientDemoLinkModal({ open, onClose, companyId }) {
  const { enqueueSnackbar } = useSnackbar();
  const qrWrapRef = useRef(null);
  const copyResetTimeoutRef = useRef(null);
  const confirmRegen = useBoolean();

  const [demoLinkData, setDemoLinkData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCopyConfirmed, setIsCopyConfirmed] = useState(false);

  const resetCopyConfirmation = useCallback(() => {
    if (copyResetTimeoutRef.current) {
      clearTimeout(copyResetTimeoutRef.current);
      copyResetTimeoutRef.current = null;
    }
    setIsCopyConfirmed(false);
  }, []);

  const showCopyConfirmation = useCallback(() => {
    if (copyResetTimeoutRef.current) {
      clearTimeout(copyResetTimeoutRef.current);
    }

    setIsCopyConfirmed(true);
    copyResetTimeoutRef.current = setTimeout(() => {
      setIsCopyConfirmed(false);
      copyResetTimeoutRef.current = null;
    }, COPY_SUCCESS_TIMEOUT_MS);
  }, []);

  const fetchLink = useCallback(async () => {
    if (!companyId) return;
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(endpoints.clientDemo.linkByCompany(companyId));
      setDemoLinkData(response.data);
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to fetch demo link', {
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [companyId, enqueueSnackbar]);

  useEffect(() => {
    if (open) {
      fetchLink();
    } else {
      setDemoLinkData(null);
      resetCopyConfirmation();
    }
  }, [open, fetchLink, resetCopyConfirmation]);

  useEffect(() => resetCopyConfirmation, [resetCopyConfirmation]);

  const handleCopy = async () => {
    if (!demoLinkData?.url) return;
    try {
      await navigator.clipboard.writeText(demoLinkData.url);
      showCopyConfirmation();
      enqueueSnackbar('Demo link copied', { variant: 'success' });
    } catch {
      enqueueSnackbar('Could not copy link', { variant: 'warning' });
    }
  };

  const handleQrDownload = () => {
    const qrCanvas = qrWrapRef.current?.querySelector('canvas');
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

  const handleGenerateNew = async () => {
    if (!companyId) return;
    try {
      setIsRegenerating(true);
      const response = await axiosInstance.post(endpoints.clientDemo.regenerate(companyId));
      setDemoLinkData(response.data);
      enqueueSnackbar('New demo link generated', { variant: 'success' });
      confirmRegen.onFalse();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to generate a new link', {
        variant: 'error',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <>
      <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          bgcolor: '#F4F4F4',
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ px: 3, py: 3 }}
        >
          <Typography
            sx={{
              fontFamily: 'Instrument Serif',
              fontWeight: 400,
              fontSize: { xs: 28, sm: 36 },
              lineHeight: { xs: '32px', sm: '40px' },
              color: '#231F20',
            }}
          >
            Client Link for Demo
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: '#636366' }}>
            <Iconify icon="eva:close-fill" width={24} />
          </IconButton>
        </Stack>

        <Divider sx={{ borderColor: '#EBEBEB' }} />

        {/* Body */}
        <Box sx={{ p: 3 }}>
          {isLoading && (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <CircularProgress size={28} />
            </Stack>
          )}

          {!isLoading && demoLinkData?.url && (
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              sx={{ border: '1px solid #EBEBEB', borderRadius: '12px', overflow: 'hidden' }}
            >
              {/* Left: QR panel */}
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={2}
                sx={{
                  bgcolor: '#F4F5FF',
                  p: { xs: 3, md: 4 },
                  width: { xs: '100%', md: 340 },
                  flexShrink: 0,
                }}
              >
                <Box
                  ref={qrWrapRef}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: '#FFFFFF',
                    lineHeight: 0,
                    boxShadow: '0 8px 24px -10px rgba(19, 64, 255, 0.25)',
                  }}
                >
                  <QRCodeCanvas value={demoLinkData.url} size={180} />
                </Box>

                <Button
                  variant="text"
                  startIcon={<Iconify icon="solar:download-minimalistic-bold" width={18} />}
                  onClick={handleQrDownload}
                  sx={{
                    color: '#1340FF',
                    fontWeight: 600,
                    fontSize: 14,
                    '&:hover': { bgcolor: 'transparent' },
                  }}
                >
                  Save QR as PNG
                </Button>
              </Stack>

              {/* Right: invite link panel */}
              <Box sx={{ flexGrow: 1, minWidth: 0, bgcolor: '#FFFFFF', p: { xs: 3, md: 4 } }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 700, fontSize: 18, color: '#231F20' }}>
                    Your invite link
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1,
                      py: 0.5,
                      borderRadius: '8px',
                      bgcolor: 'rgba(26, 191, 102, 0.12)',
                    }}
                  >
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#1ABF66' }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#1ABF66' }}>
                      Active
                    </Typography>
                  </Box>
                </Stack>

                <Typography sx={{ mt: 1, fontSize: 16, color: '#8F8F94' }}>
                  Send this URL or QR code to a Client you want to do the demo
                </Typography>

                {/* URL field */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mt: 2.5,
                    pl: 1.5,
                    pr: 0.5,
                    py: 1,
                    borderRadius: '10px',
                    border: '1px solid #EBEBEB',
                    bgcolor: '#F4F6F8',
                  }}
                >
                  <Iconify
                    icon="solar:link-round-angle-bold"
                    width={18}
                    sx={{ color: 'text.disabled', flexShrink: 0 }}
                  />
                  <Typography
                    component="span"
                    title={demoLinkData.url}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      fontFamily: 'monospace',
                      fontSize: 14,
                      fontWeight: 500,
                      letterSpacing: '-0.3px',
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {demoLinkData.url}
                  </Typography>
                  <Tooltip title="Copy link">
                    <IconButton size="small" onClick={handleCopy} sx={{ color: '#1340FF' }}>
                      <Iconify
                        icon={isCopyConfirmed ? 'solar:check-circle-bold' : 'solar:copy-bold'}
                        width={18}
                      />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Action buttons */}
                <Stack direction="row" spacing={1.5} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="contained"
                    startIcon={
                      <Iconify
                        icon={isCopyConfirmed ? 'solar:check-circle-bold' : 'solar:copy-bold'}
                        width={18}
                      />
                    }
                    onClick={handleCopy}
                    sx={{
                      bgcolor: '#1340FF',
                      color: '#FFFFFF',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#0F35CC', boxShadow: 'none' },
                    }}
                  >
                    {isCopyConfirmed ? 'Copied!' : 'Copy link'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Iconify icon="solar:download-minimalistic-bold" width={18} />}
                    onClick={handleQrDownload}
                    sx={{
                      borderColor: '#EBEBEB',
                      color: 'text.primary',
                      '&:hover': { borderColor: '#231F20', bgcolor: 'transparent' },
                    }}
                  >
                    Download QR
                  </Button>
                </Stack>

                <Divider sx={{ my: 3, borderColor: '#EBEBEB' }} />

                {/* Leaked / regenerate */}
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Iconify
                      icon="solar:shield-warning-bold"
                      width={22}
                      sx={{ color: '#FFAB00', flexShrink: 0, mt: 0.1 }}
                    />
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#231F20' }}>
                        Think it&apos;s leaked?
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: '#8E8E93' }}>
                        Generate a new link. The current URL and QR will stop working.
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    variant="text"
                    startIcon={<Iconify icon="solar:refresh-bold" width={18} />}
                    onClick={confirmRegen.onTrue}
                    sx={{
                      color: '#FF5630',
                      fontWeight: 600,
                      flexShrink: 0,
                      borderRadius: '8px',
                      transition: 'background-color 140ms ease-out, color 140ms ease-out',
                      '&:hover': { bgcolor: 'rgba(255, 86, 48, 0.08)', color: '#D92D20' },
                    }}
                  >
                    Generate new
                  </Button>
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>
      </DialogContent>
      </Dialog>

      <ConfirmDialogV2
        open={confirmRegen.value}
        onClose={confirmRegen.onFalse}
        title="Generate a new link?"
        isPosting={isRegenerating}
        emoji={
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#FFEDEA',
              color: '#FF5630',
            }}
          >
            <Iconify icon="solar:refresh-bold" width={32} />
          </Box>
        }
        content={
          <Box sx={{ pb: 1.5, textAlign: 'center', lineHeight: 1.5, color: '#636366' }}>
            The current URL and QR code will stop working immediately. Anyone you&apos;ve already
            shared the old link with will lose access.
          </Box>
        }
        action={<Box onClick={handleGenerateNew} />}
      />
    </>
  );
}

ClientDemoLinkModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  companyId: PropTypes.string,
};
