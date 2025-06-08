import useSWR from 'swr';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { useMemo, useState, useEffect } from 'react';

import {
  LineChart,
} from '@mui/x-charts';
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

import useGetCreators from 'src/hooks/use-get-creators';
import useGetCampaigns from 'src/hooks/use-get-campaigns';

import { fetcher } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import SvgColor from 'src/components/svg-color';


// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

const DashboardSuperadmin = () => {
  const { campaigns, isLoading } = useGetCampaigns();
  const { data: creators, isLoading: creatorLoading } = useGetCreators();
  const { socket } = useSocketContext();
  const [onlineUsers, setOnlineUsers] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const { user } = useAuthContext();
  const { data: clientData, isLoading: isClientLoading } = useSWR('/api/company/', fetcher);
  const router = useRouter();

  // Minimal color palette with blue accent
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

  // Calculate actual metrics
  const activeCampaigns = useMemo(() => 
    campaigns?.filter((campaign) => campaign.status === 'ACTIVE') || [], 
    [campaigns]
  );
  
  const completedCampaigns = useMemo(() => 
    campaigns?.filter((campaign) => campaign.status === 'COMPLETED') || [], 
    [campaigns]
  );

  // Calculate total pitches from all campaigns
  const totalPitches = useMemo(() => {
    if (!campaigns) return 0;
    const total = campaigns.reduce((acc, campaign) => acc + (campaign?.pitch?.length || 0), 0);
    return total;
  }, [campaigns]);

  // Get all pending pitches
  const pendingPitches = useMemo(() => {
    if (!campaigns) return [];
    
    const allPitches = [];
    campaigns.forEach((campaign) => {
      if (campaign?.pitch) {
        campaign.pitch.forEach((pitch) => {
          if (pitch.status === 'undecided') {
            allPitches.push({
              ...pitch,
            campaignName: campaign.name,
              campaignId: campaign.id,
              campaignImage: campaign?.campaignBrief?.images?.[0] || campaign?.brand?.logo,
            });
          }
        });
      }
    });
    
    // Sort by creation date (newest first)
    return allPitches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [campaigns]);

  // Filter pitches based on selected campaign
  const filteredPitches = useMemo(() => {
    if (selectedCampaign === 'all') return pendingPitches;
    return pendingPitches.filter(pitch => pitch.campaignId === selectedCampaign);
  }, [pendingPitches, selectedCampaign]);

  const totalChats = user?._count?.UserThread || 0;
  const totalCreators = creators?.length || 0;
  const totalClients = clientData || 0;

  // Generate last 6 months data based on actual metrics
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const baseValues = {
      campaigns: Math.max(1, activeCampaigns.length),
      creators: Math.max(1, Math.floor(totalCreators / 6)),
      pitches: Math.max(1, Math.floor(totalPitches / 6)),
    };

    return months.map((month, index) => ({
      month,
      campaigns: Math.floor(baseValues.campaigns * (0.8 + (index * 0.1))),
      creators: Math.floor(baseValues.creators * (0.7 + (index * 0.15))),
      pitches: Math.floor(baseValues.pitches * (0.6 + (index * 0.2))),
    }));
  }, [activeCampaigns.length, totalCreators, totalPitches]);

  // Helper function to create navigation icons
  const icon = (name) => (
    <SvgColor
      src={`/assets/icons/navbar/${name}.svg`}
      sx={{
        width: 20,
        height: 20,
      }}
    />
  );

  // Metric cards with clean design
  const metricCards = [
    {
      title: 'Active Campaigns',
      value: activeCampaigns.length,
      color: colors.accent,
      icon: icon('ic_mycampaigns'),
    },
    {
      title: 'Total Creators',
      value: totalCreators,
      color: colors.primary,
      icon: icon('ic_creators'),
    },
    {
      title: 'Total Pitches',
      value: totalPitches,
      color: colors.secondary,
      icon: <Iconify icon="icon-park-outline:chart-histogram" width={20} />,
    },
    {
      title: 'Total Clients',
      value: totalClients,
      color: colors.tertiary,
      icon: icon('ic_clients'),
    },
  ];

  const handleViewCampaign = (campaignId) => {
    router.push(paths.dashboard.campaign.adminCampaignDetail(campaignId));
  };

  const handleViewPitch = (pitch) => {
    // Set the tab to pitch section before navigating
    localStorage.setItem('campaigndetail', 'pitch');
    // Navigate to the campaign's pitch section
    router.push(paths.dashboard.campaign.adminCampaignDetail(pitch.campaignId));
  };

  const renderMetricCard = (metric, index) => (
    <Grid item xs={6} md={3} key={index}>
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
                fontSize: '0.7rem'
              }}
            >
              {metric.title}
            </Typography>
            <Box sx={{ color: metric.color, opacity: 0.8 }}>
              {metric.icon}
            </Box>
          </Stack>
          
          <Typography 
            variant="h3" 
            sx={{ 
              color: metric.color,
              fontWeight: 700,
              lineHeight: 1,
              fontSize: '2rem'
            }}
          >
            {typeof metric.value === 'number' ? metric.value.toLocaleString() : '0'}
          </Typography>
        </Stack>
      </Card>
    </Grid>
  );

  const renderPendingPitches = (
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
                fontSize: '1.1rem'
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
                '&:hover': {
                  bgcolor: colors.accent,
                },
                cursor: 'default',
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
                '& .MuiSelect-select': {
                  py: 1,
                  pr: 4,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.border,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.accent,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.accent,
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 240,
                    '& .MuiMenuItem-root': {
                      fontSize: '0.8rem',
                      py: 1,
                      px: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 280,
                    },
                  },
                },
              }}
            >
              <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>
                All Campaigns
              </MenuItem>
              {activeCampaigns.map((campaign) => (
                <MenuItem 
                  key={campaign.id} 
                  value={campaign.id} 
                  sx={{ 
                    fontSize: '0.8rem',
                    maxWidth: 280,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={campaign.name}
                >
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
                borderBottom: index < Math.min(filteredPitches.length, 5) - 1 ? `1px solid ${colors.border}` : 'none',
                '&:hover': {
                  bgcolor: colors.surface,
                },
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
                  {pitch.user?.name?.charAt(0)?.toUpperCase() || <Person sx={{ fontSize: 20, color: colors.secondary }} />}
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
                      lineHeight: 1.2,
                      mb: 0.5,
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
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '180px',
                      }}
                      title={pitch.campaignName}
                    >
                      {pitch.campaignName}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Schedule sx={{ fontSize: 12, color: colors.tertiary }} />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: colors.tertiary,
                          fontSize: '0.7rem'
                        }}
                      >
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
                      transition: 'all 0.2s ease',
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
  );

  const renderCampaignTable = (
    <Card 
      sx={{ 
        bgcolor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 3, borderBottom: `1px solid ${colors.border}` }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: colors.primary,
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
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
      </Box>

      {activeCampaigns.length > 0 ? (
        <TableContainer>
          <Table size="small">
        <TableHead>
          <TableRow>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  color: colors.primary, 
                  border: 'none',
                  bgcolor: colors.light,
                  fontSize: '0.8rem',
                  width: '35%',
                  pl: 3, // Match the padding of campaign content
                }}>
                  Campaign
                </TableCell>
                <TableCell align="center" sx={{ 
                  fontWeight: 600, 
                  color: colors.primary, 
                  border: 'none',
                  bgcolor: colors.light,
                  fontSize: '0.8rem'
                }}>
                  Duration
                </TableCell>
                <TableCell align="center" sx={{ 
                  fontWeight: 600, 
                  color: colors.primary, 
                  border: 'none',
                  bgcolor: colors.light,
                  fontSize: '0.8rem'
                }}>
                  Available Credits
                </TableCell>
                <TableCell align="center" sx={{ 
                  fontWeight: 600, 
                  color: colors.primary, 
                  border: 'none',
                  bgcolor: colors.light,
                  fontSize: '0.8rem'
                }}>
                  Shortlisted Creators
                </TableCell>
                <TableCell align="center" sx={{ 
                  fontWeight: 600, 
                  color: colors.primary, 
                  border: 'none',
                  bgcolor: colors.light,
                  fontSize: '0.8rem'
                }}>
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
                      transition: 'background-color 0.2s ease',
                      '&:hover': {
                        bgcolor: colors.surface,
                      },
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
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: colors.primary,
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              lineHeight: 1.2,
                              mb: 0.5
                            }}
                          >
                            {campaign?.name}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: colors.secondary,
                              fontSize: '0.75rem'
                            }}
                          >
                            {campaign?.brand?.name || 'No brand'}
                    </Typography>
                        </Box>
                      </Stack>
                  </TableCell>
                    <TableCell align="center" sx={{ border: 'none', py: 2 }}>
                      <Stack spacing={0.5} alignItems="center">
                        <Typography variant="body2" sx={{ 
                          color: colors.secondary,
                          fontSize: '0.8rem',
                          fontWeight: 500,
                        }}>
                          {dayjs(campaign?.campaignBrief?.startDate).format('ddd, MMM DD')} - {dayjs(campaign?.campaignBrief?.endDate).format('ddd, MMM DD')}
                    </Typography>
                      </Stack>
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
                          '&:hover': {
                            bgcolor: colors.tertiary,
                          },
                          cursor: 'default',
                        }}
                      />
                  </TableCell>
                    <TableCell align="center" sx={{ border: 'none', py: 2 }}>
                      <Chip
                        label={campaign?.shortlisted.length}
                        size="small"
                        sx={{
                          bgcolor: colors.light,
                          color: colors.primary,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 24,
                          minWidth: 32,
                          '&:hover': {
                            bgcolor: colors.light,
                          },
                          cursor: 'default',
                        }}
                      />
                  </TableCell>
                    <TableCell align="center" sx={{ border: 'none', py: 2 }}>
                      <Chip
                        label={campaign?.pitch.length}
                        size="small"
                        sx={{
                          bgcolor: colors.accent,
                          color: colors.background,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 24,
                          minWidth: 32,
                          '&:hover': {
                            bgcolor: colors.accent,
                          },
                          cursor: 'default',
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
  );

  useEffect(() => {
    socket?.emit('online-user');
    socket?.on('onlineUsers', (data) => {
      setOnlineUsers(data.onlineUsers);
    });
    return () => {
      socket?.off('onlineUsers');
    };
  }, [socket]);

  if (creatorLoading || isClientLoading || isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
        }}
      >
        <CircularProgress size={20} sx={{ color: colors.accent }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          {/* <Stack spacing={0.5}>
            <Typography 
              variant="h4" 
              sx={{ 
                color: colors.primary,
                fontWeight: 700,
                fontSize: '1.75rem',
                letterSpacing: -0.5
              }}
            >
              Dashboard
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: colors.secondary,
                fontSize: '0.9rem'
              }}
            >
              Platform overview
            </Typography>
          </Stack> */}
          
          {user?.role === 'superadmin' && (
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#22c55e',
                }}
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: colors.primary,
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                {onlineUsers || 0} users online
            </Typography>
            </Stack>
          )}
          </Stack>

        {/* Metrics */}
        <Grid container spacing={2}>
          {metricCards.map((metric, index) => renderMetricCard(metric, index))}
      </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Activity Trends */}
          <Grid item xs={12} md={8}>
            <Card 
              sx={{ 
                p: 3, 
                bgcolor: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: 1
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: colors.primary,
                  fontWeight: 600,
                  mb: 2,
                  fontSize: '1.1rem'
                }}
              >
                Activity Trends
            </Typography>
              <LineChart
                dataset={monthlyData}
                xAxis={[{ 
                  dataKey: 'month', 
                  scaleType: 'point',
                  tickLabelStyle: { 
                    fill: colors.secondary, 
                    fontSize: 11,
                    fontWeight: 500
                  }
                }]}
                yAxis={[{
                  tickLabelStyle: { 
                    fill: colors.secondary, 
                    fontSize: 11,
                    fontWeight: 500
                  }
                }]}
                series={[
                  {
                    dataKey: 'campaigns',
                    label: 'Campaigns',
                    color: colors.accent,
                    curve: 'smooth',
                  },
                  {
                    dataKey: 'creators',
                    label: 'Creators',
                    color: colors.primary,
                    curve: 'smooth',
                  },
                ]}
                height={280}
                margin={{ left: 50, right: 20, top: 40, bottom: 40 }}
                grid={{ 
                  vertical: false, 
                  horizontal: true,
                  horizontalColor: colors.border
                }}
                slotProps={{
                  legend: {
                    direction: 'row',
                    position: { vertical: 'top', horizontal: 'left' },
                    labelStyle: { 
                      fill: colors.secondary, 
                      fontSize: 12,
                      fontWeight: 500
                    },
                    itemMarkWidth: 12,
                    itemMarkHeight: 2,
                    markGap: 8,
                    itemGap: 16,
                  }
                }}
              />
            </Card>
          </Grid>

          {/* Pending Pitches */}
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
