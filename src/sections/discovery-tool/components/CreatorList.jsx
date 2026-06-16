import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import PropTypes from 'prop-types';
import { saveAs } from 'file-saver';
import { useSnackbar } from 'notistack';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Stack, Button, Divider, Skeleton, Typography, CircularProgress } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import { formatNumber } from 'src/utils/socialMetricsCalculator';
import { createSocialProfileUrl } from 'src/utils/media-kit-utils';

import { useMainContext } from 'src/layouts/dashboard/hooks/dsahboard-context';

import Iconify from 'src/components/iconify';

import CreatorCard from './CreatorCard';
import CreatorCompareDialog from './CreatorCompareDialog';
import {
  getPlatformHandle,
  resolvePlatformData,
  formatEngagementRate,
  resolveCreatorRating,
} from './creator-helpers';

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const CreatorCardSkeleton = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      minHeight: { xs: 350, lg: 404, xl: 430 },
      p: 2.25,
      gap: 1.75,
      bgcolor: '#F5F5F5',
      borderRadius: '20px',
    }}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Skeleton variant="circular" width={42} height={42} />
        <Stack>
          <Skeleton width={92} height={20} />
          <Skeleton width={72} height={17} />
        </Stack>
      </Stack>
      <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: 1 }} />
    </Stack>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
      <Skeleton width={148} height={43} />
      <Skeleton width={164} height={43} />
    </Stack>
    <Skeleton width="100%" height={18} />
    <Stack direction="row" spacing={1.25}>
      {[1, 2, 3].map((i) => (
        <Skeleton
          key={i}
          variant="rounded"
          width="32%"
          height={{ xs: 145, lg: 190, xl: 214 }}
          sx={{ borderRadius: 1 }}
        />
      ))}
    </Stack>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Stack direction="row" spacing={0.5}>
        <Skeleton width={58} height={28} variant="rounded" />
        <Skeleton width={62} height={28} variant="rounded" />
      </Stack>
      <Skeleton width={96} height={28} variant="rounded" />
    </Stack>
  </Box>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = () => (
  <Box
    sx={{
      textAlign: 'center',
      py: 8,
      px: 3,
    }}
  >
    <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
      No creators found
    </Typography>
    <Typography variant="body2" sx={{ color: 'text.disabled' }}>
      Try adjusting your filters to see more results.
    </Typography>
  </Box>
);

const BookmarkedEmptyState = () => (
  <Box
    sx={{
      textAlign: 'center',
      py: 8,
      px: 3,
    }}
  >
    <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
      No bookmarked creators
    </Typography>
    <Typography variant="body2" sx={{ color: 'text.disabled' }}>
      Bookmark creators from the cards to see them here.
    </Typography>
  </Box>
);

const EXPORT_COLUMNS = [
  { header: 'Creator Name', key: 'name', width: 24 },
  { header: 'Platform', key: 'platform', width: 14 },
  { header: 'Handle', key: 'handle', width: 22 },
  { header: 'Profile URL', key: 'profileUrl', width: 36 },
  { header: 'Cult Rating', key: 'creatorRating', width: 16 },
  { header: 'Followers', key: 'followers', width: 14 },
  { header: 'Engagement Rate', key: 'engagementRate', width: 18 },
  { header: 'Bio', key: 'bio', width: 48 },
  { header: 'Interests', key: 'interests', width: 36 },
  { header: 'Languages', key: 'languages', width: 28 },
];

const getCreatorExportRow = (creator) => {
  const platformData = resolvePlatformData(creator);
  const platform = platformData.platform || '';
  const handle = getPlatformHandle(creator, platform) || '';
  const profileUrl = handle && platform ? createSocialProfileUrl(handle, platform) : '';
  const bio =
    platform === 'tiktok'
      ? creator.tiktok?.biography || creator.about || ''
      : creator.instagram?.biography || creator.about || '';

  return {
    name: creator.name || '',
    platform: platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : '',
    handle,
    profileUrl,
    creatorRating: resolveCreatorRating(creator).toFixed(1),
    followers: formatNumber(platformData.followers || 0),
    engagementRate: formatEngagementRate(platformData.engagementRate || 0),
    bio: bio || '',
    interests: (creator.interests || []).join(', '),
    languages: (Array.isArray(creator.languages) ? creator.languages : []).filter(Boolean).join(', '),
  };
};

const downloadCreatorsWorkbook = async (creatorRows, filePrefix = 'Bookmarked_Creators') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Creators');

  worksheet.columns = EXPORT_COLUMNS;
  creatorRows.forEach(({ creator }) => worksheet.addRow(getCreatorExportRow(creator)));

  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'top', wrapText: true };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${filePrefix}_${dayjs().format('DD-MMM-YYYY')}.xlsx`);
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CreatorList = ({
  creators,
  isLoading,
  isLoadingMore,
  isError,
  isReachingEnd,
  pagination,
  sortByFollowers,
  bookmarkedCreators,
  isLoadingBookmarks,
  onToggleFollowersSort,
  onLoadMore,
  selectedIds,
  onSelect,
  onInviteOne,
  onOpenDetails,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const { mainRef } = useMainContext();
  const lgUp = useResponsive('up', 'lg');
  const mdUp = useResponsive('up', 'md');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelectedIds, setCompareSelectedIds] = useState([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleCompareSelect = useCallback((rowKey) => {
    setCompareSelectedIds((prev) => {
      if (prev.includes(rowKey)) return prev.filter((id) => id !== rowKey);
      if (prev.length < 2) return [...prev, rowKey];
      return [prev[1], rowKey]; // drop oldest, keep latest pair
    });
  }, []);

  const handleEnterCompare = useCallback(() => setCompareMode(true), []);

  const handleCancelCompare = useCallback(() => {
    setCompareMode(false);
    setCompareSelectedIds([]);
  }, []);

  const handleCloseCompareModal = useCallback(() => {
    setCompareModalOpen(false);
    setCompareMode(false);
    setCompareSelectedIds([]);
  }, []);

  const handleToggleBookmarkedOnly = useCallback(() => {
    setShowBookmarkedOnly((prev) => {
      const next = !prev;
      if (next) {
        setCompareMode(false);
        setCompareSelectedIds([]);
        setCompareModalOpen(false);
      }
      return next;
    });
  }, []);

  // Auto-open the compare modal once the admin has picked the 2nd creator.
  useEffect(() => {
    if (compareMode && compareSelectedIds.length === 2) {
      setCompareModalOpen(true);
    }
  }, [compareMode, compareSelectedIds]);

  const creatorRows = useMemo(
    () =>
      (creators || []).map((creator, index) => ({
        creator,
        rowKey: creator.rowId || `${creator.userId}-${creator.platform || index}`,
      })),
    [creators]
  );
  const compareCreators = useMemo(
    () =>
      compareSelectedIds
        .map((id) => creatorRows.find((row) => row.rowKey === id)?.creator)
        .filter(Boolean),
    [compareSelectedIds, creatorRows]
  );
  const bookmarkedRows = useMemo(
    () =>
      (bookmarkedCreators || []).map((creator, index) => ({
        creator,
        rowKey: creator.rowId || `${creator.userId}-${creator.platform || index}`,
      })),
    [bookmarkedCreators]
  );
  const visibleCreatorRows = useMemo(
    () => (showBookmarkedOnly ? bookmarkedRows : creatorRows),
    [bookmarkedRows, creatorRows, showBookmarkedOnly]
  );
  const handleExportBookmarkedCreators = useCallback(async () => {
    if (!bookmarkedRows.length) {
      enqueueSnackbar('No bookmarked creators to export', { variant: 'warning' });
      return;
    }

    try {
      setIsExporting(true);
      await downloadCreatorsWorkbook(bookmarkedRows, 'Bookmarked_Creators');
      enqueueSnackbar(
        `Exported ${bookmarkedRows.length} creator${bookmarkedRows.length === 1 ? '' : 's'}`,
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Failed to export bookmarked creators:', error);
      enqueueSnackbar('Failed to export creators', { variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  }, [bookmarkedRows, enqueueSnackbar]);

  // Compute viewedCount and total for results info
  const total = showBookmarkedOnly ? bookmarkedRows.length : (pagination?.total ?? creators.length);
  const viewedCount = creators.length;
  const displayedCount = showBookmarkedOnly ? visibleCreatorRows.length : viewedCount;
  let primaryActionLabel = 'Compare Creators';
  let handlePrimaryAction = handleEnterCompare;

  if (showBookmarkedOnly) {
    primaryActionLabel = 'Export Results';
    handlePrimaryAction = handleExportBookmarkedCreators;
  } else if (compareMode) {
    primaryActionLabel = 'Select Creators';
    handlePrimaryAction = undefined;
  }

  const isPrimaryActionDisabled = showBookmarkedOnly ? isExporting : compareMode;
  // eslint-disable-next-line no-nested-ternary
  const columns = lgUp ? 3 : mdUp ? 2 : 1;
  const rowCount = Math.ceil(visibleCreatorRows.length / columns);
  const virtualRowCount = showBookmarkedOnly ? rowCount : rowCount + (isReachingEnd ? 0 : 1);

  const rowVirtualizer = useVirtualizer({
    count: virtualRowCount,
    getScrollElement: () => mainRef?.current,
    estimateSize: () => (lgUp ? 454 : 390),
    overscan: 2,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (showBookmarkedOnly || isLoadingMore || isReachingEnd || !onLoadMore) return;

    const [lastItem] = [...virtualRows].reverse();
    if (!lastItem) return;

    if (lastItem.index >= rowCount - 2) {
      onLoadMore();
    }
  }, [isLoadingMore, isReachingEnd, onLoadMore, rowCount, showBookmarkedOnly, virtualRows]);

  if (isError) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography sx={{ color: 'error.main', fontSize: 15 }}>
          Failed to fetch creators. Please try again.
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
          },
          justifyContent: 'stretch',
          gap: 2,
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CreatorCardSkeleton key={i} />
        ))}
      </Box>
    );
  }

  if ((!creators || creators.length === 0) && !showBookmarkedOnly) {
    return <EmptyState />;
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Button
        onClick={onToggleFollowersSort}
        variant="text"
        disableRipple
        sx={{
          color: sortByFollowers ? '#1340FF' : '#231F20',
          fontWeight: 400,
          fontSize: 14,
          p: 0,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'transparent',
          },
        }}
        endIcon={<Iconify icon="fluent:arrow-sort-down-lines-24-regular" width={18} ml={-0.5} />}
      >
        Total Followers
      </Button>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          mb: 1.5,
          gap: 2,
        }}
      >
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mr: 2 }}>
          {`${displayedCount} of ${total} creator${total === 1 ? '' : 's'}`}
        </Typography>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'nowrap' }}>
            <Button
              onClick={handleToggleBookmarkedOnly}
              aria-pressed={showBookmarkedOnly}
              startIcon={<Iconify icon="material-symbols:bookmark-outline" width={16} />}
              sx={{
                width: 160,
                height: 34,
                minWidth: 160,
                px: 2,
                py: 1,
                gap: 1,
                color: showBookmarkedOnly ? '#F5F5F5' : '#231F20',
                bgcolor: showBookmarkedOnly ? '#231F20' : '#F5F5F5',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 14,
                lineHeight: '18px',
                borderRadius: '100px',
                boxShadow: 'none',
                '& .MuiButton-startIcon': {
                  m: 0,
                },
                '&:hover': {
                  bgcolor: showBookmarkedOnly ? '#231F20' : '#F5F5F5',
                  boxShadow: 'none',
                },
                '&.Mui-disabled': {
                  color: 'rgba(35, 31, 32, 0.45)',
                  bgcolor: '#F5F5F5',
                  boxShadow: 'none',
                },
              }}
            >
              <Box component="span">Bookmarked</Box>
              <Box
                component="span"
                sx={{
                  width: 21,
                  height: 16,
                  bgcolor: '#FFFFFF',
                  borderRadius: 1,
                  color: '#231F20',
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedIds?.length || 0}
              </Box>
            </Button>
            <Stack direction="row" alignItems="center" sx={{ flexWrap: 'nowrap' }}>
              <Button
                onClick={handlePrimaryAction}
                disabled={isPrimaryActionDisabled}
                startIcon={
                  showBookmarkedOnly ? <Iconify icon="material-symbols:open-in-new" width={18} /> : null
                }
                sx={{
                  width: 'auto',
                  height: 38,
                  minWidth: 140,
                  px: 1,
                  pt: 1.25,
                  pb: 1.625,
                  gap: 0.75,
                  color: '#231F20',
                  bgcolor: '#FFFFFF',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: 14,
                  lineHeight: '18px',
                  whiteSpace: 'nowrap',
                  borderRadius: 1,
                  border: '1px solid #E8E8E8',
                  boxShadow: 'inset 0px -3px 0px #E7E7E7',
                  '& .MuiButton-startIcon': {
                    m: showBookmarkedOnly ? '0 4px 0 0' : 0,
                  },
                  '&:hover': {
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E8E8E8',
                    boxShadow: 'inset 0px -3px 0px #E7E7E7',
                  },
                  '&.Mui-disabled': {
                    color: 'rgba(35, 31, 32, 0.45)',
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E8E8E8',
                    boxShadow: 'inset 0px -3px 0px #E7E7E7',
                  },
                }}
              >
                {primaryActionLabel}
              </Button>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  ml: compareMode ? 1.5 : 0,
                  maxWidth: compareMode ? 120 : 0,
                  opacity: compareMode ? 1 : 0,
                  transition: 'margin-left 260ms ease, max-width 260ms ease, opacity 200ms ease',
                }}
              >
                <Divider orientation="vertical" sx={{ height: 24, borderColor: '#E0E0E0' }} />
                <Button
                  variant="text"
                  disableRipple
                  onClick={handleCancelCompare}
                  sx={{
                    minWidth: 'auto',
                    px: 0,
                    color: '#1340FF',
                    fontWeight: 600,
                    fontSize: 14,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    '&:hover': { bgcolor: 'transparent' },
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* Creator cards */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height:
            visibleCreatorRows.length === 0 && showBookmarkedOnly
              ? 'auto'
              : rowVirtualizer.getTotalSize(),
        }}
      >
        {visibleCreatorRows.length === 0 && showBookmarkedOnly ? (
          <Box>
            {isLoadingBookmarks ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <BookmarkedEmptyState />
            )}
          </Box>
        ) : null}
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowItems = visibleCreatorRows.slice(startIndex, startIndex + columns);
          const isLoaderRow = rowItems.length === 0;

          return (
            <Box
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                pb: 2,
              }}
            >
              {isLoaderRow ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  {isLoadingMore ? <CircularProgress size={24} /> : null}
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'minmax(0, 1fr)',
                      md: 'repeat(2, minmax(0, 1fr))',
                      lg: 'repeat(3, minmax(0, 1fr))',
                    },
                    justifyContent: 'stretch',
                    gap: 2,
                  }}
                >
                  {rowItems.map(({ creator, rowKey }) => (
                    <CreatorCard
                      key={rowKey}
                      creator={creator}
                      selected={selectedIds?.includes(rowKey)}
                      onSelect={onSelect}
                      onInviteOne={onInviteOne}
                      onOpenDetails={onOpenDetails}
                      rowKey={rowKey}
                      compareMode={compareMode}
                      compareSelected={compareSelectedIds.includes(rowKey)}
                      onCompareSelect={handleCompareSelect}
                    />
                  ))}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {!showBookmarkedOnly && isReachingEnd && visibleCreatorRows.length > 0 ? (
        <Typography sx={{ mt: 1, mb: 2, textAlign: 'center', fontSize: 13, color: 'text.secondary' }}>
          All creators loaded
        </Typography>
      ) : null}

      <CreatorCompareDialog
        open={compareModalOpen}
        onClose={handleCloseCompareModal}
        creators={compareCreators}
        rowKeys={compareSelectedIds}
        selectedIds={selectedIds}
        onToggleBookmark={onSelect}
        onInvite={onInviteOne}
      />
    </Box>
  );
};

CreatorList.propTypes = {
  creators: PropTypes.array,
  isLoading: PropTypes.bool,
  isLoadingMore: PropTypes.bool,
  isError: PropTypes.any,
  isReachingEnd: PropTypes.bool,
  pagination: PropTypes.shape({
    page: PropTypes.number,
    limit: PropTypes.number,
    total: PropTypes.number,
  }),
  sortByFollowers: PropTypes.bool,
  bookmarkedCreators: PropTypes.array,
  isLoadingBookmarks: PropTypes.bool,
  onToggleFollowersSort: PropTypes.func,
  onLoadMore: PropTypes.func,
  selectedIds: PropTypes.arrayOf(PropTypes.string),
  onSelect: PropTypes.func,
  onInviteOne: PropTypes.func,
  onOpenDetails: PropTypes.func,
};

CreatorList.defaultProps = {
  creators: [],
  isLoading: false,
  isLoadingMore: false,
  isError: null,
  isReachingEnd: true,
  pagination: null,
  sortByFollowers: false,
  bookmarkedCreators: [],
  isLoadingBookmarks: false,
  onToggleFollowersSort: undefined,
  onLoadMore: undefined,
  selectedIds: [],
  onSelect: undefined,
  onInviteOne: undefined,
  onOpenDetails: undefined,
};

export default CreatorList;
