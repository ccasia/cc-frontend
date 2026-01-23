import useSWR from 'swr';
import { debounce } from 'lodash';
import useSWRInfinite from 'swr/infinite';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Stack,
  Button,
  Dialog,
  Container,
  InputBase,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
// import useGetCampaigns from 'src/hooks/use-get-campaigns';

import { fetcher } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { useMainContext } from 'src/layouts/dashboard/hooks/dsahboard-context';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CampaignTabs from 'src/components/campaign/CampaignTabs';
import EmptyContent from 'src/components/empty-content/empty-content';

import CreateCampaignFormV2 from 'src/sections/campaign/create/form-v2';

import CampaignLists from '../campaign-list';

const CampaignView = () => {
  const settings = useSettingsContext();

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

  // Remove the useGetCampaigns hook since we're using useSWRInfinite for the actual data
  // const { campaigns } = useGetCampaigns();

  const create = useBoolean();

  const [filter, setFilter] = useState('active');

  const theme = useTheme();

  const { user } = useAuthContext();

  const { mainRef } = useMainContext();

  const lgUp = useResponsive('up', 'lg');

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  // Check if user is superadmin
  const isSuperAdmin = useMemo(
    () => user?.admin?.mode === 'god' || user?.admin?.role?.name === 'CSL',
    [user]
  );

  const getKey = (pageIndex, previousPageData) => {
    // If there's no previous page data, start from the first page
    if (pageIndex === 0) {
      let status = filter.toUpperCase();
      if (filter === 'pending') {
              // For pending tab, we need to search for all pending statuses
      status = 'SCHEDULED,PENDING_CSM_REVIEW,PENDING_ADMIN_ACTIVATION';
      }
      return `/api/campaign/getAllCampaignsByAdminId/${user?.id}?search=${encodeURIComponent(debouncedQuery)}&status=${status}&limit=${10}`;
    }

    // If there's no more data (previousPageData is empty or no nextCursor), stop fetching
    if (!previousPageData?.metaData?.lastCursor) return null;

    // Otherwise, use the nextCursor to get the next page
    let status = filter.toUpperCase();
    if (filter === 'pending') {
      // For pending tab, we need to search for all pending statuses
      status = 'SCHEDULED,PENDING_CSM_REVIEW,PENDING_ADMIN_ACTIVATION';
    }
    return `/api/campaign/getAllCampaignsByAdminId/${user?.id}?search=${encodeURIComponent(debouncedQuery)}&status=${status}&limit=${10}&cursor=${previousPageData?.metaData?.lastCursor}`;
  };

  const { data, size, setSize, isValidating, mutate, isLoading } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
  });
  
  // Make mutate function available globally for campaign activation
  React.useEffect(() => {
    window.swrMutate = mutate;
    return () => {
      delete window.swrMutate;
    };
  }, [mutate]);

  const dataFiltered = useMemo(
    () => (data ? data?.flatMap((item) => item?.data?.campaigns) : []),
    [data]
  );

  // Persistent counts across tabs: fetch per-status counts independently of current filter
  const buildCountKey = useCallback((statusString) => 
     `/api/campaign/getAllCampaignsByAdminId/${user?.id}?search=${encodeURIComponent(
      debouncedQuery
    )}&status=${statusString}&limit=${500}` // larger limit to approximate full count
  , [user?.id, debouncedQuery]);

  const { data: activeData } = useSWR(buildCountKey('ACTIVE'), fetcher, { revalidateOnFocus: false });
  const { data: completedData } = useSWR(buildCountKey('COMPLETED'), fetcher, { revalidateOnFocus: false });
  const { data: pausedData } = useSWR(buildCountKey('PAUSED'), fetcher, { revalidateOnFocus: false });
  const { data: pendingData } = useSWR(
    buildCountKey('SCHEDULED,PENDING_CSM_REVIEW,PENDING_ADMIN_ACTIVATION'),
    fetcher,
    { revalidateOnFocus: false }
  );

  // Use independent datasets for counts so they persist regardless of the current tab
  const activeCount = activeData?.data?.campaigns?.length || 0;
  const completedCount = completedData?.data?.campaigns?.length || 0;
  const pausedCount = pausedData?.data?.campaigns?.length || 0;
  const pendingCount = pendingData?.data?.campaigns?.length || 0;

  // Restore smDown and menu handlers
  const smDown = useResponsive('down', 'sm');

  const handleNewCampaign = () => {
    create.onTrue();
  };

  useEffect(() => {
    // Debug: verify counts persist across tabs
    console.log('[CampaignView] Counts -> Active:', activeCount, 'Pending:', pendingCount, 'Completed:', completedCount, 'Paused:', pausedCount);
  }, [activeCount, pendingCount, completedCount, pausedCount]);

  // Reset filter if non-superadmin/non-CSM tries to access pending tab
  useEffect(() => {
    if (filter === 'pending' && !isSuperAdmin && user?.admin?.role?.name !== 'CSM' && user?.admin?.role?.name !== 'Customer Success Manager') {
      setFilter('active');
    }
  }, [filter, isSuperAdmin, user]);

  const handleScroll = useCallback(() => {
    const scrollContainer = lgUp ? mainRef?.current : document.documentElement;

    const bottom =
      scrollContainer.scrollHeight <= scrollContainer.scrollTop + scrollContainer.clientHeight + 1;

    if (bottom && !isValidating && data[data.length - 1]?.metaData?.lastCursor) {
      setSize(size + 1);
    }
  }, [data, isValidating, setSize, size, mainRef, lgUp]);

  useEffect(() => {
    const scrollContainer = lgUp ? mainRef?.current : window;

    scrollContainer.addEventListener('scroll', handleScroll);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, mainRef, lgUp]);

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
              onClick={() => setFilter('active')}
              sx={{
                px: 0.5,
                py: 0.5,
                pb: 1,
                minWidth: 'fit-content',
                color: filter === 'active' ? theme.palette.common : '#8e8e93',
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
                  width: filter === 'active' ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'scaleX(1)',
                  transformOrigin: 'left',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: filter === 'active' ? 1 : 0.5,
                  },
                },
              }}
            >
              Active ({activeCount})
            </Button>
            {/* Show Pending tab for superadmins and CSM users */}
            {(isSuperAdmin || user?.admin?.role?.name === 'CSM' || user?.admin?.role?.name === 'Customer Success Manager') && (
              <Button
                disableRipple
                size="large"
                onClick={() => setFilter('pending')}
                sx={{
                  px: 1,
                  py: 0.5,
                  pb: 1,
                  ml: 2,
                  minWidth: 'fit-content',
                  color: filter === 'pending' ? theme.palette.common : '#8e8e93',
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
                    width: filter === 'pending' ? '100%' : '0%',
                    bgcolor: '#1340ff',
                    transition: 'all 0.3s ease-in-out',
                    transform: 'scaleX(1)',
                    transformOrigin: 'left',
                  },
                  '&:hover': {
                    bgcolor: 'transparent',
                    '&::after': {
                      width: '100%',
                      opacity: filter === 'pending' ? 1 : 0.5,
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
              onClick={() => setFilter('completed')}
              sx={{
                px: 1,
                py: 0.5,
                pb: 1,
                ml: 2,
                minWidth: 'fit-content',
                color: filter === 'completed' ? theme.palette.common : '#8e8e93',
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
                  width: filter === 'completed' ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'scaleX(1)',
                  transformOrigin: 'left',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: filter === 'completed' ? 1 : 0.5,
                  },
                },
              }}
            >
              Completed ({completedCount})
            </Button>
            <Button
              disableRipple
              size="large"
              onClick={() => setFilter('paused')}
              sx={{
                px: 1,
                py: 0.5,
                pb: 1,
                ml: 2,
                minWidth: 'fit-content',
                color: filter === 'paused' ? theme.palette.common : '#8e8e93',
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
                  width: filter === 'paused' ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'scaleX(1)',
                  transformOrigin: 'left',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: filter === 'paused' ? 1 : 0.5,
                  },
                },
              }}
            >
              Paused ({pausedCount})
            </Button>
          </Stack>

          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Button
              onClick={handleNewCampaign}
              disabled={isDisabled}
              sx={{
                bgcolor: isDisabled ? '#e0e0e0' : '#203ff5',
                color: isDisabled ? '#9e9e9e' : 'white',
                borderBottom: isDisabled ? '3px solid #bdbdbd' : '3px solid #102387',
                borderRadius: '8px',
                px: 2.5,
                py: 1,
                position: 'absolute',
                right: 0,
                top: -3,
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
        </Stack>
      </Box>

      <Box
        sx={{
          width: '100%',
          border: '1px solid',
          borderBottom: '3.5px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
        }}
      >
        <InputBase
          value={search.query}
          onChange={(e) => {
            setSearch((prev) => ({ ...prev, query: e.target.value }));
            debouncedSetQuery(e.target.value);
          }}
          placeholder="Search"
          startAdornment={
            <Iconify
              icon="eva:search-fill"
              sx={{ width: 20, height: 20, mr: 1, color: 'text.disabled', ml: 1 }}
            />
          }
          sx={{
            width: '100%',
            color: 'text.primary',
            '& input': {
              py: 1,
              px: 1,
            },
          }}
        />
      </Box>

      {isLoading && (
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

      {!isLoading &&
        (dataFiltered?.length > 0 ? (
          <Box mt={2}>
            <CampaignLists campaigns={dataFiltered} />
            {isValidating && (
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
          </Box>
        ) : (
          <EmptyContent
            title={`No ${(() => {
              if (filter === 'active') return 'active';
              if (filter === 'completed') return 'completed';
              if (filter === 'pending') return 'pending';
              if (filter === 'paused') return 'paused';
              return filter;
            })()} campaigns available`}
          />
        ))}
      {/* <CampaignFilter
        open={openFilters.value}
        onOpen={openFilters.onTrue}
        onClose={openFilters.onFalse}
        //
        filters={filters}
        onFilters={handleFilters}
        reset={handleResetFitlers}
        brands={brandOptions}
      /> */}
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
