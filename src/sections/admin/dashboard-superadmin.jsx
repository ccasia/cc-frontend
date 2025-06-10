import dayjs from 'dayjs';
import { useTheme } from '@emotion/react';
import React, { useState, useEffect } from 'react';

import { grey } from '@mui/material/colors';
import {
  Box,
  Grid,
  Card,
  alpha,
  Stack,
  Table,
  Paper,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  Typography,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import useGetCreators from 'src/hooks/use-get-creators';
import useGetCampaigns from 'src/hooks/use-get-campaigns';

import { fetcher } from 'src/utils/axios';
import { fNumber } from 'src/utils/format-number';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Label from 'src/components/label';
import Chart from 'src/components/chart';
import { useSettingsContext } from 'src/components/settings';
import EmptyContent from 'src/components/empty-content/empty-content';

const DashboardSuperadmin = () => {
  const { campaigns, isLoading } = useGetCampaigns();
  const { data: creators, isLoading: creatorLoading } = useGetCreators();
  const { socket } = useSocketContext();
  const [onlineUsers, setOnlineUsers] = useState(null);
  const { user } = useAuthContext();
  const { data: clientData, isLoading: isClientLoading } = useSWR('/api/company/', fetcher);

  const theme = useTheme();
  const setting = useSettingsContext();

  // const loadingDone = !isLoading && !creatorLoading;

  const taskLists =
    !isLoading &&
    campaigns
      ?.filter((campaign) => campaign.status === 'ACTIVE')
      .map((campaign) => {
        const campaignTasks = campaign?.campaignTasks.filter(
          (item) => item.status === 'IN_PROGRESS'
        );
        return (
          campaignTasks.length &&
          campaignTasks.map((task) => ({
            campaignName: campaign.name,
            campaignTask: task.task,
            dueDate: task.dueDate,
            status: task.status,
          }))
        );
      })
      .flat()
      .filter((item) => item !== 0);

  const chartOptions = {
    colors: [theme.palette.primary.light, theme.palette.primary.main].map((colr) => colr[1]),
    fill: {
      type: 'gradient',
      gradient: {
        colorStops: [
          { offset: 0, color: theme.palette.primary.light, opacity: 1 },
          { offset: 100, color: theme.palette.primary.main, opacity: 1 },
        ],
      },
    },
    chart: {
      sparkline: {
        enabled: true,
      },
    },
    xaxis: {
      categories: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
    },
    plotOptions: {
      bar: {
        columnWidth: '68%',
        borderRadius: 2,
      },
    },
    tooltip: {
      theme: setting.themeMode,
      x: { show: true },
      y: {
        formatter: (value) => fNumber(value),
        title: {
          formatter: () => '',
        },
      },
      marker: { show: false },
    },
  };

  const renderCampaignLists = (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="medium">
        <TableHead>
          <TableRow>
            <TableCell align="center">Campaign Name</TableCell>
            <TableCell align="center">Start Date</TableCell>
            <TableCell align="center">End Date</TableCell>
            <TableCell align="center">Total Shortlisted Creator</TableCell>
            <TableCell align="center">Total Pitch</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!isLoading &&
            campaigns
              ?.filter((item) => item.status === 'ACTIVE')
              .map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell align="center">{campaign?.name}</TableCell>
                  <TableCell align="center">
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(campaign?.campaignBrief?.startDate).format('ddd LL')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(campaign?.campaignBrief?.endDate).format('ddd LL')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Label color="success">{campaign?.shortlisted.length}</Label>
                  </TableCell>
                  <TableCell align="center">
                    <Label color="success">{campaign?.pitch.length}</Label>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </TableContainer>
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

  if (creatorLoading || isClientLoading) {
    return (
      <Box
        sx={{
          position: 'relative',
          top: 200,
          textAlign: 'center',
        }}
      >
        <CircularProgress
          thickness={7}
          size={25}
          sx={{
            color: theme.palette.common.black,
            strokeLinecap: 'round',
          }}
        />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {user?.role === 'superadmin' && (
        <Grid item xs={12} justifyItems="end">
          <Label>Online Users: {onlineUsers || 0}</Label>
        </Grid>
      )}
      <Grid item xs={12} md={3}>
        <Box component={Card} p={2} sx={{ boxShadow: `0px 2px 2px 2px ${alpha(grey[400], 0.3)}` }}>
          <Stack gap={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Total Campaign
            </Typography>
            <Stack gap={1} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h2">
                {campaigns?.filter((campaign) => campaign.status === 'ACTIVE')?.length}
              </Typography>
              <Chart
                dir="ltr"
                type="bar"
                series={[{ data: [20, 41, 63, 33, 28, 35, 50, 46, 11, 26, 20, 89] }]}
                options={chartOptions}
                width={60}
                height={36}
              />
            </Stack>
          </Stack>
        </Box>
      </Grid>
      <Grid item xs={12} md={3}>
        <Box
          component={Card}
          p="16px 24px"
          sx={{ boxShadow: `0px 2px 2px 2px ${alpha(grey[400], 0.3)}` }}
        >
          <Stack gap={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Total Chats
            </Typography>
            <Stack gap={1} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h2">
                {/* {campaigns
                
                  ?.filter((campaign) => campaign.status === 'ACTIVE')
                  .reduce((acc, campaign) => acc + campaign.pitch.length, 0)} */}
                {user?._count?.UserThread || 0}
              </Typography>
              <Chart
                dir="ltr"
                type="bar"
                series={[{ data: [20, 41, 63, 33, 28, 35, 50, 46, 11, 26, 20, 89] }]}
                options={chartOptions}
                width={60}
                height={36}
              />
            </Stack>
          </Stack>
        </Box>
      </Grid>
      <Grid item xs={12} md={3}>
        <Box
          component={Card}
          p="16px 24px"
          sx={{ boxShadow: `0px 2px 2px 2px ${alpha(grey[400], 0.3)}` }}
        >
          <Stack gap={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Total Creator
            </Typography>
            <Stack gap={1} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h2">{creators?.length}</Typography>
              <Chart
                dir="ltr"
                type="bar"
                series={[{ data: [20, 41, 63, 33, 28, 35, 50, 46, 11, 26, 20, 89] }]}
                options={chartOptions}
                width={60}
                height={36}
              />
            </Stack>
          </Stack>
        </Box>
      </Grid>
      <Grid item xs={12} md={3}>
        <Box
          component={Card}
          p="16px 24px"
          sx={{ boxShadow: `0px 2px 2px 2px ${alpha(grey[400], 0.3)}` }}
        >
          <Stack gap={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Total Clients
            </Typography>
            <Stack gap={1} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h2">{clientData || 0}</Typography>
              <Chart
                dir="ltr"
                type="bar"
                series={[{ data: [20, 41, 63, 33, 28, 35, 50, 46, 11, 26, 20, 89] }]}
                options={chartOptions}
                width={60}
                height={36}
              />
            </Stack>
          </Stack>
        </Box>
      </Grid>
      <Grid item xs={12} md={12}>
        <Box
          component={Card}
          p="16px 24px"
          sx={{ boxShadow: `0px 5px 10px ${alpha(theme.palette.text.primary, 0.1)}` }}
        >
          <Stack gap={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Active Campaigns
            </Typography>
            {campaigns?.length ? renderCampaignLists : <EmptyContent title="No active campaign" />}
          </Stack>
        </Box>
      </Grid>
    </Grid>
  );
};

export default DashboardSuperadmin;
