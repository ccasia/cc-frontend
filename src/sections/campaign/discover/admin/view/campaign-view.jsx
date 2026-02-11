import useSWR from 'swr';
import { debounce } from 'lodash';
import useSWRInfinite from 'swr/infinite';
import { m, AnimatePresence } from 'framer-motion';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';
import {
  Box,
  Stack,
  Button,
  Dialog,
  Avatar,
  Container,
  InputBase,
  TextField,
  Typography,
  IconButton,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
// Removed useGetAdminsForSuperadmin - using direct SWR call to /api/user/alladmins for CSM access
// import useGetCampaigns from 'src/hooks/use-get-campaigns';

import { useVirtualizer } from '@tanstack/react-virtual';

import { fetcher } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { useMainContext } from 'src/layouts/dashboard/hooks/dsahboard-context';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CampaignTabs from 'src/components/campaign/CampaignTabs';

import CreateCampaignFormV2 from 'src/sections/campaign/create/form-v2'

import CampaignItem from '../campaign-item';

const CampaignView = () => {
  const settings = useSettingsContext();

  const lastCampaignOpenId = localStorage.getItem('lastCampaignOpenId');
  const pageSizing = localStorage.getItem('pageSizing');
  const scrollTop = localStorage.getItem('scrollTop');

  const [search, setSearch] = useState({
    query: '',
    results: [],
  });

  const [debouncedQuery, setDebouncedQuery] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetQuery = useCallback(
    debounce((q) => setDebouncedQuery(q), 300), // 300ms delay
    []
  );

  const create = useBoolean();

  const [filter, setFilter] = useState('active');
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const hasRestoredRef = useRef(false);
  const isRestoringScroll = useRef(null);

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
        // Only include CSM admins
        const roleName = adminUser.admin?.role?.name;
        return roleName === 'CSM' || roleName === 'Customer Success Manager';
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .map((adminUser) => ({
        id: adminUser.id,
        name: adminUser.name || 'Unknown',
        photoURL: adminUser.photoURL,
        role: adminUser.admin?.role?.name || 'CSM',
      }));
  }, [adminsData]);

  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const { user } = useAuthContext();

  const { mainRef } = useMainContext();

  const lgUp = useResponsive('up', 'lg');
  const mdUp = useResponsive('up', 'md');

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  // Check if user is superadmin
  const isSuperAdmin = useMemo(
    () => user?.admin?.mode === 'god' || user?.admin?.role?.name === 'CSL',
    [user]
  );

  // Check if user is a CSM admin (not advanced mode)
  const isCSM = useMemo(
    () =>
      (user?.admin?.role?.name === 'CSM' ||
        user?.admin?.role?.name === 'Customer Success Manager') &&
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
      return `/api/campaign/getAllCampaignsByAdminId/${user?.id}?search=${encodeURIComponent(debouncedQuery)}&status=${status}&limit=${10}${excludeParam}${filterAdminParam}`;
    }

    // If there's no more data (previousPageData is empty or no nextCursor), stop fetching
    if (!previousPageData?.metaData?.lastCursor) return null;

    // Otherwise, use the nextCursor to get the next page
    let status = showAllCampaigns ? '' : filter.toUpperCase();
    if (filter === 'pending' && !showAllCampaigns) {
      // For pending tab, we need to search for all pending statuses
      status = 'SCHEDULED,PENDING_CSM_REVIEW,PENDING_ADMIN_ACTIVATION';
    }
    return `/api/campaign/getAllCampaignsByAdminId/${user?.id}?search=${encodeURIComponent(debouncedQuery)}&status=${status}&limit=${10}&cursor=${previousPageData?.metaData?.lastCursor}${excludeParam}${filterAdminParam}`;
  };

  const { data, size, setSize, isValidating, mutate, isLoading } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
  });

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
    overscan: 2,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const isLoadingMore = isValidating && dataFiltered && dataFiltered?.length > size;
  const isReachingEnd = data && data[data.length - 1]?.metaData?.lastCursor === null;

  useEffect(() => {
    const [lastItem] = [...virtualRows].reverse();

    if (!lastItem) return;

    // Trigger load when scrolled to last 2 rows (not items)
    if (lastItem.index >= rowCount - 2 && !isValidating && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [virtualRows, rowCount, isReachingEnd, setSize, size, isValidating]);

  // Make mutate function available globally for campaign activation
  useEffect(() => {
    window.swrMutate = mutate;
    return () => {
      delete window.swrMutate;
    };
  }, [mutate]);

  const { data: campaignStatusData, isLoading: campaignStatusLoading } = useSWR(
    '/api/campaign/campaignStatus',
    fetcher
  );

  // Fetch count for "All Campaigns" (other admins' active campaigns) - only for CSM users
  const { data: allCampaignsData } = useSWR(
    isCSM
      ? `/api/campaign/getAllCampaignsByAdminId/${user?.id}?status=&excludeOwn=true&limit=500`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Use independent datasets for counts so they persist regardless of the current tab
  const activeCount = campaignStatusData?.activeCampaigns || 0;
  const completedCount = campaignStatusData?.completedCampaigns || 0;
  const pausedCount = campaignStatusData?.pausedCampaigns || 0;
  const pendingCount = campaignStatusData?.pendingCampaigns || 0;
  const allCampaignsCount = allCampaignsData?.data?.campaigns?.length || 0;

  // Restore smDown and menu handlers
  const smDown = useResponsive('down', 'sm');

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNewCampaign = () => {
    create.onTrue();
    handleClose();
  };

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
    if (
      filter === 'pending' &&
      !isSuperAdmin &&
      user?.admin?.role?.name !== 'CSM' &&
      user?.admin?.role?.name !== 'Customer Success Manager'
    ) {
      setFilter('active');
    }
  }, [filter, isSuperAdmin, user]);

  const handleChangeTab = (value) => {
    setFilter(value);
    if (scrollTop) {
      localStorage.removeItem('scrollTop');
    }
  };

  useEffect(() => {
    const scrollElement = mainRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      // Don't save scroll position while we're restoring it
      if (isRestoringScroll.current) {
        if (localStorage.getItem('lastOpenedIndex')) {
          localStorage.removeItem('lastOpenedIndex');
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
      } else if (!Number.isNaN(lastScrollPosition) && lastScrollPosition > 0 && mainRef.current) {
        console.log('SADSADASDS');
        mainRef.current.scrollTop = lastScrollPosition;
      }

      // Priority 1: Restore last scroll position (more recent user action)
      // if (!Number.isNaN(lastScrollPosition) && lastScrollPosition > 0 && mainRef.current) {
      //   // mainRef.current.scrollTop = lastScrollPosition;
      // }
      // // Priority 2: Scroll to last opened item if no scroll position
      // else if (
      //   !Number.isNaN(lastOpenedIndex) &&
      //   lastOpenedIndex >= 0 &&
      //   lastOpenedIndex < dataFiltered.length
      // ) {
      //   // eslint-disable-next-line no-nested-ternary
      //   const cols = lgUp ? 3 : mdUp ? 2 : 1;
      //   const rowIndex = Math.floor(lastOpenedIndex / cols);
      //   rowVirtualizer.scrollToIndex(rowIndex + 1, { align: 'start' });
      // }

      // Allow scroll tracking after a short delay
      setTimeout(() => {
        isRestoringScroll.current = false;
      }, 50);
    });
  }, [dataFiltered, lastCampaignOpenId, lgUp, mainRef, mdUp, rowVirtualizer, scrollTop]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
      <Typography
        variant="h2"
        sx={{
          mb: 2,
          fontFamily: 'fontSecondaryFamily',
          fontWeight: 'normal',
        }}
      >
        Manage Campaigns ✨
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
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              flexWrap: 'wrap',
            }}
          >
            <Button
              disableRipple
              size="large"
              onClick={() => {
                handleChangeTab('active');
                setShowAllCampaigns(false);
                setSelectedAdmin(null);
              }}
              sx={{
                px: 0.5,
                py: 0.5,
                pb: 1,
                minWidth: 'fit-content',
                color: filter === 'active' && !showAllCampaigns ? theme.palette.common : '#8e8e93',
                position: 'relative',
                fontSize: '1.05rem',
                fontWeight: 650,
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
                  width: filter === 'active' && !showAllCampaigns ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'scaleX(1)',
                  transformOrigin: 'left',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: filter === 'active' && !showAllCampaigns ? 1 : 0.5,
                  },
                },
              }}
            >
              Active ({activeCount})
            </Button>
            {/* Show Pending tab for superadmins and CSM users */}
            {(isSuperAdmin ||
              user?.admin?.role?.name === 'CSM' ||
              user?.admin?.role?.name === 'Customer Success Manager') && (
              <Button
                disableRipple
                size="large"
                onClick={() => {
                  handleChangeTab('pending');
                  setShowAllCampaigns(false);
                  setSelectedAdmin(null);
                }}
                sx={{
                  px: 1,
                  py: 0.5,
                  pb: 1,
                  ml: 2,
                  minWidth: 'fit-content',
                  color:
                    filter === 'pending' && !showAllCampaigns ? theme.palette.common : '#8e8e93',
                  position: 'relative',
                  fontSize: '1.05rem',
                  fontWeight: 650,
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
                    width: filter === 'pending' && !showAllCampaigns ? '100%' : '0%',
                    bgcolor: '#1340ff',
                    transition: 'all 0.3s ease-in-out',
                    transform: 'scaleX(1)',
                    transformOrigin: 'left',
                  },
                  '&:hover': {
                    bgcolor: 'transparent',
                    '&::after': {
                      width: '100%',
                      opacity: filter === 'pending' && !showAllCampaigns ? 1 : 0.5,
                    },
                  },
                }}
              >
                Pending ({pendingCount})
              </Button>
            )}
            <Button
              disableRipple
              size="large"
              onClick={() => {
                handleChangeTab('completed');
                setShowAllCampaigns(false);
                setSelectedAdmin(null);
              }}
              sx={{
                px: 1,
                py: 0.5,
                pb: 1,
                ml: 2,
                minWidth: 'fit-content',
                color:
                  filter === 'completed' && !showAllCampaigns ? theme.palette.common : '#8e8e93',
                position: 'relative',
                fontSize: '1.05rem',
                fontWeight: 650,
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
                  width: filter === 'completed' && !showAllCampaigns ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'scaleX(1)',
                  transformOrigin: 'left',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: filter === 'completed' && !showAllCampaigns ? 1 : 0.5,
                  },
                },
              }}
            >
              Completed ({completedCount})
            </Button>
            <Button
              disableRipple
              size="large"
              onClick={() => {
                handleChangeTab('paused');
                setShowAllCampaigns(false);
                setSelectedAdmin(null);
              }}
              sx={{
                px: 1,
                py: 0.5,
                pb: 1,
                ml: 2,
                minWidth: 'fit-content',
                color: filter === 'paused' && !showAllCampaigns ? theme.palette.common : '#8e8e93',
                position: 'relative',
                fontSize: '1.05rem',
                fontWeight: 650,
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
                  width: filter === 'paused' && !showAllCampaigns ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'scaleX(1)',
                  transformOrigin: 'left',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: filter === 'paused' && !showAllCampaigns ? 1 : 0.5,
                  },
                },
              }}
            >
              Paused ({pausedCount})
            </Button>
            {/* All Campaigns tab - only visible to CSM admins */}
            {isCSM && (
              <Button
                disableRipple
                size="large"
                onClick={() => {
                  setFilter('');
                  setShowAllCampaigns(true);
                }}
                sx={{
                  px: 1,
                  py: 0.5,
                  pb: 1,
                  ml: 2,
                  minWidth: 'fit-content',
                  color: showAllCampaigns ? theme.palette.common : '#8e8e93',
                  position: 'relative',
                  fontSize: '1.05rem',
                  fontWeight: 650,
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
                    width: showAllCampaigns ? '100%' : '0%',
                    bgcolor: '#1340ff',
                    transition: 'all 0.3s ease-in-out',
                    transform: 'scaleX(1)',
                    transformOrigin: 'left',
                  },
                  '&:hover': {
                    bgcolor: 'transparent',
                    '&::after': {
                      width: '100%',
                      opacity: showAllCampaigns ? 1 : 0.5,
                    },
                  },
                }}
              >
                All ({allCampaignsCount})
              </Button>
            )}
          </Stack>

          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Button
              onClick={create.onTrue}
              startIcon={<Iconify icon="eva:plus-fill" width={20} height={20} />}
              disabled={isDisabled}
              sx={{
                bgcolor: isDisabled ? '#e0e0e0' : '#203ff5',
                color: isDisabled ? '#9e9e9e' : 'white',
                borderBottom: isDisabled ? '3px solid #bdbdbd' : '3px solid #102387',
                borderRadius: '8px',
                padding: '8px 20px',
                position: 'absolute',
                right: 0,
                top: -3,
                minWidth: '150px',
                fontSize: '0.9rem',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                '&:hover': {
                  bgcolor: isDisabled ? '#e0e0e0' : '#203ff5',
                  opacity: isDisabled ? 1 : 0.9,
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
              '&:hover': {
                bgcolor: '#203ff5',
                opacity: 0.9,
              },
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
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
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
            placeholder="Search"
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
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 262, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden', flexShrink: 0, display: 'flex' }}
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

      {(isLoading || campaignStatusLoading) && (
        <Box sx={{ position: 'relative', top: 200, textAlign: 'center' }}>
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

      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
          marginBottom: 40,
        }}
      >
        {virtualRows.map((virtualRow) => {
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
                {rowCampaigns?.map((a, index) => (
                  <CampaignItem
                    index={index + startIndex}
                    key={a?.id}
                    campaign={a}
                    status={a?.status}
                    showAdmins={showAllCampaigns}
                  />
                ))}
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
        <CreateCampaignFormV2 onClose={create.onFalse} mutate={mutate} />
      </Dialog>
    </Container>
  );
};

export default CampaignView;
