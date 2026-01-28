/* eslint-disable no-unused-vars */
import { useState } from 'react';

import Container from '@mui/material/Container';
import { Box, Stack, Button } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import useGetCompany from 'src/hooks/use-get-company';

import withPermission from 'src/auth/guard/withPermissions';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content/empty-content';

import BrandLists from '../brand-lists';
import InviteClientDialog from './invite-client-dialog';

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

  const { data: companies, isLoading, mutate: refreshCompanies } = useGetCompany();

  const [search, setSearch] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const filteredData =
    !isLoading && companies
      ? companies.filter((company) => company.name.toLowerCase().includes(search.toLowerCase()))
      : [];

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
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" width={18} />}
              onClick={() => router.push(paths.dashboard.company.create)}
              sx={{
                bgcolor: '#1340FF',
                border: '1px solid #1a32c4',
                borderBottom: '3px solid #102387',
                borderRadius: '8px',
                fontWeight: 600,
                px: 2,
                py: 0.75,
                '&:hover': {
                  bgcolor: '#1a32c4',
                },
              }}
            >
              Create Client
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:email-fill" width={18} />}
              onClick={() => setInviteDialogOpen(true)}
              sx={{
                bgcolor: '#1340FF',
                border: '1px solid #1a32c4',
                borderBottom: '3px solid #102387',
                borderRadius: '8px',
                fontWeight: 600,
                px: 2,
                py: 0.75,
                '&:hover': {
                  bgcolor: '#1a32c4',
                },
              }}
            >
              Invite Client
            </Button>
          </Stack>
        }
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      {!isLoading && (
        <>
          {!companies || companies.length < 1 ? (
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
            <BrandLists dataFiltered={filteredData} />
          )}
        </>
      )}

      <InviteClientDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onSuccess={() => {
          // Refresh the company list
          refreshCompanies();
        }}
      />
    </Container>
  );
}

// export default DiscoverBrand;
export default withPermission(['list:client'], DiscoverBrand);
