import { memo } from 'react';

import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { Avatar, Box, Skeleton, Stack, Typography } from '@mui/material';

import useGetTopShortlistedCreators from 'src/hooks/use-get-top-shortlisted-creators';

import ChartCard from '../components/chart-card';
import { useDateFilter } from '../date-filter-context';
import { UI_COLORS, CHART_COLORS } from '../chart-config';

const APPROVED_COLOR = CHART_COLORS.success;
const REJECTED_COLOR = CHART_COLORS.error;

const SCROLL_SX = {
  '&::-webkit-scrollbar': { width: '3px' },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': { background: 'transparent', borderRadius: '1.5px' },
  '&:hover::-webkit-scrollbar-thumb': { background: '#D0D5DA' },
  scrollbarWidth: 'thin',
  scrollbarColor: 'transparent transparent',
  '&:hover': { scrollbarColor: '#D0D5DA transparent' },
};

function TopShortlistedCreatorsChart() {
  const { startDate, endDate } = useDateFilter();
  const { creators, isLoading } = useGetTopShortlistedCreators({ startDate, endDate });

  const renderContent = () => {
    const fullWidthSx = { mx: -1, mb: -1, mt: -0.5, flex: 1, display: 'flex', flexDirection: 'column' };

    if (isLoading) {
      return (
        <Box sx={fullWidthSx}>
          <Stack
            direction="row"
            alignItems="center"
            sx={{
              px: 2.5,
              py: 1,
              borderTop: '1px solid #E8ECEE',
              borderBottom: '1px solid #E8ECEE',
              bgcolor: '#F9FAFB',
            }}
          >
            <Skeleton variant="text" width="100%" height={18} />
          </Stack>
          <Box sx={{ px: 2.5, pt: 0.5 }}>
            {[...Array(5)].map((_, i) => (
              <Stack key={i} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
                <Skeleton variant="text" width={20} height={18} />
                <Skeleton variant="circular" width={32} height={32} sx={{ flexShrink: 0 }} />
                <Skeleton variant="text" height={18} sx={{ flex: 1 }} />
                <Skeleton variant="text" width={80} height={18} />
              </Stack>
            ))}
          </Box>
        </Box>
      );
    }

    if (creators.length === 0) {
      return (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 6, flex: 1 }}>
          <Typography variant="body2" sx={{ color: UI_COLORS.textMuted }}>
            No shortlisted creators found
          </Typography>
        </Stack>
      );
    }

    return (
      <Box sx={fullWidthSx}>
        {/* Table header */}
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            px: 2.5,
            py: 1,
            borderTop: '1px solid #E8ECEE',
            borderBottom: '1px solid #E8ECEE',
            bgcolor: '#F9FAFB',
          }}
        >
          <Typography sx={{ width: 28, flexShrink: 0, fontSize: 12, fontWeight: 600, color: UI_COLORS.textMuted }}>
            #
          </Typography>
          <Typography sx={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: UI_COLORS.textMuted, pl: 0.5 }}>
            Creator
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
            <Typography sx={{ width: 44, fontSize: 12, fontWeight: 600, color: UI_COLORS.textMuted, textAlign: 'right' }}>
              Total
            </Typography>
            <Typography sx={{ width: 60, fontSize: 12, fontWeight: 600, color: APPROVED_COLOR, textAlign: 'right' }}>
              Approved
            </Typography>
            <Typography sx={{ width: 60, fontSize: 12, fontWeight: 600, color: REJECTED_COLOR, textAlign: 'right' }}>
              Rejected
            </Typography>
          </Stack>
        </Stack>

        {/* Table rows */}
        <Box sx={{ flex: 1, overflow: 'auto', ...SCROLL_SX }}>
          <Stack spacing={0} sx={{ py: 0.5 }}>
            {creators.map((creator, index) => (
              <Stack
                key={creator.userId}
                direction="row"
                alignItems="center"
                sx={{
                  py: 1.25,
                  px: 2.5,
                  transition: 'background-color 0.15s',
                  '&:hover': { bgcolor: UI_COLORS.backgroundHover },
                  borderBottom: index < creators.length - 1 ? '1px solid #F0F2F4' : 'none',
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
                  }}
                >
                  {index + 1}
                </Typography>

                {/* Avatar + Name */}
                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
                  <Avatar
                    src={creator.avatar}
                    alt={creator.name}
                    sx={{ width: 32, height: 32, flexShrink: 0 }}
                  />
                  <Typography
                    title={creator.name}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      fontWeight: 500,
                      fontSize: 13,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {creator.name || 'Unknown'}
                  </Typography>
                </Stack>

                {/* Total / Approved / Rejected counts */}
                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                  <Typography
                    sx={{
                      width: 44,
                      fontWeight: 700,
                      fontSize: 13,
                      color: UI_COLORS.text,
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {creator.count}
                  </Typography>
                  <Typography
                    sx={{
                      width: 60,
                      fontWeight: 700,
                      fontSize: 13,
                      color: APPROVED_COLOR,
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {creator.approved}
                  </Typography>
                  <Typography
                    sx={{
                      width: 60,
                      fontWeight: 700,
                      fontSize: 13,
                      color: REJECTED_COLOR,
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {creator.rejected}
                  </Typography>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
    );
  };

  return (
    <ChartCard
      title="Top Shortlisted Creators"
      icon={PersonAddAlt1Icon}
      subtitle="Top 10 creators most frequently shortlisted by CS admins"
    >
      {renderContent()}
    </ChartCard>
  );
}

export default memo(TopShortlistedCreatorsChart);
