import { useRef, useMemo, useState } from 'react';

import { ThemeProvider } from '@mui/material/styles';
import { Box, Stack, Button, Skeleton, Container, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';

import { setCurrentTab } from 'src/sections/campaign/discover/admin/store/use-tabs';

import TaskList from './task-list';
import { useClientHome } from './api';
import CampaignCard from './campaign-card';
import CreditsPanel from './credits-panel';
import CampaignFilters from './campaign-filters';
import ClientOnboarding from './client-onboarding';
import {
  FONTS,
  plural,
  reviewTab,
  daysUntil,
  greetingFor,
  ACTION_BLUE,
  REVIEW_TINT,
  CAMPAIGN_TABS,
  sortCampaigns,
  openTaskCounts,
} from './utils';

const EMPTY = [];

// The app theme uses InterDisplay; this page sets Inter on every variant so body text, buttons and inputs follow.
const withBodyFont = (outer) => ({
  ...outer,
  typography: Object.fromEntries(
    Object.entries({ ...outer.typography, fontFamily: FONTS.body }).map(([key, value]) => [
      key,
      value && typeof value === 'object' && 'fontFamily' in value
        ? { ...value, fontFamily: FONTS.body }
        : value,
    ])
  ),
});

export default function ClientHomeView() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { data, isLoading, isError, refetch } = useClientHome();

  const tasksRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');

  const tasks = data?.tasks ?? EMPTY;
  const campaigns = data?.campaigns ?? EMPTY;

  const campaignsById = useMemo(() => new Map(campaigns.map((c) => [c.id, c])), [campaigns]);
  const openCounts = useMemo(() => openTaskCounts(tasks), [tasks]);

  const tabs = CAMPAIGN_TABS.map((t) => ({
    ...t,
    count: campaigns.filter((c) => t.test(c, openCounts)).length,
  }));

  const visibleCampaigns = useMemo(() => {
    const { test } = CAMPAIGN_TABS.find((t) => t.value === tab);
    const q = query.trim().toLowerCase();
    const matches = campaigns.filter(
      (c) =>
        test(c, openCounts) && (!q || `${c.name} ${c.objective || ''}`.toLowerCase().includes(q))
    );
    return sortCampaigns(matches, openCounts);
  }, [campaigns, openCounts, tab, query]);

  const openCampaign = (campaignId, campaignTab) => {
    if (campaignTab) {
      // Campaign tabs read the persisted store and this key on mount.
      setCurrentTab(campaignTab);
      localStorage.setItem('campaigndetail', campaignTab);
    }
    router.push(paths.dashboard.campaign.details(campaignId));
  };

  const selectCampaign = (id) => {
    const next = selectedId === id ? null : id;
    setSelectedId(next);
    if (next) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      tasksRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }
  };

  const resetFilters = () => {
    setTab('all');
    setQuery('');
  };

  const overdue = tasks.filter((t) => daysUntil(t.dueAt) < 0).length;
  const campaignsWaiting = new Set(tasks.map((t) => t.campaignId)).size;
  const firstName = data?.greetingName || user?.name?.split(' ')[0];

  return (
    <ThemeProvider theme={withBodyFont}>
      <Box
        sx={{
          minHeight: 1,
          fontFamily: FONTS.body,
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
          <ClientOnboarding userEmail={user?.email} />

          <Stack spacing={5.5}>
            <Box component="section">
              <Typography
                component="h1"
                sx={{
                  fontFamily: FONTS.serif,
                  fontWeight: 400,
                  fontSize: 'clamp(38px, 5vw, 52px)',
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                  textWrap: 'balance',
                }}
              >
                {greetingFor()}
                {firstName ? `, ${firstName}.` : '.'}
              </Typography>
              <Typography sx={{ mt: 1.25, fontSize: 16, color: 'grey.700' }}>
                {isLoading && <Skeleton width={320} />}
                {!isLoading && tasks.length > 0 && (
                  <>
                    {plural(tasks.length, 'thing')} need{tasks.length === 1 ? 's' : ''} you across{' '}
                    {plural(campaignsWaiting, 'campaign')}.
                    {overdue > 0 && (
                      <Box component="span" sx={{ color: 'error.dark', fontWeight: 500 }}>
                        {' '}
                        {overdue} {overdue === 1 ? 'is' : 'are'} overdue.
                      </Box>
                    )}
                  </>
                )}
                {!isLoading &&
                  !isError &&
                  !tasks.length &&
                  'Nothing is waiting on you. Your campaigns are moving.'}
              </Typography>
            </Box>

            {isError && (
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography sx={{ color: 'text.secondary' }}>
                  Your dashboard couldn&apos;t load.
                </Typography>
                <Button size="small" variant="outlined" onClick={() => refetch()}>
                  Try again
                </Button>
              </Stack>
            )}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 340px' },
                gap: 3,
                alignItems: 'start',
              }}
            >
              <Box ref={tasksRef}>
                {isLoading ? (
                  <Skeleton variant="rounded" height={260} sx={{ borderRadius: '16px' }} />
                ) : (
                  <TaskList
                    tasks={tasks}
                    campaignsById={campaignsById}
                    filterCampaign={campaignsById.get(selectedId) || null}
                    onClearFilter={() => setSelectedId(null)}
                    onOpenTask={(task) =>
                      openCampaign(
                        task.campaignId,
                        reviewTab(task, campaignsById.get(task.campaignId))
                      )
                    }
                  />
                )}
              </Box>
              {isLoading ? (
                <Skeleton variant="rounded" height={260} sx={{ borderRadius: '16px' }} />
              ) : (
                <CreditsPanel credits={data?.credits} />
              )}
            </Box>

            <Box component="section" aria-labelledby="client-home-campaigns">
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                gap={2}
                sx={{ mb: 2 }}
              >
                <Typography
                  id="client-home-campaigns"
                  component="h2"
                  sx={{
                    fontFamily: FONTS.tight,
                    fontWeight: 600,
                    fontSize: 18,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Your campaigns
                </Typography>
                <StageKey />
              </Stack>

              <CampaignFilters
                query={query}
                onQueryChange={setQuery}
                tab={tab}
                onTabChange={setTab}
                tabs={tabs}
              />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'minmax(0, 1fr)',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    lg: 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: 2,
                }}
              >
                {isLoading &&
                  [0, 1, 2].map((i) => (
                    <Skeleton
                      key={i}
                      variant="rounded"
                      height={280}
                      sx={{ borderRadius: '14px' }}
                    />
                  ))}

                {!isLoading &&
                  visibleCampaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      openTasks={openCounts.get(campaign.id) || 0}
                      selected={selectedId === campaign.id}
                      onSelect={selectCampaign}
                      onView={(id) => openCampaign(id)}
                    />
                  ))}

                {!isLoading && !isError && !visibleCampaigns.length && (
                  <Box
                    sx={{
                      gridColumn: '1 / -1',
                      py: 4,
                      px: 3,
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: '14px',
                      textAlign: 'center',
                      fontSize: 14,
                      color: 'text.secondary',
                    }}
                  >
                    {campaigns.length ? (
                      <>
                        No campaigns match.{' '}
                        <Button variant="text" size="small" onClick={resetFilters}>
                          Clear search and filters
                        </Button>
                      </>
                    ) : (
                      'You have no campaigns yet.'
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

function StageKey() {
  const items = [
    { label: 'Current stage', color: ACTION_BLUE },
    { label: 'In review', color: REVIEW_TINT },
    { label: 'Done', color: 'text.primary' },
  ];

  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      gap={2.5}
      aria-hidden="true"
      sx={{ fontSize: 12, color: 'text.secondary' }}
    >
      {items.map((item) => (
        <Stack key={item.label} direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 14, height: 4, borderRadius: '2px', bgcolor: item.color }} />
          <span>{item.label}</span>
        </Stack>
      ))}
    </Stack>
  );
}
