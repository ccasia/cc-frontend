/* eslint-disable no-unused-vars */
import { useState } from 'react';

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

  const filteredData = (!isLoading && companies) 
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
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:email-fill" width={18} />}
            onClick={() => setInviteDialogOpen(true)}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            Invite Client
          </Button>
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
