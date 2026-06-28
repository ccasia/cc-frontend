import useSWR from 'swr';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { useMemo, useState, useEffect } from 'react';

import { Person } from '@mui/icons-material';
import {
  Box,
  Grid,
  Card,
  Stack,
  Avatar,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';

import AgreementsPendingModal from './AgreementsPendingModal';
import DraftsPendingModal from './DraftsPendingModal';
import PitchesPendingModal from './PitchesPendingModal';
import LinksToApproveModal from './LinksToApproveModal';
import ClientFeedbacksModal from './ClientFeedbacksModal';
import OverdueInvoicesModal from './OverdueInvoicesModal';

dayjs.extend(relativeTime);

const SWR_OPTS = { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 120000 };

const STAT_ITEMS = (campaigns, stats, attention, avgResponseDisplay) => [
  { label: 'ACTIVE\nCAMPAIGNS', value: campaigns.length, bg: '#1a2b5e', icon: 'hugeicons:megaphone-01' },
  { label: 'ACTIVE\nCLIENTS', value: stats.totalClients || 0, bg: '#1a3a5c', icon: 'hugeicons:building-06' },
  { label: 'ACTIVE\nCREATORS', value: stats.totalCreators || 0, bg: '#1c3450', icon: 'hugeicons:user-group' },
  { label: 'TOTAL\nCREDITS', value: stats.totalPitches || 0, bg: '#991b1b', icon: 'hugeicons:chart-histogram' },
  { label: 'ACTIVE\nCREDITS', value: stats.approvedPitches || 0, bg: '#92400e', icon: 'hugeicons:tick-double-01' },
  { label: 'PENDING\nCREDITS', value: stats.pendingPitches || 0, bg: '#9d174d', icon: 'hugeicons:clock-01' },
  { label: 'COMPLETED\nCAMPAIGNS', value: stats.completedCampaigns || 0, bg: '#065f46', icon: 'hugeicons:checkmark-circle-01' },
  { label: 'AVG RESPONSE\nTIME', value: avgResponseDisplay, bg: '#4c1d95', icon: 'hugeicons:timer-01' },
  { label: 'AVG CLIENT\nREJECTION RATE', value: attention.avgClientRejectionRate != null ? `${attention.avgClientRejectionRate}%` : '0%', bg: '#7c2d12', icon: 'hugeicons:credit-card' },
];

const ATTENTION_ITEMS = (attention) => [
  { label: 'AGREEMENTS WITH PENDING REVIEW', count: attention.agreementsPendingReview || 0, bg: '#f59e0b', icon: 'hugeicons:agreement-02', modalKey: 'agreements' },
  { label: 'SUBMISSIONS WITH PENDING REVIEW', count: attention.submissionsPendingReview || 0, bg: '#f59e0b', icon: 'hugeicons:download-04', modalKey: 'drafts' },
  { label: 'PITCHES WITH PENDING REVIEW', count: attention.pitchesPendingReview || 0, bg: '#f59e0b', icon: 'hugeicons:megaphone-01', modalKey: 'pitches' },
  { label: 'LINKS TO APPROVE', count: attention.linksToApprove || 0, bg: '#f97316', icon: 'hugeicons:link-circle-02', modalKey: 'links' },
  { label: 'CLIENT FEEDBACKS', count: attention.clientFeedbacks || 0, bg: '#ef4444', icon: 'hugeicons:customer-support', modalKey: 'clientFeedbacks' },
  { label: 'OVERDUE INVOICES', count: attention.overdueInvoices || 0, bg: '#dc2626', icon: 'hugeicons:invoice-02', modalKey: 'overdue' },
];


const DashboardSuperadmin = () => {
  const { data: campaignsData, isLoading: campaignsLoading } = useSWR(endpoints.dashboard.campaigns, fetcher, SWR_OPTS);
  const { data: dashboardStats, isLoading: statsLoading } = useSWR(endpoints.dashboard.stats, fetcher, SWR_OPTS);
  const { data: attentionData } = useSWR(endpoints.dashboard.attention, fetcher, { ...SWR_OPTS, dedupingInterval: 60000 });
  const { data: newlyApprovedData, isLoading: newlyApprovedLoading } = useSWR(endpoints.dashboard.newlyApproved, fetcher, SWR_OPTS);

  const campaigns = useMemo(
    () => (Array.isArray(campaignsData) ? campaignsData : campaignsData?.data || []),
    [campaignsData]
  );

  const { socket } = useSocketContext();
  const [onlineUsers, setOnlineUsers] = useState(null);
  const [agreementsModalOpen, setAgreementsModalOpen] = useState(false);
  const [draftsModalOpen, setDraftsModalOpen] = useState(false);
  const [pitchesModalOpen, setPitchesModalOpen] = useState(false);
  const [linksModalOpen, setLinksModalOpen] = useState(false);
  const [clientFeedbacksModalOpen, setClientFeedbacksModalOpen] = useState(false);
  const [overdueModalOpen, setOverdueModalOpen] = useState(false);
  const { user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    socket?.emit('online-user');
    socket?.on('onlineUsers', (data) => setOnlineUsers(data.onlineUsers));
    return () => { socket?.off('onlineUsers'); };
  }, [socket]);

  const stats = dashboardStats?.data || {};
  const attention = attentionData || {};
  const newlyApproved = Array.isArray(newlyApprovedData) ? newlyApprovedData : [];

  const recentActivity = useMemo(() => {
    const events = [];
    campaigns.forEach((campaign) => {
      (campaign.pitch || []).forEach((pitch) => {
        events.push({
          id: `pitch-${pitch.id}`,
          actor: pitch.user?.name || 'A creator',
          action: 'submitted a pitch for',
          target: campaign.name,
          time: pitch.createdAt,
          campaignId: campaign.id,
        });
      });
    });
    return events.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
  }, [campaigns]);

  const avgResponseDisplay = useMemo(() => {
    const h = attention.avgResponseHours;
    if (!h) return 'N/A';
    if (h < 1) return `${Math.round(h * 60)}m`;
    if (h < 24) return `${Math.round(h * 10) / 10}h`;
    return `${(h / 24).toFixed(1)}d`;
  }, [attention.avgResponseHours]);

  if (statsLoading || campaignsLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <CircularProgress size={20} sx={{ color: '#1340FF' }} />
      </Box>
    );
  }

  const statItems = STAT_ITEMS(campaigns, stats, attention, avgResponseDisplay);
  const attentionItems = ATTENTION_ITEMS(attention);

  return (
    <Box sx={{ py: 3, px: { xs: 1, sm: 0 }, minHeight: '100vh' }}>

      {/* Greeting header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Avatar
          src={user?.photoURL}
          sx={{ width: 64, height: 64, bgcolor: '#d1d5db', fontSize: '1.5rem', fontWeight: 700, color: '#374151' }}
        >
          {user?.name?.charAt(0)?.toUpperCase() || 'A'}
        </Avatar>
        <Box>
          <Typography
            sx={{
              fontFamily: '"Instrument Serif", serif',
              fontSize: { xs: '1.8rem', sm: '2.4rem' },
              fontWeight: 400,
              color: '#111827',
              lineHeight: 1.2,
            }}
          >
            Hi {user?.name?.split(' ')[0]}!
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
            Keep up the good work! Here&apos;s what is relevant to you right now.
          </Typography>
        </Box>
        {onlineUsers !== null && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 'auto' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} />
            <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.85rem' }}>
              {onlineUsers} online
            </Typography>
          </Stack>
        )}
      </Stack>

      <Grid container spacing={3}>

        {/* LEFT — Stats + Recent Activity */}
        <Grid item xs={12} md={7}>
          <Stack spacing={1.5}>

            {/* Your Stats card */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 2, fontFamily: "'Inter Display', Inter, sans-serif" }}>
                Your Stats
              </Typography>
              <Card sx={{ borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#fff', boxShadow: 'none', overflow: 'hidden' }}>
                <Grid container>
                  {statItems.map((item, idx) => (
                    <Grid
                      item
                      xs={4}
                      key={idx}
                      sx={{
                        px: 2.5,
                        py: 3.5,
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            bgcolor: item.bg,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Iconify icon={item.icon} width={22} sx={{ color: '#fff' }} />
                        </Box>
                        <Box>
                          <Typography
                            sx={{
                              fontFamily: "'Inter Display', Inter, sans-serif",
                              fontSize: '0.64rem',
                              fontWeight: 600,
                              color: '#9ca3af',
                              letterSpacing: '0.01em',
                              textTransform: 'uppercase',
                              lineHeight: 1.35,
                              whiteSpace: 'pre-line',
                            }}
                          >
                            {item.label}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '1.55rem',
                              fontWeight: 700,
                              color: '#111827',
                              lineHeight: 1.1,
                              mt: 0.3,
                            }}
                          >
                            {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Box>

            {/* Recent Activity */}
            <Box sx={{ mt: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#22c55e', flexShrink: 0 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', fontFamily: "'Inter Display', Inter, sans-serif" }}>
                  Recent Activity
                </Typography>
              </Stack>
              <Stack spacing={0.5}>
                {recentActivity.map((event) => (
                  <Stack
                    key={event.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.875rem' }}>
                      <Box component="span" sx={{ fontWeight: 700 }}>{event.actor}</Box>{' '}
                      {event.action}{' '}
                      <Box component="span" sx={{ fontWeight: 700 }}>{event.target}</Box>
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9ca3af', flexShrink: 0, ml: 2, whiteSpace: 'nowrap' }}>
                      {dayjs(event.time).fromNow()}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

          </Stack>
        </Grid>

        {/* RIGHT — Needs your attention */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 2, fontFamily: "'Inter Display', Inter, sans-serif" }}>
            Needs your attention
          </Typography>
          <Stack spacing={2}>
            {attentionItems.map((item, idx) => (
              <Card
                key={idx}
                onClick={() => {
                  if (item.modalKey === 'agreements') {
                    setAgreementsModalOpen(true);
                  } else if (item.modalKey === 'drafts') {
                    setDraftsModalOpen(true);
                  } else if (item.modalKey === 'pitches') {
                    setPitchesModalOpen(true);
                  } else if (item.modalKey === 'links') {
                    setLinksModalOpen(true);
                  } else if (item.modalKey === 'clientFeedbacks') {
                    setClientFeedbacksModalOpen(true);
                  } else if (item.modalKey === 'overdue') {
                    setOverdueModalOpen(true);
                  } else {
                    router.push(item.path || paths.dashboard.campaign.root);
                  }
                }}
                sx={{
                  width: 411,
                  height: 72,
                  borderRadius: '20px',
                  p: '12px',
                  bgcolor: '#F5F5F5',
                  boxShadow: '0px 4px 4px 0px #8E8E9340',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  gap: '10px',
                  '&:hover': { bgcolor: '#ebebeb' },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 1.5,
                      bgcolor: item.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Iconify icon={item.icon} width={20} sx={{ color: '#fff' }} />
                  </Box>
                  <Typography
                    sx={{
                      flex: 1,
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      color: '#636366',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      lineHeight: 1.3,
                      fontFamily: "'Inter Display', Inter, sans-serif",
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    sx={{ fontSize: '1.3rem', fontWeight: 700, color: item.bg, flexShrink: 0, mx: 0.5 }}
                  >
                    {item.count}
                  </Typography>
                  <Iconify icon="mingcute:right-line" width={18} sx={{ color: '#9ca3af', flexShrink: 0 }} />
                </Stack>
              </Card>
            ))}
          </Stack>
        </Grid>

      </Grid>

      {/* Newly Approved Creators */}
      <Box sx={{ borderTop: '1px solid #EBEBEB', mt: 6, mb: 4 }} />
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 0.5, fontFamily: "'Inter Display', Inter, sans-serif" }}>
          Newly Approved Creators
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280', mb: 2.5 }}>
          These creators have been approved by your Clients, send out their agreements next!
        </Typography>

        {newlyApprovedLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={20} sx={{ color: '#1340FF' }} />
          </Box>
        )}

        {!newlyApprovedLoading && newlyApproved.length > 0 && (
          <Grid container spacing={2}>
            {newlyApproved.slice(0, 8).map((item) => (
              <Grid item xs={12} sm={6} key={item.id}>
                <Card
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #e5e7eb',
                    bgcolor: '#fff',
                    boxShadow: 'none',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar
                      src={item.user?.photoURL}
                      sx={{ width: 48, height: 48, bgcolor: '#e5e7eb' }}
                    >
                      {item.user?.name?.charAt(0)?.toUpperCase() || <Person />}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}
                      >
                        {item.user?.name || 'Unknown Creator'}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#6b7280',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.campaign?.name} &bull; {dayjs(item.shortlisted_date).fromNow()}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.campaign?.id) {
                          router.push(paths.dashboard.campaign.adminCampaignDetail(item.campaign.id));
                        }
                      }}
                      sx={{
                        width: 80,
                        height: 40,
                        borderRadius: '12px',
                        p: '12px',
                        bgcolor: '#3A3A3C',
                        boxShadow: '0px 3px 0px 0px #000000',
                        border: 'none',
                        cursor: 'pointer',
                        // transition: 'all 0.15s ease',
                        gap: '10px',
                        '&:hover': { bgcolor: '#000000' },
                      }}
                    >
                      View
                    </Button>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {!newlyApprovedLoading && newlyApproved.length === 0 && (
          <Card
            sx={{
              p: 4,
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              bgcolor: '#fff',
              boxShadow: 'none',
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
              No newly approved creators
            </Typography>
          </Card>
        )}
      </Box>

      <AgreementsPendingModal
        open={agreementsModalOpen}
        onClose={() => setAgreementsModalOpen(false)}
      />
      <DraftsPendingModal
        open={draftsModalOpen}
        onClose={() => setDraftsModalOpen(false)}
      />
      <PitchesPendingModal
        open={pitchesModalOpen}
        onClose={() => setPitchesModalOpen(false)}
      />
      <LinksToApproveModal
        open={linksModalOpen}
        onClose={() => setLinksModalOpen(false)}
      />
      <ClientFeedbacksModal
        open={clientFeedbacksModalOpen}
        onClose={() => setClientFeedbacksModalOpen(false)}
      />
      <OverdueInvoicesModal
        open={overdueModalOpen}
        onClose={() => setOverdueModalOpen(false)}
      />
    </Box>
  );
};

export default DashboardSuperadmin;
