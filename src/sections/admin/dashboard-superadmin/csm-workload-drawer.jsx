import useSWR from 'swr';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Stack,
  Avatar,
  Drawer,
  Typography,
  IconButton,
  ButtonBase,
  LinearProgress,
  CircularProgress,
} from '@mui/material';

import { fetcher, endpoints } from 'src/utils/axios';
import { formatCurrencyAmount } from 'src/utils/currency';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

const SWR_OPTS = { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 60000 };

const TABS = [
  { value: 'campaigns', label: 'Campaigns', icon: 'hugeicons:megaphone-01', color: '#1340FF' },
  { value: 'clients', label: 'Clients', icon: 'hugeicons:building-06', color: '#1340FF' },
  { value: 'creators', label: 'Creators', icon: 'hugeicons:user-group', color: '#1340FF' },
  { value: 'stats', label: 'Stats', icon: 'hugeicons:clock-01', color: '#10B981' },
];

const STATUS_GROUPS = [
  { key: 'ACTIVE', label: 'Active' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'OTHER', label: 'Other' },
];

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatHours(hours) {
  if (hours == null) return 'N/A';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

function TabStat({ tab, value, active, onClick }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 0.5,
        py: 1,
        px: 1.5,
        borderRadius: '10px',
        border: '1.5px solid',
        borderColor: active ? tab.color : '#e5e7eb',
        bgcolor: active ? `${tab.color}0A` : '#fff',
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
      }}
    >
      <Stack direction="row" spacing={0.6} alignItems="center">
        <Iconify icon={tab.icon} width={13} sx={{ color: active ? tab.color : '#9ca3af' }} />
        <Typography
          sx={{
            fontSize: '0.62rem',
            fontWeight: 700,
            color: active ? tab.color : '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          {tab.label}
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: active ? tab.color : '#111827', lineHeight: 1 }}>
        {value}
      </Typography>
    </ButtonBase>
  );
}

TabStat.propTypes = {
  tab: PropTypes.object.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

function getUsageColor(pct) {
  if (pct >= 90) return '#EF4444';
  if (pct >= 70) return '#F59E0B';
  return '#10B981';
}

function CampaignCard({ campaign }) {
  const pct = campaign.credits > 0 ? Math.min(100, Math.round((campaign.creditsUtilized / campaign.credits) * 100)) : 0;

  const budgetPct =
    campaign.creatorBudget > 0
      ? Math.min(100, Math.round((campaign.creatorBudgetSpent / campaign.creatorBudget) * 100))
      : 0;
  const budgetBarColor = getUsageColor(budgetPct);

  return (
    <Box sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, p: 2, boxShadow: '4px 4px 4px 0px #8D8D9440' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            src={campaign.campaignImage || undefined}
            variant="rounded"
            sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: '#e5e7eb', fontSize: '0.8rem' }}
          >
            {getInitials(campaign.name)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 700, color: '#111827', fontSize: '0.88rem' }} title={campaign.name}>
              {campaign.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9ca3af' }}>
              {campaign.companyName || 'No client'}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0, pl: 1 }}>
          <Iconify icon="hugeicons:user-group" width={13} sx={{ color: '#9ca3af' }} />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>
            {campaign.creatorCount}
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.6 }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
          Campaign Credits
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#111827' }}>{pct}%</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6,
          borderRadius: '999px',
          bgcolor: '#f3f4f6',
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(90deg, #111827 0%, #7c3aed 100%)',
            borderRadius: '999px',
          },
        }}
      />
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.6 }}>
        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
          Utilised: {campaign.creditsUtilized}
        </Typography>
        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
          Pending: {campaign.creditsPending}
        </Typography>
      </Stack>

      {campaign.creatorBudget != null && (
        <Box sx={{ borderTop: '1px solid #f3f4f6', mt: 1.5, pt: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.6 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
              Creator Budget
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#111827' }}>{budgetPct}%</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={budgetPct}
            sx={{
              height: 6,
              borderRadius: '999px',
              bgcolor: '#f3f4f6',
              '& .MuiLinearProgress-bar': { bgcolor: budgetBarColor, borderRadius: '999px' },
            }}
          />
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.6 }}>
            <Typography variant="caption" sx={{ color: '#9ca3af' }}>
              {formatCurrencyAmount(campaign.creatorBudgetSpent, 'MYR')} spent
            </Typography>
            <Typography variant="caption" sx={{ color: '#9ca3af' }}>
              of {formatCurrencyAmount(campaign.creatorBudget, 'MYR')}
            </Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

CampaignCard.propTypes = { campaign: PropTypes.object.isRequired };

function formatValidity(dateValue) {
  if (!dateValue) return null;
  const date = dayjs(dateValue);
  const diffDays = date.startOf('day').diff(dayjs().startOf('day'), 'day');

  let relative;
  if (diffDays < 0) relative = `expired ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago`;
  else if (diffDays === 0) relative = 'expires today';
  else if (diffDays === 1) relative = 'expires tomorrow';
  else if (diffDays < 30) relative = `expires in ${diffDays} days`;
  else if (diffDays < 60) relative = 'expires in a month';
  else relative = `expires in ${Math.round(diffDays / 30)} months`;

  return { dateLabel: date.format('D MMM YYYY'), relative };
}

function ClientCard({ client }) {
  const validity = formatValidity(client.validityEnds);
  const subtitle = client.packageName
    ? `${client.packageName} · ${client.isSubscription ? 'UGC subscription' : 'UGC one-off'}`
    : 'UGC one-off';
  const isActive = client.status === 'Active';

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 2.5,
        overflow: 'hidden',
        boxShadow: '4px 4px 4px 0px #8D8D9440',
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar
              src={client.logo || undefined}
              variant="rounded"
              sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#F3F4F6', flexShrink: 0 }}
            >
              <Iconify icon="hugeicons:building-06" width={20} sx={{ color: '#6b7280' }} />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontWeight: 700, color: '#111827', fontSize: '0.92rem' }} title={client.name}>
                {client.name}
              </Typography>
              <Typography noWrap variant="caption" sx={{ color: '#9ca3af' }}>
                {subtitle}
              </Typography>
            </Box>
          </Stack>
          <Label variant="soft" color={isActive ? 'success' : 'default'} sx={{ flexShrink: 0, fontWeight: 700 }}>
            {client.status}
          </Label>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
          <Box sx={{ flex: 1, bgcolor: '#F9FAFB', borderRadius: '10px', p: 1.5, textAlign: 'center' }}>
            <Typography
              sx={{
                fontSize: '0.62rem',
                fontWeight: 700,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                mb: 0.5,
              }}
            >
              Active Campaigns
            </Typography>
            <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: '#1340FF' }}>
              {client.activeCampaigns}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, bgcolor: '#F9FAFB', borderRadius: '10px', p: 1.5, textAlign: 'center' }}>
            <Typography
              sx={{
                fontSize: '0.62rem',
                fontWeight: 700,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                mb: 0.5,
              }}
            >
              Validity Ends
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>
              {validity ? validity.dateLabel : 'N/A'}
            </Typography>
            {validity && <Typography sx={{ fontSize: '0.65rem', color: '#9ca3af' }}>{validity.relative}</Typography>}
          </Box>
        </Stack>

        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', mb: 1 }}>
          Campaigns ({client.campaigns.length})
        </Typography>

        <Stack spacing={1}>
          {client.campaigns.map((camp) => (
            <Stack
              key={camp.campaignId}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ bgcolor: '#F9FAFB', borderRadius: '10px', px: 1.5, py: 1.1 }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: camp.status === 'ACTIVE' ? '#10B981' : '#9ca3af',
                    flexShrink: 0,
                  }}
                />
                <Typography noWrap sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }} title={camp.name}>
                  {camp.name}
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af', flexShrink: 0, pl: 1 }}>
                {camp.creditsUtilized}/{camp.credits} credits
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

ClientCard.propTypes = { client: PropTypes.object.isRequired };

export default function CSMWorkloadDrawer({ csm, onClose }) {
  const open = !!csm;
  const [tab, setTab] = useState('campaigns');

  // Always start on the Campaigns tab whenever a (new) CSM is selected
  useEffect(() => {
    if (open) setTab('campaigns');
  }, [open, csm?.adminUserId]);

  const { data, isLoading } = useSWR(
    open ? endpoints.analytics.csmWorkloadDetail(csm.adminUserId) : null,
    fetcher,
    SWR_OPTS
  );

  const detail = data?.data;
  const campaigns = useMemo(() => detail?.campaigns || [], [detail]);
  const clients = detail?.clients || [];
  const creators = detail?.creators || [];
  const stats = detail?.stats || {};

  const groupedCampaigns = useMemo(() => {
    const groups = { ACTIVE: [], COMPLETED: [], OTHER: [] };
    campaigns.forEach((c) => {
      if (c.status === 'ACTIVE') groups.ACTIVE.push(c);
      else if (c.status === 'COMPLETED') groups.COMPLETED.push(c);
      else groups.OTHER.push(c);
    });
    return groups;
  }, [campaigns]);

  const tabCounts = {
    campaigns: campaigns.length,
    clients: clients.length,
    creators: creators.length,
    stats: formatHours(stats.avgSubmissionResponseHours),
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0, 0, 0, 0.6)' } } }}
      PaperProps={{
        sx: {
          width: { xs: 1, sm: 480 },
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 40px -4px rgba(145, 158, 171, 0.24)',
          borderLeft: '1px solid #e5e7eb',
        },
      }}
    >
      {open && (
        <>
          {/* Sticky header */}
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              bgcolor: '#fff',
              borderBottom: '1px solid #e5e7eb',
              flexShrink: 0,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 2.5, px: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  src={csm.photo || undefined}
                  sx={{ width: 44, height: 44, bgcolor: '#e5e7eb', color: '#374151', fontWeight: 700 }}
                >
                  {getInitials(csm.name)}
                </Avatar>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"Instrument Serif", serif',
                      fontWeight: 400,
                      fontSize: '1.35rem',
                      color: '#111827',
                      lineHeight: 1.3,
                    }}
                  >
                    {csm.name || 'Unnamed'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                    {csm.role === 'CSL' ? 'Customer Success Lead' : 'Customer Success'} · {csm.email}
                  </Typography>
                </Box>
              </Stack>
              <IconButton onClick={onClose} sx={{ mt: -1 }}>
                <Iconify icon="eva:close-fill" width={22} />
              </IconButton>
            </Stack>

            {/* Tab row */}
            <Stack direction="row" spacing={1} sx={{ mx: 2.5, mt: 2, mb: 2 }}>
              {TABS.map((t) => (
                <TabStat
                  key={t.value}
                  tab={t}
                  value={tabCounts[t.value]}
                  active={tab === t.value}
                  onClick={() => setTab(t.value)}
                />
              ))}
            </Stack>
          </Box>

          {/* Scrollable content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#F9FAFB' }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={20} sx={{ color: '#1340FF' }} />
              </Box>
            ) : (
              <>
                {tab === 'campaigns' && (
                  <Stack spacing={2.5}>
                    {STATUS_GROUPS.map(
                      (group) =>
                        groupedCampaigns[group.key].length > 0 && (
                          <Box key={group.key}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>
                                {group.label}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                                {groupedCampaigns[group.key].length} campaign
                                {groupedCampaigns[group.key].length === 1 ? '' : 's'}
                              </Typography>
                            </Stack>
                            <Stack spacing={1.5}>
                              {groupedCampaigns[group.key].map((c) => (
                                <CampaignCard key={c.campaignId} campaign={c} />
                              ))}
                            </Stack>
                          </Box>
                        )
                    )}
                    {campaigns.length === 0 && (
                      <Typography variant="body2" sx={{ color: '#9ca3af', textAlign: 'center', py: 4 }}>
                        No campaigns found
                      </Typography>
                    )}
                  </Stack>
                )}

                {tab === 'clients' && (
                  <Stack spacing={1.5}>
                    {clients.map((client) => (
                      <ClientCard key={client.companyId} client={client} />
                    ))}
                    {clients.length === 0 && (
                      <Typography variant="body2" sx={{ color: '#9ca3af', textAlign: 'center', py: 4 }}>
                        No clients found
                      </Typography>
                    )}
                  </Stack>
                )}

                {tab === 'creators' && (
                  <Stack spacing={1.5}>
                    {creators.map((creator) => (
                      <Box
                        key={creator.userId}
                        sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, p: 2 }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar
                            src={creator.photo || undefined}
                            sx={{ width: 36, height: 36, bgcolor: '#e5e7eb', fontSize: '0.8rem' }}
                          >
                            {getInitials(creator.name)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography noWrap sx={{ fontWeight: 700, color: '#111827', fontSize: '0.88rem' }}>
                              {creator.name}
                            </Typography>
                            <Typography noWrap variant="caption" sx={{ color: '#9ca3af' }} title={creator.campaignNames.join(', ')}>
                              {creator.campaignCount} campaign{creator.campaignCount === 1 ? '' : 's'} ·{' '}
                              {creator.campaignNames.join(', ')}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    ))}
                    {creators.length === 0 && (
                      <Typography variant="body2" sx={{ color: '#9ca3af', textAlign: 'center', py: 4 }}>
                        No creators found
                      </Typography>
                    )}
                  </Stack>
                )}

                {tab === 'stats' && (
                  <Stack spacing={1.5}>
                    <Box sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, p: 2.5 }}>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', mb: 1 }}>
                        Avg. Agreement Response
                      </Typography>
                      <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, color: '#111827' }}>
                        {formatHours(stats.avgAgreementResponseHours)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                        Time from agreement sent to creator signing
                      </Typography>
                    </Box>
                    <Box sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, p: 2.5 }}>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', mb: 1 }}>
                        Avg. Submission Response
                      </Typography>
                      <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, color: '#111827' }}>
                        {formatHours(stats.avgSubmissionResponseHours)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                        Time from agreement signed to first draft submitted
                      </Typography>
                    </Box>
                  </Stack>
                )}
              </>
            )}
          </Box>
        </>
      )}
    </Drawer>
  );
}

CSMWorkloadDrawer.propTypes = {
  csm: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
