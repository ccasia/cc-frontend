import PropTypes from 'prop-types';

import { Box, Stack, Button, Divider, Skeleton, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import CreatorCard from './CreatorCard';

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const CreatorCardSkeleton = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      p: 1,
    }}
  >
    {/* Left */}
    <Box
      sx={{
        width: 188,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderColor: 'divider',
      }}
    >
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
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
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

const CreatorList = ({
  creators,
  isLoading,
  isError,
  pagination,
  selectedIds,
  onSelect,
  onCompare,
}) => {
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

  // Compute viewedCount and total for results info
  const total = pagination?.total ?? creators.length;
  const viewedCount = pagination?.limit && pagination?.page
    ? Math.min(pagination.page * pagination.limit, total)
    : creators.length;

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 1.5, gap: 2 }}>
        <Typography sx={{ fontSize: 14, color: 'text.secondary', mr: 2 }}>
          {`${viewedCount} of ${total} creator${total === 1 ? '' : 's'}`}
        </Typography>
        <Button
          onClick={() => onCompare?.(selectedIds)}
          disabled={selectedIds?.length !== 2}
          sx={{
            color: '#231F20',
            bgcolor: '#FFFFFF',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 14,
            pb: 1,
            borderRadius: 1,
            border: '1px solid #E7E7E7',
            boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.03)',
              border: '1px solid #E7E7E7',
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
            },
            ':disabled': {
              bgcolor: 'rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.05) inset'
            }
          }}
        >
          Compare Creators
        </Button>
      </Box>

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
  onCompare: PropTypes.func,
};

CreatorList.defaultProps = {
  creators: [],
  isLoading: false,
  isError: null,
  pagination: null,
  selectedIds: [],
  onSelect: undefined,
  onCompare: undefined,
};

export default CreatorList;
