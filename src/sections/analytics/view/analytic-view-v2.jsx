import { lazy, Suspense, useState, useMemo, useCallback, useRef, useEffect } from 'react';

import { Helmet } from 'react-helmet-async';
import { m, AnimatePresence } from 'framer-motion';

import { Box, Grid, Stack, Rating, Button, Skeleton, Container, Popover, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';
import { varFade, varContainer } from 'src/components/animate/variants';

import DateFilterSelect from 'src/sections/feedback/components/date-filter-select';
import useGetCreatorGrowth from 'src/hooks/use-get-creator-growth';
import useGetActivationRate from 'src/hooks/use-get-activation-rate';
import useGetCreatorSatisfaction from 'src/hooks/use-get-creator-satisfaction';
import useGetPitchRate from 'src/hooks/use-get-pitch-rate';

import CreditTierFilterSelect from './v2/components/credit-tier-filter-select';
import KpiCard from './v2/components/kpi-card';
import { CHART_COLORS } from './v2/chart-config';
import { DateFilterProvider, useDateFilter, useFilteredData, useIsDaily, useTrendLabel } from './v2/date-filter-context';

const CreatorsTabContent = lazy(() => import('./v2/creators-tab-content'));
const AdminsTabContent = lazy(() => import('./v2/admins-tab-content'));

const AMBER = '#FFAB00';
const BAR_BG = '#F4F6F8';

const TABS = [
  { value: 'creators', label: 'Creators' },
  { value: 'admins', label: 'Admins' },
];

function TabSkeleton() {
  return (
    <Grid container spacing={3} sx={{ mt: 1 }}>
      {[0, 1, 2, 3].map((i) => (
        <Grid item xs={12} md={i === 0 ? 12 : 6} key={i}>
          <Skeleton variant="rounded" height={320} sx={{ borderRadius: 2 }} />
        </Grid>
      ))}
    </Grid>
  );
}

function KpiCards() {
  const trendLabel = useTrendLabel();
  const { startDate, endDate, creditTiers } = useDateFilter();
  const isDaily = useIsDaily();

  const hookOptions = useMemo(() => {
    const opts = {};
    if (isDaily && startDate && endDate) {
      Object.assign(opts, { granularity: 'daily', startDate, endDate });
    }
    if (creditTiers.length > 0) opts.creditTiers = creditTiers;
    return opts;
  }, [isDaily, startDate, endDate, creditTiers]);

  const { creatorGrowth, periodComparison } = useGetCreatorGrowth(hookOptions);
  const { activationRate, periodComparison: activationPeriodComparison } = useGetActivationRate(hookOptions);
  const { pitchRate, periodComparison: pitchPeriodComparison } = useGetPitchRate(hookOptions);

  // Always call hooks unconditionally — use monthly filtered only when not daily
  const monthlyFiltered = useFilteredData(creatorGrowth);
  const filteredGrowth = isDaily ? creatorGrowth : monthlyFiltered;

  const monthlyFilteredActivation = useFilteredData(activationRate);
  const filteredActivation = isDaily ? activationRate : monthlyFilteredActivation;
  const monthlyFilteredPitch = useFilteredData(pitchRate);
  const filteredPitch = isDaily ? pitchRate : monthlyFilteredPitch;
  const { trend: npsTrend, overall: npsOverall } = useGetCreatorSatisfaction(hookOptions);
  const filteredNpsTrend = useFilteredData(npsTrend);

  const latestCreators = filteredGrowth[filteredGrowth.length - 1] || {};
  const prevCreators = filteredGrowth[filteredGrowth.length - 2];

  // For daily mode, use period comparison from backend; for monthly, use growthRate
  const creatorTrend = isDaily && periodComparison
    ? periodComparison.percentChange
    : (latestCreators.growthRate ?? 0);

  const latestActivation = filteredActivation[filteredActivation.length - 1] || {};
  const prevActivation = filteredActivation[filteredActivation.length - 2];
  const latestPitch = filteredPitch[filteredPitch.length - 1] || {};
  const prevPitch = filteredPitch[filteredPitch.length - 2];
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
      <Grid
        container
        spacing={2}
        sx={{ mb: -1 }}
        component={m.div}
        variants={varContainer({ staggerIn: 0.08 })}
        initial="initial"
        animate="animate"
      >
        <Grid item xs={6} sm={6} md={3} component={m.div} variants={varFade({ distance: 24 }).inUp}>
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
        <Grid item xs={6} sm={6} md={3} component={m.div} variants={varFade({ distance: 24 }).inUp}>
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
        <Grid item xs={6} sm={6} md={3} component={m.div} variants={varFade({ distance: 24 }).inUp}>
          <KpiCard
            title="Pitch Rate"
            value={latestPitch.rate != null ? `${latestPitch.rate}%` : '—'}
            trend={(() => {
              if (isDaily && pitchPeriodComparison) return pitchPeriodComparison.percentChange;
              if (prevPitch) return Math.round((latestPitch.rate - prevPitch.rate) * 10) / 10;
              return 0;
            })()}
            trendLabel={trendLabel}
            subtitle="Pitched / active creators"
            sparklineData={filteredPitch.map((d) => d.rate)}
            sparklineColor={CHART_COLORS.secondary}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3} component={m.div} variants={varFade({ distance: 24 }).inUp}>
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
  const [creditTiers, setCreditTiers] = useState([]);

  const handleDateFilterChange = useCallback(({ preset, startDate, endDate }) => {
    setDateFilter(preset);
    setFilterStartDate(startDate);
    setFilterEndDate(endDate);
  }, []);

  const handleCreditTiersChange = useCallback((tiers) => {
    setCreditTiers(tiers);
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

            {/* Filters — right */}
            <Stack direction="row" spacing={1} sx={{ ml: { xs: 0, sm: 'auto' }, pb: 0.5, mt: { xs: 1, sm: 0 } }}>
              <CreditTierFilterSelect value={creditTiers} onChange={handleCreditTiersChange} />
              <DateFilterSelect
                value={dateFilter}
                startDate={filterStartDate}
                endDate={filterEndDate}
                onChange={handleDateFilterChange}
              />
            </Stack>
          </Stack>
        </Box>

        <DateFilterProvider dateFilter={dateFilter} startDate={filterStartDate} endDate={filterEndDate} creditTiers={creditTiers}>
          {/* Top-Level KPI Cards */}
          <KpiCards />

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <m.div
              key={currentTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.43, 0.13, 0.23, 0.96] }}
            >
              <Suspense fallback={<TabSkeleton />}>
                {currentTab === 'creators' && <CreatorsTabContent />}
                {currentTab === 'admins' && <AdminsTabContent />}
              </Suspense>
            </m.div>
          </AnimatePresence>
        </DateFilterProvider>
      </Container>
    </>
  );
}
