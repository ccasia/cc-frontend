import { useState, useMemo, useCallback } from 'react';

import { Helmet } from 'react-helmet-async';

import { Box, Fade, Grid, Stack, Rating, Button, Container } from '@mui/material';

import DateFilterSelect from 'src/sections/feedback/components/date-filter-select';
import useGetCreatorGrowth from 'src/hooks/use-get-creator-growth';
import useGetActivationRate from 'src/hooks/use-get-activation-rate';

import KpiCard from './v2/components/kpi-card';
import { CHART_COLORS } from './v2/chart-config';
import { DateFilterProvider, useDateFilter, useFilteredData, useIsDaily, useTrendLabel } from './v2/date-filter-context';
import RejectionRateCard from './v2/admins/rejection-rate-card';
import CreditsPerCSChart from './v2/admins/credits-per-cs-chart';
import RequireChangesChart from './v2/admins/require-changes-chart';
import PitchRateChart from './v2/creators/pitch-rate-chart';
// Admin charts
import CreatorEarningsChart from './v2/admins/creator-earnings-chart';
import TopShortlistedCreatorsChart from './v2/admins/top-shortlisted-creators-chart';
import CreatorNpsChart from './v2/creators/creator-nps-chart';
import RejectionReasonsChart from './v2/admins/rejection-reasons-chart';
// Creator charts
import CreatorGrowthChart from './v2/creators/creator-growth-chart';
import ResponseTimeCharts from './v2/creators/response-time-charts';
import ActivationRateChart from './v2/creators/activation-rate-chart';
import TimeToActivationChart from './v2/creators/time-to-activation-chart';
import CreatorRetentionChart from './v2/creators/creator-retention-chart';
import MediaKitActivationChart from './v2/creators/media-kit-activation-chart';
// Mock data for top-level KPIs
import {
  MOCK_NPS,
  MOCK_NPS_TREND,
  MOCK_RETENTION,
} from './v2/mock-data';

const TABS = [
  { value: 'creators', label: 'Creators' },
  { value: 'admins', label: 'Admins' },
];

function KpiCards() {
  const trendLabel = useTrendLabel();
  const { startDate, endDate } = useDateFilter();
  const isDaily = useIsDaily();

  const hookOptions = useMemo(() => {
    if (isDaily && startDate && endDate) {
      return { granularity: 'daily', startDate, endDate };
    }
    return {};
  }, [isDaily, startDate, endDate]);

  const { creatorGrowth, periodComparison } = useGetCreatorGrowth(hookOptions);
  const { activationRate, periodComparison: activationPeriodComparison } = useGetActivationRate(hookOptions);

  // Always call hooks unconditionally — use monthly filtered only when not daily
  const monthlyFiltered = useFilteredData(creatorGrowth);
  const filteredGrowth = isDaily ? creatorGrowth : monthlyFiltered;

  const monthlyFilteredActivation = useFilteredData(activationRate);
  const filteredActivation = isDaily ? activationRate : monthlyFilteredActivation;
  const filteredRetention = useFilteredData(MOCK_RETENTION);
  const filteredNpsTrend = useFilteredData(MOCK_NPS_TREND);

  const latestCreators = filteredGrowth[filteredGrowth.length - 1] || {};
  const prevCreators = filteredGrowth[filteredGrowth.length - 2];

  // For daily mode, use period comparison from backend; for monthly, use growthRate
  const creatorTrend = isDaily && periodComparison
    ? periodComparison.percentChange
    : (latestCreators.growthRate ?? 0);

  const latestActivation = filteredActivation[filteredActivation.length - 1] || {};
  const prevActivation = filteredActivation[filteredActivation.length - 2];
  const latestRetention = filteredRetention[filteredRetention.length - 1] || {};
  const prevRetention = filteredRetention[filteredRetention.length - 2];
  const latestNps = filteredNpsTrend[filteredNpsTrend.length - 1] || {};
  const prevNps = filteredNpsTrend[filteredNpsTrend.length - 2];
  const npsTrend = prevNps
    ? Math.round(((latestNps.rating - prevNps.rating) / prevNps.rating) * 1000) / 10
    : 0;

  return (
    <Grid container spacing={2} sx={{ mb: -1 }}>
      <Grid item xs={6} sm={6} md={3}>
        <KpiCard
          title="Total Creators"
          value={latestCreators.total ? latestCreators.total.toLocaleString() : '—'}
          trend={creatorTrend}
          trendLabel={trendLabel}
          subtitle="All registered creators"
          sparklineData={filteredGrowth.map((d) => isDaily ? d.newSignups : d.total)}
          sparklineColor={CHART_COLORS.primary}
        />
      </Grid>
      <Grid item xs={6} sm={6} md={3}>
        <KpiCard
          title="Activation Rate"
          value={latestActivation.rate != null ? `${latestActivation.rate}%` : '—'}
          trend={(() => {
            if (isDaily && activationPeriodComparison) return activationPeriodComparison.percentChange;
            if (prevActivation) return Math.round((latestActivation.rate - prevActivation.rate) * 10) / 10;
            return 0;
          })()}
          trendLabel={trendLabel}
          subtitle="Payment form completed"
          sparklineData={filteredActivation.map((d) => d.rate)}
          sparklineColor={CHART_COLORS.success}
        />
      </Grid>
      <Grid item xs={6} sm={6} md={3}>
        <KpiCard
          title="Retention Rate"
          value={latestRetention.rate != null ? `${latestRetention.rate}%` : '—'}
          trend={prevRetention ? Math.round((latestRetention.rate - prevRetention.rate) * 10) / 10 : 0}
          trendLabel={trendLabel}
          subtitle="2+ campaigns"
          sparklineData={filteredRetention.map((d) => d.rate)}
          sparklineColor={CHART_COLORS.secondary}
        />
      </Grid>
      <Grid item xs={6} sm={6} md={3}>
        <KpiCard
          title="Avg Rating"
          value={latestNps.rating ?? MOCK_NPS.averageRating}
          trend={npsTrend}
          trendLabel={trendLabel}
          subtitle={`from ${MOCK_NPS.totalResponses} responses`}
          sparklineData={filteredNpsTrend.map((d) => d.rating)}
          sparklineColor={CHART_COLORS.warning}
          headerExtra={
            <Rating
              value={latestNps.rating ?? MOCK_NPS.averageRating}
              precision={0.1}
              readOnly
              size="small"
              sx={{ color: '#FFAB00', mt: 0.75 }}
            />
          }
        />
      </Grid>
    </Grid>
  );
}

export default function AnalyticViewV2() {
  const [currentTab, setCurrentTab] = useState('creators');
  const [dateFilter, setDateFilter] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);

  const handleDateFilterChange = useCallback(({ preset, startDate, endDate }) => {
    setDateFilter(preset);
    setFilterStartDate(startDate);
    setFilterEndDate(endDate);
  }, []);

  return (
    <>
      <Helmet>
        <title>Analytics</title>
      </Helmet>

      <Container maxWidth="xl">
        {/* Tabs + Date Filter */}
        <Box sx={{ mb: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '1px',
                bgcolor: 'divider',
              },
            }}
          >
            {/* Tabs — left */}
            <Stack direction="row" spacing={0.5} sx={{ overflow: 'auto', flexShrink: 0 }}>
              {TABS.map((tab) => (
                <Button
                  key={tab.value}
                  disableRipple
                  size="large"
                  onClick={() => setCurrentTab(tab.value)}
                  sx={{
                    px: 1.2,
                    py: 0.5,
                    pb: 1,
                    minWidth: 'fit-content',
                    color: currentTab === tab.value ? '#221f20' : '#8e8e93',
                    position: 'relative',
                    fontSize: { xs: '0.9rem', sm: '1.05rem' },
                    fontWeight: 650,
                    whiteSpace: 'nowrap',
                    mr: { xs: 1, sm: 2 },
                    textTransform: 'none',
                    transition: 'transform 0.1s ease-in-out',
                    '&:focus': { outline: 'none', bgcolor: 'transparent' },
                    '&:active': { transform: 'scale(0.95)', bgcolor: 'transparent' },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      width: currentTab === tab.value ? '100%' : '0%',
                      bgcolor: '#1340ff',
                      transition: 'all 0.3s ease-in-out',
                      transform: 'scaleX(1)',
                      transformOrigin: 'left',
                    },
                    '&:hover': {
                      bgcolor: 'transparent',
                      '&::after': {
                        width: '100%',
                        opacity: currentTab === tab.value ? 1 : 0.5,
                      },
                    },
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </Stack>

            {/* Date filter — right */}
            <Box sx={{ ml: { xs: 0, sm: 'auto' }, pb: 0.5, mt: { xs: 1, sm: 0 } }}>
              <DateFilterSelect
                value={dateFilter}
                startDate={filterStartDate}
                endDate={filterEndDate}
                onChange={handleDateFilterChange}
              />
            </Box>
          </Stack>
        </Box>

        <DateFilterProvider dateFilter={dateFilter} startDate={filterStartDate} endDate={filterEndDate}>
          {/* Top-Level KPI Cards */}
          <KpiCards />

          {/* Tab Content */}
          <Fade in={currentTab === 'creators'} timeout={200} unmountOnExit>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <CreatorGrowthChart />
              </Grid>
              <Grid item xs={12} md={6}>
                <ActivationRateChart />
              </Grid>
              <Grid item xs={12} md={6}>
                <TimeToActivationChart />
              </Grid>
              <Grid item xs={12} md={6}>
                <MediaKitActivationChart />
              </Grid>
              <Grid item xs={12} md={6}>
                <PitchRateChart />
              </Grid>
              <Grid item xs={12} md={6}>
                <CreatorRetentionChart />
              </Grid>
              <Grid item xs={12} md={6}>
                <CreatorNpsChart />
              </Grid>
              <Grid item xs={12}>
                <ResponseTimeCharts />
              </Grid>
            </Grid>
          </Fade>

          <Fade in={currentTab === 'admins'} timeout={200} unmountOnExit>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <RejectionRateCard />
              </Grid>
              <Grid item xs={12} md={6}>
                <RequireChangesChart />
              </Grid>
              <Grid item xs={12} md={6}>
                <RejectionReasonsChart />
              </Grid>
              <Grid item xs={12} md={6}>
                <CreditsPerCSChart />
              </Grid>
              <Grid item xs={12}>
                <CreatorEarningsChart />
              </Grid>
              <Grid item xs={12}>
                <TopShortlistedCreatorsChart />
              </Grid>
            </Grid>
          </Fade>
        </DateFilterProvider>
      </Container>
    </>
  );
}
