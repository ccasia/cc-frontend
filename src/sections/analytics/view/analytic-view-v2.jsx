import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

import { Helmet } from 'react-helmet-async';

import { Box, Fade, Grid, Stack, Rating, Button, Container, Popover, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import DateFilterSelect from 'src/sections/feedback/components/date-filter-select';
import useGetCreatorGrowth from 'src/hooks/use-get-creator-growth';
import useGetActivationRate from 'src/hooks/use-get-activation-rate';
import useGetCreatorSatisfaction from 'src/hooks/use-get-creator-satisfaction';

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
  MOCK_RETENTION,
} from './v2/mock-data';

const AMBER = '#FFAB00';
const BAR_BG = '#F4F6F8';

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
  const { trend: npsTrend, overall: npsOverall } = useGetCreatorSatisfaction();
  const filteredRetention = useFilteredData(MOCK_RETENTION);
  const filteredNpsTrend = useFilteredData(npsTrend);

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
  // Filter to non-null rating entries for trend calculation
  const nonNullNps = useMemo(() => filteredNpsTrend.filter((d) => d.avgRating != null), [filteredNpsTrend]);
  const latestNps = nonNullNps[nonNullNps.length - 1];
  const prevNps = nonNullNps.length >= 2 ? nonNullNps[nonNullNps.length - 2] : undefined;
  const npsTrendChange = prevNps && latestNps
    ? Math.round((latestNps.avgRating - prevNps.avgRating) * 10) / 10
    : 0;

  // Hover popover state for rating breakdown
  const ratingAnchorRef = useRef(null);
  const [ratingPopoverOpen, setRatingPopoverOpen] = useState(false);
  const ratingTimeoutRef = useRef(null);

  const handleRatingEnter = useCallback(() => {
    clearTimeout(ratingTimeoutRef.current);
    setRatingPopoverOpen(true);
  }, []);

  const handleRatingLeave = useCallback(() => {
    ratingTimeoutRef.current = setTimeout(() => setRatingPopoverOpen(false), 150);
  }, []);

  useEffect(() => () => clearTimeout(ratingTimeoutRef.current), []);

  const { averageRating, totalResponses, distribution } = npsOverall;
  const reversed = [...distribution].reverse();
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  const ratingValue = averageRating != null && averageRating !== 0 ? Number(averageRating).toFixed(1) : '—';

  return (
    <>
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
            value={ratingValue}
            trend={npsTrendChange}
            trendSuffix=""
            trendLabel={trendLabel}
            subtitle={`from ${totalResponses} responses`}
            sparklineData={filteredNpsTrend.map((d) => d.avgRating)}
            sparklineColor={CHART_COLORS.warning}
            valueRef={ratingAnchorRef}
            onValueMouseEnter={handleRatingEnter}
            onValueMouseLeave={handleRatingLeave}
            valueStyles={{
              borderBottom: '1.5px dashed #E8ECEE',
              pb: 0.25,
              cursor: 'default',
              transition: 'border-color 0.2s',
              '&:hover': { borderColor: AMBER },
            }}
          />
        </Grid>
      </Grid>

      {/* Rating breakdown popover */}
      <Popover
        open={ratingPopoverOpen}
        anchorEl={ratingAnchorRef.current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            onMouseEnter: handleRatingEnter,
            onMouseLeave: handleRatingLeave,
            sx: {
              mt: 1,
              p: 2,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #F0F2F4',
              minWidth: 280,
            },
          },
        }}
        disableRestoreFocus
        sx={{ pointerEvents: 'none', '& .MuiPopover-paper': { pointerEvents: 'auto' } }}
      >
        {/* Rating + stars */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography sx={{ fontSize: 32, fontWeight: 700, lineHeight: 1, color: '#333' }}>
            {averageRating}
            <Typography component="span" sx={{ fontSize: 16, fontWeight: 500, color: '#999', ml: 0.3 }}>
              /5
            </Typography>
          </Typography>
          <Stack spacing={0.25}>
            <Rating value={averageRating} precision={0.1} readOnly size="small" sx={{ color: AMBER }} />
            <Typography sx={{ color: '#919EAB', fontSize: '0.7rem', fontWeight: 500 }}>
              {totalResponses} responses
            </Typography>
          </Stack>
        </Stack>

        {/* Divider */}
        <Box sx={{ height: '1px', bgcolor: '#F0F2F4', my: 1.5 }} />

        {/* Distribution */}
        <Stack spacing={0.75}>
          {reversed.map((item) => {
            const pct = (item.count / totalResponses) * 100;
            const barWidth = (item.count / maxCount) * 100;

            return (
              <Stack key={item.rating} direction="row" alignItems="center" spacing={0.75}>
                <Stack direction="row" alignItems="center" spacing={0.25} sx={{ flexShrink: 0, width: 26 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#666', lineHeight: 1 }}>
                    {item.rating}
                  </Typography>
                  <Iconify icon="mdi:star" width={12} sx={{ color: AMBER }} />
                </Stack>
                <Box sx={{ flex: 1, height: 8, borderRadius: 0.75, bgcolor: BAR_BG, overflow: 'hidden' }}>
                  <Box sx={{ width: `${barWidth}%`, height: '100%', borderRadius: 0.75, bgcolor: AMBER, transition: 'width 0.3s ease' }} />
                </Box>
                <Typography sx={{ color: '#666', fontWeight: 600, fontSize: '0.7rem', minWidth: 56, textAlign: 'right', flexShrink: 0, lineHeight: 1 }}>
                  {item.count}
                  <Typography component="span" sx={{ color: '#919EAB', fontWeight: 500, fontSize: '0.6rem', ml: 0.3 }}>
                    ({pct.toFixed(0)}%)
                  </Typography>
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Popover>
    </>
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
              <Grid item xs={12}>
                <CreatorEarningsChart />
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
                <TopShortlistedCreatorsChart />
              </Grid>
            </Grid>
          </Fade>
        </DateFilterProvider>
      </Container>
    </>
  );
}
