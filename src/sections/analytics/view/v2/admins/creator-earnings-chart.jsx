import { useMemo, useState } from 'react';

import PaidIcon from '@mui/icons-material/Paid';
import { Box, Stack, Avatar, Tooltip, Skeleton, Typography } from '@mui/material';

import useGetCreatorEarnings from 'src/hooks/use-get-creator-earnings';

import ChartCard from '../components/chart-card';
import { useDateFilter } from '../date-filter-context';
import { UI_COLORS, CHART_COLORS } from '../chart-config';
import CreatorEarningsDrawer from './creator-earnings-drawer';

export default function CreatorEarningsChart() {
  const [selectedCreator, setSelectedCreator] = useState(null);
  const { startDate, endDate } = useDateFilter();

  const { creators, isLoading } = useGetCreatorEarnings({ startDate, endDate });

  const sorted = useMemo(
    () => [...creators].sort((a, b) => b.totalEarnings - a.totalEarnings),
    [creators]
  );

  const maxEarnings = sorted[0]?.totalEarnings || 1;

  return (
    <ChartCard title="Top Creator Earnings" icon={PaidIcon} subtitle="Total earnings per creator across all campaigns (top 10)">
      {isLoading ? (
        <Stack spacing={1} sx={{ px: 3, pb: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={36} />
          ))}
        </Stack>
      ) : sorted.length === 0 ? (
        <Box sx={{ px: 3, pb: 3, pt: 1 }}>
          <Typography variant="body2" sx={{ color: UI_COLORS.textMuted }}>
            No paid invoices found for this period.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={0} sx={{ px: 2, pb: 1 }}>
          {sorted.map((creator, index) => (
            <Stack
              key={creator.userId}
              direction="row"
              alignItems="center"
              spacing={1.5}
              onClick={() => setSelectedCreator(creator)}
              sx={{
                py: 1,
                px: 1,
                borderRadius: 1,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                '&:hover': { bgcolor: UI_COLORS.backgroundHover },
              }}
            >
              {/* Rank */}
              <Typography
                sx={{
                  width: 28,
                  flexShrink: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: UI_COLORS.textMuted,
                  textAlign: 'right',
                }}
              >
                #{index + 1}
              </Typography>

              {/* Avatar */}
              <Avatar
                src={creator.photoUrl}
                alt={creator.name}
                sx={{ width: 32, height: 32, flexShrink: 0 }}
              />

              {/* Name */}
              <Typography
                sx={{
                  width: 120,
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 500,
                  color: UI_COLORS.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {creator.name}
              </Typography>

              {/* Single-color Bar */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Tooltip
                  title={`RM ${creator.totalEarnings.toLocaleString()}`}
                  arrow
                  placement="top"
                  slotProps={{
                    tooltip: {
                      sx: {
                        bgcolor: '#1C252E',
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 1,
                        fontSize: 12,
                        fontWeight: 600,
                      },
                    },
                    arrow: { sx: { color: '#1C252E' } },
                  }}
                >
                  <Box
                    sx={{
                      height: 20,
                      width: `${(creator.totalEarnings / maxEarnings) * 100}%`,
                      minWidth: 4,
                      borderRadius: 0.75,
                      bgcolor: CHART_COLORS.primary,
                      transition: 'width 0.3s ease, opacity 0.15s',
                      '&:hover': { opacity: 0.85 },
                    }}
                  />
                </Tooltip>
              </Box>

              {/* Total Earnings */}
              <Typography
                sx={{
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: UI_COLORS.text,
                  minWidth: 72,
                  textAlign: 'right',
                }}
              >
                RM {creator.totalEarnings.toLocaleString()}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}

      <CreatorEarningsDrawer
        selectedCreator={selectedCreator}
        creators={sorted}
        onClose={() => setSelectedCreator(null)}
        onNavigate={setSelectedCreator}
      />
    </ChartCard>
  );
}
