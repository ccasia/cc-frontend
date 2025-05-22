import { m } from 'framer-motion';
import useSWRInfinite from 'swr/infinite';
import { enqueueSnackbar } from 'notistack';
import { orderBy, debounce, throttle } from 'lodash';
import { useMemo, useState, useEffect, useCallback } from 'react';

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

import CampaignLists from '../campaign-list';
import ShortlistedCreatorPopUp from '../../admin/campaign-detail-creator/hooks/shortlisted-creator-popup';
import { useShortlistedCreators } from '../../admin/campaign-detail-creator/hooks/shortlisted-creator';
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// Check
export default function CampaignListView() {
  const settings = useSettingsContext();
  // const { campaigns } = useGetCampaigns('creator');

  const [filter, setFilter] = useState('all');

  const { mainRef } = useMainContext();

  const lgUp = useResponsive('up', 'lg');

  const { addCreators } = useShortlistedCreators(); 

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
  const dialog = useBoolean(!user?.creator?.isFormCompleted || !user?.paymentForm?.bankAccountName);
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

const shortlistCreator = async (campaignId) => {
  const res = await fetch(`/api/campaign/shortlistCreator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();
  if (res.ok) {
    handleShortlistSuccess(data);
  } else {
    console.error(data.message);
  }
};

const handleShortlistSuccess = (shortlistedItem) => {
  addCreators(shortlistedItem, user);
};


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
            }}
          >
            <Button
              disableRipple
              size="large"
              onClick={() => setFilter('all')}
              sx={{
                px: 0.5,
                py: 0.5,
                pb: 0.5,
                minWidth: 'fit-content',
                color: filter === 'all' ? '#221f20' : '#8e8e93',
                position: 'relative',
                fontSize: '1.05rem',
                fontWeight: 650,
                // transition: 'transform 0.1s ease-in-out',
                '&:focus': {
                  outline: 'none',
                  bgcolor: 'transparent',
                },
                '&:active': {
                  // transform: 'scale(0.95)',
                  bgcolor: 'transparent',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -2.5,
                  left: 0,
                  right: 0,
                  height: '2px',
                  width: filter === 'all' ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  // transition: 'all 0.3s ease-in-out',
                  transform: 'scaleX(1)',
                  transformOrigin: 'left',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: filter === 'all' ? 1 : 0.5,
                  },
                },
              }}
            >
              For you
            </Button>
            <Button
              disableRipple
              size="large"
              onClick={() => setFilter('saved')}
              sx={{
                px: 1,
                py: 0.5,
                pb: 0.5,
                ml: 2,
                minWidth: 'fit-content',
                color: filter === 'saved' ? '#221f20' : '#8e8e93',
                position: 'relative',
                fontSize: '1.05rem',
                fontWeight: 650,
                // transition: 'transform 0.1s ease-in-out',
                '&:focus': {
                  outline: 'none',
                  bgcolor: 'transparent',
                },
                '&:active': {
                  // transform: 'scale(0.95)',
                  bgcolor: 'transparent',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -2.5,
                  left: 0,
                  right: 0,
                  height: '2px',
                  width: filter === 'saved' ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  // transition: 'all 0.3s ease-in-out',
                  transform: 'scaleX(1)',
                  transformOrigin: 'left',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: filter === 'saved' ? 1 : 0.5,
                  },
                },
              }}
            >
              Saved
            </Button>
          </Stack>

          {/* Desktop Search and Sort Stack */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{
              ml: 'auto',
              display: { xs: 'none', md: 'flex' },
            }}
          >
            {/* Search Box - Fixed width on desktop */}
            <Box
              sx={{
                width: 280,
                border: '1px solid',
                borderBottom: '2.5px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                height: '42px',
                mb: 1,
              }}
            >
              <InputBase
                value={search.query}
                // onChange={(e) => handleSearch(e.target.value)}
                onChange={(e) => {
                  setSearch((prev) => ({ ...prev, query: e.target.value }));
                  debouncedSetQuery(e.target.value);
                }}
                placeholder="Search"
                startAdornment={
                  <Iconify
                    icon="eva:search-fill"
                    sx={{
                      width: 20,
                      height: 20,
                      color: 'text.disabled',
                      ml: 1.5,
                      mr: 1,
                    }}
                  />
                }
                sx={{
                  width: '100%',
                  color: 'text.primary',
                  '& input': {
                    py: 1.5,
                    px: 1,
                    height: '100%',
                  },
                }}
              />
            </Box>

            {/* Sort Box - Updated to match mobile design */}
            <Box
              sx={{
                minWidth: 120,
                maxWidth: 160,
                border: '0.5px solid #E7E7E7',
                borderBottom: '3px solid #E7E7E7',
                borderRadius: 1.25,
                bgcolor: 'background.paper',
                height: '42px',
                mb: 1,
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
                      border: '0.5px solid #E7E7E7',
                      borderBottom: '3px solid #E7E7E7',
                      mt: 1,
                    },
                  },
                }}
                renderValue={(selected) => (
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                    }}
                  >
                    {selected || 'Sort by'}
                  </Typography>
                )}
                sx={{
                  height: '100%',
                  '& .MuiSelect-select': {
                    py: 1.5,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                  },
                  '& .MuiSelect-icon': {
                    right: 10,
                    color: '#000000',
                  },
                  '&.Mui-focused': {
                    outline: 'none',
                  },
                  '&:active': {
                    bgcolor: '#f2f2f2',
                    transition: 'background-color 0.2s ease',
                  },
                }}
              >
                <MenuItem
                  value="Most matched"
                  sx={{
                    mx: 0.2,
                    my: 0.5,
                    borderRadius: 0.5,
                    '&.Mui-selected': {
                      bgcolor: '#F5F5F5 !important',
                      '&:hover': {
                        bgcolor: '#F5F5F5',
                      },
                    },
                    '&:hover': {
                      bgcolor: '#F5F5F5',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                    Most matched
                    {sortBy === 'Most matched' && (
                      <Iconify
                        icon="eva:checkmark-fill"
                        sx={{ ml: 'auto', width: 20, height: 20, color: '#000000' }}
                      />
                    )}
                  </Stack>
                </MenuItem>
                <MenuItem
                  value="Most recent"
                  sx={{
                    mx: 0.2,
                    my: 0.5,
                    borderRadius: 0.5,
                    '&.Mui-selected': {
                      bgcolor: '#F5F5F5 !important',
                      '&:hover': {
                        bgcolor: '#F5F5F5',
                      },
                    },
                    '&:hover': {
                      bgcolor: '#F5F5F5',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                    Most recent
                    {sortBy === 'Most recent' && (
                      <Iconify
                        icon="eva:checkmark-fill"
                        sx={{ ml: 'auto', width: 20, height: 20, color: '#000000' }}
                      />
                    )}
                  </Stack>
                </MenuItem>
              </Select>
            </Box>
          </Stack>
        </Stack>

        {/* Mobile Sort Options */}
        <Box
          sx={{
            display: { xs: filter === 'saved' ? 'none' : 'block', md: 'none' },
            mt: 2,
            mb: 2,
          }}
        >
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            displayEmpty
            fullWidth
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: 'white',
                  border: '0.5px solid #E7E7E7',
                  borderBottom: '3px solid #E7E7E7',
                  mt: 1,
                },
              },
            }}
            sx={{
              border: '0.5px solid #E7E7E7',
              borderBottom: '3px solid #E7E7E7',
              borderRadius: 1.25,
              bgcolor: 'background.paper',
              height: '48px',
              width: '160px',
              '& .MuiSelect-select': {
                py: 1.5,
                px: 2,
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiSelect-icon': {
                right: 10,
                color: '#000000',
              },
              '&.Mui-focused': {
                outline: 'none',
              },
              '&:active': {
                bgcolor: '#f2f2f2',
                transition: 'background-color 0.2s ease',
              },
            }}
            renderValue={(selected) => (
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  fontSize: '1rem',
                }}
              >
                {selected || 'Sort by'}
              </Typography>
            )}
          >
            <MenuItem
              value="Most matched"
              sx={{
                mx: 0.2,
                my: 0.5,
                borderRadius: 0.5,
                '&.Mui-selected': {
                  bgcolor: '#F5F5F5 !important',
                  '&:hover': {
                    bgcolor: '#F5F5F5',
                  },
                },
                '&:hover': {
                  bgcolor: '#F5F5F5',
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                Most matched
                {sortBy === 'Most matched' && (
                  <Iconify
                    icon="eva:checkmark-fill"
                    sx={{ ml: 'auto', width: 20, height: 20, color: '#000000' }}
                  />
                )}
              </Stack>
            </MenuItem>
            <MenuItem
              value="Most recent"
              sx={{
                mx: 0.2,
                my: 0.5,
                borderRadius: 0.5,
                '&.Mui-selected': {
                  bgcolor: '#F5F5F5 !important',
                  '&:hover': {
                    bgcolor: '#F5F5F5',
                  },
                },
                '&:hover': {
                  bgcolor: '#F5F5F5',
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                Most recent
                {sortBy === 'Most recent' && (
                  <Iconify
                    icon="eva:checkmark-fill"
                    sx={{ ml: 'auto', width: 20, height: 20, color: '#000000' }}
                  />
                )}
              </Stack>
            </MenuItem>
          </Select>
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
      <ShortlistedCreatorPopUp/>
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
