import PropTypes from 'prop-types';

import { Box, Stack, Divider, Skeleton, Typography } from '@mui/material';

import CreatorCard from './CreatorCard';

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const CreatorCardSkeleton = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      p: 1
    }}
  >
    {/* Left */}
    <Box sx={{ width: 188, display: 'flex', flexDirection: 'column', alignItems: 'center', borderColor: 'divider' }}>
      <Skeleton variant="circular" width={72} height={72} />
      <Skeleton width={100} height={18} sx={{ mt: 1 }} />
      <Skeleton width={80} height={14} sx={{ mt: 0.5 }} />
      <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }}>
        <Skeleton width={50} height={22} variant="rounded" />
        <Skeleton width={50} height={22} variant="rounded" />
        <Skeleton width={50} height={22} variant="rounded" />
      </Stack>
    </Box>

    {/* Middle */}
    <Box sx={{ flex: 1 }}>
      <Stack direction="row" justifyContent={'space-between'} sx={{ mb: 2 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Box key={i} sx={{ textAlign: 'center' }}>
            <Skeleton width={60} height={12} />
            <Skeleton width={50} height={28} sx={{ mt: 0.5, mx: 'auto' }} />
          </Box>
        ))}
      </Stack>
      <Skeleton width="100%" height={14} />
      <Skeleton width="80%" height={14} sx={{ mt: 0.5 }} />
    </Box>

    {/* Right */}
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} variant="rounded" width={132} height={188} sx={{ borderRadius: 1.5 }} />
      ))}
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

// ─── Main Component ───────────────────────────────────────────────────────────

const CreatorList = ({ creators, isLoading, isError, pagination, selectedIds, onSelect }) => {
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
      <Box sx={{ mt: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i}>
            {i > 1 && <Divider />}
            <CreatorCardSkeleton />
          </Box>
        ))}
      </Box>
    );
  }

  if (!creators || creators.length === 0) {
    return <EmptyState />;
  }

  return (
    <Box sx={{ mt: 3 }}>
      {/* Result count */}
      <Typography sx={{ mb: 2, fontSize: 14, color: 'text.secondary' }}>
        Showing {creators.length}
        {pagination ? ` of ${pagination.total} creator${creators.length !== 1 ? 's' : ''}`  : ''}
      </Typography>

      {/* Creator rows */}
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {creators.map((creator, index) => {
          const rowKey = creator.rowId || `${creator.userId}-${creator.platform || index}`;

          return (
          <Box key={rowKey}>
            {index > 0 && <Divider />}
            <CreatorCard
              creator={creator}
              selected={selectedIds?.includes(rowKey)}
              onSelect={onSelect}
            />
          </Box>
          );
        })}
      </Box>
    </Box>
  );
};

CreatorList.propTypes = {
  creators: PropTypes.array,
  isLoading: PropTypes.bool,
  isError: PropTypes.any,
  pagination: PropTypes.shape({
    page: PropTypes.number,
    limit: PropTypes.number,
    total: PropTypes.number,
  }),
  selectedIds: PropTypes.arrayOf(PropTypes.string),
  onSelect: PropTypes.func,
};

CreatorList.defaultProps = {
  creators: [],
  isLoading: false,
  isError: null,
  pagination: null,
  selectedIds: [],
  onSelect: undefined,
};

export default CreatorList;
