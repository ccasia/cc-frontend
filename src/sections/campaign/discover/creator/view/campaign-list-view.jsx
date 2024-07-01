import { useState, useCallback } from 'react';

import { Box, Typography } from '@mui/material';
import Container from '@mui/material/Container';

import useGetCampaigns from 'src/hooks/use-get-campaigns';

import { _tours } from 'src/_mock';

import { useSettingsContext } from 'src/components/settings';

import CampaignLists from '../campaign-list';
import CampaignSearch from '../campaign-search';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export default function CampaignListView() {
  const settings = useSettingsContext();
  const { campaigns } = useGetCampaigns('creator');

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

      if (inputValue) {
        const results = _tours.filter(
          (tour) => tour.name.toLowerCase().indexOf(search.query.toLowerCase()) !== -1
        );

        setSearch((prevState) => ({
          ...prevState,
          results,
        }));
      }
    },
    [search.query]
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Typography
        variant="h3"
        sx={{
          mb: 3,
        }}
      >
        Discover
      </Typography>

      <CampaignSearch
        query={search.query}
        results={search.results}
        onSearch={handleSearch}
        // hrefItem={(id) => paths.dashboard.tour.details(id)}
      />

      <Box sx={{ my: 2 }} />
      {campaigns?.length > 0 ? (
        <CampaignLists campaigns={campaigns} />
      ) : (
        <Box
          sx={{
            height: 300,
            borderRadius: 2,
            bgcolor: (theme) => theme.palette.background.paper,
            position: 'relative',
          }}
        >
          <Typography
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: (theme) => theme.palette.text.disabled,
            }}
          >
            No campaign available.
          </Typography>
        </Box>
      )}
    </Container>
  );
}

// ----------------------------------------------------------------------

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
