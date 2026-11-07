import { debounce } from 'lodash';
import useSWRInfinite from 'swr/infinite';
import { useSearchParams } from 'react-router-dom';
import React, { useRef, useMemo, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { m, useScroll, AnimatePresence, useReducedMotion, useMotionValueEvent } from 'framer-motion';

import { useTheme, keyframes } from '@mui/material/styles';
import {
  Box,
  Menu,
  Stack,
  Button,
  Dialog,
  Avatar,
  MenuItem,
  Container,
  InputBase,
  TextField,
  Typography,
  IconButton,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import useGetCampaignDrafts from 'src/hooks/use-get-campaign-drafts';
// Removed useGetAdminsForSuperadmin - using direct SWR call to /api/user/alladmins for CSM access
// import useGetCampaigns from 'src/hooks/use-get-campaigns';

import useSWR from 'swr';
import { useVirtualizer } from '@tanstack/react-virtual';

import { fetcher } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import NotepadIcon from 'src/assets/icons/notepad-icon';
import { useMainContext } from 'src/layouts/dashboard/hooks/dsahboard-context';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CampaignTabs from 'src/components/campaign/CampaignTabs';
import { SECONDARY_ACTION_SX } from 'src/components/campaign/action-button-styles';

import CreateCampaignFormV2 from 'src/sections/campaign/create/form-v2';

import CampaignItem from '../campaign-item';
import CampaignTabButton from '../components/campaign-tab-button';
import CampaignEmptyState from '../components/campaign-empty-state';
import { preloadCampaignImages } from '../components/campaign-banner';
import CampaignTabIndicator from '../components/campaign-tab-indicator';
import CampaignItemSkeleton from '../components/campaign-item-skeleton';

const PAGE_SIZE = 12;
const EASE_OUT = [0.23, 1, 0.32, 1];
const REVEAL_LIMIT = 9;

const revealUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
`;

const revealFade = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const textShimmer = keyframes`
  from { background-position: 100% 0; }
  to { background-position: 0% 0; }
`;

const shimmerTextSx = {
  color: 'transparent',
  backgroundImage: 'linear-gradient(90deg, #636366 40%, #c7c7cc 50%, #636366 60%)',
  backgroundSize: '300% 100%',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  animation: `${textShimmer} 1.6s linear infinite`,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    color: '#636366',
    backgroundImage: 'none',
  },
};

const revealSx = (i) => ({
  animation: `${revealUp} 280ms cubic-bezier(0.23, 1, 0.32, 1) ${i * 40}ms both`,
  '@media (prefers-reduced-motion: reduce)': {
    animation: `${revealFade} 200ms ease-out both`,
  },
});

const CampaignView = () => {
  const settings = useSettingsContext();

  const lastCampaignOpenId = localStorage.getItem('lastCampaignOpenId');
  const pageSizing = localStorage.getItem('pageSizing');
  const scrollTop = localStorage.getItem('scrollTop');

  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  const [search, setSearch] = useState({
    query: initialQuery,
    results: [],
  });

  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const urlQuery = searchParams.get('q') ?? '';
  const syncedQuery = useRef(initialQuery);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (syncedQuery.current === q) return;
    syncedQuery.current = q;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (q) next.set('q', q);
        else next.delete('q');
        return next;
      },
      { replace: true }
    );
  }, [debouncedQuery, setSearchParams]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetQuery = useCallback(
    debounce((q) => setDebouncedQuery(q.trim()), 300), // 300ms delay
    []
  );

  // Back/forward or a link can change ?q= without typing; follow it.
  useEffect(() => {
    if (syncedQuery.current === urlQuery) return;
    syncedQuery.current = urlQuery;
    debouncedSetQuery.cancel();
    setSearch((prev) => ({ ...prev, query: urlQuery }));
    setDebouncedQuery(urlQuery);
  }, [urlQuery, debouncedSetQuery]);

  const clearSearch = useCallback(() => {
    setSearch((prev) => ({ ...prev, query: '' }));
    debouncedSetQuery.cancel();
    setDebouncedQuery('');
  }, [debouncedSetQuery]);

  const create = useBoolean();

  const router = useRouter();

  const [filter, setFilter] = useState('active');
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const hasRestoredRef = useRef(false);
  const isRestoringScroll = useRef(null);
  const [highlightIndex, setHighlightIndex] = useState(() => {
    const stored = localStorage.getItem('lastOpenedIndex');
    return stored === null ? null : Number(stored);
  });

  // Fetch admins list for filter dropdown - only when in "All" tab
  // Using /api/user/alladmins endpoint which is accessible by all admins (not just superadmin)
  const { data: adminsData, isLoading: adminsLoading } = useSWR(
    showAllCampaigns ? '/api/user/alladmins' : null,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Filter admin options - only include CSM admins
  const adminOptions = useMemo(() => {
    if (!adminsData) return [];
    return adminsData
      .filter((adminUser) => {
        // Only include users with names and admin record
        if (!adminUser?.name || !adminUser?.admin) return false;
        const roleName = adminUser.admin?.role?.name;
        return roleName === 'CSM' || roleName === 'Customer Success Manager' || roleName === 'CSL';
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .map((adminUser) => ({
        id: adminUser.id,
        name: adminUser.name || 'Unknown',
        photoURL: adminUser.photoURL,
        role: adminUser.admin?.role?.name || 'Admin',
      }));
  }, [adminsData]);

  const theme = useTheme();

  const { user } = useAuthContext();

  const { mainRef } = useMainContext();

  const lgUp = useResponsive('up', 'lg');
  const mdUp = useResponsive('up', 'md');

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  const isSuperAdmin = useMemo(() => user?.admin?.mode === 'god', [user]);

  // Only the header count is needed here -- the drafts page owns the list. The
  // endpoint is superadmin-only, so skip the fetch for everyone else instead of
  // letting SWR sit on a 403.
  const { drafts, mutate: mutateDrafts } = useGetCampaignDrafts(isSuperAdmin, user?.id);

  // The count goes stale after autosave, create, or discard.
  const handleCloseCreate = () => {
    create.onFalse();
    mutateDrafts();
  };

  // Check if user is a CSM-style admin (not advanced mode). CSL shares this view.
  const isCSM = useMemo(
    () =>
      (user?.admin?.role?.name === 'CSM' ||
        user?.admin?.role?.name === 'Customer Success Manager' ||
        user?.admin?.role?.name === 'CSL') &&
      user?.admin?.mode !== 'advanced',
    [user]
  );

  const getKey = (pageIndex, previousPageData) => {
    // When showAllCampaigns is true, we're viewing other admins' campaigns
    const excludeParam = showAllCampaigns ? '&excludeOwn=true' : '';
    // Add filter by specific admin if selected
    const filterAdminParam = selectedAdmin ? `&filterAdminId=${selectedAdmin.id}` : '';

    // If there's no previous page data, start from the first page
    if (pageIndex === 0) {
      let status = showAllCampaigns ? '' : filter.toUpperCase();
      if (filter === 'pending' && !showAllCampaigns) {
        // For pending tab, we need to search for all pending statuses
        status = 'SCHEDULED,PENDING_CSM_REVIEW,PENDING_ADMIN_ACTIVATION';
      }
      return `/api/campaign/getAllCampaignsByAdminId/${user?.id}?search=${encodeURIComponent(debouncedQuery)}&status=${status}&limit=${PAGE_SIZE}${excludeParam}${filterAdminParam}`;
    }

    // If there's no more data (previousPageData is empty or no nextCursor), stop fetching
    if (!previousPageData?.metaData?.lastCursor) return null;

    // Otherwise, use the nextCursor to get the next page
    let status = showAllCampaigns ? '' : filter.toUpperCase();
    if (filter === 'pending' && !showAllCampaigns) {
      // For pending tab, we need to search for all pending statuses
      status = 'SCHEDULED,PENDING_CSM_REVIEW,PENDING_ADMIN_ACTIVATION';
    }
    const pageSearch = previousPageData?.metaData?.search ?? debouncedQuery;
    return `/api/campaign/getAllCampaignsByAdminId/${user?.id}?search=${encodeURIComponent(pageSearch)}&status=${status}&limit=${PAGE_SIZE}&cursor=${previousPageData?.metaData?.lastCursor}${excludeParam}${filterAdminParam}`;
  };

  const listFetcher = (url) => fetcher(url).then((res) => ({ ...res, key: url }));

  const { data, error, size, setSize, isValidating, mutate, isLoading } = useSWRInfinite(
    getKey,
    listFetcher,
    {
      revalidateFirstPage: false,
      keepPreviousData: true,
    }
  );

  const dataFiltered = useMemo(
    () => (data ? data?.flatMap((item) => item?.data?.campaigns) : []),
    [data]
  );

  // eslint-disable-next-line no-nested-ternary
  const columns = lgUp ? 3 : mdUp ? 2 : 1;
  // eslint-disable-next-line no-unsafe-optional-chaining
  const rowCount = Math.ceil(dataFiltered?.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => mainRef?.current,
    estimateSize: () => 370 + 16,
    overscan: 3,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const isLoadingMore = size > 1 && !!data && typeof data[size - 1] === 'undefined';
  const listKey = getKey(0, null);
  const isShowingStaleList = !!data && data[0]?.key !== listKey;
  const listFailed = !!error && !isValidating && (!data || isShowingStaleList);
  const showSkeleton =
    !listFailed &&
    ((isLoading && !data) || isShowingStaleList || search.query.trim() !== debouncedQuery.trim());
  const hideList = showSkeleton || listFailed;
  const freshPage = isShowingStaleList ? undefined : data?.[0];
  const totalCount = freshPage?.data?.totalCount;
  const searchCorrection = freshPage?.data?.searchCorrection;

  // Stagger the first cards in after a skeleton; cards that mount while scrolling stay still.
  const [isRevealing, setIsRevealing] = useState(false);
  const wasSkeletonRef = useRef(showSkeleton);
  useLayoutEffect(() => {
    const ended = wasSkeletonRef.current && !showSkeleton;
    wasSkeletonRef.current = showSkeleton;
    if (!ended) return undefined;
    setIsRevealing(true);
    const timer = setTimeout(() => setIsRevealing(false), 800);
    return () => clearTimeout(timer);
  }, [showSkeleton]);

  useEffect(() => {
    preloadCampaignImages(dataFiltered.map((c) => c?.campaignBrief?.images?.[0]));
  }, [dataFiltered]);
  const isReachingEnd = data && data[data.length - 1]?.metaData?.lastCursor === null;

  useEffect(() => {
    const [lastItem] = [...virtualRows].reverse();

    if (!lastItem || showSkeleton) return;

    // Trigger load when scrolled to last 3 rows (not items)
    if (lastItem.index >= rowCount - 3 && !isValidating && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [virtualRows, rowCount, isReachingEnd, setSize, size, isValidating, showSkeleton]);

  // Make mutate function available globally for campaign activation
  useEffect(() => {
    window.swrMutate = mutate;
    return () => {
      delete window.swrMutate;
    };
  }, [mutate]);

  const { data: campaignStatusData } = useSWR('/api/campaign/campaignStatus', fetcher, {
    focusThrottleInterval: 60000,
  });

  // Fetch count for "All Campaigns" (other admins' active campaigns) - only for CSM users
  const { data: allCampaignsData } = useSWR(
    isCSM
      ? `/api/campaign/getAllCampaignsByAdminId/${user?.id}?status=&excludeOwn=true&limit=1`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Use independent datasets for counts so they persist regardless of the current tab
  const activeCount = campaignStatusData?.activeCampaigns || 0;
  const completedCount = campaignStatusData?.completedCampaigns || 0;
  const pausedCount = campaignStatusData?.pausedCampaigns || 0;
  const pendingCount = campaignStatusData?.pendingCampaigns || 0;
  const allCampaignsCount = allCampaignsData?.data?.totalCount || 0;

  // Restore smDown and menu handlers
  const smDown = useResponsive('down', 'sm');

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // Debug: verify counts persist across tabs
      console.log(
        '[CampaignView] Counts -> Active:',
        activeCount,
        'Pending:',
        pendingCount,
        'Completed:',
        completedCount,
        'Paused:',
        pausedCount
      );
    }
  }, [activeCount, pendingCount, completedCount, pausedCount]);

  // Reset filter if non-superadmin/non-CSM tries to access pending tab
  useEffect(() => {
    if (filter === 'pending' && !isSuperAdmin && !isCSM) {
      setFilter('active');
    }
  }, [filter, isSuperAdmin, isCSM]);

  const handleChangeTab = (value) => {
    setFilter(value);
    if (scrollTop) {
      localStorage.removeItem('scrollTop');
    }
  };

  // On phones the tab row wraps onto two lines, so the same filters collapse
  // into a dropdown. One list drives it, so the two never fall out of step.
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);

  const filterOptions = useMemo(
    () => [
      { value: 'active', label: 'Active', count: activeCount },
      ...(isSuperAdmin || isCSM
        ? [{ value: 'pending', label: 'Pending', count: pendingCount }]
        : []),
      { value: 'completed', label: 'Completed', count: completedCount },
      { value: 'paused', label: 'Paused', count: pausedCount },
      ...(isCSM ? [{ value: 'all', label: 'All', count: allCampaignsCount }] : []),
    ],
    [activeCount, pendingCount, completedCount, pausedCount, allCampaignsCount, isSuperAdmin, isCSM]
  );

  const activeFilterValue = showAllCampaigns ? 'all' : filter;
  const activeFilterOption =
    filterOptions.find((option) => option.value === activeFilterValue) || filterOptions[0];

  const handleSelectFilter = (value) => {
    setFilterMenuAnchor(null);
    if (value === 'all') {
      setFilter('');
      setShowAllCampaigns(true);
      return;
    }
    handleChangeTab(value);
    setShowAllCampaigns(false);
    setSelectedAdmin(null);
  };

  useEffect(() => {
    const scrollElement = mainRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      // Don't save scroll position while we're restoring it
      if (isRestoringScroll.current) {
        if (localStorage.getItem('lastOpenedIndex')) {
          localStorage.removeItem('lastOpenedIndex');
          setHighlightIndex(null);
        }
        return;
      }

      localStorage.setItem('lastScrollPosition', scrollElement.scrollTop.toString());
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });

    // eslint-disable-next-line consistent-return
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [mainRef]);

  useEffect(() => {
    if (hasRestoredRef.current) return;
    if (!dataFiltered.length) return;

    const lastScrollPosition = Number(localStorage.getItem('lastScrollPosition'));
    const lastOpenedIndex = Number(localStorage.getItem('lastOpenedIndex'));

    requestAnimationFrame(() => {
      isRestoringScroll.current = true;

      if (
        lastOpenedIndex &&
        !Number.isNaN(lastOpenedIndex) &&
        lastOpenedIndex >= 0 &&
        lastOpenedIndex < dataFiltered.length
      ) {
        // eslint-disable-next-line no-nested-ternary
        const cols = lgUp ? 3 : mdUp ? 2 : 1;
        const rowIndex = Math.floor(lastOpenedIndex / cols);
        rowVirtualizer.scrollToIndex(rowIndex, { align: 'start' });
        localStorage.setItem('lastScrollPosition', mainRef?.current.scrollTop.toString());
      } else if (!Number.isNaN(lastScrollPosition) && lastScrollPosition > 0 && mainRef.current) {
        mainRef.current.scrollTo({
          top: lastScrollPosition,
          behavior: 'auto',
        });
      }

      // Allow scroll tracking after a short delay
      setTimeout(() => {
        isRestoringScroll.current = false;
      }, 50);
    });
  }, [dataFiltered, lastCampaignOpenId, lgUp, mainRef, mdUp, rowVirtualizer, scrollTop]);

  const { scrollY } = useScroll({ container: mainRef });
  const reduceMotion = useReducedMotion();
  const [showModal, setShowModal] = useState(false);

  useMotionValueEvent(scrollY, 'change', (current) => {
    if (current < 100) setShowModal(false);
    else setShowModal(true);
  });

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
      <AnimatePresence mode="wait">
        {showModal && (
          <m.div
            initial={{ opacity: 0, transform: `translate(-50%, ${reduceMotion ? 0 : -12}px)` }}
            animate={{ opacity: 1, transform: 'translate(-50%, 0px)' }}
            exit={{
              opacity: 0,
              transform: `translate(-50%, ${reduceMotion ? 0 : -12}px)`,
              transition: { duration: 0.15, ease: EASE_OUT },
            }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            style={{ position: 'absolute', left: '50%', zIndex: 100 }}
          >
            <Box
              sx={{
                border: 1,
                display: 'inline-flex',
                borderRadius: 10,
                borderColor: 'rgba(255,255,255,0.5)',
                gap: 2,
                p: 0.8,
                px: 1,
                bgcolor: 'rgba(0,0,0,0.6)', // ✅ semi-transparent dark
                backdropFilter: 'blur(5px)', // ✅ frosted glass effect
                color: 'white',
              }}
            >
              <Button
                variant="outlined"
                sx={{ borderRadius: 10, borderColor: filter === 'active' && 'white' }}
                onClick={() => {
                  handleChangeTab('active');
                  setShowAllCampaigns(false);
                  setSelectedAdmin(null);
                }}
              >
                Active
              </Button>
              <Button
                variant="outlined"
                sx={{ borderRadius: 10, borderColor: filter === 'pending' && 'white' }}
                onClick={() => {
                  handleChangeTab('pending');
                  setShowAllCampaigns(false);
                  setSelectedAdmin(null);
                }}
              >
                Pending
              </Button>
              <Button
                variant="outlined"
                sx={{ borderRadius: 10, borderColor: filter === 'completed' && 'white' }}
                onClick={() => {
                  handleChangeTab('completed');
                  setShowAllCampaigns(false);
                  setSelectedAdmin(null);
                }}
              >
                Completed
              </Button>
              <Button
                variant="outlined"
                sx={{ borderRadius: 10, borderColor: filter === 'paused' && 'white' }}
                onClick={() => {
                  handleChangeTab('paused');
                  setShowAllCampaigns(false);
                  setSelectedAdmin(null);
                }}
              >
                Paused
              </Button>
            </Box>
          </m.div>
        )}
      </AnimatePresence>

      <Typography
        variant="h2"
        sx={{
          mb: 2,
          fontFamily: 'fontSecondaryFamily',
          fontWeight: 'normal',
        }}
      >
        Manage campaigns ✨
      </Typography>

      {/* Campaign Tabs */}
      <CampaignTabs filter={filter} />

      <Box sx={{ mb: 2.5 }}>
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            position: 'relative',
            width: '100%',
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
          {/* Tab row -- phones get the dropdown below instead. */}
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              position: 'relative',
              display: { xs: 'none', sm: 'flex' },
              width: { xs: '100%', sm: 'auto' },
              flexWrap: 'wrap',
            }}
          >
            <CampaignTabButton
              label={`Active (${activeCount})`}
              active={filter === 'active' && !showAllCampaigns}
              onClick={() => {
                handleChangeTab('active');
                setShowAllCampaigns(false);
                setSelectedAdmin(null);
              }}
              sx={{ px: 0.5 }}
            />
            {/* Show Pending tab for superadmins and CSM/CSL users */}
            {(isSuperAdmin || isCSM) && (
              <CampaignTabButton
                label={`Pending (${pendingCount})`}
                active={filter === 'pending' && !showAllCampaigns}
                onClick={() => {
                  handleChangeTab('pending');
                  setShowAllCampaigns(false);
                  setSelectedAdmin(null);
                }}
                sx={{ ml: 2 }}
              />
            )}
            <CampaignTabButton
              label={`Completed (${completedCount})`}
              active={filter === 'completed' && !showAllCampaigns}
              onClick={() => {
                handleChangeTab('completed');
                setShowAllCampaigns(false);
                setSelectedAdmin(null);
              }}
              sx={{ ml: 2 }}
            />
            <CampaignTabButton
              label={`Paused (${pausedCount})`}
              active={filter === 'paused' && !showAllCampaigns}
              onClick={() => {
                handleChangeTab('paused');
                setShowAllCampaigns(false);
                setSelectedAdmin(null);
              }}
              sx={{ ml: 2 }}
            />
            {/* All Campaigns tab - only visible to CSM admins */}
            {isCSM && (
              <CampaignTabButton
                label={`All (${allCampaignsCount})`}
                active={showAllCampaigns}
                onClick={() => {
                  setFilter('');
                  setShowAllCampaigns(true);
                }}
                sx={{ ml: 2 }}
              />
            )}
            <CampaignTabIndicator activeKey={showAllCampaigns ? 'all' : filter} />
          </Stack>

          {/* Phone controls: the tab row collapses to a dropdown, with Drafts
              beside it since the header cluster only shows from sm up. */}
          <Box
            sx={{
              display: { xs: 'flex', sm: 'none' },
              alignItems: 'center',
              gap: 1,
              width: '100%',
              pb: 1.5,
            }}
          >
            <Button
              onClick={(event) => setFilterMenuAnchor(event.currentTarget)}
              endIcon={<Iconify icon="eva:chevron-down-fill" width={20} />}
              aria-haspopup="listbox"
              aria-expanded={Boolean(filterMenuAnchor)}
              sx={{
                ...SECONDARY_ACTION_SX,
                flex: 1,
                minWidth: 0,
                justifyContent: 'space-between',
                px: 1.5,
                fontSize: 14,
                '& .MuiButton-endIcon': { ml: 0.5, flexShrink: 0 },
              }}
            >
              <Box component="span" sx={{ minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {activeFilterOption.label} ({activeFilterOption.count})
              </Box>
            </Button>

            {isSuperAdmin && (
              <Button
                onClick={() => router.push(paths.dashboard.campaign.drafts)}
                startIcon={<NotepadIcon size={20} />}
                sx={{
                  ...SECONDARY_ACTION_SX,
                  flexShrink: 0,
                  px: 1.5,
                  gap: '4px',
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  '& .MuiButton-startIcon': { m: 0 },
                }}
              >
                Drafts ({drafts.length})
              </Button>
            )}

            <Menu
              anchorEl={filterMenuAnchor}
              open={Boolean(filterMenuAnchor)}
              onClose={() => setFilterMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 0.5,
                    width: filterMenuAnchor?.offsetWidth,
                    borderRadius: '8px',
                    border: '1px solid #E8E8E8',
                  },
                },
              }}
            >
              {filterOptions.map((option) => (
                <MenuItem
                  key={option.value}
                  selected={option.value === activeFilterValue}
                  onClick={() => handleSelectFilter(option.value)}
                  sx={{
                    fontFamily: 'InterDisplay',
                    fontWeight: option.value === activeFilterValue ? 600 : 500,
                    fontSize: 14,
                    color: option.value === activeFilterValue ? '#231F20' : '#636366',
                  }}
                >
                  {option.label} ({option.count})
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Positioned as one cluster so Drafts sits flush to the left of
              New Campaign instead of each button anchoring itself. */}
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1.25,
              position: 'absolute',
              right: 0,
              top: -3,
            }}
          >
            {isSuperAdmin && (
              <Button
                onClick={() => router.push(paths.dashboard.campaign.drafts)}
                startIcon={<NotepadIcon size={24} />}
                sx={{
                  boxSizing: 'border-box',
                  minWidth: 126,
                  height: 44,
                  padding: '10px 12px 13px',
                  gap: '6px',
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E8E8E8',
                  borderRadius: '8px',
                  boxShadow: 'inset 0px -3px 0px #E7E7E7',
                  color: '#231F20',
                  fontFamily: 'InterDisplay',
                  fontWeight: 600,
                  fontSize: 16,
                  lineHeight: '20px',
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  transition:
                    'transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease-out, border-color 140ms ease-out, box-shadow 140ms ease-out',
                  '& .MuiButton-startIcon': { m: 0 },
                  // The inset bottom edge reads as a raised key, so hover deepens
                  // it and press sinks the button onto it.
                  '&:hover': {
                    bgcolor: '#F8F8F8',
                    border: '1px solid #D6D6D6',
                    boxShadow: 'inset 0px -3px 0px #DEDEDE',
                  },
                  '&:active': {
                    bgcolor: '#F0F0F0',
                    border: '1px solid #D6D6D6',
                    boxShadow: 'inset 0px -1px 0px #DEDEDE',
                    transform: 'translateY(2px)',
                  },
                }}
              >
                Drafts ({drafts.length})
              </Button>
            )}

            <Button
              onClick={create.onTrue}
              startIcon={<Iconify icon="eva:plus-fill" width={20} height={20} />}
              disabled={isDisabled}
              sx={{
                bgcolor: isDisabled ? '#e0e0e0' : '#203ff5',
                color: isDisabled ? '#9e9e9e' : 'white',
                boxShadow: `inset 0px -3px 0px ${isDisabled ? '#bdbdbd' : '#102387'}`,
                borderRadius: '8px',
                px: 2.5,
                pt: 1,
                pb: '11px',
                fontSize: '0.9rem',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition:
                  'transform 140ms cubic-bezier(0.23, 1, 0.32, 1), opacity 150ms ease, box-shadow 140ms ease-out',
                '&:hover': {
                  bgcolor: isDisabled ? '#e0e0e0' : '#203ff5',
                  boxShadow: `inset 0px -3px 0px ${isDisabled ? '#bdbdbd' : '#102387'}`,
                  opacity: isDisabled ? 1 : 0.9,
                },
                '&:active': {
                  transform: 'translateY(2px)',
                  boxShadow: `inset 0px -1px 0px ${isDisabled ? '#bdbdbd' : '#102387'}`,
                },
              }}
            >
              New Campaign
            </Button>
          </Box>

          <IconButton
            onClick={create.onTrue}
            sx={{
              display: { xs: 'flex', sm: 'none' },
              position: 'fixed',
              right: 20,
              bottom: 20,
              width: 56,
              height: 56,
              bgcolor: '#203ff5',
              color: 'white',
              zIndex: 1100,
              boxShadow: '0 2px 12px rgba(32, 63, 245, 0.3)',
              transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), opacity 150ms ease',
              '&:hover': {
                bgcolor: '#203ff5',
                opacity: 0.9,
              },
              '&:active': { transform: 'scale(0.97)' },
            }}
          >
            <Iconify icon="eva:plus-fill" width={24} height={24} />
          </IconButton>
        </Stack>
      </Box>

      <Stack direction="row" sx={{ width: '100%', gap: 0 }}>
        <Box
          component={m.div}
          layout="position"
          transition={{ duration: 0.2, ease: EASE_OUT }}
          sx={{
            flex: 1,
            border: '1px solid',
            borderBottom: '3.5px solid',
            borderColor: isSearchFocused ? '#1340ff' : 'divider',
            borderRadius: 1.5,
            bgcolor: 'background.paper',
            height: 44,
            display: 'flex',
            alignItems: 'center',
            transition: 'border-color 0.2s ease',
          }}
        >
          <InputBase
            value={search.query}
            onChange={(e) => {
              setSearch((prev) => ({ ...prev, query: e.target.value }));
              debouncedSetQuery(e.target.value);
            }}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Search campaigns or clients"
            startAdornment={
              <Iconify
                icon="eva:search-fill"
                sx={{
                  width: 20,
                  height: 20,
                  mr: 1,
                  ml: 1.5,
                  color: 'text.disabled',
                  flexShrink: 0,
                }}
              />
            }
            endAdornment={
              search.query && (
                <Stack direction="row" alignItems="center" sx={{ flexShrink: 0, pl: 1 }}>
                  <Typography
                    component="span"
                    variant="caption"
                    aria-live="polite"
                    noWrap
                    sx={{ maxWidth: { xs: 120, sm: 320 }, color: '#636366', fontSize: 13, fontWeight: 500 }}
                  >
                    {showSkeleton && (
                      <Box component="span" sx={shimmerTextSx}>
                        Searching…
                      </Box>
                    )}
                    {!showSkeleton && searchCorrection && (
                      <>
                        {!smDown && 'Showing '}
                        <Box
                          component="button"
                          type="button"
                          title={`Search for "${searchCorrection}"`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSearch((prev) => ({ ...prev, query: searchCorrection }));
                            debouncedSetQuery.cancel();
                            setDebouncedQuery(searchCorrection);
                          }}
                          sx={{
                            p: 0,
                            border: 0,
                            bgcolor: 'transparent',
                            font: 'inherit',
                            fontWeight: 600,
                            color: '#1340ff',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            textDecorationColor: 'transparent',
                            textUnderlineOffset: 3,
                            transition: 'text-decoration-color 150ms ease',
                            '&:hover': { textDecorationColor: 'currentColor' },
                          }}
                        >
                          {searchCorrection}
                        </Box>
                        {' · '}
                      </>
                    )}
                    {!showSkeleton &&
                      totalCount > 0 &&
                      `${totalCount} ${totalCount === 1 ? 'result' : 'results'}`}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label="Clear search"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={clearSearch}
                    sx={{ mr: 1, ml: 0.5 }}
                  >
                    <Iconify icon="eva:close-fill" width={18} />
                  </IconButton>
                </Stack>
              )
            }
            sx={{
              width: '100%',
              height: '100%',
              color: 'text.primary',
              '& input': {
                py: 0,
                px: 0.5,
              },
            }}
          />
        </Box>

        {/* Admin Filter Dropdown - only show in "All" tab for superadmin, god mode, and CSM admins */}
        <AnimatePresence initial={false}>
          {showAllCampaigns && (isSuperAdmin || user?.admin?.mode === 'advanced' || isCSM) && (
            <m.div
              initial={{ opacity: 0, transform: `translateX(${reduceMotion ? 0 : 8}px)` }}
              animate={{ opacity: 1, transform: 'translateX(0px)' }}
              exit={{ opacity: 0, transition: { duration: 0.12, ease: EASE_OUT } }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              style={{ width: 262, flexShrink: 0, display: 'flex' }}
            >
              <Autocomplete
                size="small"
                value={selectedAdmin}
                onChange={(event, newValue) => {
                  setSelectedAdmin(newValue);
                }}
                options={adminOptions}
                getOptionLabel={(option) => option.name || ''}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                loading={adminsLoading}
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    {...props}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <Avatar
                      src={option.photoURL}
                      alt={option.name}
                      sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                    >
                      {option.name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {option.role}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Filter by Admin"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                          <Iconify
                            icon="mdi:account-filter"
                            sx={{
                              width: 20,
                              height: 20,
                              mr: 1,
                              color: 'text.disabled',
                              flexShrink: 0,
                            }}
                          />
                          {selectedAdmin && (
                            <Avatar
                              src={selectedAdmin.photoURL}
                              alt={selectedAdmin.name}
                              sx={{
                                width: 20,
                                height: 20,
                                fontSize: '0.625rem',
                                mr: 0.5,
                                flexShrink: 0,
                              }}
                            >
                              {selectedAdmin.name?.charAt(0)}
                            </Avatar>
                          )}
                          {params.InputProps.startAdornment}
                        </Box>
                      ),
                    }}
                  />
                )}
                sx={{
                  width: 250,
                  minWidth: 250,
                  ml: 1.5,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                    borderRadius: 1.5,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    '& fieldset': {
                      borderColor: selectedAdmin ? '#1340ff' : 'divider',
                      borderWidth: '1px',
                      borderBottomWidth: '3.5px',
                    },
                    '&:hover fieldset': {
                      borderColor: selectedAdmin ? '#1340ff' : 'divider',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1340ff',
                    },
                  },
                  '& .MuiInputBase-input': {
                    padding: '0 8px',
                  },
                }}
              />
            </m.div>
          )}
        </AnimatePresence>
      </Stack>

      {showSkeleton && (
        <Box gap={2} display="grid" gridTemplateColumns={`repeat(${columns}, 1fr)`} sx={{ mt: 2 }}>
          {Array.from({ length: columns * 2 }).map((_, i) => (
            <CampaignItemSkeleton key={i} />
          ))}
        </Box>
      )}

      {listFailed && (
        <CampaignEmptyState
          emoji="😵‍💫"
          title="Couldn’t load campaigns"
          description="Check your connection, then try again."
          actionLabel="Try again"
          onAction={() => mutate()}
        />
      )}

      {!showSkeleton &&
        !listFailed &&
        !isValidating &&
        dataFiltered.length === 0 &&
        (debouncedQuery.trim() ? (
          <CampaignEmptyState
            emoji="🕵️"
            title={`No results for “${debouncedQuery.trim()}”`}
            description="Check the spelling, or try a campaign, brand or client name."
            actionLabel="Clear search"
            onAction={clearSearch}
          />
        ) : (
          <CampaignEmptyState
            emoji="😿"
            title="No campaigns to show"
            description="Campaigns in this tab will show up here."
          />
        ))}

      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
          marginBottom: 40,
          display: hideList ? 'none' : 'block',
        }}
      >
        {!hideList &&
          virtualRows.map((virtualRow) => {
            // eslint-disable-next-line no-nested-ternary
            const cols = lgUp ? 3 : mdUp ? 2 : 1;

            const startIndex = virtualRow.index * cols;

            const endIndex = Math.min(startIndex + cols, dataFiltered.length);
            const rowCampaigns = dataFiltered.slice(startIndex, endIndex);

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <Box
                  gap={2}
                  display="grid"
                  gridTemplateColumns={
                    // eslint-disable-next-line no-nested-ternary
                    `repeat(${cols}, 1fr)`
                  }
                  sx={{ mt: 2 }}
                >
                  {rowCampaigns?.map((a, index) => {
                    const itemIndex = index + startIndex;
                    return (
                      <Box
                        key={a?.id}
                        sx={{
                          display: 'grid',
                          ...(isRevealing && itemIndex < REVEAL_LIMIT && revealSx(itemIndex)),
                        }}
                      >
                        <CampaignItem
                          index={itemIndex}
                          isHighlighted={highlightIndex === itemIndex}
                          campaign={a}
                          status={a?.status}
                          showAdmins={showAllCampaigns}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </div>
            );
          })}
      </div>

      {isLoadingMore && (
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <CircularProgress
            thickness={7}
            size={25}
            sx={{
              color: theme.palette.common.black,
              strokeLinecap: 'round',
            }}
          />
        </Box>
      )}

      <Dialog
        fullWidth
        fullScreen
        PaperProps={{
          sx: {
            // bgcolor: '#FFF',
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            p: 4,
            m: 2,
            height: '97vh',
            overflow: 'hidden',
            ...(smDown && {
              height: 1,
              m: 0,
            }),
          },
        }}
        scroll="paper"
        open={create.value}
      >
        <CreateCampaignFormV2 onClose={handleCloseCreate} mutate={mutate} />
      </Dialog>
    </Container>
  );
};

export default CampaignView;
