import { memo, useMemo, useState } from 'react';

import PaidIcon from '@mui/icons-material/Paid';
import { Box, Stack, Avatar, Skeleton, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import useGetCreatorEarnings from 'src/hooks/use-get-creator-earnings';

import ChartCard from '../components/chart-card';
import { useDateFilter } from '../date-filter-context';
import { UI_COLORS } from '../chart-config';
import CreatorEarningsDrawer from './creator-earnings-drawer';

function CreatorEarningsChart() {
  const [selectedCreator, setSelectedCreator] = useState(null);
  const { startDate, endDate, creditTiers } = useDateFilter();

  const hookOptions = useMemo(() => {
    const opts = {};
    if (startDate && endDate) { opts.startDate = startDate; opts.endDate = endDate; }
    if (creditTiers.length > 0) opts.creditTiers = creditTiers;
    return opts;
  }, [startDate, endDate, creditTiers]);

  const { creators, isLoading } = useGetCreatorEarnings(hookOptions);

  const sorted = useMemo(
    () => [...creators].sort((a, b) => b.totalEarnings - a.totalEarnings),
    [creators]
  );

  const SCROLL_SX = {
    '&::-webkit-scrollbar': { width: '3px' },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
    '&::-webkit-scrollbar-thumb': { background: 'transparent', borderRadius: '1.5px' },
    '&:hover::-webkit-scrollbar-thumb': { background: '#D0D5DA' },
    scrollbarWidth: 'thin',
    scrollbarColor: 'transparent transparent',
    '&:hover': { scrollbarColor: '#D0D5DA transparent' },
  };

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

    if (sorted.length === 0) {
      return (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 6, flex: 1 }}>
          <Typography variant="body2" sx={{ color: UI_COLORS.textMuted }}>
            No paid invoices found for this period.
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
          <Typography sx={{ width: 100, flexShrink: 0, fontSize: 12, fontWeight: 600, color: UI_COLORS.textMuted, textAlign: 'right' }}>
            Earnings (RM)
          </Typography>
        </Stack>

        {/* Table rows */}
        <Box sx={{ flex: 1, overflow: 'auto', ...SCROLL_SX }}>
          <Stack spacing={0} sx={{ py: 0.5 }}>
            {sorted.map((creator, index) => (
              <Stack
                key={creator.userId}
                direction="row"
                alignItems="center"
                onClick={() => setSelectedCreator(creator)}
                sx={{
                  py: 1.25,
                  px: 2.5,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                  borderBottom: index < sorted.length - 1 ? '1px solid #F0F2F4' : 'none',
                  '&:hover': {
                    bgcolor: UI_COLORS.backgroundHover,
                    '& .earnings-amount': { transform: 'translateY(-100%)', opacity: 0 },
                    '& .earnings-view': { transform: 'translateY(0)', opacity: 1 },
                  },
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
                    src={creator.photoUrl}
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
                    {creator.name}
                  </Typography>
                </Stack>

                {/* Earnings — animates to "View Details" on row hover */}
                <Box
                  sx={{
                    flexShrink: 0,
                    position: 'relative',
                    height: 20,
                    overflow: 'hidden',
                    textAlign: 'right',
                    minWidth: 100,
                  }}
                >
                  <Typography
                    className="earnings-amount"
                    sx={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: UI_COLORS.text,
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                      lineHeight: '20px',
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    RM {creator.totalEarnings.toLocaleString()}
                  </Typography>
                  <Stack
                    className="earnings-view"
                    direction="row"
                    alignItems="center"
                    justifyContent="flex-end"
                    spacing={0.5}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 20,
                      transform: 'translateY(100%)',
                      opacity: 0,
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <Iconify
                      icon="solar:eye-bold"
                      width={14}
                      sx={{ color: '#637381', flexShrink: 0 }}
                    />
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: '#637381',
                        whiteSpace: 'nowrap',
                        lineHeight: '20px',
                      }}
                    >
                      View Details
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
    );
  };

  return (
    <ChartCard
      title="Top Creator Earnings"
      icon={PaidIcon}
      subtitle="Total earnings per creator across all campaigns (top 10)"
      headerRight={
        !isLoading && sorted.length > 0 ? (
          <Typography variant="caption" sx={{ color: UI_COLORS.textMuted, fontWeight: 500 }}>
            {sorted.length} creator{sorted.length !== 1 ? 's' : ''}
          </Typography>
        ) : null
      }
    >
      {renderContent()}

      <CreatorEarningsDrawer
        selectedCreator={selectedCreator}
        creators={sorted}
        onClose={() => setSelectedCreator(null)}
        onNavigate={setSelectedCreator}
      />
    </ChartCard>
  );
}

export default memo(CreatorEarningsChart);
