import AssignmentIcon from '@mui/icons-material/Assignment';
import { Box, Stack, Skeleton, Typography, LinearProgress, useTheme, useMediaQuery } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';

import useGetRejectionReasons from 'src/hooks/use-get-rejection-reasons';

import ChartCard from '../components/chart-card';
import { useDateFilter } from '../date-filter-context';
import ChartItemTooltip from '../components/chart-item-tooltip';

const DONUT_COLORS = ['#EF4444', '#F59E0B', '#1340FF', '#8E33FF', '#10B981', '#00B8D9', '#919EAB'];

export default function RejectionReasonsChart() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const donutSize = isSmall ? 180 : 220;

  const { startDate, endDate } = useDateFilter();
  const { reasons, isLoading } = useGetRejectionReasons({ startDate, endDate });

  const total = reasons.reduce((sum, d) => sum + d.count, 0);
  const maxCount = Math.max(...reasons.map((d) => d.count), 0);

  const pieData = reasons.map((d, i) => ({
    id: i,
    value: d.count,
    label: d.reason,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  const renderContent = () => {
    if (isLoading) {
      return (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center" sx={{ py: 1 }}>
          <Skeleton variant="circular" width={donutSize} height={donutSize} sx={{ flexShrink: 0 }} />
          <Stack spacing={1.5} sx={{ flex: 1, width: '100%' }}>
            {[...Array(5)].map((_, i) => (
              <Box key={i}>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="rectangular" height={4} sx={{ borderRadius: 2 }} />
              </Box>
            ))}
          </Stack>
        </Stack>
      );
    }

    if (reasons.length === 0) {
      return (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
          <Typography variant="body2" sx={{ color: '#919EAB' }}>
            No rejection reasons found for the selected period.
          </Typography>
        </Stack>
      );
    }

    return (
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={3}
        alignItems="center"
        sx={{ height: '100%', py: 1 }}
      >
        {/* Left: Donut chart */}
        <Box sx={{ position: 'relative', flexShrink: 0, width: donutSize, height: donutSize }}>
          <PieChart
            series={[{
              data: pieData,
              innerRadius: '55%',
              outerRadius: '90%',
              paddingAngle: 2,
              cornerRadius: 3,
              valueFormatter: (item) => `${item.value} rejections`,
            }]}
            height={donutSize}
            width={donutSize}
            margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
            hideLegend
            slots={{ tooltip: ChartItemTooltip }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <Typography variant="caption" sx={{ color: '#919EAB', fontSize: '0.7rem', lineHeight: 1 }}>
              Total
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.2, color: '#333' }}>
              {total}
            </Typography>
          </Box>
        </Box>

        {/* Right: Legend with progress bars */}
        <Stack spacing={1.5} sx={{ flex: 1, width: { xs: '100%', sm: 'auto' }, px: { xs: 2, sm: 0 }, pr: { sm: 1 } }}>
          {reasons.map((d, i) => {
            const pct = ((d.count / total) * 100).toFixed(1);
            const barColor = DONUT_COLORS[i % DONUT_COLORS.length];

            return (
              <Box key={d.reason}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: barColor,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ color: '#333', fontWeight: 500, fontSize: '0.8rem' }}>
                      {d.reason}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', ml: 1 }}>
                    {d.count}
                    <Typography component="span" sx={{ color: '#919EAB', fontWeight: 500, fontSize: '0.7rem', ml: 0.5 }}>
                      ({pct}%)
                    </Typography>
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={(d.count / maxCount) * 100}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: '#F4F6F8',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 2,
                      bgcolor: barColor,
                    },
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      </Stack>
    );
  };

  return (
    <ChartCard title="Rejection Reasons" icon={AssignmentIcon} subtitle="Breakdown by rejection category">
      {renderContent()}
    </ChartCard>
  );
}
