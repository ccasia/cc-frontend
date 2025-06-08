import { m } from 'framer-motion';
import useSWRInfinite from 'swr/infinite';
import { enqueueSnackbar } from 'notistack';
import { orderBy, debounce, throttle } from 'lodash';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import {
  Fab,
  Box,
  Stack,
  Button,
  Select,
  Divider,
  MenuItem,
  InputBase,
  IconButton,
  Typography,
  ListItemText,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import { fetcher } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';
import { useMainContext } from 'src/layouts/dashboard/hooks/dsahboard-context';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { useSettingsContext } from 'src/components/settings';

import CreatorForm from 'src/sections/creator/form/creatorForm';

import CampaignLists from '../campaign-list';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// Check
export default function CampaignListView() {
  const settings = useSettingsContext();
  // const { campaigns } = useGetCampaigns('creator');

  const [filter, setFilter] = useState('all');

  const { mainRef } = useMainContext();

  const lgUp = useResponsive('up', 'lg');

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

  // Search input ref for keyboard shortcut focus
  const searchInputRef = useRef(null);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for CMD+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getKey = (pageIndex, previousPageData) => {
    // If there's no previous page data, start from the first page
    if (pageIndex === 0)
      return `/api/campaign/matchCampaignWithCreator?search=${encodeURIComponent(debouncedQuery)}&take=${10}`;

    // If there's no more data (previousPageData is empty or no nextCursor), stop fetching
    if (!previousPageData?.metaData?.lastCursor) return null;

    // Otherwise, use the nextCursor to get the next page
    return `/api/campaign/matchCampaignWithCreator?search=${encodeURIComponent(debouncedQuery)}&take=${10}&cursor=${previousPageData?.metaData?.lastCursor}`;
  };

  const { data, size, setSize, isValidating, isLoading, mutate } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
  });

  const { user } = useAuthContext();
  const dialog = useBoolean(!user?.creator?.isOnBoardingFormCompleted);
  const backdrop = useBoolean(!user?.creator?.isFormCompleted);

  const load = useBoolean();
  const [upload, setUpload] = useState([]);
  const { socket } = useSocketContext();
  const smUp = useResponsive('up', 'sm');

  const [sortBy, setSortBy] = useState('');

  const theme = useTheme();

  const [showScrollTop, setShowScrollTop] = useState(false);

  // const [page, setPage] = useState(1);
  // const MAX_ITEM = 9;

  // const onOpenCreatorForm = () => {
  //   backdrop.onTrue();
  //   dialog.onTrue();
  // };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    // Define the handler function
    const handlePitchLoading = (val) => {
      if (upload.find((item) => item.campaignId === val.campaignId)) {
        setUpload((prev) =>
          prev.map((item) =>
            item.campaignId === val.campaignId
              ? {
                  campaignId: val.campaignId,
                  loading: true,
                  progress: Math.floor(val.progress),
                }
              : item
          )
        );
      } else {
        setUpload((item) => [
          ...item,
          { loading: true, campaignId: val.campaignId, progress: Math.floor(val.progress) },
        ]);
      }
    };

    const handlePitchSuccess = (val) => {
      mutate();
      enqueueSnackbar(val.name);
      setUpload((prevItems) => prevItems.filter((item) => item.campaignId !== val.campaignId));
    };

    // Attach the event listener
    socket?.on('pitch-loading', handlePitchLoading);
    socket?.on('pitch-uploaded', handlePitchSuccess);

    // Clean-up function
    return () => {
      socket?.off('pitch-loading', handlePitchLoading);
      socket?.off('pitch-uploaded', handlePitchSuccess);
    };
  }, [socket, upload, mutate]);

  const renderUploadProgress = (
    <Box
      component={m.div}
      transition={{ ease: 'easeInOut', duration: 0.4 }}
      animate={load.value ? { height: 400 } : { height: 50 }}
      sx={{
        position: 'fixed',
        bottom: 0,
        right: smUp ? 50 : 0,
        width: smUp ? 300 : '100vw',
        height: load.value ? 400 : 50,
        bgcolor: theme.palette.background.default,
        boxShadow: 20,
        border: 1,
        borderBottom: 0,
        borderRadius: '10px 10px 0 0',
        borderColor: 'text.secondary',
        p: 2,
      }}
    >
      {/* Header */}
      <Box sx={{ position: 'absolute', top: 10 }}>
        <Stack direction="row" gap={1.5} alignItems="center">
          <IconButton
            sx={{
              transform: load.value ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
            onClick={load.onToggle}
          >
            <Iconify icon="bxs:up-arrow" />
          </IconButton>
          <Typography variant="subtitle2">Uploading {upload.length} files</Typography>
        </Stack>
      </Box>

      <Stack mt={5} gap={2}>
        {upload.map((elem) => (
          <>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <ListItemText
                primary={
                  filteredData && filteredData.find((item) => item.id === elem.campaignId)?.name
                }
                secondary="Uploading pitch"
                primaryTypographyProps={{ variant: 'subtitle1' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              <CircularProgress
                variant="determinate"
                value={elem.progress}
                size={20}
                thickness={7}
              />
            </Stack>
            <Divider sx={{ borderStyle: 'dashed' }} />
          </>
        ))}
      </Stack>
    </Box>
  );

  // const handlePageChange = (event, value) => {
  //   setPage(value);
  // };

  // const filteredData = useMemo(() => {
  //   const indexOfLastItem = page * MAX_ITEM;
  //   const indexOfFirstItem = indexOfLastItem - MAX_ITEM;

  // return applyFilter({
  //   inputData: campaigns
  //     ?.filter((campaign) => campaign?.status === 'ACTIVE')
  //     ?.slice(indexOfFirstItem, indexOfLastItem),
  //   filter,
  //   user,
  //   sortBy,
  //   search,
  // });
  // }, [campaigns, filter, user, sortBy, page, search]);

  const filteredData = useMemo(() => {
    const campaigns = data ? data?.flatMap((item) => item?.data?.campaigns) : [];

    return applyFilter({
      inputData: campaigns?.filter((campaign) => campaign?.status === 'ACTIVE'),
      filter,
      user,
      sortBy,
      search,
    });
  }, [data, filter, user, sortBy, search]);

  // const filteredData = useMemo(
  //   () => (data ? data?.flatMap((item) => item?.data?.campaigns) : []),
  //   [data]
  // );

  // const handleSearch = useCallback(
  //   (inputValue) => {
  //     setSearch((prevState) => ({
  //       ...prevState,
  //       query: inputValue,
  //     }));

  //     if (inputValue && filteredData) {
  //       const filteredCampaigns = applyFilter({ inputData: filteredData, filter, user });
  //       const results = filteredCampaigns.filter(
  //         (campaign) =>
  //           campaign.name.toLowerCase().includes(inputValue.toLowerCase()) ||
  //           campaign.company.name.toLowerCase().includes(inputValue.toLowerCase())
  //       );

  //       setSearch((prevState) => ({
  //         ...prevState,
  //         results,
  //       }));
  //     }
  //   },
  //   [filteredData, filter, user]
  // );

  // const handleScroll = useCallback(() => {
  //   if (!scrollContainerRef.current) return;

  //   const bottom =
  //     scrollContainerRef.current.scrollHeight <=
  //     scrollContainerRef.current.scrollTop + scrollContainerRef.current.clientHeight + 1;

  //   if (bottom && !isValidating && data[data.length - 1]?.metaData?.lastCursor) {
  //     setSize(size + 1);
  //   }
  // }, [data, isValidating, setSize, size]);

  // useEffect(() => {
  //   const scrollContainer = scrollContainerRef.current;
  //   if (!scrollContainer) return;

  //   const scrollListener = () => handleScroll();
  //   scrollContainer.addEventListener('scroll', scrollListener);
  //   // eslint-disable-next-line consistent-return
  //   return () => {
  //     scrollContainer.removeEventListener('scroll', scrollListener);
  //   };
  // }, [data, isValidating, size, setSize, handleScroll]);

  const handleScroll = useCallback(() => {
    if (lgUp) {
      // Desktop view handler
      if (!mainRef?.current) return; // Early return if ref not available

      const scrollContainer = mainRef.current;
      const bottom =
        scrollContainer.scrollHeight <=
        scrollContainer.scrollTop + scrollContainer.clientHeight + 1;

      if (
        bottom &&
        !isValidating &&
        data &&
        data.length > 0 &&
        data[data.length - 1]?.metaData?.lastCursor
      ) {
        setSize(size + 1);
      }
    } else {
      // Mobile view handler
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;
      const scrolled = window.scrollY;

      // checks if user has scrolled to bottom
      const isAtBottom = windowHeight + scrolled + 50 >= documentHeight;

      if (
        isAtBottom &&
        !isValidating &&
        data &&
        data.length > 0 &&
        data[data.length - 1]?.metaData?.lastCursor
      ) {
        setSize((currentSize) => currentSize + 1);
      }
    }
  }, [data, isValidating, setSize, size, mainRef, lgUp]);

  useEffect(() => {
    const scrollElement = lgUp ? mainRef?.current : window;

    if (!scrollElement) {
      return undefined;
    }

    const handleScrollThrottled = throttle(handleScroll, 200);

    scrollElement.addEventListener('scroll', handleScrollThrottled);

    // also checks scroll position on content load
    handleScrollThrottled();

    return () => {
      scrollElement.removeEventListener('scroll', handleScrollThrottled);
      handleScrollThrottled.cancel();
    };
  }, [handleScroll, mainRef, lgUp]);

  // const sortCampaigns = (campaigns) => {
  //   if (!campaigns) return [];

  //   switch (sortBy) {
  //     case 'Highest':
  //       return [...campaigns].sort((a, b) => (b.percentageMatch || 0) - (a.percentageMatch || 0));
  //     case 'Lowest':
  //       return [...campaigns].sort((a, b) => (a.percentageMatch || 0) - (b.percentageMatch || 0));
  //     default:
  //       return campaigns;
  //   }
  // };

  // const sortedCampaigns = useMemo(() => {
  //   const dataToSort = search.query ? search.results : filteredData;
  //   return sortCampaigns(dataToSort, sortBy);
  // }, [search.query, search.results, filteredData, sortBy]);

  // const paginatedCampaigns = useMemo(() => {
  //   const indexOfLastItem = page * MAX_ITEM;
  //   const indexOfFirstItem = indexOfLastItem - MAX_ITEM;
  //   return filteredData?.slice(indexOfFirstItem, indexOfLastItem);
  // }, [filteredData, page]);

  // useEffect(() => {
  //   setPage(1); // Reset to first page when search query changes
  // }, [search.query]);

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Typography
        variant="h2"
        sx={{
          mb: 0.2,
          mt: { lg: 2, xs: 2, sm: 2 },
          fontFamily: theme.typography.fontSecondaryFamily,
          fontWeight: 'normal',
        }}
      >
        Discover Campaigns ✨
      </Typography>
      <Typography
        variant="body1"
        sx={{ fontFamily: theme.typography.fontFamily, color: '#636366', mb: 3 }}
      >
        Here are the top campaigns that fit your profile!
      </Typography>

      <Box
        sx={{
          mb: 2.5,
        }}
      >
        {/* Main Controls Container */}
        <Box
          sx={{
            border: '1px solid #e7e7e7',
            borderRadius: 1,
            p: 1,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 1.5, md: 1.5 },
            bgcolor: 'background.paper',
          }}
        >
          {/* Filter Buttons */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              flex: { xs: 'none', md: '0 0 auto' },
            }}
          >
            <Button
              onClick={() => setFilter('all')}
              sx={{
                px: 2,
                py: 1,
                minHeight: '38px',
                height: '38px',
                minWidth: 'fit-content',
                color: filter === 'all' ? '#ffffff' : '#666666',
                bgcolor: filter === 'all' ? '#1340ff' : 'transparent',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: 0.75,
                textTransform: 'none',
                position: 'relative',
                transition: 'all 0.2s ease',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '1px',
                  left: '1px',
                  right: '1px',
                  bottom: '1px',
                  borderRadius: 0.75,
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: filter === 'all' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(19, 64, 255, 0.08)',
                },
                '&:hover': {
                  bgcolor: filter === 'all' ? '#1340ff' : 'transparent',
                  color: filter === 'all' ? '#ffffff' : '#1340ff',
                  transform: 'scale(0.98)',
                },
                '&:focus': {
                  outline: 'none',
                },
              }}
            >
              For you
            </Button>
            <Button
              onClick={() => setFilter('saved')}
              sx={{
                px: 2,
                py: 1,
                minHeight: '38px',
                height: '38px',
                minWidth: 'fit-content',
                color: filter === 'saved' ? '#ffffff' : '#666666',
                bgcolor: filter === 'saved' ? '#1340ff' : 'transparent',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: 0.75,
                textTransform: 'none',
                position: 'relative',
                transition: 'all 0.2s ease',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '1px',
                  left: '1px',
                  right: '1px',
                  bottom: '1px',
                  borderRadius: 0.75,
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: filter === 'saved' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(19, 64, 255, 0.08)',
                },
                '&:hover': {
                  bgcolor: filter === 'saved' ? '#1340ff' : 'transparent',
                  color: filter === 'saved' ? '#ffffff' : '#1340ff',
                  transform: 'scale(0.98)',
                  
                },
                '&:focus': {
                  outline: 'none',
                },
              }}
            >
              Saved
            </Button>
          </Stack>

          {/* Search and Sort Controls */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{
              flex: { xs: 'none', md: '1 1 auto' },
              justifyContent: { xs: 'stretch', md: 'flex-end' },
              alignItems: { xs: 'stretch', sm: 'center' },
            }}
          >
            {/* Search Box */}
            <Box
              sx={{
                width: { xs: '100%', sm: '240px', md: '280px' },
                border: '1px solid #e7e7e7',
                borderRadius: 0.75,
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                height: '38px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                '&:hover': {
                  borderColor: '#1340ff',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(19, 64, 255, 0.1)',
                },
                '&:focus-within': {
                  borderColor: '#1340ff',
                  boxShadow: '0 0 0 3px rgba(19, 64, 255, 0.1)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <InputBase
                inputRef={searchInputRef}
                value={search.query}
                onChange={(e) => {
                  setSearch((prev) => ({ ...prev, query: e.target.value }));
                  debouncedSetQuery(e.target.value);
                }}
                placeholder="Search"
                startAdornment={
                  <Iconify
                    icon="eva:search-fill"
                    sx={{
                      width: 18,
                      height: 18,
                      color: 'text.disabled',
                      ml: 1.5,
                      mr: 1,
                      transition: 'color 0.2s ease',
                    }}
                  />
                }
                endAdornment={
                  <Box
                    sx={{
                      display: { xs: 'none', md: 'flex' },
                      alignItems: 'center',
                      gap: 0.25,
                      mr: 1.5,
                      ml: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1,
                        py: 0.5,
                        bgcolor: '#f5f5f5',
                        borderRadius: 0.5,
                        border: '1px solid #e0e0e0',
                        minHeight: '22px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: '#eeeeee',
                          borderColor: '#d0d0d0',
                          transform: 'scale(1.05)',
                        },
                        '&:active': {
                          transform: 'scale(0.95)',
                        },
                      }}
                      onClick={() => searchInputRef.current?.focus()}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#666666',
                          lineHeight: 1,
                          fontFamily: 'monospace',
                        }}
                      >
                        {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#666666',
                          lineHeight: 1,
                          fontFamily: 'monospace',
                        }}
                      >
                        K
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{
                  width: '100%',
                  color: 'text.primary',
                  fontSize: '0.95rem',
                  '& input': {
                    py: 1,
                    px: 1,
                    height: '100%',
                    transition: 'all 0.2s ease',
                    '&::placeholder': {
                      color: '#999999',
                      opacity: 1,
                      transition: 'color 0.2s ease',
                    },
                    '&:focus::placeholder': {
                      color: '#cccccc',
                    },
                  },
                }}
              />
            </Box>

            {/* Sort Dropdown */}
            <Box
              sx={{
                width: { xs: '100%', sm: '140px' },
                minWidth: { xs: '100%', sm: '140px' },
                maxWidth: { xs: '100%', sm: '140px' },
                border: '1px solid #e7e7e7',
                borderRadius: 0.75,
                bgcolor: 'background.paper',
                height: '38px',
                transition: 'border-color 0.2s ease',
                '&:hover': {
                  borderColor: '#1340ff',
                },
              }}
            >
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                displayEmpty
                input={<InputBase />}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: 'white',
                      border: '1px solid #e7e7e7',
                      borderRadius: 1,
                      mt: 0.5,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                  },
                }}
                renderValue={(selected) => (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      pr: 0.5, // Space for the arrow
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: selected ? '#1340ff' : '#666666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      {selected || 'Sort by'}
                    </Typography>
                  </Box>
                )}
                sx={{
                  width: '100%',
                  height: '100%',
                  '& .MuiSelect-select': {
                    py: 1,
                    px: 1.25,
                    pr: '28px !important', // Reduced space for arrow
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: 'unset',
                  },
                  '& .MuiSelect-icon': {
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: sortBy ? '#1340ff' : 'text.secondary',
                    transition: 'color 0.2s ease',
                    position: 'absolute',
                    width: '16px',
                    height: '16px',
                  },
                  '&.Mui-focused': {
                    outline: 'none',
                  },
                }}
              >
                <MenuItem
                  value="Most matched"
                  sx={{
                    mx: 0.5,
                    my: 0.25,
                    borderRadius: 0.75,
                    fontSize: '0.875rem',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(19, 64, 255, 0.08) !important',
                      color: '#1340ff',
                      '&:hover': {
                        bgcolor: 'rgba(19, 64, 255, 0.12)',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(19, 64, 255, 0.04)',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                    Most matched
                    {sortBy === 'Most matched' && (
                      <Iconify
                        icon="eva:checkmark-fill"
                        sx={{ ml: 'auto', width: 16, height: 16, color: '#1340ff' }}
                      />
                    )}
                  </Stack>
                </MenuItem>
                <MenuItem
                  value="Most recent"
                  sx={{
                    mx: 0.5,
                    my: 0.25,
                    borderRadius: 0.75,
                    fontSize: '0.875rem',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(19, 64, 255, 0.08) !important',
                      color: '#1340ff',
                      '&:hover': {
                        bgcolor: 'rgba(19, 64, 255, 0.12)',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(19, 64, 255, 0.04)',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                    Most recent
                    {sortBy === 'Most recent' && (
                      <Iconify
                        icon="eva:checkmark-fill"
                        sx={{ ml: 'auto', width: 16, height: 16, color: '#1340ff' }}
                      />
                    )}
                  </Stack>
                </MenuItem>
              </Select>
            </Box>
          </Stack>
        </Box>
      </Box>

      {isLoading && (
        <Box
          sx={{
            position: 'relative',
            top: 200,
            textAlign: 'center',
          }}
        >
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
        (filteredData?.length > 0 ? (
          <Box>
            <CampaignLists
              campaigns={filteredData}
              totalCampaigns={filteredData?.length}
              mutate={mutate}
            />
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
            title={`No campaigns available in ${filter === 'saved' ? 'Saved' : 'For You'}`}
          />
        ))}

      {upload.length > 0 && renderUploadProgress}

      {/* <CreatorForm dialog={dialog} user={user} backdrop={backdrop} /> */}

      {showScrollTop && (
        <Fab
          color="primary"
          size="small"
          onClick={handleScrollTop}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <Iconify icon="mdi:arrow-up" />
        </Fab>
      )}

      <CreatorForm open={dialog.value} onClose={dialog.onFalse} />
    </Container>
  );
}

// ----------------------------------------------------------------------

const applyFilter = ({ inputData, filter, user, sortBy, search }) => {
  if (filter === 'saved') {
    inputData = inputData?.filter((campaign) =>
      campaign.bookMarkCampaign.some((item) => item.userId === user.id)
    );
  }

  if (filter === 'draft') {
    inputData = inputData?.filter((campaign) =>
      campaign.pitch?.some((elem) => elem?.userId === user?.id && elem?.status === 'draft')
    );
  }

  if (sortBy === 'Most matched') {
    inputData = orderBy(inputData, ['percentageMatch'], ['desc']);
  }

  if (sortBy === 'Most recent') {
    inputData = orderBy(inputData, ['createdAt'], ['desc']);
  }

  if (search.query) {
    inputData = inputData?.filter(
      (item) =>
        item.name.toLowerCase().includes(search.query.toLowerCase()) ||
        item.company?.name.toLowerCase().includes(search.query.toLowerCase())
    );
  }

  return inputData;
};
