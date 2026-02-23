import { useState, useMemo, useCallback } from 'react';

import {
  Box,
  Chip,
  Menu,
  Stack,
  Table,
  Button,
  Divider,
  Checkbox,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import ChartCard from '../components/chart-card';
import { CHART_COLORS } from '../chart-config';
import { MOCK_REJECTION_RATE } from '../mock-data';

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

const colors = {
  secondary: '#666666',
  border: '#E8ECEE',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

// Shared column widths so header + body tables stay aligned
const COL_WIDTHS = ['36%', '16%', '12%', '12%', '24%'];

function getRateColor(rate) {
  if (rate <= 15) return colors.success;
  if (rate <= 25) return colors.warning;
  return colors.error;
}

function SharedColGroup() {
  return (
    <colgroup>
      {COL_WIDTHS.map((w, i) => (
        <col key={i} style={{ width: w }} />
      ))}
    </colgroup>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RejectionRateCard() {
  const [selectedPackages, setSelectedPackages] = useState(PACKAGE_TYPES);
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // -- Filter logic ---------------------------------------------------------

  const filteredBreakdown = useMemo(
    () =>
      [...MOCK_REJECTION_RATE.breakdown]
        .filter((row) => selectedPackages.includes(row.package))
        .sort((a, b) => b.rate - a.rate),
    [selectedPackages]
  );

  const filteredAvgRate = useMemo(() => {
    if (filteredBreakdown.length === 0) return 0;
    const totalRejected = filteredBreakdown.reduce((sum, r) => sum + r.rejected, 0);
    const totalSubmissions = filteredBreakdown.reduce((sum, r) => sum + r.total, 0);
    return totalSubmissions > 0 ? Math.round((totalRejected / totalSubmissions) * 1000) / 10 : 0;
  }, [filteredBreakdown]);

  const maxRate = useMemo(
    () => (filteredBreakdown.length > 0 ? Math.max(...filteredBreakdown.map((r) => r.rate)) : 1),
    [filteredBreakdown]
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
        borderColor: menuOpen ? '#C4CDD5' : '#E8ECEE',
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
      title="Rejection Rate (V4)" icon={BlockIcon}
      subtitle="Average rejection rate across V4 campaigns"
      headerRight={filterButton}
    >
      {/* Avg rate stat row */}
      <Box sx={{ px: 2, pt: 1, pb: 1.5 }}>
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
          <Typography variant="caption" sx={{ color: colors.secondary }}>
            avg rejection rate
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: '#919EAB', ml: 'auto !important' }}
          >
            {filteredBreakdown.length} campaign{filteredBreakdown.length !== 1 ? 's' : ''}
          </Typography>
        </Stack>
      </Box>

      {/* Table or empty state */}
      {filteredBreakdown.length === 0 ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
          <Typography variant="body2" sx={{ color: '#919EAB' }}>
            No campaigns match the selected filters
          </Typography>
        </Stack>
      ) : (
        <>
          {/* Static table header */}
          <TableContainer>
            <Table size="small" sx={{ tableLayout: 'fixed' }}>
              <SharedColGroup />
              <TableHead>
                <TableRow
                  sx={{
                    '& td, & th': { bgcolor: '#F4F6F8' },
                    '& td:first-of-type, & th:first-of-type': { borderRadius: '8px 0 0 8px' },
                    '& td:last-of-type, & th:last-of-type': { borderRadius: '0 8px 8px 0' },
                  }}
                >
                  {[
                    { label: 'Campaign', align: 'left' },
                    { label: 'Package', align: 'center' },
                    { label: 'Rejected', align: 'center' },
                    { label: 'Total', align: 'center' },
                    { label: 'Rate', align: 'right' },
                  ].map((col) => (
                    <TableCell
                      key={col.label}
                      align={col.align}
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: '#919EAB',
                        border: 'none',
                        py: 0.75,
                      }}
                    >
                      {col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
            </Table>
          </TableContainer>

          {/* Scrollable table body */}
          <TableContainer
            sx={{
              maxHeight: 380,
              overflow: 'auto',
              '&::-webkit-scrollbar': { width: '3px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': {
                background: 'transparent',
                borderRadius: '1.5px',
              },
              '&:hover::-webkit-scrollbar-thumb': {
                background: '#D0D5DA',
              },
              scrollbarWidth: 'thin',
              scrollbarColor: 'transparent transparent',
              '&:hover': {
                scrollbarColor: '#D0D5DA transparent',
              },
            }}
          >
            <Table size="small" sx={{ tableLayout: 'fixed' }}>
              <SharedColGroup />
              <TableBody>
                {filteredBreakdown.map((row, index) => {
                  const isLast = index === filteredBreakdown.length - 1;
                  const rateColor = getRateColor(row.rate);
                  const pkgColor = PACKAGE_COLOR_MAP[row.package];

                  return (
                    <TableRow
                      key={row.campaign}
                      sx={{
                        '&:hover': { bgcolor: '#F9FAFB' },
                      }}
                    >
                      {/* Campaign name */}
                      <TableCell
                        sx={{
                          borderColor: colors.border,
                          borderBottom: isLast ? 'none' : undefined,
                          py: 1.25,
                        }}
                      >
                        <Typography
                          variant="body2"
                          title={row.campaign}
                          sx={{
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.campaign}
                        </Typography>
                      </TableCell>

                      {/* Package tier */}
                      <TableCell
                        align="center"
                        sx={{
                          borderColor: colors.border,
                          borderBottom: isLast ? 'none' : undefined,
                          py: 1.25,
                        }}
                      >
                        <Chip
                          label={row.package}
                          size="small"
                          sx={{
                            bgcolor: `${pkgColor}14`,
                            color: pkgColor,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 22,
                            '&:hover': { bgcolor: `${pkgColor}14` },
                          }}
                        />
                      </TableCell>

                      {/* Rejected count */}
                      <TableCell
                        align="center"
                        sx={{
                          borderColor: colors.border,
                          borderBottom: isLast ? 'none' : undefined,
                          py: 1.25,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {row.rejected}
                      </TableCell>

                      {/* Total count */}
                      <TableCell
                        align="center"
                        sx={{
                          borderColor: colors.border,
                          borderBottom: isLast ? 'none' : undefined,
                          py: 1.25,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {row.total}
                      </TableCell>

                      {/* Rate bar + chip */}
                      <TableCell
                        align="right"
                        sx={{
                          borderColor: colors.border,
                          borderBottom: isLast ? 'none' : undefined,
                          py: 1.25,
                        }}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                          <Box
                            sx={{
                              flex: 1,
                              maxWidth: 80,
                              height: 8,
                              borderRadius: 0.5,
                              bgcolor: '#F4F6F8',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            <Box
                              sx={{
                                width: `${(row.rate / maxRate) * 100}%`,
                                height: '100%',
                                borderRadius: 0.5,
                                bgcolor: rateColor,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </Box>
                          <Chip
                            label={`${row.rate}%`}
                            size="small"
                            sx={{
                              bgcolor: `${rateColor}18`,
                              color: rateColor,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24,
                              minWidth: 52,
                              '&:hover': { bgcolor: `${rateColor}18` },
                            }}
                          />
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
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
              border: '1px solid #E8ECEE',
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
