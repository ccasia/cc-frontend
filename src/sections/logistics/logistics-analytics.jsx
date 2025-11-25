import PropTypes from 'prop-types';
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';

import { Box, Card, alpha, Stack, Divider, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

export default function LogisticsAnalytics({ logistics = [] }) {
  const theme = useTheme();

  const stats = logistics.reduce(
    (acc, item) => {
      const status = item.status || 'PENDING_ASSIGNEMNT';

      switch (status) {
        case 'PENDING_ASSIGNMENT':
          acc.unassigned += 1;
          break;
        case 'SCHEDULED':
          acc.yetToShip += 1;
          break;
        case 'SHIPPED':
          acc.shipped += 1;
          break;
        case 'DELIVERED':
        case 'RECEIVED':
        case 'COMPLETED':
          acc.delivered += 1;
          break;
        case 'ISSUE_REPORTED':
          acc.failed += 1;
          break;
        default:
          acc.unassigned + 1;
      }
      return acc;
    },
    { unassigned: 0, yetToShip: 0, shipped: 0, delivered: 0, failed: 0 }
  );

  const total = logistics.length;
  const percentCompleted = total === 0 ? 0 : Math.round((stats.delivered / total) * 100);

  const series = [stats.unassigned, stats.yetToShip, stats.shipped, stats.delivered, stats.failed];

  const chartColors = ['#B0B0B0', '#FF9A02', '#8A5AFE', '#1ABF66', '#FF3500'];

  const chartOptions = {
    chart: {
      type: 'donut',
      sparkline: { enabled: true },
    },
    colors: chartColors,
    stroke: {
      colors: [theme.palette.background.paper],
      width: 2,
    },
    legend: { show: false },
    tooltip: {
      enabled: true,
      fillSeriesColor: false,
      y: {
        formatter: (value) => value,
        title: {
          formatter: (seriesName) => `${seriesName}`,
        },
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: false,
          },
        },
      },
    },
    labels: ['Unassigned', 'Yet To Ship', 'Shipped Out', 'Delivered', 'Failed'],
    dataLabels: { enabled: false },
  };

  const renderListRow = (count, label, color, bgColor) => (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
      <Typography variant="subtitle1" sx={{ minWidth: 24, textAlign: 'right' }}>
        {count}
      </Typography>
      <Box
        sx={{
          px: 0.5,
          py: 0.25,
          borderRadius: '4px',
          backgroundColor: bgColor,
          border: `1px solid ${bgColor}`,
          color: color,
          typography: 'caption',
          fontWeight: 600,
          fontSize: '10px',
          textTransform: 'capitalize',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Box>
    </Stack>
  );

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.5 }}>
        <Iconify icon="material-symbols-light:bid-landscape-rounded" sx={{ color: '#1340FF' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          PROGRESS TRACKER
        </Typography>
      </Stack>
      <Divider />
      <Stack alignItems="center" justifyContent="center" sx={{ flexGrow: 1, p: 3, minHeight: 300 }}>
        <Box sx={{ position: 'relative', mb: 3 }}>
          <Chart
            dir="ltr"
            type="donut"
            series={series}
            options={chartOptions}
            width={80}
            height={80}
          />
        </Box>
        <Typography>{percentCompleted}% COMPLETED</Typography>
        <Box>
          {renderListRow(stats.unassigned, 'Uassigned', '#B0B0B0', '#EFEFEF')}
          {renderListRow(stats.yetToShip, 'Yet To Ship', '#FF9A02', '#FFF7DB')}
          {renderListRow(stats.shipped, 'Shipped Out', '#8A5AFE', '#ECE4FF')}
          {renderListRow(stats.delivered, 'Delivered', '#1ABF66', '#DCFAE6')}
          {renderListRow(stats.failed, 'Failed', '#FF3500', '#FFD0C9')}
        </Box>
      </Stack>
    </Card>
  );
}

LogisticsAnalytics.propTypes = {
  logistics: PropTypes.array,
};
