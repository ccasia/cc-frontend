import { enqueueSnackbar } from 'notistack';
import { QRCodeCanvas } from 'qrcode.react';
import { useRef, useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

const ACCENT_BLUE = '#1340ff';

export default function MyInviteLinkView() {
  const settings = useSettingsContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshOpen, setRefreshOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const qrWrapRef = useRef(null);

  const downloadQrPng = () => {
    const canvas = qrWrapRef.current?.querySelector('canvas');
    if (!canvas) {
      enqueueSnackbar('Could not export QR', { variant: 'error' });
      return;
    }
    try {
      const link = document.createElement('a');
      link.download = 'invite-link-qr.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      enqueueSnackbar('QR image saved', { variant: 'success' });
    } catch {
      enqueueSnackbar('Download failed', { variant: 'error' });
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(endpoints.bd.myInviteLink);
      setData(res.data);
    } catch {
      enqueueSnackbar('Failed to load invite link', { variant: 'error' });
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const copy = async () => {
    if (!data?.url) return;
    try {
      await navigator.clipboard.writeText(data.url);
      enqueueSnackbar('Link copied', { variant: 'success' });
    } catch {
      enqueueSnackbar('Could not copy — try selecting the link manually', { variant: 'warning' });
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await axiosInstance.post(endpoints.bd.rotateInviteLink);
      setData(res.data);
      enqueueSnackbar('New link generated — the old one no longer works', { variant: 'success' });
      setRefreshOpen(false);
    } catch {
      enqueueSnackbar('Failed to refresh link', { variant: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  const activeChip = (
    <Chip
      size="small"
      label="Active"
      icon={
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: '#22c55e',
            ml: '4px !important',
          }}
        />
      }
      sx={{
        height: 22,
        bgcolor: (t) => alpha('#22c55e', t.palette.mode === 'light' ? 0.12 : 0.2),
        color: (t) => (t.palette.mode === 'light' ? '#15803d' : '#86efac'),
        fontWeight: 600,
        fontSize: 11,
        border: 0,
        '& .MuiChip-icon': { color: '#22c55e' },
      }}
    />
  );

  // ================= MOBILE =================
  const renderMobile = data && (
    <Stack spacing={2.5}>
      {/* QR hero */}
      <Box
        sx={{
          position: 'relative',
          borderRadius: 3,
          overflow: 'hidden',
          p: 3,
          bgcolor: (t) => alpha(ACCENT_BLUE, t.palette.mode === 'light' ? 0.05 : 0.1),
          border: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ alignSelf: 'flex-start', mb: 0.5 }}
        >
          <Iconify icon="solar:qr-code-bold" width={16} sx={{ color: ACCENT_BLUE }} />
          <Typography
            variant="overline"
            sx={{ color: ACCENT_BLUE, fontWeight: 700, letterSpacing: 1 }}
          >
            Scan or share
          </Typography>
        </Stack>

        <Box
          ref={qrWrapRef}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            lineHeight: 0,
            boxShadow: (t) =>
              `0 1px 2px ${alpha(t.palette.grey[900], 0.06)}, 0 12px 32px -12px ${alpha(ACCENT_BLUE, 0.3)}`,
          }}
        >
          <QRCodeCanvas value={data.url} size={160} />
        </Box>

        {activeChip}
      </Box>

      {/* URL card */}
      <Card variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Typography
          variant="overline"
          sx={{ color: 'text.secondary', letterSpacing: 1, mb: 1, display: 'block' }}
        >
          Invite URL
        </Typography>
        <Box
          onClick={copy}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderRadius: 1.5,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.neutral',
            px: 1.5,
            py: 1.25,
            mb: 1.5,
            cursor: 'pointer',
            transition: 'border-color .15s',
            '&:active': { borderColor: ACCENT_BLUE },
          }}
        >
          <Typography
            component="span"
            sx={{
              flex: 1,
              minWidth: 0,
              fontFamily: 'monospace',
              fontSize: 12,
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={data.url}
          >
            {data.url}
          </Typography>
          <Iconify
            icon="solar:copy-bold"
            width={16}
            sx={{ color: ACCENT_BLUE, flexShrink: 0 }}
          />
        </Box>

        <Stack spacing={1.25}>
          <Button
            fullWidth
            size="large"
            variant="contained"
            startIcon={<Iconify icon="solar:copy-bold" width={18} />}
            onClick={copy}
            sx={{
              bgcolor: ACCENT_BLUE,
              color: '#fff',
              boxShadow: 'none',
              py: 1.25,
              '&:hover': { bgcolor: alpha(ACCENT_BLUE, 0.9), boxShadow: 'none' },
            }}
          >
            Copy link
          </Button>
          <Button
            fullWidth
            size="large"
            variant="outlined"
            startIcon={<Iconify icon="solar:download-minimalistic-bold" width={18} />}
            onClick={downloadQrPng}
            sx={{
              borderColor: 'divider',
              color: 'text.primary',
              py: 1.25,
              '&:hover': { borderColor: 'text.primary', bgcolor: 'transparent' },
            }}
          >
            Download QR
          </Button>
        </Stack>
      </Card>

      {/* Danger action */}
      <Button
        color="error"
        variant="text"
        startIcon={<Iconify icon="solar:refresh-bold" width={16} />}
        onClick={() => setRefreshOpen(true)}
        sx={{ alignSelf: 'center', mt: 0.5 }}
      >
        Generate new link
      </Button>
    </Stack>
  );

  // ================= DESKTOP =================
  const renderDesktop = data && (
    <Card sx={{ overflow: 'hidden' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr' }}>
        <Box
          sx={{
            position: 'relative',
            p: 3.5,
            bgcolor: (t) => alpha(ACCENT_BLUE, t.palette.mode === 'light' ? 0.04 : 0.08),
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Box
            ref={qrWrapRef}
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              lineHeight: 0,
              boxShadow: (t) =>
                `0 1px 2px ${alpha(t.palette.grey[900], 0.06)}, 0 8px 24px -10px ${alpha(ACCENT_BLUE, 0.25)}`,
            }}
          >
            <QRCodeCanvas value={data.url} size={172} />
          </Box>
          <Button
            size="small"
            variant="text"
            startIcon={<Iconify icon="solar:download-minimalistic-bold" width={18} />}
            onClick={downloadQrPng}
            sx={{ color: ACCENT_BLUE, fontWeight: 600 }}
          >
            Save QR as PNG
          </Button>
        </Box>

        <Box sx={{ p: 4 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Typography variant="h6">Your invite link</Typography>
            {activeChip}
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Send this URL or QR code to a prospect — they fill out the campaign brief and it
            appears in your drafts.
          </Typography>

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
            <Iconify
              icon="solar:link-round-angle-bold"
              width={18}
              sx={{ color: 'text.disabled', flexShrink: 0 }}
            />
            <Typography
              component="span"
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
              title={data.url}
            >
              {data.url}
            </Typography>
            <Tooltip title="Copy link">
              <IconButton size="small" onClick={copy} sx={{ color: ACCENT_BLUE }}>
                <Iconify icon="solar:copy-bold" width={18} />
              </IconButton>
            </Tooltip>
          </Box>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:copy-bold" width={18} />}
              onClick={copy}
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

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
            <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0 }}>
              <Iconify
                icon="solar:shield-warning-bold"
                width={20}
                sx={{ color: 'warning.main', mt: '2px', flexShrink: 0 }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2">Think it&apos;s leaked?</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Generate a new link. The current URL and QR will stop working.
                </Typography>
              </Box>
            </Stack>
            <Button
              color="error"
              variant="text"
              size="small"
              startIcon={<Iconify icon="solar:refresh-bold" width={18} />}
              onClick={() => setRefreshOpen(true)}
              sx={{ flexShrink: 0 }}
            >
              Generate new
            </Button>
          </Stack>
        </Box>
      </Box>
    </Card>
  );

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'lg'}
      sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 4, md: 0 } }}
    >
      <CustomBreadcrumbs
        heading="My Invite Link"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Invite link' },
        ]}
        sx={{ mb: { xs: 0.75, sm: 1 } }}
      />

      <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2.5, sm: 4 } }}>
        Share with prospects to collect briefs. Submitted briefs land in{' '}
        <Link
          component={RouterLink}
          to={paths.dashboard.campaign.drafts}
          underline="hover"
          sx={{ color: ACCENT_BLUE, fontWeight: 600 }}
        >
          Draft Briefs
        </Link>
        .
      </Typography>

      {loading && (
        <Card
          sx={{
            py: { xs: 8, md: 12 },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 3,
          }}
        >
          <CircularProgress
            thickness={7}
            size={28}
            sx={{ color: (t) => t.palette.common.black, strokeLinecap: 'round' }}
          />
        </Card>
      )}

      {!loading && !data && (
        <Alert
          severity="error"
          sx={{ borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={load}>
              Retry
            </Button>
          }
        >
          Couldn&apos;t load link.
        </Alert>
      )}

      {!loading && data && (isMobile ? renderMobile : renderDesktop)}

      <Dialog
        open={refreshOpen}
        onClose={() => !refreshing && setRefreshOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, m: { xs: 2, sm: 3 } } }}
      >
        <DialogTitle sx={{ typography: { xs: 'subtitle1', sm: 'h6' }, pb: 1 }}>
          Generate a new link?
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            The current URL and QR stop working immediately. Anyone with the old link — including
            printed materials — won&apos;t be able to submit a brief.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: 2,
            pt: 0,
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            gap: 1,
            '& > :not(style)': { m: 0 },
          }}
        >
          <Button
            fullWidth={isMobile}
            onClick={() => setRefreshOpen(false)}
            disabled={refreshing}
            sx={{ minWidth: { sm: 88 } }}
          >
            Cancel
          </Button>
          <LoadingButton
            fullWidth={isMobile}
            color="error"
            variant="contained"
            loading={refreshing}
            onClick={refresh}
          >
            Generate
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
