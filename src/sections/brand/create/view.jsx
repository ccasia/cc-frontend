import { useState, useCallback } from 'react';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Container from '@mui/material/Container';
import { SnackbarProvider } from 'notistack'
import useGetCompany from 'src/hooks/use-get-company';

import {
  Stack,
  Box,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { _roles, USER_STATUS_OPTIONS } from 'src/_mock';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import CompanyBrandForm from './brandForms/companyBrandForm';

const TABS = [
  { label: 'Company & Brand', value: 'basic' , form: <CompanyBrandForm /> },
  { label: 'Sup Brand', value: 'advanced'  , form: <h1>supBrand</h1>},
  { label: 'Sup Sup Brand', value: 'supsupbrand'  , form: <h1>supSupBrand</h1>},
];

function CreateBrand() {
  useGetCompany();
  const settings = useSettingsContext();
  const [currentTab, setCurrentTab] = useState('basic');

  const [scrollableTab, setScrollableTab] = useState('basic');

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const handleChangeScrollableTab = useCallback((event, newValue) => {
    setScrollableTab(newValue);
  }, []);

  return (
    <>
      <Container maxWidth='lg'   sx={{  justifyContent:'center'}}>
        <CustomBreadcrumbs
          heading="Create Company & Brand"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Brand', href: paths.dashboard.brand.discover },
            { name: 'Create' },
          ]}
        />

        <Box sx={{ my: 2, p: 3, boxShadow: (theme) => theme.customShadows.z24 ,borderRadius:'10px'}}>
          <Stack spacing={2} sx={{ width: 1 }}>
            <Tabs value={currentTab} onChange={handleChangeTab}>
              {TABS.slice(0, 3).map((tab) => (
                <Tab key={tab.value} value={tab.value} label={tab.label} />
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
      <SnackbarProvider />
    </>
  );
}

export default CreateBrand;
