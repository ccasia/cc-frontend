import { orderBy } from 'lodash';
import { m } from 'framer-motion';
import useSWR, { mutate } from 'swr';
import { enqueueSnackbar } from 'notistack';
import { useMemo, useState, useEffect, useCallback } from 'react';

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

import { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { useSettingsContext } from 'src/components/settings';

import CreatorForm from '../creator-form';
import CampaignLists from '../campaign-list';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export default function CampaignListView() {
  const settings = useSettingsContext();
  // const { campaigns, isLoading } = useGetCampaigns('creator');
  const [filter, setFilter] = useState('all');

  const [search, setSearch] = useState({
    query: '',
    results: [],
  });

  const { data: campaigns, isLoading } = useSWR(
    search.query
      ? `${endpoints.campaign.getMatchedCampaign}?search=${search.query}`
      : endpoints.campaign.getMatchedCampaign,
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
    const handlePitchLoading = (data) => {
      if (upload.find((item) => item.campaignId === data.campaignId)) {
        setUpload((prev) =>
          prev.map((item) =>
            item.campaignId === data.campaignId
              ? {
                  campaignId: data.campaignId,
                  loading: true,
                  progress: Math.floor(data.progress),
                }
              : item
          )
        );
      } else {
        setUpload((item) => [
          ...item,
          { loading: true, campaignId: data.campaignId, progress: Math.floor(data.progress) },
        ]);
      }
    };

    const handlePitchSuccess = (data) => {
      mutate(endpoints.campaign.getAllActiveCampaign);
      enqueueSnackbar(data.name);
      setUpload((prevItems) => prevItems.filter((item) => item.campaignId !== data.campaignId));
    };

    // Attach the event listener
    socket?.on('pitch-loading', handlePitchLoading);
    socket?.on('pitch-uploaded', handlePitchSuccess);

    // Clean-up function
    return () => {
      socket?.off('pitch-loading', handlePitchLoading);
      socket?.off('pitch-uploaded', handlePitchSuccess);
    };
  }, [socket, upload]);

  // const [search, setSearch] = useState({
  //   query: '',
  //   results: [],
  // });

  const handleSearch = useCallback(
    (inputValue) => {
      setSearch((prevState) => ({
        ...prevState,
        query: inputValue,
      }));

      if (inputValue && campaigns) {
        const filteredCampaigns = applyFilter({ inputData: campaigns, filter, user });
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
    [campaigns, filter, user]
  );

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
                primary={campaigns && campaigns.find((item) => item.id === elem.campaignId)?.name}
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

  const filteredData = useMemo(() => {
    const indexOfLastItem = page * MAX_ITEM;
    const indexOfFirstItem = indexOfLastItem - MAX_ITEM;

    return applyFilter({
      inputData: campaigns
        ?.filter((campaign) => campaign?.status === 'ACTIVE')
        ?.slice(indexOfFirstItem, indexOfLastItem),
      filter,
      user,
      sortBy,
      search,
    });
  }, [campaigns, filter, user, sortBy, page, search]);

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
      <Typography variant="h2" sx={{ mb: 0.2, fontFamily: theme.typography.fontSecondaryFamily }}>
        Discover Campaigns ✨
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
        Here are the top campaigns that fit your profile!
      </Typography>

      <Box
        sx={{
          mb: 2.5,
          // position: 'sticky',
          // top: 80,
          // zIndex: 100,
          // bgcolor: theme.palette.background.paper,
          // boxShadow: 10,
          // borderRadius: 2,
          // px: 2,
          // py: 0.5,
        }}
      >
        {/* Mobile Search and Sort Stack */}
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
              onChange={(e) => handleSearch(e.target.value)}
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

        {/* Filter Buttons and Desktop Search/Sort */}

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
          <CampaignLists
            campaigns={filteredData}
            totalCampaigns={campaigns?.length}
            page={page}
            onPageChange={handlePageChange}
            maxItemsPerPage={MAX_ITEM}
          />
        ) : (
          <EmptyContent
            title={`No campaigns available in ${filter === 'saved' ? 'Saved' : 'For You'}`}
          />
        ))}

      {upload.length > 0 && renderUploadProgress}

      <Backdrop open={backdrop.value} sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Box
          sx={{
            bgcolor: theme.palette.background.paper,
            borderRadius: 3,
            p: 4,
            pb: 2,
            width: 600,
            position: 'relative',
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

          <Stack spacing={2}>
            <Typography variant="h5" sx={{ fontWeight: 650, mb: -0.1, pb: 0.2, mt: 0.8 }}>
              Complete Your Profile Before Making a Pitch
            </Typography>

            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
              Before you can submit a pitch for this campaign, please complete your profile form.
              This ensures we have all the necessary information for your submission. Click below to
              finish filling out your form and get ready to pitch!
            </Typography>

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
