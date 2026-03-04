import { memo, useState, useMemo, useCallback, useEffect } from 'react';

import {
  Box,
  Card,
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
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import BlockIcon from '@mui/icons-material/Block';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import useGetClientRejectionRate from 'src/hooks/use-get-client-rejection-rate';
import useGetPackages from 'src/hooks/use-get-packges';

import { CHART_SX, CHART_GRID, CHART_COLORS, CHART_MARGIN, TICK_LABEL_STYLE, UI_COLORS } from '../chart-config';
import { useDateFilter, useFilteredData } from '../date-filter-context';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const KNOWN_PACKAGE_COLORS = {
  Basic: CHART_COLORS.primary,
  Essential: CHART_COLORS.secondary,
  Pro: CHART_COLORS.success,
  Custom: CHART_COLORS.warning,
};

const DEFAULT_PACKAGE_COLOR = '#919EAB';

const SEVERITY_COLORS = { error: '#EF4444', success: '#10B981', warning: '#F59E0B' };

function getRateColor(rate) {
  if (rate <= 15) return SEVERITY_COLORS.success;
  if (rate <= 25) return SEVERITY_COLORS.warning;
  return SEVERITY_COLORS.error;
}

const SCROLL_SX = {
  '&::-webkit-scrollbar': { width: '3px' },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': { background: 'transparent', borderRadius: '1.5px' },
  '&:hover::-webkit-scrollbar-thumb': { background: '#D0D5DA' },
  scrollbarWidth: 'thin',
  scrollbarColor: 'transparent transparent',
  '&:hover': { scrollbarColor: '#D0D5DA transparent' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function RejectionRateCard() {
  const router = useRouter();
  const { startDate, endDate } = useDateFilter();
  const { breakdown, trend, isLoading } = useGetClientRejectionRate({ startDate, endDate });
  const { data: packages } = useGetPackages();

  const filteredTrend = useFilteredData(trend);

  // Build dynamic package type list: named packages from API + 'Custom' catch-all
  const packageTypes = useMemo(() => {
    const apiNames = (packages || []).map((p) => p.name).filter(Boolean);
    if (!apiNames.includes('Custom')) apiNames.push('Custom');
    return apiNames;
  }, [packages]);

  const [selectedPackages, setSelectedPackages] = useState([]);

  // Re-sync selected packages when packageTypes changes (e.g. on initial load)
  useEffect(() => {
    setSelectedPackages(packageTypes);
  }, [packageTypes]);
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // -- Filter logic ---------------------------------------------------------

  const filteredBreakdown = useMemo(() => {
    const namedPackages = (packages || []).map((p) => p.name).filter(Boolean);
    return [...breakdown]
      .filter((row) => {
        if (namedPackages.includes(row.package)) {
          return selectedPackages.includes(row.package);
        }
        // Custom packages (names not in named packages list) filter under 'Custom'
        return selectedPackages.includes('Custom');
      })
      .sort((a, b) => b.rate - a.rate);
  }, [breakdown, selectedPackages, packages]);

  const { filteredAvgRate, totalRejected, totalSubmissions } = useMemo(() => {
    const rej = filteredTrend.reduce((sum, t) => sum + t.rejected, 0);
    const tot = filteredTrend.reduce((sum, t) => sum + t.total, 0);
    const rate = tot > 0 ? Math.round((rej / tot) * 1000) / 10 : 0;
    return { filteredAvgRate: rate, totalRejected: rej, totalSubmissions: tot };
  }, [filteredTrend]);

  // -- Chart data -----------------------------------------------------------

  const chartLabels = useMemo(() => filteredTrend.map((d) => d.month), [filteredTrend]);
  const chartRates = useMemo(() => filteredTrend.map((d) => d.rate), [filteredTrend]);
  const chartIndices = useMemo(() => chartLabels.map((_, i) => i), [chartLabels]);

  const xAxisConfig = useMemo(
    () => [
      {
        scaleType: 'linear',
        data: chartIndices,
        valueFormatter: (v) => {
          const i = Math.round(v);
          return i >= 0 && i < chartLabels.length ? chartLabels[i] : '';
        },
        tickMinStep: 1,
        tickLabelStyle: TICK_LABEL_STYLE,
      },
    ],
    [chartIndices, chartLabels]
  );

  // -- Handlers -------------------------------------------------------------

  const handleMenuOpen = useCallback((e) => setAnchorEl(e.currentTarget), []);
  const handleMenuClose = useCallback(() => setAnchorEl(null), []);

  const handleToggle = useCallback((pkg) => {
    setSelectedPackages((prev) =>
      prev.includes(pkg) ? prev.filter((p) => p !== pkg) : [...prev, pkg]
    );
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelectedPackages((prev) => (prev.length === packageTypes.length ? [] : [...packageTypes]));
  }, [packageTypes]);

  // -- Dropdown label -------------------------------------------------------

  let filterLabel = `${selectedPackages.length} of ${packageTypes.length}`;
  if (selectedPackages.length === packageTypes.length) filterLabel = 'All Packages';
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
    <>
      <Card
        sx={{
          border: '1px solid #E8ECEE',
          borderRadius: 2,
          bgcolor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          overflow: 'visible',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{ height: '100%', flex: 1 }}
        >
          {/* Left Panel: Header + Chart */}
          <Box sx={{ flex: { md: 3 }, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Header — inline stats like Creator Growth */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, pt: 3, pb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <BlockIcon sx={{ fontSize: 18, color: '#919EAB', mr: 0.5 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                  Client Rejection Rate (V4)
                </Typography>
              </Stack>
              {!isLoading && (
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Stack direction="row" alignItems="baseline" spacing={0.5}>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1, color: getRateColor(filteredAvgRate) }}>
                      {filteredAvgRate}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#919EAB', fontWeight: 500 }}>avg</Typography>
                  </Stack>
                  <Box sx={{ width: '1px', height: 16, bgcolor: '#E8ECEE' }} />
                  <Stack direction="row" alignItems="baseline" spacing={0.5}>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>
                      {totalRejected}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#919EAB', fontWeight: 500 }}>rejected</Typography>
                  </Stack>
                  <Box sx={{ width: '1px', height: 16, bgcolor: '#E8ECEE' }} />
                  <Stack direction="row" alignItems="baseline" spacing={0.5}>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>
                      {totalSubmissions}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#919EAB', fontWeight: 500 }}>sent</Typography>
                  </Stack>
                </Stack>
              )}
            </Stack>

            {isLoading ? (
              <Box sx={{ px: 2, pt: 1, pb: 2, flex: 1 }}>
                <Skeleton variant="rectangular" height={560} sx={{ borderRadius: 1.5 }} />
              </Box>
            ) : (
              <Box sx={{ px: 1, pb: 1, flex: 1 }}>
                {chartRates.length > 0 ? (
                  <LineChart
                    series={[
                      {
                        data: chartRates,
                        label: 'Rejection Rate',
                        color: CHART_COLORS.error,
                        area: true,
                        curve: 'linear',
                        valueFormatter: (v) => `${v}%`,
                      },
                    ]}
                    xAxis={xAxisConfig}
                    yAxis={[
                      {
                        tickLabelStyle: TICK_LABEL_STYLE,
                        valueFormatter: (v) => `${v}%`,
                      },
                    ]}
                    height={560}
                    margin={CHART_MARGIN}
                    grid={CHART_GRID}
                    tooltip={{ trigger: 'axis' }}
                    hideLegend
                    sx={CHART_SX}
                  />
                ) : (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: 460 }}>
                    <Typography variant="body2" sx={{ color: UI_COLORS.textMuted }}>
                      No trend data available
                    </Typography>
                  </Stack>
                )}
              </Box>
            )}
          </Box>

          {/* Right Panel: Campaign Breakdown List */}
          <Stack
            sx={{
              flex: { md: 2 },
              borderLeft: { md: '1px solid #E8ECEE' },
              borderTop: { xs: '1px solid #E8ECEE', md: 'none' },
              minWidth: 0,
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            {/* Right panel header — pt matches left panel for alignment */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, pt: 2.25, pb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <FormatListBulletedIcon sx={{ fontSize: 18, color: '#919EAB', mr: 0.5 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                  Campaign Breakdown
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Typography variant="caption" sx={{ color: UI_COLORS.textMuted, fontWeight: 500 }}>
                  {filteredBreakdown.length} campaign{filteredBreakdown.length !== 1 ? 's' : ''}
                </Typography>
                {filterButton}
              </Stack>
            </Stack>

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
                Campaign
              </Typography>
              <Typography sx={{ width: 100, flexShrink: 0, fontSize: 12, fontWeight: 600, color: UI_COLORS.textMuted, textAlign: 'center', ml: 2 }}>
                Package
              </Typography>
              <Typography sx={{ width: 80, flexShrink: 0, fontSize: 12, fontWeight: 600, color: UI_COLORS.textMuted, textAlign: 'center', ml: 2 }}>
                Rejected / Sent
              </Typography>
              <Typography sx={{ width: 56, flexShrink: 0, fontSize: 12, fontWeight: 600, color: UI_COLORS.textMuted, textAlign: 'right', ml: 2 }}>
                Rate (%)
              </Typography>
            </Stack>

            {isLoading && (
              <Box sx={{ px: 2.5, pt: 1 }}>
                {[...Array(5)].map((_, i) => (
                  <Stack key={i} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
                    <Skeleton variant="text" width={20} height={18} />
                    <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: '8px', flexShrink: 0 }} />
                    <Skeleton variant="text" height={18} sx={{ flex: 1 }} />
                    <Skeleton variant="text" width={48} height={18} />
                    <Skeleton variant="text" width={40} height={18} />
                  </Stack>
                ))}
              </Box>
            )}

            {!isLoading && filteredBreakdown.length === 0 && (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6, flex: 1 }}>
                <BlockIcon sx={{ fontSize: 28, color: UI_COLORS.textMuted, mb: 1 }} />
                <Typography variant="body2" sx={{ color: UI_COLORS.textMuted }}>
                  No campaigns match the selected filters
                </Typography>
              </Stack>
            )}

            {!isLoading && filteredBreakdown.length > 0 && (
              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  ...SCROLL_SX,
                }}
              >
                <Stack spacing={0} sx={{ py: 0.5 }}>
                  {filteredBreakdown.map((row, index) => {
                    const rateColor = getRateColor(row.rate);
                    const pkgColor = KNOWN_PACKAGE_COLORS[row.package] || DEFAULT_PACKAGE_COLOR;

                    return (
                      <Stack
                        key={row.campaignId}
                        direction="row"
                        alignItems="center"
                        onClick={() => router.push(paths.dashboard.campaign.adminCampaignDetail(row.campaignId))}
                        sx={{
                          py: 1.25,
                          px: 2.5,
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                          '&:hover': { bgcolor: UI_COLORS.backgroundHover },
                          borderBottom: index < filteredBreakdown.length - 1 ? '1px solid #F0F2F4' : 'none',
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

                        {/* Campaign image + name */}
                        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
                          <Avatar
                            src={row.campaignImage}
                            variant="rounded"
                            sx={{
                              width: 36,
                              height: 36,
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
                        </Stack>

                        {/* Package chip */}
                        <Box sx={{ width: 100, flexShrink: 0, display: 'flex', justifyContent: 'center', ml: 2 }}>
                          <Chip
                            label={row.package}
                            size="small"
                            title={row.package}
                            sx={{
                              bgcolor: `${pkgColor}14`,
                              color: pkgColor,
                              fontWeight: 600,
                              fontSize: '0.65rem',
                              height: 20,
                              maxWidth: 100,
                              '& .MuiChip-label': {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              },
                              '&:hover': { bgcolor: `${pkgColor}14` },
                            }}
                          />
                        </Box>

                        {/* Rejected / Sent */}
                        <Stack direction="row" alignItems="center" justifyContent="center" sx={{ width: 80, flexShrink: 0, ml: 2 }}>
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: UI_COLORS.textSecondary,
                              fontVariantNumeric: 'tabular-nums',
                              minWidth: 20,
                              textAlign: 'right',
                            }}
                          >
                            {row.rejected}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: UI_COLORS.textMuted,
                              mx: 0.5,
                            }}
                          >
                            /
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: UI_COLORS.textSecondary,
                              fontVariantNumeric: 'tabular-nums',
                              minWidth: 20,
                              textAlign: 'left',
                            }}
                          >
                            {row.total}
                          </Typography>
                        </Stack>

                        {/* Rate */}
                        <Typography
                          sx={{
                            width: 56,
                            flexShrink: 0,
                            ml: 2,
                            fontWeight: 700,
                            fontSize: 13,
                            color: rateColor,
                            textAlign: 'right',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {row.rate}%
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Stack>
        </Stack>
      </Card>

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
            checked={selectedPackages.length === packageTypes.length}
            indeterminate={
              selectedPackages.length > 0 && selectedPackages.length < packageTypes.length
            }
            sx={{ p: 0.5, mr: 1 }}
          />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            All
          </Typography>
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        {/* Individual package items */}
        {packageTypes.map((pkg) => (
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
                bgcolor: KNOWN_PACKAGE_COLORS[pkg] || DEFAULT_PACKAGE_COLOR,
                mr: 1,
                flexShrink: 0,
              }}
            />
            <Typography variant="body2">{pkg}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default memo(RejectionRateCard);
