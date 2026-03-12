import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import {
  Box,
  Card,
  Chip,
  Link,
  Stack,
  Avatar,
  Button,
  Select,
  MenuItem,
  Container,
  InputBase,
  Pagination,
  Typography,
  CircularProgress,
} from '@mui/material';

import useGetDiscoveryNpcCreators from 'src/hooks/use-get-discovery-npc-creators';

import { formatNumber } from 'src/utils/socialMetricsCalculator';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content/empty-content';

const formatFollowers = (value) => {
  const count = Number(value || 0);
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(count >= 10_000_000 ? 0 : 1)}M`;
  }

  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(count >= 100_000 ? 0 : 1)}K`;
  }

  return String(count);
};

const EmptyProfileSvgIcon = ({ size = '100%' }) => (
  <Box
    component="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    sx={{ width: size, height: size, display: 'block' }}
  >
    {/* Scale 3..21 icon bounds to 0..24 so it occupies the full avatar area. */}
    <g transform="translate(-4 -4) scale(1.3333333333)">
      <path fill="#3b3a3a" fillOpacity="0" d="M3 12a9 9 0 1 1 18 0a9 9 0 0 1-18 0" />
      <circle cx="12" cy="10" r="4" fill="#fff" />
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M18.22 18.246c.06.097.041.22-.04.297A8.97 8.97 0 0 1 12 21a8.97 8.97 0 0 1-6.18-2.457a.24.24 0 0 1-.04-.297C6.942 16.318 9.291 15 12 15s5.057 1.318 6.22 3.246"
        clipRule="evenodd"
      />
    </g>
  </Box>
);

EmptyProfileSvgIcon.propTypes = {
  size: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
};

const DiscoveryToolNpcView = () => {
  const [filters, setFilters] = useState({
    platform: 'all',
    keyword: '',
    followers: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    platform: 'all',
    keyword: '',
    followers: '',
  });
  const [page, setPage] = useState(1);
  const [showResults, setShowResults] = useState(true);
  const [sortByFollowers, setSortByFollowers] = useState(false);

  const normalizedDraftFilters = useMemo(
    () => ({
      platform: filters.platform,
      keyword: filters.keyword.trim(),
      followers: filters.followers,
    }),
    [filters]
  );

  const hasPendingFilterChanges = useMemo(
    () => JSON.stringify(normalizedDraftFilters) !== JSON.stringify(appliedFilters),
    [normalizedDraftFilters, appliedFilters]
  );

  const hasAppliedFilters = useMemo(
    () =>
      appliedFilters.platform !== 'all' ||
      Boolean(appliedFilters.keyword) ||
      Boolean(appliedFilters.followers),
    [appliedFilters]
  );

  const shouldShowResults = showResults || !hasPendingFilterChanges;

  const handleSearch = () => {
    setAppliedFilters(normalizedDraftFilters);
    setPage(1);
    setShowResults(true);
  };

  const handleInputEnter = (event) => {
    if (event.key === 'Enter' && !isPreviewCountLoading && hasPendingFilterChanges) {
      handleSearch();
    }
  };

  const { creators, pagination, isLoading, isError } = useGetDiscoveryNpcCreators({
    platform: appliedFilters.platform,
    keyword: appliedFilters.keyword || undefined,
    followers: appliedFilters.followers === '' ? undefined : appliedFilters.followers,
    page,
    limit: 20,
  });

  const { pagination: previewPagination, isLoading: isPreviewCountLoading } =
    useGetDiscoveryNpcCreators({
      platform: normalizedDraftFilters.platform,
      keyword: normalizedDraftFilters.keyword || undefined,
      followers:
        normalizedDraftFilters.followers === '' ? undefined : normalizedDraftFilters.followers,
      page: 1,
      limit: 20,
    });

  const totalPages = useMemo(() => {
    if (!pagination?.total || !pagination?.limit) return 1;
    return Math.max(1, Math.ceil(pagination.total / pagination.limit));
  }, [pagination]);

  const sortedCreators = useMemo(() => {
    const rows = [...(creators || [])];
    rows.sort((left, right) => {
      if (!sortByFollowers) {
        return String(left?.name || '').localeCompare(String(right?.name || ''));
      }

      const leftFollowers = Number(left?.followers || 0);
      const rightFollowers = Number(right?.followers || 0);

      if (leftFollowers !== rightFollowers) {
        return rightFollowers - leftFollowers;
      }

      return String(left?.name || '').localeCompare(String(right?.name || ''));
    });

    return rows;
  }, [creators, sortByFollowers]);

  const resultCount = previewPagination?.total ?? 0;
  const isButtonLoading = hasPendingFilterChanges && isPreviewCountLoading;
  const isDefaultDisabledState = !hasPendingFilterChanges && !hasAppliedFilters;

  const buttonDisabled = !hasPendingFilterChanges || isPreviewCountLoading;

  const activePills = useMemo(() => {
    const pills = [];

    if (appliedFilters.platform !== 'all') {
      pills.push({
        key: 'platform',
        label: `Platform: ${appliedFilters.platform}`,
        onRemove: () => {
          const next = { ...appliedFilters, platform: 'all' };
          setFilters(next);
          setAppliedFilters(next);
        },
      });
    }

    if (appliedFilters.keyword) {
      pills.push({
        key: 'keyword',
        label: `Keyword: "${appliedFilters.keyword}"`,
        onRemove: () => {
          const next = { ...appliedFilters, keyword: '' };
          setFilters(next);
          setAppliedFilters(next);
        },
      });
    }

    if (appliedFilters.followers) {
      pills.push({
        key: 'followers',
        label: `Followers: ${appliedFilters.followers}+`,
        onRemove: () => {
          const next = { ...appliedFilters, followers: '' };
          setFilters(next);
          setAppliedFilters(next);
        },
      });
    }

    return pills;
  }, [appliedFilters]);

  const clearAllPills = () => {
    const next = { platform: 'all', keyword: '', followers: '' };
    setFilters(next);
    setAppliedFilters(next);
    setPage(1);
  };

  const onPlatformChange = (event) => {
    setFilters((prev) => ({ ...prev, platform: event.target.value }));
    setShowResults(false);
  };

  const onKeywordChange = (event) => {
    setFilters((prev) => ({ ...prev, keyword: event.target.value }));
    setShowResults(false);
  };

  const onFollowersChange = (event) => {
    const numericValue = event.target.value.replace(/[^0-9]/g, '');
    setFilters((prev) => ({ ...prev, followers: numericValue }));
    setShowResults(false);
  };

  const handleToggleFollowersSort = () => {
    setSortByFollowers((prev) => !prev);
  };

  const total = pagination?.total ?? sortedCreators.length;
  const viewedCount =
    pagination?.limit && pagination?.page
      ? Math.min(pagination.page * pagination.limit, total)
      : sortedCreators.length;

  return (
    <Container maxWidth="xl">
      <Typography
        sx={{
          fontFamily: 'Aileron',
          fontSize: { xs: 24, md: 48 },
          fontWeight: 400,
        }}
      >
        Creator Discovery Tool
      </Typography>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        sx={{ mt: 3, alignItems: { xs: 'stretch', md: 'center' } }}
      >
        <Select
          value={filters.platform}
          onChange={onPlatformChange}
          size="medium"
          displayEmpty
          sx={{ minWidth: { xs: '100%', md: 160 }, maxWidth: { xs: '100%', md: 160 } }}
          IconComponent={() => null}
          endAdornment={
            <Iconify icon="line-md:chevron-down" width={40} height={40} color="#231F20" />
          }
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="instagram">Instagram</MenuItem>
          <MenuItem value="tiktok">TikTok</MenuItem>
        </Select>

        <Box
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            py: 1.5,
          }}
        >
          <InputBase
            fullWidth
            value={filters.keyword}
            onKeyDown={handleInputEnter}
            onChange={onKeywordChange}
            placeholder="Keywords"
            sx={{ fontSize: 14 }}
          />
        </Box>

        <Box
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            py: 1.5,
          }}
        >
          <InputBase
            fullWidth
            value={filters.followers}
            onKeyDown={handleInputEnter}
            onChange={onFollowersChange}
            placeholder="Followers"
            sx={{ fontSize: 14 }}
          />
        </Box>

        <Button
          variant="contained"
          disabled={buttonDisabled}
          onClick={handleSearch}
          sx={{
            minWidth: { xs: '100%', md: 168 },
            bgcolor: '#1340FF',
            '&:hover': { bgcolor: '#0F30D4' },
            textTransform: 'none',
            borderRadius: 1,
            fontSize: 13,
            fontWeight: 600,
            minHeight: 53.5,
            whiteSpace: 'nowrap',
            boxShadow: '0px -3px 0px 0px #00000073 inset',
          }}
        >
          {(() => {
            if (isDefaultDisabledState) {
              return 'Show Results';
            }
            if (isButtonLoading) {
              return 'Searching creators...';
            }
            return `Show ${formatNumber(resultCount)} Creator${resultCount !== 1 ? 's' : ''}`;
          })()}
        </Button>
      </Stack>

      {hasAppliedFilters && shouldShowResults && activePills.length > 0 && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={1}
          mb={1}
          mt={1}
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ flex: 1 }}>
            {activePills.map((pill) => (
              <Chip
                key={pill.key}
                label={pill.label}
                onDelete={pill.onRemove}
                deleteIcon={<Iconify icon="mingcute:close-line" width={12} />}
                size="small"
                variant="outline"
                sx={{
                  px: 0.5,
                  py: 1.6,
                  bgcolor: '#D9D9D9',
                  color: '#231F20',
                  borderRadius: 2,
                  fontSize: 13,
                  '& .MuiChip-deleteIcon': {
                    marginLeft: 2,
                  },
                }}
              />
            ))}
          </Stack>

          <Chip
            label="Clear All"
            onClick={clearAllPills}
            size="small"
            variant="outlined"
            color="default"
            sx={{
              px: 0.5,
              py: 1.6,
              borderRadius: 2,
              fontSize: 13,
              cursor: 'pointer',
            }}
          />
        </Stack>
      )}

      {shouldShowResults && isError && (
        <Typography color="error.main" sx={{ mt: 2 }}>
          Failed to load non-platform creators.
        </Typography>
      )}

      {shouldShowResults && !isError && !isLoading && creators.length === 0 && (
        <EmptyContent filled title="No creators found" sx={{ my: 2 }} />
      )}

      {shouldShowResults && isLoading && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      )}

      {shouldShowResults && !isLoading && sortedCreators.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 7,
            }}
          >
            <Button
              onClick={handleToggleFollowersSort}
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
              endIcon={
                <Iconify icon="fluent:arrow-sort-down-lines-24-regular" width={18} ml={-0.5} />
              }
            >
              Total Followers
            </Button>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mr: 2 }}>
              {`${viewedCount} of ${total} creator${total === 1 ? '' : 's'}`}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(3, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))',
                lg: 'repeat(5, minmax(0, 1fr))',
                xl: 'repeat(5, minmax(0, 1fr))',
              },
            }}
          >
            {sortedCreators.map((creator) => (
              <Card
                key={creator.rowId || creator.userId}
                variant='elevation'
                sx={{
                  borderRadius: 2,
                  p: 2,
                  maxHeight: 200,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#efeff2',
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: '#d4d5db',
                  boxShadow: '4px 4px 4px 0px #8D8D94'
                }}
              >

                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      padding: 0,
                      backgroundColor: '#D3D3D3',
                      fontSize: 30,
                      overflow: 'hidden',
                      justifySelf: 'center',
                      mb: 1,
                    }}
                  >
                    <EmptyProfileSvgIcon size="100%" />
                  </Avatar>

                  <Typography sx={{ fontSize: 12, fontWeight: 600}}>{creator.name}</Typography>

                  {/* Refactored to avoid nested ternary */}
                  {(() => {
                    if (creator.profileLink) {
                      return (
                        <Link
                          href={creator.profileLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                          sx={{
                            display: 'block',
                            textAlign: 'center',
                            fontSize: 14,
                            textTransform: 'lowercase',
                            lineHeight: 1.35,
                            whiteSpace: 'normal',
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                            color: '#1340FF',
                            mb: 1,
                          }}
                        >
                          {creator.profileLink.replace(/^https?:\/\//, '')}
                        </Link>
                      );
                    }
                    return <Typography color="text.disabled">No profile link</Typography>;
                  })()}

                  <Box>
                    <Typography sx={{ fontSize: 12, color: '#1340FF', fontWeight: 700, lineHeight: 1.6 }}>
                      Followers
                    </Typography>
                    <Typography sx={{ lineHeight: 1, color: '#1340FF', fontFamily: 'Instrument Serif', fontSize: 32 }}>
                      {formatFollowers(creator.followers)}
                    </Typography>
                  </Box>

              </Card>
            ))}
          </Box>
        </Box>
      )}

      {shouldShowResults && !isLoading && totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_event, nextPage) => setPage(nextPage)}
          />
        </Box>
      )}
    </Container>
  );
};

export default DiscoveryToolNpcView;
