import useSWR from 'swr';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import BriefForm from './brief-form';
import BriefFormLayout from './brief-form-layout';
import HandoverDialog from './dialogs/handover-dialog';
import AssignCsmDialog from './dialogs/assign-csm-dialog';
import { STATUS_CONFIG } from './components/status-badge';
import SendToClientDialog from './dialogs/send-to-client-dialog';

export default function CampaignBriefDetailView({ briefId, onClose }) {
  const settings = useSettingsContext();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const params = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const id = briefId ?? params.id;
  const inDialog = Boolean(briefId);

  const {
    data: brief,
    isLoading,
    mutate,
  } = useSWR(id ? endpoints.campaignBrief.get(id) : null, fetcher);

  const [sendOpen, setSendOpen] = useState(false);
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [assignCsmOpen, setAssignCsmOpen] = useState(false);
  const [clearSignal, setClearSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [resetting, setResetting] = useState(false);

  // Whether RESET FORM reverts to the original prospect submission (mirrors the
  // client's reset-to-snapshot) vs. wiping to empty. Only CLIENT_INVITED briefs
  // have a captured submission snapshot to revert to.
  const isFromPublicForm = brief?.draftOrigin === 'CLIENT_INVITED';
  // CSL-authored briefs skip the CSL-group handoff: the CSL assigns a CSM
  // directly at APPROVED (the assign action self-handovers server-side).
  const isCslAuthored = brief?.draftOrigin === 'CSL_CREATED';
  // CSM-authored briefs skip handover entirely: the CSM finalizes their own
  // brief into a campaign they manage (server keeps them as manager).
  const isCsmAuthored = brief?.draftOrigin === 'CSM_CREATED';

  // BD reset — mirror of the client's handleResetToSnapshot: revert on the
  // server to the stored snapshot, refresh the brief, then bump resetSignal so
  // the form reseeds to those values (brief id is unchanged).
  const handleReset = useCallback(async () => {
    if (resetting) return;
    setResetting(true);
    try {
      const res = await axiosInstance.post(endpoints.campaignBrief.reset(brief.id));
      if (res.data) await mutate(res.data, { revalidate: false });
      setResetSignal((n) => n + 1);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to reset form', { variant: 'error' });
    } finally {
      setResetting(false);
    }
  }, [resetting, brief?.id, mutate, enqueueSnackbar]);

  const isClientEditable =
    brief?.draftStatus === 'PENDING_REVIEW' || brief?.draftStatus === 'SENT_TO_CLIENT';
  const isLocked = brief?.draftStatus === 'HANDED_OVER' || brief?.draftStatus === 'APPROVED';

  const linkedCompany = brief?.company || brief?.brand?.company || null;
  const linkedActiveSub =
    linkedCompany?.subscriptions?.find?.((s) => s.status === 'ACTIVE') || null;
  const linkedPackageName =
    linkedActiveSub?.package?.name || linkedActiveSub?.customPackage?.customName || null;
  const linkedTotalCredits =
    linkedActiveSub?.totalCredits ?? linkedActiveSub?.customPackage?.customCredits ?? null;
  const linkedExpiresAt = linkedActiveSub?.expiredAt
    ? dayjs(linkedActiveSub.expiredAt).format('DD MMM YYYY')
    : null;

  // BD-side autosave — PATCH on each field blur.
  const onSavePatch = useCallback(
    async (patch) => {
      if (!brief?.id) return;
      try {
        await axiosInstance.patch(endpoints.campaignBrief.patch(brief.id), patch);
        mutate();
      } catch (error) {
        enqueueSnackbar(error?.response?.data?.message || 'Failed to save', { variant: 'error' });
      }
    },
    [brief?.id, mutate, enqueueSnackbar]
  );

  const onUploadAttachment = useCallback(
    async (file) => {
      if (!brief?.id) return;
      const fd = new FormData();
      fd.append('brandGuidelines', file);
      try {
        await axiosInstance.post(endpoints.campaignBrief.attachments(brief.id), fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        enqueueSnackbar('Attachment uploaded', { variant: 'success' });
        mutate();
      } catch (error) {
        enqueueSnackbar(error?.response?.data?.message || 'Failed to upload attachment', {
          variant: 'error',
        });
      }
    },
    [brief?.id, mutate, enqueueSnackbar]
  );

  const onDeleteAttachment = useCallback(
    async (url) => {
      if (!brief?.id) return;
      try {
        await axiosInstance.delete(endpoints.campaignBrief.attachments(brief.id), {
          params: url ? { url } : undefined,
        });
        enqueueSnackbar('Attachment deleted', { variant: 'success' });
        mutate();
      } catch (error) {
        enqueueSnackbar(error?.response?.data?.message || 'Failed to delete attachment', {
          variant: 'error',
        });
      }
    },
    [brief?.id, mutate, enqueueSnackbar]
  );

  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!brief) {
    return (
      <Container>
        <Alert severity="error">Brief not found.</Alert>
      </Container>
    );
  }

  // Decide the footer's primary action based on the current state. Autosave
  // handles persistence, so the primary button drives state transitions
  // (Send → Handover) rather than a literal "Save". The button is colored by
  // the brief's CURRENT draftStatus, using the same palette as StatusBadge.
  const primaryAction = (() => {
    const labelAndHandler = (() => {
      switch (brief.draftStatus) {
        case 'DRAFTED':
          // Send-to-client is the primary CTA — force the system blue rather than
          // the grey DRAFT status color (which would otherwise carry over here).
          return { label: 'SEND TO CLIENT', onClick: () => setSendOpen(true), bg: '#1340FF' };
        case 'SENT_TO_CLIENT':
          return { label: 'RESEND TO CLIENT', onClick: () => setSendOpen(true) };
        case 'APPROVED':
          // CSM-authored → the CSM finalizes into their own campaign.
          // CSL-authored → the CSL assigns a CSM directly (self-handover).
          // Everyone else → hand over to the CSL group.
          if (isCsmAuthored) {
            return { label: 'CREATE CAMPAIGN', onClick: () => setAssignCsmOpen(true), bg: '#1340FF' };
          }
          return isCslAuthored
            ? { label: 'ASSIGN CSM', onClick: () => setAssignCsmOpen(true), bg: '#1340FF' }
            : { label: 'HANDOVER TO CS', onClick: () => setHandoverOpen(true) };
        case 'PENDING_REVIEW':
          // Public-form submission awaiting BD review. BD reviews/edits, then
          // forwards to the client — same send dialog and transition as DRAFTED.
          return { label: 'SEND TO CLIENT', onClick: () => setSendOpen(true), bg: '#1340FF' };
        case 'HANDED_OVER':
          return { label: 'HANDED OVER', onClick: null };
        default:
          return null;
      }
    })();
    if (!labelAndHandler) return null;
    // Per-action `bg` overrides the status color; otherwise fall back to the
    // draftStatus color from STATUS_CONFIG.
    const color = labelAndHandler.bg || STATUS_CONFIG[brief.draftStatus]?.color || '#9CA3AF';
    return { ...labelAndHandler, bg: color, hover: color };
  })();

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        px: { xs: 2, sm: 3, md: 2 },
        overflowX: 'hidden',
        ...(inDialog
          ? { height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, py: 2 }
          : { pb: 4 }),
      }}
    >
      <BriefFormLayout
        scrollMode={inDialog ? 'internal' : 'page'}
        topLeft={
          <Button
            variant="outlined"
            onClick={() => (inDialog ? onClose?.() : navigate(paths.dashboard.campaign.briefs))}
          >
            {inDialog ? 'Close' : 'Back'}
          </Button>
        }
        leftExtra={
          <>
            {isLocked && (
              <Alert severity="info" icon={<Iconify icon="eva:info-fill" />} sx={{ mt: 4 }}>
                This brief is locked.{' '}
                {brief.draftStatus === 'HANDED_OVER'
                  ? 'It has been handed over to CSL.'
                  : 'Awaiting handover.'}
              </Alert>
            )}
            {brief.draftStatus === 'PENDING_REVIEW' && (
              <Alert severity="info" icon={<Iconify icon="eva:info-fill" />} sx={{ mt: 4 }}>
                Review and edit the fields, any changes you make will be autosaved. Once ready, press
                the &apos;Send to Client&apos; button below to forward this brief for client approval.
              </Alert>
            )}
          </>
        }
      >
        <>
          {/* Linked company + package summary. Read-only — the HandoverDialog is
              where company/package are created/linked. Shown here so BD can
              tell at a glance whether handover is unblocked. */}
          <Box
            sx={{
              mb: 4,
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: linkedActiveSub ? 'background.neutral' : 'transparent',
            }}
          >
            {linkedCompany ? (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ sm: 'center' }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                  <Avatar src={linkedCompany.logo} sx={{ width: 40, height: 40 }}>
                    {linkedCompany.name?.slice(0, 1)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ lineHeight: 1.2 }}>
                      {linkedCompany.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {brief.brand ? 'Brand → Company' : 'Company'}
                    </Typography>
                  </Box>
                </Stack>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                />
                {linkedActiveSub ? (
                  <Stack spacing={0.25} sx={{ flex: 1.4 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2">{linkedPackageName || 'Custom'}</Typography>
                      <Chip size="small" label="Active" color="success" variant="outlined" />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {linkedTotalCredits ?? 0} credits • expires {linkedExpiresAt || '—'}
                    </Typography>
                  </Stack>
                ) : (
                  <Box sx={{ flex: 1.4 }}>
                    <Chip
                      size="small"
                      color="warning"
                      variant="outlined"
                      label="No active package — attach one during handover"
                    />
                  </Box>
                )}
              </Stack>
            ) : (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Iconify icon="eva:link-outline" width={20} sx={{ color: 'text.secondary' }} />
                <Box>
                  <Typography variant="subtitle2">No company linked yet</Typography>
                  <Typography variant="caption" color="text.secondary">
                    You&apos;ll link or create one during handover.
                  </Typography>
                </Box>
              </Stack>
            )}
          </Box>

          <BriefForm
            brief={brief}
            mode="bd-author"
            onSavePatch={onSavePatch}
            onUploadAttachment={onUploadAttachment}
            onDeleteAttachment={onDeleteAttachment}
            readOnly={isLocked}
            clearSignal={clearSignal}
            resetSignal={resetSignal}
          />

          {/* Inline action bar — sits below the form on the right column. */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ mt: 6, pt: 4, borderTop: '1px solid #E5E7EB' }}
          >
            <Button
              variant="outlined"
              onClick={() => (isFromPublicForm ? handleReset() : setClearSignal((n) => n + 1))}
              disabled={isLocked || resetting}
              sx={{
                // Shrink on mobile so SEND TO CLIENT keeps a usable width and
                // doesn't wrap; full padding on larger screens.
                flexShrink: { xs: 1, sm: 0 },
                minWidth: 0,
                px: { xs: 2, sm: 10 },
                py: 1.5,
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#0F172A',
                borderWidth: 1.5,
                color: '#0F172A',
                '&:hover': {
                  borderColor: '#0F172A',
                  borderWidth: 1.5,
                  bgcolor: 'rgba(15, 23, 42, 0.04)',
                },
              }}
            >
              {resetting ? 'RESETTING…' : 'RESET FORM'}
            </Button>
            {primaryAction && (
              <Button
                variant="contained"
                onClick={primaryAction.onClick || undefined}
                disabled={!primaryAction.onClick}
                endIcon={
                  primaryAction.onClick ? (
                    <Iconify icon="eva:arrow-upward-fill" sx={{ transform: 'rotate(45deg)' }} />
                  ) : null
                }
                sx={{
                  flex: 1,
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  px: { xs: 2, sm: 4 },
                  py: 1.5,
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: primaryAction.bg,
                  '&:hover': { bgcolor: primaryAction.hover, filter: 'brightness(0.92)' },
                  '&.Mui-disabled': { bgcolor: primaryAction.bg, opacity: 0.5, color: 'white' },
                }}
              >
                {primaryAction.label}
              </Button>
            )}
          </Stack>
        </>
      </BriefFormLayout>

      <SendToClientDialog
        open={sendOpen}
        brief={brief}
        onClose={() => setSendOpen(false)}
        onSent={() => mutate()}
      />
      <HandoverDialog
        open={handoverOpen}
        brief={brief}
        onClose={() => setHandoverOpen(false)}
        onHandedOver={() => {
          mutate();
          if (inDialog) onClose?.();
          else navigate(paths.dashboard.campaign.briefs);
        }}
      />
      <AssignCsmDialog
        open={assignCsmOpen}
        brief={brief}
        mode={isCsmAuthored ? 'finalize' : 'assign'}
        onClose={() => setAssignCsmOpen(false)}
        onAssigned={() => {
          mutate();
          if (inDialog) onClose?.();
          else navigate(paths.dashboard.campaign.briefs);
        }}
      />
    </Container>
  );
}

CampaignBriefDetailView.propTypes = {
  briefId: PropTypes.string,
  onClose: PropTypes.func,
};
