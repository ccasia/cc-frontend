/* eslint-disable no-unused-vars */

import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import { Box, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import useGetCompany from 'src/hooks/use-get-company';

import withPermission from 'src/auth/guard/withPermissions';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content/empty-content';

import BrandLists from '../brand-lists';

function DiscoverBrand() {
  const settings = useSettingsContext();
  const router = useRouter();
  const theme = useTheme();

  const { data: companies, isLoading } = useGetCompany();

  if (isLoading) {
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
          sx={{
            mb: { xs: 3, md: 5 },
          }}
        />
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
      </Container>
    );
  }

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
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      {companies && companies.length > 0 ? (
        <BrandLists dataFiltered={companies} />
      ) : (
        <Box mt={2}>
          <EmptyContent
            filled
            title="No Clients Found"
            description="No client data is available at the moment."
            sx={{
              py: 10,
            }}
          />
        </Box>
      )}
    </Container>
  );
}

export default withPermission(['list:client'], DiscoverBrand);
