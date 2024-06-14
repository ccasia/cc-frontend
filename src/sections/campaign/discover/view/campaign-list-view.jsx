import { useState, useCallback } from 'react';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { _tours } from 'src/_mock';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import TourList from '../campaign-list';
import CampaignSearch from '../campaign-search';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export default function CampaignListView() {
  const settings = useSettingsContext();

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
      <CustomBreadcrumbs
        heading="List"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          {
            name: 'Campaign',
            href: paths.dashboard.campaign.root,
          },
          { name: 'List' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.campaign.create}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            New Campaign
          </Button>
        }
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <CampaignSearch
        query={search.query}
        results={search.results}
        onSearch={handleSearch}
        // hrefItem={(id) => paths.dashboard.tour.details(id)}
      />

      <TourList tours={_tours} />
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
