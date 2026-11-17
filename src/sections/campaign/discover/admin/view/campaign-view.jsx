import { debounce } from 'lodash';
import useSWRInfinite from 'swr/infinite';
import { useSearchParams } from 'react-router-dom';
import {
  m,
  useScroll,
  AnimatePresence,
  useReducedMotion,
  useMotionValueEvent,
} from 'framer-motion';
import React, {
  lazy,
  useRef,
  useMemo,
  Suspense,
  useState,
  useEffect,
  useReducer,
  useCallback,
  useLayoutEffect,
} from 'react';

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

import socket from 'src/hooks/socket';

import { fetcher } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import NotepadIcon from 'src/assets/icons/notepad-icon';
import { useMainContext } from 'src/layouts/dashboard/hooks/dsahboard-context';

import Iconify from 'src/components/iconify';
import PageEnter from 'src/components/page-enter';
import { useSettingsContext } from 'src/components/settings';
import CampaignTabs from 'src/components/campaign/CampaignTabs';
import { SECONDARY_ACTION_SX } from 'src/components/campaign/action-button-styles';

import { dialogEnterSx } from 'src/sections/campaign/create/components/motion';

import CampaignItem from '../campaign-item';
import CampaignTabButton from '../components/campaign-tab-button';
import CampaignEmptyState from '../components/campaign-empty-state';
import { preloadCampaignImages } from '../components/campaign-banner';
import CampaignTabIndicator from '../components/campaign-tab-indicator';
import CampaignItemSkeleton from '../components/campaign-item-skeleton';
import { readCountCache, writeCountCache } from '../components/count-cache';
import { clearPublished, usePublishedCampaign } from '../store/use-published-campaign';
import CampaignCardMotion, { useCardShuffle } from '../components/campaign-card-motion';

// The form and its PDF libraries load when the browser is idle or on hover, not with the list.
const loadCreateForm = () => import('src/sections/campaign/create/form-v2');
const CreateCampaignFormV2 = lazy(loadCreateForm);

const PAGE_SIZE = 12;
// How far the list may page to find the campaign the user is coming back to.
const RETURN_SEEK_PAGES = 30;
const EASE_OUT = [0.23, 1, 0.32, 1];
const REVEAL_LIMIT = 9;
// A fast response swaps the cards straight in; only a slow one shows the skeleton
const SKELETON_DELAY_MS = 200;
const filterFromTab = (tab) => {
  if (tab === 'all') return '';
  return ['pending', 'completed', 'paused'].includes(tab) ? tab : 'active';
};

const withCount = (label, count) => (count === undefined ? label : `${label} (${count})`);

// An opened link starts the list at the top. A refresh, Back from a campaign, or a browser
// Back that reloads the whole page keeps the place.
const loadedPath = (() => {
  try {
    const entry = performance.getEntriesByType('navigation')[0];
    if (!entry || entry.type === 'back_forward' || entry.type === 'reload') return null;
    return new URL(entry.name).pathname;
  } catch (error) {
    return null;
  }
})();
let listMountedThisLoad = false;

// The list as the user left it (scroll offset, row sizes, card count), so it comes back in place.
// Memory serves Back within the app; sessionStorage survives a refresh.
const VIEW_STORAGE_KEY = 'cc-campaign-list-view';
let leftView = null;

const readLeftView = () => {
  if (leftView) return leftView;
  try {
    return JSON.parse(sessionStorage.getItem(VIEW_STORAGE_KEY));
  } catch (error) {
    return null;
  }
};

const storeLeftView = (view) => {
  leftView = view;
  try {
    sessionStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(view));
  } catch (error) {
    // Storage full or blocked; a refresh then starts at the top.
  }
};

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

  const [isPageLoad] = useState(
    () => !listMountedThisLoad && loadedPath === window.location.pathname
  );

  useLayoutEffect(() => {
    listMountedThisLoad = true;
    if (isPageLoad) localStorage.setItem('lastScrollPosition', '0');
  }, [isPageLoad]);

  const [lastCampaignOpenId] = useState(() => localStorage.getItem('lastCampaignOpenId'));
  const [scrollTop] = useState(() => localStorage.getItem('scrollTop'));

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

  // The open tab lives in ?tab= so a refresh or a shared link keeps it. Active is the default and stays out of the URL.
  const urlTab = searchParams.get('tab');
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  const [filter, setFilter] = useState(() => filterFromTab(urlTab));
  const [showAllCampaigns, setShowAllCampaigns] = useState(urlTab === 'all');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const hasRestoredRef = useRef(false);
  const isRestoringScroll = useRef(null);
  // The campaign the user opened before coming back here. It is used once:
  // the list scrolls to it and its border shows briefly, then fades.
  const [returnToId] = useState(() =>
    isPageLoad ? null : localStorage.getItem('lastOpenedCampaignId')
  );
  const returnHandledRef = useRef(false);
  const scrollOffsetRef = useRef(0);

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
  const {
    drafts,
    isLoading: draftsLoading,
    mutate: mutateDrafts,
  } = useGetCampaignDrafts(isSuperAdmin, user?.id);

  // When the create dialog closed, so a just-published card waits for it to fade first
  const createClosedAtRef = useRef(0);

  // The count goes stale after autosave, create, or discard.
  const handleCloseCreate = () => {
    createClosedAtRef.current = performance.now();
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
  const listKey = getKey(0, null);
  // No user id here: on a refresh the list draws before the user loads. Row sizes change
  // with the width, so a saved view only fits the same width.
  const viewKey = [
    showAllCampaigns ? 'all' : filter,
    debouncedQuery,
    selectedAdmin?.id ?? '',
    columns,
    window.innerWidth,
  ].join('|');

  const [returnLoaded] = useState(
    () => !!returnToId && dataFiltered.some((campaign) => String(campaign?.id) === returnToId)
  );
  const [savedView] = useState(() => {
    if (isPageLoad) return null;
    const view = readLeftView();
    return view?.key === viewKey ? view : null;
  });
  // After a refresh, only the first page is loaded again, so keep paging until the list
  // holds the campaign the user is coming back to and as many cards as when they left.
  const [seekingReturn, setSeekingReturn] = useState(
    (!!returnToId && !returnLoaded) || (!!savedView && dataFiltered.length < savedView.count)
  );
  const [highlightId, setHighlightId] = useState(returnLoaded ? returnToId : null);
  const clearHighlight = useCallback(() => setHighlightId(null), []);

  const virtualizerRef = useRef(null);
  const viewAppliedRef = useRef(false);
  const mountedRef = useRef(false);
  const [, forceRender] = useReducer((n) => n + 1, 0);

  // On mount this runs before the virtualizer reads the scroll offset, so the first frame is
  // already in place. After paging it runs when the list shows, and re-renders before paint.
  useLayoutEffect(() => {
    if (!savedView || seekingReturn || viewAppliedRef.current || !mainRef.current) return;
    viewAppliedRef.current = true;
    hasRestoredRef.current = true;
    returnHandledRef.current = true;
    localStorage.removeItem('lastOpenedCampaignId');
    if (returnToId && dataFiltered.some((campaign) => String(campaign?.id) === returnToId)) {
      setHighlightId(returnToId);
    }
    scrollOffsetRef.current = savedView.offset;
    mainRef.current.scrollTop = savedView.offset;
    if (mountedRef.current && virtualizerRef.current) {
      virtualizerRef.current.scrollOffset = savedView.offset;
      forceRender();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedView, seekingReturn]);

  useEffect(() => {
    mountedRef.current = true;
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => mainRef?.current,
    estimateSize: () => 370 + 16,
    overscan: 3,
    initialOffset: savedView && !seekingReturn ? savedView.offset : 0,
    initialMeasurementsCache: savedView?.rows ?? [],
  });

  virtualizerRef.current = rowVirtualizer;

  const viewRef = useRef(null);
  const saveView = useCallback(() => {
    if (!viewRef.current?.ready) return;
    storeLeftView({
      key: viewRef.current.key,
      count: viewRef.current.count,
      offset: mainRef.current?.scrollTop || scrollOffsetRef.current,
      rows: [...rowVirtualizer.measurementsCache],
    });
  }, [rowVirtualizer, mainRef]);

  useLayoutEffect(() => saveView, [saveView]);

  useEffect(() => {
    window.addEventListener('pagehide', saveView);
    return () => window.removeEventListener('pagehide', saveView);
  }, [saveView]);

  const virtualRows = rowVirtualizer.getVirtualItems();

  // A just-published campaign: bring the top of the list into view, so the new card
  // is seen arriving. Clear it if the card never shows (e.g. it went to Pending).
  const publishedId = usePublishedCampaign((state) => state.publishedId);
  useEffect(() => {
    if (!publishedId) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    mainRef?.current?.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    const id = setTimeout(clearPublished, 10000);
    return () => clearTimeout(id);
  }, [publishedId, mainRef]);
  const enterDelayMs = Math.max(0, 300 - (performance.now() - createClosedAtRef.current));

  // The other cards slide over to make room for the new one
  const listRef = useRef(null);
  const campaignIds = useMemo(() => dataFiltered.map((campaign) => campaign?.id), [dataFiltered]);
  useCardShuffle({
    listRef,
    ids: campaignIds,
    columns,
    rowStride: virtualRows.length > 1 ? virtualRows[1].start - virtualRows[0].start : 386,
    active: !!publishedId,
    delayMs: enterDelayMs,
  });

  const isLoadingMore = size > 1 && !!data && typeof data[size - 1] === 'undefined';
  const isShowingStaleList = !!data && data[0]?.key !== listKey;
  const listFailed = !!error && !isValidating && (!data || isShowingStaleList);
  // The list for the current tab and search has not arrived yet
  const isLoadingList =
    !listFailed && ((isLoading && !data) || isShowingStaleList || seekingReturn);
  // Typing alone keeps the current cards as they are: no dim, no skeleton.
  const isTyping = search.query.trim() !== debouncedQuery.trim();
  const isWaiting = isLoadingList || (!listFailed && isTyping);
  // With no data at mount the skeleton shows at once, so it stays until the list is ready
  // instead of a first page flashing between two skeletons.
  const [skeletonDue, setSkeletonDue] = useState(() => !data);
  useEffect(() => {
    if (!isLoadingList) {
      setSkeletonDue(false);
      return undefined;
    }
    const timer = setTimeout(() => setSkeletonDue(true), SKELETON_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isLoadingList]);
  // With nothing to show yet (first load) the skeleton comes at once
  const showSkeleton = isLoadingList && (!data || skeletonDue);
  const hideList = showSkeleton || listFailed;
  // A half-loaded list is not saved, so a second refresh while paging keeps the first view.
  viewRef.current = {
    key: viewKey,
    count: dataFiltered.length,
    ready: !isWaiting && !hideList && !seekingReturn,
  };
  const freshPage = isShowingStaleList ? undefined : data?.[0];
  const totalCount = freshPage?.data?.totalCount;
  const searchCorrection = freshPage?.data?.searchCorrection;

  // Stagger the first cards in after a skeleton; cards that mount while scrolling stay still.
  // The reveal belongs to the list that replaced the skeleton, so a tab that is already
  // loaded never replays it.
  const [revealKey, setRevealKey] = useState(null);
  const wasSkeletonRef = useRef(showSkeleton);
  useLayoutEffect(() => {
    const ended = wasSkeletonRef.current && !showSkeleton;
    wasSkeletonRef.current = showSkeleton;
    if (!ended) {
      if (showSkeleton) setRevealKey(null);
      return undefined;
    }
    setRevealKey(listKey);
    const timer = setTimeout(() => setRevealKey(null), 800);
    return () => clearTimeout(timer);
    // listKey is read at the moment the skeleton ends
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSkeleton]);
  const isRevealing = revealKey !== null && revealKey === listKey;
  // A list restored further down staggers in from the first row on screen.
  const revealFrom = savedView
    ? (rowVirtualizer.getVirtualItemForOffset(savedView.offset)?.index ?? 0) * columns
    : 0;

  // Warm only the covers on screen and the next two rows, not every loaded campaign.
  const firstRowIndex = virtualRows[0]?.index ?? 0;
  const lastRowIndex = virtualRows[virtualRows.length - 1]?.index ?? 0;
  useEffect(() => {
    preloadCampaignImages(
      dataFiltered
        .slice(firstRowIndex * columns, (lastRowIndex + 3) * columns)
        .map((c) => c?.campaignBrief?.images?.[0])
    );
  }, [dataFiltered, firstRowIndex, lastRowIndex, columns]);
  const isReachingEnd = data && data[data.length - 1]?.metaData?.lastCursor === null;

  useEffect(() => {
    if (!seekingReturn || !data || isShowingStaleList || isLoadingMore) return;
    const found =
      !returnToId || dataFiltered.some((campaign) => String(campaign?.id) === returnToId);
    const covered = !savedView || dataFiltered.length >= savedView.count;
    if ((found && covered) || isReachingEnd || error || size >= RETURN_SEEK_PAGES) {
      setSeekingReturn(false);
      return;
    }
    setSize(size + 1);
  }, [
    seekingReturn,
    data,
    dataFiltered,
    returnToId,
    savedView,
    isShowingStaleList,
    isLoadingMore,
    isReachingEnd,
    error,
    size,
    setSize,
  ]);

  useEffect(() => {
    const [lastItem] = [...virtualRows].reverse();

    if (!lastItem || isWaiting) return;

    // Trigger load when scrolled to last 3 rows (not items)
    if (lastItem.index >= rowCount - 3 && !isValidating && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [virtualRows, rowCount, isReachingEnd, setSize, size, isValidating, isWaiting]);

  // Make mutate function available globally for campaign activation
  useEffect(() => {
    window.swrMutate = mutate;
    return () => {
      delete window.swrMutate;
    };
  }, [mutate]);

  // Cached pages show at once, but they never refetch by themselves (revalidateFirstPage is off).
  // So when this list comes back from cache (Back, another page, a tab seen before), fetch the
  // loaded pages again: a campaign created, ended or edited elsewhere then shows without a refresh.
  useEffect(() => {
    if (data && !isShowingStaleList) mutate();
    // Only when the list (tab, search, admin filter) changes; the cache is read at that moment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey]);

  // Last known counts show at once on refresh; fresh ones replace them when they arrive.
  const countCache = useMemo(() => readCountCache(user?.id), [user?.id]);

  const { data: campaignStatusData, mutate: mutateStatusCounts } = useSWR(
    '/api/campaign/campaignStatus',
    fetcher,
    {
      focusThrottleInterval: 60000,
      fallbackData: countCache.status,
      onSuccess: (status) => writeCountCache(user?.id, { status }),
    }
  );

  // Fetch count for "All Campaigns" (other admins' active campaigns) - only for CSM users
  const { data: allCampaignsData } = useSWR(
    isCSM
      ? `/api/campaign/getAllCampaignsByAdminId/${user?.id}?status=&excludeOwn=true&limit=1`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      fallbackData: countCache.all,
      onSuccess: (result) =>
        writeCountCache(user?.id, { all: { data: { totalCount: result?.data?.totalCount } } }),
    }
  );

  // The server tells every open list when a campaign is created, activated, ended or changes
  // stage, so this list and the tab counts update live, also for changes by other admins.
  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => {
      mutate();
      mutateStatusCounts();
    };
    socket.on('campaign', refresh);
    socket.on('campaignStatus', refresh);
    return () => {
      socket.off('campaign', refresh);
      socket.off('campaignStatus', refresh);
    };
  }, [mutate, mutateStatusCounts]);

  // Once the list has loaded, warm the New Campaign form in idle time.
  const hasListData = !!data;
  useEffect(() => {
    if (!hasListData) return undefined;
    const idle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 1500));
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    const handle = idle(() => loadCreateForm(), { timeout: 4000 });
    return () => cancel(handle);
  }, [hasListData]);

  // Use independent datasets for counts so they persist regardless of the current tab
  // With no cached or fresh data a count stays undefined, so the tabs never show a false (0)
  const statusCount = (key) => (campaignStatusData ? campaignStatusData[key] || 0 : undefined);
  const activeCount = statusCount('activeCampaigns');
  const completedCount = statusCount('completedCampaigns');
  const pausedCount = statusCount('pausedCampaigns');
  const pendingCount = statusCount('pendingCampaigns');
  const allCampaignsCount = allCampaignsData ? allCampaignsData.data?.totalCount || 0 : undefined;
  const draftsCount = draftsLoading ? countCache.drafts : drafts.length;

  useEffect(() => {
    if (!draftsLoading && isSuperAdmin) writeCountCache(user?.id, { drafts: drafts.length });
  }, [draftsLoading, drafts.length, isSuperAdmin, user?.id]);

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

  // Reset filter if non-superadmin/non-CSM tries to access pending tab, or a non-CSM the All tab
  useEffect(() => {
    if (filter === 'pending' && !isSuperAdmin && !isCSM) {
      setFilter('active');
    }
    if (showAllCampaigns && !isCSM) {
      setShowAllCampaigns(false);
      setFilter('active');
    }
  }, [filter, showAllCampaigns, isSuperAdmin, isCSM]);

  useEffect(() => {
    const tab = showAllCampaigns ? 'all' : filter;
    // Even an unchanged URL is a navigation, which re-renders the whole app, so skip it.
    if ((searchParamsRef.current.get('tab') ?? 'active') === tab) return;
    setSearchParams(
      (prev) => {
        if ((prev.get('tab') ?? 'active') === tab) return prev;
        const next = new URLSearchParams(prev);
        if (tab === 'active') next.delete('tab');
        else next.set('tab', tab);
        return next;
      },
      { replace: true }
    );
  }, [filter, showAllCampaigns, setSearchParams]);

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

    // Storage is written once on leave, not on every scroll event. Leaving through a
    // card clears it on purpose (the saved view restores that case), so keep it cleared.
    const persist = () => {
      if (!isRestoringScroll.current && !localStorage.getItem('lastOpenedCampaignId')) {
        localStorage.setItem('lastScrollPosition', String(scrollOffsetRef.current));
      }
    };
    const handleScroll = () => {
      scrollOffsetRef.current = scrollElement.scrollTop;
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pagehide', persist);

    // eslint-disable-next-line consistent-return
    return () => {
      persist();
      scrollElement.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pagehide', persist);
    };
  }, [mainRef]);

  useEffect(() => {
    if (hasRestoredRef.current) return;
    if (!dataFiltered.length || seekingReturn) return;

    const lastScrollPosition = Number(localStorage.getItem('lastScrollPosition'));
    // Only on the first load with data, so a later page load cannot jump the list
    let lastOpenedIndex = -1;
    if (!returnHandledRef.current) {
      returnHandledRef.current = true;
      localStorage.removeItem('lastOpenedCampaignId');
      if (returnToId) {
        lastOpenedIndex = dataFiltered.findIndex((campaign) => String(campaign?.id) === returnToId);
      }
      if (lastOpenedIndex >= 0) setHighlightId(returnToId);
    }

    requestAnimationFrame(() => {
      isRestoringScroll.current = true;

      if (lastOpenedIndex >= 0) {
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
  }, [
    dataFiltered,
    seekingReturn,
    lastCampaignOpenId,
    lgUp,
    mainRef,
    mdUp,
    rowVirtualizer,
    scrollTop,
    returnToId,
  ]);

  const { scrollY } = useScroll({ container: mainRef });
  const reduceMotion = useReducedMotion();
  const [showModal, setShowModal] = useState(() => (savedView?.offset ?? 0) >= 100);

  useMotionValueEvent(scrollY, 'change', (current) => {
    if (current < 100) setShowModal(false);
    else setShowModal(true);
  });

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
      <PageEnter>
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
                {/* Same tabs as the main row, so roles that cannot see Pending do not get it here */}
                {filterOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant="outlined"
                    aria-pressed={option.value === activeFilterValue}
                    sx={{
                      borderRadius: 10,
                      borderColor: option.value === activeFilterValue && 'white',
                    }}
                    onClick={() => handleSelectFilter(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
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
              data-boot-tabs="active"
              sx={{
                position: 'relative',
                display: { xs: 'none', sm: 'flex' },
                width: { xs: '100%', sm: 'auto' },
                flexWrap: 'wrap',
              }}
            >
              <CampaignTabButton
                value="active"
                label={withCount('Active', activeCount)}
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
                  value="pending"
                  label={withCount('Pending', pendingCount)}
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
                value="completed"
                label={withCount('Completed', completedCount)}
                active={filter === 'completed' && !showAllCampaigns}
                onClick={() => {
                  handleChangeTab('completed');
                  setShowAllCampaigns(false);
                  setSelectedAdmin(null);
                }}
                sx={{ ml: 2 }}
              />
              <CampaignTabButton
                value="paused"
                label={withCount('Paused', pausedCount)}
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
                  value="all"
                  label={withCount('All', allCampaignsCount)}
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
                <Box
                  component="span"
                  sx={{ minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}
                >
                  {withCount(activeFilterOption.label, activeFilterOption.count)}
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
                  {withCount('Drafts', draftsCount)}
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
                    {withCount(option.label, option.count)}
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
                  {withCount('Drafts', draftsCount)}
                </Button>
              )}

              <Button
                onClick={create.onTrue}
                onPointerEnter={loadCreateForm}
                onFocus={loadCreateForm}
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
                  },
                  '@media (hover: hover) and (pointer: fine)': {
                    '&:hover': { opacity: isDisabled ? 1 : 0.9 },
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
              aria-label="New campaign"
              onClick={create.onTrue}
              onPointerDown={loadCreateForm}
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
            layoutDependency={showAllCampaigns}
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
                      sx={{
                        maxWidth: { xs: 120, sm: 320 },
                        color: '#636366',
                        fontSize: 13,
                        fontWeight: 500,
                      }}
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
          <Box
            gap={2}
            display="grid"
            gridTemplateColumns={`repeat(${columns}, 1fr)`}
            sx={{ mt: 2 }}
          >
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

        {!isWaiting &&
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
          ref={listRef}
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
            marginBottom: 40,
            display: hideList ? 'none' : 'block',
            // While the next list loads, the old cards stay put and dim, and cannot be
            // clicked. The dim waits a moment, so a fast load swaps the cards with no dip.
            ...(isLoadingList
              ? { opacity: 0.5, pointerEvents: 'none', transition: 'opacity 150ms ease 100ms' }
              : { opacity: 1, transition: 'none' }),
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
                            ...(isRevealing &&
                              itemIndex >= revealFrom &&
                              itemIndex < revealFrom + REVEAL_LIMIT &&
                              revealSx(itemIndex - revealFrom)),
                          }}
                        >
                          <CampaignCardMotion
                            id={a?.id}
                            isNew={a?.id === publishedId}
                            delayMs={enterDelayMs}
                            onEntered={clearPublished}
                          >
                            <CampaignItem
                              campaign={a}
                              status={a?.status}
                              showAdmins={showAllCampaigns}
                              highlighted={String(a?.id) === highlightId}
                              onHighlightEnd={clearHighlight}
                            />
                          </CampaignCardMotion>
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
              ...dialogEnterSx,
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
          <Suspense fallback={null}>
            <CreateCampaignFormV2 onClose={handleCloseCreate} mutate={mutate} />
          </Suspense>
        </Dialog>
      </PageEnter>
    </Container>
  );
};

export default CampaignView;
