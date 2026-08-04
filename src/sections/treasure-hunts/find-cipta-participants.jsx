import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useState, useEffect } from 'react';
import relativeTime from 'dayjs/plugin/relativeTime';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import TableSortLabel from '@mui/material/TableSortLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useDebounce } from 'src/hooks/use-debounce';

import {
  fetchCaptureUrl,
  downloadParticipantsCsv,
  useGetTreasureHuntDashboard,
  useGetTreasureHuntParticipants,
} from 'src/api/treasure-hunts';

import Iconify from 'src/components/iconify';
import { TablePaginationCustom } from 'src/components/table';
import EmptyContent from 'src/components/empty-content/empty-content';

import {
  INK,
  MUTED,
  iconButtonSx,
  headerCellSx,
  searchFieldSx,
  dialogTitleSx,
  lastHeaderCellSx,
  dialogPaperProps,
  tableContainerSx,
  firstHeaderCellSx,
  secondaryButtonSx,
} from './find-cipta-shared';

dayjs.extend(relativeTime);

const cellSx = { py: 1.5, px: 2 };

const locationFilterSx = {
  ...searchFieldSx,
  width: { xs: '100%', sm: 220 },
  '& .MuiSelect-select': {
    py: 1.25,
    px: '0 !important',
    color: '#637381',
    fontWeight: 600,
  },
};

const getInitials = (name) => {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!words.length) return '?';
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
};

const getEmptyTitle = (hasSearch, hasLocationFilter) => {
  if (hasSearch && hasLocationFilter) return 'No collections match those filters';
  if (hasSearch) return 'No collections match that search';
  if (hasLocationFilter) return 'Nobody has collected this spot yet';
  return 'No one has collected a spot yet';
};

/**
 * Each figure gets its own accent so the four cards read as four different
 * things, and the number is set in the brand serif to echo the page heading
 * rather than looking like every other dashboard tile.
 */
const Tile = ({ icon, label, value, hint, tip, accent, muted }) => (
  <Card
    sx={{
      p: 2.5,
      height: '100%',
    }}
  >
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.15,
          flexShrink: 0,
          color: accent,
          bgcolor: `${accent}14`,
        }}
      >
        <Iconify icon={icon} width={18} />
      </Stack>

      <Typography sx={{ fontSize: '0.813rem', fontWeight: 600, color: MUTED }}>{label}</Typography>

      {tip && (
        <Tooltip title={tip} placement="top" arrow>
          <Box component="span" sx={{ display: 'inline-flex', ml: -0.5 }}>
            <Iconify
              icon="eva:question-mark-circle-outline"
              width={15}
              sx={{ color: '#B0B0B0', cursor: 'help' }}
            />
          </Box>
        </Tooltip>
      )}
    </Stack>

    <Typography
      sx={{
        fontSize: 34,
        fontWeight: 700,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        // Tabular figures so the four numbers line up rather than drifting as
        // they gain digits during the event.
        fontVariantNumeric: 'tabular-nums',
        color: muted ? '#C4C4C6' : INK,
      }}
    >
      {value}
    </Typography>

    <Typography sx={{ color: '#8E8E93', fontSize: '0.75rem', mt: 1 }}>{hint}</Typography>
  </Card>
);

Tile.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.node,
  hint: PropTypes.string,
  tip: PropTypes.string,
  accent: PropTypes.string,
  muted: PropTypes.bool,
};

/**
 * The signed URL expires ~60s after it is issued, so the image is fetched when
 * the dialog opens rather than held in the row.
 */
const CaptureDialog = ({ capture, onClose }) => (
  <Dialog open={Boolean(capture)} onClose={onClose} maxWidth="xs" fullWidth PaperProps={dialogPaperProps}>
    <DialogTitle sx={{ ...dialogTitleSx, fontSize: '32px !important' }}>
      {capture?.row?.location?.name ?? 'Scan photo'}
      <IconButton onClick={onClose}>
        <Iconify icon="eva:close-fill" width={22} />
      </IconButton>
    </DialogTitle>

    <DialogContent sx={{ pb: 3 }}>
      <Typography sx={{ color: MUTED, fontSize: '0.813rem', mb: 2 }}>
        {capture?.row
          ? `Taken by ${capture.row.user?.name ?? 'this creator'} · ${dayjs(capture.row.claimedAt).format('D MMM YYYY, h:mm A')}`
          : ''}
      </Typography>

      <Box
        sx={{
          borderRadius: 1.5,
          overflow: 'hidden',
          bgcolor: '#E4E4E4',
          minHeight: 260,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {capture?.loading ? (
          <CircularProgress size={22} thickness={6} sx={{ color: INK }} />
        ) : (
          capture?.url && (
            <Box
              component="img"
              src={capture.url}
              alt="Scan capture"
              sx={{ width: 1, display: 'block' }}
            />
          )
        )}
      </Box>

      <Typography sx={{ color: '#8E8E93', fontSize: '0.75rem', mt: 1.5 }}>
        Viewing a creator&apos;s photo is recorded in the audit log.
      </Typography>
    </DialogContent>
  </Dialog>
);

CaptureDialog.propTypes = {
  capture: PropTypes.object,
  onClose: PropTypes.func,
};

const SortableHeaderCell = ({ label, column, sortBy, sortOrder, onSort, sx }) => {
  const isActive = sortBy === column;

  return (
    <TableCell sx={{ ...headerCellSx, ...sx, p: 0 }} sortDirection={isActive ? sortOrder : false}>
      <TableSortLabel
        active={isActive}
        direction={isActive ? sortOrder : 'desc'}
        onClick={() => onSort(column)}
        sx={{
          py: 1,
          px: 2,
          width: 1,
          fontWeight: 600,
          fontSize: '0.875rem',
          color: `${INK} !important`,
          '& .MuiTableSortLabel-icon': { color: `${isActive ? INK : '#B0B0B0'} !important` },
        }}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );
};

SortableHeaderCell.propTypes = {
  label: PropTypes.string,
  column: PropTypes.string,
  sortBy: PropTypes.string,
  sortOrder: PropTypes.string,
  onSort: PropTypes.func,
  sx: PropTypes.object,
};

export default function FindCiptaParticipants({ huntId }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [locationId, setLocationId] = useState('');
  const [source, setSource] = useState('');
  const [sortBy, setSortBy] = useState('claimedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [exporting, setExporting] = useState(false);
  const [capture, setCapture] = useState(null);

  // Every keystroke used to mint a new SWR key and hit the API.
  const debouncedSearch = useDebounce(search, 400);

  const { dashboard } = useGetTreasureHuntDashboard(huntId);
  const { participants } = useGetTreasureHuntParticipants(huntId, {
    page,
    rowsPerPage,
    search: debouncedSearch,
    locationId,
    source,
    sortBy,
    sortOrder,
  });

  // Reset to the first page whenever the result set changes underneath, or a
  // search on page 3 lands on an empty table.
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, locationId, source, sortBy, sortOrder]);

  const totals = dashboard?.totals;
  const locations = dashboard?.locations ?? [];
  const enabledLocationCount = participants?.enabledLocationCount ?? 0;
  const hasSearch = Boolean(debouncedSearch.trim());
  const hasLocationFilter = Boolean(locationId);
  const hasFilters = hasSearch || hasLocationFilter || Boolean(source);

  // Sorting is server-side: sorting only the current page would silently lie
  // about the ordering of everything you cannot see.
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(column);
    setSortOrder('desc');
  };

  const handleViewCapture = async (row) => {
    setCapture({ row, url: null, loading: true });
    try {
      const url = await fetchCaptureUrl(row.id);
      setCapture({ row, url, loading: false });
    } catch (error) {
      setCapture(null);
      enqueueSnackbar(error?.message || "Couldn't load that photo.", { variant: 'error' });
    }
  };

  // Bitly scan counts only move when someone presses sync, so a raw 0 next to a
  // non-zero collection count reads as a contradiction rather than as stale data.
  const lastSyncedAt = locations
    .map((location) => location.analyticsSyncedAt)
    .filter(Boolean)
    .sort()
    .pop();
  const everSynced = Boolean(lastSyncedAt);

  const handleExport = async () => {
    try {
      setExporting(true);
      await downloadParticipantsCsv(huntId);
      enqueueSnackbar('CSV downloaded.');
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to export the CSV.', { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setLocationId('');
    setSource('');
  };

  return (
    <Stack spacing={4}>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Tile
            icon="mdi:qrcode-scan"
            label="QR scans"
            accent="#1340FF"
            value={everSynced ? (totals?.rawScans ?? 0) : '—'}
            muted={!everSynced}
            hint={
              everSynced
                ? `Phone camera only · synced ${dayjs(lastSyncedAt).fromNow()}`
                : 'Not synced from Bitly yet'
            }
            // Scanning inside the app posts the code straight to us and never
            // follows the Bitly redirect, so this staying at 0 while spots are
            // being collected is correct, not a broken counter.
            tip={
              everSynced
                ? 'Bitly counts redirects, which only happen when someone uses their phone camera outside the app. In-app scans never touch Bitly, so they are not included here.'
                : 'Press the sync button on a location in the Locations tab to pull the latest count from Bitly.'
            }
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <Tile
            icon="mdi:map-marker-check-outline"
            label="Spots collected"
            accent="#1ABF66"
            value={totals?.claims ?? 0}
            hint="Successful in-app collections"
            tip="One per creator per location — collecting the same spot twice does nothing."
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <Tile
            icon="mdi:account-group-outline"
            label="Participants"
            accent="#8A5AFE"
            value={totals?.uniqueParticipants ?? 0}
            hint="Collected at least one spot"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <Tile
            icon="mdi:star-outline"
            label="XP awarded"
            accent="#FF9A02"
            value={totals?.xpAwarded ?? 0}
            hint="Total paid out by this event"
            tip="Spots collected multiplied by the event's XP reward."
          />
        </Grid>
      </Grid>

      <Box>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'flex-end' }}
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Box>
            {/* Each row is one claim, so the same creator appears once per spot —
                calling the count "participants" contradicted the tile above. */}
            <Typography variant="subtitle1">Collections</Typography>
            <Typography sx={{ color: MUTED, fontSize: '0.813rem' }}>
              {`${participants?.total ?? 0} ${(participants?.total ?? 0) === 1 ? 'collection' : 'collections'}${hasFilters ? ' matching your filters' : ', newest first'}`}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              placeholder="Search by name or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={searchFieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" width={18} sx={{ color: '#637381' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
              sx={locationFilterSx}
              SelectProps={{
                displayEmpty: true,
                inputProps: { 'aria-label': 'Filter collections by location' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="mdi:map-marker-outline" width={18} sx={{ color: '#637381' }} />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">All locations</MenuItem>
              {locations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Separates the app funnel from the poster: a link collection means
                someone scanned with their phone camera and installed to claim. */}
            <TextField
              select
              value={source}
              onChange={(event) => setSource(event.target.value)}
              sx={{ ...locationFilterSx, width: { xs: '100%', sm: 190 } }}
              SelectProps={{
                displayEmpty: true,
                inputProps: { 'aria-label': 'Filter collections by scan source' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="mdi:cellphone-screenshot" width={18} sx={{ color: '#637381' }} />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">Any source</MenuItem>
              <MenuItem value="IN_APP_CAMERA">In-app camera</MenuItem>
              <MenuItem value="EXTERNAL_LINK">Link</MenuItem>
            </TextField>

            {hasFilters && (
              <Button
                onClick={handleClearFilters}
                startIcon={<Iconify icon="eva:close-fill" width={16} />}
                sx={{ ...secondaryButtonSx, color: MUTED, flexShrink: 0 }}
              >
                Clear
              </Button>
            )}

            <Button
              onClick={handleExport}
              disabled={exporting}
              startIcon={<Iconify icon="mdi:file-delimited-outline" width={16} />}
              sx={{ ...secondaryButtonSx, width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}
            >
              Export CSV
            </Button>
          </Stack>
        </Stack>

        {!participants?.rows?.length ? (
          <EmptyContent
            title={getEmptyTitle(hasSearch, hasLocationFilter)}
            description={
              hasFilters ? 'Clear the filters to see everything.' : 'Collections appear here as creators scan.'
            }
            sx={{ py: 8 }}
          />
        ) : (
          <>
            <TableContainer sx={tableContainerSx}>
              <Table size="medium" sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={firstHeaderCellSx}>Creator</TableCell>
                    <TableCell sx={{ ...headerCellSx, width: 130 }} align="center">
                      Progress
                    </TableCell>
                    <SortableHeaderCell
                      label="Location"
                      column="location"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <TableCell sx={{ ...headerCellSx, width: 150 }}>Scanned from</TableCell>
                    <TableCell sx={{ ...headerCellSx, width: 90 }} align="center">
                      Photo
                    </TableCell>
                    <SortableHeaderCell
                      label="Collected"
                      column="claimedAt"
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                      sx={{ ...lastHeaderCellSx, width: 180 }}
                    />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {participants.rows.map((row) => (
                    <TableRow key={row.id} hover>
                      {/* Name and email are one identity, not two columns. */}
                      <TableCell sx={cellSx}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Avatar
                            src={row.user?.photoURL ?? undefined}
                            alt={row.user?.name ?? 'Creator'}
                            sx={{
                              width: 36,
                              height: 36,
                              flexShrink: 0,
                              bgcolor: 'rgba(19, 64, 255, 0.1)',
                              color: '#1340FF',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            {getInitials(row.user?.name)}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Link
                              component={RouterLink}
                              href={paths.dashboard.creator.profile(row.userId)}
                              variant="subtitle2"
                              noWrap
                              sx={{
                                display: 'block',
                                color: INK,
                                '&:hover': { color: '#1340FF' },
                              }}
                            >
                              {row.user?.name ?? '—'}
                            </Link>
                            <Typography noWrap sx={{ color: '#637381', fontSize: '0.813rem' }}>
                              {row.user?.email ?? '—'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Completion, not just activity: one-and-done scanners
                          look identical to finishers without this. */}
                      <TableCell sx={cellSx} align="center">
                        <Tooltip
                          title={`Collected ${row.collectedCount} of the ${enabledLocationCount} spots currently switched on`}
                          placement="top"
                          arrow
                        >
                          <Box component="span" sx={{ display: 'inline-block', minWidth: 78 }}>
                            <Typography
                              sx={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color:
                                  enabledLocationCount > 0 &&
                                  row.collectedCount >= enabledLocationCount
                                    ? '#1ABF66'
                                    : INK,
                              }}
                            >
                              {`${row.collectedCount} of ${enabledLocationCount}`}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={
                                enabledLocationCount > 0
                                  ? Math.min((row.collectedCount / enabledLocationCount) * 100, 100)
                                  : 0
                              }
                              sx={{
                                mt: 0.5,
                                height: 4,
                                borderRadius: 2,
                                bgcolor: '#EFEFEF',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 2,
                                  bgcolor:
                                    row.collectedCount >= enabledLocationCount
                                      ? '#1ABF66'
                                      : '#1340FF',
                                },
                              }}
                            />
                          </Box>
                        </Tooltip>
                      </TableCell>

                      <TableCell sx={cellSx}>{row.location?.name}</TableCell>
                      <TableCell sx={cellSx}>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Iconify
                            icon={
                              row.source === 'IN_APP_CAMERA'
                                ? 'mdi:cellphone-screenshot'
                                : 'eva:link-2-fill'
                            }
                            width={16}
                            sx={{ color: MUTED }}
                          />
                          <Typography sx={{ fontSize: '0.875rem', color: '#637381' }}>
                            {row.source === 'IN_APP_CAMERA' ? 'In-app camera' : 'Link'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      {/* Deliberately click-to-view: every fetch is audit-logged
                          server-side, so rendering these inline would turn one
                          page load into 25 silent accesses to creators' photos. */}
                      <TableCell sx={cellSx} align="center">
                        {row.hasCapture ? (
                          <Tooltip title="View the photo taken at this scan" placement="top" arrow>
                            <IconButton onClick={() => handleViewCapture(row)} sx={iconButtonSx}>
                              <Iconify icon="mdi:camera-outline" width={18} sx={{ color: MUTED }} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="No photo was captured for this scan" placement="top" arrow>
                            <Box component="span" sx={{ color: '#C4C4C6' }}>
                              —
                            </Box>
                          </Tooltip>
                        )}
                      </TableCell>

                      <TableCell sx={cellSx}>
                        <Tooltip
                          title={dayjs(row.claimedAt).format('D MMM YYYY, h:mm A')}
                          placement="top"
                          arrow
                        >
                          <Typography sx={{ fontSize: '0.875rem', color: '#637381' }}>
                            {dayjs(row.claimedAt).fromNow()}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <CaptureDialog capture={capture} onClose={() => setCapture(null)} />

            <TablePaginationCustom
              count={participants?.total ?? 0}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setPage(0);
                setRowsPerPage(parseInt(event.target.value, 10));
              }}
            />
          </>
        )}
      </Box>
    </Stack>
  );
}

FindCiptaParticipants.propTypes = {
  huntId: PropTypes.string,
};
