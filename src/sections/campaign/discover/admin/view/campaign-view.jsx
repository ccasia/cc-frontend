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
import useGetCampaigns from 'src/hooks/use-get-campaigns';

import { fetcher } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { useMainContext } from 'src/layouts/dashboard/hooks/dsahboard-context';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CampaignTabs from 'src/components/campaign/CampaignTabs';
import EmptyContent from 'src/components/empty-content/empty-content';

import CreateCampaignForm from 'src/sections/campaign/create/form';

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

  const { campaigns } = useGetCampaigns();

  const create = useBoolean();

  const [filter, setFilter] = useState('active');

  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const { user } = useAuthContext();

  const { mainRef } = useMainContext();

  const lgUp = useResponsive('up', 'lg');

  const isDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );

  // Check if user is superadmin
  const isSuperAdmin = useMemo(
    () => user?.admin?.mode === 'god' || user?.admin?.mode === 'advanced',
    [user]
  );

  const getKey = (pageIndex, previousPageData) => {
    // If there's no previous page data, start from the first page
    if (pageIndex === 0) {
      let status = filter.toUpperCase();
      if (filter === 'pending') {
        // For pending tab, we need to search for both statuses
        status = 'SCHEDULED,PENDING_CSM_REVIEW';
      }
      return `/api/campaign/getAllCampaignsByAdminId/${user?.id}?search=${encodeURIComponent(debouncedQuery)}&status=${status}&limit=${10}`;
    }

    // If there's no more data (previousPageData is empty or no nextCursor), stop fetching
    if (!previousPageData?.metaData?.lastCursor) return null;

    // Otherwise, use the nextCursor to get the next page
    let status = filter.toUpperCase();
    if (filter === 'pending') {
      // For pending tab, we need to search for both statuses
      status = 'SCHEDULED,PENDING_CSM_REVIEW';
    }
    return `/api/campaign/getAllCampaignsByAdminId/${user?.id}?search=${encodeURIComponent(debouncedQuery)}&status=${status}&limit=${10}&cursor=${previousPageData?.metaData?.lastCursor}`;
  };

  const { data, size, setSize, isValidating, mutate, isLoading } = useSWRInfinite(getKey, fetcher);

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

  const activeCampaigns = useMemo(
    () => campaigns?.filter((campaign) => campaign?.status === 'ACTIVE') || [],
    [campaigns]
  );
  const completedCampaigns = useMemo(
    () => campaigns?.filter((campaign) => campaign?.status === 'COMPLETED') || [],
    [campaigns]
  );
  const pausedCampaigns = useMemo(
    () => campaigns?.filter((campaign) => campaign?.status === 'PAUSED') || [],
    [campaigns]
  );
  const pendingCampaigns = useMemo(
    () => campaigns?.filter((campaign) => 
      campaign?.status === 'PENDING_CSM_REVIEW' || 
      campaign?.status === 'SCHEDULED'
    ) || [],
    [campaigns]
  );

  const activeCount = activeCampaigns.length;
  const completedCount = completedCampaigns.length;
  const pausedCount = pausedCampaigns.length;
  const pendingCount = pendingCampaigns.length;

  const dataFiltered = useMemo(
    () => (data ? data?.flatMap((item) => item?.data?.campaigns) : []),
    [data]
  );

  // Add console logging to debug pending campaigns
  useEffect(() => {
    if (filter === 'pending') {
      console.log('Pending filter active');
      console.log('Pending campaigns in memory:', pendingCampaigns);
      console.log('Data from API:', data);
      console.log('Filtered data:', dataFiltered);
    }
  }, [filter, pendingCampaigns, data, dataFiltered]);

  // Reset filter if non-superadmin tries to access pending tab
  useEffect(() => {
    if (filter === 'pending' && !isSuperAdmin) {
      setFilter('active');
    }
  }, [filter, isSuperAdmin]);

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
            {/* Only show Pending tab for superadmins */}
            {isSuperAdmin && (
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
              onClick={handleClick}
              endIcon={<Iconify icon="eva:chevron-down-fill" width={20} height={20} />}
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
            onClick={handleClick}
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

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: { xs: -8, sm: 0 },
            mb: { xs: 1, sm: 1 },
            width: 200,
            bgcolor: 'white',
            border: '1px solid #e7e7e7',
            borderBottom: '2px solid #e7e7e7',
            borderRadius: 1,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              borderRadius: 1,
              color: '#000000',
              fontWeight: 600,
              fontSize: '0.95rem',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            },
          },
        }}
      >
        <MenuItem onClick={handleNewCampaign} disabled={isDisabled}>
          <Iconify icon="ph:sparkle-fill" width={20} height={20} sx={{ mr: 2 }} />
          New Campaign
        </MenuItem>
        {/* <MenuItem onClick={handleClose}>
          <Iconify icon="mdi:note-text" width={20} height={20} sx={{ mr: 2 }} />
          Drafts
        </MenuItem> */}
      </Menu>

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
            title={`No ${
              filter === 'active'
                ? 'active'
                : filter === 'completed'
                ? 'completed'
                : filter === 'pending'
                ? 'pending'
                : filter === 'paused'
                ? 'paused'
                : filter
            } campaigns available`}
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
        <CreateCampaignForm onClose={create.onFalse} mutate={mutate} />
      </Dialog>
    </Container>
  );
};

export default CampaignView;
