import useSWR from 'swr';
import { useState } from 'react';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import { useSettingsContext } from 'src/components/settings';

import HandoverDialog from 'src/sections/campaign/briefs/dialogs/handover-dialog';
import LostBriefDialog from 'src/sections/campaign/briefs/dialogs/lost-brief-dialog';
import DeleteBriefDialog from 'src/sections/campaign/briefs/dialogs/delete-brief-dialog';
import SendToClientDialog from 'src/sections/campaign/briefs/dialogs/send-to-client-dialog';

import MonthStats from './month-stats';
import PipelineBoard from './pipeline-board';
import BriefPreviewDialog from './brief-preview-dialog';
import { headerCounts, greetingForNow } from './pipeline-utils';

// ----------------------------------------------------------------------

export default function DashboardBdView() {
  const settings = useSettingsContext();
  const { user } = useAuthContext();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [currency, setCurrency] = useState('MYR');

  const [sendTarget, setSendTarget] = useState(null);
  const [handoverTarget, setHandoverTarget] = useState(null);
  const [lostTarget, setLostTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewTarget, setPreviewTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: briefs, isLoading: briefsLoading, mutate: mutateBriefs } = useSWR(
    endpoints.campaignBrief.list,
    fetcher
  );
  const { data: dashboard, isLoading: dashboardLoading, mutate: mutateDashboard } = useSWR(
    endpoints.campaignBrief.bdDashboard,
    fetcher
  );

  const refresh = () => {
    mutateBriefs();
    mutateDashboard();
  };

  const handleCopyLink = async (brief) => {
    if (!brief.clientLink) {
      enqueueSnackbar('No client link available yet', { variant: 'warning' });
      return;
    }
    try {
      await navigator.clipboard.writeText(brief.clientLink);
      enqueueSnackbar('Client link copied', { variant: 'success' });
    } catch {
      enqueueSnackbar('Could not copy — select manually', { variant: 'warning' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(endpoints.campaignBrief.delete(deleteTarget.id));
      enqueueSnackbar('Brief deleted', { variant: 'success' });
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to delete brief', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const actions = {
    onSend: setSendTarget,
    onCopyLink: handleCopyLink,
    onReview: setPreviewTarget,
    onHandover: setHandoverTarget,
    onView: (brief) =>
      router.push(
        brief.status === 'ACTIVE'
          ? paths.dashboard.campaign.adminCampaignDetail(brief.id)
          : paths.dashboard.campaign.briefDetails(brief.id)
      ),
    onLost: setLostTarget,
    onDelete: setDeleteTarget,
  };

  const counts = headerCounts(briefs);
  const firstName = user?.name?.split(' ')[0] || 'there';

  if (briefsLoading && dashboardLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <CircularProgress size={22} sx={{ color: '#1340FF' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ pt: 3 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 4 }}>
        <Box>
          <Typography sx={{ fontFamily: '"Instrument Serif", serif', fontWeight: 400, fontSize: { xs: '2rem', sm: '2.6rem' }, color: '#111827', lineHeight: 1.1 }}>
            {greetingForNow()}, {firstName}.
          </Typography>
          <Typography sx={{ color: '#6b7280', mt: 0.5, fontSize: '0.95rem' }}>
            {counts.needsAttention} {counts.needsAttention === 1 ? 'brief needs' : 'briefs need'} you today ·{' '}
            {counts.activeDeals} active {counts.activeDeals === 1 ? 'deal' : 'deals'}
          </Typography>
        </Box>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={currency}
          onChange={(e, next) => next && setCurrency(next)}
          sx={{
            bgcolor: '#f3f4f6',
            borderRadius: 2,
            p: 0.5,
            '& .MuiToggleButton-root': {
              border: 'none',
              borderRadius: '10px !important',
              px: 2,
              py: 0.5,
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#6b7280',
              '&.Mui-selected': { bgcolor: '#111827', color: '#fff', '&:hover': { bgcolor: '#111827' } },
            },
          }}
        >
          <ToggleButton value="MYR">MYR</ToggleButton>
          <ToggleButton value="SGD">SGD</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Stack spacing={4}>
        <MonthStats data={dashboard} currency={currency} currentUserId={user?.id} />
        <PipelineBoard briefs={briefs} actions={actions} />
      </Stack>

      <BriefPreviewDialog
        open={Boolean(previewTarget)}
        brief={previewTarget}
        onClose={() => setPreviewTarget(null)}
        onChanged={refresh}
      />
      <SendToClientDialog
        open={Boolean(sendTarget)}
        brief={sendTarget}
        onClose={() => setSendTarget(null)}
        onSent={refresh}
      />
      <HandoverDialog
        open={Boolean(handoverTarget)}
        brief={handoverTarget}
        onClose={() => setHandoverTarget(null)}
        onHandedOver={refresh}
      />
      <LostBriefDialog
        open={Boolean(lostTarget)}
        brief={lostTarget}
        onClose={() => setLostTarget(null)}
        onLost={refresh}
      />
      <DeleteBriefDialog
        open={Boolean(deleteTarget)}
        brandName={deleteTarget?.name}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Container>
  );
}
