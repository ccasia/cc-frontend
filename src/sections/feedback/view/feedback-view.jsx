import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';
import { endOfDay } from 'date-fns';

import {
  Box,
  Card,
  Stack,
  Table,
  Rating,
  Avatar,
  Drawer,
  Divider,
  Tooltip,
  TableRow,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  useMediaQuery,
  LinearProgress,
  TableContainer,
  InputAdornment,
  TablePagination,
  CircularProgress,
} from '@mui/material';

import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { fDateTime, fToNow } from 'src/utils/format-time';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content/empty-content';

import { useGetNpsFeedback, useGetNpsFeedbackStats } from 'src/hooks/use-get-nps-feedback';

import DateFilterSelect from '../components/date-filter-select';

// ----------------------------------------------------------------------

const COLUMNS = [
  { id: 'name', label: 'Client', align: 'left', sortable: false },
  { id: 'email', label: 'Email', align: 'left', sortable: false },
  { id: 'rating', label: 'Rating', align: 'left' },
  { id: 'feedback', label: 'Feedback', align: 'left', sortable: false },
  { id: 'createdAt', label: 'Date', align: 'left' },
  { id: 'action', label: '', align: 'center', sortable: false },
];

// ----------------------------------------------------------------------

export default function FeedbackView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedRow, setSelectedRow] = useState(null);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);

  const dateParams = {
    ...(filterStartDate && { startDate: filterStartDate.toISOString() }),
    ...(filterEndDate && { endDate: endOfDay(filterEndDate).toISOString() }),
  };

  const { feedback, total, isLoading } = useGetNpsFeedback({
    page: page + 1,
    limit: rowsPerPage,
    ...(search && { search }),
    sortBy,
    sortOrder,
    ...dateParams,
  });

  const { stats, isLoading: statsLoading } = useGetNpsFeedbackStats(dateParams);

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
    <Container maxWidth="lg">
      <CustomBreadcrumbs
        heading="Feedback"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Feedback' },
        ]}
        sx={{ mb: 3 }}
      />

      {/* Stats + Search */}
      <Box sx={{ mb: 2, borderRadius: 2, bgcolor: '#F4F6F8', px: 1.5, py: 1.5 }}>
        {/* Top bar: stats pills + toggle + search — all on one line */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Compact pills (visible when collapsed) */}
          {!statsLoading && stats && (
            <AnimatePresence mode="wait">
              {!statsExpanded && (
                <m.div
                  key="pills"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  style={{ display: 'flex', alignItems: 'stretch', gap: 8, flex: 1, minWidth: 0 }}
                >
                  <Box sx={{ bgcolor: 'white', borderRadius: 1.5, px: 1.5, py: 0.75, flexShrink: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Iconify icon="mdi:message-reply-text-outline" width={16} sx={{ color: '#1340FF' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{stats.totalResponses}</Typography>
                      <Typography variant="caption" color="text.secondary">responses</Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ bgcolor: 'white', borderRadius: 1.5, px: 1.5, py: 0.75, flexShrink: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Rating value={stats.averageRating} precision={0.1} size="small" readOnly sx={{ '& .MuiRating-iconFilled': { color: '#FFAB00' } }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{stats.averageRating}</Typography>
                      <Typography variant="caption" color="text.secondary">avg</Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ bgcolor: 'white', borderRadius: 1.5, px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 1, minWidth: 0, overflow: 'hidden' }}>
                    {[...stats.distribution].reverse().map((item, idx, arr) => {
                      const pct = stats.totalResponses > 0 ? (item.count / stats.totalResponses) * 100 : 0;
                      return (
                        <React.Fragment key={item.rating}>
                          <Stack direction="row" alignItems="center" spacing={0.25} sx={{ flexShrink: 0 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 11 }}>{item.rating}</Typography>
                            <Iconify icon="mdi:star" width={11} sx={{ color: item.count > 0 ? '#FFAB00' : '#DFE3E8' }} />
                            <Box sx={{ width: 24, height: 5, borderRadius: 3, bgcolor: '#EBEBEB', overflow: 'hidden' }}>
                              {pct > 0 && <Box sx={{ width: `${pct}%`, minWidth: 3, height: '100%', borderRadius: 3, bgcolor: '#FFAB00' }} />}
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11, color: item.count > 0 ? 'text.primary' : 'text.disabled' }}>{item.count}</Typography>
                          </Stack>
                          {idx < arr.length - 1 && <Divider orientation="vertical" flexItem sx={{ borderColor: '#E0E0E0', my: 0.5 }} />}
                        </React.Fragment>
                      );
                    })}
                  </Box>
                </m.div>
              )}
            </AnimatePresence>
          )}

          <DateFilterSelect
            value={dateFilter}
            startDate={filterStartDate}
            endDate={filterEndDate}
            onChange={handleDateFilterChange}
          />

          {/* Spacer when expanded (pills hidden) */}
          {statsExpanded && <Box sx={{ flex: 1 }} />}

          {/* Toggle + Search */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0, ml: 'auto' }}>
            {!statsLoading && stats && (
              <Tooltip title={statsExpanded ? 'Collapse stats' : 'Expand stats'} arrow>
                <IconButton
                  size="small"
                  onClick={() => setStatsExpanded((prev) => !prev)}
                  sx={{
                    bgcolor: 'white',
                    width: 32,
                    height: 32,
                    transition: 'transform 0.3s ease',
                    transform: statsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    '&:hover': { bgcolor: 'white' },
                  }}
                >
                  <Iconify icon="eva:arrow-ios-downward-fill" width={18} sx={{ color: 'text.secondary' }} />
                </IconButton>
              </Tooltip>
            )}
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
              sx={{ width: { xs: '100%', sm: 240 }, bgcolor: 'white', borderRadius: 1 }}
            />
          </Stack>
        </Stack>

        {/* Expanded detailed cards (below the top bar) */}
        {!statsLoading && stats && (
          <AnimatePresence mode="wait">
            {statsExpanded && (
              <m.div
                key="expanded"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  {/* Total Responses */}
                  <m.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    style={{ flex: 1 }}
                  >
                    <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 2, height: '100%' }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: '#EEF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Iconify icon="mdi:message-reply-text-outline" width={18} sx={{ color: '#1340FF' }} />
                        </Box>
                        <Typography variant="subtitle2" color="text.secondary">Total Responses</Typography>
                      </Stack>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>{stats.totalResponses}</Typography>
                      <Typography variant="caption" color="text.disabled">All time feedback collected</Typography>
                    </Box>
                  </m.div>

                  {/* Average Rating */}
                  <m.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    style={{ flex: 1 }}
                  >
                    <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 2, height: '100%' }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: '#FFF8E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Iconify icon="mdi:star-outline" width={18} sx={{ color: '#FFAB00' }} />
                        </Box>
                        <Typography variant="subtitle2" color="text.secondary">Average Rating</Typography>
                      </Stack>
                      <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 0.5 }}>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>{stats.averageRating}</Typography>
                        <Typography variant="body2" color="text.secondary">/ 5</Typography>
                      </Stack>
                      <Rating
                        value={stats.averageRating}
                        precision={0.1}
                        readOnly
                        sx={{ '& .MuiRating-iconFilled': { color: '#FFAB00' }, '& .MuiRating-iconEmpty': { color: '#C4CDD5' } }}
                      />
                    </Box>
                  </m.div>

                  {/* Distribution */}
                  <m.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    style={{ flex: 1.5 }}
                  >
                    <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 2, height: '100%' }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: '#FFF8E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Iconify icon="mdi:chart-bar" width={18} sx={{ color: '#FFAB00' }} />
                        </Box>
                        <Typography variant="subtitle2" color="text.secondary">Rating Distribution</Typography>
                      </Stack>
                      <Stack spacing={0.75}>
                        {[...stats.distribution].reverse().map((item) => {
                          const pct = stats.totalResponses > 0 ? (item.count / stats.totalResponses) * 100 : 0;
                          return (
                            <Stack key={item.rating} direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body2" sx={{ minWidth: 12, textAlign: 'right', fontWeight: 600 }}>{item.rating}</Typography>
                              <Iconify icon="mdi:star" width={14} sx={{ color: item.count > 0 ? '#FFAB00' : '#DFE3E8' }} />
                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: '#EBEBEB', '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: '#FFAB00' } }}
                              />
                              <Typography variant="body2" sx={{ minWidth: 28, textAlign: 'right', fontWeight: 600 }}>{item.count}</Typography>
                              <Typography variant="caption" color="text.disabled" sx={{ minWidth: 32 }}>{pct > 0 ? `${Math.round(pct)}%` : ''}</Typography>
                            </Stack>
                          );
                        })}
                      </Stack>
                    </Box>
                  </m.div>
                </Stack>
              </m.div>
            )}
          </AnimatePresence>
        )}
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
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && feedback.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
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

      <FeedbackDrawer row={selectedRow} onClose={() => setSelectedRow(null)} />
    </Container>
  );
}

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
        {onSort && sortColumn === column && (
          <Iconify
            icon={sortDirection === 'asc' ? 'eva:arrow-upward-fill' : 'eva:arrow-downward-fill'}
            width={16}
            sx={{ color: '#1340FF' }}
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

function FeedbackRow({ row, onRowClick }) {
  return (
    <TableRow hover onClick={() => onRowClick(row)} sx={{ cursor: 'pointer' }}>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar src={row.user?.photoURL} alt={row.user?.name} sx={{ width: 36, height: 36 }} />
          <Typography variant="body2" fontWeight={600}>
            {row.user?.name || '-'}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.user?.email || '-'}
        </Typography>
      </TableCell>

      <TableCell>
        <Rating value={row.rating} size="small" readOnly />
      </TableCell>

      <TableCell sx={{ maxWidth: 300 }}>
        {row.feedback ? (
          <Tooltip title={row.feedback} arrow placement="top">
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
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.disabled">-</Typography>
        )}
      </TableCell>

      <TableCell>
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
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {row.user?.name || '-'}
            </Typography>
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

      {/* Date */}
      <Typography variant="caption" color="text.disabled">
        {fDateTime(row.createdAt)}
      </Typography>
    </Card>
  );
}

FeedbackCard.propTypes = {
  row: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

function FeedbackDrawer({ row, onClose }) {
  const companyName = row?.user?.client?.company?.name;

  return (
    <Drawer
      open={!!row}
      onClose={onClose}
      anchor="right"
      PaperProps={{
        sx: {
          width: { xs: 1, sm: 370 },
          backgroundColor: '#F4F6F8 !important',
          borderTopLeftRadius: 12,
        },
      }}
    >
      {/* Header — close button right-aligned */}
      <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ py: 2, px: 2.5 }}>
        <IconButton onClick={onClose}>
          <Iconify icon="eva:close-fill" sx={{ height: 24, width: 24 }} />
        </IconButton>
      </Stack>

      {/* User Info Card */}
      <Box
        sx={{
          p: 2.5,
          border: '1px solid #919EAB3D',
          bgcolor: 'white',
          borderRadius: 2,
          mx: 3,
          mb: 3,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            alt={row?.user?.name}
            src={row?.user?.photoURL}
            sx={{ width: 48, height: 48 }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1">{row?.user?.name || '-'}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {row?.user?.email || '-'}
            </Typography>
            {companyName && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {companyName}
              </Typography>
            )}
            <Label variant="soft" color="success" sx={{ mt: 0.5 }}>
              {row?.userType || 'Client'}
            </Label>
          </Box>
        </Stack>
      </Box>

      {/* Rating */}
      <Box sx={{ p: 2.5, border: '1px solid #919EAB3D', bgcolor: 'white', borderRadius: 2, mx: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Iconify icon="mdi:star-outline" sx={{ color: '#1340FF' }} />
          <Typography variant="subtitle2">Rating</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Rating
            value={row?.rating || 0}
            readOnly
            size="medium"
            sx={{
              '& .MuiRating-iconFilled': { color: '#FFAB00' },
              '& .MuiRating-iconEmpty': { color: '#C4CDD5' },
            }}
          />
          <Typography variant="body1" fontWeight={600}>
            {row?.rating || 0}/5
          </Typography>
        </Stack>
      </Box>

      {/* Feedback */}
      <Box sx={{ p: 2.5, border: '1px solid #919EAB3D', bgcolor: 'white', borderRadius: 2, mx: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Iconify icon="mdi:message-reply-text-outline" sx={{ color: '#1340FF' }} />
          <Typography variant="subtitle2">Feedback</Typography>
        </Stack>
        {row?.feedback ? (
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {row.feedback}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.disabled">
            No feedback provided
          </Typography>
        )}
      </Box>

      {/* Date */}
      <Box sx={{ p: 2.5, border: '1px solid #919EAB3D', bgcolor: 'white', borderRadius: 2, mx: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Iconify icon="material-symbols:calendar-month-outline" sx={{ color: '#1340FF' }} />
          <Typography variant="subtitle2">Date</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {row?.createdAt ? fDateTime(row.createdAt) : '-'}
        </Typography>
        {row?.createdAt && (
          <Typography variant="caption" color="text.disabled">
            {fToNow(row.createdAt)}
          </Typography>
        )}
      </Box>
    </Drawer>
  );
}

FeedbackDrawer.propTypes = {
  row: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
