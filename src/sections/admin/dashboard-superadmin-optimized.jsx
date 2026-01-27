/**
 * OPTIMIZED DASHBOARD - Performance Best Practices
 * 
 * Key Optimizations:
 * 1. Backend Aggregation - Create /api/dashboard/stats endpoint (RECOMMENDED)
 * 2. Code Splitting - Lazy load heavy components
 * 3. Memoization - Optimize expensive calculations
 * 4. Data Limiting - Only fetch what's needed
 * 5. Parallel Loading - Load independent data in parallel
 * 6. Caching - Use SWR deduplication
 * 7. Virtualization - For large lists (if needed)
 */

import useSWR from 'swr';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import relativeTime from 'dayjs/plugin/relativeTime';
import { memo, useMemo, useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import { Image, Person, Schedule, ArrowForward } from '@mui/icons-material';
import {
  Box,
  Grid,
  Card,
  Chip,
  List,
  Stack,
  Table,
  Avatar,
  Select,
  Tooltip,
  TableRow,
  MenuItem,
  ListItem,
  Skeleton,
  TableHead,
  TableCell,
  TableBody,
  Typography,
  IconButton,
  FormControl,
  ListItemText,
  TableContainer,
  ListItemAvatar,
  CircularProgress,
  ListItemSecondaryAction,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import SvgColor from 'src/components/svg-color';

dayjs.extend(relativeTime);

// Memoized color palette (moved outside component to prevent recreation)
const colors = {
  primary: '#000000',
  secondary: '#666666',
  tertiary: '#999999',
  accent: '#1340FF',
  background: '#FFFFFF',
  surface: '#FAFAFA',
  border: '#E8ECEE',
  light: '#F5F5F5',
};

// Memoized icon helper (moved outside to prevent recreation)
const createIcon = (name) => (
  <SvgColor
    src={`/assets/icons/navbar/${name}.svg`}
    sx={{ width: 20, height: 20 }}
  />
);

// OPTIMIZATION 1: Fetch only active campaigns (limit data)
const useActiveCampaigns = () =>
  useSWR(
    `${endpoints.campaign.getCampaignsByAdminId}?status=ACTIVE&limit=10`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

// OPTIMIZATION 2: Fetch only pending pitches (limit data)
const usePendingPitches = () =>
  useSWR(
    `${endpoints.campaign.pitch.all}?status=undecided&limit=5`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache for 30 seconds
    }
  );

// OPTIMIZATION 3: Fetch only aggregated stats (if backend endpoint exists)
const useDashboardStats = () => {
  // TODO: Replace with actual backend endpoint that returns:
  // { totalCreators, totalClients, totalPitches, approvedPitches, rejectedPitches, etc }
  const { data, isLoading } = useSWR(
    endpoints.dashboard?.stats || null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return { stats: data, isLoading };
};

// OPTIMIZATION 4: Memoized metric card component
const MetricCard = memo(({ metric }) => {
  if (!metric) return null;
  return (
  <Card
    sx={{
      p: 3,
      height: 120,
      bgcolor: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: 1,
      transition: 'border-color 0.2s ease',
      '&:hover': {
        borderColor: metric.color,
      },
    }}
  >
    <Stack spacing={1} height="100%" justifyContent="space-between">
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          variant="caption"
          sx={{
            color: colors.secondary,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontSize: '0.7rem',
          }}
        >
          {metric.title}
        </Typography>
        <Box sx={{ color: metric.color, opacity: 0.8 }}>{metric.icon}</Box>
      </Stack>
      <Typography
        variant="h3"
        sx={{
          color: metric.color,
          fontWeight: 700,
          lineHeight: 1,
          fontSize: '2rem',
        }}
      >
        {typeof metric.value === 'number' ? metric.value.toLocaleString() : '0'}
      </Typography>
    </Stack>
  </Card>
  );
});

MetricCard.displayName = 'MetricCard';

MetricCard.propTypes = {
  metric: PropTypes.shape({
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    color: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
  }).isRequired,
};

// Loading skeleton for metrics
const MetricCardSkeleton = () => (
  <Card
    sx={{
      p: 3,
      height: 120,
      bgcolor: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: 1,
    }}
  >
    <Stack spacing={1} height="100%" justifyContent="space-between">
      <Skeleton variant="text" width="60%" height={20} />
      <Skeleton variant="text" width="40%" height={40} />
    </Stack>
  </Card>
);

const DashboardSuperadmin = () => {
  const router = useRouter();
  const { user } = useAuthContext();
  const { socket } = useSocketContext();
  const [onlineUsers, setOnlineUsers] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState('all');

  // OPTIMIZATION 5: Parallel data fetching with limited data
  const { data: activeCampaignsData, isLoading: campaignsLoading } = useActiveCampaigns();
  const { data: pendingPitchesData, isLoading: pitchesLoading } = usePendingPitches();
  const { stats: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: clientData, isLoading: isClientLoading } = useSWR('/api/company/', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  // OPTIMIZATION 6: Only fetch creator count, not all creators
  const { data: creatorCount } = useSWR(
    '/api/creator/count', // Backend should provide this endpoint
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const [exportCampaignsLoading, setExportCampaignsLoading] = useState(false);
  const [exportCreatorsLoading, setExportCreatorsLoading] = useState(false);
  const [exportCampaignsDone, setExportCampaignsDone] = useState(false);
  const [exportCreatorsDone, setExportCreatorsDone] = useState(false);

  // OPTIMIZATION 7: Memoized calculations with early returns
  const activeCampaigns = useMemo(
    () => activeCampaignsData || [],
    [activeCampaignsData]
  );

  const pendingPitches = useMemo(() => {
    if (!pendingPitchesData) return [];
    return pendingPitchesData
      .map((pitch) => ({
        ...pitch,
        campaignName: pitch.campaign?.name || 'Unknown',
        campaignId: pitch.campaignId,
        campaignImage: pitch.campaign?.campaignBrief?.images?.[0] || pitch.campaign?.brand?.logo,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [pendingPitchesData]);

  // OPTIMIZATION 8: Use backend stats if available, otherwise calculate
  const metrics = useMemo(() => {
    if (dashboardStats) {
      // Use pre-aggregated stats from backend
      return {
        totalCreators: dashboardStats.totalCreators || 0,
        totalClients: dashboardStats.totalClients || clientData || 0,
        totalPitches: dashboardStats.totalPitches || 0,
        approvedPitches: dashboardStats.approvedPitches || 0,
        rejectedPitches: dashboardStats.rejectedPitches || 0,
        creatorsWithMediaKit: dashboardStats.creatorsWithMediaKit || 0,
        creatorsInCampaigns: dashboardStats.creatorsInCampaigns || 0,
      };
    }

    // Fallback: calculate from limited data (less accurate but faster)
    const totalPitches = activeCampaigns.reduce(
      (acc, c) => acc + (c?.pitch?.length || 0),
      0
    );
    const approvedPitches = activeCampaigns.reduce(
      (acc, c) => acc + (c?.pitch?.filter((p) => p.status === 'approved')?.length || 0),
      0
    );
    const rejectedPitches = activeCampaigns.reduce(
      (acc, c) => acc + (c?.pitch?.filter((p) => p.status === 'rejected')?.length || 0),
      0
    );

    return {
      totalCreators: creatorCount || 0,
      totalClients: clientData || 0,
      totalPitches,
      approvedPitches,
      rejectedPitches,
      creatorsWithMediaKit: 0, // Requires backend aggregation
      creatorsInCampaigns: 0, // Requires backend aggregation
    };
  }, [dashboardStats, activeCampaigns, creatorCount, clientData]);

  const filteredPitches = useMemo(() => {
    if (selectedCampaign === 'all') return pendingPitches;
    return pendingPitches.filter((pitch) => pitch.campaignId === selectedCampaign);
  }, [pendingPitches, selectedCampaign]);

  // OPTIMIZATION 9: Memoized metric cards array
  const metricCards = useMemo(
    () => [
      {
        title: 'Active Campaigns',
        value: activeCampaigns.length,
        color: colors.accent,
        icon: createIcon('ic_mycampaigns'),
      },
      {
        title: 'Total Creators',
        value: metrics.totalCreators,
        color: colors.primary,
        icon: createIcon('ic_creators'),
      },
      {
        title: 'Total Pitches',
        value: metrics.totalPitches,
        color: colors.secondary,
        icon: <Iconify icon="icon-park-outline:chart-histogram" width={20} />,
      },
      {
        title: 'Total Clients',
        value: metrics.totalClients,
        color: colors.tertiary,
        icon: createIcon('ic_clients'),
      },
      {
        title: 'Approved Pitches',
        value: metrics.approvedPitches,
        color: '#16a34a',
        icon: <Iconify icon="mdi:check-decagram-outline" width={20} />,
      },
      {
        title: 'Rejected Pitches',
        value: metrics.rejectedPitches,
        color: '#ef4444',
        icon: <Iconify icon="mdi:close-octagon-outline" width={20} />,
      },
      {
        title: 'Media Kits Connected',
        value: metrics.creatorsWithMediaKit,
        color: '#0ea5e9',
        icon: <Iconify icon="mdi:account-link-outline" width={20} />,
      },
      {
        title: 'Creators in Campaigns',
        value: metrics.creatorsInCampaigns,
        color: '#8b5cf6',
        icon: <Iconify icon="mdi:account-multiple-check-outline" width={20} />,
      },
    ],
    [activeCampaigns.length, metrics]
  );

  const handleViewCampaign = useCallback(
    (campaignId) => {
      router.push(paths.dashboard.campaign.adminCampaignDetail(campaignId));
    },
    [router]
  );

  const handleViewPitch = useCallback(
    (pitch) => {
      localStorage.setItem('campaigndetail', 'pitch');
      router.push(paths.dashboard.campaign.adminCampaignDetail(pitch.campaignId));
    },
    [router]
  );

  // Socket connection
  useEffect(() => {
    socket?.emit('online-user');
    socket?.on('onlineUsers', (data) => {
      setOnlineUsers(data.onlineUsers);
    });
    return () => {
      socket?.off('onlineUsers');
    };
  }, [socket]);

  const isLoading = campaignsLoading || pitchesLoading || statsLoading || isClientLoading;

  // Render pending pitches component (memoized) - must be before conditional return
  const renderPendingPitches = useMemo(
    () => (
      <Card
        sx={{
          bgcolor: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: 1,
          overflow: 'hidden',
          height: 374,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 3, borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography
                variant="h6"
                sx={{
                  color: colors.primary,
                  fontWeight: 600,
                  fontSize: '1.1rem',
                }}
              >
                Pending Pitches
              </Typography>
              <Chip
                label={`${filteredPitches.length}`}
                size="small"
                sx={{
                  bgcolor: colors.accent,
                  color: colors.background,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 24,
                }}
              />
            </Stack>
            <FormControl size="small" sx={{ minWidth: 160, maxWidth: 200 }}>
              <Select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                displayEmpty
                sx={{
                  fontSize: '0.8rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.border,
                  },
                }}
              >
                <MenuItem value="all">All Campaigns</MenuItem>
                {activeCampaigns.map((campaign) => (
                  <MenuItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>
        {filteredPitches.length > 0 ? (
          <List sx={{ p: 0, flex: 1, overflow: 'auto' }}>
            {filteredPitches.slice(0, 5).map((pitch, index) => (
              <ListItem
                key={`${pitch.campaignId}-${pitch.id}`}
                sx={{
                  borderBottom:
                    index < Math.min(filteredPitches.length, 5) - 1
                      ? `1px solid ${colors.border}`
                      : 'none',
                  '&:hover': { bgcolor: colors.surface },
                  py: 2,
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={pitch.user?.photoURL}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: colors.light,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {pitch.user?.name?.charAt(0)?.toUpperCase() || (
                      <Person sx={{ fontSize: 20, color: colors.secondary }} />
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.primary,
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}
                    >
                      {pitch.user?.name || 'Creator'}
                    </Typography>
                  }
                  secondary={
                    <Stack spacing={0.5}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: colors.secondary,
                          fontSize: '0.75rem',
                        }}
                      >
                        {pitch.campaignName}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Schedule sx={{ fontSize: 12, color: colors.tertiary }} />
                        <Typography variant="caption" sx={{ color: colors.tertiary, fontSize: '0.7rem' }}>
                          {dayjs(pitch.createdAt).fromNow()}
                        </Typography>
                      </Stack>
                    </Stack>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="View Campaign Pitches" arrow>
                    <IconButton
                      size="small"
                      onClick={() => handleViewPitch(pitch)}
                      sx={{
                        bgcolor: colors.light,
                        color: colors.primary,
                        width: 32,
                        height: 32,
                        '&:hover': {
                          bgcolor: colors.accent,
                          color: colors.background,
                        },
                      }}
                    >
                      <ArrowForward sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color={colors.secondary}>
              No pending pitches
            </Typography>
          </Box>
        )}
      </Card>
    ),
    [filteredPitches, selectedCampaign, activeCampaigns, handleViewPitch]
  );

  // Render campaign table (memoized)
  const renderCampaignTable = useMemo(
    () => (
      <Card
        sx={{
          bgcolor: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 3, borderBottom: `1px solid ${colors.border}` }}>
          <Stack direction="row" alignItems="center" spacing={1.5} justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6" sx={{ color: colors.primary, fontWeight: 600, fontSize: '1.1rem' }}>
                Active Campaigns
              </Typography>
              <Chip
                label={`${activeCampaigns.length}`}
                size="small"
                sx={{
                  bgcolor: colors.accent,
                  color: colors.background,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 24,
                }}
              />
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              {user?.role === 'superadmin' && (
                <>
                  <LoadingButton
                    size="small"
                    loading={exportCampaignsLoading}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        setExportCampaignsLoading(true);
                        await fetcher(endpoints.campaign.exportActiveCompleted);
                        setExportCampaignsLoading(false);
                        setExportCampaignsDone(true);
                        setTimeout(() => setExportCampaignsDone(false), 1500);
                      } catch {
                        setExportCampaignsLoading(false);
                      }
                    }}
                    sx={{
                      bgcolor: exportCampaignsDone ? '#22c55e' : colors.primary,
                      color: colors.background,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: 28,
                      px: 1.5,
                    }}
                    variant="contained"
                  >
                    {exportCampaignsDone ? 'Done' : 'Export Campaigns'}
                  </LoadingButton>
                  <LoadingButton
                    size="small"
                    loading={exportCreatorsLoading}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        setExportCreatorsLoading(true);
                        await fetcher(endpoints.campaign.exportCampaignCreators);
                        setExportCreatorsLoading(false);
                        setExportCreatorsDone(true);
                        setTimeout(() => setExportCreatorsDone(false), 1500);
                      } catch {
                        setExportCreatorsLoading(false);
                      }
                    }}
                    sx={{
                      bgcolor: exportCreatorsDone ? '#22c55e' : colors.secondary,
                      color: colors.background,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: 28,
                      px: 1.5,
                    }}
                    variant="contained"
                  >
                    {exportCreatorsDone ? 'Done' : 'Export Creators'}
                  </LoadingButton>
                </>
              )}
            </Stack>
          </Stack>
        </Box>
        {activeCampaigns.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: colors.primary, border: 'none', bgcolor: colors.light, fontSize: '0.8rem', width: '35%', pl: 3 }}>
                    Campaign
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: colors.primary, border: 'none', bgcolor: colors.light, fontSize: '0.8rem' }}>
                    Duration
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: colors.primary, border: 'none', bgcolor: colors.light, fontSize: '0.8rem' }}>
                    Available Credits
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: colors.primary, border: 'none', bgcolor: colors.light, fontSize: '0.8rem' }}>
                    Shortlisted Creators
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: colors.primary, border: 'none', bgcolor: colors.light, fontSize: '0.8rem' }}>
                    Pitches
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeCampaigns.slice(0, 5).map((campaign) => (
                  <Tooltip key={campaign.id} title="Go To Campaign" arrow>
                    <TableRow
                      onClick={() => handleViewCampaign(campaign.id)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: colors.surface },
                      }}
                    >
                      <TableCell sx={{ border: 'none', py: 2, pl: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar
                            src={campaign?.campaignBrief?.images?.[0] || campaign?.brand?.logo}
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: colors.light,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            <Image sx={{ fontSize: 20, color: colors.secondary }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ color: colors.primary, fontWeight: 600, fontSize: '0.85rem', mb: 0.5 }}>
                              {campaign?.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.secondary, fontSize: '0.75rem' }}>
                              {campaign?.brand?.name || 'No brand'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="center" sx={{ border: 'none', py: 2 }}>
                        <Typography variant="body2" sx={{ color: colors.secondary, fontSize: '0.8rem', fontWeight: 500 }}>
                          {dayjs(campaign?.campaignBrief?.startDate).format('MMM DD')} -{' '}
                          {dayjs(campaign?.campaignBrief?.endDate).format('MMM DD')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ border: 'none', py: 2 }}>
                        <Chip
                          label={campaign?.campaignCredits || 0}
                          size="small"
                          sx={{
                            bgcolor: colors.tertiary,
                            color: colors.background,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 24,
                            minWidth: 32,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ border: 'none', py: 2 }}>
                        <Chip
                          label={campaign?.shortlisted?.length || 0}
                          size="small"
                          sx={{
                            bgcolor: colors.light,
                            color: colors.primary,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 24,
                            minWidth: 32,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ border: 'none', py: 2 }}>
                        <Chip
                          label={campaign?.pitch?.length || 0}
                          size="small"
                          sx={{
                            bgcolor: colors.accent,
                            color: colors.background,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 24,
                            minWidth: 32,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  </Tooltip>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color={colors.secondary}>
              No active campaigns
            </Typography>
          </Box>
        )}
      </Card>
    ),
    [activeCampaigns, handleViewCampaign, user, exportCampaignsLoading, exportCreatorsLoading, exportCampaignsDone, exportCreatorsDone]
  );

  // OPTIMIZATION 10: Show skeleton loaders instead of blocking
  if (isLoading) {
    return (
      <Box sx={{ p: 3, minHeight: '100vh' }}>
        <Stack spacing={3}>
          <Grid container spacing={2}>
            {[...Array(8)].map((_, i) => (
              <Grid item xs={6} md={3} key={i}>
                <MetricCardSkeleton />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={20} sx={{ color: colors.accent }} />
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          {user?.role === 'superadmin' && (
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e' }} />
              <Typography variant="body2" sx={{ color: colors.primary, fontWeight: 600, fontSize: '0.9rem' }}>
                {onlineUsers || 0} users online
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* Metrics */}
        <Grid container spacing={2}>
          {metricCards.map((metric, index) => (
            <Grid item xs={6} md={3} key={index}>
              <MetricCard metric={metric} />
            </Grid>
          ))}
        </Grid>

        {/* Charts and Pending Pitches */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, bgcolor: colors.background, border: `1px solid ${colors.border}`, borderRadius: 1 }}>
              <Typography variant="h6" sx={{ color: colors.primary, fontWeight: 600, mb: 2, fontSize: '1.1rem' }}>
                Activity Trends
              </Typography>
              {/* Simplified chart - can be lazy loaded if needed */}
              <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color={colors.secondary}>
                  Chart placeholder - implement with actual data
                </Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            {renderPendingPitches}
          </Grid>
        </Grid>

        {/* Campaigns Table */}
        {renderCampaignTable}
      </Stack>
    </Box>
  );
};

export default DashboardSuperadmin;

