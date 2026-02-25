import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { endOfDay } from 'date-fns';
import { m } from 'framer-motion';

import { varFade, varContainer } from 'src/components/animate';

import {
  Box,
  Card,
  Chip,
  Menu,
  Stack,
  Table,
  Button,
  Rating,
  Avatar,
  Drawer,
  Divider,
  Tooltip,
  MenuItem,
  TableRow,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  TableContainer,
  InputAdornment,
  TablePagination,
  CircularProgress,
} from '@mui/material';

import { useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { fDateTime, fToNow } from 'src/utils/format-time';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content/empty-content';
import { useSettingsContext } from 'src/components/settings';

import { useGetNpsFeedback, useGetNpsFeedbackStats } from 'src/hooks/use-get-nps-feedback';

import DateFilterSelect from '../components/date-filter-select';

// ----------------------------------------------------------------------

const COLUMNS = [
  { id: 'name', label: 'User', align: 'left', sortable: false },
  { id: 'rating', label: 'Rating', align: 'left' },
  { id: 'feedback', label: 'Feedback', align: 'left', sortable: false },
  { id: 'device', label: 'Device', align: 'left', sortable: false },
  { id: 'createdAt', label: 'Date', align: 'left' },
  { id: 'action', label: '', align: 'center', sortable: false },
];

const USER_TYPE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'CREATOR', label: 'Creator' },
];

const USER_TYPE_COLORS = {
  CREATOR: '#1340FF',
  CLIENT: '#00AB55',
};

function UserTypeChip({ userType, compact, sx }) {
  const color = USER_TYPE_COLORS[userType] || USER_TYPE_COLORS.CLIENT;
  const label = userType === 'CREATOR' ? 'Creator' : 'Client';

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        borderRadius: 0.8,
        border: `1px solid ${color}`,
        boxShadow: `0px -2px 0px 0px ${color} inset`,
        backgroundColor: '#FFFFFF',
        color,
        fontWeight: 600,
        fontSize: compact ? 11 : 12,
        height: compact ? 22 : 28,
        width: 'fit-content',
        lineHeight: 1,
        '& .MuiChip-label': {
          transform: 'translateY(-1px)',
        },
        '&:hover': { backgroundColor: '#FFFFFF' },
        ...sx,
      }}
    />
  );
}

UserTypeChip.propTypes = {
  userType: PropTypes.string,
  compact: PropTypes.bool,
  sx: PropTypes.object,
};

// ----------------------------------------------------------------------

export default function FeedbackView() {
  const theme = useTheme();
  const settings = useSettingsContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedRow, setSelectedRow] = useState(null);
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const [ratingFilter, setRatingFilter] = useState('all');

  const dateParams = {
    ...(filterStartDate && { startDate: filterStartDate.toISOString() }),
    ...(filterEndDate && { endDate: endOfDay(filterEndDate).toISOString() }),
  };

  const userTypeParam = userTypeFilter !== 'all' ? { userType: userTypeFilter } : {};
  const ratingParam = ratingFilter !== 'all' ? { rating: ratingFilter } : {};

  const { feedback, total, isLoading } = useGetNpsFeedback({
    page: page + 1,
    limit: rowsPerPage,
    ...(search && { search }),
    sortBy,
    sortOrder,
    ...dateParams,
    ...userTypeParam,
    ...ratingParam,
  });

  const { stats, isLoading: statsLoading } = useGetNpsFeedbackStats({ ...dateParams, ...userTypeParam });

  const handleDateFilterChange = useCallback(({ preset, startDate, endDate }) => {
    setDateFilter(preset);
    setFilterStartDate(startDate);
    setFilterEndDate(endDate);
    setPage(0);
  }, []);

  const handleSort = useCallback((column) => {
    setSortOrder((prev) => (sortBy === column && prev === 'desc' ? 'asc' : 'desc'));
    setSortBy(column);
  }, [sortBy]);

  const handleChangePage = useCallback((_, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Typography variant="h2" fontFamily="Instrument Serif" fontWeight="normal" gutterBottom>
        Feedback
      </Typography>

      {/* Stat Cards — bento row */}
      {stats && (
        <Stack
          component={m.div}
          variants={varContainer({ staggerIn: 0.1 })}
          initial="initial"
          animate="animate"
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          {/* Total Responses */}
          <Card
            component={m.div}
            variants={varFade({ distance: 24 }).inUp}
            sx={{
              flex: 1,
              p: 2.5,
              borderRadius: 3,
              boxShadow: '0 2px 12px 0 rgba(145,158,171,0.12)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Iconify icon="mdi:message-reply-text-outline" width={16} sx={{ color: '#1340FF' }} />
              </Box>
              <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 0.5, fontSize: 11 }}>
                Total Responses
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {stats.totalResponses}
            </Typography>
            {userTypeFilter === 'all' && stats.creatorResponses != null && (
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1 }}>
                <Chip
                  size="small"
                  label={`${stats.creatorResponses} creators`}
                  sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: '#EEF2FF', color: '#1340FF', '& .MuiChip-label': { px: 1 }, '&:hover': { bgcolor: '#EEF2FF' } }}
                />
                <Chip
                  size="small"
                  label={`${stats.clientResponses} clients`}
                  sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: '#E8F5E9', color: '#00AB55', '& .MuiChip-label': { px: 1 }, '&:hover': { bgcolor: '#E8F5E9' } }}
                />
              </Stack>
            )}
          </Card>

          {/* Average Rating */}
          <Card
            component={m.div}
            variants={varFade({ distance: 24 }).inUp}
            sx={{
              flex: 1,
              p: 2.5,
              borderRadius: 3,
              boxShadow: '0 2px 12px 0 rgba(145,158,171,0.12)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Iconify icon="mdi:star" width={16} sx={{ color: '#FFAB00' }} />
              </Box>
              <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 0.5, fontSize: 11 }}>
                Average Rating
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="baseline" spacing={0.75}>
              <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {stats.averageRating}
              </Typography>
              <Typography variant="body2" color="text.disabled">/ 5</Typography>
            </Stack>
            <Rating
              value={stats.averageRating}
              precision={0.1}
              size="small"
              readOnly
              sx={{ mt: 0.5, '& .MuiRating-iconFilled': { color: '#FFAB00' }, '& .MuiRating-iconEmpty': { color: '#DFE3E8' } }}
            />
          </Card>

          {/* Rating Distribution */}
          <Card
            component={m.div}
            variants={varFade({ distance: 24 }).inUp}
            sx={{
              flex: 2,
              p: 2.5,
              borderRadius: 3,
              boxShadow: '0 2px 12px 0 rgba(145,158,171,0.12)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Iconify icon="mdi:chart-bar" width={16} sx={{ color: '#FFAB00' }} />
              </Box>
              <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 0.5, fontSize: 11 }}>
                Distribution
              </Typography>
            </Stack>
            <Stack spacing={0.5}>
              {[...stats.distribution].reverse().map((item, idx) => {
                const pct = stats.totalResponses > 0 ? (item.count / stats.totalResponses) * 100 : 0;
                return (
                  <Stack key={item.rating} direction="row" alignItems="center" spacing={0.75}>
                    <Stack direction="row" alignItems="center" spacing={0.25} sx={{ minWidth: 28 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11, color: 'text.secondary' }}>{item.rating}</Typography>
                      <Iconify icon="mdi:star" width={11} sx={{ color: item.count > 0 ? '#FFAB00' : '#DFE3E8' }} />
                    </Stack>
                    <Box sx={{ flex: 1, height: 7, borderRadius: 4, bgcolor: '#F4F6F8', overflow: 'hidden' }}>
                      <Box
                        sx={{
                          height: 7,
                          borderRadius: 4,
                          bgcolor: '#FFAB00',
                          width: `${pct}%`,
                          minWidth: pct > 0 ? 3 : 0,
                          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11, minWidth: 16, textAlign: 'right', color: item.count > 0 ? 'text.primary' : 'text.disabled' }}>
                      {item.count}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
          </Card>
        </Stack>
      )}

      {/* Tabs + Filters row */}
      <Box sx={{ mb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '1px',
              bgcolor: 'divider',
            },
          }}
        >
          {/* Tabs — left */}
          <Stack direction="row" spacing={0.5} sx={{ overflow: 'auto', flexShrink: 0 }}>
            {USER_TYPE_TABS.map((tab) => (
              <Button
                key={tab.value}
                disableRipple
                size="large"
                onClick={() => { setUserTypeFilter(tab.value); setPage(0); }}
                sx={{
                  px: 1.2,
                  py: 0.5,
                  pb: 1,
                  minWidth: 'fit-content',
                  color: userTypeFilter === tab.value ? '#221f20' : '#8e8e93',
                  position: 'relative',
                  fontSize: { xs: '0.9rem', sm: '1.05rem' },
                  fontWeight: 650,
                  whiteSpace: 'nowrap',
                  mr: { xs: 1, sm: 2 },
                  textTransform: 'none',
                  transition: 'transform 0.1s ease-in-out',
                  '&:focus': {
                    outline: 'none',
                    bgcolor: 'transparent',
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                    bgcolor: 'transparent',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    width: userTypeFilter === tab.value ? '100%' : '0%',
                    bgcolor: '#1340ff',
                    transition: 'all 0.3s ease-in-out',
                    transform: 'scaleX(1)',
                    transformOrigin: 'left',
                  },
                  '&:hover': {
                    bgcolor: 'transparent',
                    '&::after': {
                      width: '100%',
                      opacity: userTypeFilter === tab.value ? 1 : 0.5,
                    },
                  },
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Stack>

          {/* Filters + Search — right */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: { xs: 0, sm: 'auto' }, pb: 0.5, mt: { xs: 1, sm: 0 }, flexWrap: 'wrap', gap: 1 }}>
            <RatingFilterSelect value={ratingFilter} onChange={(val) => { setRatingFilter(val); setPage(0); }} />
            <DateFilterSelect
              value={dateFilter}
              startDate={filterStartDate}
              endDate={filterEndDate}
              onChange={handleDateFilterChange}
            />
            <TextField
              size="small"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: 220 }, '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 1 } }}
            />
          </Stack>
        </Stack>
      </Box>

      {/* Table (desktop) / Cards (mobile) */}
      {isMobile ? (
        <Box>
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}
          {!isLoading && feedback.length === 0 && (
            <Card sx={{ borderRadius: 2 }}>
              <EmptyContent title="No feedback yet" />
            </Card>
          )}
          {!isLoading && feedback.length > 0 && (
            <Stack spacing={1.5}>
              {feedback.map((row) => (
                <FeedbackCard key={row.id} row={row} onClick={() => setSelectedRow(row)} />
              ))}
            </Stack>
          )}

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{ borderTop: 'none' }}
          />
        </Box>
      ) : (
        <Card sx={{ borderRadius: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {COLUMNS.map((col, index) => (
                    <SortableHeader
                      key={col.id}
                      column={col.id}
                      label={col.label}
                      align={col.align}
                      isFirst={index === 0}
                      isLast={index === COLUMNS.length - 1}
                      sortColumn={sortBy}
                      sortDirection={sortOrder}
                      onSort={col.sortable === false ? undefined : handleSort}
                    />
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={COLUMNS.length} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && feedback.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={COLUMNS.length}>
                      <EmptyContent title="No feedback yet" />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && feedback.length > 0 &&
                  feedback.map((row) => (
                    <FeedbackRow key={row.id} row={row} onRowClick={setSelectedRow} />
                  ))
                }
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Card>
      )}

      <FeedbackDrawer
        row={selectedRow}
        rows={feedback}
        onClose={() => setSelectedRow(null)}
        onNavigate={setSelectedRow}
      />
    </Container>
  );
}

// ----------------------------------------------------------------------

const RATING_OPTIONS = [
  { value: 'all', label: 'All stars' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars' },
  { value: '3', label: '3 stars' },
  { value: '2', label: '2 stars' },
  { value: '1', label: '1 star' },
];

function RatingFilterSelect({ value, onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const isFiltered = value !== 'all';
  const selected = RATING_OPTIONS.find((o) => o.value === value);

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
      <Button
        size="small"
        color="inherit"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={16} />}
        startIcon={<Iconify icon="mdi:star" width={16} sx={{ color: isFiltered ? '#FFAB00' : 'text.disabled' }} />}
        sx={{
          bgcolor: 'white',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.5,
          px: 1.5,
          py: 0.75,
          fontWeight: 600,
          fontSize: 13,
          whiteSpace: 'nowrap',
          '&:hover': { bgcolor: 'white' },
        }}
      >
        {selected?.label || 'All stars'}
      </Button>

      {isFiltered && (
        <IconButton size="small" onClick={() => onChange('all')} sx={{ width: 28, height: 28 }}>
          <Iconify icon="eva:close-circle-fill" width={18} sx={{ color: 'text.disabled' }} />
        </IconButton>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { minWidth: 160 } } }}
      >
        {RATING_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            selected={value === option.value}
            onClick={() => { onChange(option.value); setAnchorEl(null); }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              {option.value === 'all' ? (
                <Iconify icon="mdi:star-outline" width={18} sx={{ color: 'text.secondary' }} />
              ) : (
                <Rating value={Number(option.value)} size="small" readOnly max={Number(option.value)} sx={{ '& .MuiRating-iconFilled': { color: '#FFAB00' } }} />
              )}
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ variant: 'body2' }}>
              {option.label}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  );
}

RatingFilterSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

function SortableHeader({ column, label, align, isFirst, isLast, sortColumn, sortDirection, onSort }) {
  const getBorderRadius = () => {
    if (isFirst) return '10px 0 0 10px';
    if (isLast) return '0 10px 10px 0';
    return 0;
  };

  return (
    <TableCell
      onClick={onSort ? () => onSort(column) : undefined}
      sx={{
        py: 1,
        px: 2,
        color: '#221f20',
        fontWeight: 600,
        bgcolor: '#f5f5f5',
        whiteSpace: 'nowrap',
        fontSize: '0.875rem',
        cursor: onSort ? 'pointer' : 'default',
        borderRadius: getBorderRadius(),
        ...(onSort && { '&:hover': { bgcolor: '#ebebeb' } }),
      }}
      align={align}
    >
      <Stack direction="row" alignItems="center" spacing={0.5} justifyContent={align === 'center' ? 'center' : 'flex-start'}>
        {label}
        {onSort && (
          <Iconify
            icon={sortColumn === column && sortDirection === 'asc' ? 'eva:arrow-upward-fill' : 'eva:arrow-downward-fill'}
            width={16}
            sx={{ color: sortColumn === column ? '#1340FF' : '#bdbdbd' }}
          />
        )}
      </Stack>
    </TableCell>
  );
}

SortableHeader.propTypes = {
  column: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  align: PropTypes.string,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool,
  sortColumn: PropTypes.string,
  sortDirection: PropTypes.string,
  onSort: PropTypes.func,
};

// ----------------------------------------------------------------------

const DEVICE_CONFIG = {
  mobile: { icon: 'mdi:cellphone', color: '#1340FF', bg: '#EBF0FF' },
  tablet: { icon: 'mdi:tablet', color: '#8E33FF', bg: '#F3E8FF' },
  desktop: { icon: 'mdi:monitor', color: '#454F5B', bg: '#F4F6F8' },
};

const OS_ICONS = {
  macos: 'mdi:apple',
  ios: 'mdi:apple',
  windows: 'mdi:microsoft-windows',
  android: 'mdi:android',
  linux: 'mdi:linux',
};

const BROWSER_ICONS = {
  chrome: 'mdi:google-chrome',
  safari: 'mdi:apple-safari',
  firefox: 'mdi:firefox',
  edge: 'mdi:microsoft-edge',
  opera: 'mdi:opera',
  samsung: 'mdi:cellphone',
};

const getOsIcon = (os) => {
  if (!os) return null;
  const key = Object.keys(OS_ICONS).find((k) => os.toLowerCase().startsWith(k));
  return key ? OS_ICONS[key] : 'mdi:devices';
};

const getBrowserIcon = (browser) => {
  if (!browser) return null;
  const key = Object.keys(BROWSER_ICONS).find((k) => browser.toLowerCase().startsWith(k));
  return key ? BROWSER_ICONS[key] : 'mdi:web';
};

// Strip version numbers for compact table display — "Chrome 145.0.0.0" → "Chrome"
const shortName = (str) => {
  if (!str) return '';
  return str.replace(/\s[\d.]+.*$/, '');
};

function DeviceCell({ row }) {
  const config = DEVICE_CONFIG[row.deviceType] || DEVICE_CONFIG.desktop;
  const osName = shortName(row.os);
  const browserName = shortName(row.browser);

  return (
    <Tooltip
      title={[row.os, row.browser].filter(Boolean).join(' · ')}
      arrow
      placement="top"
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{
          px: 1.25,
          py: 0.5,
          borderRadius: 1,
          bgcolor: config.bg,
          border: `1px solid ${config.color}14`,
          width: 'fit-content',
        }}
      >
        <Iconify icon={config.icon} width={16} sx={{ color: config.color, flexShrink: 0 }} />
        {osName && (
          <>
            <Box sx={{ width: '1px', height: 14, bgcolor: `${config.color}30`, flexShrink: 0 }} />
            <Iconify icon={getOsIcon(row.os)} width={14} sx={{ color: 'text.secondary', flexShrink: 0 }} />
            <Typography variant="caption" fontWeight={600} noWrap sx={{ fontSize: 11, color: 'text.secondary' }}>
              {osName}
            </Typography>
          </>
        )}
        {browserName && (
          <>
            <Box sx={{ width: '1px', height: 14, bgcolor: `${config.color}30`, flexShrink: 0 }} />
            <Iconify icon={getBrowserIcon(row.browser)} width={14} sx={{ color: 'text.secondary', flexShrink: 0 }} />
            <Typography variant="caption" fontWeight={600} noWrap sx={{ fontSize: 11, color: 'text.secondary' }}>
              {browserName}
            </Typography>
          </>
        )}
      </Stack>
    </Tooltip>
  );
}

DeviceCell.propTypes = {
  row: PropTypes.object.isRequired,
};

// ----------------------------------------------------------------------

function FeedbackRow({ row, onRowClick }) {
  return (
    <TableRow hover onClick={() => onRowClick(row)} sx={{ cursor: 'pointer' }}>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar src={row.user?.photoURL} alt={row.user?.name} sx={{ width: 36, height: 36 }} />
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" fontWeight={600}>
                {row.user?.name || '-'}
              </Typography>
              <UserTypeChip userType={row.userType} compact />
            </Stack>
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.user?.email || '-'}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      <TableCell>
        <Rating value={row.rating} size="small" readOnly />
      </TableCell>

      <TableCell sx={{ maxWidth: 300 }}>
        {row.feedback ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 300,
            }}
          >
            {row.feedback}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.disabled">-</Typography>
        )}
      </TableCell>

      <TableCell>
        {row.deviceType ? (
          <DeviceCell row={row} />
        ) : (
          <Typography variant="body2" color="text.disabled">-</Typography>
        )}
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Typography variant="body2" color="text.secondary">
          {fDateTime(row.createdAt)}
        </Typography>
      </TableCell>

      <TableCell align="center" sx={{ px: 1 }}>
        <Tooltip title="View details" arrow>
          <IconButton size="small" onClick={() => onRowClick(row)}>
            <Iconify icon="eva:eye-fill" width={20} sx={{ color: 'text.secondary' }} />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

FeedbackRow.propTypes = {
  row: PropTypes.object.isRequired,
  onRowClick: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

function FeedbackCard({ row, onClick }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: 'pointer',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      {/* Top row: Avatar + name + rating */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          <Avatar src={row.user?.photoURL} alt={row.user?.name} sx={{ width: 36, height: 36 }} />
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle2" fontWeight={600} noWrap>
                {row.user?.name || '-'}
              </Typography>
              <UserTypeChip userType={row.userType} compact />
            </Stack>
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.user?.email || '-'}
            </Typography>
          </Box>
        </Stack>
        <Rating value={row.rating} size="small" readOnly sx={{ flexShrink: 0 }} />
      </Stack>

      {/* Feedback text */}
      {row.feedback && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {row.feedback}
        </Typography>
      )}

      {/* Date & Device */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={0.5}>
        <Typography variant="caption" color="text.disabled">
          {fDateTime(row.createdAt)}
        </Typography>
        {row.deviceType && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 0.75,
              bgcolor: (DEVICE_CONFIG[row.deviceType] || DEVICE_CONFIG.desktop).bg,
            }}
          >
            <Iconify
              icon={(DEVICE_CONFIG[row.deviceType] || DEVICE_CONFIG.desktop).icon}
              width={13}
              sx={{ color: (DEVICE_CONFIG[row.deviceType] || DEVICE_CONFIG.desktop).color }}
            />
            <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary' }}>
              {[
                shortName(row.os),
                shortName(row.browser),
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

FeedbackCard.propTypes = {
  row: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

const formatFollowerCount = (num) => {
  if (num == null) return null;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getCampaignChipColor = (status) => {
  const map = {
    ACTIVE: '#1abf66',
    DRAFT: '#ff9800',
    COMPLETED: '#3366FF',
    PAUSED: '#f44336',
    PENDING_ADMIN_ACTIVATION: '#1340FF',
    PENDING_CSM_REVIEW: '#1340FF',
    SCHEDULED: '#1340FF',
  };
  return map[status] || '#48484a';
};

const formatCampaignStatus = (status) => {
  if (!status) return '';
  if (['PENDING_ADMIN_ACTIVATION', 'PENDING_CSM_REVIEW', 'SCHEDULED'].includes(status))
    return 'PENDING';
  return status;
};

function FeedbackDrawer({ row, rows = [], onClose, onNavigate }) {
  const router = useRouter();

  const currentIndex = rows.findIndex((r) => r.id === row?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < rows.length - 1;
  const handlePrev = () => hasPrev && onNavigate(rows[currentIndex - 1]);
  const handleNext = () => hasNext && onNavigate(rows[currentIndex + 1]);

  const isCreator = row?.userType === 'CREATOR';
  const isClient = row?.userType === 'CLIENT';

  const creator = row?.user?.creator;
  const client = row?.user?.client;
  const company = client?.company;
  const companyName = company?.name;

  const igHandle = creator?.instagram;
  const igFollowers = creator?.instagramUser?.followers_count;
  const igEngagement = creator?.instagramUser?.engagement_rate;

  const ttHandle = creator?.tiktok;
  const ttFollowers = creator?.tiktokUser?.follower_count;
  const ttEngagement = creator?.tiktokUser?.engagement_rate;

  const hasSocialStats = isCreator && (igHandle || ttHandle);

  const creatorCampaigns = row?.user?.shortlisted || [];
  const clientCampaigns = row?.user?.client?.company?.campaign || [];
  const campaigns = isCreator ? creatorCampaigns : clientCampaigns;
  const totalCampaigns = isCreator
    ? (row?.user?._count?.shortlisted || 0)
    : (row?.user?.client?.company?._count?.campaign || 0);
  const hasCampaigns = campaigns.length > 0;

  const handleViewProfile = () => {
    if (isCreator && row?.user?.id) {
      router.push(paths.dashboard.creator.profile(row.user.id));
    } else if (isClient && client?.companyId) {
      router.push(paths.dashboard.company.companyEdit(client.companyId));
    }
  };

  const hasActionButton = (isCreator && row?.user?.id) || (isClient && client?.companyId);

  return (
    <Drawer
      open={!!row}
      onClose={onClose}
      anchor="right"
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{
        sx: {
          width: { xs: 1, sm: 480 },
          borderTopLeftRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 40px -4px rgba(145, 158, 171, 0.24)',
          borderLeft: '1px solid #919EAB3D',
        },
      }}
    >
      {/* Sticky Header — user info + close */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ pt: 1.5, px: 2.5 }}>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:close-fill" sx={{ height: 24, width: 24 }} />
          </IconButton>
        </Stack>
        <Box sx={{ px: 3, pb: 2.5 }}>
          <Stack direction="row" alignItems="flex-start" spacing={2}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                alt={row?.user?.name}
                src={row?.user?.photoURL}
                sx={{ width: 56, height: 56 }}
              />
              {isClient && company?.logo && (
                <Avatar
                  src={company.logo}
                  alt={companyName}
                  sx={{
                    width: 22,
                    height: 22,
                    fontSize: 9,
                    position: 'absolute',
                    bottom: -2,
                    right: -4,
                    border: '2px solid white',
                  }}
                >
                  {companyName?.charAt(0)}
                </Avatar>
              )}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>{row?.user?.name || '-'}</Typography>
                <UserTypeChip userType={row?.userType} compact />
              </Stack>
              <Typography variant="body2" color="text.secondary" noWrap>
                {row?.user?.email || '-'}
              </Typography>
              {isClient && companyName && (
                <Typography variant="caption" color="text.secondary" noWrap sx={{ mt: 0.25, display: 'block' }}>
                  {companyName}
                </Typography>
              )}
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.75 }}>
                <Rating
                  value={row?.rating || 0}
                  readOnly
                  size="small"
                  sx={{
                    '& .MuiRating-iconFilled': { color: '#FFAB00' },
                    '& .MuiRating-iconEmpty': { color: '#C4CDD5' },
                  }}
                />
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  {row?.rating || 0}/5
                </Typography>
                {row?.createdAt && (
                  <Typography variant="caption" color="text.disabled">
                    &middot; {fToNow(row.createdAt)}
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>

        {/* Feedback */}
        <Box sx={{ px: 3, py: 2 }}>
          <Box sx={{ bgcolor: '#F4F6F8', borderRadius: 2, px: 2.5, py: 2 }}>
            {row?.feedback ? (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#221f20' }}>
                {row.feedback}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                No feedback provided
              </Typography>
            )}
          </Box>
        </Box>

        {/* Device Info */}
        {(row?.deviceType || row?.os || row?.browser) && (() => {
          const dConfig = DEVICE_CONFIG[row.deviceType] || DEVICE_CONFIG.desktop;
          const deviceLabel = row.deviceType?.charAt(0).toUpperCase() + row.deviceType?.slice(1);
          const deviceSub = [row.deviceVendor, row.deviceModel].filter(Boolean).join(' ');

          const tiles = [
            row.deviceType && {
              icon: dConfig.icon,
              iconColor: dConfig.color,
              label: 'Device',
              value: deviceLabel,
              sub: deviceSub,
            },
            row.os && {
              icon: getOsIcon(row.os),
              iconColor: '#636366',
              label: 'OS',
              value: shortName(row.os),
              sub: row.os.replace(shortName(row.os), '').trim() || null,
            },
            row.browser && {
              icon: getBrowserIcon(row.browser),
              iconColor: '#636366',
              label: 'Browser',
              value: shortName(row.browser),
              sub: row.browser.replace(shortName(row.browser), '').trim() || null,
            },
          ].filter(Boolean);

          return (
            <Box sx={{ px: 3, py: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <Iconify icon={dConfig.icon} sx={{ color: '#1340FF' }} />
                <Typography variant="subtitle2">Device Info</Typography>
              </Stack>
              <Stack
                direction="row"
                spacing={0}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {tiles.map((tile, i) => (
                  <Box
                    key={tile.label}
                    sx={{
                      flex: 1,
                      px: 1.5,
                      py: 1.5,
                      textAlign: 'center',
                      bgcolor: '#FAFBFC',
                      ...(i < tiles.length - 1 && {
                        borderRight: '1px solid',
                        borderColor: 'divider',
                      }),
                    }}
                  >
                    <Iconify icon={tile.icon} width={26} sx={{ color: tile.iconColor, mb: 0.75 }} />
                    <Typography
                      sx={{
                        display: 'block',
                        color: 'text.disabled',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        mb: 0.25,
                      }}
                    >
                      {tile.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ display: 'block', color: '#221f20', lineHeight: 1.3 }}>
                      {tile.value}
                    </Typography>
                    {tile.sub && (
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: 11, mt: 0.25 }}>
                        {tile.sub}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          );
        })()}

        <Divider />

        {/* Social Stats — creators only */}
        {hasSocialStats && (
          <>
            <Box sx={{ px: 3, py: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <Iconify icon="mdi:chart-bar" sx={{ color: '#1340FF' }} />
                <Typography variant="subtitle2">Social Media</Typography>
              </Stack>
              <Stack spacing={1.5}>
                {igHandle && (
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Iconify icon="mdi:instagram" width={20} sx={{ color: '#E4405F' }} />
                    <Typography variant="body2" fontWeight={600} sx={{ minWidth: 80 }} noWrap>
                      @{igHandle}
                    </Typography>
                    {igFollowers != null && (
                      <Typography variant="caption" color="text.secondary">
                        {formatFollowerCount(igFollowers)} followers
                      </Typography>
                    )}
                    {igEngagement != null && (
                      <Typography variant="caption" color="text.secondary">
                        {Number(igEngagement).toFixed(1)}%
                      </Typography>
                    )}
                  </Stack>
                )}
                {ttHandle && (
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Iconify icon="ic:baseline-tiktok" width={20} sx={{ color: '#000000' }} />
                    <Typography variant="body2" fontWeight={600} sx={{ minWidth: 80 }} noWrap>
                      @{ttHandle}
                    </Typography>
                    {ttFollowers != null && (
                      <Typography variant="caption" color="text.secondary">
                        {formatFollowerCount(ttFollowers)} followers
                      </Typography>
                    )}
                    {ttEngagement != null && (
                      <Typography variant="caption" color="text.secondary">
                        {Number(ttEngagement).toFixed(1)}%
                      </Typography>
                    )}
                  </Stack>
                )}
              </Stack>
            </Box>
            <Divider />
          </>
        )}

        {/* Campaign History */}
        {hasCampaigns && (
          <Box sx={{ px: 3, py: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Iconify icon="mdi:briefcase-outline" sx={{ color: '#1340FF' }} />
              <Typography variant="subtitle2">{isCreator ? 'Campaign History' : 'Campaigns'}</Typography>
            </Stack>
            <Stack spacing={0.5}>
              {campaigns.map((item) => {
                const campaign = isCreator ? item.campaign : item;
                const thumbnail = Array.isArray(campaign?.campaignBrief?.images)
                  ? campaign.campaignBrief.images[0]
                  : null;

                return (
                  <Stack
                    key={isCreator ? item.id : campaign.id}
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    onClick={() => router.push(paths.dashboard.campaign.adminCampaignDetail(campaign.id))}
                    sx={{
                      py: 1,
                      px: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#F4F6F8' },
                    }}
                  >
                    {thumbnail ? (
                      <Box
                        component="img"
                        src={thumbnail}
                        alt={campaign?.name}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          bgcolor: '#F4F6F8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Iconify icon="mdi:image-outline" width={20} sx={{ color: 'text.disabled' }} />
                      </Box>
                    )}
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>
                        {campaign?.name || '-'}
                      </Typography>
                      {campaign?.brand?.name && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {campaign.brand.name}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={formatCampaignStatus(campaign?.status)}
                      size="small"
                      sx={{
                        borderRadius: 0.8,
                        border: `1px solid ${getCampaignChipColor(campaign?.status)}`,
                        boxShadow: `0px -2px 0px 0px ${getCampaignChipColor(campaign?.status)} inset`,
                        backgroundColor: '#FFFFFF',
                        color: getCampaignChipColor(campaign?.status),
                        fontWeight: 600,
                        fontSize: 11,
                        height: 24,
                        '&:hover': { backgroundColor: '#FFFFFF' },
                      }}
                    />
                  </Stack>
                );
              })}
            </Stack>
            {totalCampaigns > 3 && (
              <Typography
                variant="caption"
                onClick={() =>
                  isCreator
                    ? router.push(paths.dashboard.creator.profile(row.user.id))
                    : router.push(paths.dashboard.company.companyEdit(client.companyId))
                }
                sx={{
                  mt: 1.5,
                  display: 'inline-block',
                  color: '#1340FF',
                  cursor: 'pointer',
                  fontWeight: 600,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                View all on profile &rarr;
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Sticky Footer */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          p: 2.5,
          px: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          {hasActionButton && (
            <Button
              variant="contained"
              onClick={handleViewProfile}
              endIcon={<Iconify icon="eva:diagonal-arrow-right-up-fill" width={18} />}
              sx={{
                bgcolor: '#1340FF',
                borderBottom: '3px solid #0c2aa6 inset',
                '&:hover': { bgcolor: '#0c2aa6' },
              }}
            >
              {isCreator ? 'View Creator Profile' : 'View Client Profile'}
            </Button>
          )}
          <Stack direction="row" spacing={0.5} sx={{ ml: 'auto' }}>
            <IconButton
              onClick={handlePrev}
              disabled={!hasPrev}
              sx={{
                border: '1px solid',
                borderColor: hasPrev ? '#E7E7E7' : 'action.disabledBackground',
                borderRadius: 1,
              }}
            >
              <Iconify icon="eva:arrow-back-fill" width={18} />
            </IconButton>
            <IconButton
              onClick={handleNext}
              disabled={!hasNext}
              sx={{
                border: '1px solid',
                borderColor: hasNext ? '#E7E7E7' : 'action.disabledBackground',
                borderRadius: 1,
              }}
            >
              <Iconify icon="eva:arrow-forward-fill" width={18} />
            </IconButton>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}

FeedbackDrawer.propTypes = {
  row: PropTypes.object,
  rows: PropTypes.array,
  onClose: PropTypes.func.isRequired,
  onNavigate: PropTypes.func,
};
