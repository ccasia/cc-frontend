import { useState, useMemo, useCallback } from 'react';

import {
  Box,
  Chip,
  Menu,
  Stack,
  Avatar,
  Button,
  Divider,
  Checkbox,
  MenuItem,
  Skeleton,
  Typography,
  LinearProgress,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import useGetClientRejectionRate from 'src/hooks/use-get-client-rejection-rate';

import ChartCard from '../components/chart-card';
import { CHART_COLORS, UI_COLORS } from '../chart-config';
import { useDateFilter } from '../date-filter-context';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PACKAGE_TYPES = ['Basic', 'Essential', 'Pro', 'Custom'];

const PACKAGE_COLOR_MAP = {
  Basic: CHART_COLORS.primary,
  Essential: CHART_COLORS.secondary,
  Pro: CHART_COLORS.success,
  Custom: CHART_COLORS.warning,
};

const SEVERITY_COLORS = { error: '#EF4444', success: '#10B981', warning: '#F59E0B' };

function getRateColor(rate) {
  if (rate <= 15) return SEVERITY_COLORS.success;
  if (rate <= 25) return SEVERITY_COLORS.warning;
  return SEVERITY_COLORS.error;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RejectionRateCard() {
  const router = useRouter();
  const { startDate, endDate } = useDateFilter();
  const { breakdown, isLoading } = useGetClientRejectionRate({ startDate, endDate });

  const [selectedPackages, setSelectedPackages] = useState(PACKAGE_TYPES);
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // -- Filter logic ---------------------------------------------------------

  const filteredBreakdown = useMemo(
    () =>
      [...breakdown]
        .filter((row) => selectedPackages.includes(row.package))
        .sort((a, b) => b.rate - a.rate),
    [breakdown, selectedPackages]
  );

  const { filteredAvgRate, totalRejected, totalSubmissions } = useMemo(() => {
    const rej = filteredBreakdown.reduce((sum, r) => sum + r.rejected, 0);
    const tot = filteredBreakdown.reduce((sum, r) => sum + r.total, 0);
    const rate = tot > 0 ? Math.round((rej / tot) * 1000) / 10 : 0;
    return { filteredAvgRate: rate, totalRejected: rej, totalSubmissions: tot };
  }, [filteredBreakdown]);

  // -- Handlers -------------------------------------------------------------

  const handleMenuOpen = useCallback((e) => setAnchorEl(e.currentTarget), []);
  const handleMenuClose = useCallback(() => setAnchorEl(null), []);

  const handleToggle = useCallback((pkg) => {
    setSelectedPackages((prev) =>
      prev.includes(pkg) ? prev.filter((p) => p !== pkg) : [...prev, pkg]
    );
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelectedPackages((prev) => (prev.length === PACKAGE_TYPES.length ? [] : [...PACKAGE_TYPES]));
  }, []);

  // -- Dropdown label -------------------------------------------------------

  let filterLabel = `${selectedPackages.length} of ${PACKAGE_TYPES.length}`;
  if (selectedPackages.length === PACKAGE_TYPES.length) filterLabel = 'All Packages';
  else if (selectedPackages.length === 0) filterLabel = 'No Packages';

  // -- Render ---------------------------------------------------------------

  const filterButton = (
    <Button
      size="small"
      onClick={handleMenuOpen}
      endIcon={<KeyboardArrowDownIcon sx={{ fontSize: '18px !important' }} />}
      sx={{
        textTransform: 'none',
        color: '#333',
        fontWeight: 600,
        fontSize: '0.8rem',
        bgcolor: menuOpen ? '#F4F6F8' : 'transparent',
        border: '1px solid',
        borderColor: menuOpen ? '#C4CDD5' : UI_COLORS.border,
        borderRadius: 1,
        px: 1.5,
        py: 0.5,
        minWidth: 0,
        '&:hover': { bgcolor: '#F4F6F8', borderColor: '#C4CDD5' },
      }}
    >
      {filterLabel}
    </Button>
  );

  return (
    <ChartCard
      title="Client Rejection Rate (V4)" icon={BlockIcon}
      subtitle="Average rejection rate across V4 campaigns"
      headerRight={filterButton}
    >
      {isLoading ? (
        <Box sx={{ px: 2, pt: 1, pb: 2 }}>
          {/* Hero stat skeleton */}
          <Box sx={{ bgcolor: UI_COLORS.barBg, borderRadius: 1.5, px: 2, py: 1.5 }}>
            <Skeleton variant="text" width={140} height={36} />
            <Skeleton variant="rectangular" height={8} sx={{ mt: 1, borderRadius: 1 }} />
            <Skeleton variant="text" width={100} height={16} sx={{ mt: 0.75 }} />
          </Box>
          {/* Row skeletons */}
          {[...Array(3)].map((_, i) => (
            <Stack key={i} direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1, px: 0.5 }}>
              <Skeleton variant="text" width={24} height={20} />
              <Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: '8px', flexShrink: 0 }} />
              <Box sx={{ flex: 1, borderLeft: '3px solid', borderColor: UI_COLORS.border, pl: 1.5 }}>
                <Skeleton variant="text" height={20} />
              </Box>
            </Stack>
          ))}
        </Box>
      ) : (
      <>
      {/* Avg rate summary */}
      <Box sx={{ px: 2, pt: 1, pb: 1.5 }}>
        <Box sx={{ bgcolor: UI_COLORS.barBg, borderRadius: 1.5, px: 2, py: 1.5 }}>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography
              sx={{
                fontSize: '1.75rem',
                fontWeight: 700,
                lineHeight: 1.2,
                color: getRateColor(filteredAvgRate),
              }}
            >
              {filteredAvgRate}%
            </Typography>
            <Typography variant="caption" sx={{ color: UI_COLORS.textSecondary }}>
              avg rate &middot; {filteredBreakdown.length} campaign{filteredBreakdown.length !== 1 ? 's' : ''}
            </Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={totalSubmissions > 0 ? (totalRejected / totalSubmissions) * 100 : 0}
            sx={{
              mt: 1.25,
              height: 8,
              borderRadius: 1,
              bgcolor: UI_COLORS.border,
              '& .MuiLinearProgress-bar': {
                borderRadius: 1,
                bgcolor: getRateColor(filteredAvgRate),
              },
            }}
          />

          <Typography variant="caption" sx={{ color: UI_COLORS.textMuted, mt: 0.75, display: 'block' }}>
            {totalRejected} rejected / {totalSubmissions} sent
          </Typography>
        </Box>
      </Box>

      {/* Table or empty state */}
      {filteredBreakdown.length === 0 ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 3 }}>
          <BlockIcon sx={{ fontSize: 28, color: UI_COLORS.textMuted, mb: 1 }} />
          <Typography variant="body2" sx={{ color: UI_COLORS.textMuted }}>
            No campaigns match the selected filters
          </Typography>
        </Stack>
      ) : (
        <Box
          sx={{
            maxHeight: 280,
            overflow: 'auto',
            '&::-webkit-scrollbar': { width: '3px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: 'transparent', borderRadius: '1.5px' },
            '&:hover::-webkit-scrollbar-thumb': { background: '#D0D5DA' },
            scrollbarWidth: 'thin',
            scrollbarColor: 'transparent transparent',
            '&:hover': { scrollbarColor: '#D0D5DA transparent' },
          }}
        >
          <Stack spacing={0}>
            {filteredBreakdown.map((row, index) => {
              const rateColor = getRateColor(row.rate);
              const pkgColor = PACKAGE_COLOR_MAP[row.package];

              return (
                <Stack
                  key={row.campaignId}
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  onClick={() => router.push(paths.dashboard.campaign.adminCampaignDetail(row.campaignId))}
                  sx={{
                    py: 1,
                    px: 1.5,
                    borderRadius: 1,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                    '&:hover': { bgcolor: UI_COLORS.backgroundHover },
                  }}
                >
                  {/* Rank */}
                  <Typography
                    sx={{
                      width: 24,
                      flexShrink: 0,
                      fontSize: 12,
                      fontWeight: 600,
                      color: UI_COLORS.textMuted,
                      textAlign: 'right',
                    }}
                  >
                    #{index + 1}
                  </Typography>

                  {/* Campaign image */}
                  <Avatar
                    src={row.campaignImage}
                    variant="rounded"
                    sx={{
                      width: 32,
                      height: 32,
                      flexShrink: 0,
                      borderRadius: '8px',
                      bgcolor: UI_COLORS.barBg,
                      fontSize: 13,
                      fontWeight: 600,
                      color: UI_COLORS.textMuted,
                    }}
                  >
                    {row.campaign?.charAt(0)?.toUpperCase()}
                  </Avatar>

                  {/* Left accent + content */}
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      borderLeft: `3px solid ${pkgColor}`,
                      pl: 1.5,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography
                        title={row.campaign}
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
                        {row.campaign}
                      </Typography>

                      <Chip
                        label={row.package}
                        size="small"
                        sx={{
                          bgcolor: `${pkgColor}14`,
                          color: pkgColor,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: 22,
                          flexShrink: 0,
                          '&:hover': { bgcolor: `${pkgColor}14` },
                        }}
                      />

                      <Typography
                        sx={{
                          flexShrink: 0,
                          fontSize: 12,
                          color: UI_COLORS.textMuted,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {row.rejected}/{row.total}
                      </Typography>

                      <Typography
                        sx={{
                          flexShrink: 0,
                          fontWeight: 600,
                          fontSize: 13,
                          color: rateColor,
                          minWidth: 48,
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {row.rate}%
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      )}

      </>
      )}

      {/* Package filter menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 180,
              borderRadius: 1.5,
              border: `1px solid ${UI_COLORS.border}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            },
          },
        }}
      >
        {/* Select all toggle */}
        <MenuItem
          dense
          onClick={handleToggleAll}
          sx={{ py: 0.75, px: 1.5 }}
        >
          <Checkbox
            size="small"
            checked={selectedPackages.length === PACKAGE_TYPES.length}
            indeterminate={
              selectedPackages.length > 0 && selectedPackages.length < PACKAGE_TYPES.length
            }
            sx={{ p: 0.5, mr: 1 }}
          />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            All
          </Typography>
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        {/* Individual package items */}
        {PACKAGE_TYPES.map((pkg) => (
          <MenuItem
            key={pkg}
            dense
            onClick={() => handleToggle(pkg)}
            sx={{ py: 0.75, px: 1.5 }}
          >
            <Checkbox
              size="small"
              checked={selectedPackages.includes(pkg)}
              sx={{ p: 0.5, mr: 1 }}
            />
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: PACKAGE_COLOR_MAP[pkg],
                mr: 1,
                flexShrink: 0,
              }}
            />
            <Typography variant="body2">{pkg}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </ChartCard>
  );
}
