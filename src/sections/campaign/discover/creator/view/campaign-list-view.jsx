import { mutate } from 'swr';
import { orderBy } from 'lodash';
import { m } from 'framer-motion';
import { enqueueSnackbar } from 'notistack';
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
import useGetCampaigns from 'src/hooks/use-get-campaigns';

import { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { useSettingsContext } from 'src/components/settings';
import { LoadingScreen } from 'src/components/loading-screen';

import CreatorForm from '../creator-form';
import CampaignLists from '../campaign-list';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export default function CampaignListView() {
  const settings = useSettingsContext();
  const { campaigns, isLoading } = useGetCampaigns('creator');
  const [filter, setFilter] = useState('all');

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

  const [search, setSearch] = useState({
    query: '',
    results: [],
  });

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
      inputData: campaigns?.slice(indexOfFirstItem, indexOfLastItem),
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
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Typography variant="h2" sx={{ mb: 0.2 }} fontFamily="InstrumentSerif">
        Discover Campaigns ✨
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
        Here are the top campaigns that fit your profile!
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: { sm: 'space-between' }, // Add this line
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)',
          mb: 3,
          p: 2,
          width: '100%',
          minHeight: { xs: 'auto', sm: 72 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: { xs: 2, sm: 0 },
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <Button
            size="large"
            variant={filter === 'all' ? 'contained' : 'text'}
            onClick={() => setFilter('all')}
            sx={{
              mr: 1,
              flex: { xs: 1, sm: 'none' },
              fontWeight: 'bold',
              bgcolor: filter === 'all' ? 'common.black' : 'transparent',
              color: filter === 'all' ? 'common.white' : 'text.secondary',
              '&:hover': {
                bgcolor: filter === 'all' ? 'common.black' : 'transparent',
              },
              borderRadius: 1.5,
              height: 42,
              minWidth: 60,
            }}
          >
            For You
          </Button>
          <Button
            size="large"
            variant={filter === 'saved' ? 'contained' : 'text'}
            onClick={() => setFilter('saved')}
            sx={{
              flex: { xs: 1, sm: 'none' },
              fontWeight: 'bold',
              bgcolor: filter === 'saved' ? 'common.black' : 'transparent',
              color: filter === 'saved' ? 'common.white' : 'text.secondary',
              '&:hover': {
                bgcolor: filter === 'saved' ? 'common.black' : 'transparent',
              },
              borderRadius: 1.5,
              height: 42,
              minWidth: 60,
            }}
          >
            Saved
          </Button>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            width: { xs: '100%', sm: 'auto' },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              height: 42,
              width: { xs: '100%', sm: 280 },
            }}
          >
            <Iconify
              icon="eva:search-fill"
              sx={{ width: 20, height: 20, ml: 1, mr: 1, color: 'text.disabled' }}
            />
            <InputBase
              value={search.query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search"
              sx={{ flex: 1 }}
            />
          </Box>
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              display: { xs: 'none', sm: 'block' },
              mx: 2,
              height: 35,
              bgcolor: 'divider',
              alignSelf: 'center',
            }}
          />
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            displayEmpty
            input={<InputBase />}
            renderValue={(selected) => <strong>{selected || 'Sort By'}</strong>}
            sx={{
              height: 42,
              width: { xs: '100%', sm: 95 },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              '& .MuiSelect-select': {
                pl: 2,
                pr: 4,
                py: 1.25,
                display: 'flex',
                alignItems: 'center',
              },
            }}
            IconComponent={(props) => <Iconify icon="eva:chevron-down-fill" {...props} />}
          >
            <MenuItem value="">Reset</MenuItem>
            <MenuItem value="Highest">Highest Match %</MenuItem>
            <MenuItem value="Lowest">Lowest Match %</MenuItem>
          </Select>
        </Box>
      </Box>

      {isLoading && <LoadingScreen />}

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

      {!user?.creator?.isFormCompleted && <CreatorForm dialog={dialog} user={user} />}

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
    inputData = inputData?.filter((campaign) => campaign.bookMarkCampaign);
  }

  if (filter === 'draft') {
    inputData = inputData?.filter((campaign) =>
      campaign.pitch?.some((elem) => elem?.userId === user?.id && elem?.status === 'draft')
    );
  }

  if (sortBy === 'Highest') {
    inputData = orderBy(inputData, ['percentageMatch'], 'desc');
  }

  if (sortBy === 'Lowest') {
    inputData = orderBy(inputData, ['percentageMatch'], 'asc');
  }

  if (search.query) {
    inputData = inputData?.filter((item) =>
      item.name.toLowerCase().includes(search.query.toLowerCase())
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
