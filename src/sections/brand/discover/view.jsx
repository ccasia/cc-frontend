/* eslint-disable no-unused-vars */
import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import { Box, Button, TextField, InputAdornment } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import useGetCompany from 'src/hooks/use-get-company';

import withPermission from 'src/auth/guard/withPermissions';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content/empty-content';

import BrandList from './brandList';

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

  const { companies } = useGetCompany();

  const [sortBy, setSortBy] = useState('latest');

  const [search, setSearch] = useState('');

  const handleSearch = useCallback((event) => {
    setSearch(event.target.value);
  }, []);

  const filteredData =
    companies &&
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
            Create new brand
          </Button>
        }
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />{' '}
      <Stack mb={3}>
        <TextField
          placeholder="Search..."
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="material-symbols:search" />
              </InputAdornment>
            ),
          }}
        >
          Search
        </TextField>
      </Stack>
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
        <Stack
          spacing={2.5}
          sx={{
            mb: { xs: 3, md: 5 },
          }}
        >
          <BrandList companies={filteredData} />
        </Stack>
      )}
    </Container>
  );
}

// export default DiscoverBrand;
export default withPermission(['list:client'], DiscoverBrand);
