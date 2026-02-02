import PropTypes from 'prop-types';
import Chart from 'react-apexcharts';

import { useTheme } from '@mui/material/styles';
import { Box, Card, Stack, Divider, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

export default function LogisticsAnalytics({ logistics = [], isReservation }) {
  const theme = useTheme();

  const stats = logistics.reduce(
    (acc, item) => {
      const status = item.status || 'PENDING_ASSIGNEMNT';

      switch (status) {
        case 'PENDING_ASSIGNMENT':
          acc.unassigned += 1;
          break;
        case 'NOT_STARTED':
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
          acc.unassigned += 1;
      }
      return acc;
    },
    { unassigned: 0, yetToShip: 0, shipped: 0, delivered: 0, failed: 0 }
  );

  const total = logistics.length;
  const percentCompleted = total === 0 ? 0 : Math.round((stats.delivered / total) * 100);

  let series = [];
  let labels = [];
  let chartColors = [];

  if (isReservation) {
    series = [stats.unassigned, stats.yetToShip, stats.delivered, stats.failed];
    labels = ['Unconfirmed', 'Scheduled', 'Completed', 'Issue'];

    chartColors = [
      '#B0B0B0', // Unconfirmed (Grey)
      '#1340FF', // Scheduled (Blue)
      '#1ABF66', // Completed (Green)
      '#FF3500', // Issue (Red)
    ];
  } else {
    series = [stats.unassigned, stats.yetToShip, stats.shipped, stats.delivered, stats.failed];
    labels = ['Unassigned', 'Yet To Ship', 'Shipped Out', 'Delivered', 'Failed'];

    chartColors = [
      '#B0B0B0', // Unassigned (Grey)
      '#FF9A02', // Yet To Ship (Orange)
      '#8A5AFE', // Shipped Out (Purple)
      '#1ABF66', // Delivered (Green)
      '#FF3500', // Failed (Red)
    ];
  }

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
    labels,
    dataLabels: { enabled: false },
  };

  const renderListRow = (count, label, color, bgColor) => (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
      <Typography variant="subtitle1" sx={{ minWidth: 24, textAlign: 'left' }}>
        {count}
      </Typography>
      <Box
        sx={{
          px: 0.5,
          py: 0.25,
          borderRadius: '4px',
          backgroundColor: bgColor,
          border: `1px solid ${bgColor}`,
          color,
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
      <Stack alignItems="center" justifyContent="center" sx={{ flexGrow: 1, p: 2, minHeight: 300 }}>
        <Box sx={{ position: 'relative', mb: 2 }}>
          <Chart
            dir="ltr"
            type="donut"
            series={series}
            options={chartOptions}
            width={80}
            height={80}
          />
        </Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#454F5B' }}>
          {percentCompleted}% COMPLETED
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ width: '100%', maxWidth: 200 }}>
            {isReservation ? (
              <>
                {renderListRow(stats.unassigned, labels[0], '#B0B0B0', '#EFEFEF')}
                {renderListRow(stats.yetToShip, labels[1], '#1340FF', '#F0F7FF')}
                {renderListRow(stats.delivered, labels[2], '#1ABF66', '#DCFAE6')}
                {renderListRow(stats.failed, labels[3], '#FF3500', '#FFD0C9')}
              </>
            ) : (
              <>
                {renderListRow(stats.unassigned, labels[0], '#B0B0B0', '#EFEFEF')}
                {renderListRow(stats.yetToShip, labels[1], '#FF9A02', '#FFF7DB')}
                {renderListRow(stats.shipped, labels[2], '#8A5AFE', '#ECE4FF')}
                {renderListRow(stats.delivered, labels[3], '#1ABF66', '#DCFAE6')}
                {renderListRow(stats.failed, labels[4], '#FF3500', '#FFD0C9')}
              </>
            )}
          </Box>
        </Box>
      </Stack>
    </Card>
  );
}

LogisticsAnalytics.propTypes = {
  logistics: PropTypes.array,
  isReservation: PropTypes.bool,
};
