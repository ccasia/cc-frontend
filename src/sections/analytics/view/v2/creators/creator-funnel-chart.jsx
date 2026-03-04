import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { Box, Stack, Typography } from '@mui/material';

import ChartCard from '../components/chart-card';
import { MOCK_CREATOR_FUNNEL } from '../mock-data';

const BLUE_GRADIENT = ['#0A1A66', '#0F2599', '#1340FF', '#4D73FF', '#809FFF', '#B3C5FF'];

export default function CreatorFunnelChart() {
  const maxCount = MOCK_CREATOR_FUNNEL[0].count;

  return (
    <ChartCard title="Creator Lifecycle Funnel" icon={FilterAltIcon} subtitle="Conversion from registration through retention">
      <Stack spacing={1.5} sx={{ py: 1 }}>
        {MOCK_CREATOR_FUNNEL.map((item, index) => {
          const widthPct = (item.count / maxCount) * 100;
          const conversionRate =
            index > 0
              ? ((item.count / MOCK_CREATOR_FUNNEL[index - 1].count) * 100).toFixed(1)
              : null;

          return (
            <Stack key={item.stage} direction="row" alignItems="center" spacing={2}>
              <Typography
                variant="body2"
                sx={{
                  width: 100,
                  flexShrink: 0,
                  fontWeight: 600,
                  color: '#333',
                  fontSize: 13,
                  textAlign: 'right',
                }}
              >
                {item.stage}
              </Typography>

              <Box sx={{ flex: 1, position: 'relative' }}>
                <Box
                  sx={{
                    width: `${widthPct}%`,
                    height: 32,
                    borderRadius: 0.75,
                    bgcolor: BLUE_GRADIENT[index],
                    transition: 'width 0.5s ease',
                    minWidth: 40,
                  }}
                />
              </Box>

              <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ minWidth: 120, flexShrink: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#333', fontSize: 14 }}>
                  {item.count.toLocaleString()}
                </Typography>
                {conversionRate && (
                  <Typography variant="caption" sx={{ color: '#919EAB', fontWeight: 500 }}>
                    ({conversionRate}%)
                  </Typography>
                )}
              </Stack>
            </Stack>
          );
        })}
      </Stack>
    </ChartCard>
  );
}
