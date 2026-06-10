import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

import BriefForm from 'src/sections/campaign/briefs/brief-form';
import ConfirmBriefDialog from 'src/sections/campaign/briefs/dialogs/confirm-brief-dialog';
import BriefApprovedDialog from 'src/sections/campaign/briefs/dialogs/brief-approved-dialog';

const SIDE_STEPS = [
  { n: 1, title: 'Share your goals', desc: 'Tell us your audience, objective, and budget' },
  { n: 2, title: 'We do the heavy lifting', desc: 'We map the plan and match you with the right creators' },
  { n: 3, title: 'You call the shots', desc: "Approve and launch when you're ready" },
];

export default function ClientBriefView() {
  const { magicToken } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const [brief, 
    setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preConfirmOpen, setPreConfirmOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approvedOpen, setApprovedOpen] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [resetting, setResetting] = useState(false);

  // Silent refetch: updates the brief in place without flipping the page-level
  // `loading` flag, so the view doesn't unmount to the full-page spinner.
  const refresh = useCallback(async () => {
    const res = await axiosInstance.get(endpoints.campaignBrief.publicGet(magicToken));
    setBrief(res.data);
  }, [magicToken]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.message || 'This link is no longer valid');
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => { load(); }, [load]);

  const onSavePatch = useCallback(
    async (patch) => {
      try {
        const res = await axiosInstance.patch(endpoints.campaignBrief.publicPatch(magicToken), patch);
        if (res.data) setBrief(res.data);
      } catch (err) {
        enqueueSnackbar(err?.response?.data?.message || 'Failed to save', { variant: 'error' });
      }
    },
    [magicToken, enqueueSnackbar]
  );

  const handleResetToSnapshot = useCallback(async () => {
    const snapshot = brief?.clientBriefSnapshot;
    if (!snapshot || resetting) return;
    setResetting(true);
    try {
      const res = await axiosInstance.patch(endpoints.campaignBrief.publicPatch(magicToken), snapshot);
      if (res.data) setBrief(res.data);
      setResetSignal((n) => n + 1);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to reset form', { variant: 'error' });
    } finally {
      setResetting(false);
    }
  }, [brief?.clientBriefSnapshot, resetting, magicToken, enqueueSnackbar]);

  const onUploadAttachment = useCallback(
    async (file) => {
      const fd = new FormData();
      fd.append('brandGuidelines', file);
      try {
        await axiosInstance.post(endpoints.campaignBrief.publicAttachments(magicToken), fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        enqueueSnackbar('Attachment uploaded', { variant: 'success' });
        await refresh();
      } catch (err) {
        enqueueSnackbar(err?.response?.data?.message || 'Failed to upload attachment', { variant: 'error' });
      }
    },
    [magicToken, refresh, enqueueSnackbar]
  );

  const onDeleteAttachment = useCallback(
    async (url) => {
      try {
        await axiosInstance.delete(endpoints.campaignBrief.publicAttachments(magicToken), {
          params: url ? { url } : undefined,
        });
        enqueueSnackbar('Attachment deleted', { variant: 'success' });
        await refresh();
      } catch (err) {
        enqueueSnackbar(err?.response?.data?.message || 'Failed to delete attachment', { variant: 'error' });
      }
    },
    [magicToken, refresh, enqueueSnackbar]
  );

  const handleApprove = async () => {
    setApproving(true);
    try {
      await axiosInstance.post(endpoints.campaignBrief.publicApprove(magicToken));
      setPreConfirmOpen(false);
      setApprovedOpen(true);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to approve', { variant: 'error' });
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !brief) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">{error || 'Not available'}</Alert>
      </Container>
    );
  }

  const alreadyApproved = brief.draftStatus === 'APPROVED' || brief.draftStatus === 'HANDED_OVER';

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 6 }, px: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 4, alignItems: 'flex-start' }}>
        <Box
          sx={{
            position: { md: 'sticky' },
            top: { md: 24 },
            maxHeight: { md: 'calc(100vh - 48px)' },
            overflowY: { md: 'auto' },
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Aileron, sans-serif',
              fontWeight: 700,
              fontStyle: 'normal',
              fontSize: '64px',
              lineHeight: '68px',
              letterSpacing: '-0.06em',
              textTransform: 'capitalize',
              textShadow: '0px 4px 6px rgba(0, 0, 0, 0.25)',
              mb: 2,
            }}
          >
            Your Campaign Starts Hereeeee
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Times New Roman", serif',
              fontWeight: 400,
              fontStyle: 'italic',
              fontSize: '40px',
              lineHeight: '44px',
              letterSpacing: '-0.04em',
              textShadow: '0px 4px 6px rgba(0, 0, 0, 0.25)',
              mb: 5,
              color: '#0F172A',
            }}
          >
            Tell us what you&apos;re building - we&apos;ll handle the rest
          </Typography>
          <Stack spacing={3}>
            {SIDE_STEPS.map((s, idx) => {
              const isLast = idx === SIDE_STEPS.length - 1;
              return (
                <Stack
                  key={s.n}
                  direction="row"
                  spacing={2}
                  alignItems="flex-start"
                  sx={{ position: 'relative' }}
                >
                  <Box
                    sx={{
                      width: 28, height: 28, borderRadius: '50%',
                      bgcolor: '#FFFFFF',
                      border: '2px solid #1340FF',
                      color: '#1340FF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 13, flexShrink: 0,
                      position: 'relative', zIndex: 1,
                    }}
                  >
                    {s.n}
                  </Box>
                  {!isLast && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 13,
                        top: 28,
                        bottom: -24,
                        width: '2px',
                        bgcolor: '#1340FF',
                        zIndex: 0,
                      }}
                    />
                  )}
                  <Box sx={{ pt: 0.25 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 17, color: '#0F172A', lineHeight: 1.2 }}>
                      {s.title}
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: '#6B7280', mt: 0.25 }}>
                      {s.desc}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Stack>
          <Alert
            severity="info"
            icon={<Iconify icon="eva:info-fill" />}
            sx={{ mt: 4, bgcolor: 'transparent', border: 'none', color: '#6B7280', p: 0 }}
          >
            You may edit the fields, any changes you make will be autosaved. Once ready, press the &apos;Approve Brief&apos; button below.
          </Alert>
        </Box>

        <Box sx={{ borderLeft: { md: '1px solid #E5E7EB' }, px: { md: 4 } }}>
          <BriefForm
            brief={brief}
            mode="client-public"
            onSavePatch={onSavePatch}
            onUploadAttachment={onUploadAttachment}
            onDeleteAttachment={onDeleteAttachment}
            readOnly={alreadyApproved}
            resetSignal={resetSignal}
          />

          {!alreadyApproved && (
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 6 }}>
              <Button
                variant="outlined"
                onClick={handleResetToSnapshot}
                disabled={resetting}
                sx={{
                  flexShrink: 0,
                  px: 4, py: 1.5, borderRadius: 999, textTransform: 'none', fontWeight: 600,
                  borderColor: '#0F172A', borderWidth: 1.5, color: '#0F172A',
                  '&:hover': { borderColor: '#0F172A', borderWidth: 1.5, bgcolor: 'rgba(15, 23, 42, 0.04)' },
                }}
              >
                {resetting ? 'RESETTING…' : 'RESET FORM'}
              </Button>
              <Button
                variant="contained"
                onClick={() => setPreConfirmOpen(true)}
                endIcon={<Iconify icon="eva:checkmark-fill" />}
                sx={{
                  flex: 1,
                  px: 4, py: 1.5, borderRadius: 999, textTransform: 'none', fontWeight: 600,
                  bgcolor: '#1340FF',
                  '&:hover': { bgcolor: '#0F33CC' },
                }}
              >
                APPROVE BRIEF
              </Button>
            </Stack>
          )}
          {alreadyApproved && (
            <Alert severity="success" sx={{ mt: 4 }}>This brief has been approved.</Alert>
          )}
        </Box>
      </Box>

      <ConfirmBriefDialog
        open={preConfirmOpen}
        onConfirm={handleApprove}
        onClose={() => setPreConfirmOpen(false)}
        loading={approving}
      />
      <BriefApprovedDialog
        open={approvedOpen}
        mode="client"
        onClose={() => setApprovedOpen(false)}
      />
    </Container>
  );
}
