/* eslint-disable react/prop-types */
import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';
import React, { useRef, useMemo, useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Link,
  Alert,
  Stack,
  Avatar,
  Button,
  Dialog,
  Divider,
  Skeleton,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';
import { useSocialInsights } from 'src/hooks/use-social-insights';
import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';
import { useGetManualCreatorEntries } from 'src/hooks/useSWR/useGetManualCreatorEntries';

import axiosInstance from 'src/utils/axios';
import { extractPostingSubmissions } from 'src/utils/extractPostingLinks';
import {
  formatNumber,
  getMetricValue,
  parseFormattedNumber,
  calculateSummaryStats,
  formatNumberWithCommas,
  calculateEngagementRate,
} from 'src/utils/socialMetricsCalculator';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';
import { deleteManualCreatorEntry, updateManualCreatorEntry } from 'src/api/manual-creator';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { TopCreatorsLineChart, EngagementRateHeatmap } from 'src/components/trend-analysis';
import {
  ScrollingName,
  AnimatedNumber,
  UserPerformanceCard,
  PlatformOverviewMobile,
  ManualCreatorEntryForm,
  PlatformOverviewDesktop,
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

export function useStreamingText() {
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const queueRef = useRef([]);
  const tickingRef = useRef(false);
  const { socket } = useSocketContext();

  // Drip the queue one char at a time
  const drip = useCallback(() => {
    if (queueRef.current.length === 0) {
      tickingRef.current = false;
      return;
    }
    tickingRef.current = true;
    const char = queueRef.current.shift();
    setText((prev) => prev + char);
    setTimeout(drip, 8);
  }, []);

  useEffect(() => {
    socket.on('report', ({ content }) => {
      setStreaming(true);
      queueRef.current.push(...content.split(''));

      if (!tickingRef.current) drip();
    });

    socket.on('report:done', () => setStreaming(false));

    return () => {
      socket.off('report');
      socket.off('report:done');
    };
  }, [socket, drip]);

  return { text, streaming };
}

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

// Inline edit input field style
const inlineEditFieldStyle = {
  width: '100%',
  minWidth: 0,
  maxWidth: '100%',
  '& .MuiOutlinedInput-root': {
    borderRadius: 1,
    bgcolor: 'white',
    transition: 'all 0.2s ease',
    width: '100%',
    maxWidth: '100%',
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#1340FF',
        borderWidth: '1.5px',
      },
    },
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#1340FF',
      },
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#e7e7e7',
    },
  },
  '& .MuiInputBase-input': {
    py: 1,
    px: 1.5,
    fontSize: '0.95rem',
    color: '#000000',
    '&::placeholder': {
      color: '#9E9E9E',
      opacity: 1,
    },
  },
};

// Manual creator entry card with inline editing
const ManualCreatorCard = ({ entry, campaignId, onUpdate, onDelete, isDisabled = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState({
    views: entry.views,
    likes: entry.likes,
    comments: entry.comments || 0,
    shares: entry.shares,
    saved: entry.saved || 0,
    postUrl: entry.postUrl || '',
  });

  console.log(entry);

  // Calculate engagement rate based on edited values
  const calculatedEngagementRate = useMemo(() => {
    const { views, likes, comments, shares, saved } = editValues;
    if (!views || views === 0) return 0;
    if (entry.platform === 'Instagram') {
      return ((likes + comments + shares + (saved || 0)) / views) * 100;
    }
    return ((likes + comments + shares) / views) * 100;
  }, [editValues, entry.platform]);

  const handleStartEdit = () => {
    setEditValues({
      views: entry.views,
      likes: entry.likes,
      comments: entry.comments || 0,
      shares: entry.shares,
      saved: entry.saved || 0,
      postUrl: entry.postUrl || '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditValues({
      views: entry.views,
      likes: entry.likes,
      comments: entry.comments || 0,
      shares: entry.shares,
      saved: entry.saved || 0,
      postUrl: entry.postUrl || '',
    });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await updateManualCreatorEntry(campaignId, entry.id, {
        views: Number(editValues.views),
        likes: Number(editValues.likes),
        comments: Number(editValues.comments),
        shares: Number(editValues.shares),
        saved: entry.platform === 'Instagram' ? Number(editValues.saved) : undefined,
        postUrl: editValues.postUrl || undefined,
      });
      onUpdate?.();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    // Parse the formatted input (remove commas) and convert to number
    const cleaned = parseFormattedNumber(value);
    const numValue = cleaned === '' ? 0 : Number(cleaned);
    setEditValues((prev) => ({ ...prev, [field]: numValue }));
  };

  const handlePostUrlChange = (value) => {
    setEditValues((prev) => ({ ...prev, postUrl: value }));
  };

  // Icon button style for edit mode (checkmark/cross)
  const actionIconStyle = (isConfirm) => ({
    width: 36,
    height: 36,
    borderRadius: 1.5,
    border: '1px solid #E7E7E7',
    borderBottom: '3px solid #E7E7E7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isSaving ? 'not-allowed' : 'pointer',
    opacity: isSaving ? 0.6 : 1,
    transition: 'all 0.2s ease',
    '&:hover': isSaving
      ? {}
      : {
          bgcolor: isConfirm ? '#DCFCE7' : '#FEE2E2',
          borderColor: isConfirm ? '#22C55E' : '#EF4444',
          borderBottom: '3px solid',
          borderBottomColor: isConfirm ? '#22C55E' : '#EF4444',
        },
  });

  return (
    <Grid item xs={12}>
      <Box borderRadius={1} border="2px solid #F5F5F5">
        <Box sx={{ py: 0.5 }}>
          {/* Desktop Layout */}
          <Box
            px={2}
            display={{ xs: 'none', md: 'flex' }}
            alignItems="center"
            gap={{ md: 1, lg: 1.5 }}
            sx={{ minWidth: 0, overflow: 'hidden' }}
          >
            {/* Left Side: Creator Info */}
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{
                width: 210,
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <Avatar
                src={entry.photoUrl || null}
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: entry.platform === 'Instagram' ? '#E4405F' : '#000000',
                  border: '1px solid #EBEBEB',
                  flexShrink: 0,
                }}
              >
                {entry.creatorName?.charAt(0) || 'U'}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <ScrollingName name={entry.creatorName || 'Unknown Creator'} />
                <Typography
                  sx={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#636366',
                    fontSize: '0.875rem',
                  }}
                >
                  {entry.creatorUsername}
                </Typography>
              </Box>
            </Stack>

            {/* Center: Metrics Display/Edit */}
            <Box
              display="flex"
              alignItems="center"
              flex={1}
              justifyContent="space-between"
              sx={{ mx: 1, minWidth: 0, overflow: 'hidden' }}
            >
              {/* Engagement Rate - always display only */}
              <Box sx={{ textAlign: 'left', minWidth: { md: 0, lg: 110 }, pr: { md: 1, lg: 1.5 } }}>
                <Typography
                  fontFamily="Aileron"
                  fontSize={{ md: 14, lg: 16, xl: 18 }}
                  fontWeight={600}
                  color="#636366"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  <Box component="span" pr={1.5} sx={{ display: { xs: 'none', xl: 'inline' } }}>
                    Engagement Rate
                  </Box>
                  <Box component="span" sx={{ display: { xs: 'inline', xl: 'none' } }}>
                    Eng. Rate
                  </Box>
                </Typography>
                <Typography
                  fontFamily="Instrument Serif"
                  fontSize={{ md: 28, lg: 36, xl: 40 }}
                  fontWeight={400}
                  color="#1340FF"
                  lineHeight={1.1}
                  sx={{
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  {isEditing
                    ? calculatedEngagementRate.toFixed(2)
                    : entry.engagementRate?.toFixed(2) || '0.00'}
                  %
                </Typography>
              </Box>

              <Divider
                sx={{ width: '1px', height: '55px', backgroundColor: '#1340FF', flexShrink: 0 }}
              />

              {/* Views */}
              <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', px: 1 }}>
                <Typography
                  fontFamily="Aileron"
                  fontSize={{ md: 14, lg: 16, xl: 18 }}
                  fontWeight={600}
                  color="#636366"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Views
                </Typography>
                {isEditing ? (
                  <TextField
                    value={formatNumberWithCommas(editValues.views)}
                    onChange={(e) => handleFieldChange('views', e.target.value)}
                    type="text"
                    size="small"
                    inputProps={{ min: 0 }}
                    sx={inlineEditFieldStyle}
                  />
                ) : (
                  <Typography
                    fontFamily="Instrument Serif"
                    fontSize={{ md: 28, lg: 36, xl: 40 }}
                    fontWeight={400}
                    color="#1340FF"
                    lineHeight={1.1}
                  >
                    {formatNumber(entry.views)}
                  </Typography>
                )}
              </Box>

              {/* Divider */}
              <Divider
                sx={{ width: '1px', height: '55px', backgroundColor: '#1340FF', flexShrink: 0 }}
              />

              {/* Likes */}
              <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', px: 1 }}>
                <Typography
                  fontFamily="Aileron"
                  fontSize={{ md: 14, lg: 16, xl: 18 }}
                  fontWeight={600}
                  color="#636366"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Likes
                </Typography>
                {isEditing ? (
                  <TextField
                    value={formatNumberWithCommas(editValues.likes)}
                    onChange={(e) => handleFieldChange('likes', e.target.value)}
                    type="text"
                    size="small"
                    inputProps={{ min: 0 }}
                    sx={inlineEditFieldStyle}
                  />
                ) : (
                  <Typography
                    fontFamily="Instrument Serif"
                    fontSize={{ md: 28, lg: 36, xl: 40 }}
                    fontWeight={400}
                    color="#1340FF"
                    lineHeight={1.1}
                  >
                    {formatNumber(entry.likes)}
                  </Typography>
                )}
              </Box>

              <Divider
                sx={{ width: '1px', height: '55px', backgroundColor: '#1340FF', flexShrink: 0 }}
              />

              {/* Comments */}
              <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', px: 1 }}>
                <Typography
                  fontFamily="Aileron"
                  fontSize={{ md: 14, lg: 16, xl: 18 }}
                  fontWeight={600}
                  color="#636366"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Comments
                </Typography>
                {isEditing ? (
                  <TextField
                    value={formatNumberWithCommas(editValues.comments)}
                    onChange={(e) => handleFieldChange('comments', e.target.value)}
                    type="text"
                    size="small"
                    inputProps={{ min: 0 }}
                    sx={inlineEditFieldStyle}
                  />
                ) : (
                  <Typography
                    fontFamily="Instrument Serif"
                    fontSize={{ md: 28, lg: 36, xl: 40 }}
                    fontWeight={400}
                    color="#1340FF"
                    lineHeight={1.1}
                  >
                    {formatNumber(entry.comments || 0)}
                  </Typography>
                )}
              </Box>

              <Divider
                sx={{
                  width: '1px',
                  height: '55px',
                  backgroundColor: '#1340FF',
                  flexShrink: 0,
                  ml: 2,
                }}
              />

              {/* Shares */}
              <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', px: 1 }}>
                <Typography
                  fontFamily="Aileron"
                  fontSize={{ md: 14, lg: 16, xl: 18 }}
                  fontWeight={600}
                  color="#636366"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Shares
                </Typography>
                {isEditing ? (
                  <TextField
                    value={formatNumberWithCommas(editValues.shares)}
                    onChange={(e) => handleFieldChange('shares', e.target.value)}
                    type="text"
                    size="small"
                    inputProps={{ min: 0 }}
                    sx={inlineEditFieldStyle}
                  />
                ) : (
                  <Typography
                    fontFamily="Instrument Serif"
                    fontSize={{ md: 28, lg: 36, xl: 40 }}
                    fontWeight={400}
                    color="#1340FF"
                    lineHeight={1.1}
                  >
                    {formatNumber(entry.shares)}
                  </Typography>
                )}
              </Box>

              {/* Saves - Instagram only, or placeholder for TikTok to maintain alignment */}
              {entry.platform === 'Instagram' ? (
                <>
                  <Divider
                    sx={{ width: '1px', height: '55px', backgroundColor: '#1340FF', flexShrink: 0 }}
                  />
                  <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, overflow: 'hidden', px: 1 }}>
                    <Typography
                      fontFamily="Aileron"
                      fontSize={{ md: 14, lg: 16, xl: 18 }}
                      fontWeight={600}
                      color="#636366"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Saves
                    </Typography>
                    {isEditing ? (
                      <TextField
                        value={formatNumberWithCommas(editValues.saved)}
                        onChange={(e) => handleFieldChange('saved', e.target.value)}
                        type="text"
                        size="small"
                        inputProps={{ min: 0 }}
                        sx={inlineEditFieldStyle}
                      />
                    ) : (
                      <Typography
                        fontFamily="Instrument Serif"
                        fontSize={{ md: 28, lg: 36, xl: 40 }}
                        fontWeight={400}
                        color="#1340FF"
                        lineHeight={1.1}
                      >
                        {formatNumber(entry.saved || 0)}
                      </Typography>
                    )}
                  </Box>
                </>
              ) : (
                // Empty placeholder for TikTok to maintain alignment with Instagram card
                <>
                  <Divider
                    sx={{
                      width: '1px',
                      height: '55px',
                      backgroundColor: 'transparent',
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0, px: 1 }}>
                    <Box sx={{ height: { md: 20, lg: 22, xl: 24 } }} />
                    <Box
                      sx={{
                        position: 'relative',
                        minHeight: 44,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ height: { md: 28, lg: 36, xl: 40 } }} />
                    </Box>
                  </Box>
                </>
              )}

              {/* Post Link - Only show when editing */}
              <AnimatePresence>
                {isEditing && (
                  <>
                    <Box
                      key="post-link-divider"
                      component={m.div}
                      layout
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{
                        layout: { duration: 0, ease: 'linear' },
                        opacity: { duration: 0, ease: 'linear' },
                        scaleX: { duration: 0, ease: 'linear' },
                      }}
                      style={{ transformOrigin: 'left center' }}
                    >
                      <Divider
                        sx={{
                          width: '1px',
                          height: '55px',
                          backgroundColor: '#1340FF',
                          mx: { md: 1, lg: 1.5 },
                          flexShrink: 0,
                        }}
                      />
                    </Box>
                    <Box
                      key="post-link-field"
                      component={m.div}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{
                        layout: { duration: 0, ease: 'linear' },
                        opacity: { duration: 0, ease: 'linear' },
                        scale: { duration: 0, ease: 'linear' },
                      }}
                      sx={{
                        textAlign: 'left',
                        flex: 1,
                        minWidth: 0,
                        px: { md: 0.75, lg: 1 },
                        overflow: 'hidden',
                      }}
                    >
                      <Typography
                        fontFamily="Aileron"
                        fontSize={{ md: 14, lg: 16, xl: 18 }}
                        fontWeight={600}
                        color="#636366"
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        Post Link
                      </Typography>
                      <TextField
                        value={editValues.postUrl}
                        onChange={(e) => handlePostUrlChange(e.target.value)}
                        placeholder="Post Link"
                        type="text"
                        size="small"
                        sx={inlineEditFieldStyle}
                      />
                    </Box>
                  </>
                )}
              </AnimatePresence>
            </Box>

            {/* Right Side: Thumbnail and Action Icons */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flexShrink: 0, minWidth: 0 }}
            >
              {/* Thumbnail - Animate in when not editing */}
              <AnimatePresence>
                {!isEditing && (
                  <Box
                    key="thumbnail"
                    component={m.div}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      layout: { duration: 0, ease: 'linear' },
                      opacity: { duration: 0, ease: 'linear' },
                      scale: { duration: 0, ease: 'linear' },
                    }}
                    sx={{ flexShrink: 0 }}
                  >
                    <Box
                      component={entry.postUrl ? Link : 'div'}
                      href={entry.postUrl || undefined}
                      target={entry.postUrl ? '_blank' : undefined}
                      rel={entry.postUrl ? 'noopener' : undefined}
                      sx={{
                        display: 'block',
                        textDecoration: 'none',
                        position: 'relative',
                        cursor: entry.postUrl ? 'pointer' : 'default',
                        '&:hover .play-overlay': {
                          bgcolor: 'rgba(255, 255, 255, 0.25)',
                          transform: 'translate(-50%, -50%) scale(1.1)',
                        },
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <Box
                        sx={{
                          width: 140,
                          height: 80,
                          borderRadius: 2,
                          bgcolor: '#0F2D5C',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'flex-end',
                          position: 'relative',
                          overflow: 'hidden',
                          p: 1,
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background:
                              'linear-gradient(135deg, rgba(19, 64, 255, 0.1) 0%, rgba(15, 45, 92, 0.2) 100%)',
                            pointerEvents: 'none',
                          },
                        }}
                      >
                        {/* Cult Creative Logo - Top Right */}
                        <Box
                          component="img"
                          src="/logo/newlogo.svg"
                          alt="Cult Creative"
                          sx={{
                            width: 24,
                            height: 28,
                            opacity: 0.6,
                            position: 'relative',
                            zIndex: 1,
                          }}
                        />

                        {/* Play Button Overlay - Only show when clickable */}
                        {entry.postUrl && (
                          <Box
                            className="play-overlay"
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              bgcolor: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(4px)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease',
                              zIndex: 2,
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                            }}
                          >
                            <Iconify
                              icon="solar:play-bold"
                              sx={{ color: '#FFFFFF', width: 16, height: 16, ml: 0.3 }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}
              </AnimatePresence>

              {/* Action Icons - Edit/Delete or Save/Cancel */}
              <Stack direction="column" spacing={1}>
                <Stack direction="column" spacing={1}>
                  {/* Save (Checkmark) / Edit */}
                  <Box
                    onClick={() => {
                      if (isDisabled) return;
                      if (isEditing) {
                        if (!isSaving) {
                          handleSaveEdit();
                        }
                      } else {
                        handleStartEdit();
                      }
                    }}
                    sx={
                      isEditing
                        ? actionIconStyle(true)
                        : {
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            border: '1px solid #E7E7E7',
                            borderBottom: '3px solid #E7E7E7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            opacity: isDisabled ? 0.5 : 1,
                            transition: 'all 0.2s ease',
                            '&:hover': isDisabled
                              ? {}
                              : {
                                  bgcolor: '#f5f5f5',
                                  borderColor: '#221f20',
                                  borderBottom: '3px solid',
                                  borderBottomColor: '#221f20',
                                },
                          }
                    }
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <AnimatePresence mode="wait">
                        {isEditing ? (
                          <m.div
                            key="check-icon"
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeInOut' }}
                            style={{
                              position: 'absolute',
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isSaving ? (
                              <CircularProgress size={16} sx={{ color: '#22C55E' }} />
                            ) : (
                              <Iconify icon="mdi:check" width={20} sx={{ color: '#22C55E' }} />
                            )}
                          </m.div>
                        ) : (
                          <m.div
                            key="edit-icon"
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeInOut' }}
                            style={{
                              position: 'absolute',
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Iconify
                              icon="mdi:pencil-outline"
                              width={18}
                              sx={{ color: '#221f20' }}
                            />
                          </m.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  </Box>
                  {/* Cancel (Cross) / Delete */}
                  <Box
                    onClick={() => {
                      if (isDisabled && !isEditing) return;
                      if (isEditing) {
                        if (!isSaving) {
                          handleCancelEdit();
                        }
                      } else {
                        onDelete?.(entry);
                      }
                    }}
                    sx={
                      isEditing
                        ? actionIconStyle(false)
                        : {
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            border: '1px solid #E7E7E7',
                            borderBottom: '3px solid #E7E7E7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            opacity: isDisabled ? 0.5 : 1,
                            transition: 'all 0.2s ease',
                            '&:hover': isDisabled
                              ? {}
                              : {
                                  bgcolor: '#FEE2E2',
                                  borderColor: '#EF4444',
                                  borderBottom: '3px solid',
                                  borderBottomColor: '#EF4444',
                                },
                          }
                    }
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <AnimatePresence mode="wait">
                        {isEditing ? (
                          <m.div
                            key="close-icon"
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeInOut' }}
                            style={{
                              position: 'absolute',
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Iconify icon="mdi:close" width={20} sx={{ color: '#EF4444' }} />
                          </m.div>
                        ) : (
                          <m.div
                            key="delete-icon"
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeInOut' }}
                            style={{
                              position: 'absolute',
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Iconify
                              icon="mdi:trash-can-outline"
                              width={18}
                              sx={{ color: '#EF4444' }}
                            />
                          </m.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  </Box>
                </Stack>
              </Stack>
            </Stack>
          </Box>

          {/* Mobile Layout */}
          <Box display={{ xs: 'block', md: 'none' }} px={2} py={1}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  src={entry.photoUrl}
                  sx={{
                    width: 44,
                    height: 44,
                    bgcolor: entry.platform === 'Instagram' ? '#E4405F' : '#000000',
                  }}
                >
                  {entry.creatorName?.charAt(0) || 'U'}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <ScrollingName name={entry.creatorName || 'Unknown Creator'} />
                  <Typography color="text.secondary" fontSize={14} sx={{ mt: 0.5 }}>
                    {entry.creatorUsername}
                  </Typography>
                </Box>
              </Stack>
              {/* Mobile Action Icons */}
              <Stack direction="row" spacing={1}>
                {/* Save (Checkmark) / Edit */}
                <Box
                  onClick={() => {
                    if (isEditing) {
                      if (!isSaving) {
                        handleSaveEdit();
                      }
                    } else {
                      handleStartEdit();
                    }
                  }}
                  sx={
                    isEditing
                      ? actionIconStyle(true)
                      : {
                          width: 36,
                          height: 36,
                          borderRadius: 1,
                          border: '1.5px solid #e7e7e7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          '&:active': {
                            bgcolor: '#f5f5f5',
                          },
                        }
                  }
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {isEditing ? (
                        <m.div
                          key="check-icon"
                          initial={{ x: 100, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -100, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSaving ? (
                            <CircularProgress size={14} sx={{ color: '#22C55E' }} />
                          ) : (
                            <Iconify icon="mdi:check" width={18} sx={{ color: '#22C55E' }} />
                          )}
                        </m.div>
                      ) : (
                        <m.div
                          key="edit-icon"
                          initial={{ x: 100, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -100, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Iconify icon="mdi:pencil-outline" width={18} sx={{ color: '#221f20' }} />
                        </m.div>
                      )}
                    </AnimatePresence>
                  </Box>
                </Box>
                {/* Cancel (Cross) / Delete */}
                <Box
                  onClick={() => {
                    if (isEditing) {
                      if (!isSaving) {
                        handleCancelEdit();
                      }
                    } else {
                      onDelete?.(entry);
                    }
                  }}
                  sx={
                    isEditing
                      ? actionIconStyle(false)
                      : {
                          width: 36,
                          height: 36,
                          borderRadius: 1,
                          border: '1.5px solid #e7e7e7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          '&:active': {
                            bgcolor: '#FEE2E2',
                          },
                        }
                  }
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {isEditing ? (
                        <m.div
                          key="close-icon"
                          initial={{ x: 100, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -100, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Iconify icon="mdi:close" width={18} sx={{ color: '#EF4444' }} />
                        </m.div>
                      ) : (
                        <m.div
                          key="delete-icon"
                          initial={{ x: 100, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -100, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Iconify
                            icon="mdi:trash-can-outline"
                            width={18}
                            sx={{ color: '#EF4444' }}
                          />
                        </m.div>
                      )}
                    </AnimatePresence>
                  </Box>
                </Box>
              </Stack>
            </Stack>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography fontSize={12} color="text.secondary">
                  Engagement Rate
                </Typography>
                <Typography fontFamily="Instrument Serif" fontSize={24} color="#1340FF">
                  {isEditing
                    ? calculatedEngagementRate.toFixed(2)
                    : entry.engagementRate?.toFixed(2) || '0.00'}
                  %
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography fontSize={12} color="text.secondary">
                  Views
                </Typography>
                {isEditing ? (
                  <TextField
                    value={formatNumberWithCommas(editValues.views)}
                    onChange={(e) => handleFieldChange('views', e.target.value)}
                    type="text"
                    size="small"
                    inputProps={{ min: 0 }}
                    sx={{ ...inlineEditFieldStyle, width: '100%' }}
                  />
                ) : (
                  <Typography fontFamily="Instrument Serif" fontSize={24} color="#1340FF">
                    {formatNumber(entry.views)}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={6}>
                <Typography fontSize={12} color="text.secondary">
                  Likes
                </Typography>
                {isEditing ? (
                  <TextField
                    value={formatNumberWithCommas(editValues.likes)}
                    onChange={(e) => handleFieldChange('likes', e.target.value)}
                    type="text"
                    size="small"
                    inputProps={{ min: 0 }}
                    sx={{ ...inlineEditFieldStyle, width: '100%' }}
                  />
                ) : (
                  <Typography fontFamily="Instrument Serif" fontSize={24} color="#1340FF">
                    {formatNumber(entry.likes)}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={6}>
                <Typography fontSize={12} color="text.secondary">
                  Comments
                </Typography>
                {isEditing ? (
                  <TextField
                    value={formatNumberWithCommas(editValues.comments)}
                    onChange={(e) => handleFieldChange('comments', e.target.value)}
                    type="text"
                    size="small"
                    inputProps={{ min: 0 }}
                    sx={{ ...inlineEditFieldStyle, width: '100%' }}
                  />
                ) : (
                  <Typography fontFamily="Instrument Serif" fontSize={24} color="#1340FF">
                    {formatNumber(entry.comments || 0)}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={6}>
                <Typography fontSize={12} color="text.secondary">
                  Shares
                </Typography>
                {isEditing ? (
                  <TextField
                    value={formatNumberWithCommas(editValues.shares)}
                    onChange={(e) => handleFieldChange('shares', e.target.value)}
                    type="text"
                    size="small"
                    inputProps={{ min: 0 }}
                    sx={{ ...inlineEditFieldStyle, width: '100%' }}
                  />
                ) : (
                  <Typography fontFamily="Instrument Serif" fontSize={24} color="#1340FF">
                    {formatNumber(entry.shares)}
                  </Typography>
                )}
              </Grid>
              {entry.platform === 'Instagram' && (
                <Grid item xs={6}>
                  <Typography fontSize={12} color="text.secondary">
                    Saves
                  </Typography>
                  {isEditing ? (
                    <TextField
                      value={formatNumberWithCommas(editValues.saved)}
                      onChange={(e) => handleFieldChange('saved', e.target.value)}
                      type="text"
                      size="small"
                      inputProps={{ min: 0 }}
                      sx={{ ...inlineEditFieldStyle, width: '100%' }}
                    />
                  ) : (
                    <Typography fontFamily="Instrument Serif" fontSize={24} color="#1340FF">
                      {formatNumber(entry.saved || 0)}
                    </Typography>
                  )}
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </Box>
    </Grid>
  );
};

ManualCreatorCard.propTypes = {
  entry: PropTypes.shape({
    id: PropTypes.string,
    creatorName: PropTypes.string,
    creatorUsername: PropTypes.string,
    platform: PropTypes.string,
    postUrl: PropTypes.string,
    views: PropTypes.number,
    likes: PropTypes.number,
    comments: PropTypes.number,
    shares: PropTypes.number,
    saved: PropTypes.number,
    engagementRate: PropTypes.number,
  }).isRequired,
  campaignId: PropTypes.string.isRequired,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
  isDisabled: PropTypes.bool,
};

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
  const [formState, setFormState] = useState({
    isValid: false,
    isFormComplete: false,
    isSubmitting: false,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const formRef = useRef(null);

  const lgUp = useResponsive('up', 'lg');
  const { socket } = useSocketContext();
  const { enqueueSnackbar } = useSnackbar();

  // Check if user is a client
  const isClient = user?.role?.includes('client');

  // Fetch manual creator entries
  const { entries: manualEntries, mutate: mutateManualEntries } =
    useGetManualCreatorEntries(campaignId);

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
    return insightsData.filter((data) => {
      // Safety check: ensure data and submissionId exist
      if (!data || !data.submissionId) {
        return false;
      }
      const submission = postingSubmissions.find((sub) => sub && sub.id === data.submissionId);
      return submission && submission.platform === selectedPlatform;
    });
  }, [insightsData, selectedPlatform, postingSubmissions]);

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

  const handleNextPage = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => prev - 1);
  };

  // Socket event listener for media kit connections
  useEffect(() => {
    if (!socket || !campaignId) return undefined;

    const handleAnalyticsRefresh = (data) => {
      console.log('📡 Received analytics refresh event:', data);

      // Check if this user has submissions in current campaign
      const hasUserSubmissions = postingSubmissions.some((sub) => sub.user === data.userId);

      if (hasUserSubmissions) {
        console.log(`🔄 ${data.platform} connected for user, refreshing analytics...`);
        enqueueSnackbar(`${data.platform} connected! Refreshing analytics...`, {
          variant: 'success',
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
    <Box sx={{ mb: 3 }}>
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

          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
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
                  background:
                    reportState === 'loading'
                      ? 'linear-gradient(90deg, #B8B8B8 0%, #9E9E9E 100%)'
                      : 'linear-gradient(90deg, #8A5AFE 0%, #1340FF 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
                  boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.1) inset',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '14px',
                  textTransform: 'none',
                  '&:hover': {
                    background:
                      reportState === 'loading'
                        ? 'linear-gradient(90deg, #B8B8B8 0%, #9E9E9E 100%)'
                        : 'linear-gradient(90deg, #7A4AEE 0%, #0330EF 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
                    boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.15) inset',
                  },
                  '&:active': {
                    boxShadow:
                      reportState === 'loading'
                        ? '0px -3px 0px 0px rgba(0, 0, 0, 0.1) inset'
                        : '0px -1px 0px 0px rgba(0, 0, 0, 0.1) inset',
                    transform: reportState === 'loading' ? 'none' : 'translateY(1px)',
                  },
                  '&:disabled': {
                    color: '#FFFFFF',
                  },
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
                      mr: 1,
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
                  background:
                    'linear-gradient(90deg, #8A5AFE 0%, #1340FF 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
                  boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.1) inset',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '14px',
                  textTransform: 'none',
                  '&:hover': {
                    background:
                      'linear-gradient(90deg, #7A4AEE 0%, #0330EF 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
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
              <Box>
                <CoreMetricsSection
                  insightsData={filteredInsightsData}
                  summaryStats={summaryStats}
                />
              </Box>

              {/* Section 2: Platform Overview */}
              <Box>
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
                mb={2}
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
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
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
                          bgcolor:
                            formState.isValid && !formState.isSubmitting ? '#1340FF' : '#B0B0B1',
                          border: '1.5px solid',
                          borderColor:
                            formState.isValid && !formState.isSubmitting ? '#1340FF' : '#B0B0B1',
                          borderBottom: '3px solid',
                          borderBottomColor:
                            formState.isValid && !formState.isSubmitting ? '#0D2BA8' : '#9E9E9F',
                          borderRadius: 1.15,
                          color: '#FFFFFF',
                          height: 44,
                          minWidth: 100,
                          px: 2.5,
                          fontWeight: 600,
                          fontSize: '1rem',
                          textTransform: 'none',
                          '&:hover': {
                            bgcolor:
                              formState.isValid && !formState.isSubmitting ? '#0D2BA8' : '#B0B0B1',
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
                        {formState.isSubmitting ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          'Save'
                        )}
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
                  {/* Manual Creator Entries */}
                  {manualEntries
                    .filter(
                      (entry) => selectedPlatform === 'ALL' || entry.platform === selectedPlatform
                    )
                    .map((entry) => (
                      <ManualCreatorCard
                        key={entry.id}
                        entry={entry}
                        campaignId={campaignId}
                        onUpdate={mutateManualEntries}
                        onDelete={handleDeleteClick}
                        isDisabled={isDisabled}
                      />
                    ))}

                  {/* eslint-disable react/prop-types */}
                  {paginationData.displayedSubmissions.map((submission) => {
                    const insightData = insightsData.find(
                      (data) => data.submissionId === submission.id
                    );
                    const engagementRate = insightData
                      ? calculateEngagementRate(insightData.insight)
                      : 0;

                    // Don't render card when there's definitively no insight data (after loading)
                    if (!insightData && !loadingInsights) return null;

                    return (
                      <UserPerformanceCard
                        key={submission.id}
                        submission={submission}
                        insightData={insightData}
                        engagementRate={engagementRate}
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
                          Creator performance data will appear here once creators submit their
                          posting links and content goes live.
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

          {/* Pagination Controls */}
          {paginationData.totalPages > 1 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                mt: 3,
                pb: 2,
                gap: 0.3,
              }}
            >
              {/* Previous Button */}
              <Button
                onClick={handlePrevPage}
                disabled={!paginationData.hasPrevPage}
                sx={{
                  minWidth: 'auto',
                  p: 0,
                  backgroundColor: 'transparent',
                  color: paginationData.hasPrevPage ? '#000000' : '#8E8E93',
                  border: 'none',
                  fontSize: 20,
                  fontWeight: 400,
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                  '&:disabled': {
                    backgroundColor: 'transparent',
                    color: '#8E8E93',
                  },
                }}
              >
                <ChevronLeftRounded size={16} />
              </Button>

              {/* Page Numbers */}
              {(() => {
                const pageButtons = [];
                const showEllipsis = paginationData.totalPages > 3;

                if (!showEllipsis) {
                  // Show all pages if 3 or fewer
                  for (let i = 1; i <= paginationData.totalPages; i += 1) {
                    pageButtons.push(
                      <Button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        sx={{
                          minWidth: 'auto',
                          p: 0,
                          mx: 1,
                          backgroundColor: 'transparent',
                          color: currentPage === i ? '#000000' : '#8E8E93',
                          border: 'none',
                          fontSize: 16,
                          fontWeight: 400,
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        {i}
                      </Button>
                    );
                  }
                } else {
                  // Show 1, current-1, current, current+1, ..., last
                  pageButtons.push(
                    <Button
                      key={1}
                      onClick={() => setCurrentPage(1)}
                      sx={{
                        minWidth: 'auto',
                        p: 0,
                        mx: 1,
                        backgroundColor: 'transparent',
                        color: currentPage === 1 ? '#000000' : '#8E8E93',
                        border: 'none',
                        fontSize: 16,
                        fontWeight: 400,
                        '&:hover': {
                          backgroundColor: 'transparent',
                        },
                      }}
                    >
                      1
                    </Button>
                  );

                  if (currentPage > 3) {
                    pageButtons.push(
                      <Typography key="ellipsis1" sx={{ mx: 1, color: '#8E8E93', fontSize: 16 }}>
                        ...
                      </Typography>
                    );
                  }

                  // Show current page and adjacent pages
                  for (
                    let i = Math.max(2, currentPage - 1);
                    i <= Math.min(paginationData.totalPages - 1, currentPage + 1);
                    i += 1
                  ) {
                    pageButtons.push(
                      <Button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        sx={{
                          minWidth: 'auto',
                          p: 0,
                          mx: 1,
                          backgroundColor: 'transparent',
                          color: currentPage === i ? '#000000' : '#8E8E93',
                          border: 'none',
                          fontSize: 16,
                          fontWeight: 400,
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        {i}
                      </Button>
                    );
                  }

                  if (currentPage < paginationData.totalPages - 2) {
                    pageButtons.push(
                      <Typography key="ellipsis2" sx={{ mx: 1, color: '#8E8E93', fontSize: 16 }}>
                        ...
                      </Typography>
                    );
                  }

                  if (paginationData.totalPages > 1) {
                    pageButtons.push(
                      <Button
                        key={paginationData.totalPages}
                        onClick={() => setCurrentPage(paginationData.totalPages)}
                        sx={{
                          minWidth: 'auto',
                          p: 0,
                          mx: 1,
                          backgroundColor: 'transparent',
                          color: currentPage === paginationData.totalPages ? '#000000' : '#8E8E93',
                          border: 'none',
                          fontSize: 16,
                          fontWeight: 400,
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        {paginationData.totalPages}
                      </Button>
                    );
                  }
                }

                return pageButtons;
              })()}

              {/* Next Button */}
              <Button
                onClick={handleNextPage}
                disabled={!paginationData.hasNextPage}
                sx={{
                  minWidth: 'auto',
                  p: 0,
                  backgroundColor: 'transparent',
                  color: paginationData.hasNextPage ? '#000000' : '#8E8E93',
                  border: 'none',
                  fontSize: 16,
                  fontWeight: 400,
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                  '&:disabled': {
                    backgroundColor: 'transparent',
                    color: '#8E8E93',
                  },
                }}
              >
                <ChevronRightRounded size={16} />
              </Button>
            </Box>
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
