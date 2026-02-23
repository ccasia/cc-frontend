import { useMemo } from 'react';

import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { Avatar, Box, Stack, Typography } from '@mui/material';

import ChartCard from '../components/chart-card';
import { MOCK_TOP_SHORTLISTED_CREATORS } from '../mock-data';
import { UI_COLORS, CHART_COLORS } from '../chart-config';

const APPROVED_COLOR = CHART_COLORS.success;
const REJECTED_COLOR = CHART_COLORS.error;

export default function TopShortlistedCreatorsChart() {
  const totalShortlists = useMemo(
    () => MOCK_TOP_SHORTLISTED_CREATORS.reduce((sum, c) => sum + c.count, 0),
    []
  );

  const maxCount = MOCK_TOP_SHORTLISTED_CREATORS[0]?.count || 1;

  return (
    <ChartCard
      title="Top Shortlisted Creators"
      icon={PersonAddAlt1Icon}
      subtitle="Top 10 creators most frequently shortlisted by CS admins"
      headerRight={
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: UI_COLORS.textSecondary }}>
          {totalShortlists} total
        </Typography>
      }
    >
      <Stack spacing={0} sx={{ px: 2, pb: 1 }}>
        {MOCK_TOP_SHORTLISTED_CREATORS.map((creator, index) => (
          <Stack
            key={creator.name}
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{
              py: 1,
              px: 1,
              borderRadius: 1,
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
              src={creator.avatar}
              alt={creator.name}
              sx={{ width: 32, height: 32, flexShrink: 0 }}
            />

            {/* Creator Name */}
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

            {/* Segmented Bar (Approved + Rejected) */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                sx={{
                  height: 20,
                  width: `${(creator.count / maxCount) * 100}%`,
                  minWidth: 4,
                  borderRadius: 0.75,
                  overflow: 'hidden',
                  transition: 'width 0.3s ease',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    flexBasis: `${(creator.approved / creator.count) * 100}%`,
                    bgcolor: APPROVED_COLOR,
                  }}
                />
                <Box
                  sx={{
                    height: '100%',
                    flexBasis: `${(creator.rejected / creator.count) * 100}%`,
                    bgcolor: REJECTED_COLOR,
                  }}
                />
              </Stack>
            </Box>

            {/* Approved / Rejected counts */}
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flexShrink: 0, minWidth: 72, justifyContent: 'flex-end' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: APPROVED_COLOR }}>
                {creator.approved}
              </Typography>
              <Typography sx={{ fontSize: 11, color: UI_COLORS.textMuted }}>/</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: REJECTED_COLOR }}>
                {creator.rejected}
              </Typography>
            </Stack>
          </Stack>
        ))}
      </Stack>

      {/* Legend */}
      <Stack direction="row" gap={2} sx={{ px: 3, pb: 2, pt: 1 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: APPROVED_COLOR }} />
          <Typography sx={{ fontSize: 11, color: UI_COLORS.textSecondary, fontWeight: 500 }}>Approved</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: REJECTED_COLOR }} />
          <Typography sx={{ fontSize: 11, color: UI_COLORS.textSecondary, fontWeight: 500 }}>Rejected</Typography>
        </Stack>
      </Stack>
    </ChartCard>
  );
}
