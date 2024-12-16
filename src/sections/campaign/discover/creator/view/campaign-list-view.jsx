import { orderBy } from 'lodash';
import { m } from 'framer-motion';
import useSWRInfinite from 'swr/infinite';
import { enqueueSnackbar } from 'notistack';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Backdrop from '@mui/material/Backdrop';
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

import CreatorForm from '../creator-form';
import CampaignLists from '../campaign-list';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export default function CampaignListView() {
  const settings = useSettingsContext();
  // const { campaigns } = useGetCampaigns('creator');

  const [filter, setFilter] = useState('all');

  const scrollContainerRef = useRef(null);

  const { mainRef } = useMainContext();

  const lgUp = useResponsive('up', 'lg');

  const getKey = (pageIndex, previousPageData) => {
    // If there's no previous page data, start from the first page
    if (pageIndex === 0) return `/api/campaign/matchCampaignWithCreator?take=${10}`;

    // If there's no more data (previousPageData is empty or no nextCursor), stop fetching
    if (!previousPageData?.metaData?.lastCursor) return null;

    // Otherwise, use the nextCursor to get the next page
    return `/api/campaign/matchCampaignWithCreator?take=${10}&cursor=${previousPageData?.metaData?.lastCursor}`;
  };

  const { data, error, size, setSize, isValidating, isLoading, mutate } = useSWRInfinite(
    getKey,
    fetcher
  );

  const { user } = useAuthContext();
  const dialog = useBoolean();
  const backdrop = useBoolean(!user?.creator?.isFormCompleted);

  const load = useBoolean();
  const [upload, setUpload] = useState([]);
  const { socket } = useSocketContext();
  const smUp = useResponsive('up', 'sm');

  const [sortBy, setSortBy] = useState('');

  const theme = useTheme();

  const [showScrollTop, setShowScrollTop] = useState(false);

  const [page, setPage] = useState(1);
  const MAX_ITEM = 9;

  const onOpenCreatorForm = () => {
    backdrop.onTrue();
    dialog.onTrue();
  };

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

  const [search, setSearch] = useState({
    query: '',
    results: [],
  });

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

  const handlePageChange = (event, value) => {
    setPage(value);
  };

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

  const handleSearch = useCallback(
    (inputValue) => {
      setSearch((prevState) => ({
        ...prevState,
        query: inputValue,
      }));

      if (inputValue && filteredData) {
        const filteredCampaigns = applyFilter({ inputData: filteredData, filter, user });
        const results = filteredCampaigns.filter(
          (campaign) =>
            campaign.name.toLowerCase().includes(inputValue.toLowerCase()) ||
            campaign.company.name.toLowerCase().includes(inputValue.toLowerCase())
        );

        setSearch((prevState) => ({
          ...prevState,
          results,
        }));
      }
    },
    [filteredData, filter, user]
  );

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

  useEffect(() => {
    setPage(1); // Reset to first page when search query changes
  }, [search.query]);

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
          fontFamily: theme.typography.fontSecondaryFamily,
          fontWeight: 'normal',
        }}
      >
        Discover Campaigns ✨
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
        Here are the top campaigns that fit your profile!
      </Typography>

      <Box
        sx={{
          mb: 2.5,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{
            width: '100%',
            mb: { xs: 3, sm: 0 },
            display: { xs: 'flex', md: 'none' },
          }}
        >
          {/* Search Box - Full width on mobile */}
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
              // onChange={(e) => handleSearch(e.target.value)}
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

          {/* Sort Box - Full width on mobile */}
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
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              displayEmpty
              input={<InputBase />}
              renderValue={(selected) => <strong>{selected || 'Sort by'}</strong>}
              sx={{
                width: '100%',
                '& .MuiSelect-select': {
                  py: 1,
                  px: 1.5,
                  pr: 4,
                  display: 'flex',
                  alignItems: 'center',
                },
                '& .MuiSelect-icon': {
                  color: '#1340ff',
                },
              }}
              IconComponent={(props) => (
                <Iconify
                  icon="eva:chevron-down-fill"
                  {...props}
                  sx={{ mr: 0.2, width: 32, height: 32 }}
                />
              )}
            >
              <MenuItem value="Most matched">
                <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                  Most matched
                  {sortBy === 'Most matched' && (
                    <Iconify
                      icon="eva:checkmark-fill"
                      sx={{ ml: 'auto', width: 20, height: 20, color: '#1340ff' }}
                    />
                  )}
                </Stack>
              </MenuItem>
              <MenuItem value="Most recent">
                <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                  Most recent
                  {sortBy === 'Most recent' && (
                    <Iconify
                      icon="eva:checkmark-fill"
                      sx={{ ml: 'auto', width: 20, height: 20, color: '#1340ff' }}
                    />
                  )}
                </Stack>
              </MenuItem>
            </Select>
          </Box>
        </Stack>

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
                pb: 1,
                minWidth: 'fit-content',
                color: filter === 'all' ? '#221f20' : '#8e8e93',
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
                  width: filter === 'all' ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  transition: 'all 0.3s ease-in-out',
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
                pb: 1,
                ml: 2,
                minWidth: 'fit-content',
                color: filter === 'saved' ? '#221f20' : '#8e8e93',
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
                  width: filter === 'saved' ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  transition: 'all 0.3s ease-in-out',
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
              }}
            >
              <InputBase
                value={search.query}
                onChange={(e) => handleSearch(e.target.value)}
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

            {/* Sort Box - Compact on desktop */}
            <Box
              sx={{
                minWidth: 120,
                maxWidth: 160,
                border: '1px solid',
                borderBottom: '2.5px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper',
                height: '42px',
              }}
            >
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                displayEmpty
                input={<InputBase />}
                renderValue={(selected) => (
                  <Box
                    sx={{
                      width: '100%',
                      textAlign: 'center',
                      mr: selected ? 0 : '24px',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                      {selected || 'Sort by'}
                    </Typography>
                  </Box>
                )}
                sx={{
                  height: '100%',
                  '& .MuiSelect-select': {
                    py: 1,
                    px: 1.5,
                    pr: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  '& .MuiSelect-icon': {
                    color: '#1340ff',
                  },
                }}
                IconComponent={(props) => (
                  <Iconify
                    icon="eva:chevron-down-fill"
                    {...props}
                    sx={{
                      mr: 0.2,
                      width: 32,
                      height: 32,
                      right: -4,
                    }}
                  />
                )}
              >
                <MenuItem value="Most matched">
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                      Most matched
                      {sortBy === 'Most matched' && (
                        <Iconify
                          icon="eva:checkmark-fill"
                          sx={{ ml: 'auto', width: 20, height: 20, color: '#1340ff' }}
                        />
                      )}
                    </Stack>
                  </Typography>
                </MenuItem>
                <MenuItem value="Most recent">
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                      Most recent
                      {sortBy === 'Most recent' && (
                        <Iconify
                          icon="eva:checkmark-fill"
                          sx={{ ml: 'auto', width: 20, height: 20, color: '#1340ff' }}
                        />
                      )}
                    </Stack>
                  </Typography>
                </MenuItem>
              </Select>
            </Box>
          </Stack>
        </Stack>
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

      <Backdrop open={backdrop.value} sx={{ zIndex: theme.zIndex.drawer + 1,  }}>
        <Box
          sx={{
            padding: '20px',
            width: '580px',
            height: '638px',
            background: '#f4f4f4',
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.15)',
            borderRadius: '20px',
            overflow: 'auto'
          }}
        >
          <IconButton
            onClick={backdrop.onFalse}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <Iconify icon="mingcute:close-fill" width={24} />
          </IconButton>

          <Stack spacing={0}>
            <Typography 
            variant="body1" 
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              flexGrow: 1,
              fontWeight: 'normal',
              fontSize: '32px',
            }}
            >
            💰 Fill in your payment details
            </Typography>

            <Divider sx={{ my: 2, mb: 0 }} />

            <CreatorForm dialog={dialog} user={user} display backdrop={backdrop} />
          </Stack>
        </Box>
      </Backdrop>

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

// const applyFilter = ({ inputData, filters, sortBy, dateError }) => {
//   const { services, destination, startDate, endDate, tourGuides } = filters;

//   const tourGuideIds = tourGuides.map((tourGuide) => tourGuide.id);

//   // SORT BY
//   if (sortBy === 'latest') {
//     inputData = orderBy(inputData, ['createdAt'], ['desc']);
//   }

//   if (sortBy === 'oldest') {
//     inputData = orderBy(inputData, ['createdAt'], ['asc']);
//   }

//   if (sortBy === 'popular') {
//     inputData = orderBy(inputData, ['totalViews'], ['desc']);
//   }

//   // FILTERS
//   if (destination.length) {
//     inputData = inputData.filter((tour) => destination.includes(tour.destination));
//   }

//   if (tourGuideIds.length) {
//     inputData = inputData.filter((tour) =>
//       tour.tourGuides.some((filterItem) => tourGuideIds.includes(filterItem.id))
//     );
//   }

//   if (services.length) {
//     inputData = inputData.filter((tour) => tour.services.some((item) => services.includes(item)));
//   }

//   if (!dateError) {
//     if (startDate && endDate) {
//       inputData = inputData.filter((tour) =>
//         isBetween(startDate, tour.available.startDate, tour.available.endDate)
//       );
//     }
//   }

//   return inputData;
// };
