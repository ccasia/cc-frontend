/* eslint-disable no-unused-vars */
import { useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { Box, Stack, Button } from '@mui/material';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import withPermission from 'src/auth/guard/withPermissions';

import Iconify from 'src/components/iconify';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import CompanyBrandForm from './brandForms/companyBrandForm';
import CreateCompany from './brandForms/FirstForms/create-company';

const TABS = [
  { label: 'Create Company', value: 'client', form: <CreateCompany isDialog={false} /> },
  { label: 'Create Brand', value: 'brand', form: <CompanyBrandForm /> },
  // { label: 'Sup Sup Brand', value: 'subSubClient', form: <h1>supSupBrand</h1>, disabled: true },
];

function CreateBrand() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('client');

  const [scrollableTab, setScrollableTab] = useState('client');

  const handleChangeTab = useCallback((event, newValue) => {
    // if (TABS.find((tab) => tab.value !== newValue).disabled) {
    setCurrentTab(newValue);
    // }
  }, []);

  const handleChangeScrollableTab = useCallback((event, newValue) => {
    setScrollableTab(newValue);
  }, []);

  return (
    <Container maxWidth="lg">
      <Button
        startIcon={<Iconify icon="ion:chevron-back" />}
        onClick={() => router.push(paths.dashboard.company.discover)}
        variant="outlined"
      >
        Back
      </Button>

      <CustomBreadcrumbs
        sx={{ mt: 3 }}
        heading="Create Company & Brand"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Brand', href: paths.dashboard.company.discover },
          { name: 'Create' },
        ]}
      />

      <Box
        sx={{
          my: 2,
          p: {
            md: 3,
          },
          borderRadius: '10px',
        }}
      >
        <Stack spacing={2} sx={{ width: 1 }}>
          <Tabs value={currentTab} onChange={handleChangeTab}>
            {TABS.slice(0, 3).map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                sx={{ cursor: tab.disabled && 'not-allowed' }}
              />
            ))}
          </Tabs>

          {TABS.slice(0, 3).map(
            (tab) =>
              tab.value === currentTab && (
                <Box
                  key={tab.value}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                  }}
                >
                  {tab.form}
                </Box>
              )
          )}
        </Stack>
      </Box>
    </Container>
  );
}

export default withPermission(['create:client', 'view:client'], CreateBrand);
