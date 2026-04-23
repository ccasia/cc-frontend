/* eslint-disable react/prop-types */
import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';
import React, { useRef, useMemo, useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Alert,
  Stack,
  Button,
  Dialog,
  Skeleton,
  Typography,
  CircularProgress,
} from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';
import { useSocialInsights } from 'src/hooks/use-social-insights';
import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';
import { useGetManualCreatorEntries } from 'src/hooks/useSWR/useGetManualCreatorEntries';

import { canonicalizePostUrl, extractPostingSubmissions } from 'src/utils/extractPostingLinks';
import {
  formatNumber,
  getMetricValue,
  calculateSummaryStats,
  calculateEngagementRate,
} from 'src/utils/socialMetricsCalculator';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';
import { deleteManualCreatorEntry } from 'src/api/manual-creator';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { TopCreatorsLineChart, EngagementRateHeatmap } from 'src/components/trend-analysis';
import {
  AnimatedNumber,
  ManualCreatorCard,
  UserPerformanceCard,
  PlatformOverviewMobile,
  ManualCreatorEntryForm,
  PlatformOverviewDesktop
} from 'src/components/campaign-analytics';

import PCRReportPage from './pcr-report-page';

// Stagger animation configuration for skeleton to content transitions

const STAGGER_CONFIG = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  },
};

const PlatformToggle = ({ lgUp, availablePlatforms, selectedPlatform, handlePlatformChange }) => {
  const platformConfig = [
    { key: 'ALL', label: 'Overview', icon: null, color: '#1340FF', display: true },
    {
      key: 'Instagram',
      label: 'Instagram',
      icon: 'prime:instagram',
      color: '#C13584',
      display: lgUp,
    },
    { key: 'TikTok', label: 'TikTok', icon: 'prime:tiktok', color: '#000000', display: lgUp },
  ];

  const availablePlatformConfig = platformConfig.filter(
    (config) => config.key === 'ALL' || availablePlatforms.includes(config.key)
  );

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        {availablePlatformConfig.map((config) => (
          <Button
            key={config.key}
            onClick={() => handlePlatformChange(config.key)}
            sx={{
              width: 135,
              height: 40,
              borderRadius: '8px',
              borderWidth: '2px',
              bgcolor: 'transparent',
              color: selectedPlatform === config.key ? config.color : '#9E9E9E',
              border:
                selectedPlatform === config.key ? `2px solid ${config.color}` : '2px solid #9E9E9E',
              fontWeight: 600,
              fontSize: 16,
              alignItems: 'center',
              justifyContent: 'center',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'transparent',
                border: `2px solid ${config.color}`,
                color: config.color,
                '& .iconify': {
                  color: config.color,
                },
              },
            }}
          >
            {config.display ? (
              <>
                {config.icon && (
                  <Iconify
                    icon={config.icon}
                    className="iconify"
                    sx={{
                      height: 30,
                      width: 30,
                      mr: config.key === 'TikTok' ? 0 : 0.5,
                      color: selectedPlatform === config.key ? config.color : '#9E9E9E',
                    }}
                  />
                )}
                {config.label}
              </>
            ) : (
              <>
                {config.icon && (
                  <Iconify
                    icon={config.icon}
                    className="iconify"
                    sx={{
                      height: 35,
                      width: 35,
                      color: selectedPlatform === config.key ? config.color : '#9E9E9E',
                    }}
                  />
                )}
              </>
            )}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

const getPlatformLabel = (platform) => {
  if (platform === 'ALL') return 'Total Creators';
  if (platform === 'Instagram') return 'Instagram Posts';
  if (platform === 'TikTok') return 'TikTok Posts';
  return '';
};

const RenderEngagementCard = ({
  title,
  value,
  metricKey,
  filteredInsightsData,
  filteredSubmissions,
  findTopPerformerByMetric,
}) => {
  const topPerformer = findTopPerformerByMetric(
    metricKey,
    filteredInsightsData,
    filteredSubmissions
  );
  const { data: topCreator } = useGetCreatorById(topPerformer?.submission?.user);
  // For manual entries, use the creator name directly; for API entries, use the creator from the hook
  const creatorName = topPerformer?.manualEntry
    ? topPerformer.manualEntry.creatorName
    : topCreator?.user?.name || 'Unknown';
  const percentage = topPerformer && value > 0 ? Math.round((topPerformer.value / value) * 100) : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: 2,
        height: { xs: 100, sm: 116 },
        background: '#F5F5F5',
        boxShadow: '0px 4px 4px rgba(142, 142, 147, 0.25)',
        borderRadius: '20px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            height: { xs: 70, sm: 85 },
            minWidth: 0,
            mr: 1,
          }}
        >
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: { xs: 16, sm: 18 },
              color: '#636366',
              maxWidth: { xs: 70, sm: 120, md: 200 },
            }}
          >
            {title}
          </Typography>

          {topPerformer && (
            <Box>
              <Typography
                fontSize={{ xs: 12, sm: 14 }}
                component="span"
                color="#1340FF"
                fontWeight={600}
              >
                {percentage}%{' '}
                <Typography fontSize={{ xs: 12, sm: 14 }} color="#000" component="span">
                  from
                </Typography>
              </Typography>
              <Typography
                fontSize={{ xs: 12, sm: 14 }}
                color="#000"
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: { xs: 85, sm: 120, md: 140 },
                  display: 'block',
                }}
              >
                {creatorName}
              </Typography>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: { xs: 60, sm: 70, md: 79 },
            height: { xs: 60, sm: 70, md: 79 },
            background: '#1340FF',
            borderRadius: '8px',
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: { xs: 16, sm: 20, md: 24 },
              color: '#FFFFFF',
            }}
          >
            {typeof value === 'number' ? (
              <AnimatedNumber value={value} formatFn={formatNumber} />
            ) : (
              value
            )}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// Skeleton for Core Metrics Cards (Views, Likes, Shares, Saves)
const CoreMetricsSkeleton = () => (
  <Box sx={{ mb: 3 }}>
    <Grid container spacing={{ xs: 1, sm: 2 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Grid item xs={6} sm={6} md={3} key={i}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2,
              height: { xs: 100, sm: 116 },
              background: '#F5F5F5',
              boxShadow: '0px 4px 4px rgba(142, 142, 147, 0.25)',
              borderRadius: '20px',
            }}
          >
            <Box>
              <Skeleton
                animation="wave"
                width={80}
                height={24}
                sx={{ bgcolor: 'rgba(99, 99, 102, 0.1)' }}
              />
              <Skeleton
                animation="wave"
                width={100}
                height={16}
                sx={{ bgcolor: 'rgba(99, 99, 102, 0.1)', mt: 1 }}
              />
            </Box>
            <Skeleton
              animation="wave"
              variant="rounded"
              sx={{
                width: { xs: 60, sm: 70, md: 79 },
                height: { xs: 60, sm: 70, md: 79 },
                borderRadius: '8px',
                bgcolor: 'rgba(19, 64, 255, 0.15)',
              }}
            />
          </Box>
        </Grid>
      ))}
    </Grid>
  </Box>
);

// Skeleton for Platform Overview section (desktop)
const PlatformOverviewSkeletonDesktop = () => (
  <Grid container spacing={2} sx={{ mb: 2 }}>
    {/* PostingsCard Skeleton - beams */}
    <Grid item xs={12} md={2.5}>
      <Box sx={{ textAlign: 'center', px: 3, py: 2 }}>
        <Skeleton animation="wave" width={80} height={28} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'flex-end' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Skeleton animation="wave" width={30} height={20} sx={{ mb: 1 }} />
            <Skeleton
              animation="wave"
              variant="rounded"
              sx={{ width: 54, height: 120, borderRadius: 100 }}
            />
            <Skeleton animation="wave" width={60} height={16} sx={{ mt: 1 }} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Skeleton animation="wave" width={30} height={20} sx={{ mb: 1 }} />
            <Skeleton
              animation="wave"
              variant="rounded"
              sx={{ width: 54, height: 80, borderRadius: 100 }}
            />
            <Skeleton animation="wave" width={50} height={16} sx={{ mt: 1 }} />
          </Box>
        </Box>
      </Box>
    </Grid>

    {/* Pie Chart Skeleton */}
    <Grid item xs={12} md={5}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Skeleton
          animation="wave"
          variant="circular"
          sx={{ width: 240, height: 240, bgcolor: 'rgba(19, 64, 255, 0.08)' }}
        />
      </Box>
    </Grid>

    {/* Metrics Grid Skeleton */}
    <Grid item xs={12} md={2}>
      <Stack spacing={2}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Box key={i}>
            <Skeleton
              animation="wave"
              width={40}
              height={14}
              sx={{ bgcolor: 'rgba(99, 99, 102, 0.1)' }}
            />
            <Skeleton
              animation="wave"
              width={80}
              height={40}
              sx={{ bgcolor: 'rgba(19, 64, 255, 0.1)' }}
            />
          </Box>
        ))}
      </Stack>
    </Grid>

    {/* TopEngagementCard Skeleton */}
    <Grid item xs={12} md={2.5}>
      <Box sx={{ p: 2 }}>
        <Skeleton
          animation="wave"
          width={100}
          height={80}
          sx={{ bgcolor: 'rgba(19, 64, 255, 0.1)', mb: 2 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Skeleton animation="wave" variant="circular" width={45} height={45} />
          <Skeleton animation="wave" width={80} height={16} />
        </Box>
        <Skeleton
          animation="wave"
          variant="rounded"
          sx={{ width: '100%', height: 120, borderRadius: 2 }}
        />
      </Box>
    </Grid>
  </Grid>
);

// Skeleton for Platform Overview section (mobile)
const PlatformOverviewSkeletonMobile = () => (
  <Box sx={{ mb: 2 }}>
    {/* PostingsCard Skeleton - horizontal beams */}
    <Box sx={{ mb: 3, px: 2 }}>
      <Skeleton animation="wave" width={80} height={28} sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton animation="wave" width={60} height={16} />
          <Skeleton
            animation="wave"
            variant="rounded"
            sx={{ flex: 1, height: 24, borderRadius: 100 }}
          />
          <Skeleton animation="wave" width={30} height={20} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton animation="wave" width={60} height={16} />
          <Skeleton
            animation="wave"
            variant="rounded"
            sx={{ flex: 1, height: 24, borderRadius: 100, maxWidth: '60%' }}
          />
          <Skeleton animation="wave" width={30} height={20} />
        </Box>
      </Box>
    </Box>

    {/* Metrics Row Skeleton */}
    <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Box key={i} sx={{ textAlign: 'center' }}>
          <Skeleton
            animation="wave"
            width={40}
            height={14}
            sx={{ bgcolor: 'rgba(99, 99, 102, 0.1)', mx: 'auto' }}
          />
          <Skeleton
            animation="wave"
            width={60}
            height={32}
            sx={{ bgcolor: 'rgba(19, 64, 255, 0.1)', mx: 'auto' }}
          />
        </Box>
      ))}
    </Box>

    {/* Pie Chart Skeleton */}
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
      <Skeleton
        animation="wave"
        variant="circular"
        sx={{ width: 200, height: 200, bgcolor: 'rgba(19, 64, 255, 0.08)' }}
      />
    </Box>
  </Box>
);

// Skeleton for Heatmap chart
const HeatmapSkeleton = () => (
  <Box
    sx={{
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
    }}
  >
    {/* Real title - not affected by skeleton */}
    <Typography
      sx={{
        fontFamily: 'Aileron',
        fontWeight: 600,
        fontSize: 24,
        color: '#000',
        mb: { xs: 2, md: 3 },
      }}
    >
      Engagement Rate Heatmap
    </Typography>
    {/* Skeleton content */}
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto repeat(6, 1fr)',
        gap: 0.5,
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: 7 }).map((_, row) => (
        <React.Fragment key={row}>
          <Skeleton animation="wave" width={30} height={28} />
          {Array.from({ length: 6 }).map((__, col) => (
            <Skeleton
              key={col}
              animation="wave"
              variant="rectangular"
              sx={{ minWidth: 40, height: 28, bgcolor: 'rgba(19, 64, 255, 0.08)' }}
            />
          ))}
        </React.Fragment>
      ))}
    </Box>
  </Box>
);

// Skeleton for Line chart
const LineChartSkeleton = () => (
  <Box
    sx={{
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
    }}
  >
    {/* Real title - not affected by skeleton */}
    <Typography
      sx={{
        fontFamily: 'Aileron',
        fontWeight: 600,
        fontSize: 24,
        color: '#000',
        mb: { xs: 2, md: 3 },
      }}
    >
      Top 5 Creators in Views
    </Typography>
    {/* Skeleton content */}
    <Box sx={{ height: 280, position: 'relative', overflow: 'hidden' }}>
      {/* Horizontal grid lines */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton
          key={i}
          animation="wave"
          variant="rectangular"
          sx={{
            position: 'absolute',
            left: 40,
            right: 0,
            height: 1,
            top: `${i * 25}%`,
            bgcolor: 'rgba(19, 64, 255, 0.1)',
          }}
        />
      ))}
      {/* X-axis labels */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 40,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} animation="wave" width={35} height={16} />
        ))}
      </Box>
    </Box>
    {/* Legend */}
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton
            animation="wave"
            variant="rectangular"
            width={40}
            height={24}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton animation="wave" width={60} height={14} />
        </Box>
      ))}
    </Box>
  </Box>
);

// Skeleton for creator list items
const CreatorListItemSkeleton = () => (
  <Box borderRadius={1} border="2px solid #F5F5F5" sx={{ py: 1.5 }}>
    <Box px={{ xs: 1, sm: 2, lg: 3 }} display="flex" alignItems="center" gap={2}>
      {/* Avatar */}
      <Skeleton animation="wave" variant="circular" width={44} height={44} />

      {/* Name + handle */}
      <Box sx={{ minWidth: 180 }}>
        <Skeleton animation="wave" width={120} height={20} sx={{ mb: 0.5 }} />
        <Skeleton animation="wave" width={80} height={14} />
      </Box>

      {/* Metrics */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <React.Fragment key={i}>
            <Box sx={{ flex: 1 }}>
              <Skeleton
                animation="wave"
                width={60}
                height={18}
                sx={{ bgcolor: 'rgba(99, 99, 102, 0.1)' }}
              />
              <Skeleton
                animation="wave"
                width={50}
                height={32}
                sx={{ bgcolor: 'rgba(19, 64, 255, 0.1)' }}
              />
            </Box>
            {i < 3 && (
              <Skeleton
                animation="wave"
                variant="rectangular"
                width={1}
                height={40}
                sx={{ bgcolor: 'rgba(19, 64, 255, 0.15)' }}
              />
            )}
          </React.Fragment>
        ))}
      </Box>

      {/* Thumbnail */}
      <Skeleton
        animation="wave"
        variant="rounded"
        sx={{ width: 140, height: 75, borderRadius: 2, flexShrink: 0 }}
      />
    </Box>
  </Box>
);

// Full page skeleton for analytics loading state
const AnalyticsPageSkeleton = ({ lgUp }) => (
  <Box
    component={m.div}
    variants={STAGGER_CONFIG.container}
    initial="hidden"
    animate="show"
    exit="exit"
  >
    {/* Section 1: Core Metrics */}
    <Box component={m.div} variants={STAGGER_CONFIG.item}>
      <CoreMetricsSkeleton />
    </Box>

    {/* Section 2: Platform Overview */}
    <Box component={m.div} variants={STAGGER_CONFIG.item}>
      {lgUp ? <PlatformOverviewSkeletonDesktop /> : <PlatformOverviewSkeletonMobile />}
    </Box>

    {/* Section 3: Trend Charts */}
    <Stack
      component={m.div}
      variants={STAGGER_CONFIG.item}
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{ mb: 3, overflow: 'hidden' }}
    >
      <HeatmapSkeleton />
      <LineChartSkeleton />
    </Stack>

    {/* Section 4: Creator List */}
    <Box component={m.div} variants={STAGGER_CONFIG.item}>
      {/* Real title - not affected by skeleton */}
      <Typography fontSize={24} fontWeight={600} fontFamily="Aileron" sx={{ mb: 1 }}>
        Creator List
      </Typography>
      <Stack spacing={1}>
        {Array.from({ length: 5 }).map((_, i) => (
          <CreatorListItemSkeleton key={i} />
        ))}
      </Stack>
    </Box>
  </Box>
);

// Helper function to get localStorage key for this campaign
const getReportStorageKey = (id) => `campaign-report-generated-${id}`;

const CampaignAnalytics = ({ campaign, campaignMutate, isDisabled = false }) => {
  const { user } = useAuthContext();
  const campaignId = campaign?.id;
  const submissions = useMemo(() => campaign?.submission || [], [campaign?.submission]);
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [reportState, setReportState] = useState('generate'); // 'generate', 'loading', 'view'
  const [showReportPage, setShowReportPage] = useState(false);
  const [showAddCreatorForm, setShowAddCreatorForm] = useState(false);
  const [formState, setFormState] = useState({ isValid: false, isFormComplete: false, isSubmitting: false });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const formRef = useRef(null);

  const lgUp = useResponsive('up', 'lg');
  const { socket } = useSocketContext();
  const { enqueueSnackbar } = useSnackbar();
  
  // Check if user is a client
  const isClient = user?.role?.includes('client');

  // Fetch manual creator entries
  const { entries: manualEntries, mutate: mutateManualEntries } = useGetManualCreatorEntries(campaignId);

  // Update reportState when campaignId changes (user switches campaigns)
  useEffect(() => {
    if (campaignId) {
      const hasGenerated = localStorage.getItem(getReportStorageKey(campaignId)) === 'true';
      setReportState(hasGenerated ? 'view' : 'generate');
    }
  }, [campaignId]);

  // Save to localStorage when report is generated (state becomes 'view')
  useEffect(() => {
    if (campaignId && reportState === 'view') {
      localStorage.setItem(getReportStorageKey(campaignId), 'true');
    }
  }, [campaignId, reportState]);

  // Extract posting submissions with URLs directly from campaign prop
  const postingSubmissions = useMemo(() => extractPostingSubmissions(submissions), [submissions]);

  // Get available platforms in the campaign or provide defaults for empty state
  const availablePlatforms = useMemo(() => {
    if (postingSubmissions.length === 0) {
      // Return default platforms for empty state display
      return ['Instagram', 'TikTok'];
    }
    const platforms = [
      ...new Set(postingSubmissions.map((sub) => sub && sub.platform).filter(Boolean)),
    ];
    return platforms.length > 0 ? platforms : ['Instagram', 'TikTok'];
  }, [postingSubmissions]);

  // Filter submissions based on selected platform
  const filteredSubmissions = useMemo(() => {
    if (selectedPlatform === 'ALL') {
      return postingSubmissions.filter((sub) => sub && sub.platform);
    }
    return postingSubmissions.filter((sub) => sub && sub.platform === selectedPlatform);
  }, [postingSubmissions, selectedPlatform]);

  // Get platform counts for beam display (includes both API submissions and manual entries)
  const platformCounts = useMemo(() => {
    const counts = { Instagram: 0, TikTok: 0 };
    // Count from API submissions
    postingSubmissions.forEach((sub) => {
      if (sub && sub.platform === 'Instagram') counts.Instagram += 1;
      if (sub && sub.platform === 'TikTok') counts.TikTok += 1;
    });
    // Count from manual entries
    if (manualEntries && manualEntries.length > 0) {
      manualEntries.forEach((entry) => {
        if (entry.platform === 'Instagram') counts.Instagram += 1;
        if (entry.platform === 'TikTok') counts.TikTok += 1;
      });
    }
    return counts;
  }, [postingSubmissions, manualEntries]);

  // Fetch insights for posting submissions (always fetch all, filter for display)
  const {
    data: insightsData,
    isLoading: loadingInsights,
    error: insightsError,
    mutate: refreshInsights,
    clearCache,
  } = useSocialInsights(postingSubmissions, campaignId);

  // Filter insights data based on selected platform
  const filteredInsightsData = useMemo(() => {
    if (selectedPlatform === 'ALL') {
      return insightsData;
    }
    return insightsData.filter((data) => data && data.platform === selectedPlatform);
  }, [insightsData, selectedPlatform]);

  // Filter manual entries based on selected platform
  const filteredManualEntries = useMemo(() => {
    if (!manualEntries || manualEntries.length === 0) {
      return [];
    }
    if (selectedPlatform === 'ALL') {
      return manualEntries;
    }
    return manualEntries.filter((entry) => entry.platform === selectedPlatform);
  }, [manualEntries, selectedPlatform]);

  // Creator list: highest engagement rate first (manual entries + submissions in one order)
  const creatorListRowsSorted = useMemo(() => {
    const rows = [];

    filteredManualEntries.forEach((entry) => {
      const canonical = canonicalizePostUrl(entry.postUrl);
      const dedupKey = canonical
        ? `url::${entry.platform}::${canonical}`
        : `manual::${entry.platform}::${(entry.creatorUsername || entry.id).toLowerCase()}`;
      rows.push({
        kind: 'manual',
        dedupKey,
        engagementRate: Number(entry.engagementRate) || 0,
        entry,
      });
    });

    filteredSubmissions.forEach((submission) => {
      const insightData = insightsData.find(
        (data) => data.submissionId === submission.id && data.postUrl === submission.postUrl,
      );
      if (!insightData && !loadingInsights) {
        return;
      }
      const engagementRate = insightData ? calculateEngagementRate(insightData.insight) : 0;
      const canonical = canonicalizePostUrl(submission.postUrl);
      const dedupKey = canonical
        ? `url::${submission.platform}::${canonical}`
        : `submission::${submission.platform}::${submission.user}::${submission.id}`;
      rows.push({
        kind: 'submission',
        dedupKey,
        engagementRate,
        submission,
        insightData,
      });
    });

    rows.sort((a, b) => b.engagementRate - a.engagementRate);

    const seen = new Set();
    return rows.filter((row) => {
      if (seen.has(row.dedupKey)) return false;
      seen.add(row.dedupKey);
      return true;
    });
  }, [filteredManualEntries, filteredSubmissions, insightsData, loadingInsights]);

  // Calculate summary statistics based on filtered data or provide empty state
  const summaryStats = useMemo(() => {
    // If we have no insights and no manual entries, return placeholder
    if (filteredInsightsData.length === 0 && filteredManualEntries.length === 0) {
      return {
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalSaved: 0,
        totalReach: 0,
        totalPosts: 0,
        avgEngagementRate: 0,
      };
    }
    // Calculate stats including both insights and manual entries
    return calculateSummaryStats(filteredInsightsData, filteredManualEntries);
  }, [filteredInsightsData, filteredManualEntries]);

  // Socket event listener for media kit connections
  useEffect(() => {
    if (!socket || !campaignId) return undefined;

    const handleAnalyticsRefresh = (data) => {
      console.log('📡 Received analytics refresh event:', data);
      
      // Check if this user has submissions in current campaign
      const hasUserSubmissions = postingSubmissions.some(
        sub => sub.user === data.userId
      );
      
      if (hasUserSubmissions) {
        console.log(`🔄 ${data.platform} connected for user, refreshing analytics...`);
        enqueueSnackbar(`${data.platform} connected! Refreshing analytics...`, { 
          variant: 'success' 
        });
        
        // Clear cache and re-fetch with a small delay to ensure API is ready
        clearCache();
        setTimeout(() => {
          refreshInsights();
        }, 1500);
      }
    };

    // Join campaign room and listen for analytics refresh events
    socket.joinCampaign(campaignId);
    socket.on('analytics:refresh', handleAnalyticsRefresh);
    
    return () => {
      socket.off('analytics:refresh', handleAnalyticsRefresh);
      socket.leaveCampaign(campaignId);
    };
  }, [socket, campaignId, postingSubmissions, clearCache, refreshInsights, enqueueSnackbar]);

  const handlePlatformChange = (platform) => {
    setSelectedPlatform(platform);
  };

  // Handle opening delete modal
  const handleDeleteClick = (entry) => {
    setEntryToDelete(entry);
    setDeleteModalOpen(true);
  };

  // Handle confirming delete
  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;

    try {
      await deleteManualCreatorEntry(campaignId, entryToDelete.id);
      mutateManualEntries();
      enqueueSnackbar('Creator has been deleted successfully!', { variant: 'success' });
      setDeleteModalOpen(false);
      setEntryToDelete(null);
    } catch (error) {
      console.error('Failed to delete manual creator entry:', error);
      enqueueSnackbar('Failed to delete creator entry', { variant: 'error' });
    }
  };

  // Handle closing delete modal
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setEntryToDelete(null);
  };

  // No campaign
  if (!campaign) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Campaign information not available.
      </Alert>
    );
  }

  // No campaign ID
  if (!campaignId) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Campaign ID not available.
      </Alert>
    );
  }

  // eslint-disable-next-line react/no-unstable-nested-components
  const CoreMetricsSection = ({ summaryStats: stats }) => {
    if (!stats) return null;

    // Define metrics configuration
    const metricsConfig = [
      {
        key: 'views',
        label: 'Views',
        value: stats.totalViews,
        metricKey: 'views',
      },
      {
        key: 'likes',
        label: 'Likes',
        value: stats.totalLikes,
        metricKey: 'likes',
      },
      {
        key: 'shares',
        label: 'Shares',
        value: stats.totalShares,
        metricKey: 'shares',
      },
      {
        key: 'saved',
        label: 'Saves',
        value: stats.totalSaved,
        metricKey: 'saved',
        // Only show for Instagram (not for TikTok)
        condition:
          selectedPlatform !== 'TikTok' &&
          (selectedPlatform === 'Instagram' ||
            (selectedPlatform === 'ALL' && availablePlatforms.includes('Instagram'))),
      },
    ].filter((metric) => metric.condition !== false);

    return (
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={{ xs: 1, sm: 2 }}>
          {metricsConfig.map((metric) => (
            <Grid item xs={6} sm={6} md={3} key={metric.key}>
              <RenderEngagementCard
                title={metric.label}
                value={metric.value}
                metricKey={metric.metricKey}
                filteredInsightsData={filteredInsightsData}
                filteredSubmissions={filteredSubmissions}
                findTopPerformerByMetric={findTopPerformerByMetric}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  const PlatformOverviewLayout = () => (
      <Box sx={{ pb: selectedPlatform === 'TikTok' ? 4 : 0 }}>
        {/* Mobile Layout */}
        <PlatformOverviewMobile
          platformCounts={platformCounts}
          selectedPlatform={selectedPlatform}
          filteredInsightsData={filteredInsightsData}
          filteredSubmissions={filteredSubmissions}
          insightsData={insightsData}
          summaryStats={summaryStats}
          availablePlatforms={availablePlatforms}
          getPlatformLabel={getPlatformLabel}
        />

        {/* Desktop Layout */}
        <PlatformOverviewDesktop
          platformCounts={platformCounts}
          selectedPlatform={selectedPlatform}
          summaryStats={summaryStats}
          availablePlatforms={availablePlatforms}
          filteredInsightsData={filteredInsightsData}
          filteredSubmissions={filteredSubmissions}
          insightsData={insightsData}
          getPlatformLabel={getPlatformLabel}
        />
      </Box>
    );

  // Add this new function before CoreMetricsSection
  const findTopPerformerByMetric = (metricKey, insights, submissionsList) => {
    let topPerformer = null;
    let highestValue = 0;

    // Check API insights
    if (insights && insights.length > 0) {
      insights.forEach((insightData) => {
        const submission = submissionsList.find((sub) => sub.id === insightData.submissionId);
        if (submission) {
          const value = getMetricValue(insightData.insight, metricKey);
          if (value > highestValue) {
            highestValue = value;
            topPerformer = {
              submission,
              value,
              insightData,
            };
          }
        }
      });
    }

    // Check manual entries
    if (filteredManualEntries && filteredManualEntries.length > 0) {
      filteredManualEntries.forEach((entry) => {
        let value = 0;
        // Map metric keys to manual entry fields
        if (metricKey === 'views') value = entry.views || 0;
        else if (metricKey === 'likes') value = entry.likes || 0;
        else if (metricKey === 'comments') value = entry.comments || 0;
        else if (metricKey === 'shares') value = entry.shares || 0;
        else if (metricKey === 'saved') value = entry.saved || 0;

        if (value > highestValue) {
          highestValue = value;
          topPerformer = {
            submission: null, // Manual entries don't have submissions
            value,
            insightData: null,
            manualEntry: {
              creatorName: entry.creatorName,
              creatorUsername: entry.creatorUsername,
              platform: entry.platform,
            },
          };
        }
      });
    }

    return topPerformer;
  };

  return (
    <Box>
      {/* Conditionally render PCR Report Page or Performance Summary */}
      {showReportPage ? (
        <PCRReportPage 
          campaign={campaign} 
          onBack={() => setShowReportPage(false)} 
          isClientView={isClient}
          onCampaignUpdate={(updatedCampaign) => {
            if (updatedCampaign && campaignMutate) {
              campaignMutate(updatedCampaign, { revalidate: true });
            } else if (campaignMutate) {
              campaignMutate();
            }
          }}
        />
      ) : (
        <>
      {/* Platform Toggle */}
      {availablePlatforms.length > 1 && (
        <PlatformToggle
          lgUp={lgUp}
          availablePlatforms={availablePlatforms}
          selectedPlatform={selectedPlatform}
          handlePlatformChange={handlePlatformChange}
        />
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography fontSize={24} fontWeight={600} fontFamily="Aileron">
        Performance Summary
      </Typography>
        
        {/* Generate Report Button - Admin only */}
        {!isClient && (
        <Button
          disabled={reportState === 'loading'}
          sx={{
            width: '186.07px',
            height: '44px',
            borderRadius: '8px',
            gap: '6px',
            padding: '10px 16px 13px 16px',
            background: reportState === 'loading' 
              ? 'linear-gradient(90deg, #B8B8B8 0%, #9E9E9E 100%)' 
              : 'linear-gradient(90deg, #8A5AFE 0%, #1340FF 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
            boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.1) inset',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '14px',
            textTransform: 'none',
            '&:hover': {
              background: reportState === 'loading' 
                ? 'linear-gradient(90deg, #B8B8B8 0%, #9E9E9E 100%)' 
                : 'linear-gradient(90deg, #7A4AEE 0%, #0330EF 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
            },
            '&:active': {
              boxShadow: reportState === 'loading' 
                ? '0px -3px 0px 0px rgba(0, 0, 0, 0.1) inset' 
                : '0px -1px 0px 0px rgba(0, 0, 0, 0.1) inset',
              transform: reportState === 'loading' ? 'none' : 'translateY(1px)',
            },
            '&:disabled': {
              color: '#FFFFFF',
            }
          }}
          onClick={() => {
            if (reportState === 'generate') {
              // Start loading
              setReportState('loading');
        
              setTimeout(() => {
                setReportState('view');
              }, 3000); // 3 second loading simulation
              
            } else if (reportState === 'view') {
              // Show PCR report page
              setShowReportPage(true);
            }
          }}
        >
          {reportState === 'loading' && (
            <CircularProgress 
              size={16} 
              sx={{ 
                color: '#FFFFFF', 
                mr: 1 
              }} 
            />
          )}
          {reportState === 'generate' && 'Generate Report'}
          {reportState === 'loading' && 'Generating...'}
          {reportState === 'view' && 'View Report'}
        </Button>
        )}
        {/* View Report Button - Client only, when PCR is ready */}
        {isClient && campaign?.isPCRReady && (
        <Button
          sx={{
            width: '186.07px',
            height: '44px',
            borderRadius: '8px',
            gap: '6px',
            padding: '10px 16px 13px 16px',
            background: 'linear-gradient(90deg, #8A5AFE 0%, #1340FF 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
            boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.1) inset',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '14px',
            textTransform: 'none',
            '&:hover': {
              background: 'linear-gradient(90deg, #7A4AEE 0%, #0330EF 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
            },
            '&:active': {
              boxShadow: '0px -1px 0px 0px rgba(0, 0, 0, 0.1) inset',
              transform: 'translateY(1px)',
            },
          }}
          onClick={() => setShowReportPage(true)}
        >
          View Report
        </Button>
        )}
      </Box>

      {/* Error Alert - always show if error */}
      {insightsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading insights: {insightsError?.message || 'Unknown error'}
        </Alert>
      )}

      {/* Main content with AnimatePresence for skeleton exit only */}
      <AnimatePresence mode="wait">
        {loadingInsights && <AnalyticsPageSkeleton key="skeleton" lgUp={lgUp} />}
      </AnimatePresence>

      {/* Content sections - no fade animation, just appear when loaded */}
      {!loadingInsights && (
        <>
          {/* Section 1: Core Metrics */}
          <Box mb={4}>
            <CoreMetricsSection insightsData={filteredInsightsData} summaryStats={summaryStats} />
          </Box>

          {/* Section 2: Platform Overview */}
          <Box mb={4}>
            {availablePlatforms.length > 0 && (
              <PlatformOverviewLayout
                postCount={filteredSubmissions.length}
                insightsData={filteredInsightsData}
                summaryStats={summaryStats}
                platformCounts={platformCounts}
                selectedPlatform={selectedPlatform}
              />
            )}
          </Box>

          {/* Section 3: Trends Analysis */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            flex={1}
            spacing={4}
            justifyContent="space-between"
            minHeight={{ xs: 'auto', md: 500 }}
            mb={4}
          >
            <Box flex={1} width="100%">
              <EngagementRateHeatmap
                campaignId={campaignId}
                platform={selectedPlatform === 'ALL' ? 'All' : selectedPlatform}
                weeks={6}
              />
            </Box>
            <Box flex={1} width="100%">
              <TopCreatorsLineChart
                campaignId={campaignId}
                platform={selectedPlatform === 'ALL' ? 'All' : selectedPlatform}
                days={7}
              />
            </Box>
          </Stack>

          {/* Section 4: Creator List */}
          <Box>
              {/* Creator List Header with Count */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography fontSize={24} fontWeight={600} fontFamily="Aileron">
                  Creator List
                </Typography>

                {/* Show Add New Creators button or Cancel/Save buttons */}
                {!showAddCreatorForm ? (
                  <Button
                    onClick={() => setShowAddCreatorForm(true)}
                    disabled={isDisabled}
                    sx={{
                      bgcolor: '#FFFFFF',
                      border: '1.5px solid #e7e7e7',
                      borderBottom: '3px solid #e7e7e7',
                      borderRadius: 1.15,
                      color: '#1340FF',
                      height: 44,
                      px: 2.5,
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'rgba(19, 64, 255, 0.08)',
                        border: '1.5px solid #1340FF',
                        borderBottom: '3px solid #1340FF',
                        color: '#1340FF',
                      },
                      '&.Mui-disabled': {
                        cursor: 'not-allowed',
                        pointerEvents: 'auto',
                      },
                    }}
                    startIcon={<Iconify icon="fluent:people-add-28-filled" width={16} />}
                  >
                    Add New Creators
                  </Button>
                ) : (
                  <Stack direction="row" spacing={1.5}>
                    {/* Cancel Button */}
                    <Button
                      onClick={() => setShowAddCreatorForm(false)}
                      disabled={formState.isSubmitting}
                      sx={{
                        bgcolor: '#FFFFFF',
                        border: '1.5px solid #e7e7e7',
                        borderBottom: '3px solid #e7e7e7',
                        borderRadius: 1.15,
                        color: '#1340FF',
                        height: 44,
                        minWidth: 100,
                        px: 2.5,
                        fontWeight: 600,
                        fontSize: '1rem',
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: 'rgba(19, 64, 255, 0.08)',
                          border: '1.5px solid #1340FF',
                          borderBottom: '3px solid #1340FF',
                          color: '#1340FF',
                        },
                      }}
                    >
                      Cancel
                    </Button>

                    {/* Save Button */}
                    <Button
                      onClick={() => formRef.current?.submit()}
                      disabled={!formState.isValid || formState.isSubmitting}
                      sx={{
                        bgcolor: formState.isValid && !formState.isSubmitting ? '#1340FF' : '#B0B0B1',
                        border: '1.5px solid',
                        borderColor: formState.isValid && !formState.isSubmitting ? '#1340FF' : '#B0B0B1',
                        borderBottom: '3px solid',
                        borderBottomColor: formState.isValid && !formState.isSubmitting ? '#0D2BA8' : '#9E9E9F',
                        borderRadius: 1.15,
                        color: '#FFFFFF',
                        height: 44,
                        minWidth: 100,
                        px: 2.5,
                        fontWeight: 600,
                        fontSize: '1rem',
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: formState.isValid && !formState.isSubmitting ? '#0D2BA8' : '#B0B0B1',
                          color: '#FFFFFF',
                        },
                        '&.Mui-disabled': {
                          bgcolor: '#B0B0B1',
                          border: '1.5px solid #B0B0B1',
                          borderBottom: '3px solid #9E9E9F',
                          color: '#FFFFFF',
                        },
                      }}
                    >
                      {formState.isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Save'}
                    </Button>
                  </Stack>
                )}
              </Box>

              {/* Manual Creator Entry Form */}
              <AnimatePresence>
                {showAddCreatorForm && (
                  <ManualCreatorEntryForm
                    ref={formRef}
                    campaignId={campaignId}
                    selectedPlatform={selectedPlatform !== 'ALL' ? selectedPlatform : null}
                    submissionsWithoutInsights={
                      !loadingInsights
                        ? filteredSubmissions.filter(
                            (sub) => !insightsData.find((d) => d.submissionId === sub.id)
                          )
                        : []
                    }
                    onSuccess={() => {
                      setShowAddCreatorForm(false);
                      mutateManualEntries();
                      enqueueSnackbar('Creator entry added successfully', { variant: 'success' });
                    }}
                    onFormStateChange={setFormState}
                  />
                )}
              </AnimatePresence>

              <Grid container spacing={1}>
                {/* eslint-disable react/prop-types */}
                {creatorListRowsSorted.map((row) => {
                  if (row.kind === 'manual') {
                    return (
                      <ManualCreatorCard
                        key={row.dedupKey}
                        entry={row.entry}
                        campaignId={campaignId}
                        onUpdate={mutateManualEntries}
                        onDelete={handleDeleteClick}
                        isDisabled={isDisabled}
                      />
                    );
                  }

                  return (
                    <UserPerformanceCard
                      key={row.dedupKey}
                      submission={row.submission}
                      insightData={row.insightData}
                      engagementRate={row.engagementRate}
                      loadingInsights={loadingInsights}
                    />
                  );
                })}
                {/* eslint-enable react/prop-types */}

                {postingSubmissions.length === 0 && manualEntries.length === 0 && (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        py: 6,
                        px: 3,
                        bgcolor: '#F8F9FA',
                        borderRadius: 2,
                        border: '1px dashed #E0E0E0',
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 1,
                          color: '#6B7280',
                          fontWeight: 500,
                        }}
                      >
                        No Creator Data Yet
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#9CA3AF',
                          maxWidth: 400,
                          mx: 'auto',
                        }}
                      >
                        Creator performance data will appear here once creators submit their posting links
                        and content goes live.
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {filteredSubmissions.length === 0 && postingSubmissions.length > 0 && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      No {selectedPlatform.toLowerCase()} submissions found for this campaign.
                    </Alert>
                  </Grid>
                )}
              </Grid>
          </Box>
        </>
      )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            bgcolor: '#F4F4F4',
            p: 3,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          {/* Icon Circle */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#FF3500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontFamily: 'Instrument Serif',
              lineHeight: 1.1,
              textAlign: 'center',
            }}
          >
            <Box
              component="span"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                lineHeight: 1,
              }}
            >
              🗑️
            </Box>
          </Box>

          {/* Title */}
          <Typography
            sx={{
              fontFamily: 'Instrument Serif',
              fontSize: 36,
              fontWeight: 400,
              lineHeight: 1.111,
              textAlign: 'center',
              color: '#231F20',
            }}
          >
            Delete added creator?
          </Typography>

          {/* Buttons */}
          <Stack spacing={1} sx={{ width: '100%' }}>
            <Button
              fullWidth
              onClick={handleConfirmDelete}
              sx={{
                bgcolor: '#3A3A3C',
                color: '#FFFFFF',
                fontFamily: 'Inter Display, sans-serif',
                fontSize: 16,
                fontWeight: 550,
                lineHeight: 1.25,
                py: '10px',
                px: '16px',
                pb: '13px',
                borderRadius: '8px',
                border: '1px solid #3A3A3C',
                borderBottom: '3px solid #3A3A3C',
                textTransform: 'none',
                transition: 'all 0.2s ease',
                '& .MuiButton-label': {
                  fontFamily: 'Inter Display, sans-serif',
                },
                '&:hover': {
                  bgcolor: '#FF3600',
                  borderColor: '#CC2B00',
                  borderBottom: '3px solid',
                  borderBottomColor: '#CC2B00',
                },
              }}
            >
              Yes
            </Button>
            <Button
              fullWidth
              onClick={handleCloseDeleteModal}
              sx={{
                bgcolor: '#FFFFFF',
                color: '#231F20',
                fontFamily: 'Inter Display, sans-serif',
                fontSize: 16,
                fontWeight: 550,
                lineHeight: 1.25,
                py: '10px',
                px: '16px',
                pb: '13px',
                borderRadius: '8px',
                border: '1px solid #E7E7E7',
                borderBottom: '3px solid #E7E7E7',
                textTransform: 'none',
                transition: 'all 0.2s ease',
                '& .MuiButton-label': {
                  fontFamily: 'Inter Display, sans-serif',
                },
                '&:hover': {
                  bgcolor: '#FFFFFF',
                  borderColor: '#231F20',
                  borderBottom: '3px solid',
                  borderBottomColor: '#231F20',
                },
              }}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
};

CampaignAnalytics.propTypes = {
  campaign: PropTypes.shape({
    id: PropTypes.string,
    submission: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        postUrl: PropTypes.string,
        user: PropTypes.string,
        platform: PropTypes.string,
      })
    ),
  }),
  campaignMutate: PropTypes.func,
  isDisabled: PropTypes.bool,
};

export default CampaignAnalytics;
