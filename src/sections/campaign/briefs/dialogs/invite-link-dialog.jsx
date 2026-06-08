import PropTypes from 'prop-types';
import { QRCodeCanvas } from 'qrcode.react';
import { useRef, useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

const ACCENT_BLUE = '#1340FF';

// Surfaces the BD's personal share link (the CLIENT_INVITED flow) inside the
// Campaign Brief page, with the QR-code presentation from the standalone
// My Invite Link page.
export default function InviteLinkDialog({ open, onClose }) {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const qrWrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    setConfirmRotate(false);
    axiosInstance
      .get(endpoints.campaignBrief.myInviteLink)
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) enqueueSnackbar('Failed to load invite link', { variant: 'error' }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, enqueueSnackbar]);

  const handleCopy = async () => {
    if (!data?.url) return;
    try {
      await navigator.clipboard.writeText(data.url);
      enqueueSnackbar('Link copied', { variant: 'success' });
    } catch {
      enqueueSnackbar('Could not copy — select manually', { variant: 'warning' });
    }
  };

  const handleRotate = async () => {
    setRotating(true);
    try {
      const res = await axiosInstance.post(endpoints.campaignBrief.rotateInviteLink);
      setData(res.data);
      setConfirmRotate(false);
      enqueueSnackbar('New link generated — the old one no longer works', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to rotate link', { variant: 'error' });
    } finally {
      setRotating(false);
    }
  };

  const downloadQrPng = () => {
    const qrCanvas = qrWrapRef.current?.querySelector('canvas');
    if (!qrCanvas) {
      enqueueSnackbar('Could not export QR', { variant: 'error' });
      return;
    }
    try {
      const link = document.createElement('a');
      link.download = 'invite-link-qr.png';
      link.href = qrCanvas.toDataURL('image/png');
      link.click();
      enqueueSnackbar('QR image saved', { variant: 'success' });
    } catch {
      enqueueSnackbar('Download failed', { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2.5 } }}>
      <DialogContent sx={{ p: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
          <Typography variant="h5" sx={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>
            Your Invite Link
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Send this URL or QR code to a prospect — they fill out the campaign brief and it appears in
          your drafts.
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {!loading && data && (
          <>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
              <Box
                ref={qrWrapRef}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  lineHeight: 0,
                  flexShrink: 0,
                  boxShadow: (t) => `0 8px 24px -10px ${alpha(ACCENT_BLUE, 0.25)}`,
                }}
              >
                <QRCodeCanvas value={data.url} size={160} />
              </Box>

              <Box sx={{ minWidth: 0, width: '100%' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.neutral',
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
                    title={data.url}
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
                    {data.url}
                  </Typography>
                  <Tooltip title="Copy link">
                    <IconButton size="small" onClick={handleCopy} sx={{ color: ACCENT_BLUE }}>
                      <Iconify icon="solar:copy-bold" width={18} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="contained"
                    startIcon={<Iconify icon="solar:copy-bold" width={18} />}
                    onClick={handleCopy}
                    sx={{
                      bgcolor: ACCENT_BLUE,
                      color: '#fff',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: alpha(ACCENT_BLUE, 0.9), boxShadow: 'none' },
                    }}
                  >
                    Copy link
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Iconify icon="solar:download-minimalistic-bold" width={18} />}
                    onClick={downloadQrPng}
                    sx={{
                      borderColor: 'divider',
                      color: 'text.primary',
                      '&:hover': { borderColor: 'text.primary', bgcolor: 'transparent' },
                    }}
                  >
                    Download QR
                  </Button>
                </Stack>
              </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
              <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0 }}>
                <Iconify icon="solar:shield-warning-bold" width={20} sx={{ color: 'warning.main', mt: '2px', flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2">Think it&apos;s leaked?</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Generate a new link. The current URL and QR will stop working.
                  </Typography>
                </Box>
              </Stack>
              {confirmRotate ? (
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                  <Button size="small" onClick={() => setConfirmRotate(false)} disabled={rotating}>
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    onClick={handleRotate}
                    disabled={rotating}
                  >
                    {rotating ? 'Generating…' : 'Confirm'}
                  </Button>
                </Stack>
              ) : (
                <Button
                  color="error"
                  variant="text"
                  size="small"
                  startIcon={<Iconify icon="solar:refresh-bold" width={18} />}
                  onClick={() => setConfirmRotate(true)}
                  sx={{ flexShrink: 0 }}
                >
                  Generate new
                </Button>
              )}
            </Stack>
          </>
        )}
        {!loading && !data && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Couldn&apos;t load link.</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

InviteLinkDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
