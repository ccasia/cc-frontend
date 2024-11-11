/* eslint-disable no-unused-vars */
import { useState, useCallback } from 'react';

import { Box, Button } from '@mui/material';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import useGetCompany from 'src/hooks/use-get-company';

import withPermission from 'src/auth/guard/withPermissions';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content/empty-content';

import BrandLists from './brand-lists';

const defaultFilters = {
  roles: [],
  locations: [],
  benefits: [],
  experience: 'all',
  employmentTypes: [],
};

function DiscoverBrand() {
  const settings = useSettingsContext();
  const router = useRouter();

  const { data: companies, isLoading } = useGetCompany();

  const [search, setSearch] = useState('');

  const handleSearch = useCallback((event) => {
    setSearch(event.target.value);
  }, []);

  const filteredData =
    !isLoading &&
    companies.filter((company) => company.name.toLowerCase().indexOf(search.toLowerCase()) !== -1);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Client List"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          {
            name: 'Brand',
            href: paths.dashboard.root,
          },
          { name: 'List' },
        ]}
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<Iconify icon="ion:create" />}
            onClick={() => router.push(paths.dashboard.company.create)}
          >
            Create New Client
          </Button>
        }
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />
      {/* <Box mb={3}>
        <TextField
          placeholder="Search"
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="material-symbols:search" />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: 250,
          }}
        >
          Search
        </TextField>
      </Box> */}
      {!isLoading && (
        <>
          {companies.length < 1 ? (
            <Box mt={2}>
              <EmptyContent
                filled
                title="No Data"
                sx={{
                  py: 10,
                }}
              />
            </Box>
          ) : (
            // <Stack
            //   spacing={2.5}
            //   sx={{
            //     mb: { xs: 3, md: 5 },
            //   }}
            // >
            //   <BrandList companies={filteredData} />
            // </Stack>
            <BrandLists dataFiltered={filteredData} />
          )}
        </>
      )}
    </Container>
  );
}

// export default DiscoverBrand;
export default withPermission(['list:client'], DiscoverBrand);
